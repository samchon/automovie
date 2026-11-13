import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The exercises of the workout law done hanging from a bar by both hands
 * (#3377's bars, #3378's pull-ups): the dead hang, the pull-up, the
 * chin-up, the hanging knee raise and the swing.
 *
 * The hands' mean stays on the bar and everything else follows from the
 * joints: a pull-up is the elbows' and the shoulders' flexion with the
 * hands fixed, so the body rises by what the arms shorten; a swing is the
 * whole body's pitch about the hands. Angles are provisional (NSCA's
 * Essentials of Strength Training, 4th ed., for the pull-up's top: the chin
 * over the bar, the elbows beside the ribs).
 *
 * First pass: the bar is a place, not a prop, and the body is lifted to it
 * from standing without a jump being planned; a swing's rate is keyed, not
 * a pendulum's; a chin-up differs from a pull-up by the elbows kept ahead,
 * the forearm's turn not written.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what moves the body, the source and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres.
 */
export namespace WorkoutHanging {
  /** Hanging at the arms' length. */
  const hang: ExerciseKey.IKey = ExerciseKey.of(
    {},
    { shoulder: 178, raise: 10, elbow: 3 },
  );

  /** A hanging kind: both hands grip the bar. */
  const kind = (reps: number, route: WorkoutKind["route"]): WorkoutKind => ({
    base: "hanging",
    anchor: "bar",
    pin: ["leftHand", "rightHand"],
    supports: [
      { part: "leftHand", kind: "grip" },
      { part: "rightHand", kind: "grip" },
    ],
    enter: 1,
    reps,
    route,
  });

  /** The exercises' names. */
  export type Name =
    | "deadHang"
    | "pullUp"
    | "chinUp"
    | "kneeRaise"
    | "barSwing";

  /** The exercises. */
  export const KINDS: Readonly<Record<Name, WorkoutKind>> = {
    /** A dead hang, held 10 s. */
    deadHang: kind(1, (): WorkoutKind.IStep[] => [
      WorkoutKind.pose(hang, 0, 10),
    ]),

    /** A pull-up: 1 s up, 1.5 s down (provisional). */
    pullUp: kind(3, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(hang, 1.5, "lower", "hang"),
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 60, raise: 60, elbow: 140 }),
        1,
        "pull",
        "top",
      ),
    ]),

    /** A chin-up: the elbows kept ahead of the trunk. */
    chinUp: kind(3, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(hang, 1.5, "lower", "hang"),
      WorkoutKind.step(
        ExerciseKey.of({}, { shoulder: 100, raise: 5, elbow: 145 }),
        1,
        "pull",
        "top",
      ),
    ]),

    /** A hanging knee raise: the thighs brought level. */
    kneeRaise: kind(5, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(hang, 1, "lower", "hang"),
      WorkoutKind.step(
        ExerciseKey.of(
          {},
          { hip: 90, knee: 90, shoulder: 178, raise: 10, elbow: 3 },
        ),
        1,
        "raise",
        "top",
      ),
    ]),

    /** A swing on the bar: the body pitched 25 degrees behind and ahead of the hands (provisional). */
    barSwing: kind(3, (): WorkoutKind.IStep[] => [
      WorkoutKind.step(hang, 0.5, "pass", "under"),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: -25 },
          { hip: -15, shoulder: 165, raise: 10, elbow: 3 },
        ),
        0.5,
        "swingBack",
        "behind",
      ),
      WorkoutKind.step(
        ExerciseKey.of(
          { pitch: 25 },
          { hip: 30, shoulder: 150, raise: 10, elbow: 3 },
        ),
        0.9,
        "swing",
        "ahead",
      ),
    ]),
  };
}
