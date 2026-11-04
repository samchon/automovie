import {
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
  type IAutoMovieHumanPose,
} from "@automovie/human";

import { Vec3 } from "./Vec3";

/** One clinical channel path inside a limb, with its admitted range in degrees. */
interface IChannel {
  /** Pose joint object key inside the limb. */ joint: string;
  /** Scalar field on that joint. */ field: string;
  /** Lower clinical bound, degrees. */ min: number;
  /** Upper clinical bound, degrees. */ max: number;
}

/** Leg degrees of freedom solved by the IK: hip 3, knee, ankle. */
const LEG: readonly IChannel[] = [
  { joint: "hip", field: "flexion", min: -17, max: 130 },
  { joint: "hip", field: "abduction", min: -20, max: 40 },
  { joint: "hip", field: "rotation", min: -45, max: 45 },
  { joint: "knee", field: "flexion", min: 0, max: 139 },
  { joint: "ankle", field: "dorsiflexion", min: -58, max: 13 },
];

/** Arm degrees of freedom solved by the IK: glenohumeral 3 and elbow. */
const ARM: readonly IChannel[] = [
  { joint: "shoulder", field: "flexion", min: -60, max: 170 },
  { joint: "shoulder", field: "abduction", min: -40, max: 180 },
  { joint: "shoulder", field: "rotation", min: -70, max: 90 },
  { joint: "elbow", field: "flexion", min: 0, max: 147 },
];

/** Forward offset of a glove's centre past the wrist joint, metres (matches addInspectionGloves). */
const GLOVE_OFFSET: number = 0.065;

/**
 * Whole-body clinical IK for one fixed Human body.
 *
 * Each limb is solved independently by damped least squares (Levenberg–Marquardt)
 * over its clinical channels, with forward-difference Jacobians from the public
 * Human projection evaluator. Legs and arms are children of an already-posed
 * trunk, so their solutions are independent; one evaluation perturbs the same
 * channel index of all four limbs at once, which makes a whole-body iteration
 * cost six projections instead of eighteen.
 *
 * @evidence contracts/common.md#implementation-and-ownership The trunk, neck and hand/finger channels are authored directly; only limb channels are solved. A small prior pulls each channel toward the authored value so redundant freedoms (humeral and femoral rotation) keep the authored style. The solution depends only on the request, never on previous frames, so seek and export reproduce it exactly. Unreachable goals return the closest clamped solution with its residual reported, never a throw.
 * @evidence contracts/common.md#authoring-interface Goals are world metres; the root placement maps them into the body frame (+X forward, +Y up, +Z left, origin on the floor under the hips at neutral). Leg goals place the ankle joint and optionally aim the ball of the foot; arm goals place the glove centre and optionally aim the elbow.
 */
export class BodyRig {
  /** Full public evaluator used for display. */
  public readonly evaluate: AutoMovieHumanSkeleton.PoseEvaluator;

  /** Neutral output, used for limb lengths and rest geometry. */
  public readonly neutral: AutoMovieHumanSkeleton.IOutput;

  /** Thigh and shank lengths, metres. */
  public readonly legLengths: readonly [number, number];

  /** Upper arm and forearm-to-glove lengths, metres. */
  public readonly armLengths: readonly [number, number];

  /** Neutral ankle-to-ball offset in the body frame, metres. */
  public readonly footVector: Vec3.Value;

  /** Compiled projection over the bones the solver and staging read. */
  private readonly project: AutoMovieHumanSkeleton.ProjectionEvaluator;

  /** Bone order of the projection output. */
  private readonly order: Map<string, number>;

  public constructor(parameters: IAutoMovieHumanParameters) {
    // The polygon figure draws from the skeleton alone, so no skin descriptor is requested.
    this.evaluate = AutoMovieHumanSkeleton.prepare(parameters);
    this.neutral = this.evaluate({});
    const bones: string[] = ["hips", "chest", "neck", "head"];
    for (const side of ["left", "right"] as const)
      bones.push(
        `${side}UpperArm`,
        `${side}LowerArm`,
        `${side}Hand`,
        `${side}UpperLeg`,
        `${side}LowerLeg`,
        `${side}Foot`,
        `${side}HalluxProximal`,
        `${side}Toe5Proximal`,
      );
    if (this.evaluate.project === undefined)
      throw new Error("Human evaluator lacks the projection capability");
    this.project = this.evaluate.project(bones);
    const probe: AutoMovieHumanSkeleton.IProjection = this.project({});
    this.order = new Map(
      probe.posed.map(
        (
          item: AutoMovieHumanSkeleton.IPlacement,
          index: number,
        ): [string, number] => [item.bone, index],
      ),
    );
    const at = (bone: string): Vec3.Value =>
      probe.posed[this.order.get(bone)!]!.position;
    this.legLengths = [
      Vec3.distance(at("leftUpperLeg"), at("leftLowerLeg")),
      Vec3.distance(at("leftLowerLeg"), at("leftFoot")),
    ];
    this.armLengths = [
      Vec3.distance(at("leftUpperArm"), at("leftLowerArm")),
      Vec3.distance(at("leftLowerArm"), at("leftHand")) + GLOVE_OFFSET,
    ];
    this.footVector = Vec3.sub(BodyRig.ball(at, "left"), at("leftFoot"));
  }

  /**
   * Solve the limbs of one complete request.
   *
   * @evidence contracts/common.md#implementation-and-ownership Converts goals into the body frame once, seeds knee and elbow flexion from the law of cosines, then runs at most twelve damped Gauss–Newton steps per limb with clinical clamps. Cost is bounded by 6 × 12 projections.
   * @evidence contracts/common.md#authoring-interface Returns a fresh complete pose and the worst remaining goal error in metres; the request is not mutated.
   */
  public solve(request: BodyRig.Request): BodyRig.Result {
    const pose: IAutoMovieHumanPose = BodyRig.complete(request.pose);
    const inverse: readonly [number, number, number, number] = [
      -request.root.rotation[0],
      -request.root.rotation[1],
      -request.root.rotation[2],
      request.root.rotation[3],
    ];
    const local = (point: Vec3.Value): Vec3.Value =>
      Vec3.rotate(Vec3.sub(point, request.root.position), inverse);

    // Gather active limbs with goals in the body frame.
    const limbs: ILimb[] = [];
    for (const side of ["left", "right"] as const) {
      const leg: BodyRig.Goal | undefined = request.legs?.[side];
      if (leg)
        limbs.push(
          this.limb("leg", side, pose, {
            point: local(leg.point),
            ...(leg.aim
              ? { aim: { ...leg.aim, point: local(leg.aim.point) } }
              : {}),
          }),
        );
      const arm: BodyRig.Goal | undefined = request.arms?.[side];
      if (arm)
        limbs.push(
          this.limb("arm", side, pose, {
            point: local(arm.point),
            ...(arm.aim
              ? { aim: { ...arm.aim, point: local(arm.aim.point) } }
              : {}),
          }),
        );
    }
    if (limbs.length === 0) return { pose, error: 0 };

    // Seed the hinge from the root-to-goal distance (law of cosines).
    const base: AutoMovieHumanSkeleton.IProjection = this.project(pose);
    for (const limb of limbs) {
      const root: Vec3.Value = this.read(
        base,
        `${limb.side}${limb.kind === "leg" ? "UpperLeg" : "UpperArm"}`,
      );
      const [a, b] = limb.kind === "leg" ? this.legLengths : this.armLengths;
      const d: number = Math.min(
        a + b - 1e-4,
        Math.max(Math.abs(a - b) + 1e-4, Vec3.distance(root, limb.goal.point)),
      );
      const inner: number = Math.acos((a * a + b * b - d * d) / (2 * a * b));
      // Channel 3 is the knee or the elbow in both tables.
      const hinge: number = 3;
      const bend: number = 180 - (inner * 180) / Math.PI;
      limb.values[hinge] = clamp(bend, limb.channels[hinge]!);
      this.write(pose, limb, limb.values);
    }

    // Damped least squares, all limbs advanced together.
    const step: number = 0.35;
    const weight: number = request.stiffness ?? 0.0006;
    let error: number = Infinity;
    for (let iteration: number = 0; iteration < 12; iteration++) {
      const current: AutoMovieHumanSkeleton.IProjection = this.project(pose);
      const residuals: number[][] = limbs.map((limb: ILimb): number[] =>
        this.residual(current, limb),
      );
      error = Math.max(
        ...residuals.map((residual: number[]): number =>
          Math.hypot(...residual.slice(0, 3)),
        ),
      );
      if (error < 0.0015 && iteration > 0) break;
      const columns: number[][][] = limbs.map((): number[][] => []);
      const dimensions: number = Math.max(
        ...limbs.map((limb: ILimb): number => limb.channels.length),
      );
      for (let k: number = 0; k < dimensions; k++) {
        for (const limb of limbs)
          if (k < limb.channels.length) {
            const trial: number[] = [...limb.values];
            trial[k] =
              trial[k]! +
              (trial[k]! + step > limb.channels[k]!.max ? -step : step);
            this.write(pose, limb, trial);
          }
        const perturbed: AutoMovieHumanSkeleton.IProjection =
          this.project(pose);
        limbs.forEach((limb: ILimb, index: number): void => {
          if (k >= limb.channels.length) return;
          const delta: number =
            limb.values[k]! + step > limb.channels[k]!.max ? -step : step;
          const moved: number[] = this.residual(perturbed, limb);
          columns[index]!.push(
            moved.map(
              (value: number, row: number): number =>
                (value - residuals[index]![row]!) / delta,
            ),
          );
          this.write(pose, limb, limb.values);
        });
      }
      limbs.forEach((limb: ILimb, index: number): void => {
        const update: number[] = solveDamped(
          columns[index]!,
          residuals[index]!,
          limb.values.map(
            (value: number, k: number): number => value - limb.prior[k]!,
          ),
          weight,
        );
        limb.values = limb.values.map((value: number, k: number): number =>
          clamp(
            value + Math.max(-25, Math.min(25, update[k]!)),
            limb.channels[k]!,
          ),
        );
        this.write(pose, limb, limb.values);
      });
    }
    return { pose, error };
  }

  /**
   * World positions of trunk landmarks under an authored pose and root.
   *
   * @evidence contracts/common.md#implementation-and-ownership One projection; limb channels in the pose do not affect these trunk bones.
   * @evidence contracts/common.md#authoring-interface Returns world metres plus the chest's world rotation, used to express guard positions relative to the torso.
   */
  public trunk(
    pose: IAutoMovieHumanPose,
    root: BodyRig.Placement,
  ): BodyRig.Trunk {
    const output: AutoMovieHumanSkeleton.IProjection = this.project(pose);
    const world = (bone: string): Vec3.Value =>
      Vec3.add(
        root.position,
        Vec3.rotate(this.read(output, bone), root.rotation),
      );
    const chest: AutoMovieHumanSkeleton.IPlacement =
      output.posed[this.order.get("chest")!]!;
    return {
      head: world("head"),
      neck: world("neck"),
      chest: world("chest"),
      hips: world("hips"),
      shoulders: { left: world("leftUpperArm"), right: world("rightUpperArm") },
      hipJoints: { left: world("leftUpperLeg"), right: world("rightUpperLeg") },
      chestRotation: multiply(root.rotation, chest.rotation),
    };
  }

  /** Build a limb record with its channel table, current values and prior. */
  private limb(
    kind: "leg" | "arm",
    side: BodyRig.Side,
    pose: IAutoMovieHumanPose,
    goal: BodyRig.Goal,
  ): ILimb {
    const channels: readonly IChannel[] = kind === "leg" ? LEG : ARM;
    const values: number[] = channels.map((channel: IChannel): number =>
      clamp(readChannel(pose, kind, side, channel), channel),
    );
    return { kind, side, channels, values, prior: [...values], goal };
  }

  /** Residual vector of one limb: primary point error, then weighted aim error. */
  private residual(
    output: AutoMovieHumanSkeleton.IProjection,
    limb: ILimb,
  ): number[] {
    const primary: Vec3.Value =
      limb.kind === "leg"
        ? this.read(output, `${limb.side}Foot`)
        : this.glove(output, limb.side);
    const result: number[] = [...Vec3.sub(primary, limb.goal.point)];
    if (limb.goal.aim) {
      const bone: Vec3.Value =
        limb.goal.aim.bone === "ball"
          ? BodyRig.ball(
              (name: string): Vec3.Value => this.read(output, name),
              limb.side,
            )
          : this.read(
              output,
              `${limb.side}${limb.goal.aim.bone === "knee" ? "LowerLeg" : "LowerArm"}`,
            );
      result.push(
        ...Vec3.scale(
          Vec3.sub(bone, limb.goal.aim.point),
          limb.goal.aim.weight,
        ),
      );
    }
    return result;
  }

  /** Glove centre: past the wrist along the forearm. */
  private glove(
    output: AutoMovieHumanSkeleton.IProjection,
    side: BodyRig.Side,
  ): Vec3.Value {
    const hand: Vec3.Value = this.read(output, `${side}Hand`);
    const elbow: Vec3.Value = this.read(output, `${side}LowerArm`);
    return Vec3.add(
      hand,
      Vec3.scale(Vec3.normalize(Vec3.sub(hand, elbow)), GLOVE_OFFSET),
    );
  }

  /** Body-frame position of one projected bone. */
  private read(
    output: AutoMovieHumanSkeleton.IProjection,
    bone: string,
  ): Vec3.Value {
    return output.posed[this.order.get(bone)!]!.position;
  }

  /** Write a limb's channel values into the mutable pose. */
  private write(
    pose: IAutoMovieHumanPose,
    limb: ILimb,
    values: readonly number[],
  ): void {
    const group: Record<string, Record<string, number>> = (limb.kind === "leg"
      ? pose.legs![limb.side]
      : pose.arms![limb.side]) as unknown as Record<
      string,
      Record<string, number>
    >;
    limb.channels.forEach((channel: IChannel, index: number): void => {
      group[channel.joint]![channel.field] = values[index]!;
    });
  }
}

/**
 * Request and result types of {@link BodyRig}.
 */
export namespace BodyRig {
  /**
   * Anatomical side of the performer, independent of camera.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed anatomical side.
   * @evidence contracts/common.md#authoring-interface The body's own side.
   */
  export type Side = "left" | "right";

  /**
   * Root placement of the body frame in the world.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain root transform.
   * @evidence contracts/common.md#authoring-interface World metres and a unit quaternion [x, y, z, w].
   */
  export interface Placement {
    /** World position of the body origin (floor under the neutral hips), metres. */
    position: Vec3.Value;

    /** World rotation of the body frame, unit quaternion `[x, y, z, w]`. */
    rotation: readonly [number, number, number, number];
  }

  /**
   * One limb goal in world metres.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain limb goal.
   * @evidence contracts/common.md#authoring-interface World metres; aim weight relative to the primary point.
   */
  export interface Goal {
    /** Ankle joint (legs) or glove centre (arms). */
    point: Vec3.Value;

    /** Optional second point: ball of foot or knee for legs, elbow for arms. */
    aim?: {
      /** Which landmark the aim constrains. */ bone: "ball" | "knee" | "elbow";
      /** World target of that landmark, metres. */ point: Vec3.Value;
      /** Relative weight against the primary point, typically 0.3–1. */ weight: number;
    };
  }

  /**
   * A complete authored body with optional limb goals.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain solve input.
   * @evidence contracts/common.md#authoring-interface Missing limb goals keep their authored channels.
   */
  export interface Request {
    /** Body frame placement. */
    root: Placement;

    /** Complete authored clinical pose; limb channels seed and regularize the solve. */
    pose: IAutoMovieHumanPose;

    /** Leg goals; a missing side keeps its authored channels. */
    legs?: Partial<Record<Side, Goal>>;

    /** Arm goals; a missing side keeps its authored channels. */
    arms?: Partial<Record<Side, Goal>>;

    /** Prior weight in metres per degree; larger keeps authored style harder. */
    stiffness?: number;
  }

  /**
   * Solved pose and the worst primary residual.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain solve output.
   * @evidence contracts/common.md#authoring-interface Error in metres.
   */
  export interface Result {
    /** Complete clinical pose ready for display. */ pose: IAutoMovieHumanPose;
    /** Largest primary goal error after solving, metres. */ error: number;
  }

  /**
   * Trunk landmarks in world metres.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain trunk landmark set.
   * @evidence contracts/common.md#authoring-interface World metres and a quaternion.
   */
  export interface Trunk {
    /** Head joint (skull base). */ head: Vec3.Value;
    /** Lower neck joint. */ neck: Vec3.Value;
    /** Chest joint. */ chest: Vec3.Value;
    /** Hip centre joint. */ hips: Vec3.Value;
    /** Glenohumeral joints. */ shoulders: Record<Side, Vec3.Value>;
    /** Hip joints. */ hipJoints: Record<Side, Vec3.Value>;
    /** World rotation of the chest bone from bind, quaternion. */ chestRotation: readonly [
      number,
      number,
      number,
      number,
    ];
  }

  /**
   * Ball of the foot: midpoint of the first and fifth metatarsal heads.
   *
   * @evidence contracts/common.md#implementation-and-ownership Midpoint of the first and fifth metatarsal heads.
   * @evidence contracts/common.md#authoring-interface `read` returns any bone position in the caller's frame.
   */
  export function ball(
    read: (bone: string) => Vec3.Value,
    side: Side,
  ): Vec3.Value {
    return Vec3.lerp(
      read(`${side}HalluxProximal`),
      read(`${side}Toe5Proximal`),
      0.5,
    );
  }

  /**
   * Deep-copy a pose and create every limb channel container the solver writes.
   *
   * @evidence contracts/common.md#implementation-and-ownership Deep copy with every limb channel container created.
   * @evidence contracts/common.md#authoring-interface Returns a fresh pose; the input is untouched.
   */
  export function complete(pose: IAutoMovieHumanPose): IAutoMovieHumanPose {
    const copy: IAutoMovieHumanPose = structuredClone(pose);
    copy.legs ??= { left: {}, right: {} };
    copy.arms ??= { left: {}, right: {} };
    for (const side of ["left", "right"] as const) {
      const leg = (copy.legs[side] ??= {});
      leg.hip ??= {};
      leg.knee ??= {};
      leg.ankle ??= {};
      const arm = (copy.arms[side] ??= {});
      arm.shoulder ??= {};
      arm.elbow ??= {};
    }
    return copy;
  }
}

/** Internal mutable limb state during one solve. */
interface ILimb {
  /** Limb family. */ kind: "leg" | "arm";
  /** Anatomical side. */ side: BodyRig.Side;
  /** Solved channels. */ channels: readonly IChannel[];
  /** Current values, degrees. */ values: number[];
  /** Authored values, degrees. */ prior: number[];
  /** Goal in the body frame. */ goal: BodyRig.Goal;
}

/** Read one authored channel value, defaulting to zero. */
function readChannel(
  pose: IAutoMovieHumanPose,
  kind: "leg" | "arm",
  side: BodyRig.Side,
  channel: IChannel,
): number {
  const group: Record<string, Record<string, number> | undefined> | undefined =
    (kind === "leg" ? pose.legs?.[side] : pose.arms?.[side]) as unknown as
      | Record<string, Record<string, number> | undefined>
      | undefined;
  return group?.[channel.joint]?.[channel.field] ?? 0;
}

/** Clamp a value to a channel's range. */
function clamp(value: number, channel: IChannel): number {
  return Math.max(channel.min, Math.min(channel.max, value));
}

/** Hamilton product `a * b`. */
function multiply(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
): [number, number, number, number] {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

/**
 * Solve (JᵀJ + λ diag(JᵀJ) + w²I) δ = −(Jᵀr + w² p) by Gaussian elimination.
 *
 * `columns[k]` is ∂r/∂θk; p is the deviation from the prior.
 */
function solveDamped(
  columns: number[][],
  residual: number[],
  deviation: number[],
  weight: number,
): number[] {
  const n: number = columns.length;
  const a: number[][] = [];
  const b: number[] = [];
  const w2: number = weight * weight;
  for (let i: number = 0; i < n; i++) {
    const row: number[] = [];
    for (let j: number = 0; j < n; j++) {
      let sum: number = 0;
      for (let r: number = 0; r < residual.length; r++)
        sum += columns[i]![r]! * columns[j]![r]!;
      row.push(sum);
    }
    row[i] = row[i]! * 1.05 + w2 + 1e-9;
    a.push(row);
    let rhs: number = 0;
    for (let r: number = 0; r < residual.length; r++)
      rhs += columns[i]![r]! * residual[r]!;
    b.push(-(rhs + w2 * deviation[i]!));
  }
  for (let col: number = 0; col < n; col++) {
    let pivot: number = col;
    for (let row: number = col + 1; row < n; row++)
      if (Math.abs(a[row]![col]!) > Math.abs(a[pivot]![col]!)) pivot = row;
    [a[col], a[pivot]] = [a[pivot]!, a[col]!];
    [b[col], b[pivot]] = [b[pivot]!, b[col]!];
    for (let row: number = col + 1; row < n; row++) {
      const factor: number = a[row]![col]! / a[col]![col]!;
      for (let k: number = col; k < n; k++)
        a[row]![k] = a[row]![k]! - factor * a[col]![k]!;
      b[row] = b[row]! - factor * b[col]!;
    }
  }
  const x: number[] = new Array<number>(n).fill(0);
  for (let row: number = n - 1; row >= 0; row--) {
    let sum: number = b[row]!;
    for (let k: number = row + 1; k < n; k++) sum -= a[row]![k]! * x[k]!;
    x[row] = sum / a[row]![row]!;
  }
  return x;
}
