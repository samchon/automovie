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
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what it leaves open and where its limits are stated.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a registered or shipped law (`HumanActionRow`), so it is data over a law that plans and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per exercise a screenplay names; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; the kind is the only value fixed.
 */
export namespace HumanSportWorkout {
  /** Push-ups. */
  export const pushUp = HumanActionRow.of("pushUp", workout, {
    kind: "pushUp",
  });

  /** Wide push-ups. */
  export const widePushUp = HumanActionRow.of("widePushUp", workout, {
    kind: "widePushUp",
  });

  /** A plank on the straight arms. */
  export const plank = HumanActionRow.of("plank", workout, { kind: "plank" });

  /** Mountain climbers. */
  export const mountainClimber = HumanActionRow.of("mountainClimber", workout, {
    kind: "mountainClimber",
  });

  /** Burpees, without the jump. */
  export const burpee = HumanActionRow.of("burpee", workout, {
    kind: "burpee",
  });

  /** The downward dog of yoga. */
  export const downwardDog = HumanActionRow.of("downwardDog", workout, {
    kind: "downwardDog",
  });

  /** The cobra of yoga. */
  export const cobra = HumanActionRow.of("cobra", workout, { kind: "cobra" });

  /** Sit-ups. */
  export const sitUp = HumanActionRow.of("sitUp", workout, { kind: "sitUp" });

  /** Crunches. */
  export const crunch = HumanActionRow.of("crunch", workout, {
    kind: "crunch",
  });

  /** Glute bridges. */
  export const gluteBridge = HumanActionRow.of("gluteBridge", workout, {
    kind: "gluteBridge",
  });

  /** A partner's hamstring stretch, the stretched person's part. */
  export const pnfHamstring = HumanActionRow.of("pnfHamstring", workout, {
    kind: "pnfHamstring",
  });

  /** A side plank. */
  export const sidePlank = HumanActionRow.of("sidePlank", workout, {
    kind: "sidePlank",
  });

  /** The seated forward fold of yoga, and the seated hamstring stretch. */
  export const seatedFold = HumanActionRow.of("seatedFold", workout, {
    kind: "seatedFold",
  });

  /** The hurdler's hamstring stretch. */
  export const hurdlerStretch = HumanActionRow.of("hurdlerStretch", workout, {
    kind: "hurdlerStretch",
  });

  /** A bench press, without its bar and bench. */
  export const benchPress = HumanActionRow.of("benchPress", workout, {
    kind: "benchPress",
  });

  /** Rowing on a machine. */
  export const rowing = HumanActionRow.of("rowing", workout, {
    kind: "rowing",
  });

  /** Pedalling a stationary bicycle. */
  export const cycling = HumanActionRow.of("cycling", workout, {
    kind: "cycling",
  });

  /** Deadlifts, without the bar. */
  export const deadlift = HumanActionRow.of("deadlift", workout, {
    kind: "deadlift",
  });

  /** Back squats, without the bar. */
  export const backSquat = HumanActionRow.of("backSquat", workout, {
    kind: "backSquat",
  });

  /** Kettlebell swings, without the bell. */
  export const kettlebellSwing = HumanActionRow.of("kettlebellSwing", workout, {
    kind: "kettlebellSwing",
  });

  /** Overhead presses, without the bar. */
  export const overheadPress = HumanActionRow.of("overheadPress", workout, {
    kind: "overheadPress",
  });

  /** Arm circles. */
  export const armCircles = HumanActionRow.of("armCircles", workout, {
    kind: "armCircles",
  });

  /** Leg swings. */
  export const legSwings = HumanActionRow.of("legSwings", workout, {
    kind: "legSwings",
  });

  /** Butt kicks in place. */
  export const buttKicks = HumanActionRow.of("buttKicks", workout, {
    kind: "buttKicks",
  });

  /** The A-skip in place: the knees driven up in turn. */
  export const aSkip = HumanActionRow.of("aSkip", exercise, {
    kind: "highKnees",
  });

  /** The B-skip in place. */
  export const bSkip = HumanActionRow.of("bSkip", workout, { kind: "bSkip" });

  /** Strides: a run at an easy fast pace to the place the composition gives. */
  export const strides = HumanActionRow.of("strides", run, { pace: "run" });

  /** Skipping rope, the rope not shown. */
  export const jumpRope = HumanActionRow.of("jumpRope", workout, {
    kind: "jumpRope",
  });

  /** A standing calf stretch. */
  export const calfStretch = HumanActionRow.of("calfStretch", workout, {
    kind: "calfStretch",
  });

  /** A chest stretch. */
  export const chestStretch = HumanActionRow.of("chestStretch", workout, {
    kind: "chestStretch",
  });

  /** A triceps stretch. */
  export const tricepsStretch = HumanActionRow.of("tricepsStretch", workout, {
    kind: "tricepsStretch",
  });

  /** A lunge with a twist, in place. */
  export const lungeTwist = HumanActionRow.of("lungeTwist", workout, {
    kind: "lungeTwist",
  });

  /** The mountain pose of yoga: standing still ten seconds (provisional). */
  export const mountainPose = HumanActionRow.of("mountainPose", stand, {
    seconds: 10,
  });

  /** Warrior I of yoga. */
  export const warriorOne = HumanActionRow.of("warriorOne", workout, {
    kind: "warriorOne",
  });

  /** Warrior II of yoga. */
  export const warriorTwo = HumanActionRow.of("warriorTwo", workout, {
    kind: "warriorTwo",
  });

  /** The standing half of a sun salutation; the plank, the cobra and the dog complete the flow as their own rows. */
  export const sunSalutation = HumanActionRow.of("sunSalutation", workout, {
    kind: "sunSalutation",
  });

  /** The triangle of yoga. */
  export const triangle = HumanActionRow.of("triangle", workout, {
    kind: "triangle",
  });

  /** Karate's front stance. */
  export const frontStance = HumanActionRow.of("frontStance", workout, {
    kind: "frontStance",
  });

  /** Karate's low block. */
  export const lowBlock = HumanActionRow.of("lowBlock", workout, {
    kind: "lowBlock",
  });

  /** Karate's rising block. */
  export const risingBlock = HumanActionRow.of("risingBlock", workout, {
    kind: "risingBlock",
  });

  /** A football header, the ball not moved. */
  export const header = HumanActionRow.of("header", workout, {
    kind: "header",
  });

  /** A chest trap, the ball not moved. */
  export const chestTrap = HumanActionRow.of("chestTrap", workout, {
    kind: "chestTrap",
  });

  /** A thigh trap, the ball not moved. */
  export const thighTrap = HumanActionRow.of("thighTrap", workout, {
    kind: "thighTrap",
  });

  /** A dancer's full turn. */
  export const spin = HumanActionRow.of("spin", workout, { kind: "spin" });

  /** The follower's underarm turn. */
  export const underarmTurn = HumanActionRow.of("underarmTurn", workout, {
    kind: "underarmTurn",
  });

  /** One turn of a hammer or discus thrower. */
  export const hammerTurn = HumanActionRow.of("hammerTurn", workout, {
    kind: "hammerTurn",
  });

  /** A ballroom closed hold. */
  export const closedHold = HumanActionRow.of("closedHold", workout, {
    kind: "closedHold",
  });

  /** A dead hang from a bar. */
  export const deadHang = HumanActionRow.of("deadHang", workout, {
    kind: "deadHang",
  });

  /** Pull-ups. */
  export const pullUp = HumanActionRow.of("pullUp", workout, {
    kind: "pullUp",
  });

  /** Chin-ups. */
  export const chinUp = HumanActionRow.of("chinUp", workout, {
    kind: "chinUp",
  });

  /** Hanging knee raises. */
  export const kneeRaise = HumanActionRow.of("kneeRaise", workout, {
    kind: "kneeRaise",
  });

  /** A swing on a bar. */
  export const barSwing = HumanActionRow.of("barSwing", workout, {
    kind: "barSwing",
  });
}
