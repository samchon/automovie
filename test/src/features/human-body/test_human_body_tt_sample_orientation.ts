import {
  humanBodyShoulderOrientationDistance,
  humanBodyShoulderPoseFromDirection,
  type IAutoMovieHumanBodyShoulderPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { interpolateBodyShoulderPose } from "../../../scripts/body-basis/interpolateBodyShoulderPose";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Shared direction readout and physical interpolation preserve sides, complete
 * orientation and endpoint pole representations without inventing torsion.
 *
 * Scenarios:
 * 1. Mirrored lateral and anterior unit directions read independent 45-degree
 *    tilt; one direction alone returns zero torsion.
 * 2. A lateral 45-to-135 tilt has a 90-degree midpoint; a general midpoint is
 *    halfway along the shortest SO(3) arc with plane and axial data retained.
 * 3. Equivalent overhead endpoint gauges have equivalent intermediates, while
 *    exact endpoint records and caller ownership are preserved.
 * 4. Invalid fractions and different humeri are refused.
 */
export const test_human_body_tt_sample_orientation = (): void => {
  const s = Math.SQRT1_2;
  const left = humanBodyShoulderPoseFromDirection({ bone: "leftUpperArm", direction: { x: s, y: -s, z: 0 } });
  const right = humanBodyShoulderPoseFromDirection({ bone: "rightUpperArm", direction: { x: -s, y: -s, z: 0 } });
  const front = humanBodyShoulderPoseFromDirection({ bone: "leftUpperArm", direction: { x: 0, y: -s, z: s } });
  TestValidator.predicate("mirrored rest tilts agree", nclose(left.plane, 0, 1e-9) && nclose(right.plane, 0, 1e-9) && nclose(left.elevation, 45, 1e-9) && nclose(right.elevation, 45, 1e-9));
  TestValidator.predicate("the anterior plane is separate from elevation", nclose(front.plane, 90, 1e-9) && nclose(front.elevation, 45, 1e-9) && nclose(front.axialRotation, 0, 1e-9));
  const lateral: IAutoMovieHumanBodyShoulderPose = { ...left, elevation: 135 };
  const middle = interpolateBodyShoulderPose({ from: left, to: lateral, fraction: 0.5 });
  TestValidator.predicate("the analytic lateral midpoint is ninety degrees", nclose(middle.plane, 0, 1e-9) && nclose(middle.elevation, 90, 1e-9) && nclose(middle.axialRotation, 0, 1e-9));
  const target: IAutoMovieHumanBodyShoulderPose = { bone: "leftUpperArm", plane: 90, elevation: 150, axialRotation: 20 };
  const total = humanBodyShoulderOrientationDistance(left, target);
  const general = interpolateBodyShoulderPose({ from: left, to: target, fraction: 0.5 });
  TestValidator.predicate("a complete orientation follows the shortest arc", nclose(humanBodyShoulderOrientationDistance(left, general), total / 2, 1e-6) && nclose(humanBodyShoulderOrientationDistance(general, target), total / 2, 1e-6));
  const up: IAutoMovieHumanBodyShoulderPose = { ...left, elevation: 180 };
  const gauge: IAutoMovieHumanBodyShoulderPose = { ...up, plane: 45, axialRotation: -90 };
  const a = interpolateBodyShoulderPose({ from: left, to: up, fraction: 0.5 });
  const b = interpolateBodyShoulderPose({ from: left, to: gauge, fraction: 0.5 });
  TestValidator.predicate("equivalent overhead gauges share the physical path", nclose(humanBodyShoulderOrientationDistance(a, b), 0, 1e-6));
  const before = JSON.stringify({ left, gauge });
  const start = interpolateBodyShoulderPose({ from: left, to: gauge, fraction: 0 });
  const end = interpolateBodyShoulderPose({ from: left, to: gauge, fraction: 1 });
  TestValidator.equals("authored endpoint representations are exact", JSON.stringify({ start, end }), JSON.stringify({ start: left, end: gauge }));
  start.plane = 15;
  end.axialRotation = 10;
  TestValidator.equals("endpoint outputs are independently owned", JSON.stringify({ left, gauge }), before);
  for (const fraction of [NaN, Infinity, -1, 2])
    TestValidator.predicate("invalid sample fractions are refused", throwsError(() => interpolateBodyShoulderPose({ from: left, to: target, fraction }), "fraction"));
  TestValidator.predicate("a path cannot exchange humeri", throwsError(() => interpolateBodyShoulderPose({ from: left, to: { ...target, bone: "rightUpperArm" }, fraction: 0.5 }), "same humerus"));
};
