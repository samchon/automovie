import { IAutoMovieMesh, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "./ViolationCollector";
import { appendMeshTopology } from "./appendMeshTopology";

/**
 * Validate a mesh's Tier-5 topology (the codified `"topology"` violation kind,
 * previously declared but never emitted). It welds vertices by position and
 * checks the two invariants EVERY valid triangle mesh must satisfy, regardless
 * of whether it is a closed solid or an open surface:
 *
 * - **2-manifold:** no edge is shared by more than two triangles (a "fin", a
 *   third face growing out of an edge, cannot bound a surface).
 * - **Consistent winding:** two triangles adjacent on an edge traverse it in
 *   opposite directions, so their outward faces agree (the glTF front-face
 *   contract a renderer culls against).
 *
 * These are ERRORS: a mesh violating them is structurally broken, not merely
 * implausible. **Watertightness** (no boundary/open edges) is context-dependent
 * (a plane, decal, or cloth is a legitimate open mesh), so it is only checked
 * when the caller sets `expectClosed` (a baked solid, a collision proxy).
 *
 * The check assumes structurally-valid buffers (positions a multiple of 3,
 * indices whole triangles in range); on malformed input it returns without a
 * topology verdict, leaving the structural report to {@link validateModel}'s
 * mesh checks. Tessellated primitives are watertight by construction and pass;
 * the beneficiary is externally-sourced or hand-built mesh geometry validated
 * through `validateModel`.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateMeshTopology` reports non-manifold edges and inconsistent shared-edge winding at the standalone mesh root.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateMeshTopology` preserves each welded edge identity and observed incidence count or orientation beside the topology constraint.
 * @author Samchon
 */
export const validateMeshTopology = (props: {
  /** Mesh to check. */
  mesh: IAutoMovieMesh;

  /** JSON path of the mesh being checked. Defaults to `$input`. */
  path?: string;

  /** When set, a boundary (open) edge is also an error: the mesh must close. */
  expectClosed?: boolean;
}): IAutoMovieValidation => {
  const collector = new ViolationCollector();
  appendMeshTopology(
    props.mesh,
    props.path ?? "$input",
    collector,
    props.expectClosed ?? false,
  );
  return collector.toValidation();
};
