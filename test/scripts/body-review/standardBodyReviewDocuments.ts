import { createHumanBodyJointPoseRow as joint } from "@automovie/human/body/document/createHumanBodyJointPoseRow";
import { createHumanBodyShoulderPose } from "@automovie/human/body/document/createHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IBodyReviewState } from "./IBodyReviewState";

/**
 * The review states a body change is looked at in by default: the macro axes
 * at their ends (sex, age, weight, muscle), two mixed builds, and the poses
 * the editor offers, each of which opens a different joint or contact.
 *
 * Each state names macro channels and joint angles in the units the editor
 * takes: macro channels in `[-1, 1]` about the basis neutral and joint angles
 * in clinical degrees. Arms are raised through `shoulders`, the thorax-relative
 * goals the builder resolves into the clavicle, scapula and humerus (plane 0
 * lateral, +90 anterior; total elevation and axial rotation in degrees); the
 * editor refuses an upper arm raised through its joint row. None is a person; a state is a probe of the shape
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
    shoulders?: IAutoMovieHumanBodyShoulderPose[],
  ): IBodyReviewState =>
    shoulders === undefined ? { shape, pose } : { shape, pose, shoulders };
  const arms = (
    plane: number,
    elevation: number,
  ): IAutoMovieHumanBodyShoulderPose[] =>
    (["leftUpperArm", "rightUpperArm"] as const).map((bone) =>
      createHumanBodyShoulderPose(bone, plane, elevation),
    );
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
    "arms-lateral-90": state({}, [], arms(0, 90)),
    "arms-forward-90": state({}, [], arms(90, 90)),
    "arms-overhead": state({}, [], arms(30, 150)),
    "elbows-90": state({}, [
      joint("leftLowerArm", 90),
      joint("rightLowerArm", 90),
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
