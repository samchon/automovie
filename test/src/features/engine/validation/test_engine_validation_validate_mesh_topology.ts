import { tessellateToMesh, validateMeshTopology } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMesh,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, violationCount } from "../../internal/predicates";

/**
 * `validateMeshTopology` welds coincident positions and refuses a triangle mesh
 * that is not 2-manifold or whose neighbours wind a shared edge alike, and with
 * `expectClosed` one with boundary edges; it leaves malformed buffers to model
 * admission.
 *
 * Fixture: the unit square's corners v0..v3 at z = 0 and v4 = (0, 0, 1); the
 * tetrahedron (0,0,0), (1,0,0), (0,1,0), (0,0,1) wound outward.
 *
 * Scenarios:
 *
 * 1. Two triangles sharing an edge oppositely pass; under `expectClosed` their
 *    open edges are a topology finding at `$input.indices`.
 * 2. Three triangles on edge 0-1 are a "2-manifold" finding (rooted at
 *    `$mesh.indices` under path `$mesh`); two winding 0-1 alike are a "flipped"
 *    finding.
 * 3. A triangle with a repeated vertex is skipped; one unindexed triangle passes
 *    with the defaults.
 * 4. Empty positions, index 9 or -1, two indices and a ragged position buffer give
 *    no topology verdict.
 * 5. The tetrahedron passes with and without `expectClosed`; without one face it
 *    passes, and under `expectClosed` reports exactly its three open edges.
 * 6. A tessellated unit box (corners emitted per face, more than eight vertices)
 *    is watertight once welded.
 */
export function test_engine_validation_validate_mesh_topology(): void {
  const mesh = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    normals: null,
    uvs: null,
    indices,
    skin: null,
  });
  const P: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1];
  const topo = (
    m: IAutoMovieMesh,
    expectClosed: boolean = false,
  ): IAutoMovieValidation => validateMeshTopology({ mesh: m, expectClosed });
  const says = (result: IAutoMovieValidation, word: string): boolean =>
    result.success === false &&
    result.violations.some((v: IAutoMovieConstraintViolation): boolean =>
      v.expected.includes(word),
    );
  const pass = (label: string, result: IAutoMovieValidation): void =>
    TestValidator.equals(label, result, { success: true });

  // 1.
  const pair: IAutoMovieMesh = mesh(P.slice(0, 12), [0, 1, 2, 1, 3, 2]);
  pass("open pair", topo(pair));
  TestValidator.predicate(
    "open pair closed",
    hasViolation(topo(pair, true), "topology", "$input.indices"),
  );

  // 2.
  const fin: IAutoMovieMesh = mesh(P, [0, 1, 2, 1, 0, 3, 0, 1, 4]);
  TestValidator.predicate(
    "fin",
    says(topo(fin), "2-manifold") &&
      hasViolation(topo(fin), "topology", "$input.indices"),
  );
  TestValidator.predicate(
    "explicit path",
    hasViolation(
      validateMeshTopology({ mesh: fin, path: "$mesh" }),
      "topology",
      "$mesh.indices",
    ),
  );
  TestValidator.predicate(
    "flipped",
    says(topo(mesh(P.slice(0, 12), [0, 1, 2, 0, 1, 3])), "flipped"),
  );

  // 3.
  pass("degenerate", topo(mesh(P, [0, 1, 2, 3, 3, 4])));
  pass("soup", validateMeshTopology({ mesh: mesh(P.slice(0, 9), null) }));

  // 4.
  pass("empty", topo(mesh([], [])));
  pass("index 9", topo(mesh(P.slice(0, 9), [0, 1, 9])));
  pass("index -1", topo(mesh(P.slice(0, 9), [0, 1, -1])));
  pass("two indices", topo(mesh(P.slice(0, 9), [0, 1])));
  pass("ragged positions", topo(mesh([0, 0, 0, 1], null)));

  // 5.
  const tetra: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  const closed: IAutoMovieMesh = mesh(
    tetra,
    [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3],
  );
  pass("tetra", topo(closed));
  pass("tetra closed", topo(closed, true));
  const open: IAutoMovieMesh = mesh(tetra, [0, 2, 1, 0, 1, 3, 0, 3, 2]);
  pass("open tetra", topo(open));
  const exposed: IAutoMovieValidation = topo(open, true);
  TestValidator.predicate(
    "three open edges",
    hasViolation(exposed, "topology", "$input.indices") &&
      violationCount(exposed) === 3,
  );

  // 6.
  const box: IAutoMovieMesh = tessellateToMesh({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  TestValidator.predicate(
    "box has duplicated corners",
    box.positions.length / 3 > 8,
  );
  pass("welded box", topo(box, true));
}
