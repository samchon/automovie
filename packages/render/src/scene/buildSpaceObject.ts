import { tessellateSurface } from "@automovie/engine";
import type {
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieTessellation,
} from "@automovie/interface";
import * as THREE from "three";

import { SPACE_GROUP_NAME } from "./SPACE_GROUP_NAME.js";

/**
 * Build the structural ground of an {@link IAutoMovieSpace}: one `Mesh` per
 * standable surface, grouped under {@link SPACE_GROUP_NAME}.
 *
 * This is what closes the gap between the space the feet obey and the world the
 * guide passes draw (#1173). The surfaces were already the engine's semantic
 * ground (`heightAt`, support contacts, walkability) but nothing ever drew
 * them, so a depth or mask pass of a staged scene showed actors floating in a
 * void. Building them as real meshes is enough: every structural pass collects
 * geometry by traversing the scene and checking isMesh, then replaces its material, so the
 * ground joins depth, mask, normal, and outline with no pass-side special case,
 * unlike a `GridHelper`, which is a `LineSegments` and must be hidden before
 * every structural pass.
 *
 * A patch with an authored opaque color uses the same mesh in the beauty and
 * guide passes. An uncolored support patch writes neither color nor depth in
 * beauty, leaving any independently built floor to supply its appearance. All
 * patches remain structural guide geometry when a guide replaces the material.
 *
 * The engine decomposes each footprint into its actual convex pieces, including
 * notches and holes. Floors and ramps fan those pieces; heightfields clip them
 * to authored lattice cells. Vertex heights use the grounding height query and
 * triangles face +Y. Inside a twisted bilinear cell the drawn planar triangles
 * approximate the height rule; identical vertex heights do not prove identical
 * interpolated interior heights.
 *
 * A degenerate footprint (fewer than three non-collinear points, rejected by
 * `validateSpace`, but a hand-built space may still carry one) encloses no area
 * and contributes no mesh rather than an invalid geometry.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses the engine's actual footprint decomposition, height-rule tessellation, +Y winding and shared smooth normals, then realizes Float32 indexed geometry; admitted metre/Y-up surfaces satisfy engine premises, and bilinear cell interiors remain planar approximations rather than exact grounding geometry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the Three mesh and opaque or guide-only material. The engine owns tessellation, and the guide passes own material replacement.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The appearance option changes only the one mesh's material. No fixture paths, duplicate visual geometry or replacement height rules participate.
 * @evidence contracts/development/common.md#meaningful-documentation Gives structural coverage, color opt-in, footprint regions, metre/Y-up winding, degenerate omission and the heightfield interior approximation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one mesh per nondegenerate surface and copies each emitted position/normal/index once; engine cost depends on convex pieces and touched heightfield cells, and output memory grows with tessellated vertices/triangles rather than scene raster size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine tessellation implementation but creates fresh scene-owned Three resources per build; mutable support surfaces have no immutable revision key here, so no cross-scene geometry cache is assumed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Transfers new geometries/materials to the returned group and retains no separate registry; population is bounded by this space's nondegenerate surfaces and tessellation output. No disposer or partial-build rollback is exposed here, so scene-host retirement and construction-failure cleanup remain a gap rather than guaranteed release.
 */
export const buildSpaceObject: (space: IAutoMovieSpace) => THREE.Group = (
  space: IAutoMovieSpace,
): THREE.Group => {
  const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  group.name = SPACE_GROUP_NAME;
  for (const surface of space.surfaces) {
    const geometry: THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    > | null = buildSurfaceGeometry(surface);
    if (geometry === null) continue;
    const mesh: THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      THREE.MeshBasicMaterial,
      THREE.Object3DEventMap
    > = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial(
        surface.color === undefined
          ? { colorWrite: false, depthWrite: false }
          : {
              color: new THREE.Color(
                surface.color.r,
                surface.color.g,
                surface.color.b,
              ),
            },
      ),
    );
    mesh.name = surface.id;
    group.add(mesh);
  }
  return group;
};

/**
 * One surface footprint as a triangulated planar patch, or `null` when the
 * footprint encloses no area.
 */
const buildSurfaceGeometry: (
  surface: IAutoMovieSurface,
) => THREE.BufferGeometry | null = (
  surface: IAutoMovieSurface,
): THREE.BufferGeometry | null => {
  const mesh: IAutoMovieTessellation | null = tessellateSurface(surface);
  if (mesh === null) return null;
  const geometry: THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(mesh.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(mesh.normals, 3),
  );
  geometry.setIndex(mesh.indices);
  return geometry;
};
