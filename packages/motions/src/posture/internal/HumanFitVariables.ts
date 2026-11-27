import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanQuadraticProgram,
} from "@automovie/interface";

/**
 * The variables a whole-body fit (`HumanBodyFit`) moves a posture by, as the
 * Jacobian names them (`HumanJacobian.IVariable`): read from a posture and
 * written back over it, with each one's range, the unit it is solved in, its
 * weight in the objective, its resolution and its trust region.
 *
 * A place is solved in centimetres and an angle in degrees, so the convex
 * step's curvature is near the identity; a centimetre of the root's place
 * weighs as much as a degree of a joint, and a degree of its heading twice as
 * much.
 */
export namespace HumanFitVariables {
  /**
   * The joint angles of the whole body a fit moves: the trunk, the neck, the
   * head and the four limbs, each a bone and its axis (flexion, abduction,
   * twist). The trunk is the spine and the chest: the polygon man's rig carries
   * spine, chest and neck and no `upperChest`, which the range table lists for
   * rigs that have one, so it is not a variable here.
   */
  const ANGLES: readonly (readonly [AutoMovieHumanoidBone, ANGLESItem])[] = [
    ["spine", 0],
    ["spine", 1],
    ["spine", 2],
    ["chest", 0],
    ["chest", 1],
    ["neck", 0],
    ["neck", 1],
    ["head", 0],
    ...(["left", "right"] as const).flatMap(
      (
        side: AutoMovieHumanSide,
      ): (readonly [AutoMovieHumanoidBone, ANGLESItemResult])[] => [
        [`${side}UpperLeg`, 0],
        [`${side}UpperLeg`, 1],
        [`${side}UpperLeg`, 2],
        [`${side}LowerLeg`, 0],
        [`${side}Foot`, 0],
        [`${side}Foot`, 1],
        [`${side}Toes`, 0],
        [`${side}UpperArm`, 0],
        [`${side}UpperArm`, 1],
        [`${side}UpperArm`, 2],
        [`${side}LowerArm`, 0],
        [`${side}Hand`, 0],
        [`${side}Hand`, 1],
      ],
    ),
  ];

  /**
   * The whole body's variables, the set a fit moves when none is given: the
   * root's place, its pitch and roll (the heading the law faces kept), then the
   * angles.
   */
  export const BODY: readonly IAutoMovieMotionHumanJacobian.IVariable[] = [
    { kind: "place", axis: "x" },
    { kind: "place", axis: "y" },
    { kind: "place", axis: "z" },
    { kind: "heading", axis: "pitch" },
    { kind: "heading", axis: "roll" },
    ...ANGLES.map(
      ([bone, axis]: readonly [
        AutoMovieHumanoidBone,
        BODY2,
      ]): IAutoMovieMotionHumanJacobian.IVariable => ({
        kind: "angle",
        bone,
        axis,
      }),
    ),
  ];

  /**
   * How far one step may move a variable, metres or degrees: the
   * linearisation's widest trust region.
   */
  const STEP: readonly [number, number] = [0.08, 12];

  /**
   * A variable's resolution, metres or degrees: a change under it is no change
   * of the posture a film shows.
   */
  const RESOLUTION: readonly [number, number] = [0.002, 0.25];

  /**
   * The unit a variable is solved in, in its own: a place in centimetres, an
   * angle in degrees.
   */
  const UNIT: readonly [number, number] = [0.01, 1];

  /**
   * A place's weight per square metre, a heading's per square degree and a
   * joint's per square degree.
   */
  const WEIGHT: readonly [number, number, number] = [1e4, 2, 1];

  /**
   * The existing absent-joint clinical zero, borrowed only while constructing a
   * fresh owned tuple.
   */
  const ZERO_JOINT: readonly [number, number, number] = [0, 0, 0];

  /**
   * A posture's variables.
   *
   * @param variables The variables.
   * @param posture The posture, written by its joint angles alone.
   * @returns Each variable's value, in its own unit.
   */
  export function vector(
    variables: readonly IAutoMovieMotionHumanJacobian.IVariable[],
    posture: IAutoMovieMotionHumanPosture,
  ): Float64Array {
    return Float64Array.from(
      variables,
      (v: IAutoMovieMotionHumanJacobian.IVariable): number =>
        v.kind === "place"
          ? posture.root[v.axis]
          : v.kind === "heading"
            ? posture[v.axis]
            : (posture.joints[v.bone]?.[v.axis] ?? 0),
    );
  }

  /**
   * The posture the variables write over another.
   *
   * @param variables The variables.
   * @param posture The posture written over.
   * @param x The values.
   * @returns The posture with the values written, by its joint angles alone.
   */
  export function written(
    variables: readonly IAutoMovieMotionHumanJacobian.IVariable[],
    posture: IAutoMovieMotionHumanPosture,
    x: Float64Array,
  ): IAutoMovieMotionHumanPosture {
    const root: IWrittenRoot = { ...posture.root };
    const heading: IWrittenHeading = {
      yaw: posture.yaw,
      pitch: posture.pitch,
      roll: posture.roll,
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    let changed:
      | Partial<Record<AutoMovieHumanoidBone, [number, number, number]>>
      | undefined;
    variables.forEach(
      (v: IAutoMovieMotionHumanJacobian.IVariable, i: number): void => {
        if (v.kind === "place") root[v.axis] = x[i]!;
        else if (v.kind === "heading") heading[v.axis] = x[i]!;
        else {
          let set: [number, number, number] | undefined = changed?.[v.bone];
          if (set === undefined) {
            const was: readonly [number, number, number] =
              joints[v.bone] ?? ZERO_JOINT;
            set = [was[0], was[1], was[2]];
            (changed ??= {})[v.bone] = set;
          }
          set[v.axis] = x[i]!;
          joints[v.bone] = set;
        }
      },
    );
    return { ...posture, root, ...heading, joints, limbs: {} };
  }

  /**
   * Each variable's rows for one step, in solved units: within its range and
   * the trust region. An axis the table locks, or one set outside its range
   * (which the resolver clamps), does not move.
   *
   * @param variables The variables.
   * @param x The values the step starts from.
   * @param radius The trust region's share of its widest.
   * @returns One row per variable.
   */
  export function bounds(
    variables: readonly IAutoMovieMotionHumanJacobian.IVariable[],
    x: Float64Array,
    radius: number,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow[] {
    return variables.map(
      (
        v: IAutoMovieMotionHumanJacobian.IVariable,
        i: number,
      ): IAutoMovieMotionHumanQuadraticProgram.IRow => {
        const span: Readonly<IAutoMovieAngleRange> | null = range(v);
        const step: number = reach(v) * radius;
        const lo: number =
          span === null ? 0 : Math.max(-step, span.min - x[i]!);
        const hi: number = span === null ? 0 : Math.min(step, span.max - x[i]!);
        return {
          key: `bound:${i}`,
          index: [i],
          coef: [1],
          l: lo <= hi ? lo / unit(v) : 0,
          u: lo <= hi ? hi / unit(v) : 0,
        };
      },
    );
  }

  /**
   * Whether a step, in solved units, reached the edge of its trust region.
   *
   * @param variables The variables.
   * @param moved The step.
   * @param radius The region's share of its widest.
   * @returns Whether some variable moved to within a hundredth of its reach.
   */
  export function edge(
    variables: readonly IAutoMovieMotionHumanJacobian.IVariable[],
    moved: Float64Array,
    radius: number,
  ): boolean {
    return variables.some(
      (v: IAutoMovieMotionHumanJacobian.IVariable, i: number): boolean =>
        Math.abs(moved[i]! * unit(v)) >= 0.99 * reach(v) * radius,
    );
  }

  /**
   * A variable's step in the widest trust region, in its own unit: the most
   * `bounds` lets it move at a radius of one.
   *
   * @param v The variable.
   * @returns The step, metres or degrees.
   */
  export function reach(v: IAutoMovieMotionHumanJacobian.IVariable): number {
    return v.kind === "place" ? STEP[0] : STEP[1];
  }

  /**
   * A variable's resolution.
   *
   * @param v The variable.
   * @returns The resolution, in the variable's own unit.
   */
  export function resolution(
    v: IAutoMovieMotionHumanJacobian.IVariable,
  ): number {
    return v.kind === "place" ? RESOLUTION[0] : RESOLUTION[1];
  }

  /**
   * A variable's solved unit.
   *
   * @param v The variable.
   * @returns The unit, in the variable's own.
   */
  export function unit(v: IAutoMovieMotionHumanJacobian.IVariable): number {
    return v.kind === "place" ? UNIT[0] : UNIT[1];
  }

  /**
   * A variable's weight in the objective.
   *
   * @param v The variable.
   * @returns The weight, per square of the variable's own unit.
   */
  export function weight(v: IAutoMovieMotionHumanJacobian.IVariable): number {
    return v.kind === "place"
      ? WEIGHT[0]
      : v.kind === "heading"
        ? WEIGHT[1]
        : WEIGHT[2];
  }

  /**
   * A variable's range: unbounded for the root, the table's for a joint, null
   * for an axis the table locks.
   */
  function range(
    v: IAutoMovieMotionHumanJacobian.IVariable,
  ): Readonly<IAutoMovieAngleRange> | null {
    if (v.kind !== "angle") return UNBOUNDED;
    const joint: (typeof DEFAULT_HUMANOID_ROM)[AutoMovieHumanoidBone] =
      DEFAULT_HUMANOID_ROM[v.bone];
    const span: IAutoMovieAngleRange | null | undefined =
      joint === undefined
        ? null
        : v.axis === 0
          ? joint.flexion
          : v.axis === 1
            ? joint.abduction
            : joint.twist;
    return span ?? null;
  }

  /**
   * One private read-only interval for root variables; joint intervals remain
   * the current table's own records.
   */
  const UNBOUNDED: Readonly<IAutoMovieAngleRange> = {
    min: -Infinity,
    max: Infinity,
  };
}

/** The record of `IWrittenHeading`'s site. */
type IWrittenHeading = { yaw: number; pitch: number; roll: number };

/** The record of `IWrittenRoot`'s site. */
type IWrittenRoot = { x: number; y: number; z: number };

/** The alternatives of `BODY2`'s site. */
type BODY2 = 0 | 1 | 2;

/** The alternatives of `ANGLESItemResult`'s site. */
type ANGLESItemResult = 0 | 1 | 2;

/** The alternatives of `ANGLESItem`'s site. */
type ANGLESItem = 0 | 1 | 2;
