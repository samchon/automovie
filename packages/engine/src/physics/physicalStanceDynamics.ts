import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { solveAutoMovieQuadraticProgram } from "../math/solveAutoMovieQuadraticProgram";

/**
 * Contact-consistent inverse dynamics of one serial stance chain whose base
 * moves as commanded and whose distal body is held by its contact (Stephens
 * 2011, Chapter 5; Righetti et al. 2013).
 *
 * The chain's joint-space mass matrix comes from the composite-rigid-body
 * algorithm and its bias forces from the recursive Newton-Euler algorithm
 * with zero joint accelerations (Featherstone 2008, Chapters 5 and 6), both
 * in world coordinates at the present pose and velocities. The joint
 * accelerations are the dynamically consistent solution of the contact
 * constraint J q'' = -(J' q') : q'' = -M^-1 J^T (J M^-1 J^T + mu I)^-1 b, b the
 * distal body's spatial acceleration at zero joint acceleration (Khatib
 * 1987), damped where the chain cannot reach a direction. The torques are tau = M q'' + h, where h already carries gravity,
 * the base's acceleration, the velocity products and the contact wrench,
 * -J^T f.
 */
export namespace physicalStanceDynamics {
  /** One rigid body of the chain, world frame. */
  export interface IBody {
    /** Mass, kilograms. */
    mass: number;
    /** Centre of mass, metres. */
    center: IAutoMovieVector3;
    /** Rotational inertia about the centre of mass, kg m^2, row-major 3x3. */
    inertia: readonly number[];
    /** Linear velocity of the centre of mass, metres per second. */
    velocity: IAutoMovieVector3;
    /** Angular velocity, radians per second. */
    angular: IAutoMovieVector3;
  }

  /** One joint of the chain, between the previous body (or the base) and its body. */
  export interface IJoint {
    /** The joint centre, metres. */
    pivot: IAutoMovieVector3;
    /** Its world unit axes, each one degree of freedom. */
    axes: readonly IAutoMovieVector3[];
    /** The bodies it moves that belong to this link: the first is the link body, the rest ride rigidly with it. */
    bodies: readonly IBody[];
  }

  /** The chain's problem. */
  export interface IInput {
    /** The base body the first joint hangs from, with its commanded accelerations. */
    base: IBody & {
      /** Commanded linear acceleration of its centre of mass, metres per second squared. */
      acceleration: IAutoMovieVector3;
      /** Commanded angular acceleration, radians per second squared. */
      angularAcceleration: IAutoMovieVector3;
    };
    /** The joints from the base out to the distal body. */
    joints: readonly IJoint[];
    /** Gravity, metres per second squared. */
    gravity: IAutoMovieVector3;
    /** The contact wrench on the distal link: force, newtons, and moment about `point`, N m. */
    contact?: {
      force: IAutoMovieVector3;
      moment: IAutoMovieVector3;
      point: IAutoMovieVector3;
    };
    /** Whether the distal link is held: false leaves q'' = 0 and returns only h. */
    constrained: boolean;
  }

  /** The chain's solution. */
  export interface IResult {
    /** The torque on each degree of freedom, in joint and axis order, N m. */
    torque: number[];
    /** The joint accelerations, radians per second squared. */
    acceleration: number[];
    /** The joint-space mass matrix, row-major. */
    mass: number[][];
    /** The bias forces at zero joint acceleration. */
    bias: number[];
  }

  /** Solve the chain. */
  export function solve(input: IInput): IResult {
    const axes: {
      joint: number;
      axis: IAutoMovieVector3;
      pivot: IAutoMovieVector3;
    }[] = input.joints.flatMap((joint: IJoint, index: number) =>
      joint.axes.map((axis: IAutoMovieVector3) => ({
        joint: index,
        axis,
        pivot: joint.pivot,
      })),
    );
    const mass: number[][] = crba(input.joints, axes);
    const zero: number[] = axes.map((): number => 0);
    const pass = rnea(input, axes, zero);
    const bias: number[] = pass.torque;
    let acceleration: number[] = zero;
    if (input.constrained && axes.length > 0) {
      const distal: IJoint = input.joints[input.joints.length - 1]!;
      const point: IAutoMovieVector3 = distal.bodies[0]!.center;
      // The distal body's spatial acceleration at zero joint acceleration,
      // angular then linear at its centre of mass.
      const b: number[] = [
        pass.distal.angular.x,
        pass.distal.angular.y,
        pass.distal.angular.z,
        pass.distal.linear.x,
        pass.distal.linear.y,
        pass.distal.linear.z,
      ];
      const jacobian: number[][] = [0, 1, 2, 3, 4, 5].map((row: number) =>
        axes.map(({ axis, pivot }) => {
          const linear: IAutoMovieVector3 = Vector3.cross(
            axis,
            Vector3.subtract(point, pivot),
          );
          return [axis.x, axis.y, axis.z, linear.x, linear.y, linear.z][row]!;
        }),
      );
      const inverseMass: number[][] = invert(mass);
      const product: number[][] = multiply(inverseMass, transpose(jacobian));
      const operational: number[][] = multiply(jacobian, product);
      // Damped least squares: a direction the chain cannot move its distal
      // body in (a foot's yaw on a leg without a vertical axis) leaves the
      // operational matrix singular; a damping of a hundredth of its mean
      // diagonal bounds the response there (Nakamura and Hanafusa 1986;
      // Wampler 1986) and changes nothing the chain can do.
      const damping: number =
        (0.01 *
          operational.reduce(
            (sum: number, row, i: number): number => sum + row[i]!,
            0,
          )) /
        operational.length;
      const lambda: number[] = solveLinear(
        operational.map((row, i: number) =>
          row.map(
            (value: number, j: number) => value + (i === j ? damping : 0),
          ),
        ),
        b.map((value: number): number => -value),
      );
      acceleration = multiplyVector(product, lambda);
    }
    const torque: number[] = multiplyVector(mass, acceleration).map(
      (value: number, index: number): number => value + bias[index]!,
    );
    return { torque, acceleration, mass, bias };
  }

  /**
   * The composite-rigid-body mass matrix: M_kl = a_k . (N_l + (r_l - r_k) x
   * F_l) for axis k proximal to or at axis l, with F_l and N_l the force and
   * the moment about r_l that give the composite body distal of axis l a unit
   * rotation about it.
   */
  export function crba(
    joints: readonly IJoint[],
    axes: readonly {
      joint: number;
      axis: IAutoMovieVector3;
      pivot: IAutoMovieVector3;
    }[],
  ): number[][] {
    const n: number = axes.length;
    const result: number[][] = Array.from({ length: n }, (): number[] =>
      new Array<number>(n).fill(0),
    );
    for (let l: number = 0; l < n; l++) {
      const { joint, axis, pivot } = axes[l]!;
      const composite: IBody[] = joints
        .slice(joint)
        .flatMap((entry: IJoint) => [...entry.bodies]);
      let force: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      let moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const body of composite) {
        const arm: IAutoMovieVector3 = Vector3.subtract(body.center, pivot);
        const linear: IAutoMovieVector3 = Vector3.cross(axis, arm);
        force = Vector3.add(force, Vector3.scale(linear, body.mass));
        moment = Vector3.add(
          moment,
          Vector3.add(
            apply(body.inertia, axis),
            Vector3.cross(arm, Vector3.scale(linear, body.mass)),
          ),
        );
      }
      for (let k: number = 0; k <= l; k++) {
        const other = axes[k]!;
        const value: number = Vector3.dot(
          other.axis,
          Vector3.add(
            moment,
            Vector3.cross(Vector3.subtract(pivot, other.pivot), force),
          ),
        );
        result[k]![l] = value;
        result[l]![k] = value;
      }
    }
    return result;
  }

  /**
   * The recursive Newton-Euler torques for given joint accelerations, with
   * the base's commanded acceleration, gravity, the velocity products and the
   * contact wrench, and the distal body's accelerations.
   */
  export function rnea(
    input: IInput,
    axes: readonly {
      joint: number;
      axis: IAutoMovieVector3;
      pivot: IAutoMovieVector3;
    }[],
    acceleration: readonly number[],
  ): {
    torque: number[];
    distal: { angular: IAutoMovieVector3; linear: IAutoMovieVector3 };
    root: { force: IAutoMovieVector3; moment: IAutoMovieVector3 };
  } {
    // Forward pass: each link body's angular and linear accelerations.
    const links: { angular: IAutoMovieVector3; linear: IAutoMovieVector3[] }[] =
      [];
    let parent: {
      center: IAutoMovieVector3;
      angular: IAutoMovieVector3;
      alpha: IAutoMovieVector3;
      linear: IAutoMovieVector3;
    } = {
      center: input.base.center,
      angular: input.base.angular,
      alpha: input.base.angularAcceleration,
      linear: input.base.acceleration,
    };
    let cursor: number = 0;
    for (const [index, joint] of input.joints.entries()) {
      const body: IBody = joint.bodies[0]!;
      let alpha: IAutoMovieVector3 = Vector3.add(
        parent.alpha,
        Vector3.cross(
          parent.angular,
          Vector3.subtract(body.angular, parent.angular),
        ),
      );
      for (const entry of axes) {
        if (entry.joint !== index) continue;
        alpha = Vector3.add(
          alpha,
          Vector3.scale(entry.axis, acceleration[cursor]!),
        );
        cursor++;
      }
      const toPivot: IAutoMovieVector3 = Vector3.subtract(
        joint.pivot,
        parent.center,
      );
      const pivot: IAutoMovieVector3 = Vector3.add(
        parent.linear,
        Vector3.add(
          Vector3.cross(parent.alpha, toPivot),
          Vector3.cross(parent.angular, Vector3.cross(parent.angular, toPivot)),
        ),
      );
      const linear: IAutoMovieVector3[] = joint.bodies.map(
        (entry: IBody): IAutoMovieVector3 => {
          const arm: IAutoMovieVector3 = Vector3.subtract(
            entry.center,
            joint.pivot,
          );
          return Vector3.add(
            pivot,
            Vector3.add(
              Vector3.cross(alpha, arm),
              Vector3.cross(body.angular, Vector3.cross(body.angular, arm)),
            ),
          );
        },
      );
      links.push({ angular: alpha, linear });
      parent = {
        center: body.center,
        angular: body.angular,
        alpha,
        linear: linear[0]!,
      };
    }
    // Backward pass: the force and moment each joint exerts on its subtree.
    const torque: number[] = new Array<number>(axes.length).fill(0);
    let force: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let previous: IAutoMovieVector3 | undefined;
    for (let index: number = input.joints.length - 1; index >= 0; index--) {
      const joint: IJoint = input.joints[index]!;
      const link = links[index]!;
      // Carry the outer subtree's resultant to this joint's centre.
      if (previous)
        moment = Vector3.add(
          moment,
          Vector3.cross(Vector3.subtract(previous, joint.pivot), force),
        );
      for (const [at, body] of joint.bodies.entries()) {
        const inertial: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(link.linear[at]!, input.gravity),
          body.mass,
        );
        force = Vector3.add(force, inertial);
        moment = Vector3.add(
          moment,
          Vector3.add(
            Vector3.add(
              apply(body.inertia, link.angular),
              Vector3.cross(body.angular, apply(body.inertia, body.angular)),
            ),
            Vector3.cross(Vector3.subtract(body.center, joint.pivot), inertial),
          ),
        );
      }
      if (index === input.joints.length - 1 && input.contact) {
        force = Vector3.subtract(force, input.contact.force);
        moment = Vector3.subtract(
          moment,
          Vector3.add(
            input.contact.moment,
            Vector3.cross(
              Vector3.subtract(input.contact.point, joint.pivot),
              input.contact.force,
            ),
          ),
        );
      }
      axes.forEach((entry, k: number): void => {
        if (entry.joint === index) torque[k] = Vector3.dot(entry.axis, moment);
      });
      previous = joint.pivot;
    }
    const distal = links[links.length - 1]!;
    return {
      torque,
      distal: { angular: distal.angular, linear: distal.linear[0]! },
      root: { force, moment },
    };
  }

  /** One stance leg of the joint problem. */
  export interface ILeg {
    /** Its joints from the hip out to the foot. */
    joints: readonly IJoint[];
    /** The points its foot may bear on, each with its friction coefficient; empty for a foot that bears nothing. */
    points: readonly { point: IAutoMovieVector3; friction: number }[];
    /** The most normal force its points may bear together, newtons. */
    load: number;
    /** A held foot's stabilized contact target: spatial velocity and pose error from its latch, angular then linear. */
    held?: { velocity: readonly number[]; error: readonly number[] };
    /** Whether the leg can turn its foot about the vertical; without it the foot's yaw moment is zero and its yaw motion row dropped. */
    yaw: boolean;
    /** For a leg that can, the bound on its foot's vertical moment about a centre, |M_y| <= limit F_y. */
    twist?: { center: IAutoMovieVector3; limit: number };
    /** Each axis's torque bounds, N m, in joint and axis order. */
    bounds: readonly { lower: number; upper: number }[];
  }

  /** The joint problem: the base, its stance legs and the balance task. */
  export interface IStance {
    /** The base: every segment outside the stance legs, as one rigid body. */
    base: IBody;
    /** The stance legs. */
    legs: readonly ILeg[];
    /** Gravity, metres per second squared. */
    gravity: IAutoMovieVector3;
    /** The contact rows' stabilization gains. */
    stiffness: number;
    damping: number;
    /** The balance task: the desired total contact force and its moment about `origin`. */
    task: {
      force: IAutoMovieVector3;
      moment: IAutoMovieVector3;
      origin: IAutoMovieVector3;
    };
    /** Articulated degrees of freedom outside the stance legs, hanging from the base (`IBranches`); absent keeps them in the rigid base. */
    branches?: IBranches;
    /** The previous solve's point forces, by leg and point, which the change penalty holds the new ones near. */
    previous?: readonly (readonly IAutoMovieVector3[])[];
  }

  /** The joint problem's solution. */
  export interface ISolution {
    /** Each leg's joint accelerations. */
    acceleration: number[][];
    /** Each leg's point forces, newtons, in point order. */
    forces: IAutoMovieVector3[][];
    /** Each leg's torques at the solve instant. */
    torque: number[][];
    /** The base's acceleration: linear at its centre of mass, then angular. */
    base: number[];
    /** The branches' accelerations and torques, when there are branches. */
    branches?: { acceleration: number[]; torque: number[] };
  }

  /**
   * Degrees of freedom outside the stance legs that hang from the base, such
   * as the spine and arms, supplied by their own model. `evaluate` returns,
   * for the base's linear (at its centre of mass) and angular accelerations
   * and the branches' joint accelerations, the force the base exerts on the
   * branches and its moment about the base's centre of mass, and each branch
   * joint's torque; with `moving` false, velocities and gravity are removed.
   */
  export interface IBranches {
    /** Their number of degrees of freedom. */
    size: number;
    /** Their resultant on the base and their joint torques. */
    evaluate(input: {
      linear: IAutoMovieVector3;
      angular: IAutoMovieVector3;
      acceleration: readonly number[];
      moving: boolean;
      gravity: IAutoMovieVector3;
    }): {
      force: IAutoMovieVector3;
      moment: IAutoMovieVector3;
      torque: number[];
    };
    /** Soft posture rows over their accelerations: weights over the branch degrees of freedom, and the target. */
    posture: readonly { weights: readonly number[]; target: number }[];
    /** The posture rows' weight. */
    weight: number;
    /** Each degree of freedom's torque bounds, N m. */
    bounds: readonly { lower: number; upper: number }[];
  }

  /**
   * Solve the stance's joint accelerations and contact forces together in
   * one quadratic program over [q'', lambda] (TSID's acceleration-force
   * formulation; Herzog et al. 2016; Kuindersma et al. 2014): the base's six
   * rows M_l q'' + N_l = J_l^T lambda hold exactly; every point's force stays
   * in its friction pyramid and each foot under its load bound; the joint
   * torques tau = M_a q'' + N_a - J_a^T lambda stay within their bounds; a foot on a leg without a vertical
   * axis carries no yaw moment and drops its yaw motion row (Feng et al.
   * 2013, Section II); each held foot's acceleration tracks its stabilized
   * latch, and the total contact wrench the balance task, as soft rows.
   *
   * @returns The solution, or undefined when the program does not solve.
   */
  export function stance(input: IStance): ISolution | undefined {
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const legAxes = input.legs.map((leg: ILeg) =>
      leg.joints.flatMap((joint: IJoint, index: number) =>
        joint.axes.map((axis: IAutoMovieVector3) => ({
          joint: index,
          axis,
          pivot: joint.pivot,
        })),
      ),
    );
    const counts: number[] = legAxes.map((axes) => axes.length);
    const joints: number = counts.reduce(
      (sum: number, count: number) => sum + count,
      0,
    );
    const branchSize: number = input.branches?.size ?? 0;
    const size: number = 6 + joints + branchSize;
    const pointCounts: number[] = input.legs.map(
      (leg: ILeg) => leg.points.length,
    );
    const forces: number =
      3 * pointCounts.reduce((sum: number, count: number) => sum + count, 0);
    const still = (body: IBody): IBody => ({ ...body, angular: zero });
    const evaluate = (
      acceleration: readonly number[],
      moving: boolean,
      lambda?: readonly IAutoMovieVector3[][],
    ): { residual: number[]; feet: number[][] } => {
      const linear: IAutoMovieVector3 = {
        x: acceleration[0]!,
        y: acceleration[1]!,
        z: acceleration[2]!,
      };
      const angular: IAutoMovieVector3 = {
        x: acceleration[3]!,
        y: acceleration[4]!,
        z: acceleration[5]!,
      };
      const field: IAutoMovieVector3 = moving ? input.gravity : zero;
      const base: IBody = moving ? input.base : still(input.base);
      let force: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(linear, field),
        base.mass,
      );
      let moment: IAutoMovieVector3 = Vector3.add(
        apply(base.inertia, angular),
        Vector3.cross(base.angular, apply(base.inertia, base.angular)),
      );
      const torques: number[] = [];
      const feet: number[][] = [];
      let offset: number = 6;
      input.legs.forEach((leg: ILeg, index: number): void => {
        const chain: IJoint[] = moving
          ? [...leg.joints]
          : leg.joints.map((joint: IJoint) => ({
              ...joint,
              bodies: joint.bodies.map(still),
            }));
        const applied: IAutoMovieVector3[] = lambda?.[index] ?? [];
        const point: IAutoMovieVector3 =
          leg.points[0]?.point ?? leg.joints[leg.joints.length - 1]!.pivot;
        const pass = rnea(
          {
            base: {
              ...base,
              acceleration: linear,
              angularAcceleration: angular,
            },
            joints: chain,
            gravity: field,
            ...(applied.length > 0
              ? {
                  contact: {
                    force: applied.reduce(
                      (sum, f) => Vector3.add(sum, f),
                      zero,
                    ),
                    moment: applied.reduce(
                      (sum, f, k: number) =>
                        Vector3.add(
                          sum,
                          Vector3.cross(
                            Vector3.subtract(leg.points[k]!.point, point),
                            f,
                          ),
                        ),
                      zero,
                    ),
                    point,
                  },
                }
              : {}),
            constrained: false,
          },
          legAxes[index]!,
          acceleration.slice(offset, offset + counts[index]!),
        );
        torques.push(...pass.torque);
        force = Vector3.add(force, pass.root.force);
        moment = Vector3.add(
          moment,
          Vector3.add(
            pass.root.moment,
            Vector3.cross(
              Vector3.subtract(leg.joints[0]!.pivot, base.center),
              pass.root.force,
            ),
          ),
        );
        if (leg.held)
          feet.push([
            pass.distal.angular.x,
            pass.distal.angular.y,
            pass.distal.angular.z,
            pass.distal.linear.x,
            pass.distal.linear.y,
            pass.distal.linear.z,
          ]);
        offset += counts[index]!;
      });
      // The branches hanging from the base add their resultant to its rows
      // and their joint torques after the legs'.
      if (input.branches) {
        const branch = input.branches.evaluate({
          linear,
          angular,
          acceleration: acceleration.slice(6 + joints),
          moving,
          gravity: input.gravity,
        });
        force = Vector3.add(force, branch.force);
        moment = Vector3.add(moment, branch.moment);
        torques.push(...branch.torque);
      }
      return {
        residual: [
          force.x,
          force.y,
          force.z,
          moment.x,
          moment.y,
          moment.z,
          ...torques,
        ],
        feet,
      };
    };
    const zeros: number[] = new Array<number>(size).fill(0);
    const rest = evaluate(zeros, true);
    const accelerationColumns = Array.from(
      { length: size },
      (_: unknown, k: number) =>
        evaluate(
          Array.from({ length: size }, (__: unknown, i: number): number =>
            i === k ? 1 : 0,
          ),
          false,
        ),
    );
    // Each point force's column: the base and torque rows it moves.
    const forceColumns: {
      leg: number;
      point: number;
      axis: number;
      residual: number[];
    }[] = [];
    input.legs.forEach((leg: ILeg, index: number): void => {
      leg.points.forEach((_, k: number): void => {
        for (let axis: number = 0; axis < 3; axis++) {
          const lambda: IAutoMovieVector3[][] = input.legs.map(
            (other: ILeg, j: number) =>
              other.points.map(
                (__, m: number): IAutoMovieVector3 =>
                  j === index && m === k
                    ? {
                        x: axis === 0 ? 1 : 0,
                        y: axis === 1 ? 1 : 0,
                        z: axis === 2 ? 1 : 0,
                      }
                    : zero,
              ),
          );
          forceColumns.push({
            leg: index,
            point: k,
            axis,
            residual: evaluate(zeros, false, lambda).residual,
          });
        }
      });
    });
    const held: number = rest.feet.length;
    const slackContact: number = size + forces;
    const slackTask: number = slackContact + 6 * held;
    const all: number[] = [...Array(size + forces).keys()];
    const residualRow = (r: number): number[] => [
      ...accelerationColumns.map((column) => column.residual[r]!),
      ...forceColumns.map((column) => column.residual[r]!),
    ];
    type Row = {
      indices: number[];
      weights: number[];
      lower: number | null;
      upper: number | null;
    };
    const rows: Row[] = [];
    for (let r: number = 0; r < 6; r++)
      rows.push({
        indices: all,
        weights: residualRow(r),
        lower: -rest.residual[r]!,
        upper: -rest.residual[r]!,
      });
    let axis: number = 0;
    input.legs.forEach((leg: ILeg): void => {
      leg.bounds.forEach((bound): void => {
        const offset: number = rest.residual[6 + axis]!;
        rows.push({
          indices: all,
          weights: residualRow(6 + axis),
          lower: bound.lower - offset,
          upper: bound.upper - offset,
        });
        axis++;
      });
    });
    input.branches?.bounds.forEach((bound, k: number): void => {
      const offset: number = rest.residual[6 + joints + k]!;
      rows.push({
        indices: all,
        weights: residualRow(6 + joints + k),
        lower: bound.lower - offset,
        upper: bound.upper - offset,
      });
    });
    // Friction pyramids, load bounds and yaw.
    let column: number = size;
    input.legs.forEach((leg: ILeg): void => {
      const first: number = column;
      for (const { friction } of leg.points) {
        rows.push({
          indices: [column + 1],
          weights: [1],
          lower: 0,
          upper: null,
        });
        for (const sx of [-1, 1])
          for (const sz of [-1, 1])
            rows.push({
              indices: [column, column + 1, column + 2],
              weights: [sx, -friction, sz],
              lower: null,
              upper: 0,
            });
        column += 3;
      }
      if (leg.points.length === 0) return;
      const normals: number[] = leg.points.map(
        (_, k: number) => first + 3 * k + 1,
      );
      // A bearing foot keeps a small normal force (TSID's fMin, 5 N) and stays
      // under its load bound.
      const floor: number = Math.min(5, Math.max(0, leg.load));
      rows.push({
        indices: normals,
        weights: normals.map(() => 1),
        lower: floor,
        upper: Math.max(floor, leg.load),
      });
      const center: IAutoMovieVector3 =
        leg.twist?.center ??
        Vector3.scale(
          leg.points.reduce((sum, p) => Vector3.add(sum, p.point), zero),
          1 / leg.points.length,
        );
      const indices: number[] = leg.points.flatMap((_, k: number) => [
        first + 3 * k,
        first + 3 * k + 1,
        first + 3 * k + 2,
      ]);
      const twist: number[] = leg.points.flatMap((p) => [
        p.point.z - center.z,
        0,
        -(p.point.x - center.x),
      ]);
      if (!leg.yaw) rows.push({ indices, weights: twist, lower: 0, upper: 0 });
      else if (leg.twist) {
        const limit: number[] = leg.points.flatMap(() => [
          0,
          leg.twist!.limit,
          0,
        ]);
        rows.push({
          indices,
          weights: twist.map((v: number, k: number) => v - limit[k]!),
          lower: null,
          upper: 0,
        });
        rows.push({
          indices,
          weights: twist.map((v: number, k: number) => v + limit[k]!),
          lower: 0,
          upper: null,
        });
      }
    });
    // Held feet's stabilized contact rows, soft; no yaw row without a yaw axis.
    let foot: number = 0;
    for (const leg of input.legs) {
      if (!leg.held) continue;
      for (let c: number = 0; c < 6; c++) {
        if (c === 1 && !leg.yaw) continue;
        const target: number =
          -input.damping * leg.held.velocity[c]! -
          input.stiffness * leg.held.error[c]!;
        rows.push({
          indices: [...Array(size).keys(), slackContact + 6 * foot + c],
          weights: [
            ...accelerationColumns.map((entry) => entry.feet[foot]![c]!),
            -1,
          ],
          lower: target - rest.feet[foot]![c]!,
          upper: target - rest.feet[foot]![c]!,
        });
      }
      foot++;
    }
    // The balance task on the total contact wrench, soft.
    const forceIndices: number[] = [...Array(forces).keys()].map(
      (k: number) => size + k,
    );
    const flat: { point: IAutoMovieVector3 }[] = input.legs.flatMap(
      (leg: ILeg) => leg.points.map((p) => ({ point: p.point })),
    );
    const desired: number[] = [
      input.task.force.x,
      input.task.force.y,
      input.task.force.z,
      input.task.moment.x,
      input.task.moment.y,
      input.task.moment.z,
    ];
    for (let r: number = 0; r < 6; r++) {
      const weights: number[] = flat.flatMap(({ point }) => {
        const arm: IAutoMovieVector3 = Vector3.subtract(
          point,
          input.task.origin,
        );
        return [0, 1, 2].map((a: number): number => {
          if (r < 3) return r === a ? 1 : 0;
          const unit: IAutoMovieVector3 = {
            x: a === 0 ? 1 : 0,
            y: a === 1 ? 1 : 0,
            z: a === 2 ? 1 : 0,
          };
          const m: IAutoMovieVector3 = Vector3.cross(arm, unit);
          return [m.x, m.y, m.z][r - 3]!;
        });
      });
      rows.push({
        indices: [...forceIndices, slackTask + r],
        weights: [...weights, -1],
        lower: desired[r]!,
        upper: desired[r]!,
      });
    }
    // Each point force is regularized toward its share of the weight, its
    // tangential part a thousand times heavier, TSID's ratio (contact-6d), and held near
    // the previous solve's (Feng et al. 2013, Table I); the held feet's contact
    // rows are near hard (TSID's infinite contact weight).
    const weight: number = Math.max(1, Math.abs(input.task.force.y));
    const share: number =
      flat.length > 0 ? input.task.force.y / flat.length : 0;
    const normalWeight: number = 1e-6;
    const tangentialWeight: number = 1e-3;
    const changeWeight: number = 1e-6;
    const previous: number[] = input.legs.flatMap((leg: ILeg, index: number) =>
      leg.points.flatMap((_, k: number) => {
        const p: IAutoMovieVector3 | undefined = input.previous?.[index]?.[k];
        return p ? [p.x, p.y, p.z] : [Number.NaN, Number.NaN, Number.NaN];
      }),
    );
    const forceDiagonal: number[] = previous.map(
      (value: number, k: number): number =>
        (k % 3 === 1 ? normalWeight : tangentialWeight) +
        (Number.isFinite(value) ? changeWeight : 0),
    );
    const forceLinear: number[] = previous.map(
      (value: number, k: number): number =>
        -(k % 3 === 1 ? normalWeight * share : 0) -
        (Number.isFinite(value) ? changeWeight * value : 0),
    );
    // The branches' posture rows, soft through their own slack.
    const slackPosture: number = slackTask + 6;
    const posture = input.branches?.posture ?? [];
    posture.forEach((row, k: number): void => {
      rows.push({
        indices: [
          ...row.weights.map((_: number, c: number): number => 6 + joints + c),
          slackPosture + k,
        ],
        weights: [...row.weights, -1],
        lower: row.target,
        upper: row.target,
      });
    });
    const result = solveAutoMovieQuadraticProgram({
      diagonal: [
        ...new Array<number>(6).fill(1e-6),
        ...new Array<number>(joints + branchSize).fill(1e-4),
        ...forceDiagonal,
        ...new Array<number>(6 * held).fill(1e6),
        ...[1, 1, 1, 1, 1, 1].map((): number => 1e2 / (weight * weight)),
        ...posture.map((): number => input.branches!.weight),
      ],
      linear: [
        ...new Array<number>(size).fill(0),
        ...forceLinear,
        ...new Array<number>(6 * held + 6 + posture.length).fill(0),
      ],
      rows,
    });
    if (
      (result.status !== 1 && result.status !== 7 && result.status !== 10) ||
      result.maximumViolation > 1e-6 ||
      !result.primal.every(Number.isFinite)
    )
      return undefined;
    const acceleration: number[][] = [];
    const solvedForces: IAutoMovieVector3[][] = [];
    const torque: number[][] = [];
    let at: number = 0;
    let fc: number = size;
    input.legs.forEach((leg: ILeg, index: number): void => {
      acceleration.push(result.primal.slice(6 + at, 6 + at + counts[index]!));
      solvedForces.push(
        leg.points.map((): IAutoMovieVector3 => {
          const f: IAutoMovieVector3 = {
            x: result.primal[fc]!,
            y: result.primal[fc + 1]!,
            z: result.primal[fc + 2]!,
          };
          fc += 3;
          return f;
        }),
      );
      const values: number[] = [];
      for (let k: number = 0; k < counts[index]!; k++) {
        const r: number = 6 + at + k;
        values.push(
          rest.residual[r]! +
            residualRow(r).reduce(
              (sum: number, w: number, c: number) =>
                sum + w * result.primal[c]!,
              0,
            ),
        );
      }
      torque.push(values);
      at += counts[index]!;
    });
    const torqueAt = (r: number): number =>
      rest.residual[r]! +
      residualRow(r).reduce(
        (sum: number, w: number, c: number) => sum + w * result.primal[c]!,
        0,
      );
    return {
      acceleration,
      forces: solvedForces,
      torque,
      base: result.primal.slice(0, 6),
      ...(input.branches
        ? {
            branches: {
              acceleration: result.primal.slice(6 + joints, size),
              torque: [...Array(branchSize).keys()].map((k: number) =>
                torqueAt(6 + joints + k),
              ),
            },
          }
        : {}),
    };
  }

  /**
   * One leg's torques now from the solved accelerations and point forces,
   * without re-solving: tau = M_a q''* + h_a(q, q') - J_a^T lambda*, by one
   * recursive Newton-Euler pass at the present state.
   */
  export function refresh(
    base: IBody & {
      acceleration: IAutoMovieVector3;
      angularAcceleration: IAutoMovieVector3;
    },
    joints: readonly IJoint[],
    gravity: IAutoMovieVector3,
    points: readonly IAutoMovieVector3[],
    forces: readonly IAutoMovieVector3[],
    acceleration: readonly number[],
  ): number[] {
    const axes = joints.flatMap((joint: IJoint, index: number) =>
      joint.axes.map((axis: IAutoMovieVector3) => ({
        joint: index,
        axis,
        pivot: joint.pivot,
      })),
    );
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const point: IAutoMovieVector3 = points[0] ?? zero;
    return rnea(
      {
        base,
        joints,
        gravity,
        ...(forces.length > 0
          ? {
              contact: {
                force: forces.reduce((sum, f) => Vector3.add(sum, f), zero),
                moment: forces.reduce(
                  (sum, f, k: number) =>
                    Vector3.add(
                      sum,
                      Vector3.cross(Vector3.subtract(points[k]!, point), f),
                    ),
                  zero,
                ),
                point,
              },
            }
          : {}),
        constrained: false,
      },
      axes,
      acceleration,
    ).torque;
  }
  /** A row-major 3x3 matrix applied to a vector. */
  function apply(
    matrix: readonly number[],
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return {
      x: matrix[0]! * vector.x + matrix[1]! * vector.y + matrix[2]! * vector.z,
      y: matrix[3]! * vector.x + matrix[4]! * vector.y + matrix[5]! * vector.z,
      z: matrix[6]! * vector.x + matrix[7]! * vector.y + matrix[8]! * vector.z,
    };
  }

  function transpose(matrix: readonly (readonly number[])[]): number[][] {
    return matrix[0]!.map((_: number, column: number) =>
      matrix.map((row) => row[column]!),
    );
  }

  function multiply(
    a: readonly (readonly number[])[],
    b: readonly (readonly number[])[],
  ): number[][] {
    return a.map((row) =>
      b[0]!.map((_: number, column: number) =>
        row.reduce(
          (sum: number, value: number, k: number) =>
            sum + value * b[k]![column]!,
          0,
        ),
      ),
    );
  }

  function multiplyVector(
    a: readonly (readonly number[])[],
    v: readonly number[],
  ): number[] {
    return a.map((row) =>
      row.reduce(
        (sum: number, value: number, k: number) => sum + value * v[k]!,
        0,
      ),
    );
  }

  /** Gaussian elimination with partial pivoting and a small Tikhonov floor for a near-singular system. */
  function solveLinear(
    matrix: readonly (readonly number[])[],
    rhs: readonly number[],
  ): number[] {
    const n: number = rhs.length;
    const scale: number = Math.max(
      1e-12,
      ...matrix.map((row, i: number) => Math.abs(row[i]!)),
    );
    const a: number[][] = matrix.map((row, i: number) => [
      ...row.map(
        (value: number, j: number) => value + (i === j ? 1e-9 * scale : 0),
      ),
      rhs[i]!,
    ]);
    for (let column: number = 0; column < n; column++) {
      let pivot: number = column;
      for (let row: number = column + 1; row < n; row++)
        if (Math.abs(a[row]![column]!) > Math.abs(a[pivot]![column]!))
          pivot = row;
      [a[column], a[pivot]] = [a[pivot]!, a[column]!];
      const lead: number = a[column]![column]!;
      if (Math.abs(lead) < 1e-300) continue;
      for (let row: number = 0; row < n; row++) {
        if (row === column) continue;
        const factor: number = a[row]![column]! / lead;
        for (let k: number = column; k <= n; k++)
          a[row]![k]! -= factor * a[column]![k]!;
      }
    }
    return a.map((row, i: number) =>
      Math.abs(row[i]!) < 1e-300 ? 0 : row[n]! / row[i]!,
    );
  }

  function invert(matrix: readonly (readonly number[])[]): number[][] {
    const n: number = matrix.length;
    const columns: number[][] = Array.from(
      { length: n },
      (_: unknown, j: number) =>
        solveLinear(
          matrix,
          Array.from({ length: n }, (__: unknown, i: number) =>
            i === j ? 1 : 0,
          ),
        ),
    );
    return transpose(columns);
  }
}
