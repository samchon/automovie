import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { run } from "../../gait/internal/run";
import { stand } from "../../actions/internal/stand";
import { exercise } from "../../exercise/internal/exercise";
import { workout } from "../../exercise/internal/workout";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_STANCE_MOUNTAIN_POSE } from "../../next/presets/HUMAN_STANCE_MOUNTAIN_POSE";
import { HumanSportWorkoutBarSwing } from "./HumanSportWorkoutBarSwing";

/*
 * Exercises, stretches, yoga poses, dance holds and turns, and a few sport acts
 * under the names a screenplay uses, each a row of the workout law with its
 * kind fixed, or of a shipped law. A row leaves open the count (`reps`), a held
 * pose's `hold`, whether the body stays on its support (`stay`), a bar's place
 * and the manner.
 *
 * What a row shows and what its first pass leaves out is stated on its kind
 * (`WorkoutFloor`, `WorkoutStanding`, `WorkoutHanging`): equipment is not shown
 * and nothing is held. A flow (a sun salutation, a kata) is these rows in
 * sequence in the composition.
 *
 * A row's time is its kind's: an entry of 0.8 to 2.4 s, then the default count
 * of repetitions, each a few seconds of its steps, or one pose held for the
 * stated seconds. Each row states its own, all provisional. `reps` and `hold`
 * replace them.
 */
export namespace HumanSportWorkout {
  /*
   * Push-ups. Default 5 repetitions of 2 s after a 1.5 s entry; provisional
   * (WorkoutFloor.KINDS).
   */
  export const pushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["pushUp"]
  > = AutoMovieMotionHumanActionRow.of("pushUp", workout, {
    kind: "pushUp",
  });

  /*
   * Wide push-ups. Default 5 repetitions of 2 s after a 1.5 s entry;
   * provisional (WorkoutFloor.KINDS).
   */
  export const widePushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["widePushUp"]
  > = AutoMovieMotionHumanActionRow.of("widePushUp", workout, {
    kind: "widePushUp",
  });

  /*
   * A plank on the straight arms. Held 30 s after a 1.5 s entry; provisional
   * (WorkoutFloor.KINDS).
   */
  export const plank: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["plank"]
  > = AutoMovieMotionHumanActionRow.of("plank", workout, { kind: "plank" });

  /*
   * Mountain climbers. Default 8 repetitions of 0.6 s after a 1.5 s entry;
   * provisional (WorkoutFloor.KINDS).
   */
  export const mountainClimber: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["mountainClimber"]
  > = AutoMovieMotionHumanActionRow.of("mountainClimber", workout, {
    kind: "mountainClimber",
  });

  /*
   * Burpees, without the jump. Default 3 repetitions of 1.1 s after a 0.8 s
   * entry; provisional (WorkoutFloor.KINDS).
   */
  export const burpee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["burpee"]
  > = AutoMovieMotionHumanActionRow.of("burpee", workout, {
    kind: "burpee",
  });

  /*
   * The downward dog of yoga. Held 15 s after a 2 s entry; provisional
   * (WorkoutFloor.KINDS).
   */
  export const downwardDog: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["downwardDog"]
  > = AutoMovieMotionHumanActionRow.of("downwardDog", workout, {
    kind: "downwardDog",
  });

  /*
   * The cobra of yoga. Held 10 s after a 2.4 s entry; provisional
   * (WorkoutFloor.KINDS).
   */
  export const cobra: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["cobra"]
  > = AutoMovieMotionHumanActionRow.of("cobra", workout, { kind: "cobra" });

  /*
   * Sit-ups. Default 5 repetitions of 2 s after a 2.4 s entry; provisional
   * (WorkoutLying.KINDS).
   */
  export const sitUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["sitUp"]
  > = AutoMovieMotionHumanActionRow.of("sitUp", workout, { kind: "sitUp" });

  /*
   * Crunches. Default 8 repetitions of 1.6 s after a 2.4 s entry; provisional
   * (WorkoutLying.KINDS).
   */
  export const crunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["crunch"]
  > = AutoMovieMotionHumanActionRow.of("crunch", workout, {
    kind: "crunch",
  });

  /*
   * Glute bridges. Default 5 repetitions of 3 s after a 2.4 s entry;
   * provisional (WorkoutLying.KINDS).
   */
  export const gluteBridge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["gluteBridge"]
  > = AutoMovieMotionHumanActionRow.of("gluteBridge", workout, {
    kind: "gluteBridge",
  });

  /*
   * A partner's hamstring stretch, the stretched person's part. Held 20 s after
   * a 2.4 s entry; provisional (WorkoutLying.KINDS).
   */
  export const pnfHamstring: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["pnfHamstring"]
  > = AutoMovieMotionHumanActionRow.of("pnfHamstring", workout, {
    kind: "pnfHamstring",
  });

  /*
   * A side plank. Held 20 s after a 2.4 s entry; provisional
   * (WorkoutLying.KINDS).
   */
  export const sidePlank: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["sidePlank"]
  > = AutoMovieMotionHumanActionRow.of("sidePlank", workout, {
    kind: "sidePlank",
  });

  /*
   * The seated forward fold of yoga, and the seated hamstring stretch. Held 20
   * s after a 2 s entry; provisional (WorkoutLying.KINDS).
   */
  export const seatedFold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["seatedFold"]
  > = AutoMovieMotionHumanActionRow.of("seatedFold", workout, {
    kind: "seatedFold",
  });

  /*
   * The hurdler's hamstring stretch. Held 20 s after a 2 s entry; provisional
   * (WorkoutLying.KINDS).
   */
  export const hurdlerStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["hurdlerStretch"]
  > = AutoMovieMotionHumanActionRow.of("hurdlerStretch", workout, {
    kind: "hurdlerStretch",
  });

  /*
   * A bench press, without its bar and bench. Default 5 repetitions of 2.5 s
   * after a 2.4 s entry; provisional (WorkoutLying.KINDS).
   */
  export const benchPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["benchPress"]
  > = AutoMovieMotionHumanActionRow.of("benchPress", workout, {
    kind: "benchPress",
  });

  /*
   * Rowing on a machine. Default 5 repetitions of 2.2 s after a 2 s entry;
   * provisional (WorkoutLying.KINDS).
   */
  export const rowing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["rowing"]
  > = AutoMovieMotionHumanActionRow.of("rowing", workout, {
    kind: "rowing",
  });

  /*
   * Pedalling a stationary bicycle. Default 8 repetitions of 0.8 s after a 2 s
   * entry; provisional (WorkoutLying.KINDS).
   */
  export const cycling: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["cycling"]
  > = AutoMovieMotionHumanActionRow.of("cycling", workout, {
    kind: "cycling",
  });

  /*
   * Deadlifts, without the bar. Default 5 repetitions of 2.7 s after a 0 s
   * entry; provisional (WorkoutStanding.KINDS).
   */
  export const deadlift: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["deadlift"]
  > = AutoMovieMotionHumanActionRow.of("deadlift", workout, {
    kind: "deadlift",
  });

  /*
   * Back squats, without the bar. Default 5 repetitions of 3 s after a 0.8 s
   * entry; provisional (WorkoutStanding.KINDS).
   */
  export const backSquat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["backSquat"]
  > = AutoMovieMotionHumanActionRow.of("backSquat", workout, {
    kind: "backSquat",
  });

  /*
   * Kettlebell swings, without the bell. Default 8 repetitions of 0.9 s after a
   * 0.8 s entry; provisional (WorkoutStanding.KINDS).
   */
  export const kettlebellSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["kettlebellSwing"]
  > = AutoMovieMotionHumanActionRow.of("kettlebellSwing", workout, {
    kind: "kettlebellSwing",
  });

  /*
   * Overhead presses, without the bar. Default 5 repetitions of 2 s after a 0.8
   * s entry; provisional (WorkoutStanding.KINDS).
   */
  export const overheadPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["overheadPress"]
  > = AutoMovieMotionHumanActionRow.of("overheadPress", workout, {
    kind: "overheadPress",
  });

  /*
   * Arm circles. Default 5 repetitions of 1.4 s after a 0.3 s entry;
   * provisional (WorkoutStanding.KINDS).
   */
  export const armCircles: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["armCircles"]
  > = AutoMovieMotionHumanActionRow.of("armCircles", workout, {
    kind: "armCircles",
  });

  /*
   * Leg swings. Default 6 repetitions of 1.3 s after a 0 s entry; provisional
   * (WorkoutStanding.KINDS).
   */
  export const legSwings: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["legSwings"]
  > = AutoMovieMotionHumanActionRow.of("legSwings", workout, {
    kind: "legSwings",
  });

  /*
   * Butt kicks in place. Default 8 repetitions of 0.4 s after a 0 s entry;
   * provisional (WorkoutStanding.KINDS).
   */
  export const buttKicks: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["buttKicks"]
  > = AutoMovieMotionHumanActionRow.of("buttKicks", workout, {
    kind: "buttKicks",
  });

  /*
   * The A-skip in place: the knees driven up in turn.
   */
  export const aSkip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["aSkip"]
  > = AutoMovieMotionHumanActionRow.of("aSkip", exercise, {
    kind: "highKnees",
  });

  /*
   * The B-skip in place. Default 6 repetitions of 0.65 s after a 0 s entry;
   * provisional (WorkoutStanding.KINDS).
   */
  export const bSkip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["bSkip"]
  > = AutoMovieMotionHumanActionRow.of("bSkip", workout, { kind: "bSkip" });

  /*
   * Strides: a run at an easy fast pace to the place the composition gives.
   */
  export const strides: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["strides"]
  > = AutoMovieMotionHumanActionRow.of("strides", run, { pace: "run" });

  /*
   * Skipping rope, the rope not shown. Default 10 repetitions of 0.3 s after a
   * 0.3 s entry; provisional (WorkoutStanding.KINDS).
   */
  export const jumpRope: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["jumpRope"]
  > = AutoMovieMotionHumanActionRow.of("jumpRope", workout, {
    kind: "jumpRope",
  });

  /*
   * A standing calf stretch.
   */
  export const calfStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["calfStretch"]
  > = AutoMovieMotionHumanActionRow.of("calfStretch", workout, {
    kind: "calfStretch",
  });

  /*
   * A chest stretch.
   */
  export const chestStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["chestStretch"]
  > = AutoMovieMotionHumanActionRow.of("chestStretch", workout, {
    kind: "chestStretch",
  });

  /*
   * A triceps stretch.
   */
  export const tricepsStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["tricepsStretch"]
  > = AutoMovieMotionHumanActionRow.of("tricepsStretch", workout, {
    kind: "tricepsStretch",
  });

  /*
   * A lunge with a twist, in place.
   */
  export const lungeTwist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["lungeTwist"]
  > = AutoMovieMotionHumanActionRow.of("lungeTwist", workout, {
    kind: "lungeTwist",
  });

  /*
   * The mountain pose of yoga: standing still ten seconds (provisional).
   */
  export const mountainPose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["mountainPose"]
  > = AutoMovieMotionHumanActionRow.of(
    "mountainPose",
    stand,
    HUMAN_STANCE_MOUNTAIN_POSE,
  );

  /*
   * Warrior I of yoga.
   */
  export const warriorOne: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["warriorOne"]
  > = AutoMovieMotionHumanActionRow.of("warriorOne", workout, {
    kind: "warriorOne",
  });

  /*
   * Warrior II of yoga.
   */
  export const warriorTwo: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["warriorTwo"]
  > = AutoMovieMotionHumanActionRow.of("warriorTwo", workout, {
    kind: "warriorTwo",
  });

  /*
   * The standing half of a sun salutation; the plank, the cobra and the dog
   * complete the flow as their own rows.
   */
  export const sunSalutation: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["sunSalutation"]
  > = AutoMovieMotionHumanActionRow.of("sunSalutation", workout, {
    kind: "sunSalutation",
  });

  /*
   * The triangle of yoga.
   */
  export const triangle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["triangle"]
  > = AutoMovieMotionHumanActionRow.of("triangle", workout, {
    kind: "triangle",
  });

  /*
   * Karate's front stance.
   */
  export const frontStance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["frontStance"]
  > = AutoMovieMotionHumanActionRow.of("frontStance", workout, {
    kind: "frontStance",
  });

  /*
   * Karate's low block.
   */
  export const lowBlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["lowBlock"]
  > = AutoMovieMotionHumanActionRow.of("lowBlock", workout, {
    kind: "lowBlock",
  });

  /*
   * Karate's rising block.
   */
  export const risingBlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["risingBlock"]
  > = AutoMovieMotionHumanActionRow.of("risingBlock", workout, {
    kind: "risingBlock",
  });

  /*
   * A football header, the ball not moved.
   */
  export const header: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["header"]
  > = AutoMovieMotionHumanActionRow.of("header", workout, {
    kind: "header",
  });

  /*
   * A chest trap, the ball not moved.
   */
  export const chestTrap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["chestTrap"]
  > = AutoMovieMotionHumanActionRow.of("chestTrap", workout, {
    kind: "chestTrap",
  });

  /*
   * A thigh trap, the ball not moved.
   */
  export const thighTrap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["thighTrap"]
  > = AutoMovieMotionHumanActionRow.of("thighTrap", workout, {
    kind: "thighTrap",
  });

  /*
   * A dancer's full turn.
   */
  export const spin: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["spin"]
  > = AutoMovieMotionHumanActionRow.of("spin", workout, { kind: "spin" });

  /*
   * The follower's underarm turn.
   */
  export const underarmTurn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["underarmTurn"]
  > = AutoMovieMotionHumanActionRow.of("underarmTurn", workout, {
    kind: "underarmTurn",
  });

  /*
   * One turn of a hammer or discus thrower.
   */
  export const hammerTurn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["hammerTurn"]
  > = AutoMovieMotionHumanActionRow.of("hammerTurn", workout, {
    kind: "hammerTurn",
  });

  /*
   * A ballroom closed hold.
   */
  export const closedHold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["closedHold"]
  > = AutoMovieMotionHumanActionRow.of("closedHold", workout, {
    kind: "closedHold",
  });

  /*
   * A ballet arabesque on the left foot.
   */
  export const arabesque: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["arabesque"]
  > = AutoMovieMotionHumanActionRow.of("arabesque", workout, {
    kind: "arabesque",
  });

  /*
   * A breaking baby freeze on both hands. Held 2 s after a 1.5 s entry;
   * provisional (WorkoutDance.KINDS).
   */
  export const babyFreeze: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["babyFreeze"]
  > = AutoMovieMotionHumanActionRow.of("babyFreeze", workout, {
    kind: "babyFreeze",
  });

  /*
   * A street rock with chest and head isolations.
   */
  export const streetRock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["streetRock"]
  > = AutoMovieMotionHumanActionRow.of("streetRock", workout, {
    kind: "streetRock",
  });

  /*
   * A dead hang from a bar. Held 10 s after a 1 s entry; provisional
   * (WorkoutHanging.KINDS).
   */
  export const deadHang: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["deadHang"]
  > = AutoMovieMotionHumanActionRow.of("deadHang", workout, {
    kind: "deadHang",
  });

  /*
   * Pull-ups. Default 3 repetitions of 2.5 s after a 1 s entry; provisional
   * (WorkoutHanging.KINDS).
   */
  export const pullUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["pullUp"]
  > = AutoMovieMotionHumanActionRow.of("pullUp", workout, {
    kind: "pullUp",
  });

  /*
   * Chin-ups. Default 3 repetitions of 2.5 s after a 1 s entry; provisional
   * (WorkoutHanging.KINDS).
   */
  export const chinUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["chinUp"]
  > = AutoMovieMotionHumanActionRow.of("chinUp", workout, {
    kind: "chinUp",
  });

  /*
   * Hanging knee raises. Default 5 repetitions of 2 s after a 1 s entry;
   * provisional (WorkoutHanging.KINDS).
   */
  export const kneeRaise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["kneeRaise"]
  > = AutoMovieMotionHumanActionRow.of("kneeRaise", workout, {
    kind: "kneeRaise",
  });

  /*
   * HumanSportWorkoutBarSwing, read through this namespace.
   */
  export const barSwing: typeof HumanSportWorkoutBarSwing =
    HumanSportWorkoutBarSwing;
}
