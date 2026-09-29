import type { IAutoMovieJointPose } from "@automovie/interface";

/** A review state: the shape channels and pose a document is built from. */
export interface IBodyReviewState {
  shape: Record<string, number>;
  pose: IAutoMovieJointPose[];
}

const joint = (
  bone: string,
  flexion: number | null,
  abduction: number | null = null,
  twist: number | null = null,
): IAutoMovieJointPose =>
  ({ bone, flexion, abduction, twist }) as unknown as IAutoMovieJointPose;

/**
 * The review states a body change is looked at in by default: the macro axes
 * at their ends (sex, age, weight, muscle), two mixed builds, and the poses
 * the editor offers, each of which opens a different joint or contact.
 *
 * Each state names macro channels and joint angles in the units the editor
 * takes: macro channels in `[-1, 1]` about the basis neutral and joint angles
 * in clinical degrees. None is a person; a state is a probe of the shape
 * space and of a joint's range. The set is a starting population for a
 * review and never an acceptance list: a change that claims a region also
 * looks at the states that region's contract names. The documents built
 * from these states are display inputs to the editor and the runner records
 * each state's name beside its frames.
 */
export function standardBodyReviewStates(): Record<string, IBodyReviewState> {
  const state = (
    shape: Record<string, number>,
    pose: IAutoMovieJointPose[] = [],
  ): IBodyReviewState => ({ shape, pose });
  return {
    neutral: state({}),
    female: state({ macroGender: -1 }),
    male: state({ macroGender: 1 }),
    child: state({ macroAge: -1 }),
    old: state({ macroAge: 1 }),
    heavy: state({ macroWeight: 1 }),
    thin: state({ macroWeight: -1 }),
    muscular: state({ macroMuscle: 1 }),
    "female-heavy": state({ macroGender: -1, macroWeight: 0.7 }),
    "male-muscular-tall": state({
      macroGender: 1,
      macroMuscle: 0.8,
      macroHeight: 0.6,
    }),
    "t-pose": state({}, [
      joint("leftUpperArm", null, 90),
      joint("rightUpperArm", null, 90),
      joint("leftLowerArm", 0),
      joint("rightLowerArm", 0),
    ]),
    "arms-down": state({}, [
      joint("leftUpperArm", null, 0),
      joint("rightUpperArm", null, 0),
      joint("leftLowerArm", 0),
      joint("rightLowerArm", 0),
    ]),
    "elbows-90": state({}, [
      joint("leftLowerArm", 90),
      joint("rightLowerArm", 90),
    ]),
    "arms-overhead": state({}, [
      joint("leftUpperArm", null, 170),
      joint("rightUpperArm", null, 170),
    ]),
    "hips-90": state({}, [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
    ]),
    sitting: state({}, [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
      joint("leftLowerLeg", 90),
      joint("rightLowerLeg", 90),
    ]),
    squat: state({}, [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
      joint("leftLowerLeg", 120),
      joint("rightLowerLeg", 120),
      joint("leftFoot", 20),
      joint("rightFoot", 20),
    ]),
    "head-turn": state({}, [
      joint("neck", null, null, 30),
      joint("head", 10, null, 20),
    ]),
  };
}
