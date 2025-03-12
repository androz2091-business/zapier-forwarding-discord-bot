import { Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { Effect, Layer, ManagedRuntime, pipe } from 'effect';
import { ConfigService } from './config.ts';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const sendZapierWebhook = (content: string) => Effect.gen(function*() { 
    const config = yield* ConfigService
    fetch(config.zapierWebhookUrl, {
        method: 'POST',
        body: JSON.stringify({ content }),
    })
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

const onReady = Effect.gen(function*() {
    yield* Effect.log('Bot is ready');
});

client.on(Events.ClientReady, () => Effect.runSync(onReady));

Effect.runPromise(pipe(login, Effect.provide(ConfigService.Live)));
