import {
  IAutoMovieLight,
  type IAutoMovieLightChannelProperty,
  type IAutoMovieLightOverride,
  type IAutoMovieLightPointer,
  type IAutoMovieShotLightingInput,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { applyLightOverride } from "../applyLightOverride";
import { LIGHT_CHANNEL_PROPERTIES } from "../constants/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../parseLightPointer";
import { sampleClip } from "./sampleClip";

/**
 * Sample admitted shot light clips and apply their canonical light-pointer
 * channels to staged lights. Output preserves staging order and untouched light
 * identity; touched light wrappers borrow unanimated fields.
 * Missing/unsupported targets throw and shot admission forbids repeated
 * properties across the clip list.
 */
export function resolveShotLighting(
  input: IAutoMovieShotLightingInput,
): IAutoMovieLight[] {
  const staged: Map<string, IAutoMovieLight> = new Map(
    input.lights.map((light: IAutoMovieLight): [string, IAutoMovieLight] => [
      light.id,
      light,
    ]),
  );
  const overrides: Map<string, IAutoMovieLightOverride> = new Map<
    string,
    IAutoMovieLightOverride
  >();

  for (const clip of input.clips)
    for (const { channel, value } of sampleClip(clip, input.seconds).values()) {
      const target: IAutoMovieLightPointer | null =
        channel.kind === "pointer" ? parseLightPointer(channel.pointer) : null;
      if (target === null)
        throw new Error(
          `light clip "${clip.id}" track must address /lights/<id>/<property>`,
        );
      const light: IAutoMovieLight | undefined = staged.get(target.light);
      if (light === undefined)
        throw new Error(
          `light clip "${clip.id}" addresses missing light "${target.light}"`,
        );
      const property: IAutoMovieLightChannelProperty =
        LIGHT_CHANNEL_PROPERTIES[target.property];
      if (!property.carries(light.type))
        throw new Error(
          `light clip "${clip.id}" addresses "${target.property}", which ${AutoMovieEngineText.withArticle(light.type)} light does not carry`,
        );
      const carried: IAutoMovieLightOverride | undefined = overrides.get(
        target.light,
      );
      const override: IAutoMovieLightOverride = carried ?? {};
      if (carried === undefined) overrides.set(target.light, override);
      property.write(override, value);
    }

  return input.lights.map((light: IAutoMovieLight): IAutoMovieLight => {
    const override: IAutoMovieLightOverride | undefined = overrides.get(
      light.id,
    );
    return override === undefined ? light : applyLightOverride(light, override);
  });
}
