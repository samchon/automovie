import { createDrinkware } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanDrinkingArm,
  HumanChain,
  HumanObject,
  type HumanSegment,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A glass is brought to the lips as people drink from one, on each of the
 * four extreme bodies: the right arm at `atMouth` of a drink and of a sip
 * with the implied glass, and of a drink from a real glass the hand took
 * up for that use first (`pickUp` with `use`, then `handToFace` with the
 * prop), so the same drink is read however the glass came to the hand.
 *
 * Bound and source: a glass is brought to the mouth with the shoulder raised
 * about 40 to 50 degrees, the elbow low and in front of the body and the
 * forearm near vertical, not saluting at the forehead (Murphy, Willén and
 * Sunnerhagen 2011, Neurorehabil Neural Repair 25:71, drinking from a
 * glass). Bound: the upper arm raised at most 70 degrees from hanging, the
 * elbow at least 50 mm below the shoulder joint, and the wrist within a
 * hand length of the mouth region (provisional limits).
 *
 * Split from `test_human_motion_signature_hand_to_face`, which stages its
 * rows on a covering of the bodies, because this bound is read on every
 * body. The real glass stands at waist height before the right shoulder,
 * 0.6 of the arm's length ahead, as `test_human_motion_prop_held_attitude`
 * places it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law on real bodies, with the implied glass and with a real one taken up first, and reads displayed joints; a raised elbow or a wrist off the mouth fails with its cell, values, bound and source, and the arm goal it came from.
 * @evidence contracts/development/testing.md#independent-expectations The posture is Murphy et al.'s; the limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases A drink, a sip and a drink from a held glass on each of the four extreme bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory, twelve films; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the bound with its source and status, the three cells, the split and the glass's place.
 */
export function test_human_motion_signature_hand_to_face_drink(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const stood: HumanObject.Placement = {
      at: {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    };
    const cells: [string, M.IStaged][] = [
      [`task=drink ${name}`, M.stage("handToFace", "task=drink", name)],
      [`task=sip ${name}`, M.stage("handToFace", "task=sip", name)],
      [
        `held glass ${name}`,
        {
          film: motionHumanLaw.perform(
            "signature",
            [{ subject: "a", body }],
            HumanChain.subject("a")
              .pickUp({
                prop: "glass",
                handle: "body",
                use: { tip: "lip", line: "square", at: "mouth" },
              })
              .handToFace({ task: "drink", prop: "glass" }),
            [HumanObject.prop("glass", glass, stood)],
          ),
          body,
          yaw: 0,
        },
      ],
    ];
    for (const [label, s] of cells) {
      const cell: string = `handToFace ${label}`;
      const at: number = M.event(s, "atMouth")!;
      const shoulder: IAutoMovieVector3 = M.joint(s, at, "rightUpperArm");
      const knuckle: IAutoMovieVector3 = M.joint(s, at, "rightLowerArm");
      const hand: IAutoMovieVector3 = M.joint(s, at, "rightHand");
      const arm: IAutoMovieVector3 = {
        x: knuckle.x - shoulder.x,
        y: knuckle.y - shoulder.y,
        z: knuckle.z - shoulder.z,
      };
      const elevation: number =
        (Math.acos(-arm.y / Math.hypot(arm.x, arm.y, arm.z)) * 180) / Math.PI;
      // The arm's goal there, for the fit it came from: the elbow's hint
      // and the reference arm, and where the fitted elbow and the wrist lie.
      const posture: IHumanPosture = s.film.performance.posture("a", at);
      const segments: readonly HumanSegment.ISegment[] =
        s.film.performance.segments("a");
      const entered: IHumanPosture = s.film.performance.posture(
        "a",
        segments[segments.length - 1]!.start,
      );
      const mouth: IAutoMovieVector3 = M.region(s, "a", s.body, "mouth", at);
      const goal: IHumanPosture.IGoal | undefined = posture.limbs.rightArm;
      const v = (p: IAutoMovieVector3 | undefined): string =>
        p === undefined
          ? "none"
          : `(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`;
      const drinks: boolean = elevation <= 70 && shoulder.y - knuckle.y >= 0.05;
      // On a miss, what the law's own drinking reader reads for this very
      // posture and goal, so a reader that admits what is not shown is
      // told apart from a goal or posture the plan did not foresee.
      const read: AutoMovieMotionHumanDrinkingArm.IArm | undefined =
        drinks || goal === undefined
          ? undefined
          : AutoMovieMotionHumanDrinkingArm.read(
              s.body,
              posture,
              "right",
              goal,
              false,
            );
      complaints.check(
        `${cell}: at the mouth (${at.toFixed(2)} s) the upper arm is raised ${elevation.toFixed(1)} deg from hanging and the elbow stands ${((shoulder.y - knuckle.y) * 1000).toFixed(0)} mm below the shoulder, at most 70 deg and at least 50 mm below expected (Murphy et al. 2011; provisional); shoulder ${v(shoulder)}, elbow ${v(knuckle)}, wrist ${v(hand)}, the goal's point ${v(goal?.point)}, rotation ${JSON.stringify(goal?.rotation ?? null)}, hint ${v(goal?.bend)}, reference ${JSON.stringify(goal?.reference ?? null)}; the drinking reader reads ${read === undefined ? "nothing" : `${read.elevation.toFixed(1)} deg and ${(read.drop * 1000).toFixed(0)} mm`} on this posture and goal; root ${v(posture.root)}, trunk ${JSON.stringify([posture.joints.spine, posture.joints.chest, posture.joints.upperChest])}, neck and head ${JSON.stringify([posture.joints.neck, posture.joints.head])} against ${JSON.stringify([entered.joints.neck, entered.joints.head])} at the act's start, mouth ${v(mouth)}, other arm ${posture.limbs.leftArm === undefined ? "free" : v(posture.limbs.leftArm.point)}`,
        drinks,
      );
      const gap: number = Math.hypot(
        hand.x - mouth.x,
        hand.y - mouth.y,
        hand.z - mouth.z,
      );
      complaints.check(
        `${cell}: at the mouth (${at.toFixed(2)} s) the wrist is ${(gap * 1000).toFixed(0)} mm from the mouth, within a hand length (${(s.body.measure.hand * 1000).toFixed(0)} mm) expected`,
        gap <= s.body.measure.hand,
      );
    }
  }
  complaints.assert("a glass comes to the lips as people drink");
}
