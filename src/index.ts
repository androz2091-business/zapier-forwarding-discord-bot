import { Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { Effect, pipe } from 'effect';
import { UnknownException } from 'effect/Cause';

dotenv.config();

const getConfig = Effect.sync(() => {
    const token = process.env.DISCORD_TOKEN;
    const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    if (!token || !webhookUrl) {
        throw new Error('No token or webhook URL provided');
    }
    return { token, webhookUrl };
});

const sendZapierWebhook = (content: string) => Effect.tryPromise(() => 
    fetch(Effect.runSync(getConfig).webhookUrl, {
        method: 'POST',
        body: JSON.stringify({ content }),
    })
);

const log = (message: string) => Effect.sync(() => console.log(message));

const makeDiscordClient = Effect.sync(() => new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
}));

const login = (client: Client) => Effect.tryPromise(() => client.login(Effect.runSync(getConfig).token));

const onMessage = (client: Client) => Effect.sync(() => {
    client.on(Events.MessageCreate, (message) => {
        log(`New message: ${message.content}`);
        if (message.channelId == '5') {
            Effect.runPromise(sendZapierWebhook(`New message: ${message.content}`));
        }
    });
});

const onReady = (client: Client) => Effect.sync(() => {
    client.on(Events.ClientReady, () => {
        Effect.runPromise(log('Bot is ready'));
    });
});

const startBot = pipe(
    makeDiscordClient,
    // we use tap and not pipe because login will not return anything (we want to keep the client)
    Effect.tap(client => login(client)),
    Effect.tap(client => onMessage(client)),
    Effect.tap(client => onReady(client))
);

Effect.runPromise(startBot);
