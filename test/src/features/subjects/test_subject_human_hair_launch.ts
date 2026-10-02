import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import {
  assertHumanFaceHair,
  humanFaceHairEmergence,
  integrateHumanFaceHairCurve,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose } from "../internal/predicates";

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
 * 3. Every later chord stays above the independently known plane y = 1,
 *    obeys the sampling bound, and the complete lock remains 50 mm long.
 */
export const test_subject_human_hair_launch = (): void => {
  const surface = createAutoMovieSignedMeshQuery(createSignedVoxelUnion([[0, 0, 0]]));
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
    layer.hairline = { front: boundary, back: boundary, left: boundary, right: boundary };
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
    const curve = integrateHumanFaceHairCurve({
      layer, origin, reference: root, root, normal, sequence: 1, query,
    });
    const first = Vector3.subtract(curve.points[1], root);
    const chords = curve.points.slice(1).map((point, at) =>
      Vector3.length(Vector3.subtract(point, curve.points[at])),
    );
    const free = curve.points.slice(1);
    const firstHit = surface([curve.points[1].x, curve.points[1].y, curve.points[1].z]);
    return {
      nominalDegrees: degrees,
      helperDegrees: Math.asin(Vector3.dot(desired, normal)) * 180 / Math.PI,
      firstDegrees: Math.atan2(first.y, Math.hypot(first.x, first.z)) * 180 / Math.PI,
      firstContactInput: inputs[0],
      firstContactDistance: surface(inputs[0]).signedDistance,
      firstChord: chords[0],
      totalLength: chords.reduce((sum, length) => sum + length, 0),
      stationClearance: curve.clearance,
      firstNormal: firstHit.normal,
      freePlaneClearance: Math.min(...free.map((point) => point.y - 1)),
      freeSurfaceClearance: Math.min(...free.map((point) => surface([point.x, point.y, point.z]).signedDistance)),
      maximumFreeChord: Math.max(...chords.slice(1)),
    };
  });
  const receipt = JSON.stringify(readings);
  TestValidator.predicate(`independent nominal emergence directions: ${receipt}`,
    readings.every((one) => nclose(one.helperDegrees, one.nominalDegrees, 1e-9)),
  );
  TestValidator.predicate(`metric length, normals and free contact: ${receipt}`,
    readings.every((one) => nclose(one.totalLength, 0.05, 1e-12) &&
      nclose(one.stationClearance, 0.002, 1e-12) &&
      nclose(one.firstNormal[0], 0, 1e-12) && nclose(one.firstNormal[1], 1, 1e-12) &&
      nclose(one.firstNormal[2], 0, 1e-12) && one.freePlaneClearance >= 0.001 - 1e-12 &&
      one.freeSurfaceClearance >= 0.001 - 1e-12 && one.maximumFreeChord <= 0.002 + 1e-12),
  );
  TestValidator.predicate(`projected first chords preserve emergence angles: ${receipt}`,
    readings.every((one) => nclose(one.firstDegrees, one.nominalDegrees, 1e-9)),
  );
};
