import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  workoutContacts,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `workoutContacts` is a workout's support windows: each support of the
 * exercise bears over the work's shares, or, when it names the repetition's
 * postures (`at`), over each span going between two of them, from the span's
 * opening instant to the next span's start, on the other side's part in a
 * repetition done on that side, adjacent windows joined; a support on the prop
 * bears on the named prop and on the ground without one; a body rising back to
 * a recovered stance plants both feet from `relax` to the end.
 *
 * A 4 s workout over shares 0.1 to 0.9: spans opened at `start`, `down` (1 s)
 * and `up` (2 s), `relax` at 3 s; the repetition goes down from `top` to
 * `bottom` and up back.
 *
 * Scenarios:
 *
 * 1. A grip on the prop with no postures named: over the work, on the bar.
 * 2. The left foot planted between `top` and `bottom`, the up span done on the
 *    other side: the left foot from 0.25 to 0.5, the right from 0.5 to 0.9.
 * 3. On one side, the two spans' windows join: the left foot from 0.25 to 0.9.
 * 4. Recovering adds both feet planted on the ground from 0.75 to 1.
 * 5. A prop support with no prop named bears on the ground.
 */
export function test_unit_motions_exercise_workout_contacts(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(4, [
    { name: "down", seconds: 1 },
    { name: "up", seconds: 2 },
    { name: "relax", seconds: 3 },
  ]);
  const base: workoutContacts.IProps = {
    kind: { supports: [] },
    prop: "bar",
    spans: [{ from: "start" }, { from: "down" }, { from: "up" }],
    starts: [0, 1, 2],
    between: [
      { name: "down", was: "top", is: "bottom", other: false },
      { name: "up", was: "bottom", is: "top", other: true },
    ],
    clock,
    from: 0.1,
    to: 0.9,
    recovers: false,
  };
  const windows = (
    props: Partial<workoutContacts.IProps>,
  ): IAutoMovieMotionHumanContactWindow[] =>
    workoutContacts({ ...base, ...props });

  // 1. Over the work, on the prop.
  TestValidator.equals(
    "a grip over the work on the bar",
    windows({
      kind: { supports: [{ part: "leftHand", kind: "grip", prop: true }] },
    }),
    [
      {
        part: "leftHand",
        kind: "grip",
        from: 0.1,
        to: 0.9,
        support: { kind: "prop", subject: "bar" },
      },
    ],
  );

  // 2. Between postures, the other side mirrored.
  const foot: workoutContacts.IProps["kind"] = {
    supports: [{ part: "leftFoot", kind: "plant", at: ["top", "bottom"] }],
  };
  TestValidator.equals(
    "the spans between the named postures, mirrored on the other side",
    windows({ kind: foot }),
    [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0.25,
        to: 0.5,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: 0.5,
        to: 0.9,
        support: { kind: "ground" },
      },
    ],
  );

  // 3. Joined on one side.
  TestValidator.equals(
    "adjacent windows join",
    windows({
      kind: foot,
      between: [
        { name: "down", was: "top", is: "bottom", other: false },
        { name: "up", was: "bottom", is: "top", other: false },
      ],
    }),
    [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0.25,
        to: 0.9,
        support: { kind: "ground" },
      },
    ],
  );

  // 4. Recovering.
  TestValidator.equals(
    "both feet planted from relax",
    windows({ recovers: true }),
    [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0.75,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: 0.75,
        to: 1,
        support: { kind: "ground" },
      },
    ],
  );

  // 5. No prop.
  TestValidator.equals(
    "a prop support without a prop bears on the ground",
    windows({
      prop: undefined,
      kind: { supports: [{ part: "leftHand", kind: "grip", prop: true }] },
    })[0]!.support,
    { kind: "ground" },
  );
}
