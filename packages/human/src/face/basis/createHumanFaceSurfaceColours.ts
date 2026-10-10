import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import type { IPortraitColourField } from "../anatomy/skin/structures/IPortraitColourField";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";

/**
 * Compose resident pigmentation and fibre gains on one skin surface.
 * Legacy envelopes sample their immutable source positions; named-area and
 * fibre owners already supply gains on those exact resident vertices. The
 * product keeps all three independent contributions and the existing albedo
 * gate downstream. Geometry, caller fields and supplied gain buffers are
 * unchanged. Omission of every contribution retains absent vertex colours.
 */
export function createHumanFaceSurfaceColours(
  surface: IAutoMovieHumanFaceBasisSurface,
  fields: readonly IPortraitColourField[] | undefined,
  fibres: readonly number[] | undefined,
  regions: readonly number[] | undefined,
): number[] | undefined {
  let colours: number[] | undefined;
  if (fields !== undefined) {
    const sample = createPortraitColourField(fields);
    colours = [];
    for (let at = 0; at < surface.positions.length; at += 3)
      colours.push(...sample(surface.positions.slice(at, at + 3)));
  }
  for (const gains of [regions, fibres]) {
    if (gains === undefined) continue;
    if (gains.length !== surface.positions.length)
      throw new Error(
        "Skin gains need the complete matching resident population.",
      );
    colours =
      colours === undefined
        ? [...gains]
        : colours.map((value, at) => value * gains[at]);
  }
  return colours;
}
