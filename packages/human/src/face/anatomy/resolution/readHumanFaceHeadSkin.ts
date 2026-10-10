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
  for (const name of landmarks)
    if (!Object.hasOwn(points, name))
      return { reason: `missing landmark: ${name}` };
  for (const name of regions)
    if (!Object.hasOwn(areas, name))
      return { reason: `missing region: ${name}` };
  const named = Object.values(points)[0];
  if (named === undefined)
    return {
      reason: "missing landmark: any skin landmark naming the skin surface",
    };
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
