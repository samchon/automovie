import {
  buildAutoMovieRegionFace,
  inspectAutoMovieMeshTopology,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshTopology,
  IAutoMovieProfilePoint,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `buildAutoMovieRegionFace` builds one oriented +z surface of a planar region,
 * not the two coincident sides of a zero-height plane.
 *
 * Fixture: the rectangle [-2, 2] x [-1, 1] with the rectangular void [-0.5,
 * 0.5] x [-0.25, 0.25], in metres.
 *
 * Scenarios:
 *
 * 1. Eight vertices with +z normals, UVs equal to their (x, y) metres, 8 triangles
 *    all counter-clockwise from +z, open with 8 boundary edges, none
 *    degenerate.
 * 2. Both rings reversed build the same mesh.
 * 3. A self-crossing boundary is refused ("crosses itself").
 */
export function test_unit_engine_geometry_region_face(): void {
  const p = (x: number, y: number): IAutoMovieProfilePoint => ({ x, y });
  const outer: IAutoMovieProfilePoint[] = [p(-2, -1), p(2, -1), p(2, 1), p(-2, 1)];
  const hole: IAutoMovieProfilePoint[] = [p(-0.5, -0.25), p(0.5, -0.25), p(0.5, 0.25), p(-0.5, 0.25)];
  const face: IAutoMovieMesh = buildAutoMovieRegionFace({ outer, holes: [hole] });
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(face);
  const x: number[] = face.positions;

  // 1.
  TestValidator.equals("vertices", x.length, 24);
  TestValidator.equals(
    "normals",
    face.normals,
    Array.from({ length: 24 }, (_: unknown, i: number): number => (i % 3 === 2 ? 1 : 0)),
  );
  TestValidator.equals(
    "metric UVs",
    face.uvs,
    Array.from({ length: 16 }, (_: unknown, i: number): number => x[(i >> 1) * 3 + (i % 2)]!),
  );
  TestValidator.equals("triangles", face.indices!.length, 24);
  const ix: number[] = face.indices!;
  TestValidator.predicate(
    "counter-clockwise",
    Array.from({ length: ix.length / 3 }, (_: unknown, t: number): boolean => {
      const [a, b, c] = [3 * ix[3 * t]!, 3 * ix[3 * t + 1]!, 3 * ix[3 * t + 2]!];
      return (x[b]! - x[a]!) * (x[c + 1]! - x[a + 1]!) - (x[b + 1]! - x[a + 1]!) * (x[c]! - x[a]!) > 0;
    }).every((ok: boolean): boolean => ok),
  );
  TestValidator.equals(
    "open",
    [topology.watertight, topology.boundaryEdges, topology.degenerate],
    [false, 8, 0],
  );

  // 2.
  TestValidator.equals(
    "winding free",
    buildAutoMovieRegionFace({ outer: [...outer].reverse(), holes: [[...hole].reverse()] }),
    face,
  );

  // 3.
  TestValidator.predicate(
    "self-crossing",
    throwsError((): unknown => buildAutoMovieRegionFace({ outer: [p(0, 0), p(4, 4), p(4, 0), p(0, 3)] }), "crosses itself"),
  );
}
