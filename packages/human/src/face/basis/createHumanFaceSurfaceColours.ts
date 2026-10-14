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
 *
 * @evidence contracts/common.md#principled-implementation Legacy fields sample immutable neutral source positions, while regional/fibre gains address the same admitted resident RGB population. Multiplication composes these independent optical contributions without changing positions or normals; complete gain lengths are checked and producers own finite colour admission.
 * @evidence contracts/common.md#clear-and-simple-design One colour owner handles optional field sampling and the two gain populations before resident gather; normalized material lifting remains downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing contributions remain absent, not a mean complexion; wrong resident gain lengths refuse rather than resample another topology. These authored optical gains establish no measured skin reflectance or clinical condition.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes neutral sampling from resident gain correspondence, multiplication, immutable caller buffers and absence of all contributions.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and F legacy fields, sampling costs O(VF); each present resident gain array costs O(V) validation/composition. Fresh RGB copies are required for the current model's owned colours.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled field sampler serves all source vertices in the call, and already computed resident gains are consumed without repeating their region/fibre generation. No colour cache spans changed optical profiles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the completed RGB array transfers to the gather stage; per-vertex slices and intermediate products are local and caller gains remain unchanged. No palette history, image handle or external task is retained.
 */
export function createHumanFaceSurfaceColours(
  surface: IAutoMovieHumanFaceBasisSurface,
  fields: readonly IPortraitColourField[] | undefined,
  fibres: readonly number[] | undefined,
  regions: readonly number[] | undefined,
): number[] | undefined {
  let colours: number[] | undefined;
  if (fields !== undefined) {
    const sample: (point: readonly number[]) => number[] = createPortraitColourField(fields);
    colours = [];
    for (let at: number = 0; at < surface.positions.length; at += 3)
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
        : colours.map((value: number, at: number): number  => value * gains[at]);
  }
  return colours;
}
