import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { run } from "../actions/run";
import { stand } from "../actions/stand";
import { exercise } from "../exercise/exercise";
import { workout } from "../exercise/workout";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Exercises, stretches, yoga poses, dance holds and turns, and a few sport
 * acts under the names a screenplay uses (#3377, #3378), each a row of the
 * workout law with its kind fixed, or of a shipped law. A row leaves open
 * the count (`reps`), a held pose's `hold`, whether the body stays on its
 * support (`stay`), a bar's place and the manner.
 *
 * What a row shows and what its first pass leaves out is stated on its kind
 * (`WorkoutFloor`, `WorkoutStanding`, `WorkoutHanging`): equipment is not
 * shown and nothing is held. A flow (a sun salutation, a kata) is these
 * rows in sequence in the composition.
 *
 * A row's time is its kind's: an entry of 0.8 to 2.4 s, then the default
 * count of repetitions, each a few seconds of its steps, or one pose held for
 * the stated seconds. The rows that state them are those of the floor, lying
 * and dance kinds; the standing, gym, hanging and equipment kinds keep theirs
 * in their own `KINDS` tables (`WorkoutStanding`, `WorkoutGym`,
 * `WorkoutHanging`, `WorkoutEquipment`), all provisional, so read the table
 * for a count or a hold not given here. `reps` and `hold` replace them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what it leaves open and where its limits are stated.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a registered or shipped law (`HumanActionRow`), so it is data over a law that plans and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per exercise a screenplay names; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; a workout row fixes its kind alone, and the rows of other laws fix the value their name means (the mountain pose's provisional ten seconds, the strides' pace).
 */
export namespace HumanSportWorkout {
  /** Push-ups. Default 5 repetitions of 2 s after a 1.5 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const pushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["pushUp"]
  > = HumanActionRow.of("pushUp", workout, {
    kind: "pushUp",
  });

  /** Wide push-ups. Default 5 repetitions of 2 s after a 1.5 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const widePushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["widePushUp"]
  > = HumanActionRow.of("widePushUp", workout, {
    kind: "widePushUp",
  });

  /** A plank on the straight arms. Held 30 s after a 1.5 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const plank: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["plank"]
  > = HumanActionRow.of("plank", workout, { kind: "plank" });

  /** Mountain climbers. Default 8 repetitions of 0.6 s after a 1.5 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const mountainClimber: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["mountainClimber"]
  > = HumanActionRow.of("mountainClimber", workout, {
    kind: "mountainClimber",
  });

  /** Burpees, without the jump. Default 3 repetitions of 1.1 s after a 0.8 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const burpee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["burpee"]
  > = HumanActionRow.of("burpee", workout, {
    kind: "burpee",
  });

  /** The downward dog of yoga. Held 15 s after a 2 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const downwardDog: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["downwardDog"]
  > = HumanActionRow.of("downwardDog", workout, {
    kind: "downwardDog",
  });

  /** The cobra of yoga. Held 10 s after a 2.4 s entry; provisional ({@link WorkoutFloor.KINDS}). */
  export const cobra: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["cobra"]
  > = HumanActionRow.of("cobra", workout, { kind: "cobra" });

  /** Sit-ups. Default 5 repetitions of 2 s after a 2.4 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const sitUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["sitUp"]
  > = HumanActionRow.of("sitUp", workout, { kind: "sitUp" });

  /** Crunches. Default 8 repetitions of 1.6 s after a 2.4 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const crunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["crunch"]
  > = HumanActionRow.of("crunch", workout, {
    kind: "crunch",
  });

  /** Glute bridges. Default 5 repetitions of 3 s after a 2.4 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const gluteBridge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["gluteBridge"]
  > = HumanActionRow.of("gluteBridge", workout, {
    kind: "gluteBridge",
  });

  /** A partner's hamstring stretch, the stretched person's part. Held 20 s after a 2.4 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const pnfHamstring: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["pnfHamstring"]
  > = HumanActionRow.of("pnfHamstring", workout, {
    kind: "pnfHamstring",
  });

  /** A side plank. Held 20 s after a 2.4 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const sidePlank: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["sidePlank"]
  > = HumanActionRow.of("sidePlank", workout, {
    kind: "sidePlank",
  });

  /** The seated forward fold of yoga, and the seated hamstring stretch. Held 20 s after a 2 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const seatedFold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["seatedFold"]
  > = HumanActionRow.of("seatedFold", workout, {
    kind: "seatedFold",
  });

  /** The hurdler's hamstring stretch. Held 20 s after a 2 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const hurdlerStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["hurdlerStretch"]
  > = HumanActionRow.of("hurdlerStretch", workout, {
    kind: "hurdlerStretch",
  });

  /** A bench press, without its bar and bench. Default 5 repetitions of 2.5 s after a 2.4 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const benchPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["benchPress"]
  > = HumanActionRow.of("benchPress", workout, {
    kind: "benchPress",
  });

  /** Rowing on a machine. Default 5 repetitions of 2.2 s after a 2 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const rowing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["rowing"]
  > = HumanActionRow.of("rowing", workout, {
    kind: "rowing",
  });

  /** Pedalling a stationary bicycle. Default 8 repetitions of 0.8 s after a 2 s entry; provisional ({@link WorkoutLying.KINDS}). */
  export const cycling: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["cycling"]
  > = HumanActionRow.of("cycling", workout, {
    kind: "cycling",
  });

  /** Deadlifts, without the bar. */
  export const deadlift: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["deadlift"]
  > = HumanActionRow.of("deadlift", workout, {
    kind: "deadlift",
  });

  /** Back squats, without the bar. */
  export const backSquat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["backSquat"]
  > = HumanActionRow.of("backSquat", workout, {
    kind: "backSquat",
  });

  /** Kettlebell swings, without the bell. */
  export const kettlebellSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["kettlebellSwing"]
  > = HumanActionRow.of("kettlebellSwing", workout, {
    kind: "kettlebellSwing",
  });

  /** Overhead presses, without the bar. */
  export const overheadPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["overheadPress"]
  > = HumanActionRow.of("overheadPress", workout, {
    kind: "overheadPress",
  });

  /** Arm circles. */
  export const armCircles: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["armCircles"]
  > = HumanActionRow.of("armCircles", workout, {
    kind: "armCircles",
  });

  /** Leg swings. */
  export const legSwings: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["legSwings"]
  > = HumanActionRow.of("legSwings", workout, {
    kind: "legSwings",
  });

  /** Butt kicks in place. */
  export const buttKicks: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["buttKicks"]
  > = HumanActionRow.of("buttKicks", workout, {
    kind: "buttKicks",
  });

  /** The A-skip in place: the knees driven up in turn. */
  export const aSkip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["aSkip"]
  > = HumanActionRow.of("aSkip", exercise, {
    kind: "highKnees",
  });

  /** The B-skip in place. */
  export const bSkip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["bSkip"]
  > = HumanActionRow.of("bSkip", workout, { kind: "bSkip" });

  /** Strides: a run at an easy fast pace to the place the composition gives. */
  export const strides: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["strides"]
  > = HumanActionRow.of("strides", run, { pace: "run" });

  /** Skipping rope, the rope not shown. */
  export const jumpRope: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["jumpRope"]
  > = HumanActionRow.of("jumpRope", workout, {
    kind: "jumpRope",
  });

  /** A standing calf stretch. */
  export const calfStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["calfStretch"]
  > = HumanActionRow.of("calfStretch", workout, {
    kind: "calfStretch",
  });

  /** A chest stretch. */
  export const chestStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["chestStretch"]
  > = HumanActionRow.of("chestStretch", workout, {
    kind: "chestStretch",
  });

  /** A triceps stretch. */
  export const tricepsStretch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["tricepsStretch"]
  > = HumanActionRow.of("tricepsStretch", workout, {
    kind: "tricepsStretch",
  });

  /** A lunge with a twist, in place. */
  export const lungeTwist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["lungeTwist"]
  > = HumanActionRow.of("lungeTwist", workout, {
    kind: "lungeTwist",
  });

  /** The mountain pose of yoga: standing still ten seconds (provisional). */
  export const mountainPose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["mountainPose"]
  > = HumanActionRow.of("mountainPose", stand, {
    seconds: 10,
  });

  /** Warrior I of yoga. */
  export const warriorOne: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["warriorOne"]
  > = HumanActionRow.of("warriorOne", workout, {
    kind: "warriorOne",
  });

  /** Warrior II of yoga. */
  export const warriorTwo: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["warriorTwo"]
  > = HumanActionRow.of("warriorTwo", workout, {
    kind: "warriorTwo",
  });

  /** The standing half of a sun salutation; the plank, the cobra and the dog complete the flow as their own rows. */
  export const sunSalutation: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["sunSalutation"]
  > = HumanActionRow.of("sunSalutation", workout, {
    kind: "sunSalutation",
  });

  /** The triangle of yoga. */
  export const triangle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["triangle"]
  > = HumanActionRow.of("triangle", workout, {
    kind: "triangle",
  });

  /** Karate's front stance. */
  export const frontStance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["frontStance"]
  > = HumanActionRow.of("frontStance", workout, {
    kind: "frontStance",
  });

  /** Karate's low block. */
  export const lowBlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["lowBlock"]
  > = HumanActionRow.of("lowBlock", workout, {
    kind: "lowBlock",
  });

  /** Karate's rising block. */
  export const risingBlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["risingBlock"]
  > = HumanActionRow.of("risingBlock", workout, {
    kind: "risingBlock",
  });

  /** A football header, the ball not moved. */
  export const header: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["header"]
  > = HumanActionRow.of("header", workout, {
    kind: "header",
  });

  /** A chest trap, the ball not moved. */
  export const chestTrap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["chestTrap"]
  > = HumanActionRow.of("chestTrap", workout, {
    kind: "chestTrap",
  });

  /** A thigh trap, the ball not moved. */
  export const thighTrap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["thighTrap"]
  > = HumanActionRow.of("thighTrap", workout, {
    kind: "thighTrap",
  });

  /** A dancer's full turn. */
  export const spin: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["spin"]
  > = HumanActionRow.of("spin", workout, { kind: "spin" });

  /** The follower's underarm turn. */
  export const underarmTurn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["underarmTurn"]
  > = HumanActionRow.of("underarmTurn", workout, {
    kind: "underarmTurn",
  });

  /** One turn of a hammer or discus thrower. */
  export const hammerTurn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["hammerTurn"]
  > = HumanActionRow.of("hammerTurn", workout, {
    kind: "hammerTurn",
  });

  /** A ballroom closed hold. */
  export const closedHold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["closedHold"]
  > = HumanActionRow.of("closedHold", workout, {
    kind: "closedHold",
  });

  /** A ballet arabesque on the left foot. */
  export const arabesque: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["arabesque"]
  > = HumanActionRow.of("arabesque", workout, {
    kind: "arabesque",
  });

  /** A breaking baby freeze on both hands. Held 2 s after a 1.5 s entry; provisional ({@link WorkoutDance.KINDS}). */
  export const babyFreeze: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["babyFreeze"]
  > = HumanActionRow.of("babyFreeze", workout, {
    kind: "babyFreeze",
  });

  /** A street rock with chest and head isolations. */
  export const streetRock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["streetRock"]
  > = HumanActionRow.of("streetRock", workout, {
    kind: "streetRock",
  });

  /** A dead hang from a bar. */
  export const deadHang: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["deadHang"]
  > = HumanActionRow.of("deadHang", workout, {
    kind: "deadHang",
  });

  /** Pull-ups. */
  export const pullUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["pullUp"]
  > = HumanActionRow.of("pullUp", workout, {
    kind: "pullUp",
  });

  /** Chin-ups. */
  export const chinUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["chinUp"]
  > = HumanActionRow.of("chinUp", workout, {
    kind: "chinUp",
  });

  /** Hanging knee raises. */
  export const kneeRaise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["kneeRaise"]
  > = HumanActionRow.of("kneeRaise", workout, {
    kind: "kneeRaise",
  });

  /** A swing on a bar. */
  export const barSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportWorkout"]["barSwing"]
  > = HumanActionRow.of("barSwing", workout, {
    kind: "barSwing",
  });
}
