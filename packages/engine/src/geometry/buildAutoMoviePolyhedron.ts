import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { finiteVector } from "./finiteVector";

/**
 * Build a boundary representation from planar convex polygonal faces.
 *
 * Extrusion, revolution and sweep each impose a shape on the result; this is
 * the general form for a solid whose faces are simply stated, such as a ridged
 * roof, a wedge or a chamfered pier, without authoring raw vertex arrays. Each
 * face owns its corners, so its flat normal stays sharp across every seam.
 * Faces are emitted in declaration order, each fanned from its first corner,
 * and the input is only read.
 *
 * Texture coordinates are local metres in a frame the face's own normal
 * decides, anchored on the mesh origin before any later mesh transform. A face
 * that is not level takes world up projected into its plane as V, so courses
 * run level and every upright face of one mesh reads the same V at the same
 * height: a wall return, a column wrap and a countertop edge continue their
 * coursing around a corner. U is the remaining in-plane axis and does not
 * continue around a corner, because continuing both axes across a fold is a
 * developed layout this kernel does not cut. A level face takes world +X as U
 * instead, so a floor and the ceiling above it mirror rather than diverge.
 * Because the frame comes from the normal and not from the corner list,
 * coplanar faces form one continuous surface however their corners were
 * typed, and the same polygon started at another corner keeps its atlas.
 *
 * The face normal is taken at the first corner that is not straight, so a
 * straight corner anywhere in the list, the first included, neither collapses
 * the normal nor refuses the face. Refused, each by its own
 * diagnostic naming the face: no faces; fewer than three corners; a non-finite
 * corner; a face whose corners are all collinear; a corner off the face's
 * plane; a reflex corner; and a ring that turns around more than once, such as
 * a pentagram, whose fan would cover ground the face does not. Convexity is
 * required because the face is fanned from its first corner. Whether the
 * result is a closed shell is the caller's to declare and
 * `inspectAutoMovieMeshTopology`'s to measure.
 *
 * @param faces Each face's corners in metres, counter-clockwise seen from outside.
 * @returns A mesh with flat normals and metric UVs.
 *
 * @evidence contracts/common.md#principled-implementation A convex polygon is planar, turns one way at every corner and has total turning 2 pi; the function checks exactly those three facts against the normal of the first non-straight corner before fanning, and the UV frame is a fixed function of that normal so coplanar faces share coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Admission, the normal-derived UV frame and emission are separated into `faceNormal`, `surfaceUvFrame` and the main loop, and the only tolerance is `FACE_EPSILON` shared by the area, planarity and turn tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Faces are refused, never repaired, and the UV frame never depends on which corner the author typed first; `LEVEL_FACE_LIMIT` is the declared conditioning switch between the two frame rules, not a per-asset value.
 * @evidence contracts/common.md#meaningful-documentation States the purpose, ordering and ownership, the full UV rule with its seams and why, how the normal is chosen, every refusal, why convexity is required, and who checks closure.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the total corner count: each face takes one pass for the normal, one for planarity, one for turning and one to emit corners and fan indices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One mesh per face list; a caller placing the same solid repeatedly can keep the returned mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns new position, normal, UV and index arrays sized by the corner count; per-face normals and frames are released as each face finishes.
 * @author Samchon
 */
export const buildAutoMoviePolyhedron = (
  faces: ReadonlyArray<readonly IAutoMovieVector3[]>,
): IAutoMovieMesh => {
  if (faces.length === 0) throw new Error("polyhedron needs at least one face");
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  faces.forEach(
    (corners: readonly IAutoMovieVector3[], face: number): void => {
      if (corners.length < 3)
        throw new Error(
          `polyhedron face[${face}] needs at least three corners`,
        );
      corners.forEach((corner: IAutoMovieVector3, index: number): void =>
        finiteVector(corner, `polyhedron face[${face}] corner[${index}]`),
      );
      const normal: IAutoMovieVector3 = faceNormal(corners, face);
      const origin: IAutoMovieVector3 = corners[0]!;
      if (
        corners.some(
          (corner: IAutoMovieVector3): boolean =>
            Math.abs(Vector3.dot(Vector3.subtract(corner, origin), normal)) >
            FACE_EPSILON,
        )
      )
        throw new Error(`polyhedron face[${face}] is not planar`);
      let turning: number = 0;
      for (let index: number = 0; index < corners.length; ++index) {
        const previous: IAutoMovieVector3 =
          corners[(index + corners.length - 1) % corners.length]!;
        const current: IAutoMovieVector3 = corners[index]!;
        const next: IAutoMovieVector3 = corners[(index + 1) % corners.length]!;
        const incoming: IAutoMovieVector3 = Vector3.subtract(current, previous);
        const outgoing: IAutoMovieVector3 = Vector3.subtract(next, current);
        const turn: number = Vector3.dot(
          Vector3.cross(incoming, outgoing),
          normal,
        );
        if (turn < -FACE_EPSILON)
          throw new Error(`polyhedron face[${face}] must be convex`);
        turning += Math.atan2(
          Math.max(0, turn),
          Vector3.dot(incoming, outgoing),
        );
      }
      // A closed planar ring turns a whole number of times; one turn is 2 pi,
      // so anything past 3 pi winds at least twice and its fan overlaps itself.
      if (turning > 3 * Math.PI)
        throw new Error(`polyhedron face[${face}] must be convex`);
      const frame: { u: IAutoMovieVector3; v: IAutoMovieVector3 } =
        surfaceUvFrame(normal);
      const base: number = positions.length / 3;
      for (const corner of corners) {
        positions.push(corner.x, corner.y, corner.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(Vector3.dot(corner, frame.u), Vector3.dot(corner, frame.v));
      }
      for (let index: number = 1; index + 1 < corners.length; ++index)
        indices.push(base, base + index, base + index + 1);
    },
  );
  return { positions, normals, uvs, indices, skin: null };
};

/**
 * The unit normal of a face, taken at its first corner whose two edges span a
 * cross product longer than `FACE_EPSILON`.
 *
 * Every corner of a convex face yields the same direction, so skipping a
 * straight corner, whose edges are parallel, changes nothing for a face that
 * has none and keeps a straight first corner from supplying a zero normal. A
 * face whose every corner is straight encloses no area and is refused.
 */
const faceNormal = (
  corners: readonly IAutoMovieVector3[],
  face: number,
): IAutoMovieVector3 => {
  for (let index: number = 0; index < corners.length; ++index) {
    const current: IAutoMovieVector3 = corners[index]!;
    const spans: IAutoMovieVector3 = Vector3.cross(
      Vector3.subtract(corners[(index + 1) % corners.length]!, current),
      Vector3.subtract(
        corners[(index + corners.length - 1) % corners.length]!,
        current,
      ),
    );
    if (Vector3.length(spans) > FACE_EPSILON) return Vector3.normalize(spans);
  }
  throw new Error(`polyhedron face[${face}] encloses no area`);
};

/**
 * The in-plane metre frame one planar face measures its texture coordinates in,
 * decided by the face's normal and nothing else.
 *
 * Both branches return an orthonormal pair with `u x v === normal`, so a metre
 * on the face is a unit in the atlas whichever way the face points and the
 * image is never mirrored by the frame alone.
 *
 * An upright face takes world up projected into its plane as V, which is what
 * makes coursing continue around a corner: two faces meeting at a vertical edge
 * share the same V function of position even though their planes differ. A
 * level face has no up to project, so it falls back to world +X as U, and the
 * cross product then carries a floor and a ceiling to mirrored V, which keeps
 * each of them reading the right way round from its own side.
 *
 * The switch is drawn where the projection stops being conditioned rather than
 * where a face stops looking level: at the limit the residual up-component is
 * still 1.4 mm per metre, which normalizes without loss, so a steep roof and a
 * barely-tilted soffit both stay on the upright rule and only a face level to
 * within a twelfth of a degree leaves it. That switch is itself a declared
 * orientation seam: faces on opposite sides of it do not claim grain
 * continuity merely because their normals are close.
 */
const surfaceUvFrame = (
  normal: IAutoMovieVector3,
): { u: IAutoMovieVector3; v: IAutoMovieVector3 } => {
  if (Math.abs(normal.y) < LEVEL_FACE_LIMIT) {
    const v: IAutoMovieVector3 = inPlaneAxis({ x: 0, y: 1, z: 0 }, normal);
    return { u: Vector3.cross(v, normal), v };
  }
  const u: IAutoMovieVector3 = inPlaneAxis({ x: 1, y: 0, z: 0 }, normal);
  return { u, v: Vector3.cross(normal, u) };
};

/** One world axis projected into a plane and renormalized. */
const inPlaneAxis = (
  axis: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.normalize(
    Vector3.subtract(axis, Vector3.scale(normal, Vector3.dot(axis, normal))),
  );

/**
 * How aligned with world up a face normal may be before world up stops being a
 * usable in-plane reference: the cosine of about `0.081` degrees off level.
 */
const LEVEL_FACE_LIMIT: number = 1 - 1e-6;

/**
 * Largest edge cross product, out-of-plane distance, or backward turn one
 * authored face may carry and still count as zero.
 */
const FACE_EPSILON: number = 1e-9;
