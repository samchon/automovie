import { createHolster, createSeat, createSword } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSheath,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanPropFrame,
  HumanSheath,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A seated pelvis stays this near its seat through the draw, metres: the carrier keeps the body. */
const SEATED: number = 0.03;
/** A held or seated blade keeps its carrier's frame within this, metres: the mount bound. */
const RIGID: number = 0.002;
/** How far the drawn tip clears the mouth, metres: the staged clearance. */
const CLEARANCE: number = 0.03;

/**
 * A seated performer draws a knife from the sheath at the hip and sheathes
 * it again, both over the sit that keeps the body (#3956's need: a rider's
 * draw from the hip), on two bodies.
 *
 * Scenarios:
 * 1. The pelvis stays on the seat through the draw and the return: the
 *    handling claims only its arm.
 * 2. The blade rides the sheath until the hand closes on it, the hand from
 *    the draw's end to the return, and the sheath again after it.
 * 3. The take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seated draw and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes HumanSheath's draw and return over a sit through HumanPerformance and reads the pelvis, the blade's custody and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The seat's tolerance is authored; the rigid bound is the mount bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; seated, held and returned custody.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_seated_draw(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    try {
      const chair: ReturnType<typeof createSeat> = createSeat({
        id: "chair",
        kind: "dining",
      });
      const placement: IAutoMovieMotionHumanObject.Placement = {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        fixed: true,
      };
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        chair,
        placement,
      );
      const sheath: ReturnType<typeof createHolster> = createHolster({
        id: "sheath",
        kind: "sheath",
        blade: "knife",
      });
      const knife: ReturnType<typeof createSword> = createSword({
        kind: "knife",
      });
      const staged: IAutoMovieMotionHumanSheath.IStaging = HumanSheath.of(
        {
          ...HumanObject.prop("sheath", sheath, {
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
          }),
          worn: {
            subject: "s",
            bone: "hips",
            offset: {
              position: {
                x: -0.2 * (body.measure.stature / 1.75),
                y: -0.25,
                z: 0.05,
              },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            },
          },
        },
        HumanObject.prop("knife", knife, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
        { mouth: "mouth", tip: "point", handle: "grip", clearance: CLEARANCE },
      );
      const sitting: IAutoMovieMotionHumanChain = HumanChain.subject("s")
        .sit({ seat, seconds: 8 }, "sit")
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            HumanSheath.sheathe(
              HumanSheath.draw(upper, staged.sheath, "right", "draw"),
              staged.sheath,
              "right",
              "sheathe",
            ).sync({ of: "sit", event: "seated" }),
        );
      const props: IAutoMovieMotionHumanProp[] = [
        HumanObject.prop("chair", chair, placement),
        staged.carrier,
        staged.blade,
      ];
      const film: HumanPerformance = new HumanPerformance({
        seed: "seated-draw",
        laws: Object.values(HUMAN_LEXICON).flat(),
        props,
        performers: [
          {
            subject: "s",
            body,
            at: { x: 0, y: 0, z: 0.4 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: sitting.node,
      });
      const seated: number = film.instant({ of: "sit", event: "seated" });
      const drawn: number = film.instant({ of: "draw", event: "drawn" });
      const placed: number = film.instant({ of: "sheathe", event: "placed" });
      const pelvis: IAutoMovieVector3 = film
        .bones("s", seated)
        .get("hips")!.worldPosition;
      for (let i: number = 0; i <= 12; ++i) {
        const t: number = seated + ((placed + 0.3 - seated) * i) / 12;
        checks.check(
          `${label}: the pelvis stays on the seat at ${t.toFixed(2)}`,
          Vector3.distance(
            film.bones("s", t).get("hips")!.worldPosition,
            pelvis,
          ) <= SEATED,
        );
      }
      const inSheath: (t: number) => IAutoMovieRigidTransform = (
        t: number,
      ): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(film.prop("sheath", t), film.prop("knife", t));
      const inHand: (t: number) => IAutoMovieRigidTransform = (
        t: number,
      ): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(
          HumanPropFrame.bone(film.bones("s", t).get("rightHand")!),
          film.prop("knife", t),
        );
      checks.check(
        `${label}: the knife rides the sheath until the draw`,
        Vector3.distance(inSheath(seated).position, inSheath(0).position) <=
          RIGID,
      );
      checks.check(
        `${label}: the hand keeps the knife between the draw and the return`,
        Vector3.distance(
          inHand(drawn + 0.02).position,
          inHand(drawn + 0.3).position,
        ) <= RIGID,
      );
      checks.check(
        `${label}: the knife is seated again after the return`,
        Vector3.distance(
          inSheath(placed + 0.3).position,
          inSheath(0).position,
        ) <= 0.015,
      );
      assertTakeClean(`${label} seated draw`, film);
    } catch (error: unknown) {
      checks.check(`${label} refused: ${String(error)}`, false);
    }
  }
  checks.assert("seated draw");
}
