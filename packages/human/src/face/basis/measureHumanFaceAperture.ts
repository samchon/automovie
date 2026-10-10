import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceMidlinePair } from "../structures/IAutoMovieHumanFaceMidlinePair";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceApertureFrame } from "./IHumanFaceApertureFrame";
import type { IHumanFaceAperturePair } from "./IHumanFaceAperturePair";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";
import { resolveHumanFaceApertureDirections } from "./resolveHumanFaceApertureDirections";

/**
 * Measure the oral apertures of one state the way the closure and passage
 * rules read them: along the opening direction, between the vermilion seam
 * and incisal edge vertex pairs, after the pairs alone have been posed from
 * the given rest layer's surface positions by the given motions.
 *
 * Up is the normalized component of basis Y-up perpendicular to the locally
 * canonical unit mandibular direction; forward is that direction crossed with up. This is a model
 * measurement convention. An axis with a Y component changes up from the
 * original basis vertical. An incisor's displacement can include both jaw
 * rotation and coupled translation and does not define this fixed frame.
 * Clinical comparisons require their own registered measurement frame and
 * acquisition protocol. Both apertures are signed projections of upper minus
 * lower onto up, so a sealed pair reads zero and an open one its separation.
 * The closure gain is measured separately by `measureHumanFaceClosureRatio`.
 *
 * Only four vertices are posed here, so the measure is cheap enough to run
 * before the surfaces are posed, which is when the closure rows need it.
 *
 * @author Samchon
 */
export function measureHumanFaceAperture(
  basis: IAutoMovieHumanFaceBasis,
  contact: IAutoMovieHumanFaceBasisContact,
  rest: readonly (readonly number[])[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): IHumanFaceApertureFrame {
  const { up, forward } = resolveHumanFaceApertureDirections(
    basis.articulation!.jaw.axis,
  );
  const pair = (
    entry: IAutoMovieHumanFaceMidlinePair,
  ): IHumanFaceAperturePair => {
    const index = basis.surfaces.findIndex(
      (surface) => surface.id === entry.surface,
    );
    const surface = basis.surfaces[index];
    const at = (vertex: number) =>
      poseHumanFaceVertex(
        surface,
        vertex,
        rest[index].slice(3 * vertex, 3 * vertex + 3),
        motions,
      );
    const upper = at(entry.upper);
    const lower = at(entry.lower);
    return { upper, lower, gap: measureHumanFaceApertureGap(upper, lower, up) };
  };
  return {
    up,
    forward,
    lips: pair(contact.lips),
    incisors: pair(contact.incisors),
  };
}
