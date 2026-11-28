import assert from "node:assert/strict";

import {
  AutoMovieArchetypeDog,
  AutoMovieArchetypeQuadrupedRest,
  type AutoMovieArchetypeQuadrupedRestPlan,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";

/**
 * Rejects nonfinite dog dimensions and rest controls before building a pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the typed dog dimension refusals, finite rest-clock limits and retained four-foot support.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both public owners with nonfinite and overflowing inputs. Samples the same valid dog at authored event times and checks the actual sole goals, belly support and independently posed model.
 * @evidence contracts/development/testing.md#independent-expectations Names each rejected field explicitly. The two-second down/up phases and one-second hold give event seconds 2, 3, 3 and 5. Four retained X/Z footprints distinguish pose preservation from compounding later samples.
 */
export function test_archetypes_animals_canine_finite_admission(): void {
  const dog = AutoMovieArchetypeDog.create({ mass: 22, cohort: "pet", tempo: 0 });
  const collar = {
    width: 0.02,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };
  assert.throws(
    () => AutoMovieArchetypeDog.positive("mass", Infinity, "kg"),
    { name: "AutoMovieArchetypeRefusal", axis: "mass" },
  );
  assert.throws(() => AutoMovieArchetypeDog.create({ mass: Infinity }), {
    name: "AutoMovieArchetypeRefusal",
    axis: "mass",
  });
  for (const key of ["width", "thickness", "leadLength", "leadRadius"] as const)
    assert.throws(
      () =>
        AutoMovieArchetypeDog.create({
          mass: 22,
          collar: { ...collar, [key]: Infinity },
        }),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal &&
        error.axis === `collar.${key}`,
    );

  const params: AutoMovieArchetypeQuadrupedRestPlan.IParams = {
    floorY: 0,
    loweringSeconds: 2,
    restingSeconds: 1,
    risingSeconds: 2,
    restPitch: 0,
    tailDirection: -90,
    folded: {
      fore: { thirdDegrees: -120, fourthDegrees: -50 },
      hind: { thirdDegrees: -95, fourthDegrees: 80 },
    },
    windows: {
      body: { startShare: 0, endShare: 1 },
      fore: { startShare: 0, endShare: 1 },
      hind: { startShare: 0, endShare: 1 },
    },
    parts: { withers: "trunk", leftEar: "head", rightEar: "head" },
    contacts: {},
  };
  const clipped = AutoMovieArchetypeQuadrupedRest.plan(dog, params);
  assert.equal(clipped.duration, 5);
  assert.deepEqual(clipped.events, {
    bellyOn: 2,
    riseStart: 3,
    bellyOff: 3,
    standing: 5,
  });
  const stand = clipped.sample(5);
  const hold = clipped.sample(2.5);
  assert.equal(hold.bellySupported, true);
  assert.equal(stand.bellySupported, false);
  assert.equal(hold.feet.size, 4);
  assert.deepEqual(
    [...hold.feet].map(([limb, foot]) => [limb, foot.x, foot.z]),
    [...stand.feet].map(([limb, foot]) => [limb, foot.x, foot.z]),
  );
  const noHold = AutoMovieArchetypeQuadrupedRest.plan(dog, {
    ...params,
    restingSeconds: 0,
  });
  assert.equal(noHold.duration, 4);
  assert.equal(noHold.sample(2).phase, "rising");

  const malformed: readonly Partial<AutoMovieArchetypeQuadrupedRestPlan.IParams>[] = [
    { floorY: Infinity },
    { loweringSeconds: Infinity },
    { restingSeconds: NaN },
    { restingSeconds: Infinity },
    { risingSeconds: Infinity },
    {
      loweringSeconds: Number.MAX_VALUE,
      restingSeconds: Number.MAX_VALUE,
      risingSeconds: Number.MAX_VALUE,
    },
    { restPitch: NaN },
    { tailDirection: NaN },
    {
      folded: {
        ...params.folded,
        fore: { thirdDegrees: NaN, fourthDegrees: -50 },
      },
    },
    {
      folded: {
        ...params.folded,
        hind: { thirdDegrees: -95, fourthDegrees: NaN },
      },
    },
  ];
  for (const change of malformed)
    assert.throws(
      () => AutoMovieArchetypeQuadrupedRest.plan(dog, { ...params, ...change }),
      RangeError,
      Object.keys(change).join(", "),
    );
}
