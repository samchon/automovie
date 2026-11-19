import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanCoupled,
  HumanPerformance,
  HumanSignature,
  grapple,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * A staged grapple keeps its partner contact and displays the chosen outcome.
 *
 * Scenarios:
 * 1. Complete a judo entry with collar-and-sleeve contact and a seated-to-back transfer.
 * 2. Interrupt a freestyle single-leg entry with leg-level contact, check clearance and recover upright.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the two authored outcomes and the observed pairing, supports and final orientation.
 * @evidence contracts/development/testing.md#behavioral-verification The public mutual record runs both real Human bodies. A missing or misplaced grip, premature mat support release, absent descent or unwanted fall fails on its displayed frame or contact event. For the interrupted entry, joint centres in either direction and the contacting forearm axis catch a palm fit that intrudes into the other actor.
 * @evidence contracts/development/testing.md#independent-expectations Region identities come from the scene vocabulary. The 10 mm palm and joint clearance allowances use the repository's contact and skin bounds, and the contacting forearm axis must stay outside the receiving actor as in test_human_motion_hug. A standing head sits above the pelvis by more than 30 percent of stature, the standing criterion in test_motion_posture_coupled_support. Clearance is sampled at 30 Hz and at authored events, grip boundaries and the grasp midpoint. These are signed collider queries of displayed geometry, rather than swept skin-to-skin distances.
 * @evidence contracts/development/testing.md#distinguishing-cases The judo example has two upper-body grips and an authored mat transfer. The denied freestyle example has one thigh grip and a standing recovery, with clearance checked through the reach and release as well as held contact. This fixture uses one pair and supplies no swept or multi-size evidence.
 * @evidence contracts/development/testing.md#execution-ownership The named in-memory test uses public composition and exact-second pose queries, with no viewer or host dependencies.
 */
export function test_motion_exercise_grapple(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const contactAllowance: number = 0.01;
  const skinAllowance: number = 0.01;
  const uprightHeight: number = 0.3 * body.measure.stature;
  const scenes: readonly IAutoMovieMotionHumanGrapple.IScene[] = [
    { kind: "seoiNage", outcome: "complete" },
    { kind: "singleLeg", outcome: "denied" },
  ];

  for (const scene of scenes) {
    const label: string = `${scene.kind} ${scene.outcome}`;
    // Offset the receiver's mark for the interrupted entry. Both actors
    // advance on their floor supports, so a square cast lets their bodies
    // cross even when the reaching palm fits the named region.
    const singleLeg: boolean = scene.kind === "singleLeg";
    const initiatorZ: number = singleLeg ? -0.21 : -0.25;
    const receiverX: number = singleLeg ? -0.36 : 0;
    const receiverZ: number = singleLeg ? 0.66 : 0.25;
    const receiverYaw: number = singleLeg ? 165 : 180;
    try {
      const film: motionHumanLaw.IFilm = motionHumanLaw.film(
        new HumanPerformance({
          seed: `exercise-grapple-${scene.kind}`,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: initiatorZ },
              yaw: 0,
              proficiency: { level: "trained" },
            },
            {
              subject: "b",
              body,
              at: { x: receiverX, y: 0, z: receiverZ },
              yaw: receiverYaw,
              proficiency: { level: "trained" },
            },
          ],
          laws: [grapple],
          composition: HumanChain.mutual(
            HumanCoupled.grappling,
            {
              initiator: HumanChain.subject("a").stand({
                seconds: 0.3,
                sway: 0,
              }),
              receiver: HumanChain.subject("b").stand({
                seconds: 0.3,
                sway: 0,
              }),
            },
            scene,
          ).node,
        }),
      );
      const a: IAutoMovieMotionHumanSegment = film.performance
        .segments("a")
        .at(-1)!;
      const b: IAutoMovieMotionHumanSegment = film.performance
        .segments("b")
        .at(-1)!;
      complaints.check(
        `${label} shares a start and end with both actors`,
        Math.abs(a.start - b.start) < 1e-9 && Math.abs(a.end - b.end) < 1e-9,
      );

      const initiator: IAutoMovieMotionHumanSignature.IReader =
        HumanSignature.of(film.performance, "a", body, 0);
      const receiver: IAutoMovieMotionHumanSignature.IReader =
        HumanSignature.of(film.performance, "b", body, receiverYaw);
      const grips: IAutoMovieMotionHumanContactWindow[] =
        a.plan.contacts.filter(
          (contact: IAutoMovieMotionHumanContactWindow): boolean =>
            contact.kind === "grip" &&
            contact.support.kind === "person" &&
            contact.support.subject === "b",
        );
      const expected: readonly AutoMovieHumanoidRegion[] =
        scene.kind === "seoiNage"
          ? ["elbowRight", "neckLeft"]
          : ["thighFrontLeft"];
      complaints.equals(
        `${label} partner regions`,
        grips
          .map(
            (
              contact: IAutoMovieMotionHumanContactWindow,
            ): AutoMovieHumanoidRegion | undefined =>
              "region" in contact.support ? contact.support.region : undefined,
          )
          .sort(
            (
              left: AutoMovieHumanoidRegion | undefined,
              right: AutoMovieHumanoidRegion | undefined,
            ): number => (left ?? "").localeCompare(right ?? ""),
          ),
        expected,
      );
      for (const grip of grips) {
        if (!("region" in grip.support)) continue;
        const palm: AutoMovieHumanoidRegion =
          grip.part === "leftHand" ? "palmLeft" : "palmRight";
        complaints.check(
          `${label} ${palm} has a positive grip and a release`,
          grip.from < grip.to && grip.to < 1,
        );
        for (const share of [grip.from, (grip.from + grip.to) / 2, grip.to]) {
          const time: number = a.start + share * a.plan.duration;
          const gap: number = Vector3.length(
            Vector3.subtract(
              HumanSignature.region(initiator, palm, time),
              HumanSignature.region(receiver, grip.support.region, time),
            ),
          );
          complaints.check(
            `${label} ${palm} on ${grip.support.region} at ${time.toFixed(3)} s has ${gap.toFixed(4)} m separation`,
            gap <= contactAllowance,
          );
        }
      }

      const mat: IAutoMovieMotionHumanContactWindow[] = b.plan.contacts.filter(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.support.kind === "ground" &&
          (contact.part === "seat" || contact.part === "back"),
      );
      const headAboveHips: number =
        HumanSignature.joint(receiver, b.end, "head").y -
        HumanSignature.joint(receiver, b.end, "hips").y;
      if (scene.outcome === "complete") {
        const seat: IAutoMovieMotionHumanContactWindow | undefined = mat.find(
          (contact: IAutoMovieMotionHumanContactWindow): boolean =>
            contact.part === "seat",
        );
        const back: IAutoMovieMotionHumanContactWindow | undefined = mat.find(
          (contact: IAutoMovieMotionHumanContactWindow): boolean =>
            contact.part === "back",
        );
        complaints.check(
          `${label} receives back support before releasing the seat and retains it to the end`,
          seat !== undefined &&
            back !== undefined &&
            seat.from < back.from &&
            back.from <= seat.to + 1e-9 &&
            Math.abs(back.to - 1) < 1e-9,
        );
        complaints.check(
          `${label} final head-to-hip height ${headAboveHips.toFixed(3)} m reads as lying`,
          Math.abs(headAboveHips) < uprightHeight,
        );
      } else {
        const grip: IAutoMovieMotionHumanContactWindow = grips[0]!;
        const from: number = a.start + grip.from * a.plan.duration;
        const to: number = a.start + grip.to * a.plan.duration;
        const samples: Set<number> = new Set([
          ...HumanSignature.times(a.start, a.end, 30),
          ...a.plan.events.map(
            (event): number => a.start + event.share * a.plan.duration,
          ),
          from,
          (from + to) / 2,
          to,
          a.end,
        ]);
        let closest: number = Infinity;
        let closestTime: number = a.start;
        let forearmClearance: number = Infinity;
        for (const time of samples) {
          const distance: number = HumanSignature.apart(
            initiator,
            receiver,
            time,
          );
          if (distance < closest) {
            closest = distance;
            closestTime = time;
          }
          if (time >= from && time <= to)
            forearmClearance = Math.min(
              forearmClearance,
              HumanColliders.distanceToSegment(
                body,
                HumanSignature.bones(receiver, time),
                HumanSignature.joint(initiator, time, "rightLowerArm"),
                HumanSignature.joint(initiator, time, "rightHand"),
              ).distance,
            );
        }
        complaints.check(
          `${label} inter-performer joint clearance ${closest.toFixed(4)} m at ${closestTime.toFixed(3)} s`,
          closest >= -skinAllowance,
        );
        complaints.check(
          `${label} held forearm-axis clearance ${forearmClearance.toFixed(4)} m`,
          forearmClearance >= 0,
        );
        complaints.check(
          `${label} interruption recovers upright without a mat transfer`,
          mat.length === 0 &&
            headAboveHips > uprightHeight &&
            b.plan.events.some(
              (event): boolean => event.name === "interrupted",
            ) &&
            b.plan.events.some((event): boolean => event.name === "recovered"),
        );
      }
    } catch (error) {
      complaints.check(
        `${label} refused: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  complaints.assert(
    "the paired grappling scenes show held contact and the selected support outcome",
  );
}
