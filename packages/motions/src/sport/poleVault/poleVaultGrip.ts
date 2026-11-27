import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { walkPoleFrame } from "../../actions/internal/walkPoleFrame";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poleVaultLean } from "./poleVaultLean";
import { poleVaultSwing } from "./poleVaultSwing";
import { poleVaultTakeoffAngle } from "./poleVaultTakeoffAngle";

/**
 * The farthest from the planted end the top hand can grip the pole and still
 * swing it upright from a run at `speed`: a pole stands only as far as the
 * run's energy carries the vaulter over the planted end (Linthorne 2000: the
 * grip height is "determined primarily by the kinetic energy at take-off"), so
 * a slower run grips lower, as coaches set a beginner's grip from the approach
 * speed.
 *
 * Each grip ??is planted as the vault plants (`walkPoleFrame.plant`, the
 * straight top arm at the body's power-grip angle, `walkPoleFrame.power`), and
 * its swing judged by the vault's own model (`poleVaultSwing.integrate`): the
 * grip behind the planted end at its plant height, the run's speed kept and
 * rising at its take-off angle (`poleVaultTakeoffAngle`), on a pole as stiff as
 * `rating`. A swing reaches the release for every grip up to one and for none
 * past it, so the grip is found by bisection on that monotone condition.
 *
 * @param body The vaulter's body.
 * @param side The top hand.
 * @param speed The run's speed, m/s (`run.speed`).
 * @param length The pole's whole length, metres: the farthest grip.
 * @param rating The pole's stiffness rating, kilograms; the vaulter's mass when
 *   absent (NFHS Rule 7-5-3).
 * @returns The grip's distance from the planted end, metres; the whole length
 *   when that already swings upright.
 * @throws {HumanRefusal} When no grip that plants swings upright at that speed.
 */
export function poleVaultGrip(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  speed: number,
  length: number,
  rating?: number,
): number {
  // The body's own power-grip angle, as a grasp of the bar will hold it.
  const neutral: number = walkPoleFrame.power(body, side);
  const shoulder: number =
    body.rest.get(side === "left" ? "leftUpperArm" : "rightUpperArm")!.y -
    body.rest.get(side === "left" ? "leftFoot" : "rightFoot")!.y +
    body.measure.ankleHeight;
  const reach: number = body.measure.upperArm + body.measure.forearm;
  const rise: number = (poleVaultTakeoffAngle(speed) * Math.PI) / 180;
  const vf: number = speed * Math.cos(rise);
  const vy: number = speed * Math.sin(rise);
  const buckling: number =
    (rating ?? body.profile.mass) * poleVaultSwing.RATING;
  const swings: (l: number) => boolean = (l: number): boolean => {
    const at: walkPoleFrame.IPlant | undefined = walkPoleFrame.plant(
      shoulder,
      reach,
      l,
      neutral,
      poleVaultLean,
    );
    if (at === undefined) return false;
    // The grip behind the planted end along the run, at its plant height.
    return (
      poleVaultSwing.integrate({
        radius: {
          forward: -Math.sqrt(Math.max(0, l * l - at.high * at.high)),
          up: at.high,
        },
        velocity: { forward: vf, up: vy },
        mass: body.profile.mass,
        buckling,
        gravity: AutoMovieGravity.STANDARD,
        upright: 0,
        run: speed,
      }).failure === null
    );
  };
  if (swings(length)) return length;
  // The shortest grip that still plants: its end on the floor from the
  // hand hanging straight down, leaning `LEAN`.
  let low: number = Math.max(
    0,
    (shoulder - reach) / Math.cos((poleVaultLean * Math.PI) / 180),
  );
  let high: number = length;
  if (!swings(low))
    throw new HumanRefusal({
      kind: "base",
      axis: "run",
      value: speed,
      reason: `at ${speed.toFixed(2)} m/s no grip on the pole swings it upright`,
      fix: "run faster into the vault",
    });
  for (let k: number = 0; k < SPLITS; k++) {
    const middle: number = (low + high) / 2;
    if (swings(middle)) low = middle;
    else high = middle;
  }
  return low;
}

/**
 * The halvings the grip's bisection takes: a pole's length to well under a
 * millimetre.
 */
const SPLITS: number = 24;
