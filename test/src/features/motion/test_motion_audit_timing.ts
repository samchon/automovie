import { AutoMovieMotionHumanAuditTiming } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The timing audit complains about each incoherent declaration of an
 * action's time, about named instants out of their stated order, and about
 * two partners who disagree on an instant they share.
 *
 * The sound action is a 4 s `reach` that starts and is entered at 2 s and
 * ends at 6 s, with the events `lift` at 0.25, `touch` at 0.5 and `release`
 * at 0.75 of it, a right-hand grip from 0.5 to 0.75 and its decisive instant
 * 2 s in. Every broken action is the sound one with a single declaration
 * changed.
 *
 * Scenarios:
 * 1. The sound action alone, and followed by a second one entered where it
 *    ends, read no fault.
 * 2. Each of 11 single changes reads exactly one fault that names it: an
 *    entry before the start, an end before the entry, an end past the plan's
 *    length, an entry before the previous action ends, an event past 1 and
 *    one that is not a number, a name used twice, a window that ends before
 *    it starts and one that ends past 1, a decisive instant past the end,
 *    and a decisive instant beside a feigned one. A duration of zero, and
 *    one that is not a number, read their own fault first, before the ones
 *    that follow from an action with no length.
 * 3. `touch` falls at `2 + 0.5 * 4 = 4` s of the film; an undeclared event
 *    is refused.
 * 4. `lift, touch, release` is in order; `touch, lift` reads one line, a
 *    missing `clasp` one line, and two events at one share are in order.
 * 5. A partner whose 3 s action starts at 2.5 s with `clasp` at 0.5 shares
 *    the 4 s instant exactly; started 0.12 s later, the two are 0.12 s
 *    apart.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public readings on written declarations; a rule not read, a fault blamed on a sound declaration, an order or a shared instant misread fails.
 * @evidence contracts/development/testing.md#independent-expectations Each fault is the one declaration the test changed, and each instant the start plus the share times the duration written above.
 * @evidence contracts/development/testing.md#distinguishing-cases Sound alone and in sequence, 13 distinct faults, a present and an absent event, three orders, and partners in and out of step.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-written spans; nothing is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation States the sound action and the 5 scenarios with their numbers.
 */
export function test_motion_audit_timing(): void {
  type Span = AutoMovieMotionHumanAuditTiming.ISpan;
  const sound = (): Span => ({
    name: "reach",
    start: 2,
    entryTime: 2,
    end: 6,
    plan: {
      duration: 4,
      events: [
        { name: "lift", share: 0.25 },
        { name: "touch", share: 0.5 },
        { name: "release", share: 0.75 },
      ],
      contacts: [
        {
          part: "rightHand",
          kind: "grip",
          from: 0.5,
          to: 0.75,
          support: { kind: "prop", subject: "cup" },
        },
      ],
      contact: 2,
    },
  });
  const next = (entryTime: number): Span => ({
    name: "rest",
    start: entryTime,
    entryTime,
    end: entryTime + 1,
    plan: { duration: 1, events: [], contacts: [] },
  });
  const change = (edit: (span: Span) => void): Span => {
    const span: Span = sound();
    edit(span);
    return span;
  };
  const grip = (from: number, to: number): Span["plan"]["contacts"] => [
    {
      part: "rightHand",
      kind: "grip",
      from,
      to,
      support: { kind: "prop", subject: "cup" },
    },
  ];

  // 1. Sound.
  TestValidator.equals(
    "a sound action has no fault",
    AutoMovieMotionHumanAuditTiming.faults([sound()]),
    [],
  );
  TestValidator.equals(
    "a sound sequence has no fault",
    AutoMovieMotionHumanAuditTiming.faults([sound(), next(6)]),
    [],
  );

  // 2. One fault for one broken declaration.
  for (const duration of [0, Number.NaN]) {
    const found: string[] = AutoMovieMotionHumanAuditTiming.faults([
      change((s: Span): void => void (s.plan = { ...s.plan, duration })),
    ]);
    TestValidator.predicate(
      `a duration of ${duration} is the first fault, got ${JSON.stringify(found)}`,
      found.length >= 1 && found[0] === `0 reach: duration ${duration}`,
    );
  }
  const broken: [string, Span[], RegExp][] = [
    [
      "an entry before the start",
      [change((s: Span): void => void (s.entryTime = 1.5))],
      /before its start/,
    ],
    [
      "an end before the entry",
      [
        change((s: Span): void => {
          s.entryTime = 5;
          s.end = 4;
        }),
      ],
      /before its entry/,
    ],
    [
      "an end past the plan",
      [change((s: Span): void => void (s.end = 6.5))],
      /after its plan/,
    ],
    [
      "an entry before the previous action ends",
      [sound(), next(5.5)],
      /^1 rest: entered at 5\.5 before reach ends$/,
    ],
    [
      "an event past the action",
      [
        change(
          (s: Span): void =>
            void (s.plan = {
              ...s.plan,
              events: [{ name: "late", share: 1.2 }],
            }),
        ),
      ],
      /event late at share 1\.2/,
    ],
    [
      "an event that is not a number",
      [
        change(
          (s: Span): void =>
            void (s.plan = {
              ...s.plan,
              events: [{ name: "lost", share: Number.NaN }],
            }),
        ),
      ],
      /event lost at share NaN/,
    ],
    [
      "a name used twice",
      [
        change(
          (s: Span): void =>
            void (s.plan = {
              ...s.plan,
              events: [
                { name: "touch", share: 0.4 },
                { name: "touch", share: 0.6 },
              ],
            }),
        ),
      ],
      /event touch twice/,
    ],
    [
      "a window that ends before it starts",
      [
        change(
          (s: Span): void =>
            void (s.plan = { ...s.plan, contacts: grip(0.7, 0.4) }),
        ),
      ],
      /grip of rightHand from 0\.7 to 0\.4/,
    ],
    [
      "a window past the action",
      [
        change(
          (s: Span): void =>
            void (s.plan = { ...s.plan, contacts: grip(0.5, 1.1) }),
        ),
      ],
      /grip of rightHand from 0\.5 to 1\.1/,
    ],
    [
      "a decisive instant past the end",
      [change((s: Span): void => void (s.plan = { ...s.plan, contact: 4.5 }))],
      /contact at 4\.5 s of 4/,
    ],
    [
      "a decisive instant beside a feigned one",
      [change((s: Span): void => void (s.plan = { ...s.plan, feigned: 1 }))],
      /both a contact and a feigned contact/,
    ],
  ];
  for (const [label, spans, expected] of broken) {
    const found: string[] = AutoMovieMotionHumanAuditTiming.faults(spans);
    TestValidator.predicate(
      `${label} reads one fault that names it, got ${JSON.stringify(found)}`,
      found.length === 1 && expected.test(found[0]!),
    );
  }

  // 3. A named instant.
  TestValidator.equals(
    "touch falls at 4 s of the film",
    AutoMovieMotionHumanAuditTiming.instant(sound(), "touch"),
    4,
  );
  TestValidator.error("an undeclared event is refused", (): void => {
    AutoMovieMotionHumanAuditTiming.instant(sound(), "clasp");
  });

  // 4. A stated order.
  TestValidator.equals(
    "the declared order holds",
    AutoMovieMotionHumanAuditTiming.order(sound(), [
      "lift",
      "touch",
      "release",
    ]),
    [],
  );
  TestValidator.equals(
    "a reversed pair reads one line",
    AutoMovieMotionHumanAuditTiming.order(sound(), ["touch", "lift"]),
    ["reach: lift at share 0.25 before touch at 0.5"],
  );
  TestValidator.equals(
    "a missing event reads one line",
    AutoMovieMotionHumanAuditTiming.order(sound(), ["lift", "clasp", "touch"]),
    ["reach: no event clasp"],
  );
  TestValidator.equals(
    "two events at one share are in order",
    AutoMovieMotionHumanAuditTiming.order(
      change(
        (s: Span): void =>
          void (s.plan = {
            ...s.plan,
            events: [
              { name: "a", share: 0.5 },
              { name: "b", share: 0.5 },
            ],
          }),
      ),
      ["a", "b"],
    ),
    [],
  );

  // 5. A shared instant.
  const partner = (start: number): Span => ({
    name: "receive",
    start,
    entryTime: start,
    end: start + 3,
    plan: {
      duration: 3,
      events: [{ name: "clasp", share: 0.5 }],
      contacts: [],
    },
  });
  TestValidator.equals(
    "partners in step share the instant",
    AutoMovieMotionHumanAuditTiming.shared(
      sound(),
      "touch",
      partner(2.5),
      "clasp",
    ),
    0,
  );
  const apart: number = AutoMovieMotionHumanAuditTiming.shared(
    sound(),
    "touch",
    partner(2.62),
    "clasp",
  );
  TestValidator.predicate(
    `partners 0.12 s out of step are 0.12 s apart, got ${apart}`,
    Math.abs(apart - 0.12) <= 1e-12,
  );
}
