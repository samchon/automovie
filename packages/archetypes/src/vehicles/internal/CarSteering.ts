import { AutoMovieArchetypeUnits } from "../../core";

/*
 * Read the steering-wheel angle on a signed root curvature.
 *
 * Dividing the right triangle by the root radius keeps its legs representable
 * for gentle curves. From the rear axle, the adjacent leg is the square root of
 * one minus the squared normalized half-wheelbase.
 * Parameter wheelbase: Distance between the axle centres in metres.
 * Parameter ratio: Steering-wheel travel over road-wheel travel.
 * Parameter curvature: Signed inverse metres, positive to the left.
 * Returns: Steering-wheel travel in degrees, before reversing direction.
 */
export function CarSteering(
  wheelbase: number,
  ratio: number,
  curvature: number,
): number {
  if (curvature === 0) return 0;
  const opposite: number = Math.min(2, wheelbase * Math.abs(curvature));
  const half: number = opposite / 2;
  const adjacent: number = Math.sqrt((1 - half) * (1 + half));
  return (
    Math.sign(curvature) *
    ratio *
    (Math.atan2(opposite, adjacent) / AutoMovieArchetypeUnits.DEGREE)
  );
}
