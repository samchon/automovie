import { Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceMidlinePair } from "../structures/IAutoMovieHumanFaceMidlinePair";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceApertureFrame } from "./IHumanFaceApertureFrame";
import type { IHumanFaceAperturePair } from "./IHumanFaceAperturePair";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";
import { resolveHumanFaceApertureUp } from "./resolveHumanFaceApertureUp";

/**
 * Measure the oral apertures of one state the way the closure and passage
 * rules read them: along the opening direction, between the vermilion seam
 * and incisal edge vertex pairs, after the pairs alone have been posed from
 * the given rest layer's surface positions by the given motions.
 *
 * Up is the normalized component of basis Y-up perpendicular to the declared
 * mandibular axis; forward is that axis crossed with up. This is a model
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
 * @evidence contracts/common.md#principled-implementation Both apertures project upper minus lower onto normalized basis Y-up with its mandibular-axis component removed. This frame follows the declared basis axis, and posed translations contribute their components along it. The model convention establishes no universal clinical vertical or incisor-chord direction.
 * @evidence contracts/common.md#clear-and-simple-design Only four vertices are posed, so the measure runs before the surfaces are posed; it delegates the direction to resolveHumanFaceApertureUp and posing to poseHumanFaceVertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject-specific constant; a degenerate axis refuses.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the layer it reads, the sign and why the measure is cheap enough to run first.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres; up and forward are unit vectors of the basis frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping measureHumanFaceAperture is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels measureHumanFaceAperture moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry measureHumanFaceAperture emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries measureHumanFaceAperture constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation measureHumanFaceAperture owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The frame is a model convention, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The measure bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The measure is not an input.
 * @author Samchon
 */
export function measureHumanFaceAperture(
  basis: IAutoMovieHumanFaceBasis,
  contact: IAutoMovieHumanFaceBasisContact,
  rest: readonly (readonly number[])[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): IHumanFaceApertureFrame {
  const up = resolveHumanFaceApertureUp(basis.articulation!.jaw.axis);
  const forward = Vector3.cross(Vector3.create(...basis.articulation!.jaw.axis), up);
  const pair = (entry: IAutoMovieHumanFaceMidlinePair): IHumanFaceAperturePair => {
    const index = basis.surfaces.findIndex((surface) => surface.id === entry.surface);
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
  return { up, forward, lips: pair(contact.lips), incisors: pair(contact.incisors) };
}
