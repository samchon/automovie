import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieMeshSeparationResult,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * Canonical contact metadata never grants a malformed or unrelated support.
 * Scenarios:
 *
 * 1. A source plane's dense original barycentric fan is admitted unchanged.
 * 2. Wrong fan arity, fractional triangle identity, absent weight/support arrays,
 *    missing primary support and sparse/noninteger supports refuse by name.
 * 3. A second coplanar incident face remains legal when both original supports of
 *    the sampled edge are supplied.
 */
export function test_unit_engine_geometry_geometry_attachment_admission(): void {
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
  TestValidator.predicate(
    "support metadata that omits the source triangle refuses",
    throwsError(
      (): IAutoMovieMeshSeparationResult =>
        query(fan, {
          ...options(),
          attachment: { ...attachment, supports: [1] },
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
