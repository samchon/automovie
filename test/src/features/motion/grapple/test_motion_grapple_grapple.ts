import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  AutoMovieMotionHumanGrapple,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanColliders, HumanFoot } from "@automovie/motions/internal";

import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { motionHumanLaw } from "../../internal/motionHumanLaw";

/**
 * A staged grapple keeps its partner contact and displays the chosen outcome.
 *
 * Scenarios:
 *
 * 1. Complete a planted judo entry under collar-and-sleeve contact, clear the
 *    partner on approach and withdrawal, and roll from seat to back without
 *    lifting the receiver's pelvis and trunk away from the mat.
 * 2. Interrupt a freestyle single-leg entry with leg-level contact, check
 *    clearance and recover upright.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the two authored outcomes and the observed pairing, supports and final orientation.
 * @evidence contracts/development/testing.md#behavioral-verification The public mutual record supplies displayed goal, joint, sole and floor collider readings. A missing grip, interrupted bearing, clearance breach, false descent or unwanted fall fails on a displayed frame or contact event.
 * @evidence contracts/development/testing.md#independent-expectations Region identities come from the scene vocabulary. The repository's 10 mm contact and skin bounds apply to palms, soles and collider gaps. The established grapple capture uses a 5 mm planted-foot slip bound, and the forearm axis stays outside the receiving actor as in test_human_motion_hug. The floor is at zero. A standing head sits above the pelvis by more than 30 percent of stature, as in test_motion_carry_person_coupled_support.
 * @evidence contracts/development/testing.md#distinguishing-cases The judo example holds through the turning entry and rolls with pelvis or trunk bearing. The denied freestyle example has one thigh grip and recovers standing. Both use discrete joint-to-collider queries at 30 Hz and events. The fixture supplies no swept or multi-size evidence.
 * @evidence contracts/development/testing.md#execution-ownership The named in-memory test uses public composition and exact-second pose queries, with no viewer or host dependencies.
 */
export function test_motion_grapple_grapple(): void {
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
    // Each pair uses staggered marks that clear the other performer before
    // acquisition and during transfer as well as at the named grip.
    const singleLeg: boolean = scene.kind === "singleLeg";
    const initiatorZ: number = singleLeg ? -0.21 : -0.27;
    const initiatorYaw: number = singleLeg ? 0 : 8;
    const receiverX: number = singleLeg ? -0.36 : 0.09;
    const receiverZ: number = singleLeg ? 0.66 : 0.27;
    const receiverYaw: number = singleLeg ? 165 : 188;
    try {
      const film: motionHumanLaw.IFilm = motionHumanLaw.film(
        new HumanPerformance({
          seed: `exercise-grapple-${scene.kind}`,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: initiatorZ },
              yaw: initiatorYaw,
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
          laws: [AutoMovieMotionHumanGrapple.grapple],
          composition: HumanChain.mutual(
            AutoMovieMotionHumanCarryPerson.HumanCoupled.grappling,
            {
              initiator: HumanChain.subject("a").stand({
                hold: 0.3,
                sway: 0,
              }),
              receiver: HumanChain.subject("b").stand({
                hold: 0.3,
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

      const initiator: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
        film.performance,
        "a",
        body,
        initiatorYaw,
      );
      const receiver: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
        film.performance,
        "b",
        body,
        receiverYaw,
      );
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
        const entry: number = a.plan.events.find(
          (event) => event.name === "entry",
        )!.share;
        complaints.check(
          `${label} grips remain closed through the paired turn`,
          grips.every((grip) => grip.from < entry && grip.to + 1e-9 >= entry),
        );
        const filmTime = (share: number): number =>
          a.start + share * a.plan.duration;
        const samples: Set<number> = new Set([
          ...HumanSignature.times(a.start, a.end, 30),
          ...[...a.plan.events, ...b.plan.events].map((event) =>
            filmTime(event.share),
          ),
          ...grips.flatMap((grip) => [filmTime(grip.from), filmTime(grip.to)]),
          a.end,
        ]);
        const clearance: number = Math.min(
          ...[...samples].map((time) =>
            HumanSignature.apart(initiator, receiver, time),
          ),
        );
        complaints.check(
          `${label} joint clearance through approach and transfer is ${clearance.toFixed(4)} m`,
          clearance >= -skinAllowance,
        );

        for (const [actor, segment] of [
          [initiator, a],
          [receiver, b],
        ] as const) {
          for (const contact of segment.plan.contacts) {
            if (contact.part !== "leftFoot" && contact.part !== "rightFoot")
              continue;
            const side: "left" | "right" =
              contact.part === "leftFoot" ? "left" : "right";
            const from: number = filmTime(contact.from);
            const to: number = filmTime(contact.to);
            const sole = (time: number): ReturnType<typeof HumanFoot.sockets> =>
              HumanFoot.sockets(body, HumanSignature.bones(actor, time), side);
            const anchor: IAutoMovieVector3 = sole(from)[1]!.point;
            let gap: number = 0;
            let slip: number = 0;
            for (const time of [from, ...samples, to]) {
              if (time < from || time > to) continue;
              const [, ball, toe] = sole(time);
              gap = Math.max(
                gap,
                Math.abs(ball!.point.y),
                Math.abs(toe!.point.y),
              );
              slip = Math.max(
                slip,
                Math.hypot(ball!.point.x - anchor.x, ball!.point.z - anchor.z),
              );
            }
            complaints.check(
              `${label} ${segment === a ? "initiator" : "receiver"} ${side} sole gap ${gap.toFixed(4)} m and slip ${slip.toFixed(4)} m`,
              gap <= contactAllowance && slip <= 0.005,
            );
          }
        }

        if (seat !== undefined && back !== undefined) {
          const supportHeight: ReturnType<typeof HumanColliders.prepareMinima> =
            HumanColliders.prepareMinima(body, [
              new Set<AutoMovieHumanoidBone>(["hips", "spine", "chest"]),
            ]);
          const from: number = filmTime(seat.from);
          const to: number = filmTime(back.from);
          const gap: number = Math.max(
            ...[from, ...samples, to]
              .filter((time: number): boolean => time >= from && time <= to)
              .map((time: number): number =>
                Math.abs(
                  supportHeight(HumanSignature.bones(receiver, time))[0]!,
                ),
              ),
          );
          complaints.check(
            `${label} receiver's pelvis or trunk stays on the mat within ${gap.toFixed(4)} m through the roll`,
            gap <= contactAllowance,
          );
        }
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
