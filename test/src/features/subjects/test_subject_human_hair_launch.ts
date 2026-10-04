import { Vector3 } from "@automovie/engine";
import {
  assertHumanFaceHair,
  buildHumanFaceHairMesh,
  growHumanFaceHairStrand,
  humanFaceHairContact,
  humanFaceHairEmergence,
  integrateHumanFaceHairCurve,
} from "@automovie/human";
import { createHumanFaceHairCurveStart } from "@automovie/human/face/anatomy/hair/createHumanFaceHairCurveStart";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairCollider } from "../internal/createNumericalHairCollider";
import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * A flat face of a closed box is an independent emergence/contact oracle.
 * Requested clearance is 1 mm; the 2 mm sampling step makes the contact's
 * station clearance 2 mm plus its existing rounding allowance. The root
 * transition spends metric length, while later segments keep skin clearance.
 * Scenarios:
 * 1. The hairline and mid-scalp cases are both measured before any assertion:
 *    their actual first contact inputs, first chords, normals and total length.
 * 2. The first chord preserves the stated 15 or 30 degree emergence angle;
 *    helper directions alone cannot certify the integrator's projected chord.
 * 3. A strand replaces its normally projected first station with the same
 *    emergence, and the emitted root/free-row centre preserves that station.
 * 4. A count sufficient for launch alone cannot silently add a walk budget.
 * 5. A longer derived strand metric supplies its own unchanged contact instance,
 *    whose rounding scale differs from the guide's regional length.
 * 6. Every later chord stays above the independently known plane y = 1,
 *    obeys the sampling bound, and the complete lock remains 50 mm long.
 */
export const test_subject_human_hair_launch = (): void => {
  const collider = createNumericalHairCollider(
    createSignedVoxelUnion([[0, 0, 0]]),
    { triangle: 6, weights: [1, 0, 1] },
  );
  const surface = collider.query;
  const root = Vector3.create(0.5, 1, 0.5);
  const normal = Vector3.create(0, 1, 0);
  const origin = Vector3.create(0.5, 0.9, 0.4);
  const readings = [
    { degrees: 15, boundary: Math.PI / 4 },
    { degrees: 30, boundary: Math.PI },
  ].map(({ degrees, boundary }) => {
    const layer = createNumericalHairFixture().layers[0];
    layer.flow = [1, 0, 0];
    layer.lift.strength = 0;
    layer.hairline = {
      front: boundary,
      back: boundary,
      left: boundary,
      right: boundary,
    };
    assertHumanFaceHair({ layers: [layer] });
    const inputs: number[][] = [];
    const query: typeof surface = (point) => {
      inputs.push([...point]);
      return surface(point);
    };
    const desired = humanFaceHairEmergence({
      hairline: layer.hairline,
      chart: Vector3.subtract(root, origin),
      normal,
      field: Vector3.create(...layer.flow),
    });
    const props = {
      layer,
      origin,
      reference: root,
      root,
      normal,
      sequence: 1,
      ...collider,
      query,
    };
    const curve = integrateHumanFaceHairCurve(props);
    const contact = humanFaceHairContact({ layer, root, length: 0.05, query });
    const grownBudget = { remaining: 1_000_000 };
    const grown = integrateHumanFaceHairCurve({
      ...props,
      budget: grownBudget,
      metric: { length: 0.05, contact },
      place: (rooted) =>
        growHumanFaceHairStrand({
          strand: curve,
          contact,
          rooted,
          integrate: () => undefined,
        }),
    });
    const mesh = buildHumanFaceHairMesh([grown], layer, {
      widths: [0.002],
      ...collider.meshContext,
      budgets: [grownBudget],
      query,
    });
    const emitted = Vector3.create(
      ...([0, 1, 2].map(
        (axis) => (mesh.positions[3 + axis] + mesh.positions[6 + axis]) / 2,
      ) as [number, number, number]),
    );
    TestValidator.predicate(
      "strand and emitted first row use the canonical launch",
      vclose(grown.points[1], curve.points[1], 1e-12) &&
        vclose(emitted, curve.points[1], 1e-12),
    );
    TestValidator.predicate(
      "rooted transition and subsequent walk share the caller budget",
      throwsError(
        () =>
          integrateHumanFaceHairCurve({
            ...props,
            budget: { remaining: 1 },
          }),
        "exhausted",
      ),
    );
    const first = Vector3.subtract(curve.points[1], root);
    const chords = curve.points
      .slice(1)
      .map((point, at) =>
        Vector3.length(Vector3.subtract(point, curve.points[at])),
      );
    const free = curve.points.slice(curve.freeFrom);
    const firstHit = surface([
      curve.points[1].x,
      curve.points[1].y,
      curve.points[1].z,
    ]);
    return {
      nominalDegrees: degrees,
      helperDegrees: (Math.asin(Vector3.dot(desired, normal)) * 180) / Math.PI,
      emittedFirstDegrees:
        (Math.atan2(
          emitted.y - root.y,
          Math.hypot(emitted.x - root.x, emitted.z - root.z),
        ) *
          180) /
        Math.PI,
      firstDegrees:
        (Math.atan2(first.y, Math.hypot(first.x, first.z)) * 180) / Math.PI,
      firstContactInput: inputs[0],
      firstContactDistance: surface(inputs[0]).signedDistance,
      firstChord: chords[0],
      totalLength: chords.reduce((sum, length) => sum + length, 0),
      stationClearance: curve.clearance,
      firstNormal: firstHit.normal,
      freePlaneClearance: Math.min(...free.map((point) => point.y - 1)),
      freeSurfaceClearance: Math.min(
        ...free.map(
          (point) => surface([point.x, point.y, point.z]).signedDistance,
        ),
      ),
      maximumFreeChord: Math.max(...chords.slice(curve.freeFrom)),
    };
  });
  const small = createSignedVoxelUnion([[0, 0, 0]]);
  small.positions = small.positions.map((value) => value * 0.1);
  const smallCollider = createNumericalHairCollider(small, {
    triangle: 6,
    weights: [1, 0, 1],
  });
  const smallRoot = Vector3.create(0.05, 0.1, 0.05);
  const metricLayer = createNumericalHairFixture().layers[0];
  metricLayer.flow = [1, 0, 0];
  metricLayer.lift.strength = 0;
  const strandContact = humanFaceHairContact({
    layer: metricLayer,
    root: smallRoot,
    length: 0.8,
    query: smallCollider.query,
  });
  const guideContact = humanFaceHairContact({
    layer: metricLayer,
    root: smallRoot,
    length: 0.05,
    query: smallCollider.query,
  });
  TestValidator.predicate(
    "different metric scales exercise distinct rounding clearances",
    strandContact.epsilon > guideContact.epsilon,
  );
  const strandStart = createHumanFaceHairCurveStart(
    {
      layer: metricLayer,
      root: smallRoot,
      origin: Vector3.create(0.05, 0, 0.05),
      reference: smallRoot,
      normal,
      sequence: 1,
      ...smallCollider,
    },
    { length: 0.8, contact: strandContact },
  );
  const strandCurve = integrateHumanFaceHairCurve({
    layer: metricLayer,
    root: smallRoot,
    origin: Vector3.create(0.05, 0, 0.05),
    reference: smallRoot,
    normal,
    sequence: 1,
    ...smallCollider,
    metric: { length: 0.8, contact: strandContact },
  });
  TestValidator.predicate(
    "derived metric and contact reach launch unchanged",
    strandStart.contact === strandContact &&
      strandStart.length === 0.8 &&
      smallCollider.query([
        strandCurve.points[strandCurve.freeFrom].x,
        strandCurve.points[strandCurve.freeFrom].y,
        strandCurve.points[strandCurve.freeFrom].z,
      ]).signedDistance >=
        strandContact.clearance - strandContact.epsilon,
  );
  const receipt = JSON.stringify(readings);
  TestValidator.predicate(
    `independent nominal emergence directions: ${receipt}`,
    readings.every((one) =>
      nclose(one.helperDegrees, one.nominalDegrees, 1e-9),
    ),
  );
  TestValidator.predicate(
    `metric length, normals and free contact: ${receipt}`,
    readings.every(
      (one) =>
        nclose(one.totalLength, 0.05, 1e-12) &&
        nclose(one.stationClearance, 0.002, 1e-12) &&
        nclose(one.firstNormal[0], 0, 1e-12) &&
        nclose(one.firstNormal[1], 1, 1e-12) &&
        nclose(one.firstNormal[2], 0, 1e-12) &&
        one.freePlaneClearance >= 0.001 - 1e-12 &&
        one.freeSurfaceClearance >= 0.001 - 1e-12 &&
        one.maximumFreeChord <= 0.002 + 1e-12,
    ),
  );
  TestValidator.predicate(
    `projected first chords preserve emergence angles: ${receipt}`,
    readings.every(
      (one) =>
        nclose(one.firstDegrees, one.nominalDegrees, 1e-9) &&
        nclose(one.emittedFirstDegrees, one.nominalDegrees, 1e-9),
    ),
  );
};
