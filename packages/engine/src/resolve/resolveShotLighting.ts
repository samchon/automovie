import type { IAutoMovieLightChannelProperty } from "./IAutoMovieLightChannelProperty";
import type { IAutoMovieLightPointer } from "./IAutoMovieLightPointer";
import { IAutoMovieLight } from "@automovie/interface";

import { withArticle } from "../text/withArticle";
import { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";
import { IAutoMovieShotLightingInput } from "./IAutoMovieShotLightingInput";
import { applyLightOverride } from "./applyLightOverride";
import { LIGHT_CHANNEL_PROPERTIES } from "./constants/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "./parseLightPointer";
import { sampleClip } from "./sampleClip";

/**
 * Sample admitted shot light clips and apply their canonical light-pointer channels to staged lights. Output preserves staging order and untouched light identity; touched light wrappers borrow unanimated fields. Missing/unsupported targets throw and shot admission forbids repeated properties across the clip list.
 *
 * @evidence contracts/common.md#principled-implementation Sample admitted light clips, parse stable pointers, require existing capable targets and accumulate overrides before kind-specific reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design The canonical property table owns axis writers and applyLightOverride owns light shape; this pass joins numerical samples to staged ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot admission forbids repeated properties across clips; unadmitted direct duplicates use producer overwrite. Unsupported targets throw and untouched lights retain identity.
 * @evidence contracts/common.md#meaningful-documentation Docs state staged order, untouched reference reuse, admitted pointers and sampleClip's before/after-key clamping.
 * @evidence contracts/performance.md#efficient-algorithms L lights build a lookup/output array, all key payloads are sampled/validated, and touched lights receive fixed-size overrides.
 * @evidence contracts/performance.md#reuse-equivalent-work One light index/override map serves all tracks, sharing unanimated staged fields without a persistent time cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns new light wrappers/array and borrows unchanged records; local maps release on failure/return without native light handles or tasks.
 */
export const resolveShotLighting: (input: IAutoMovieShotLightingInput) => IAutoMovieLight[] = (
  input: IAutoMovieShotLightingInput,
): IAutoMovieLight[] => {
  const staged: Map<string, IAutoMovieLight> = new Map(input.lights.map((light: IAutoMovieLight) : [string, IAutoMovieLight] => [light.id, light]));
  const overrides: Map<string, IAutoMovieLightOverride> = new Map<string, IAutoMovieLightOverride>();

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
      const property: IAutoMovieLightChannelProperty = LIGHT_CHANNEL_PROPERTIES[target.property];
      if (!property.carries(light.type))
        throw new Error(
          `light clip "${clip.id}" addresses "${target.property}", which ${withArticle(light.type)} light does not carry`,
        );
      const carried: IAutoMovieLightOverride | undefined = overrides.get(target.light);
      const override: IAutoMovieLightOverride = carried ?? {};
      if (carried === undefined) overrides.set(target.light, override);
      property.write(override, value);
    }

  return input.lights.map((light: IAutoMovieLight) : IAutoMovieLight => {
    const override: IAutoMovieLightOverride | undefined = overrides.get(light.id);
    return override === undefined ? light : applyLightOverride(light, override);
  });
};
