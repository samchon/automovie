import {
  type IAutoMovieMesh,
  type IAutoMovieMeshPhysicalVertices,
  type IAutoMovieMeshSkin,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { measureAutoMovieMeshClearance } from "@automovie/engine";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";

/**
 * Plane differences attain extrema at projected intersection vertices, including
 * intersections absent from either source vertex set.
 *
 * Scenarios:
 * 1. Two crossing triangles have all front vertices outside the back triangle.
 *    Their overlap still has separation -1; raising the front by two gives +1.
 * 2. Reversing winding, changing depth axis, or using implicit triangle indices
 *    preserves the signed answer. Exact contact reports zero.
 * 3. Disjoint, empty and ray-parallel surfaces have no ordering relationship.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures signed projected face clearance and checks extrema at crossed-edge intersections, whole-face ordinals, axis/winding/index equivalence, zero contact, absent ordering and unchanged inputs. It catches algorithms that sample only source corners.
 * @evidence contracts/testing.md#independent-expectations Constant plane depth subtraction gives -1, +1 and zero; solving the authored sloped depth over the overlap gives -4/3. Empty/disjoint/edge-on projections have no ordered overlap. These are affine triangle expectations with retained 1e-12 tolerances, not general solid-distance or rendered-contact oracles.
 * @evidence contracts/testing.md#distinguishing-cases Retains crossed edges outside both source vertex sets, all depth axes, reversed winding, implicit indices, contact, disjoint/empty/parallel inputs and ownership. Spatial population pruning and malformed/overflow refusals belong to the spatial and refusals tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly executes portable clearance source using the existing authored triangles and scalar arithmetic. It starts no process, browser, GPU or native build, installs no consumer and registers no dynamic cases.
 */
export function test_geometry_mesh_clearance(): void {
  const mesh: (points: number[][]) => IAutoMovieMesh = (
    points: number[][],
  ): IAutoMovieMesh => ({
    positions: points.flat(),
    indices: null,
    normals: null,
    uvs: null,
    skin: null,
  });
  const front: IAutoMovieMesh = mesh([
    [-2, -1, 0],
    [2, -1, 0],
    [0, 2, 0],
  ]);
  const back: IAutoMovieMesh = mesh([
    [-2, 1, 1],
    [0, -2, 1],
    [2, 1, 1],
  ]);
  const original: IAutoMovieMesh[] = structuredClone([front, back]);
  const sloped: {
    positions: number[];
    physicalVertices?: IAutoMovieMeshPhysicalVertices;
    normals: number[] | null;
    uvs: number[] | null;
    colors?: number[];
    reliefWeights?: number[];
    indices: number[] | null;
    skin: IAutoMovieMeshSkin | null;
  } = {
    ...back,
    positions: back.positions.map((v: number, i: number): number =>
      i % 3 === 2 ? back.positions[i - 2] : v,
    ),
  };
  TestValidator.predicate(
    "crossed edge affine minimum",
    nclose(
      measureAutoMovieMeshClearance(front, sloped, "z")[0].minimum + 4 / 3,
      0,
      1e-12,
    ) &&
      Math.abs(
        measureAutoMovieMeshClearance(front, sloped, "z")[0].minimum + 4 / 3,
      ) < 1e-12,
  );
  for (const axis of ["x", "y", "z"] as const) {
    const permute: (m: IAutoMovieMesh, lift: number) => IAutoMovieMesh = (
      m: IAutoMovieMesh,
      lift: number,
    ): IAutoMovieMesh => ({
      ...m,
      positions: Array.from(
        { length: 3 },
        (_: unknown, i: number): number[] => {
          const [u, v, d]: number[] = m.positions.slice(i * 3, i * 3 + 3);
          return axis === "x"
            ? [d + lift, u, v]
            : axis === "y"
              ? [v, d + lift, u]
              : [u, v, d + lift];
        },
      ).flat(),
    });
    for (const lift of [0, 1, 2]) {
      const a: IAutoMovieMesh = permute(front, lift),
        b: IAutoMovieMesh = permute(back, 0);
      const expected: number = lift - 1;
      for (const indices of [null, [2, 1, 0]]) {
        const result: { triangle: number; minimum: number }[] =
          measureAutoMovieMeshClearance(
            { ...a, indices },
            { ...b, indices },
            axis,
          );
        TestValidator.equals("one overlapping front face", result.length, 1);
        TestValidator.predicate(
          "independent constant plane gap",
          nclose(result[0].minimum - expected, 0, 1e-12) &&
            Math.abs(result[0].minimum - expected) < 1e-12,
        );
      }
    }
  }
  TestValidator.predicate(
    "caller buffers unchanged",
    equalGeometryTestValues([front, back], original),
  );
  TestValidator.equals(
    "empty back",
    measureAutoMovieMeshClearance(front, mesh([]), "z"),
    [],
  );
  TestValidator.equals(
    "empty front",
    measureAutoMovieMeshClearance(mesh([]), back, "z"),
    [],
  );
  for (const offset of [
    [10, 0],
    [0, 10],
    [0, -10],
    [-10, 0],
  ]) {
    const moved: {
      positions: number[];
      physicalVertices?: IAutoMovieMeshPhysicalVertices;
      normals: number[] | null;
      uvs: number[] | null;
      colors?: number[];
      reliefWeights?: number[];
      indices: number[] | null;
      skin: IAutoMovieMeshSkin | null;
    } = {
      ...back,
      positions: back.positions.map(
        (v: number, i: number): number => v + (i % 3 < 2 ? offset[i % 3] : 0),
      ),
    };
    TestValidator.equals(
      "disjoint projections",
      measureAutoMovieMeshClearance(front, moved, "z"),
      [],
    );
  }
  const parallel: IAutoMovieMesh = mesh([
    [0, 0, 0],
    [1, 0, 0],
    [0, 0, 1],
  ]);
  TestValidator.equals(
    "parallel front",
    measureAutoMovieMeshClearance(parallel, back, "z"),
    [],
  );
  TestValidator.equals(
    "parallel back",
    measureAutoMovieMeshClearance(front, parallel, "z"),
    [],
  );
}
