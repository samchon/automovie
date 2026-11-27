import type {
  IAutoMovieDistributePhysicalSupportWrench,
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticProgram,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { solveAutoMovieQuadraticProgram } from "../../math/internal/solveAutoMovieQuadraticProgram";

/*
 * Allocate a requested floating-base wrench at actual floor points. Unilateral
 * normal forces and the inscribed |fx|+|fz|<=mu*fy pyramid imply Coulomb
 * friction even for diagonal demand. Moments use each actual lever, including
 * yaw. Caron et al. 2015, Eqs.2–7, distinguish these conditions from CoP alone.
 * This bounded virtual-model allocation is not full inverse dynamics: native
 * constraints and motor caps still determine the actual response. Returned
 * wrench residuals expose infeasible demand rather than inventing support.
 */
export function distributePhysicalSupportWrench(
  input: IAutoMovieDistributePhysicalSupportWrench.IInput,
): IAutoMovieDistributePhysicalSupportWrench.IResult {
  if (
    input.maximumForce < 0 ||
    input.points.length > 1024 ||
    input.points.some(
      (point: (typeof input.points)[number]): boolean => point.friction < 0,
    )
  )
    throw new Error("Invalid support wrench allocation");
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (!input.points.length || input.maximumForce === 0)
    return {
      forces: [],
      force: zero,
      torque: zero,
      residual: { force: { ...input.force }, torque: { ...input.torque } },
    };
  const levers: IAutoMovieVector3[] = input.points.map(
    (point: (typeof input.points)[number]): IAutoMovieVector3 =>
      Vector3.subtract(point.point, input.origin),
  );
  const length: number = Math.max(
    Number.EPSILON,
    ...levers.map(Vector3.length),
  );
  const scale: number = Math.max(
    1,
    Vector3.length(input.force),
    Vector3.length(input.torque) / length,
  );
  const size: number = input.points.length * 3;
  const rows: IAutoMovieQuadraticRow[] = [];
  const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
  const design: number[][] = Array.from({ length: 6 }, (): number[] =>
    new Array<number>(size).fill(0),
  );
  for (const [index, contact] of input.points.entries()) {
    for (const [axis, name] of axes.entries()) {
      design[axis]![3 * index + axis] = 1;
      const direction: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      direction[name] = 1;
      const moment: IAutoMovieVector3 = Vector3.scale(
        Vector3.cross(levers[index]!, direction),
        1 / length,
      );
      for (const [row, coordinate] of axes.entries())
        design[3 + row]![3 * index + axis] = moment[coordinate];
    }
    rows.push({
      indices: [3 * index + 1],
      weights: [1],
      lower: 0,
      upper: null,
    });
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        rows.push({
          indices: [3 * index, 3 * index + 1, 3 * index + 2],
          weights: [x, -contact.friction, z],
          lower: null,
          upper: 0,
        });
  }
  rows.push({
    indices: input.points.map(
      (_: unknown, index: number): number => 3 * index + 1,
    ),
    weights: input.points.map((): number => 1),
    lower: 0,
    upper: input.maximumForce / scale,
  });
  const desired: number[] = [
    ...axes.map(
      (axis: (typeof axes)[number]): number => input.force[axis] / scale,
    ),
    ...axes.map(
      (axis: (typeof axes)[number]): number =>
        input.torque[axis] / (length * scale),
    ),
  ];
  for (const [index, coefficients] of design.entries())
    rows.push({
      indices: [
        ...coefficients.map((_: number, column: number): number => column),
        size + index,
      ],
      weights: [...coefficients, -1],
      lower: desired[index]!,
      upper: desired[index]!,
    });

  // Each support's moment about its own points' centroid, one auxiliary
  // variable per axis: the contact wrench split into its resultant and its
  // moment about the contact (Caron, Pham and Nakamura 2015, eq. 2). A
  // support pressing its load off its centre moves its centre of pressure
  // toward its edge, where any realization error tips it; penalizing that
  // moment like the forces carries the requested moment by the load shared
  // between supports first.
  const supports: number[][] = [
    ...new Set(
      input.points.map(
        (point: (typeof input.points)[number]): string => point.bone,
      ),
    ),
  ].map((bone: string): number[] =>
    input.points
      .map((point: (typeof input.points)[number], index: number): number =>
        point.bone === bone ? index : -1,
      )
      .filter((index: number): boolean => index >= 0),
  );
  supports.forEach((members: number[], group: number): void => {
    const centroid: IAutoMovieVector3 = Vector3.scale(
      members.reduce(
        (sum: IAutoMovieVector3, index: number): IAutoMovieVector3 =>
          Vector3.add(sum, input.points[index]!.point),
        { x: 0, y: 0, z: 0 },
      ),
      1 / members.length,
    );
    for (const [row, coordinate] of axes.entries()) {
      const indices: number[] = [];
      const weights: number[] = [];
      for (const index of members)
        for (const [axis, name] of axes.entries()) {
          const direction: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
          direction[name] = 1;
          indices.push(3 * index + axis);
          weights.push(
            Vector3.cross(
              Vector3.subtract(input.points[index]!.point, centroid),
              direction,
            )[coordinate] / length,
          );
        }
      rows.push({
        indices: [...indices, size + 6 + 3 * group + row],
        weights: [...weights, -1],
        lower: 0,
        upper: 0,
      });
    }
  });

  // Dimensionless wrench error is primary; sqrt(machine epsilon) provides a
  // small explicit penalty on the forces and on each support's own moment to
  // select among redundant contact forces. Its resulting wrench bias remains
  // measured in the returned SI residual.
  const result: IAutoMovieSolveQuadraticProgram.IResult =
    solveAutoMovieQuadraticProgram({
      diagonal: [
        ...new Array<number>(size).fill(Math.sqrt(Number.EPSILON)),
        ...new Array<number>(6).fill(1),
        ...new Array<number>(3 * supports.length).fill(
          Math.sqrt(Number.EPSILON),
        ),
      ],
      linear: new Array<number>(size + 6 + 3 * supports.length).fill(0),
      rows,
    });
  if (result.status !== 1 || result.maximumViolation > 1e-6)
    throw new Error(
      `Support wrench solve failed: ${result.status}/${result.maximumViolation}`,
    );
  const forces: {
    bone: string;
    point: IAutoMovieVector3;
    force: IAutoMovieVector3;
    friction: number;
  }[] = input.points.map(
    (
      point: (typeof input.points)[number],
      index: number,
    ): {
      bone: string;
      point: IAutoMovieVector3;
      force: IAutoMovieVector3;
      friction: number;
    } => {
      const force: IAutoMovieVector3 = {
        x: result.primal[3 * index]! * scale,
        y: Math.max(0, result.primal[3 * index + 1]! * scale),
        z: result.primal[3 * index + 2]! * scale,
      };
      const tangent: number = Math.abs(force.x) + Math.abs(force.z);
      const ratio: number =
        tangent > 0 ? Math.min(1, (point.friction * force.y) / tangent) : 1;
      force.x *= ratio;
      force.z *= ratio;
      return { ...point, force };
    },
  );

  // A native optimization tolerance does not authorize a negative normal force
  // or friction violation. Project its rounding error before measuring SI merit.
  const normal: number = forces.reduce(
    (sum: number, point: (typeof forces)[number]): number =>
      sum + point.force.y,
    0,
  );
  if (normal > input.maximumForce)
    for (const contact of forces)
      contact.force = Vector3.scale(contact.force, input.maximumForce / normal);
  const force: IAutoMovieVector3 = forces.reduce(
    (
      sum: IAutoMovieVector3,
      point: (typeof forces)[number],
    ): IAutoMovieVector3 => Vector3.add(sum, point.force),
    { ...zero },
  );
  const torque: IAutoMovieVector3 = forces.reduce(
    (
      sum: IAutoMovieVector3,
      point: (typeof forces)[number],
    ): IAutoMovieVector3 =>
      Vector3.add(
        sum,
        Vector3.cross(Vector3.subtract(point.point, input.origin), point.force),
      ),
    { ...zero },
  );
  return {
    forces,
    force,
    torque,
    residual: {
      force: Vector3.subtract(input.force, force),
      torque: Vector3.subtract(input.torque, torque),
    },
  };
}
