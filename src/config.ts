import { Config, Effect, Layer } from 'effect';

const make = Effect.gen(function* () {
  const discordToken = yield* Config.string('DISCORD_TOKEN');
  const zapierWebhookUrl = yield* Config.string('WEBHOOK_URL');
  const channelIds = yield* Config.string('CHANNEL_IDS').pipe(
    Config.withDefault(''),
    Config.map((ids) => ids.split(','))
  );

  return {
    discordToken,
    zapierWebhookUrl,
    channelIds
  } as const;
});

export class ConfigService extends Effect.Tag('ConfigService')<
  ConfigService,
  Effect.Effect.Success<typeof make>
>() {
  static layer = Layer.effect(ConfigService, make);

  static Live = this.layer;
}
