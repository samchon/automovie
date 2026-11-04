import {
  AutoMovieHumanSkeleton,
  AutoMovieHumanRigControls as Controls,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Jaw millimetres and clinical degrees retain disjoint canonical admission.
 *
 * Scenarios:
 * 1. Public millimetre bounds agree with independent published jaw opening/translation limits.
 * 2. The real evaluator clamps an oversized opening at that canonical maximum.
 * 3. Cross-unit untyped requests refuse and returned records are independent.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads public unit-specific bounds and exercises real Human FK admission; a duplicated divergent jaw interval, angular widening, missing runtime unit check or shared mutable result fails.
 * @evidence contracts/testing.md#independent-expectations Published jaw ranges are opening0–52.9mm, protrusion0–8.5mm and lateral excursion-10.35–10.35mm. Oversized opening must produce the corresponding public clamp, independently of the accessor's return.
 * @evidence contracts/testing.md#distinguishing-cases Covers all three millimetre channels, valid degree bounds, malformed cross-unit requests at explicit runtime casts and returned-record mutation. IK tests separately exercise runtime conditional bounds; these assertions do not establish a type-negative compile-time proof.
 * @evidence contracts/testing.md#execution-ownership One synchronous root unit reuses HumanPeople's immutable calibration and CPU public FK only, with no rendering, browser or native artifact.
 */
export function test_human_rig_control_units(): void {
  const opening: { minimum: number; maximum: number } =
    Controls.millimetreBounds("head.jaw.opening");
  TestValidator.predicate(
    "opening millimetres",
    nclose(opening.minimum, 0) && nclose(opening.maximum, 52.9),
  );
  TestValidator.predicate(
    "protrusion millimetres",
    nclose(Controls.millimetreBounds("head.jaw.protrusion").maximum, 8.5),
  );
  const lateral: { minimum: number; maximum: number } =
    Controls.millimetreBounds("head.jaw.lateralExcursion");
  TestValidator.predicate(
    "lateral millimetres",
    nclose(lateral.minimum, -10.35) && nclose(lateral.maximum, 10.35),
  );
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const output: AutoMovieHumanSkeleton.IOutput = AutoMovieHumanSkeleton.prepare(
    person.params,
    { calibration: person.body },
  )({ head: { jaw: { opening: 80 } } });
  TestValidator.predicate(
    "actual FK canonical jaw admission",
    output.clamped.some(
      (row: AutoMovieHumanSkeleton.IClamp): boolean =>
        row.path === "head.jaw.opening" && nclose(row.applied, 52.9),
    ),
  );
  opening.maximum = 1;
  TestValidator.predicate(
    "bounds output ownership",
    nclose(Controls.millimetreBounds("head.jaw.opening").maximum, 52.9),
  );
  TestValidator.predicate(
    "angular admission stays disjoint",
    !Controls.isChannel("head.jaw.opening") &&
      Controls.isChannel("neck.cervical.rotation"),
  );
  const straight: { minimum: number; maximum: number } = Controls.bounds(
    "legs.right.knee.rotation",
    { legs: { left: {}, right: { knee: { flexion: 0 } } } },
  );
  const bent: { minimum: number; maximum: number } = Controls.bounds(
    "legs.right.knee.rotation",
    { legs: { left: {}, right: { knee: { flexion: 90 } } } },
  );
  TestValidator.predicate(
    "public conditional bounds use actual pose",
    straight.minimum === 0 && straight.maximum === 0 && bent.maximum > 0,
  );
  TestValidator.predicate(
    "degree path refuses millimetre boundary",
    throwsError((): void => {
      Controls.millimetreBounds(
        "neck.cervical.rotation" as unknown as Controls.MillimetreChannel,
      );
    }),
  );
  TestValidator.predicate(
    "jaw path refuses degree boundary",
    throwsError((): void => {
      Controls.bounds("head.jaw.opening" as unknown as Controls.DegreeChannel);
    }),
  );
}
