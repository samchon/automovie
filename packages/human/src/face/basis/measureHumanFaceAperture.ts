import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Measure the oral apertures of one state the way the closure and passage
 * rules read them: along the opening direction, between the vermilion seam
 * and incisal edge vertex pairs, after the pairs alone have been posed by the
 * articulation the state resolves to.
 *
 * Up is the normalized component of basis Y-up perpendicular to the declared
 * mandibular axis; forward is that axis crossed with up. This is a model
 * measurement convention. An axis with a Y component changes up from the
 * original basis vertical. An incisor's displacement can include both jaw
 * rotation and coupled translation and does not define this fixed frame.
 * Clinical comparisons require their own registered measurement frame and
 * acquisition protocol. Both apertures are signed
 * projections of upper minus lower onto up, so a sealed pair reads near
 * zero and an open one its separation. The closure ratio
 * compares the current lip aperture to the reference aperture, each less the
 * rest aperture, and is clamped below at zero. The rest aperture is read on
 * this document's shape-only rest layer and the reference aperture on its
 * rest layer with the reference channel alone at weight one, residual rows
 * included, both posed by their own articulation; the caller evaluates the
 * two layers once and passes them in, and neither is the neutral.
 *
 * Only four vertices are posed here, so the measure is cheap enough to run
 * before the surfaces are posed, which is when the closure rows need it.
 *
 * @evidence contracts/common.md#principled-implementation Both apertures project upper minus lower onto normalized basis Y-up with its mandibular-axis component removed. This frame follows the declared basis axis, and posed translations contribute their components along it. The closure ratio is the current lip aperture less the shape-only rest aperture over the reference opening's aperture less the same rest aperture, clamped below at zero; a reference opening that does not part the lips refuses because the ratio would be undefined. The model convention establishes no universal clinical vertical or incisor-chord direction.
 * @evidence contracts/common.md#clear-and-simple-design Only four vertices are posed, so the measure runs before the surfaces are posed, which the closure rows need; it delegates skinning to poseHumanFaceSurface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject-specific constant; degenerate axes and reference openings refuse.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the layers it reads, the ratio, and why the measure is cheap enough to run first.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres; up and forward are unit vectors of the basis frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping measureHumanFaceAperture is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry measureHumanFaceAperture emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries measureHumanFaceAperture constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation measureHumanFaceAperture owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function measureHumanFaceAperture(
  basis: IAutoMovieHumanFaceBasis,
  contact: Contact,
  shaped: {
    surfaces: number[][];
    landmarks: Record<string, IAutoMovieVector3>;
  },
  referenced: {
    surfaces: number[][];
    landmarks: Record<string, IAutoMovieVector3>;
  },
  rest: { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> },
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): {
  up: IAutoMovieVector3;
  forward: IAutoMovieVector3;
  lips: { upper: IAutoMovieVector3; lower: IAutoMovieVector3; gap: number };
  incisors: {
    upper: IAutoMovieVector3;
    lower: IAutoMovieVector3;
    gap: number;
  };
  closureRatio: number;
} {
  const index = new Map(basis.surfaces.map((surface, at) => [surface.id, at]));
  const pose = (
    surfaceId: string,
    vertex: number,
    positions: readonly number[],
    motion: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
  ): IAutoMovieVector3 => {
    const surface = basis.surfaces[index.get(surfaceId)!];
    const rows = (surface.attachments ?? []).flatMap((attachment) => {
      for (let i = 0; i < attachment.rows.length; i += 2)
        if (attachment.rows[i] === vertex)
          return [
            { owner: attachment.owner, rows: [0, attachment.rows[i + 1]] },
          ];
      return [];
    });
    const local = positions.slice(3 * vertex, 3 * vertex + 3);
    const posed =
      rows.length === 0 ? local : poseHumanFaceSurface(local, rows, motion);
    return Vector3.create(posed[0], posed[1], posed[2]);
  };
  const at = (
    surfaceId: string,
    vertex: number,
    layer: {
      surfaces: number[][];
      landmarks: Record<string, IAutoMovieVector3>;
    },
    weights: ReadonlyMap<string, number>,
  ): IAutoMovieVector3 =>
    pose(
      surfaceId,
      vertex,
      layer.surfaces[index.get(surfaceId)!],
      resolveHumanFaceArticulation(
        basis.articulation!,
        weights,
        layer.landmarks,
      ).motions,
    );
  const reference = new Map([[contact.closure.reference, 1]]);
  const axis = Vector3.create(...basis.articulation!.jaw.axis);
  const vertical = Vector3.create(0, 1, 0);
  const raised = Vector3.subtract(
    vertical,
    Vector3.scale(axis, Vector3.dot(vertical, axis)),
  );
  const length = Vector3.length(raised);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error(
      "The mandibular axis cannot be the vertical of the basis frame.",
    );
  const up = Vector3.scale(raised, 1 / length);
  const forward = Vector3.cross(axis, up);
  const lipsAt = (
    layer: {
      surfaces: number[][];
      landmarks: Record<string, IAutoMovieVector3>;
    },
    weights: ReadonlyMap<string, number>,
  ): number =>
    measureHumanFaceApertureGap(
      at(contact.lips.surface, contact.lips.upper, layer, weights),
      at(contact.lips.surface, contact.lips.lower, layer, weights),
      up,
    );
  const lipsRest = lipsAt(shaped, new Map());
  const lipsReference = lipsAt(referenced, reference);
  const current = {
    upper: pose(
      contact.lips.surface,
      contact.lips.upper,
      rest.surfaces[index.get(contact.lips.surface)!],
      motions,
    ),
    lower: pose(
      contact.lips.surface,
      contact.lips.lower,
      rest.surfaces[index.get(contact.lips.surface)!],
      motions,
    ),
  };
  const lipsGap = measureHumanFaceApertureGap(current.upper, current.lower, up);
  const span = lipsReference - lipsRest;
  if (!(span > 0) || !Number.isFinite(span))
    throw new Error(
      "The reference opening must part the lips for closure to be scaled against it.",
    );
  const incisors = {
    upper: pose(
      contact.incisors.surface,
      contact.incisors.upper,
      rest.surfaces[index.get(contact.incisors.surface)!],
      motions,
    ),
    lower: pose(
      contact.incisors.surface,
      contact.incisors.lower,
      rest.surfaces[index.get(contact.incisors.surface)!],
      motions,
    ),
  };
  return {
    up,
    forward,
    lips: { ...current, gap: lipsGap },
    incisors: { ...incisors, gap: measureHumanFaceApertureGap(incisors.upper, incisors.lower, up) },
    closureRatio: Math.max(0, (lipsGap - lipsRest) / span),
  };
}
