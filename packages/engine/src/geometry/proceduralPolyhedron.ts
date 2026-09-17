/**
 * Build convex planar faces with independent flat normals and a metric UV
 * frame derived from each face normal. Asset authors call the proceduralMesh
 * export; input faces remain untouched. Validate every face before appending
 * its corners, and preserve declaration order. Coordinates and plane distance
 * tolerances use metres. The result does not certify a closed shell. Changing
 * the frame rule would invalidate authored grain and texture-scale assumptions.
 */
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { finiteVector } from "./proceduralDimensions";

/**
 * Build a boundary representation from planar polygonal faces.
 *
 * Extrusion, revolution, and sweep each impose a shape on the result; this is
 * the general escape for a solid whose faces are simply stated, such as a
 * ridged roof, a wedge, or a chamfered pier, without dropping to authored
 * vertex arrays. Each face owns its corners, so its normal stays flat across
 * the seam.
 *
 * Texture coordinates are local metres measured in a frame the face's own
 * normal decides, anchored on the mesh origin before any later mesh transform.
 * A face that is not level takes world up
 * projected into its plane as V, so courses run level and every upright face in
 * one mesh reads the same height at the same height: a wall return, a column
 * wrap, and a countertop edge continue their coursing around the corner because
 * V is the same function of position on both sides of it. U is the remaining
 * in-plane axis, and it does not continue around a corner, because continuing
 * both axes across a fold is a developed layout and this kernel does not cut
 * one. A level face takes world +X as U instead, so a floor and the ceiling
 * above it mirror rather than diverge.
 *
 * Deriving the frame from the normal rather than from the corner list is the
 * point. A frame taken from a face's first edge moves when the same polygon is
 * authored starting at a different corner, and two coplanar faces of one solid
 * then carry unrelated coordinates with a grain break along a seam that is not
 * a seam. Under this rule coplanar faces are one continuous surface however
 * their corners were typed, and where the grain does break the break is stated
 * rather than incidental.
 *
 * Faces are refused, never quietly repaired: fewer than three corners, a
 * non-finite corner, a collinear face carrying no area, a corner off the face's
 * own plane, and a reflex corner each raise their own diagnostic. Convexity is
 * demanded because the face is fanned from its first corner, and fanning a
 * concave outline emits triangles that cover ground the face does not. Whether
 * the result is a closed shell is the caller's declaration to make and
 * [inspectAutoMovieMeshTopology](./proceduralMeshTopology.ts)'s to check.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Builds arbitrary convex-faced polyhedra from code-authored points.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Accepts explicit metric face geometry as a native asset input.
 * @evidence requirements/interior/grain-seams-and-continuity.md#interior-grain-corner-continuity States where the grain continues across adjacent faces and stops it changing with the order a face's corners were authored in.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-joint-edge-grain-continuity Derives the shared frame and transform continuity across faces is allowed to rest on.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-surface-coordinate-convention Emits the projected half of the shared surface coordinate convention.
 */
export const buildAutoMoviePolyhedron = (
  faces: ReadonlyArray<readonly IAutoMovieVector3[]>,
): IAutoMovieMesh => {
  if (faces.length === 0) throw new Error("polyhedron needs at least one face");
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  faces.forEach((corners, face) => {
    if (corners.length < 3)
      throw new Error(`polyhedron face[${face}] needs at least three corners`);
    corners.forEach((corner, index) =>
      finiteVector(corner, `polyhedron face[${face}] corner[${index}]`),
    );
    const origin = corners[0]!;
    const spans = Vector3.cross(
      Vector3.subtract(corners[1]!, origin),
      Vector3.subtract(corners[corners.length - 1]!, origin),
    );
    if (Vector3.length(spans) <= FACE_EPSILON)
      throw new Error(`polyhedron face[${face}] encloses no area`);
    const normal = Vector3.normalize(spans);
    if (
      corners.some(
        (corner) =>
          Math.abs(Vector3.dot(Vector3.subtract(corner, origin), normal)) >
          FACE_EPSILON,
      )
    )
      throw new Error(`polyhedron face[${face}] is not planar`);
    for (let index = 0; index < corners.length; ++index) {
      const previous = corners[(index + corners.length - 1) % corners.length]!;
      const current = corners[index]!;
      const next = corners[(index + 1) % corners.length]!;
      if (
        Vector3.dot(
          Vector3.cross(
            Vector3.subtract(current, previous),
            Vector3.subtract(next, current),
          ),
          normal,
        ) < -FACE_EPSILON
      )
        throw new Error(`polyhedron face[${face}] must be convex`);
    }
    const frame = surfaceUvFrame(normal);
    const base = positions.length / 3;
    for (const corner of corners) {
      positions.push(corner.x, corner.y, corner.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(Vector3.dot(corner, frame.u), Vector3.dot(corner, frame.v));
    }
    for (let index = 1; index + 1 < corners.length; ++index)
      indices.push(base, base + index, base + index + 1);
  });
  return { positions, normals, uvs, indices, skin: null };
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
 * cross product then carries a floor and a ceiling to mirrored V, which is what
 * keeps each of them reading the right way round from its own side.
 *
 * The switch is drawn where the projection stops being conditioned rather than
 * where a face stops looking level: at the limit the residual up-component is
 * still 1.4 mm per metre, which normalizes without loss, so a steep roof and a
 * barely-tilted soffit both stay on the upright rule and only a face level to
 * within a twelfth of a degree leaves it. That switch is itself a declared
 * orientation seam. Faces on opposite sides of it do not claim grain
 * continuity merely because their normals are close.
 */
const surfaceUvFrame = (
  normal: IAutoMovieVector3,
): { u: IAutoMovieVector3; v: IAutoMovieVector3 } => {
  if (Math.abs(normal.y) < LEVEL_FACE_LIMIT) {
    const v = inPlaneAxis({ x: 0, y: 1, z: 0 }, normal);
    return { u: Vector3.cross(v, normal), v };
  }
  const u = inPlaneAxis({ x: 1, y: 0, z: 0 }, normal);
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
const LEVEL_FACE_LIMIT = 1 - 1e-6;

/** Largest out-of-plane or degenerate-area slack one authored face may carry. */
const FACE_EPSILON = 1e-9;
