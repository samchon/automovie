import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceMidlinePair } from "../structures/IAutoMovieHumanFaceMidlinePair";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceApertureFrame } from "./IHumanFaceApertureFrame";
import type { IHumanFaceAperturePair } from "./IHumanFaceAperturePair";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";
import { resolveHumanFaceApertureDirections } from "./resolveHumanFaceApertureDirections";
import type { IHumanFaceApertureDirections as IHumanFaceApertureDirectionsImported } from "./IHumanFaceApertureDirections";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../index";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";


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
 * @evidence contracts/common.md#principled-implementation The admitted contact's resident lip/incisor pairs are individually posed through their declared attachments and measured along the canonical mandibular opening direction. Matching rest arrays and motions come from the native caller; projected pair separation is a model convention, not full margin contact or a clinical acquisition frame.
 * @evidence contracts/common.md#clear-and-simple-design One shared pair operation produces both posed points and their scalar gap, while direction resolution and vertex skinning retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four actual registered vertices are read instead of a whole-surface bounding extent; missing owners are not borrowed from another basis. Axis normalization is a local measurement convention, and an open projected pair does not prove tongue passage or a complete lip seal.
 * @evidence contracts/common.md#meaningful-documentation Prose gives basis metre frame, normalized up/forward convention, signed pairs, clinical-frame limitation and its pre-whole-surface-posing timing.
 * @evidence contracts/performance.md#efficient-algorithms Only four points are posed, but each pair finds its source in S surfaces and each point reads attachment ownership rows through poseHumanFaceVertex. Cost follows those sparse row scans rather than claiming O(1) independent of source attachment size.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved direction frame serves both pairs and existing native motions are reused; no entire mesh is posed merely for this measurement. A changed rest or motion requires fresh points, with no aperture cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Small point slices and vectors are per-call and the completed frame/pairs transfer to the closure caller. No rest buffer, motion history, external task or viewer is retained.
 *
 * @author Samchon
 */
export function measureHumanFaceAperture(
  basis: IAutoMovieHumanFaceBasis,
  contact: IAutoMovieHumanFaceBasisContact,
  rest: readonly (readonly number[])[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): IHumanFaceApertureFrame {
  const { up, forward }: IHumanFaceApertureDirectionsImported = resolveHumanFaceApertureDirections(
    basis.articulation!.jaw.axis,
  );
  const pair: (entry: IAutoMovieHumanFaceMidlinePair) => IHumanFaceAperturePair = (
    entry: IAutoMovieHumanFaceMidlinePair,
  ): IHumanFaceAperturePair => {
    const index: number = basis.surfaces.findIndex(
      (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean  => surface.id === entry.surface,
    );
    const surface: IAutoMovieHumanFaceBasisSurfaceImported = basis.surfaces[index];
    const at: (vertex: number) => IAutoMovieVector3Imported = (vertex: number): IAutoMovieVector3Imported  =>
      poseHumanFaceVertex(
        surface,
        vertex,
        rest[index].slice(3 * vertex, 3 * vertex + 3),
        motions,
      );
    const upper: IAutoMovieVector3Imported = at(entry.upper);
    const lower: IAutoMovieVector3Imported = at(entry.lower);
    return { upper, lower, gap: measureHumanFaceApertureGap(upper, lower, up) };
  };
  return {
    up,
    forward,
    lips: pair(contact.lips),
    incisors: pair(contact.incisors),
  };
}
