import { createCart, createHandgun } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanAuditContinuity,
  AutoMovieMotionHumanTiming,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSegment,
  HumanVerdicts,
  HumanWeaponFirearm,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Presenting over a moving support (#3491): a person standing on a moving
 * cart presents a handgun as an overlay of the stance, claiming the trunk's
 * turn and the holding arm, and the plan made at its start is carried by
 * the cart.
 *
 * Scenarios, the average man standing 4 s on a cart running at 1 m/s along
 * +Z, presenting a handgun held in one hand at the low ready toward a point
 * 3 m ahead of where he stands at the start, at chest height, over the
 * stance (a ready weapon rides the cart; an aimed one keeps its line on the
 * target, `test_human_motion_support_aim`):
 * 1. The presentation plans as an overlay and claims `trunkTurn` and the
 *    right arm and hand.
 * 2. Over its hold, at seven instants from its middle to where its fade-out
 *    begins (`HumanSegment.FADE` before its end), the muzzle's place in the
 *    cart's frame moves by at most 10 mm (#3491's bound for what rides a
 *    support, the audit's skin).
 * 3. Across the overlay's end the muzzle is continuous: over the audit's
 *    finest interval about the end it moves no more than the audit's jump
 *    reading (`AutoMovieMotionHumanAudit.LIMITS.jump`).
 * 4. The fade-out lowers the muzzle, in the cart's frame, no faster than an
 *    arm transports it: its peak speed, read a frame of film apart, is at
 *    most a minimum-jerk transport's 15/8 of the mean (Flash and Hogan 1985)
 *    over the time an aimed movement of that amplitude to a hand-wide place
 *    takes (McIntosh et al. 2018, `AutoMovieMotionHumanTiming.aimed`); a
 *    muzzle the fade moves less than the audit's jump reading stays, no frame
 *    of the fade moving it more.
 * 5. The feet stay planted on the cart: the toes move by at most 10 mm in
 *    its frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Presents a real handgun over a stance on a moving cart through the public chain and reads the displayed gun and feet in the cart's frame; a presentation left behind in the world, a refused overlay or feet dragged off the bed fails.
 * @evidence contracts/development/testing.md#independent-expectations The cart's motion is the scene's; the 10 mm is #3491's bound; the jump is the audit's own reading, and the transport speed the minimum-jerk profile over a cited movement time.
 * @evidence contracts/development/testing.md#distinguishing-cases The gun and the feet; the hold, the end and the fade-out.
 * @evidence contracts/development/testing.md#execution-ownership Builds one performance in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios with their bounds.
 */
export function test_human_motion_carrier_present_cart(): void {
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const gun: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const motion = (seconds: number): IAutoMovieMotionHumanObject.Placement => ({
    at: { x: 0, y: 0, z: seconds },
    yaw: 0,
  });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let performance: IAutoMovieMotionHumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "carrier-present",
      laws: [HumanWeaponFirearm.draw, HumanWeaponFirearm.present],
      props: [
        HumanObject.prop("cart", cart, motion(0), motion),
        HumanObject.prop("gun", gun, {
          at: { x: 0.25, y: 0.9, z: 0.4 },
          yaw: 0,
        }),
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .registered("drawFirearm", { prop: "gun" })
        .stand({ seconds: 4, on: { prop: "cart" } })
        .over((u) =>
          u.registered("presentFirearm", {
            gun: "gun",
            hands: 1,
            carriage: "lowReady",
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0, y: body.measure.chestHeight, z: 3 },
            },
            seconds: 2,
          }),
        ).node,
    });
  } catch (error) {
    TestValidator.predicate(
      `the presentation plans over the stance (${error instanceof Error ? error.message : String(error)})`,
      false,
    );
    return;
  }
  const overlay = performance.overlays("a")[0];
  TestValidator.predicate(
    "the presentation is an overlay claiming the trunk's turn and the right arm",
    overlay !== undefined &&
      (overlay.plan.channels ?? []).includes("trunkTurn") &&
      (overlay.plan.channels ?? []).includes("rightArm"),
  );
  if (overlay === undefined) return;
  const local = (p: IAutoMovieVector3, t: number): IAutoMovieVector3 => {
    const at = HumanObject.frame(motion(t));
    return Quaternion.rotateVector(
      Quaternion.inverse(at.rotation),
      Vector3.subtract(p, at.position),
    );
  };
  const muzzle = (t: number): IAutoMovieVector3 => {
    const held = performance.prop("gun", t);
    return local(
      Vector3.add(
        held.position,
        Quaternion.rotateVector(
          held.rotation,
          gun.affordance("muzzle").frame.translation,
        ),
      ),
      t,
    );
  };
  // The hold runs until the overlay begins to fade out (`HumanSegment.FADE`
  // before its end); the fade and the end are judged below.
  const end: number = overlay.start + overlay.plan.duration;
  const from: number = overlay.start + overlay.plan.duration * 0.5;
  const to: number = end - HumanSegment.FADE;
  const first: IAutoMovieVector3 = muzzle(from);
  let drift: number = 0;
  for (let k: number = 1; k <= 6; k++)
    drift = Math.max(
      drift,
      Vector3.length(
        Vector3.subtract(muzzle(from + ((to - from) * k) / 6), first),
      ),
    );
  TestValidator.predicate(
    `the presented muzzle rides the cart (${(1000 * drift).toFixed(1)} mm)`,
    drift <= HumanVerdicts.SKIN,
  );

  // Across the overlay's end the muzzle moves on continuously: over the
  // audit's finest interval about the end it moves no more than the audit's
  // jump reading.
  const fine: number =
    1 /
    (AutoMovieMotionHumanAuditContinuity.REVERSAL *
      4 ** AutoMovieMotionHumanAuditContinuity.LEVELS);
  const across: number = Vector3.length(
    Vector3.subtract(muzzle(end + fine), muzzle(end - fine)),
  );
  TestValidator.predicate(
    `the muzzle is continuous across the presentation's end (${(1000 * across).toFixed(2)} mm)`,
    across <= AutoMovieMotionHumanAudit.LIMITS.jump,
  );

  // The fade-out lowers the muzzle no faster than an arm transports it: its
  // peak speed is at most a minimum-jerk transport's, 15/8 of the mean
  // (Flash and Hogan 1985), over the time an aimed movement of that
  // amplitude to a hand-wide place takes (McIntosh et al. 2018,
  // `AutoMovieMotionHumanTiming.aimed`).
  // Read a frame of film apart (`AutoMovieMotionHumanAuditContinuity.REVERSAL`).
  const step: number = 1 / AutoMovieMotionHumanAuditContinuity.REVERSAL;
  let peak: number = 0;
  for (let s: number = end - HumanSegment.FADE; s + step <= end; s += step)
    peak = Math.max(
      peak,
      Vector3.length(Vector3.subtract(muzzle(s + step), muzzle(s))) / step,
    );
  const travel: number = Vector3.length(
    Vector3.subtract(muzzle(end), muzzle(end - HumanSegment.FADE)),
  );
  // A muzzle the fade moves less than the audit's jump reading stays: no
  // frame of the fade moves it more than that either.
  const still: boolean = travel <= AutoMovieMotionHumanAudit.LIMITS.jump;
  const transport: number = still
    ? AutoMovieMotionHumanAudit.LIMITS.jump / step
    : (15 / 8) *
      (travel / AutoMovieMotionHumanTiming.aimed(travel, body.measure.hand));
  TestValidator.predicate(
    `the fade lowers the muzzle no faster than an arm transport (${peak.toFixed(2)} of ${transport.toFixed(2)} m/s over ${travel.toFixed(3)} m)`,
    peak <= transport,
  );
  for (const side of ["left", "right"] as const) {
    const toe = (t: number): IAutoMovieVector3 =>
      local(performance.bones("a", t).get(`${side}Toes`)!.worldPosition, t);
    const start: IAutoMovieVector3 = toe(from);
    let slip: number = 0;
    for (let k: number = 1; k < 7; k++)
      slip = Math.max(
        slip,
        Vector3.length(
          Vector3.subtract(toe(from + ((to - from) * k) / 7), start),
        ),
      );
    TestValidator.predicate(
      `the ${side} foot stays on the cart (${(1000 * slip).toFixed(1)} mm)`,
      slip <= 0.01,
    );
  }
}
