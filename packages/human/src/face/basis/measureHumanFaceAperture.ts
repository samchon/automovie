import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Measure the oral apertures of one state the way the closure and passage
 * rules read them: along the opening direction, between the vermilion seam
 * and incisal edge vertex pairs, after the pairs alone have been posed by the
 * articulation the state resolves to.
 *
 * The frame is the basis frame's own vertical made perpendicular to the
 * mandibular axis, which is the cranial vertical every clinical aperture is
 * measured along, and forward is that axis crossed with up; the chord of
 * the opening at the incisors would tilt the frame backward by the arc's
 * half angle and read protrusion as a rise. Both apertures are signed
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-contact Reads the interlabial and interincisal apertures the coupled closure and passage rules are judged on.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact Poses the aperture vertex pairs alone, orders them along the opening direction and forms the closure ratio from rest, reference and current apertures.
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
  const gapOf = (upper: IAutoMovieVector3, lower: IAutoMovieVector3): number =>
    Vector3.dot(Vector3.subtract(upper, lower), up);
  const lipsAt = (
    layer: {
      surfaces: number[][];
      landmarks: Record<string, IAutoMovieVector3>;
    },
    weights: ReadonlyMap<string, number>,
  ): number =>
    gapOf(
      at(contact.lips.surface, contact.lips.upper, layer, weights),
      at(contact.lips.surface, contact.lips.lower, layer, weights),
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
  const lipsGap = gapOf(current.upper, current.lower);
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
    incisors: { ...incisors, gap: gapOf(incisors.upper, incisors.lower) },
    closureRatio: Math.max(0, (lipsGap - lipsRest) / span),
  };
}
