import type { IAutoMovieMotionHumanInterruptRow } from "@automovie/interface";
import { HumanSegmentCut } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A redirect into a run, from a quarter of the walk to its contact event. */
const REDIRECT: IAutoMovieMotionHumanInterruptRow = {
  window: [0.25, "contact"],
  kind: "redirect",
  entry: 0,
};

/** An inertialized cut into anything over the walk's last tenth. */
const ANY: IAutoMovieMotionHumanInterruptRow = {
  window: [0.9, 1],
  kind: "inertialize",
  entry: 0,
};

/** A phase cut the entered action accepts from a walk at any share. */
const PHASE: IAutoMovieMotionHumanInterruptRow = {
  window: [0, 1],
  kind: "phase",
  entry: 0,
};

/** A walk over 0 to 2 s, its contact event at half of it. */
const WALK: HumanSegmentCut.IPrevious = {
  name: "walk",
  start: 0,
  end: 2,
  plan: { duration: 2, events: [{ name: "contact", share: 0.5 }] },
  law: { interrupts: { run: [REDIRECT], any: [ANY] } },
};

/** The walk's schedule entry, ending at its natural end. */
const ENDED: HumanSegmentCut.IBefore = { end: 2 };

/**
 * `HumanSegmentCut.row` is the legality of cutting one action into the next: an
 * action entered before the previous one ends, or at the end the schedule cut
 * it at, takes the interrupt row whose window, a share or an event name of the
 * previous plan, holds the cut's share; the rows are read from the previous
 * law's row for the entered action, then for its family, then the entered
 * action's own `accepts` for the previous one, then either side's `any`. A cut
 * outside every window is refused with the windows listed; a first action, a
 * gap or a natural end needs no row.
 *
 * A walk over 0 to 2 s: into a run from a quarter to its contact event at half,
 * into anything over its last tenth.
 *
 * Scenarios:
 *
 * 1. A first action, and an entry at the walk's natural end, need no row.
 * 2. A run entered at 0.8 s, share 0.4, takes the redirect; at 1 s, the contact
 *    event's share itself, too.
 * 3. A run entered at 1.5 s, share 0.75, is refused, its window listed.
 * 4. A sit entered at 1.9 s falls to `any`, the inertialized cut.
 * 5. A sit at 2 s where the schedule cut the walk, share 1, takes `any` too.
 * 6. A sprint of the run family at 0.8 s takes the run's row.
 * 7. A kneel that accepts walks by phase, at 0.8 s, takes its own row before the
 *    walk's `any`.
 */
export function test_motions_perform_segment_cut(): void {
  const row = (
    name: string,
    start: number,
    before: HumanSegmentCut.IBefore = ENDED,
    accepts?: Parameters<typeof HumanSegmentCut.row>[5],
    family?: string,
  ): IAutoMovieMotionHumanInterruptRow | undefined =>
    HumanSegmentCut.row("ana", WALK, before, name, start, accepts, family);

  // 1. No cut.
  TestValidator.predicate(
    "a first action and a natural end need no row",
    HumanSegmentCut.row("ana", undefined, undefined, "run", 0.8) ===
      undefined && row("run", 2) === undefined,
  );

  // 2. Inside the redirect's window.
  TestValidator.predicate(
    "a run inside the window, the event's share included",
    row("run", 0.8) === REDIRECT && row("run", 1) === REDIRECT,
  );

  // 3. Outside it.
  TestValidator.predicate(
    "a run outside the window is refused",
    throwsError(
      (): IAutoMovieMotionHumanInterruptRow | undefined => row("run", 1.5),
      ["walk cannot be cut into run at share 0.750", "[0.25, contact]"],
    ),
  );

  // 4. The walk's own rule for anything.
  TestValidator.predicate("a sit falls to any", row("sit", 1.9) === ANY);

  // 5. A scheduled cut at the end.
  TestValidator.predicate(
    "a scheduled cut at the walk's end",
    row("sit", 2, { end: 2, cut: { share: 1 } }) === ANY,
  );

  // 6. The family.
  TestValidator.predicate(
    "a sprint reads the run's row",
    row("sprint", 0.8, ENDED, undefined, "run") === REDIRECT,
  );

  // 7. The entered action's own table.
  TestValidator.predicate(
    "a kneel's own acceptance comes before the walk's any",
    row("kneel", 0.8, ENDED, { walk: [PHASE] }) === PHASE,
  );
}
