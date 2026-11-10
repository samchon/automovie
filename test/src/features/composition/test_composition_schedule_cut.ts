import {
  AutoMovieComposition,
  type IAutoMovieIntent,
  type IAutoMovieSchedule,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * An intent cut at a share or a named event ends there, and the next part of
 * its sequence starts there and is recorded as the interrupter.
 *
 * Scenarios:
 * 1. A 2 s kick cut at share 0.4 ends at 0.8 s; the 1 s step after it starts
 *    at 0.8 s and the kick's entry names it in `interruptedBy`.
 * 2. Cut at its `chamber` event (share 0.3), the kick ends at 0.6 s and the
 *    entry records the event's name.
 * 3. Metamorphic: moving the cut later moves the next start later by the
 *    share times the duration, and the contact (1.0 s) survives only a cut
 *    after it.
 * 4. A cut at an unknown event throws a message listing the action's events;
 *    a share outside [0, 1] throws.
 * 5. An uncut sequence and a cut last part record no interrupter.
 * 6. A cut at another subject's event: a 2 s guard of subject b, placed in
 *    parallel with a's kick anchored "k", cut `{ of: "k", event: "impact" }`
 *    ends at the kick's impact, 1.0 s; an unknown anchor or event throws.
 * 7. A proximity cut asks the laws' `until` for its share and ends there; with
 *    no `until` law it throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real compositions through the public resolver and reads entry times, cuts and interrupters; a cut ignored, placed at the wrong share, a contact kept after it or an interrupter on the wrong entry fails.
 * @evidence contracts/development/testing.md#independent-expectations Times follow from the declared durations and shares by arithmetic (start + share x duration); the error must name the declared events.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers share, own-event, other-subject-event and proximity cuts, contacts before and after the cut, invalid events and shares, an uncut sequence and a cut at the end.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 scenarios and what each pins.
 */
export function test_composition_schedule_cut(): void {
  const laws: resolveAutoMovieSchedule.ILaws = {
    timing: (intent: IAutoMovieIntent): resolveAutoMovieSchedule.ITiming =>
      intent.capability === "kick"
        ? {
            duration: 2,
            contact: 1,
            events: [
              { name: "chamber", share: 0.3 },
              { name: "impact", share: 0.5 },
            ],
          }
        : intent.capability === "guard"
          ? { duration: 2 }
          : { duration: 1 },
  };
  const kick = (until?: IAutoMovieIntent["until"]): IAutoMovieIntent => ({
    subject: "a",
    capability: "kick",
    ...(until === undefined ? {} : { until }),
  });
  const step: IAutoMovieIntent = { subject: "a", capability: "step" };
  const run = (...parts: IAutoMovieIntent[]): IAutoMovieSchedule =>
    resolveAutoMovieSchedule(AutoMovieComposition.sequence(...parts), laws);
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-12;

  const shared: IAutoMovieSchedule = run(kick({ share: 0.4 }), step);
  const [k, s] = shared.entries;
  TestValidator.predicate(
    "cut at share",
    close(k!.end, 0.8) &&
      k!.cut?.share === 0.4 &&
      close(s!.start, 0.8) &&
      k!.interruptedBy === s!.index,
  );
  TestValidator.predicate(
    "contact after the cut is dropped",
    k!.contact === undefined,
  );

  const evented: IAutoMovieSchedule = run(kick({ event: "chamber" }), step);
  TestValidator.predicate(
    "cut at event",
    close(evented.entries[0]!.end, 0.6) &&
      evented.entries[0]!.cut?.event === "chamber",
  );

  let previous: number = -Infinity;
  for (const share of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const e: IAutoMovieSchedule = run(kick({ share }), step);
    TestValidator.predicate(
      `next start moves with the cut (${share})`,
      close(e.entries[1]!.start, 2 * share) && e.entries[1]!.start > previous,
    );
    TestValidator.predicate(
      `contact survives only a later cut (${share})`,
      (e.entries[0]!.contact !== undefined) === 2 * share >= 1,
    );
    previous = e.entries[1]!.start;
  }

  TestValidator.predicate(
    "unknown event lists the events",
    ((): boolean => {
      try {
        run(kick({ event: "recoil" }), step);
        return false;
      } catch (error) {
        return (
          String(error).includes("chamber") && String(error).includes("impact")
        );
      }
    })(),
  );
  TestValidator.error("share outside [0, 1]", (): unknown =>
    run(kick({ share: 1.5 }), step),
  );
  const plain: IAutoMovieSchedule = run(kick(), step);
  const last: IAutoMovieSchedule = run(step, kick({ share: 0.5 }));
  TestValidator.predicate(
    "no interrupter without a cut or a follower",
    plain.entries[0]!.interruptedBy === undefined &&
      last.entries[1]!.interruptedBy === undefined &&
      close(last.entries[1]!.end, 2),
  );

  const guard = (until: IAutoMovieIntent["until"]): IAutoMovieIntent => ({
    subject: "b",
    capability: "guard",
    until,
  });
  const both = (
    until: IAutoMovieIntent["until"],
    l: resolveAutoMovieSchedule.ILaws = laws,
  ): IAutoMovieSchedule =>
    resolveAutoMovieSchedule(
      AutoMovieComposition.parallel(
        { ...kick(), anchor: "k" },
        AutoMovieComposition.sequence(guard(until), step),
      ),
      l,
    );
  const crossed: IAutoMovieSchedule = both({ of: "k", event: "impact" });
  const g = crossed.entries.find((e) => e.intent.capability === "guard")!;
  TestValidator.predicate(
    "cut at another subject's event",
    close(g.end, 1) && g.cut?.event === "k.impact",
  );
  TestValidator.error("unknown anchor", (): unknown =>
    both({ of: "x", event: "impact" }),
  );
  TestValidator.error("unknown event of the anchor", (): unknown =>
    both({ of: "k", event: "recoil" }),
  );
  const near = both(
    {
      proximity: {
        effector: "palmLeft",
        target: { kind: "none" },
        distance: 0.1,
      },
    },
    { ...laws, until: (): number => 0.25 },
  );
  TestValidator.predicate(
    "proximity cut at the laws' share",
    close(near.entries.find((e) => e.intent.capability === "guard")!.end, 0.5),
  );
  TestValidator.error("proximity without an until law", (): unknown =>
    both({
      proximity: {
        effector: "palmLeft",
        target: { kind: "none" },
        distance: 0,
      },
    }),
  );
}
