import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanInteractionMesh,
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanInteractionMesh, HumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The mesh adaptation keeps the requested point relations and returns an
 * oriented element even when both axis-aligned endpoints admit an invalid
 * straight interpolation. Li et al. 2020, technical supplement §4,
 * motivates a continuous compression bound before the line search.
 *
 * Scenarios:
 * 1. A right tetrahedron's requested X and Y edges are reversed and its
 *    Y edge shortened to one third. Both endpoints have positive volume,
 *    but their straight path has determinant (1−2t)(1−4t/3). The first
 *    20% volume crossing is (25−sqrt(145))/40. Supply a fully oriented
 *    start partway around the feasible rotational route and check the
 *    three final relative contact vectors and the element's volume sign.
 * 2. An actually inverted start on the same mesh cannot be used for an
 *    otherwise unchanged shape. The output retains the reference axes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the independently determined contact vectors, orientation and starting cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public adaptation on explicit tetrahedra and compares the resulting relative coordinates and signed volume. A returned inversion or missed constraint fails. Intermediate line-search quantities are not part of the result.
 * @evidence contracts/development/testing.md#independent-expectations A diagonal tetrahedron's determinant is the product of the signed axis lengths. The rotational seed is positively oriented and every final contact vector follows from the authored target geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases One feasible rotated and compressed target and one inadmissible starting guess for the unchanged target. The real two-body test separately owns measured retargeting and the Delaunay structure.
 * @evidence contracts/development/testing.md#execution-ownership One discovered in-memory spec calls the public motion package on authored points without a host.
 */
export function test_human_motion_interaction_mesh_step(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const up: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const reference: IAutoMovieVector3[] = [
    zero, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, up,
  ];
  const mesh: IAutoMovieTetrahedralizeDelaunay.IMesh = {
    points: reference,
    tetrahedra: [[0, 1, 2, 3]],
  };
  const target: IAutoMovieVector3[] = [
    zero, { x: -1, y: 0, z: 0 }, { x: 0, y: -1 / 3, z: 0 }, up,
  ];
  // Rotate the shorter-edged shape 135 degrees about Z. The last 45
  // degrees to the requested axes have a strictly positive determinant.
  const root: number = Math.SQRT1_2;
  const turned: IAutoMovieVector3[] = [
    zero, { x: -root, y: root, z: 0 }, { x: -root / 3, y: -root / 3, z: 0 }, up,
  ];
  const flipped: IAutoMovieVector3[] = [
    zero, reference[2]!, reference[1]!, up,
  ];
  check(reference, mesh, turned, target);
  check(reference, mesh, flipped, reference);
}

/** Read relative point contacts and orientation from public adaptation. */
function check(
  reference: readonly IAutoMovieVector3[],
  mesh: IAutoMovieTetrahedralizeDelaunay.IMesh,
  start: readonly IAutoMovieVector3[],
  target: readonly IAutoMovieVector3[],
): void {
  const contacts: IAutoMovieMotionHumanInteractionMesh.IContact[] = target
    .slice(1)
    .map((offset: IAutoMovieVector3, index: number): IAutoMovieMotionHumanInteractionMesh.IContact =>
      ({ a: index + 1, b: 0, offset }),
    );
  const result: IAutoMovieMotionHumanInteractionMesh.IResult =
    HumanInteractionMesh.adapt({ reference, mesh, start, bones: [], contacts });
  const edges: IAutoMovieVector3[] = result.points.slice(1).map(
    (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(point, result.points[0]!),
  );
  TestValidator.predicate(
    "the public deformation satisfies its contacts and remains oriented",
    edges.length === contacts.length &&
      Vector3.dot(edges[0]!, Vector3.cross(edges[1]!, edges[2]!)) > 0 &&
      edges.every(
        (edge: IAutoMovieVector3, index: number): boolean =>
          Vector3.length(Vector3.subtract(edge, target[index + 1]!)) <= HumanVerdicts.SKIN,
      ),
  );
}
