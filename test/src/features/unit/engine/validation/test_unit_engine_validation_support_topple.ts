import { detectSupportToppling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  nclose,
  validationHasWarningCount,
  vclose,
} from "../../../internal/predicates";

const v: (x: number, z: number) => IAutoMovieVector3 = (
  x: number,
  z: number,
): IAutoMovieVector3 => ({ x, y: 0, z });
const square: IAutoMovieVector3[] = [v(0, 0), v(2, 0), v(2, 2), v(0, 2)];

/**
 * `detectSupportToppling` compares the COM with its support footprint. Overhang
 * produces advisory feedback, a tip edge, a fall direction and a fall event;
 * `physicsIntent` suppresses the advice and suggestion while retaining the
 * event.
 *
 * Scenarios:
 *
 * 1. A centered COM is stable: success, no event, no suggestion.
 * 2. A COM overhanging past x=2 by 1m warns (not errors), with overshoot =
 *    distance − margin, a +x fall direction, a fall event, and the x=2 tip
 *    edge.
 * 3. A `physicsIntent` marker suppresses the warning and suggestion but still
 *    surfaces the event.
 * 4. An omitted node leaves the event actor null.
 * 5. A COM exactly on the hull edge is stable (distance 0 ≤ margin).
 * 6. Empty support is a type error; a negative margin is a range error.
 */
export function test_unit_engine_validation_support_topple(): void {
  const stable: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
      node: "crate",
      centerOfMass: v(1, 1),
      support: square,
    });
  TestValidator.predicate(
    "centered COM is stable",
    validationHasWarningCount("centered support", stable.validation, 0),
  );
  TestValidator.equals("stable emits no event", stable.events.length, 0);
  TestValidator.equals("stable suggests no topple", stable.toppling, null);

  const topple: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
      node: "crate",
      centerOfMass: v(3, 1),
      support: square,
    });
  TestValidator.predicate(
    "one topple warning surfaced",
    validationHasWarningCount("support overhang", topple.validation, 1),
  );
  TestValidator.predicate(
    "overshoot = distance - margin",
    nclose(topple.toppling!.overshoot, 1 - 0.02),
  );
  TestValidator.predicate(
    "falls toward +x",
    vclose(topple.toppling!.fallDirection, v(1, 0)),
  );
  TestValidator.equals("emits one fall event", topple.events.length, 1);
  TestValidator.equals("event kind is fall", topple.events[0]!.kind, "fall");
  TestValidator.equals(
    "tip edge lies on x=2",
    namedFacts([
      [
        "ncloseToppleToppling",
        (): boolean => nclose(topple.toppling!.tipEdgeStart.x, 2),
      ],
      [
        "ncloseToppleToppling2",
        (): boolean => nclose(topple.toppling!.tipEdgeEnd.x, 2),
      ],
    ]),
    { ncloseToppleToppling: true, ncloseToppleToppling2: true },
  );

  const intended: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
      centerOfMass: v(3, 1),
      support: square,
      physicsIntent: "levitates",
    });
  TestValidator.predicate(
    "intent suppresses the warning",
    validationHasWarningCount(
      "intended support overhang",
      intended.validation,
      0,
    ),
  );
  TestValidator.equals(
    "intent still surfaces the event",
    intended.events.length,
    1,
  );
  TestValidator.equals("intent suggests no topple", intended.toppling, null);
  TestValidator.equals(
    "anonymous event actor is null",
    intended.events[0]!.actor,
    null,
  );

  const onEdge: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
      centerOfMass: v(2, 1),
      support: square,
    });
  TestValidator.predicate(
    "COM on the hull edge is stable",
    validationHasWarningCount("support hull edge", onEdge.validation, 0) &&
      onEdge.events.length === 0 &&
      onEdge.toppling === null,
  );

  TestValidator.predicate(
    "empty support is a type error",
    hasViolation(
      detectSupportToppling({ centerOfMass: v(0, 0), support: [] }).validation,
      "type",
      ".support",
    ),
  );
  TestValidator.predicate(
    "negative margin is a range error",
    hasViolation(
      detectSupportToppling({
        centerOfMass: v(0, 0),
        support: square,
        margin: -1,
      }).validation,
      "range",
      ".margin",
    ),
  );
}
