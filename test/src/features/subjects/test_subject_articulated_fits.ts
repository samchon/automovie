import { Quaternion, Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  axisAngleOf,
  decomposeOpening,
  fitEndpointTransform,
  impliedWeights,
  shiftedPivot,
} from "../../../scripts/face-review/articulatedFits";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * The preparation's fits reproduce hand-built rigid motions and reveal the
 * attachment weights a translation endpoint carries.
 * Scenarios:
 * 1. A quaternion's axis and angle come back regardless of the sign of `w`,
 *    and the identity reports zero.
 * 2. `shiftedPivot` solves `(I - R) d = u`: turning about the shifted point
 *    equals turning about the origin plus the translation, and a zero angle
 *    refuses.
 * 3. A tetrahedron turned 30 degrees about an off-origin axis and slid 0.1
 *    along +Z fits with zero RMS, and `decomposeOpening` returns that screw
 *    pivot, the slide and the condylar axis point the cited coupling implies.
 * 4. Implied weights are exact for authored fractions of three translations,
 *    clamp an overshoot and report the off-axis remainder.
 */
export const test_subject_articulated_fits = (): void => {
  const q = Quaternion.fromAxisAngle(Vector3.create(0, 1, 0), 40);
  const flipped = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
  const axisAngle = axisAngleOf(flipped);
  TestValidator.predicate(
    "axis and angle survive a negated quaternion",
    vclose(axisAngle.axis, Vector3.create(0, 1, 0)) &&
      nclose(axisAngle.degrees, 40),
  );
  TestValidator.equals(
    "identity has no rotation",
    axisAngleOf(Quaternion.identity()).degrees,
    0,
  );
  const axis = Vector3.create(1, 0, 0);
  const u = Vector3.create(0, 0.2, 0.3);
  const d = shiftedPivot(axis, 50, u);
  const rotation = Quaternion.fromAxisAngle(axis, 50);
  const point = Vector3.create(0.4, -0.7, 0.9);
  const aboutShifted = Vector3.add(
    Quaternion.rotateVector(rotation, Vector3.subtract(point, d)),
    d,
  );
  const aboutOrigin = Vector3.add(Quaternion.rotateVector(rotation, point), u);
  TestValidator.predicate(
    "turning about the shifted point equals turning plus translating",
    vclose(aboutShifted, aboutOrigin, 1e-12),
  );
  TestValidator.predicate(
    "a zero angle has no pivot to shift",
    throwsError(() => shiftedPivot(axis, 0, u), "zero rotation"),
  );
  // A tetrahedron turned 30 degrees about the line x = anything, (y, z) =
  // (0.5, 0.2), then slid 0.1 along the axis.
  const neutral = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  const pivot = Vector3.create(0, 0.5, 0.2);
  const turn = Quaternion.fromAxisAngle(axis, 30);
  const rows: number[] = [];
  for (let v = 0; v < 4; v++) {
    const p = Vector3.create(
      neutral[3 * v],
      neutral[3 * v + 1],
      neutral[3 * v + 2],
    );
    const moved = Vector3.add(
      Vector3.add(
        Quaternion.rotateVector(turn, Vector3.subtract(p, pivot)),
        pivot,
      ),
      Vector3.create(0.1, 0, 0),
    );
    rows.push(v, moved.x - p.x, moved.y - p.y, moved.z - p.z);
  }
  const fit = fitEndpointTransform(neutral, rows, [0, 1, 2, 3]);
  TestValidator.predicate(
    "the screw fits exactly",
    nclose(fit.degrees, 30, 1e-9) &&
      vclose(fit.axis, axis, 1e-9) &&
      fit.rmsMetres < 1e-12,
  );
  const coupling = Vector3.create(0, -0.001, 0.002);
  const opening = decomposeOpening({
    ...fit,
    pivotLandmark: Vector3.create(7, 0, 0),
    couplingPerDegree: coupling,
  });
  TestValidator.predicate(
    "the screw pivot is recovered on the axis nearest the landmark",
    vclose(opening.screwPivot, Vector3.create(7, 0.5, 0.2), 1e-9) &&
      nclose(opening.slideMetres, 0.1, 1e-9),
  );
  const translation = Vector3.scale(coupling, 30);
  const axisPoint = Vector3.subtract(
    opening.screwPivot,
    shiftedPivot(axis, 30, translation),
  );
  const viaAxisPoint = Vector3.add(
    Vector3.add(
      Quaternion.rotateVector(turn, Vector3.subtract(point, axisPoint)),
      axisPoint,
    ),
    translation,
  );
  const viaScrew = Vector3.add(
    Quaternion.rotateVector(turn, Vector3.subtract(point, opening.screwPivot)),
    opening.screwPivot,
  );
  TestValidator.predicate(
    "the condylar axis point reproduces the screw under the coupling",
    vclose(opening.axisPoint, axisPoint, 1e-12) &&
      vclose(opening.translation, translation) &&
      vclose(viaAxisPoint, viaScrew, 1e-12),
  );
  const t = [
    Vector3.create(0, 0, 0.5),
    Vector3.create(0.3, 0, 0),
    Vector3.create(-0.3, 0, 0),
  ];
  const weights = [0, 0.25, 1, 1.2];
  const endpoints = t.map((translation) => ({
    translation,
    rows: weights.flatMap((w, v) => [
      v,
      w * translation.x,
      w * translation.y,
      w * translation.z + (v === 1 ? 0.01 : 0),
    ]),
  }));
  const implied = impliedWeights(4, endpoints);
  TestValidator.predicate(
    "authored fractions come back and an overshoot clamps",
    nclose(implied.weights[0], 0) &&
      nclose(implied.weights[1], 0.25 + (0.01 * 0.5) / (0.25 + 0.09 + 0.09)) &&
      nclose(implied.weights[2], 1) &&
      nclose(implied.weights[3], 1) &&
      implied.clamped === 1 &&
      nclose(implied.worstExcess, 0.2),
  );
  // The clamped vertex authored 1.2 of the 0.5 translation; the 0.1 it moves
  // beyond weight one is the largest remainder no weight explains.
  TestValidator.predicate(
    "the off-axis remainder is what no weight explains",
    nclose(implied.worstOffAxisMetres, 0.1),
  );
  TestValidator.predicate(
    "zero translations refuse",
    throwsError(() =>
      impliedWeights(1, [{ rows: [], translation: Vector3.create() }]),
    ),
  );
};
