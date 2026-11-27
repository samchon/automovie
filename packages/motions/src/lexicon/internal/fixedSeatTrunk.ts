import {
  DEFAULT_HUMANOID_ROM,
  ROM_TOLERANCE,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { fixedSeatHarmonic } from "./fixedSeatHarmonic";

/*
 * Asymmetric upper-body articulation for two fixed working sites. Both
 * shoulders and the torso move within the rig's independent clinical intervals.
 * The caller owns the pelvis and both foot goals, and admits the resulting arm
 * configuration with the ordinary contact and collision criteria.
 */
export function fixedSeatTrunk(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  sites: Points,
): readonly Joints[] {
  const variables: IVariable[] = [];
  const twists: IVariable[] = [];
  for (const bone of TRUNK) {
    const limit: OptionalLimit =
      body.bones.get(bone)?.constraint ?? DEFAULT_HUMANOID_ROM[bone];
    if (
      !limit ||
      limit.swingTwist ||
      (limit.swingDeg !== undefined && limit.swingDeg !== null)
    )
      return [];
    for (let index: number = 0; index < AXES.length; ++index) {
      const axis: Axis = AXES[index]!;
      const range: OptionalRange = limit[axis];
      if (!range || range.max - range.min <= ROM_TOLERANCE) continue;
      if (range.max - range.min >= 360) return [];
      const variable: IVariable = { bone, index, range };
      variables.push(variable);
      if ((bone === "spine" || bone === "chest") && axis === "twist")
        twists.push(variable);
    }
  }
  if (!variables.length) return [];
  // Shoulder origins read only their direct ancestors. Finger, wrist and leg
  // records never enter this planning workspace; all remain on the raw action.
  const entry: Joints = {};
  for (const shoulder of HumanBoneGroups.SHOULDERS) {
    let ancestor: AutoMovieHumanoidBone | null | undefined =
      body.bones.get(shoulder)?.parent;
    while (ancestor) {
      const row: Angles | undefined = posture.joints[ancestor];
      if (row !== undefined) entry[ancestor] = row;
      ancestor = body.bones.get(ancestor)?.parent;
    }
  }
  const read: ReturnType<typeof poseBones.prepareTuples> =
    poseBones.prepareTuples(body, HumanBoneGroups.SHOULDERS);
  const root: IAutoMoviePose = resolveHumanPosture(body, {
    ...posture,
    limbs: {},
    joints: {},
  });
  const source: IAutoMovieMotionHumanPosture = {
    ...posture,
    limbs: {},
    joints: {},
  };
  const squared = (): Pair => {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read(
      source.joints,
    )(root);
    const left: IAutoMovieVector3 = Vector3.subtract(
      bones.get("leftUpperArm")!.worldPosition,
      sites.left,
    );
    const right: IAutoMovieVector3 = Vector3.subtract(
      bones.get("rightUpperArm")!.worldPosition,
      sites.right,
    );
    return [Vector3.dot(left, left), Vector3.dot(right, right)];
  };
  const candidates: ICandidate[] = [];
  for (const initial of ["min", "entry", "max"] as const) {
    source.joints = { ...entry };
    if (initial !== "entry")
      for (const variable of twists)
        turn(source.joints, variable, variable.range[initial]);
    let score: number = maximum(squared());
    for (;;) {
      const previous: number = score;
      let moved: number = 0;
      for (const variable of variables) {
        const { min, max }: IAutoMovieAngleRange = variable.range;
        const middle: number = (min + max) / 2;
        const half: number = ((max - min) * RAD) / 2;
        const before: number = (source.joints[variable.bone] ?? ZERO)[
          variable.index
        ]!;
        turn(source.joints, variable, min);
        const low: Pair = squared();
        turn(source.joints, variable, middle);
        const centre: Pair = squared();
        turn(source.joints, variable, max);
        const high: Pair = squared();
        const angle: number =
          middle +
          fixedSeatHarmonic.best(
            fixedSeatHarmonic(low[0], centre[0], high[0], half),
            fixedSeatHarmonic(low[1], centre[1], high[1], half),
            half,
            (before - middle) * RAD,
          ) /
            RAD;
        moved = Math.max(moved, Math.abs(angle - before));
        turn(source.joints, variable, angle);
      }
      score = maximum(squared());
      if (!(score < previous) || moved <= ROM_TOLERANCE) break;
    }
    candidates.push({ joints: source.joints, squared: score });
  }
  return candidates
    .sort((a: ICandidate, b: ICandidate): number => a.squared - b.squared)
    .map((candidate: ICandidate): Joints => candidate.joints);
}
type Joints = IAutoMovieMotionHumanPosture["joints"];
type Angles = readonly [number, number, number];
type Pair = readonly [number, number];
type Points = Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>;
type OptionalRange = IAutoMovieAngleRange | null | undefined;
type OptionalLimit = IAutoMovieJointConstraint | undefined;
/*
 * A stationary upper body and the distance used to rank it for actual
 * admission.
 */
interface ICandidate {
  joints: Joints;
  squared: number;
}
type Axis = "flexion" | "abduction" | "twist";

type Trunk = "spine" | "chest" | "leftShoulder" | "rightShoulder";

/*
 * One clinical axis of an ancestor of either requested shoulder.
 */
interface IVariable {
  bone: Trunk;
  index: number;
  range: IAutoMovieAngleRange;
}
const RAD: number = Math.PI / 180;
const ZERO: Angles = [0, 0, 0];
const TRUNK: readonly Trunk[] = [
  "spine",
  "chest",
  "leftShoulder",
  "rightShoulder",
];

const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];

/*
 * The greater of the two shoulder-to-site distances squared.
 */
function maximum(reading: Pair): number {
  return Math.max(reading[0], reading[1]);
}

/*
 * Set one coordinate without changing the caller's joint record or tuple.
 */
function turn(joints: Joints, variable: IVariable, degrees: number): void {
  const row: [number, number, number] = [...(joints[variable.bone] ?? ZERO)];
  row[variable.index] = degrees;
  joints[variable.bone] = row;
}
