import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSittingVolley,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A floor-seated player shifts laterally on the court with a stationary
 * palm, releases it and presents both forearms to a receiving location.
 *
 * Scenarios:
 * 1. The selected palm stays within 15 mm of the floor and within 10 mm
 *    of its original position through the shift. The seat advances the
 *    requested 80 mm within 10 mm while keeping its floor height.
 * 2. Both displayed forearms present a platform near the authored target
 *    after the palm's support ends and before the player recovers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the floor seat, single planted palm, displacement, receiving target and measured bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads achieved palm, seat and forearm geometry during authored contact and release intervals through HumanPerformance.
 * @evidence contracts/development/testing.md#independent-expectations The court plane, authored 80 mm shift and independently placed receive point define expectations. The receiving tolerance is half a hand length for a coarse forearm platform. This fixture does not model the ball.
 * @evidence contracts/development/testing.md#distinguishing-cases A palm travels with the body before and after its plant, stays on the court during the shift, and is released for the two-arm receive.
 * @evidence contracts/development/testing.md#execution-ownership One average Human and a registered floor-seat row with no physics host or display.
 */
export function test_motion_sitting_volley_receive(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const sitting: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
    "receiver",
  )
    .stand({ hold: 0.3 })
    .registered("sitCrossLegged");
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    subject: "receiver",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const prepared: HumanPerformance = new HumanPerformance({
    seed: "court-receive",
    performers: [performer],
    laws: [...HUMAN_LEXICON.pose!],
    composition: sitting.node,
  });
  const position: ReturnType<typeof prepared.bones> = prepared.bones(
    "receiver",
    prepared.duration,
  );
  const shoulders: IAutoMovieVector3 = Vector3.lerp(
    position.get("leftUpperArm")!.worldPosition,
    position.get("rightUpperArm")!.worldPosition,
    0.5,
  );
  const lateral: number = 0.08;
  const target: IAutoMovieVector3 = Vector3.add(shoulders, {
    x: lateral,
    y: -0.19,
    z: 0.32,
  });
  const take: HumanPerformance = new HumanPerformance({
    seed: "court-receive",
    performers: [performer],
    laws: [
      ...HUMAN_LEXICON.pose!,
      AutoMovieMotionHumanSittingVolley.sittingVolley,
    ],
    composition: sitting.registered("sittingVolley", {
      hand: "left",
      lateral,
      duration: 1.3,
      target,
    }).node,
  });
  const action: IAutoMovieMotionHumanSegment = take.segments("receiver")[2]!;
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    take,
    "receiver",
    body,
    0,
  );

  /** Bind a stage event to the placed film clock. */
  const event = (name: string): number => {
    const share: number = action.plan.events.find(
      (candidate): boolean => candidate.name === name,
    )!.share;
    return action.start + share * action.plan.duration;
  };
  /** The flat palm's skin from the displayed, fitted wrist. */
  const palm = (time: number): IAutoMovieVector3 => {
    const wrist: IAutoMovieResolvedBone = take
      .bones("receiver", time)
      .get("leftHand")!;
    return Vector3.add(
      wrist.worldPosition,
      Quaternion.rotateVector(
        wrist.worldRotation,
        HumanHand.offset(body, "left", "palm", "flat").point,
      ),
    );
  };

  const plant: number = event("palmPlant");
  const release: number = event("palmRelease");
  const receive: number = event("receive");
  const pin: IAutoMovieVector3 = palm(plant);
  TestValidator.predicate(
    "flat palm stays planted as the athlete moves the seat",
    nclose(pin.y, 0, 0.015) &&
      [plant, (plant + release) / 2, release].every((time: number): boolean =>
        vclose(palm(time), pin, 0.01),
      ),
  );
  const before: IAutoMovieVector3 = HumanSignature.region(
    reader,
    "seat",
    action.entryTime,
  );
  const shifted: IAutoMovieVector3 = HumanSignature.region(
    reader,
    "seat",
    release,
  );
  TestValidator.predicate(
    "the seated pelvis moves across the court without lifting",
    nclose(shifted.x - before.x, lateral, 0.01) &&
      [plant, (plant + release) / 2, release, receive].every(
        (time: number): boolean =>
          nclose(HumanSignature.region(reader, "seat", time).y, before.y, 0.01),
      ),
  );

  const forearms: IAutoMovieVector3[] = (["left", "right"] as const).map(
    (side): IAutoMovieVector3 =>
      Vector3.lerp(
        HumanSignature.joint(reader, receive, `${side}LowerArm`),
        HumanSignature.joint(reader, receive, `${side}Hand`),
        0.5,
      ),
  );
  TestValidator.predicate(
    "the palm releases and both forearms reach the receive",
    release < receive &&
      palm(receive).y > body.measure.hand &&
      Vector3.distance(Vector3.lerp(forearms[0]!, forearms[1]!, 0.5), target) <
        body.measure.hand * 0.5,
  );
}
