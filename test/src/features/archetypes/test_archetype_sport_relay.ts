import { createRelayBaton } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPartner,
  HumanPerformance,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A relay baton serves the relay pass: the incoming runner pushes the baton's `front` end into the outgoing runner's palm, and the baton rides the outgoing hand from then on.
 *
 * Two runners of one body jog toward `+Z` on one line, the outgoing one ahead by 0.75 m scaled by the stature against the average man's (the distance at which the average man's incoming arm and a baton's end reach the outgoing hand held back). The baton, fixed at 0.3 m, is worn in the incoming runner's right hand from the start (`IHumanProp.worn`) along the thumb's side of the fist, its middle half a hand out along the fingers; both runners state the pass at 2.0 s.
 *
 * Scenarios, on a pair of average men and a pair of small women:
 * 1. Both runs with their passes plan.
 * 2. At 2.0 s the baton's `front` lies within 40 mm of the outgoing runner's right palm (provisional: a baton laid into an open hand).
 * 3. From 2.05 s to the film's end, read every quarter of a second, the baton keeps its frame in the outgoing right hand's frame within 1 mm (the campaign's grip bound): it has passed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two runs with their overlays through the public chain with the real baton and reads the displayed baton and hands; a baton whose end misses the hand, or one left with the incoming runner, fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The end is the baton's own affordance, carried by the prop's frame; the 1 mm is the campaign's grip bound and the 40 mm is stated provisional; the instant is the composition's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of opposite build, before and after the instant.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two two-person performances; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_archetype_sport_relay(): void {
  const baton: ReturnType<typeof createRelayBaton> = createRelayBaton({
    length: 0.3,
  });
  const front: IAutoMovieVector3 = baton.affordance("front").frame.translation;
  const average: number = motionHumanBody("m-average").measure.stature;
  const at: number = 2;
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const ahead: number = (0.75 * body.measure.stature) / average;
    // The baton's +Y on the hand's +Z, its middle where a 0.3 m baton
    // centred on its origin would lie.
    const prop: IHumanProp = {
      ...HumanObject.prop("baton", baton, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
      worn: {
        subject: "in",
        bone: "rightHand",
        offset: {
          position: { x: -0.5 * body.measure.hand, y: -0.03, z: -0.15 },
          rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
        },
      },
    };

    // 1. It plans.
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "relay",
        laws: [HumanPartner.relayIncoming, HumanPartner.relayOutgoing],
        props: [prop],
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
            at: { x: 0, y: 0, z: ahead },
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
                end: "front",
              }),
          )
          .with(
            HumanChain.subject("out")
              .run({ to: { x: 0, y: 0, z: 20 + ahead }, pace: "jog" })
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
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    // 2. The baton's front in the outgoing palm.
    const frame: IHumanProp.IFrame = performance.prop("baton", at);
    const end: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, front),
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
        `${name}: at the pass the baton's front lies ${mm(off)} mm from the outgoing palm, within 40 mm expected`,
      );

    // 3. Passed.
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
        `${name}: after the pass the baton moves ${mm(drift)} mm in the outgoing hand's frame, within 1 mm expected`,
      );
  }
  TestValidator.equals(
    "a relay baton is passed by its front end",
    complaints,
    [],
  );
}
