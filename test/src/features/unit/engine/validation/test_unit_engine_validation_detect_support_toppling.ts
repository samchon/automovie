import {
  affordanceSupportContacts,
  detectSupportToppling,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieSupportResult,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  nclose,
  validationHasWarningCount,
  vclose,
} from "../../../internal/predicates";

/**
 * `detectSupportToppling` compares a centre of mass with the convex hull of
 * its support contacts; `affordanceSupportContacts` places a stack-top's
 * footprint in the world.
 *
 * Fixture: the square support (0,0), (2,0), (2,2), (0,2) in xz, margin 0.02 by
 * default.
 *
 * Scenarios:
 *
 * 1. A centre at (1, 1), and one exactly on the edge x = 2, are stable: no
 *    warning, event or toppling.
 * 2. A centre at (3, 1) overhangs by 1: one warning, overshoot 1 - 0.02, fall
 *    direction +x, one `fall` event, tip edge on x = 2.
 * 3. With `physicsIntent` and no node: no warning, no toppling, the event kept
 *    with a null actor.
 * 4. The same corners in the crossed order (0,0), (2,2), (2,0), (0,2) classify
 *    (1, 1) as stable and (5, 1) as overhanging: the hull, not the polygon.
 * 5. Empty support is a type finding at `.support`; margin -1 a range finding
 *    at `.margin`.
 * 6. A unit-square stack-top 0.5 above a parent at (3, 0, 2) supports a centre
 *    at (3, 1, 2); 0.7 m along +x it overhangs and falls toward +x.
 */
export function test_unit_engine_validation_detect_support_toppling(): void {
  const v = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const square: IAutoMovieVector3[] = [v(0, 0), v(2, 0), v(2, 2), v(0, 2)];
  const quiet = (label: string, r: IAutoMovieSupportResult): void =>
    TestValidator.predicate(
      label,
      validationHasWarningCount(label, r.validation, 0) &&
        r.events.length === 0 &&
        r.toppling === null,
    );

  // 1.
  quiet("centred", detectSupportToppling({ node: "crate", centerOfMass: v(1, 1), support: square }));
  quiet("on the edge", detectSupportToppling({ centerOfMass: v(2, 1), support: square }));

  // 2.
  const topple: IAutoMovieSupportResult = detectSupportToppling({
    node: "crate",
    centerOfMass: v(3, 1),
    support: square,
  });
  TestValidator.predicate(
    "overhang",
    validationHasWarningCount("overhang", topple.validation, 1) &&
      topple.toppling !== null &&
      nclose(topple.toppling.overshoot, 1 - 0.02) &&
      vclose(topple.toppling.fallDirection, v(1, 0)) &&
      nclose(topple.toppling.tipEdgeStart.x, 2) &&
      nclose(topple.toppling.tipEdgeEnd.x, 2),
  );
  TestValidator.equals("fall event", topple.events.map((e) => e.kind), ["fall"]);

  // 3.
  const intended: IAutoMovieSupportResult = detectSupportToppling({
    centerOfMass: v(3, 1),
    support: square,
    physicsIntent: "levitates",
  });
  TestValidator.predicate(
    "intent",
    validationHasWarningCount("intent", intended.validation, 0) &&
      intended.toppling === null &&
      intended.events.length === 1 &&
      intended.events[0]!.actor === null,
  );

  // 4.
  const crossed: IAutoMovieVector3[] = [v(0, 0), v(2, 2), v(2, 0), v(0, 2)];
  quiet("crossed centred", detectSupportToppling({ centerOfMass: v(1, 1), support: crossed }));
  TestValidator.predicate(
    "crossed overhang",
    validationHasWarningCount(
      "crossed overhang",
      detectSupportToppling({ centerOfMass: v(5, 1), support: crossed }).validation,
      1,
    ),
  );

  // 5.
  TestValidator.predicate(
    "empty support",
    hasViolation(
      detectSupportToppling({ centerOfMass: v(0, 0), support: [] }).validation,
      "type",
      ".support",
    ),
  );
  TestValidator.predicate(
    "negative margin",
    hasViolation(
      detectSupportToppling({ centerOfMass: v(0, 0), support: square, margin: -1 })
        .validation,
      "range",
      ".margin",
    ),
  );

  // 6.
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const unit = { x: 1, y: 1, z: 1 };
  const top: IAutoMovieAffordance = {
    id: "top",
    kind: "stack-top",
    frame: { translation: { x: 0, y: 0.5, z: 0 }, rotation: identity, scale: unit },
    extent: [
      { x: -0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: -0.5, y: 0, z: 0.5 },
    ],
  };
  const support: IAutoMovieVector3[] = affordanceSupportContacts({
    affordance: top,
    parentWorld: { translation: { x: 3, y: 0, z: 2 }, rotation: identity, scale: unit },
  });
  quiet(
    "stacked",
    detectSupportToppling({ node: "crateB", centerOfMass: { x: 3, y: 1, z: 2 }, support }),
  );
  const overhung: IAutoMovieSupportResult = detectSupportToppling({
    node: "crateB",
    centerOfMass: { x: 3.7, y: 1, z: 2 },
    support,
  });
  TestValidator.predicate(
    "stack overhang",
    validationHasWarningCount("stack overhang", overhung.validation, 1) &&
      overhung.toppling !== null &&
      vclose(overhung.toppling.fallDirection, { x: 1, y: 0, z: 0 }),
  );
}
