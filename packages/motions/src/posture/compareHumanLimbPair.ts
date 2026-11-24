import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Compare the original complete paired-arm key and then its complete image:
 * root, name-sorted clinical joint tuples, left goal, right goal. Complete
 * lowering and whole-array JSON observation preserve getter/toJSON keys, suffix
 * effects and representative choice for arbitrary public input.
 */
export function compareHumanLimbPair(
  original: IAutoMoviePose,
  goals: Readonly<Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>>,
  image: IAutoMoviePose,
  reflected: Readonly<Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>>,
): number {
  const a: string = key(original, goals);
  const b: string = key(image, reflected);
  return a <= b ? (a === b ? 0 : -1) : 1;
}

/**
 * Materialize every original array component before the complete left-to-right
 * JSON observation.
 */
function key(
  pose: IAutoMoviePose,
  goals: Readonly<Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>>,
): string {
  return JSON.stringify([
    pose.root,
    [...pose.joints]
      .sort(order)
      .map(
        (
          joint: IAutoMovieJointPose,
        ): readonly [
          IAutoMovieJointPose["bone"],
          number | null,
          number | null,
          number | null,
        ] => [
          joint.bone,
          joint.flexion ?? null,
          joint.abduction ?? null,
          joint.twist ?? null,
        ],
      ),
    goals.left,
    goals.right,
  ]);
}

/** Original stable name-order comparator; duplicate names retain input order. */
function order(a: IAutoMovieJointPose, b: IAutoMovieJointPose): number {
  return a.bone < b.bone ? -1 : a.bone > b.bone ? 1 : 0;
}
