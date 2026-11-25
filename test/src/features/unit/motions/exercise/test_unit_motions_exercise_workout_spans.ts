import type { IAutoMovieMotionHumanExerciseKey } from "@automovie/interface";
import { workoutSpans } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A key told apart by its pitch. */
const key = (pitch: number): IAutoMovieMotionHumanExerciseKey.IKey => ({
  pitch,
  roll: 0,
  yaw: 0,
  lift: 0,
  joints: {},
});

/** A two-step route: down, then up and held. */
const PROPS: workoutSpans.IProps = {
  kind: { alternate: false, enter: 0.6 },
  route: [
    { key: key(1), seconds: 1, hold: 0.2, leave: "lower", event: "down" },
    {
      key: key(2),
      seconds: 1,
      hold: 0.3,
      held: true,
      leave: "raise",
      event: "up",
    },
  ],
  reps: 2,
  stay: false,
  hold: 2,
  stood: key(0),
  setup: 0.8,
  relax: 0.5,
};

/**
 * The `workout` law's spans (`workoutSpans`): down from standing into the
 * route's first key, each repetition leaving and reaching each next key and
 * holding it (the author's hold on a held key), up again unless the body stays,
 * and a settle.
 *
 * Scenarios:
 *
 * 1. Two repetitions of the route: enter 0.8, raise1 1, up1 2 (held), lower1 1,
 *    down1 0.2, the same again, release 0.6 and relax 0.5; up1 and up2 are
 *    held, and raise1 leaves `down` for `up` on the same side.
 * 2. Staying, the release is dropped and the settle keeps the last key.
 */
export function test_unit_motions_exercise_workout_spans(): void {
  const planned: workoutSpans.IPlanned = workoutSpans(PROPS);
  TestValidator.equals(
    "the phases",
    planned.phases.map((p) => [p.name, p.seconds]),
    [
      ["enter", 0.8],
      ["raise1", 1],
      ["up1", 2],
      ["lower1", 1],
      ["down1", 0.2],
      ["raise2", 1],
      ["up2", 2],
      ["lower2", 1],
      ["down2", 0.2],
      ["release", 0.6],
      ["relax", 0.5],
    ],
  );
  TestValidator.equals("the held", planned.held, ["up1", "up2"]);
  TestValidator.equals("the first between", planned.between[0], {
    name: "raise1",
    was: "down",
    is: "up",
    other: false,
  });
  const stayed: workoutSpans.IPlanned = workoutSpans({ ...PROPS, stay: true });
  TestValidator.predicate(
    "staying",
    stayed.phases.every((p) => p.name !== "release") &&
      stayed.spans[stayed.spans.length - 1]!.b.pitch === 1,
  );
}
