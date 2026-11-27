import { AutoMovieEngineGravity, AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core";
import type { AutoMovieArchetypeSwing } from "../AutoMovieArchetypeSwing";

/*
 * A pumped playground swing on the ride's clock: the hanging seat model
 * (`createSwing.seat`) turns about the beam's pivot axis by the swing angle,
 * positive toward `+Z`.
 *
 * The seat is a simple pendulum of the hanging length to the seated centre of
 * mass, with angular frequency `sqrt(g / length)`. Seated pumping, by the rider
 * turning the body at each turning point, adds a fixed angle to the amplitude
 * every half swing (Wirkus, Rand and Ruina, "How to pump a swing", College Math
 * J 29:266, 1998, https://www.maa.org/pubs/CMJ_September98.html). Each half
 * swing runs from one turning point to the next on a cosine whose two ends are
 * those turning points, so the seat is still at each turning point and its path
 * stays smooth while the amplitude grows. Half swings without pumping keep
 * their amplitude.
 * Parameter swing: The installed swing frame.
 * Parameter placement: Its world placement.
 * Parameter ride: The start, the pumped half swings and the angle each adds.
 * Returns: The seat's frame and the turning points on the ride's clock.
 * For a hanging length, start angle or
 * increment out of range.
 */
export function rideSwing(
  swing: AutoMovieArchetype<"ground", AutoMovieArchetypeSwing.Dimension>,
  placement: IAutoMovieTransform,
  ride: AutoMovieArchetypeSwing.IRideParams,
): AutoMovieArchetypeSwing.IRideResult {
  const length: number = ride.length;
  const hanging: number = swing.dimensions.pivot! - swing.dimensions.clearance!;
  if (!(length > 0 && length <= hanging + 1))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "swing",
      axis: "length",
      value: length,
      feasible: { kind: "range", minimum: 0, maximum: hanging + 1, unit: "m" },
      reason:
        "the pendulum length runs from the pivot to the seated centre of mass",
      fix: "give the distance from the beam to the rider's centre of mass",
    });
  if (
    !(Math.abs(ride.start) < 60 && ride.increment >= 0 && ride.increment < 15)
  )
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "swing",
      axis: "increment",
      value: ride.increment,
      feasible: { kind: "range", minimum: 0, maximum: 15, unit: "degrees" },
      reason:
        "the start angle and each half swing's added angle must stay in the swing's small range",
      fix: "start below 60 degrees and add less than 15 degrees a half swing",
    });
  const omega: number = Math.sqrt(AutoMovieEngineGravity.STANDARD / length);
  const half: number = Math.PI / omega;

  // The turning points, alternating in sign: each pumped half swing ends
  // one increment wider than it started, capped below 60 degrees.
  const turns: number[] = [ride.start];
  for (let k: number = 0; k < ride.halves; ++k) {
    const amplitude: number = Math.min(
      59,
      Math.abs(turns[k]!) + (k < ride.pumps ? ride.increment : 0),
    );
    turns.push(turns[k]! >= 0 ? -amplitude : amplitude);
  }
  const angle = (seconds: number): number => {
    const k: number = Math.max(
      0,
      Math.min(ride.halves - 1, Math.floor(seconds / half)),
    );
    const tau: number = Math.max(0, Math.min(half, seconds - k * half));
    const from: number = turns[k]!;
    const to: number = turns[k + 1]!;
    return (from + to) / 2 + ((from - to) / 2) * Math.cos(omega * tau);
  };
  return {
    half,
    turns,
    angle,
    seat: (seconds: number): IAutoMovieTransform =>
      AutoMovieArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: swing.dimensions.pivot!, z: 0 },
        rotation: AutoMovieEngineQuaternion.fromAxisAngle(AXIS, -angle(seconds)),
      }),
  };
}

/*
 * A unit scale: the rides move rigid frames.
 */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/*
 * The pivot axis: the swing turns about the beam, `+X`.
 */
const AXIS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
