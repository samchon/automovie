import type {
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalStepChoice as S } from "../../internal/PhysicalStepChoice";

/** How far a step's time may miss the swing's closed form, seconds. */
const TIME: number = 1e-3;

/** How far a step's target may miss the capture point at landing, metres. */
const TARGET: number = 1e-3;

/** Rounding of a step's clamped length, metres. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMoviePhysicalBalance.assess` triggers, places and times a biped's
 * recovery step by the capture-point rules, checked against their closed
 * forms:
 *
 * - Trigger (Koolen et al., Corollary 3): a capture point past the support shrunk
 *   by the inset by more than the margin asks for a step.
 * - Place and time together (Khadiv et al. 2017, III-B): the foot's middle lands
 *   where the capture point is when the new foot bears, `xi_T = u0 + (xi - u0)
 *   e^(omega T)`, u0 the remaining foot's shrunken outline's point nearest xi
 *   and T the unloading ramp, the swing and the ramp-in; the foot keeps its own
 *   side, at least as wide as it stands.
 * - Reach (Koolen et al., Eq. 25): a step is clamped to the reach, and past the
 *   one-step bound still taken, marked not viable.
 *
 * Scenarios, feet 0.1 m wide and 0.2 m long at x 0.05 to 0.15 and -0.15 to
 * -0.05, z 0 to 0.2, an inset of 2 cm and a margin of 1 cm:
 *
 * 1. A capture point 5 mm past the shrunken front edge at 0.18 m holds; 15 mm
 *    past, inside the real support, steps in the swing's time.
 * 2. At (0.02, 0, 0.27) the step lands on the capture point at landing on its own
 *    side, ahead of its start, at least the inset inside the new support, in
 *    the swing's time.
 * 3. At z = 0.34 the step is clamped to the 0.5 m reach; at z = 3 it is clamped
 *    and not viable.
 * 4. After a diagonal step the left foot steps without crossing the right; a
 *    capture point behind the feet is stepped back to; a four-support body
 *    whose capture point is at its centre holds.
 */
export function test_engine_physics_physical_balance_assess(): void {
  const omega: number = Math.sqrt(S.G / S.HEIGHT);
  const biped: IAutoMoviePhysicalSupportPatch[] = [
    S.foot("left", 0.05, 0.15, 0, 0.2),
    S.foot("right", -0.15, -0.05, 0, 0.2),
  ];
  const of = (bone: string): IAutoMoviePhysicalSupportPatch =>
    biped.find((support) => support.bone === bone)!;
  const distance = (bone: string, target: IAutoMovieVector3): number =>
    Math.hypot(target.x - of(bone).position.x, target.z - of(bone).position.z);

  // 1. The trigger.
  const within = S.assess(biped, { x: 0, y: 0, z: 0.185 });
  const past = S.assess(biped, { x: 0, y: 0, z: 0.195 });
  TestValidator.predicate(
    "the trigger",
    within.state === "supported" &&
      past.state === "recovery" &&
      past.outside === 0 &&
      past.step !== undefined &&
      Math.abs(
        past.step.seconds! -
          S.swing(distance(past.step.bone, past.step.target)),
      ) < TIME,
  );

  // 2. Place and time together.
  const capture: IAutoMovieVector3 = { x: 0.02, y: 0, z: 0.27 };
  const step = S.assess(biped, capture).step!;
  const moving = of(step.bone);
  const staying = biped.find((support) => support.bone !== step.bone)!;
  const xs: number[] = staying.points.map((p) => p.x);
  const zs: number[] = staying.points.map((p) => p.z);
  const clamp = (v: number, lo: number, hi: number): number =>
    Math.max(lo, Math.min(hi, v));
  const u0: IAutoMovieVector3 = {
    x: clamp(capture.x, Math.min(...xs) + S.INSET, Math.max(...xs) - S.INSET),
    y: 0,
    z: clamp(capture.z, Math.min(...zs) + S.INSET, Math.max(...zs) - S.INSET),
  };
  const d: number = distance(step.bone, step.target);
  const growth: number = Math.exp(
    omega * (S.SWING.ramp + S.swing(d) + S.SWING.landing),
  );
  const landing: IAutoMovieVector3 = {
    x: u0.x + (capture.x - u0.x) * growth,
    y: 0,
    z: u0.z + (capture.z - u0.z) * growth,
  };
  const side: number = Math.sign(moving.position.x - staying.position.x);
  const width: number = Math.abs(moving.position.x - staying.position.x);
  const aimed: number =
    staying.position.x +
    side * Math.max(side * (landing.x - staying.position.x), width);
  const moved: IAutoMovieVector3[] = moving.points.map((p) => ({
    x: p.x - moving.position.x + step.target.x,
    y: 0,
    z: p.z - moving.position.z + step.target.z,
  }));
  TestValidator.predicate(
    "placed and timed together",
    step.target.z > moving.position.z &&
      Math.abs(step.target.z - landing.z) < TARGET &&
      Math.abs(step.target.x - aimed) < TARGET &&
      S.inside(S.hull([...staying.points, ...moved]), landing) >=
        S.INSET - TARGET &&
      Math.abs(step.seconds! - S.swing(d)) < TIME,
  );

  // 3. The reach.
  const far = S.assess(biped, { x: 0.02, y: 0, z: 0.34 }).step!;
  const hopeless = S.assess(biped, { x: 0, y: 0, z: 3 }).step!;
  TestValidator.predicate(
    "clamped to the reach",
    Math.abs(distance(far.bone, far.target) - S.REACH) < TARGET &&
      hopeless.viable === false &&
      Math.abs(distance(hopeless.bone, hopeless.target) - S.REACH) < ROUNDING,
  );

  // 4. Sides, back steps and holds.
  const diagonal: IAutoMoviePhysicalSupportPatch[] = [
    S.foot("left", 0.05, 0.15, 0, 0.2),
    S.foot("right", -0.28, -0.18, 0.6, 0.8),
  ];
  const crossing = S.assess(
    diagonal,
    { x: 0, y: 0, z: 0 },
    {
      center: { x: -0.11, y: S.HEIGHT, z: 0.5 },
      velocity: { x: -0.1, y: 0, z: 0.4 },
      unavailable: ["right"],
      force: true,
    },
  ).step;
  const back = S.assess(biped, { x: 0.02, y: 0, z: -0.12 }).step;
  const four: IAutoMoviePhysicalSupportPatch[] = [
    S.foot("frontLeft", 0.2, 0.3, 0.3, 0.4),
    S.foot("frontRight", -0.3, -0.2, 0.3, 0.4),
    S.foot("backLeft", 0.2, 0.3, -0.4, -0.3),
    S.foot("backRight", -0.3, -0.2, -0.4, -0.3),
  ];
  const hold = S.assess(four, { x: 0, y: 0, z: 0 }, { force: true });
  TestValidator.predicate(
    "sides, back steps and holds",
    crossing?.bone === "left" &&
      crossing.target.x > -0.13 - ROUNDING &&
      back !== undefined &&
      back.target.z < of(back.bone).position.z &&
      hold.state === "supported" &&
      hold.step === undefined,
  );
}
