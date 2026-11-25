import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieTransform,
} from "@automovie/interface";
import { blendHumanJoint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/** Integer hinge endpoints and dyadic progress produce exact readings here. */
const HINGE_TOLERANCE: number = 0;

/**
 * The quaternion half-arc is 10 degrees. Its acos and sine-divisor factors are
 * each below six. Allow 128 ulps for the remaining products, normalizations and
 * angle extraction, then convert the resulting radian bound to degrees.
 */
const ARC_TOLERANCE: number = 128 * 6 * 6 * Number.EPSILON * (180 / Math.PI);

/**
 * Selected joints resolve their metadata before sampling, and the angular
 * branch still follows the first constraint and the last explicit axes.
 *
 * Scenarios:
 *
 * 1. A full joint at +170 and -170 degrees crosses the short 20-degree arc. A
 *    later hinge constraint and an earlier degenerate basis do not win. The
 *    same shares return the same angles in reverse or repeated order.
 * 2. A selected hinge with a null override uses its canonical hinge constraint
 *    without reading axes. An absent, unselected eye retains canonical
 *    fallback.
 * 3. Clipping preserves tuple identity. A selected degenerate ball basis refuses
 *    interior sampling and leaves both clipped endpoints usable.
 * 4. A bounded twist crosses through zero inside its interval when the shorter
 *    rotation would cross the missing arc around 180 degrees.
 */
export function test_motions_posture_blend_human_joint(): void {
  const rest: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
    rotationOrder: "flexion-abduction-twist",
  };
  const degenerate: IAutoMovieJointAxes = {
    ...axes,
    flexion: { x: 0, y: 0, z: 0 },
  };
  const ball: IAutoMovieJointConstraint = {
    flexion: { min: -180, max: 180 },
    abduction: { min: -45, max: 45 },
    twist: { min: -45, max: 45 },
  };
  const hinge: IAutoMovieJointConstraint = {
    flexion: { min: -180, max: 180 },
    abduction: null,
    twist: null,
  };
  const first: IAutoMovieBone = {
    bone: "head",
    parent: null,
    rest,
    constraint: ball,
    axes: degenerate,
  };
  let reads: number = 0;
  const next: IAutoMovieBone = {
    bone: "head",
    parent: null,
    rest,
    constraint: hinge,
    get axes(): IAutoMovieJointAxes {
      ++reads;
      return axes;
    },
  };
  const omittedAxes: IAutoMovieBone = {
    bone: "head",
    parent: null,
    rest,
    constraint: hinge,
  };
  const elbow: IAutoMovieBone = {
    bone: "leftLowerArm",
    parent: "head",
    rest,
    constraint: null,
    get axes(): IAutoMovieJointAxes {
      throw new Error("A hinge has no rotational frame to read");
    },
  };
  const neck: IAutoMovieBone = {
    bone: "neck",
    parent: "head",
    rest,
    constraint: null,
    axes: degenerate,
  };
  const spine: IAutoMovieBone = {
    bone: "spine",
    parent: "head",
    rest,
    constraint: {
      flexion: { min: -45, max: 45 },
      abduction: { min: -45, max: 45 },
      twist: { min: -180, max: 180 },
      swingTwist: { twist: { min: -175, max: 175 }, reach: 90 },
    },
    axes,
  };
  const body: Parameters<typeof blendHumanJoint.prepare>[0] = {
    skeleton: {
      id: "selected-joints",
      bones: [first, next, omittedAxes, elbow, neck, spine],
    },
    bones: new Map<AutoMovieHumanoidBone, IAutoMovieBone>([
      [first.bone, first],
      [elbow.bone, elbow],
      [neck.bone, neck],
      [spine.bone, spine],
    ]),
  };
  const sample: ReturnType<typeof blendHumanJoint.prepare> =
    blendHumanJoint.prepare(
      body,
      new Set<AutoMovieHumanoidBone>(["head", "leftLowerArm", "neck", "spine"]),
    );
  const preparedReads: number = reads;
  TestValidator.predicate(
    "selected axes are read in preparation",
    preparedReads > 0,
  );

  const from: readonly [number, number, number] = [170, 0, 0];
  const to: readonly [number, number, number] = [-170, 0, 0];
  const quarter: readonly [number, number, number] = sample(
    "head",
    from,
    to,
    0.25,
  );
  const threeQuarters: readonly [number, number, number] = sample(
    "head",
    from,
    to,
    0.75,
  );
  const repeated: readonly [number, number, number] = sample(
    "head",
    from,
    to,
    0.25,
  );
  TestValidator.predicate(
    "the first constraint and last explicit axes produce the short arc",
    () =>
      nclose(quarter[0], 175, ARC_TOLERANCE) &&
      nclose(threeQuarters[0], -175, ARC_TOLERANCE) &&
      nclose(repeated[0], 175, ARC_TOLERANCE) &&
      nclose(repeated[1], 0, ARC_TOLERANCE) &&
      nclose(repeated[2], 0, ARC_TOLERANCE),
  );
  TestValidator.equals(
    "sampling does not revisit the selected axis records",
    reads,
    preparedReads,
  );

  const bend: readonly [number, number, number] = sample(
    "leftLowerArm",
    [0, 0, 0],
    [20, 0, 20],
    0.25,
  );
  const gaze: readonly [number, number, number] = sample(
    "leftEye",
    [0, 0, -20],
    [20, 0, 20],
    0.25,
  );
  TestValidator.predicate(
    "hinge and absent-eye fallback interpolate their legal axes",
    () =>
      nclose(bend[0], 5, HINGE_TOLERANCE) &&
      nclose(bend[1], 0, HINGE_TOLERANCE) &&
      nclose(bend[2], 5, HINGE_TOLERANCE) &&
      nclose(gaze[0], 5, HINGE_TOLERANCE) &&
      nclose(gaze[1], 0, HINGE_TOLERANCE) &&
      nclose(gaze[2], -10, HINGE_TOLERANCE),
  );

  const neutral: readonly [number, number, number] = [0, 0, 0];
  const looking: readonly [number, number, number] = [20, 0, 0];
  TestValidator.predicate(
    "clipped shares preserve endpoints despite a refused interior frame",
    () =>
      sample("neck", neutral, looking, -0.25) === neutral &&
      sample("neck", neutral, looking, 1.25) === looking,
  );
  TestValidator.predicate(
    "a degenerate selected interior frame refuses",
    throwsError(
      () => sample("neck", neutral, looking, 0.5),
      "jointToQuaternion axes.flexion",
    ),
  );

  const bounded: readonly [number, number, number] = sample(
    "spine",
    [0, 0, 170],
    [0, 0, -170],
    0.5,
  );
  TestValidator.predicate(
    "bounded twist blends inside its interval",
    () =>
      nclose(bounded[0], 0, ARC_TOLERANCE) &&
      nclose(bounded[1], 0, ARC_TOLERANCE) &&
      nclose(bounded[2], 0, ARC_TOLERANCE),
  );
}
