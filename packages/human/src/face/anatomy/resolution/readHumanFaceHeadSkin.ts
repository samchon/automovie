import type { IAutoMovieHumanFaceBasis as ImportedIAutoMovieHumanFaceBasis, IAutoMovieHumanSkinLandmark as ImportedIAutoMovieHumanSkinLandmark, IAutoMovieHumanSkinRegion as ImportedIAutoMovieHumanSkinRegion, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface, IHumanFaceMeasurementSurface as ImportedIHumanFaceMeasurementSurface } from "@automovie/human";
import type { IAutoMovieHumanHeadSkin } from "../../../common/measure/IAutoMovieHumanHeadSkin";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Expose final source skin to shared head instruments after checking requested landmark/region names. The first declared skin landmark selects the surface; all required head registrations addressing that surface remain a caller/basis premise. Missing names or an empty landmark table return named gaps. Positions and indices are copied from the current context, while original named registration records remain borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Required named point/area registrations qualify one final source skin for shared head instruments.
 * @evidence contracts/common.md#clear-and-simple-design The surface is selected from the first registered skin landmark and caller rule names are checked before acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This adapter assumes all required head registrations address that skin; no missing landmark/region or empty landmark table is filled from rest data.
 * @evidence contracts/common.md#meaningful-documentation Positions are current head metres, with copied coordinates/incidence and borrowed named registration records.
 * @evidence contracts/performance.md#efficient-algorithms Named checks and full surface copying are linear in requested names and source buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical measurement context supplies current source geometry instead of a private posed-skin reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned positions/indices are owned copies while basis landmark/region records stay borrowed for the instrument call.
 *
 * @author Samchon
 */
export function readHumanFaceHeadSkin(
  context: IHumanFaceMeasurementContext,
  landmarks: readonly string[],
  regions: readonly string[],
): IAutoMovieHumanHeadSkin | IHumanFaceMeasurementGap {
  const basis: ImportedIAutoMovieHumanFaceBasis = context.basis;
  const points: { [x: string]: ImportedIAutoMovieHumanSkinLandmark; } = basis.skinLandmarks ?? {};
  const areas: { [x: string]: ImportedIAutoMovieHumanSkinRegion; } = basis.skinRegions ?? {};
  for (const name of landmarks)
    if (!Object.hasOwn(points, name))
      return { reason: `missing landmark: ${name}` };
  for (const name of regions)
    if (!Object.hasOwn(areas, name))
      return { reason: `missing region: ${name}` };
  const named: ImportedIAutoMovieHumanSkinLandmark = Object.values(points)[0];
  if (named === undefined)
    return {
      reason: "missing landmark: any skin landmark naming the skin surface",
    };
  const surface: ImportedIAutoMovieHumanFaceBasisSurface = basis.surfaces[named.surface];
  const skin: ImportedIHumanFaceMeasurementSurface = context.surface(surface.id);
  return {
    id: basis.id,
    surface: named.surface,
    positions: [...skin.positions],
    indices: [...skin.indices],
    skinLandmarks: basis.skinLandmarks,
    skinRegions: basis.skinRegions,
  };
}
