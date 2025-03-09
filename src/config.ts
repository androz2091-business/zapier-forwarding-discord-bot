import { Config, Effect, Layer } from 'effect';

const make = Effect.gen(function* () {
  const port = yield* Config.number('DISCORD_TOKEN');
  const zapierWebhookUrl = yield* Config.string('WEBHOOK_URL');

  return {
    port,
    zapierWebhookUrl
  } as const;
});

export class ConfigService extends Effect.Tag('ConfigService')<
  ConfigService,
  Effect.Effect.Success<typeof make>
>() {
  static layer = Layer.effect(ConfigService, make);

  static Live = this.layer;
}
