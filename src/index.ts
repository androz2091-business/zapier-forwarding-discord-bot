import { Client, Events, GatewayIntentBits, Partials, WebhookClient } from 'discord.js';
import type { Message, PartialMessage } from 'discord.js';
import { Effect, Layer, ManagedRuntime, pipe } from 'effect';
import { ConfigService } from './config.ts';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Reaction],
});

const sendZapierWebhook = (content: string) => Effect.gen(function*() { 
    const config = yield* ConfigService
    fetch(config.zapierWebhookUrl, {
        method: 'POST',
        body: JSON.stringify({ content }),
    })
});

const sendDiscordWebhook = (message: Message|PartialMessage) => Effect.gen(function*() {
    const messageData = yield* Effect.promise(() => message.fetch());
    const config = yield* ConfigService
    const webhookClient = new WebhookClient({ url: config.journalServerDiscordWebhookUrl });
    webhookClient.send({
        content: messageData.content,
        username: messageData.author.username,
        avatarURL: messageData.author.displayAvatarURL(),
        files: messageData.attachments.map((attachment) => attachment.url)
    });
});

const login = Effect.gen(function*() {
    const config = yield* ConfigService
    client.login(config.discordToken);
});

const managedRuntime = ManagedRuntime.make(Layer.mergeAll(ConfigService.Live))

client.on(Events.MessageCreate, (message) => managedRuntime.runPromise(
    Effect.gen(function* () {
        const {channelIds} = yield* ConfigService
        yield* Effect.log("new message")
        if (channelIds.includes(message.channelId)) {
            yield* Effect.log(`Sending message to Zapier webhook`);
            yield* sendZapierWebhook(message.content);
        }
    })
));

client.on(Events.MessageReactionAdd, (reaction, user) => managedRuntime.runPromise(
    Effect.gen(function* () {
        const {adminIds} = yield* ConfigService
        yield* Effect.log("new reaction")
        if (adminIds.includes(user.id) && reaction.emoji.name === '⏩') {
            yield* Effect.log(`Sending message to Zapier webhook`);
            yield* sendDiscordWebhook(reaction.message);
        }
    })
));

const onReady = Effect.gen(function*() {
    yield* Effect.log('Bot is ready');
});

client.on(Events.ClientReady, () => Effect.runSync(onReady));

Effect.runPromise(pipe(login, Effect.provide(ConfigService.Live)));
