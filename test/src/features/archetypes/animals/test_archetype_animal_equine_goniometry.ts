import {
  AutoMovieArchetypeEquineGoniometry,
  AutoMovieArchetypeEquineJointLimits,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../../internal/predicates";

/**
 * Actual marker-plane goniometry preserves orientation and source conventions.
 *
 * Scenarios:
 * 1. Cartesian X-to-Y rays measure 90 degrees about +Z and 270 about -Z,
 *    including translated/scaled points and out-of-plane marker displacement.
 * 2. Equal/opposite planar rays retain the legitimate 0/180 degree boundaries.
 * 3. Adair Table 1 carpus means 31/183 with SDs 4/3 give literal 14.75/-31
 *    endpoint-SD differences for a 90-degree observation; no hard limit appears.
 * 4. A source that did not measure the joint refuses; unmeasured shoulder,
 *    hip and axial joints retain null observations/diagnostics and outer limits.
 * 5. Nonfinite points/normals, a zero normal, collapsed rays, normal-only rays,
 *    overflowing differences and invalid clinical angle inputs refuse.
 * 6. Acquisition inputs stay unchanged, and changing returned clinical records
 *    or vectors cannot corrupt later measurements or the primary source table.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists geometric invariants, oriented boundaries, independently sourced mean/SD arithmetic, missing-data behavior, malformed acquisition refusals and ownership checks.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public marker measurement, primary lookup and comparison APIs; assertions catch lost orientation, skipped projection, incompatible source pooling, fabricated constraints and shared mutable clinical data.
 * @evidence contracts/development/testing.md#independent-expectations Cartesian orthogonal/equal/opposite rays define literal 90/270/0/180 degrees without using the measured angle as an oracle. Adair 2016 Table 1 reports carpal flexion 31±4 and standing extension 183±3, so a 90-degree observation has deviations (90-31)/4=14.75 and (90-183)/3=-31; the 1e-12 degree/numeric tolerance covers binary64 arithmetic only. Geometry cannot verify that real-world markers were anatomically acquired correctly.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive and reversed normals, shifted/scaled and out-of-plane points, collinear-but-nonzero boundaries, compatible/incompatible sources, unknown joints, each finite/degenerate refusal and mutation isolation distinguish the promised acquisition and source semantics.
 * @evidence contracts/development/testing.md#execution-ownership One exported synchronous in-memory unit is discovered by its test name and starts no process, viewer, compiler, capture or other host; all acquisition points and expected measurements are owned here.
 */
export function test_archetype_animal_equine_goniometry(): void {
  const input: AutoMovieArchetypeEquineGoniometry.IInput = {
    bone: "leftForeCannon",
    studyDoi: "10.3415/VCOT-15-11-0182",
    markers: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
    planeNormal: { x: 0, y: 0, z: 2 },
  };
  const inputBefore: string = JSON.stringify(input);
  const measured: AutoMovieArchetypeEquineGoniometry.IResult =
    AutoMovieArchetypeEquineGoniometry.measure(input);
  TestValidator.predicate(
    "right-handed orthogonal rays are 90 degrees",
    nclose(measured.includedAngle, 90, 1e-12),
  );
  TestValidator.predicate(
    "the measured unit plane and rays retain their meaning",
    vclose(measured.normal, { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(measured.projectedRays[0], { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(measured.projectedRays[1], { x: 0, y: 1, z: 0 }, 1e-12),
  );

  const reversed: AutoMovieArchetypeEquineGoniometry.IResult =
    AutoMovieArchetypeEquineGoniometry.measure({
      ...input,
      planeNormal: { x: 0, y: 0, z: -8 },
    });
  TestValidator.predicate(
    "reversing the normal preserves the reflex 270 degrees",
    nclose(reversed.includedAngle, 270, 1e-12),
  );
  TestValidator.equals(
    "reflex measurement remains observational",
    reversed.comparison?.position,
    "above-extension-mean",
  );
  const shifted: AutoMovieArchetypeEquineGoniometry.IResult =
    AutoMovieArchetypeEquineGoniometry.measure({
      ...input,
      markers: [
        { x: 13, y: -4, z: 15 },
        { x: 10, y: -4, z: 7 },
        { x: 10, y: -1, z: 2 },
      ],
      planeNormal: { x: 0, y: 0, z: 19 },
    });
  TestValidator.predicate(
    "translation, scale and axial displacement preserve 90 degrees",
    nclose(shifted.includedAngle, 90, 1e-12),
  );

  for (const [secondX, expected] of [
    [1, 0],
    [-1, 180],
  ] as const) {
    const boundary: AutoMovieArchetypeEquineGoniometry.IResult =
      AutoMovieArchetypeEquineGoniometry.measure({
        ...input,
        markers: [
          input.markers[0],
          input.markers[1],
          { x: secondX, y: 0, z: 0 },
        ],
      });
    TestValidator.predicate(
      `nonzero collinear rays measure ${expected} degrees`,
      nclose(boundary.includedAngle, expected, 1e-12),
    );
  }

  if (measured.comparison === null)
    throw new Error(
      "The measured carpus lost its selected primary observation",
    );
  TestValidator.equals(
    "comparison retains its selected primary source",
    measured.comparison.observation.study.doi,
    "10.3415/VCOT-15-11-0182",
  );
  TestValidator.predicate(
    "the primary carpal statistics and signed differences are independently known",
    nclose(measured.comparison.observation.flexion[0], 31, 1e-12) &&
      nclose(measured.comparison.observation.flexion[1], 4, 1e-12) &&
      nclose(measured.comparison.observation.extension[0], 183, 1e-12) &&
      nclose(measured.comparison.observation.extension[1], 3, 1e-12) &&
      nclose(measured.comparison.flexionStandardDeviations, 14.75, 1e-12) &&
      nclose(measured.comparison.extensionStandardDeviations, -31, 1e-12),
  );
  TestValidator.equals(
    "mean-relative position is descriptive",
    measured.comparison.position,
    "between-endpoint-means",
  );
  TestValidator.equals(
    "standing extension retains its loading protocol",
    measured.comparison.observation.extensionProtocol,
    "full-weight-standing",
  );
  TestValidator.equals(
    "the table's unreported ROM stays unknown",
    measured.comparison.observation.reportedRom,
    null,
  );
  TestValidator.equals(
    "measurement does not create any local axis bounds",
    measured.limits,
    null,
  );
  TestValidator.equals(
    "clinical references do not create immobile axes",
    AutoMovieArchetypeEquineJointLimits.lookup(input.bone).limits,
    null,
  );

  TestValidator.predicate(
    "a hindlimb source cannot silently diagnose a fore carpus",
    throwsError(
      (): AutoMovieArchetypeEquineGoniometry.IResult =>
        AutoMovieArchetypeEquineGoniometry.measure({
          ...input,
          studyDoi: "10.3389/fvets.2021.761500",
        }),
      "selected study did not measure",
    ),
  );
  for (const bone of ["head", "leftForeHumerus", "rightHindFemur"] as const) {
    const unknown: AutoMovieArchetypeEquineGoniometry.IResult =
      AutoMovieArchetypeEquineGoniometry.measure({
        ...input,
        bone,
      });
    TestValidator.equals(
      `${bone} has no fabricated comparison`,
      unknown.comparison,
      null,
    );
    TestValidator.equals(
      `${bone} has no fabricated local limits`,
      unknown.limits,
      null,
    );
    TestValidator.equals(
      `${bone} has no borrowed reference rows`,
      AutoMovieArchetypeEquineJointLimits.lookup(bone).observations,
      null,
    );
  }

  const invalid: readonly AutoMovieArchetypeEquineGoniometry.IInput[] = [
    { ...input, planeNormal: { x: 0, y: 0, z: 0 } },
    { ...input, planeNormal: { x: 0, y: Infinity, z: 1 } },
    {
      ...input,
      markers: [{ x: NaN, y: 0, z: 0 }, input.markers[1], input.markers[2]],
    },
    {
      ...input,
      markers: [input.markers[1], input.markers[1], input.markers[2]],
    },
    {
      ...input,
      markers: [{ x: 0, y: 0, z: 1 }, input.markers[1], input.markers[2]],
    },
    {
      ...input,
      markers: [input.markers[0], input.markers[1], { x: 0, y: 0, z: -1 }],
    },
    {
      ...input,
      markers: [
        { x: Number.MAX_VALUE, y: 0, z: 0 },
        { x: -Number.MAX_VALUE, y: 0, z: 0 },
        input.markers[2],
      ],
    },
  ];
  for (const acquisition of invalid)
    TestValidator.predicate(
      "invalid acquisition refuses",
      throwsError(
        (): AutoMovieArchetypeEquineGoniometry.IResult =>
          AutoMovieArchetypeEquineGoniometry.measure(acquisition),
      ),
    );
  for (const angle of [-1, 361, NaN, Infinity])
    TestValidator.predicate(
      "invalid clinical angle refuses",
      throwsError((): AutoMovieArchetypeEquineJointLimits.IComparison | null =>
        AutoMovieArchetypeEquineJointLimits.compare(
          input.bone,
          input.studyDoi,
          angle,
        ),
      ),
    );

  TestValidator.equals(
    "measurement leaves acquired points and plane unchanged",
    JSON.stringify(input),
    inputBefore,
  );
  const cohort: string = measured.comparison.observation.study.cohort;
  Reflect.set(measured.comparison.observation.flexion, "0", -999);
  Reflect.set(
    measured.comparison.observation.study,
    "cohort",
    "altered returned record",
  );
  Reflect.set(measured.normal, "z", -999);
  const independent: AutoMovieArchetypeEquineGoniometry.IResult =
    AutoMovieArchetypeEquineGoniometry.measure(input);
  if (independent.comparison === null)
    throw new Error("A later carpal measurement lost its primary reference");
  TestValidator.predicate(
    "returned vectors and statistics cannot corrupt later measurement",
    nclose(independent.includedAngle, 90, 1e-12) &&
      nclose(independent.normal.z, 1, 1e-12) &&
      nclose(independent.comparison.observation.flexion[0], 31, 1e-12) &&
      nclose(independent.comparison.flexionStandardDeviations, 14.75, 1e-12),
  );
  TestValidator.equals(
    "the source cohort remains independently owned",
    independent.comparison.observation.study.cohort,
    cohort,
  );
  TestValidator.equals(
    "result changes do not reach acquisition inputs",
    JSON.stringify(input),
    inputBefore,
  );
}
