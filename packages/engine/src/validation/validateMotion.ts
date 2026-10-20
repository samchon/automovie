import {
  AutoMovieEasing,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { validateExpression } from "./validateExpression";
import { validatePose } from "./validatePose";

/** Declared per-axis adjacent-keyframe speed policy in degrees per second, rather than a measured anatomical maximum. */
const MAX_ANGULAR_SPEED_DEG_PER_S: number = 900;

/**
 * Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed.
 *
 * @evidence contracts/common.md#principled-implementation Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed.
 * @evidence contracts/common.md#clear-and-simple-design Pose/expression owners retain their semantics, and motion owns temporal rules and bezier controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts 900deg/s is a policy threshold, not measured anatomy; sparse bezier tuple admission must inspect all four actual elements.
 * @evidence contracts/common.md#meaningful-documentation Seconds, degrees, strict time increase, easing menu and inclusive bezier X bounds are documented.
 * @evidence contracts/performance.md#efficient-algorithms K frames pay pose/expression traversal; adjacent-axis lookup cost also depends on joint counts, not only K.
 * @evidence contracts/performance.md#reuse-equivalent-work Closed easing vocabularies are shared, while each frame's current values are validated anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector owns output rows; no sampled pose sequence, animation clip or host task is retained.
 */
export const validateMotion: (props: {
  motion: IAutoMovieMotion;
  skeleton: IAutoMovieSkeleton;
}) => IAutoMovieValidation = (props: {
  /** Borrowed clip with second-valued timestamps and degree-valued joints. */
  motion: IAutoMovieMotion;

  /** Current target rig supplying joint membership and effective ROM overrides. */
  skeleton: IAutoMovieSkeleton;
}): IAutoMovieValidation => {
  const path: string = "$input";
  const collector: ViolationCollector = new ViolationCollector();
  const {
    motion,
    skeleton,
  }: { motion: IAutoMovieMotion; skeleton: IAutoMovieSkeleton } = props;

  if (motion.id.trim().length === 0)
    collector.push(
      "type",
      `${path}.id`,
      "motion id must be a non-empty id",
      motion.id,
    );
  if (motion.skeleton !== skeleton.id)
    collector.push(
      "type",
      `${path}.skeleton`,
      `motion skeleton "${motion.skeleton}" does not match target skeleton "${skeleton.id}"`,
      motion.skeleton,
    );
  if (!Number.isFinite(motion.duration) || !(motion.duration > 0))
    collector.push(
      "temporal",
      `${path}.duration`,
      `motion duration must be a finite number > 0 seconds, but was ${motion.duration}`,
      motion.duration,
    );
  if (typeof motion.loop !== "boolean")
    collector.push(
      "type",
      `${path}.loop`,
      `motion loop must be boolean, but was ${String(motion.loop)}`,
      motion.loop,
    );
  if (motion.keyframes.length < 2)
    collector.push(
      "temporal",
      `${path}.keyframes`,
      `motion must have at least two keyframes, but had ${motion.keyframes.length}`,
      motion.keyframes.length,
    );

  let previousTime: number = -Infinity;
  motion.keyframes.forEach((kf: IAutoMovieKeyframe, i: number): void => {
    const kp: string = `${path}.keyframes[${i}]`;
    const finiteTime: boolean = Number.isFinite(kf.time);

    if (!finiteTime || kf.time < 0 || kf.time > motion.duration)
      collector.push(
        "temporal",
        `${kp}.time`,
        `keyframe time must be a finite number within [0, ${motion.duration}]s, but was ${kf.time}`,
        kf.time,
      );
    if (finiteTime && kf.time <= previousTime)
      collector.push(
        "temporal",
        `${kp}.time`,
        `keyframe times must strictly increase; ${kf.time} is not greater than the previous ${previousTime}`,
        kf.time,
      );
    if (!KEYFRAME_EASINGS.has(kf.easing))
      collector.push(
        "type",
        `${kp}.easing`,
        `unknown keyframe easing "${String(kf.easing)}"`,
        kf.easing,
      );
    validateKeyframeBezier(kf, kp, collector);

    validatePose({ pose: kf.pose, skeleton, path: `${kp}.pose`, collector });
    if (kf.expression !== null)
      validateExpression({
        expression: kf.expression,
        path: `${kp}.expression`,
        collector,
      });

    if (i > 0) checkAngularSpeed(motion, i, kp, collector);
    if (finiteTime) previousTime = kf.time;
  });

  return collector.toValidation();
};

/**
 * Index prior joints by bone and flag shared axes whose degree delta divided by positive dt exceeds900deg/s.
 *
 * Temporal ordering admission owns bad dt; this helper owns adjacent-frame speed policy.
 *
 * Absent prior joints are skipped and null axis angles contribute zero.
 *
 * Warnings are temporal errors at the incoming pose path with reported speed.
 *
 * Prior/current joint populations cost expected O(P+C), with O(P) map storage.
 *
 * One prior-bone map serves all three axes of each current joint.
 *
 * The map releases after one pair and only collector rows remain.
 */
const checkAngularSpeed: (
  motion: IAutoMovieMotion,
  i: number,
  kp: string,
  collector: ViolationCollector,
) => void = (
  motion: IAutoMovieMotion,
  i: number,
  kp: string,
  collector: ViolationCollector,
): void => {
  const prev: IAutoMovieKeyframe = motion.keyframes[i - 1]!;
  const cur: IAutoMovieKeyframe = motion.keyframes[i]!;
  const dt: number = cur.time - prev.time;
  if (!Number.isFinite(dt) || dt <= 0) return; // ordering/range already reported above

  const prevByBone: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
    prev.pose.joints.map(
      (
        j: IAutoMovieJointPose,
      ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
    ),
  );
  for (const j of cur.pose.joints) {
    const p: IAutoMovieJointPose | undefined = prevByBone.get(j.bone);
    if (p === undefined) continue;
    const axes: readonly ["flexion", "abduction", "twist"] = [
      "flexion",
      "abduction",
      "twist",
    ] as const;
    for (const axis of axes) {
      const delta: number = Math.abs((j[axis] ?? 0) - (p[axis] ?? 0));
      const speed: number = delta / dt;
      if (speed > MAX_ANGULAR_SPEED_DEG_PER_S)
        collector.push(
          "temporal",
          `${kp}.pose`,
          `${j.bone} ${axis} changes ${delta.toFixed(0)}° in ${dt.toFixed(2)}s (${speed.toFixed(0)}°/s), exceeding ${MAX_ANGULAR_SPEED_DEG_PER_S}°/s`,
          speed,
        );
    }
  }
};

/**
 * Require four finite controls only for cubicBezier and restrict X controls to inclusive[0,1].
 *
 * isFiniteBezierTuple owns shape/finite admission before destructuring.
 *
 * Y controls may overshoot; non-cubic easing must carry null controls.
 *
 * The control tuple and exact bezier path preserve authored values without clamping.
 *
 * Four control reads and fixed comparisons take constant work.
 *
 * Motion easing and the cubicBezier solver share the legal X-domain premise.
 *
 * Only diagnostic rows escape; no easing curve cache or sampler task is retained.
 */
const validateKeyframeBezier: (
  kf: IAutoMovieKeyframe,
  kp: string,
  collector: ViolationCollector,
) => void = (
  kf: IAutoMovieKeyframe,
  kp: string,
  collector: ViolationCollector,
): void => {
  if (kf.easing !== "cubicBezier") {
    if (kf.bezier !== null)
      collector.push(
        "type",
        `${kp}.bezier`,
        "keyframe bezier controls are only valid for cubicBezier easing",
        kf.bezier,
      );
    return;
  }

  if (!isFiniteBezierTuple(kf.bezier)) {
    collector.push(
      "type",
      `${kp}.bezier`,
      "cubicBezier keyframes must carry four finite bezier control values",
      kf.bezier,
    );
    return;
  }

  // Control x's must lie in [0, 1], the CSS cubic-bezier constraint the easing
  // solver relies on (`cubicBezierEasing` documents that CSS-legal x's keep
  // x(s) monotone, so its Newton→bisection root-find is well-posed). An x
  // outside [0, 1] makes x(s) non-monotone: the solver returns whichever root
  // basin it lands in, a finite but wrong eased value the finiteness check
  // alone never catches (#1159). (y is unconstrained.)
  const [x1, , x2]: [number, number, number, number] = kf.bezier;
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1)
    collector.push(
      "range",
      `${kp}.bezier`,
      `cubicBezier control x's (x1, x2) must be within [0, 1] to keep the eased curve monotone, but were x1=${x1}, x2=${x2}`,
      kf.bezier,
    );
};

/**
 * Admit exactly four actual finite array elements as a bezier tuple.
 *
 * The type predicate makes destructuring safe after shape/finite admission.
 *
 * Array density is required; a length-four array of holes is not four finite controls.
 *
 * Boolean narrowing certifies only this tuple shape and scalar finiteness.
 *
 * Four indexed finite checks take constant work with no array copy.
 *
 * Keyframe admission reuses this guard before X-coordinate comparisons.
 *
 * The array stays borrowed and only boolean narrowing escapes.
 */
const isFiniteBezierTuple: (
  value: unknown,
) => value is [number, number, number, number] = (
  value: unknown,
): value is [number, number, number, number] =>
  Array.isArray(value) &&
  value.length === 4 &&
  Number.isFinite(value[0]) &&
  Number.isFinite(value[1]) &&
  Number.isFinite(value[2]) &&
  Number.isFinite(value[3]);

const KEYFRAME_EASINGS: Set<AutoMovieEasing> = new Set<AutoMovieEasing>([
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
  "step",
  "cubicBezier",
]);
