import type { IAutoMovieHumanHeadSkin } from "../../../common/measure/IAutoMovieHumanHeadSkin";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The build's final skin as the shared head instruments read it
 * (`IAutoMovieHumanHeadSkin`), or the gap naming the first point or area the
 * caller needs that the basis does not declare.
 *
 * The skin is the surface the basis's named skin points address (they all
 * name one surface). `landmarks` and
 * `regions` are the names the caller's instrument reads; one the basis does
 * not declare returns "missing landmark: <name>" or "missing region: <name>"
 * before anything is read.
 *
 * @evidence contracts/common.md#principled-implementation The face hands the shared head instruments the same record the person reads, so a head measurement has one owner.
 * @evidence contracts/common.md#clear-and-simple-design One name check and one surface read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing point or area returns its gap; nothing is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the surface choice and both gaps.
 * @evidence contracts/modeling.md#spatial-conventions Positions are the final posed metres of the basis head frame, Float32-rounded.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 * @author Samchon
 */
export function readHumanFaceHeadSkin(
  context: IHumanFaceMeasurementContext,
  landmarks: readonly string[],
  regions: readonly string[],
): IAutoMovieHumanHeadSkin | IHumanFaceMeasurementGap {
  const basis = context.basis;
  const points = basis.skinLandmarks ?? {};
  const areas = basis.skinRegions ?? {};
  for (const name of landmarks) if (!Object.hasOwn(points, name)) return { reason: `missing landmark: ${name}` };
  for (const name of regions) if (!Object.hasOwn(areas, name)) return { reason: `missing region: ${name}` };
  const named = Object.values(points)[0];
  if (named === undefined) return { reason: "missing landmark: any skin landmark naming the skin surface" };
  const surface = basis.surfaces[named.surface];
  const skin = context.surface(surface.id);
  return {
    id: basis.id,
    surface: named.surface,
    positions: [...skin.positions],
    indices: [...skin.indices],
    skinLandmarks: basis.skinLandmarks,
    skinRegions: basis.skinRegions,
  };
}
