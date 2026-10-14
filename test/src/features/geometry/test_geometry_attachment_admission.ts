import {
  type IAutoMovieMeshSeparationQuery,
  type IAutoMovieMeshSeparationResult,
  createAutoMovieMeshSeparationQuery,
} from "@automovie/engine";
import {
  type IAutoMovieMesh,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * Canonical contact metadata never grants a malformed or unrelated support.
 * Scenarios:
 * 1. A source plane's dense original barycentric fan is admitted unchanged.
 * 2. Wrong fan arity, fractional triangle identity, absent weight/support arrays,
 *    missing primary support and sparse/noninteger supports refuse by name.
 * 3. A second coplanar incident face remains legal when both original supports
 *    of the sampled edge are supplied.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the separation query with registered plane-root fans, asserting certification for valid support metadata and named refusals for malformed metadata or an incomplete fan; an adjacent two-face support remains legal.
 * @evidence contracts/testing.md#independent-expectations Triangle ordinal zero and barycentric weights identify the authored root, and the edge fan requires both incident triangle ordinals. These admission facts follow the supplied mesh and support contract, not a recorded query result; certification here does not prove a general embedded surface or rendered contact.
 * @evidence contracts/testing.md#distinguishing-cases Covers dense and incomplete fans, fractional/absent/unrelated/sparse support fields, and a valid coplanar incident pair. Numerical source-to-Float32 contact extent and unrelated piercing obstacles belong to the attachment-contact and representation tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named test invokes portable separation source and the existing exception observer directly, using only its existing synthetic plane data. It requires no process, consumer installation, native build, browser or GPU and dynamically registers no cases.
 */
export function test_geometry_attachment_admission(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const query: IAutoMovieMeshSeparationQuery =
    createAutoMovieMeshSeparationQuery(mesh);
  const fan: IAutoMovieVector3[] = [
    { x: 0.5, y: 0.5, z: 0 },
    { x: 0.4, y: 0.5, z: 0.1 },
    { x: 0.6, y: 0.5, z: 0.1 },
  ];
  const attachment: {
    triangle: number;
    weights: number[];
    supports: number[];
  } = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };
  const options: () => {
    clearance: number;
    budget: { remaining: number };
    attachment: { triangle: number; weights: number[]; supports: number[] };
  } = (): {
    clearance: number;
    budget: { remaining: number };
    attachment: { triangle: number; weights: number[]; supports: number[] };
  } => ({
    clearance: 0,
    budget: { remaining: 1000 },
    attachment,
  });
  TestValidator.equals(
    "dense canonical fan is supported",
    query(fan, options()).certified,
    true,
  );
  const malformed: (
    | { weights: undefined; triangle: number; supports: number[] }
    | { supports: undefined; triangle: number; weights: number[] }
    | { supports: (number | undefined)[]; triangle: number; weights: number[] }
  )[] = [
    { ...attachment, triangle: 0.5 },
    { ...attachment, weights: undefined },
    { ...attachment, supports: undefined },
    { ...attachment, supports: [1] },
    { ...attachment, supports: [0, 0.5] },
    { ...attachment, supports: [0, undefined] },
  ];
  for (const invalid of malformed)
    TestValidator.predicate(
      "malformed original contact metadata refuses",
      throwsError(
        (): IAutoMovieMeshSeparationResult =>
          query(fan, {
            ...options(),
            attachment: invalid as unknown as typeof attachment,
          }),
        "attachment",
      ),
    );
  TestValidator.predicate(
    "canonical metadata requires an actual complete fan",
    throwsError(
      (): IAutoMovieMeshSeparationResult => query(fan.slice(1), options()),
      "attachment",
    ),
  );
  const double: IAutoMovieMeshSeparationQuery =
    createAutoMovieMeshSeparationQuery({
      ...mesh,
      positions: [...mesh.positions, 2, 2, 0],
      indices: [0, 1, 2, 1, 3, 2],
    });
  const edgeFan: IAutoMovieVector3[] = [
    { x: 1, y: 1, z: 0 },
    { x: 0.9, y: 1, z: 0.1 },
    { x: 1.1, y: 1, z: 0.1 },
  ];
  const edgeAttachment: {
    triangle: number;
    weights: number[];
    supports: number[];
  } = {
    triangle: 0,
    weights: [0, 0.5, 0.5],
    supports: [0, 1],
  };
  TestValidator.equals(
    "complete coplanar incident support fan",
    double(edgeFan, {
      clearance: 0,
      budget: { remaining: 1000 },
      attachment: edgeAttachment,
    }).certified,
    true,
  );
}
