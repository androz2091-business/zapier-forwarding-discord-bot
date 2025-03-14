import { Config, Effect, Layer } from 'effect';

const make = Effect.gen(function* () {
  const discordToken = yield* Config.string('DISCORD_TOKEN');
  const zapierWebhookUrl = yield* Config.string('WEBHOOK_URL');
  const channelIds = yield* Config.string('CHANNEL_IDS').pipe(
    Config.withDefault(''),
    Config.map((ids) => ids.split(','))
  );
  // these are the ids of the users who can react with :fire: to messages
  // and it will trigger a forward to the journal server
  const adminIds = yield* Config.string('ADMIN_IDS').pipe(
    Config.withDefault(''),
    Config.map((ids) => ids.split(','))
  );
  const journalServerDiscordWebhookUrl = yield* Config.string(
    'JOURNAL_SERVER_DISCORD_WEBHOOK_URL'
  );

  return {
    discordToken,
    zapierWebhookUrl,
    channelIds,
    adminIds,
    journalServerDiscordWebhookUrl
  } as const;
});

export class ConfigService extends Effect.Tag('ConfigService')<
  ConfigService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(this, make);
}
