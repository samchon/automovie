import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanPartner,
  HumanPerformance,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A relay baton passes between two runners at speed (`HumanPartner`'s
 * relay rows over two runs): the outgoing hand goes back open, the incoming
 * runner pushes the baton's end into it, and from then on the baton rides
 * the outgoing hand.
 *
 * Two average men jog toward +Z on one line, the outgoing one 0.75 m ahead,
 * so the incoming arm and the baton reach the outgoing hand held back (at
 * 1.0 m the incoming shoulder stood 0.81 m from that palm, beyond an arm and
 * a baton's end); the baton, 0.3 m long, is worn in the incoming runner's right hand
 * from the start (`IHumanProp.worn`), along the thumb's side of the fist.
 * Both state the pass at 2.0 s.
 *
 * Scenarios:
 * 1. Both runs with their passes plan.
 * 2. At 2.0 s the baton's end lies within 40 mm of the outgoing runner's
 *    right palm (provisional: a baton laid into an open hand).
 * 3. At 2.0 s the outgoing right wrist lies at least 0.15 m behind that
 *    runner's hips joint along the run (provisional): the hand is back.
 * 4. From 2.05 s to the film's end, read every quarter of a second, the
 *    baton keeps its frame in the outgoing right hand's frame within 1 mm
 *    (the campaign's grip bound): it has passed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two runs with their overlays through the public chain and reads the displayed baton and hands; a baton that misses the hand, a hand not back, or a baton left with the incoming runner fails.
 * @evidence contracts/development/testing.md#independent-expectations The 1 mm is the campaign's grip bound; the 40 mm and 0.15 m are stated provisional; the instant is the composition's.
 * @evidence contracts/development/testing.md#distinguishing-cases The incoming and outgoing roles of one pass, before and after the instant.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one two-person performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 4 scenarios with their bounds.
 */
export function test_human_motion_partner_relay(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const baton: IHumanProp = {
    subject: "baton",
    frame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {
      end: { point: { x: 0, y: 0.15, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
    },
    // Held across the palm along the thumb's side: the baton's +Y on the
    // hand's +Z, half a hand out along the fingers.
    worn: {
      subject: "in",
      bone: "rightHand",
      offset: {
        position: { x: -0.5 * body.measure.hand, y: -0.03, z: 0 },
        rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
    },
  };
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const at: number = 2;

  // 1. It plans.
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "relay",
      laws: [HumanPartner.relayIncoming, HumanPartner.relayOutgoing],
      props: [baton],
      performers: [
        {
          subject: "in",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "out",
          body,
          at: { x: 0, y: 0, z: 0.75 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("in")
        .run({ to: { x: 0, y: 0, z: 20 }, pace: "jog" })
        .over(
          (o: HumanChain): HumanChain =>
            o.registered("relayIncoming", {
              partner: "out",
              at,
              baton: "baton",
              end: "end",
            }),
        )
        .with(
          HumanChain.subject("out")
            .run({ to: { x: 0, y: 0, z: 20.75 }, pace: "jog" })
            .over(
              (o: HumanChain): HumanChain =>
                o.registered("relayOutgoing", {
                  partner: "in",
                  at,
                  baton: "baton",
                }),
            ),
        ).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a relay pass over two runs plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }

  // 2. The baton's end in the outgoing palm.
  const frame: IHumanProp.IFrame = performance.prop("baton", at);
  const end: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, baton.points.end!.point),
  );
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    performance.bones("out", at),
    "right",
    "palm",
    "flat",
  ).point;
  const off: number = Vector3.length(Vector3.subtract(end, palm));
  if (!(off <= 0.04))
    complaints.push(
      `at the pass the baton's end lies ${mm(off)} mm from the outgoing palm, within 40 mm expected (the incoming shoulder lies ${mm(Vector3.length(Vector3.subtract(performance.bones("in", at).get("rightUpperArm")!.worldPosition, palm)))} mm and its wrist ${mm(Vector3.length(Vector3.subtract(performance.bones("in", at).get("rightHand")!.worldPosition, palm)))} mm from that palm, the baton's end ${mm(Vector3.length(Vector3.subtract(end, performance.bones("in", at).get("rightHand")!.worldPosition)))} mm from the wrist)`,
    );

  // 3. The outgoing hand back.
  const bones: Map<string, IAutoMovieResolvedBone> = performance.bones(
    "out",
    at,
  ) as Map<string, IAutoMovieResolvedBone>;
  const behind: number =
    bones.get("hips")!.worldPosition.z -
    bones.get("rightHand")!.worldPosition.z;
  if (!(behind >= 0.15))
    complaints.push(
      `at the pass the outgoing wrist lies ${mm(behind)} mm behind the hips, at least 150 mm expected`,
    );

  // 4. Passed.
  const seat = (seconds: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = performance
      .bones("out", seconds)
      .get("rightHand")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(
        performance.prop("baton", seconds).position,
        hand.worldPosition,
      ),
    );
  };
  const first: IAutoMovieVector3 = seat(at + 0.05);
  let drift: number = 0;
  for (
    let seconds: number = at + 0.05;
    seconds <= performance.duration;
    seconds += 0.25
  )
    drift = Math.max(
      drift,
      Vector3.length(Vector3.subtract(seat(seconds), first)),
    );
  if (!(drift <= 0.001))
    complaints.push(
      `after the pass the baton moves ${mm(drift)} mm in the outgoing hand's frame, within 1 mm expected`,
    );
  TestValidator.equals("a baton passed at a run", complaints, []);
}
