import { detectSupportToppling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  nclose,
  validationHasWarningCount,
  vclose,
} from "../internal/predicates";

const v: (x: number, z: number) => IAutoMovieVector3 = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
const square: IAutoMovieVector3[] = [v(0, 0), v(2, 0), v(2, 2), v(0, 2)];

/**
 * `detectSupportToppling` judges whether an object's center of mass stays over
 * its support footprint. Overhang is advisory (a film may be unphysical, D010):
 * it warns (never errors on the physics), suggests the tip edge and fall
 * direction, and emits a fall event. A `physicsIntent` marker suppresses the
 * warning and suggestion but keeps the event.
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual support classification and checks advisory warnings, fall event, tip edge/direction and physics-intent suppression. Stable inputs must yield no event or suggestion; intended unphysical motion suppresses advice while retaining the event.
 * @evidence contracts/testing.md#independent-expectations The authored [0,2] square places (1,1) inside, (2,1) on its edge and (3,1) one metre outside. Default margin 0.02 gives expected overshoot 0.98 and +X fall direction independently of detector output; this is a support proxy, not dynamic rigid-body simulation.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts centered, edge and overhanging COM, ordinary versus declared physics intent, named versus anonymous actor, empty support and negative margin. Reordered corners have a separate hull unit; actual animation response to the emitted event belongs to consumers.
 * @evidence contracts/testing.md#execution-ownership This named portable unit invokes geometric classification directly with authored vectors and observes its report/events. It starts no physics runtime, viewer or Human fixture, and all predicate callbacks execute within the local assertion helper.
 */
export function test_validation_support_topple(): void {
  const stable: ReturnType<typeof detectSupportToppling> = detectSupportToppling({
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

  const topple: ReturnType<typeof detectSupportToppling> = detectSupportToppling({
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
      ["ncloseToppleToppling2", (): boolean => nclose(topple.toppling!.tipEdgeEnd.x, 2)],
    ]),
    { ncloseToppleToppling: true, ncloseToppleToppling2: true },
  );

  const intended: ReturnType<typeof detectSupportToppling> = detectSupportToppling({
    centerOfMass: v(3, 1),
    support: square,
    physicsIntent: "levitates",
  });
  TestValidator.predicate(
    "intent suppresses the warning",
    validationHasWarningCount("intended support overhang", intended.validation, 0),
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

  const onEdge: ReturnType<typeof detectSupportToppling> = detectSupportToppling({
    centerOfMass: v(2, 1),
    support: square,
  });
  TestValidator.predicate(
    "COM on the hull edge is stable",
    validationHasWarningCount("support hull edge", onEdge.validation, 0) &&
      onEdge.events.length === 0 && onEdge.toppling === null,
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
