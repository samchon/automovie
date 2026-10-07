import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IPortraitColourField } from "../anatomy/skin/structures/IPortraitColourField";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";

/**
 * Compose resident pigmentation and fibre gains on one skin surface.
 * Legacy envelopes sample their immutable source positions; named-area and
 * fibre owners already supply gains on those exact resident vertices. The
 * product keeps all three independent contributions and the existing albedo
 * gate downstream. Geometry, caller fields and supplied gain buffers are
 * unchanged. Omission of every contribution retains absent vertex colours.
 *
 * @evidence contracts/common.md#principled-implementation Independent linear-RGB multipliers compose by their product on the same resident vertex population.
 * @evidence contracts/common.md#clear-and-simple-design One colour composition owner replaces duplicated surface-stage arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population, colour or source point is changed to make albedo admission pass.
 * @evidence contracts/common.md#meaningful-documentation States reference sampling, ownership, product and omission.
 * @evidence contracts/modeling.md#spatial-conventions Source head-frame metres and dimensionless linear RGB gains.
 * @evidence contracts/modeling.md#shared-boundaries All contributions address the same source vertex identities before material-region gathers.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Changes appearance of an existing surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Input owners retain trait meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The skin builder observes the composed output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no biological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing appearance admission bounds reflectance.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping control.
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
      throw new Error("Skin gains need the complete matching resident population.");
    colours = colours === undefined ? [...gains] : colours.map((value, at) => value * gains[at]);
  }
  return colours;
}
