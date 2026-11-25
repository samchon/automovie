import { auditAutoMovieOutcome } from "@automovie/engine";
import type { IAutoMovieAuditOutcome } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `auditAutoMovieOutcome` reports every required contact that was not measured
 * or carried too little impulse, and every forbidden contact that was, without
 * rewriting either list.
 *
 * Expectation: `a.hand` on `b.head` within [0.3, 0.5] s, at least 1 N s.
 *
 * Scenarios:
 *
 * 1. A contact named the other way round (`b.head` on `a.hand`) at 0.5 s, the
 *    window's closed end, carrying 2 N s satisfies it: no finding.
 * 2. The same contact at 0.6 s is outside the window: "no measured contact".
 * 3. Two contacts of 0.25 and 0.5 N s: the strongest, 0.5 N s, is below 1 N s.
 * 4. An expectation naming no regions matches any region, and with no minimum a 0
 *    N s touch satisfies it.
 * 5. The expectation as forbidden reports the matching contact, while a contact on
 *    another region (`a.foot`) does not match it.
 */
export function test_unit_engine_composition_audit_outcome(): void {
  const expectation: IAutoMovieAuditOutcome.IExpectation = {
    a: { subject: "a", region: "hand" },
    b: { subject: "b", region: "head" },
    window: { start: 0.3, end: 0.5 },
    minimumImpulse: 1,
  };
  const required: IAutoMovieAuditOutcome.IOutcome = {
    id: "lands",
    required: [expectation],
  };
  const contact = (
    seconds: number,
    impulse: number,
    region: string = "hand",
  ): IAutoMovieAuditOutcome.IContact => ({
    a: { subject: "b", region: "head" },
    b: { subject: "a", region },
    seconds,
    impulse,
  });
  const name: string = "a.hand - b.head in [0.3, 0.5] s";

  TestValidator.equals(
    "a reversed contact at the window's end satisfies it",
    auditAutoMovieOutcome(required, [contact(0.5, 2)]),
    [],
  );
  TestValidator.equals(
    "a contact after the window is missing",
    auditAutoMovieOutcome(required, [contact(0.6, 2)]),
    [`lands: no measured contact ${name}`],
  );
  TestValidator.equals(
    "the strongest of two weak contacts is reported",
    auditAutoMovieOutcome(required, [contact(0.3, 0.25), contact(0.4, 0.5)]),
    [`lands: contact ${name} carries 0.5 N s, below 1`],
  );
  TestValidator.equals(
    "an expectation naming no regions and no minimum takes any touch",
    auditAutoMovieOutcome(
      {
        id: "meets",
        required: [
          {
            a: { subject: "a" },
            b: { subject: "b" },
            window: { start: 0, end: 1 },
          },
        ],
      },
      [contact(0.5, 0, "foot")],
    ),
    [],
  );
  const forbidden: IAutoMovieAuditOutcome.IOutcome = {
    id: "misses",
    required: [],
    forbidden: [expectation],
  };
  TestValidator.equals(
    "a forbidden contact is reported and another region is not",
    [
      auditAutoMovieOutcome(forbidden, [contact(0.4, 2)]),
      auditAutoMovieOutcome(forbidden, [contact(0.4, 2, "foot")]),
    ],
    [[`misses: forbidden contact ${name}`], []],
  );
}
