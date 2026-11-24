import { createRelayBaton } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanRelayPass,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHandover,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { HumanPartner } = AutoMovieMotionHumanTouch;

/** The film second both roles state for the pass. */
const AT: number = 2;

/**
 * Pass one baton inside a relay's takeover zone.
 *
 * Scenarios:
 * 1. Two jogging runners pass at 2.0 s with a 30 m takeover zone around
 *    them: the baton's front lies within 40 mm of the outgoing palm and
 *    between the zone's two lines along the lane.
 * 2. The same baton rides the incoming hand within 1 mm until the pass's
 *    reach begins and the outgoing hand within 1 mm from just after it.
 * 3. The same pass with the zone 10 m further down the lane is refused on
 *    `zone`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the zone, the pass, the custody and the refusal with their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes two runs with their pass overlays through the public chain with a real baton and reads the displayed baton and hands.
 * @evidence contracts/development/testing.md#independent-expectations The zone's 30 m is World Athletics TR24.19's, the baton's end is its own affordance, the 1 mm grip and 40 mm palm bounds are the relay handoff witness's.
 * @evidence contracts/development/testing.md#distinguishing-cases A zone that holds the pass beside one that does not.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_ball_sports_relay_zone(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const baton: ReturnType<typeof createRelayBaton> = createRelayBaton({
    length: 0.3,
  });
  const front: IAutoMovieVector3 = baton.affordance("front").frame.translation;
  const zone: IAutoMovieMotionHumanRelayPass.IZone = {
    from: { x: 0, y: 0, z: 1 },
    to: { x: 0, y: 0, z: 31 },
  };
  const film: HumanPerformance = pass(body, baton, zone);
  assertTakeClean("relay zone", film);

  // 1. The pass in the zone.
  const frame: IAutoMovieRigidTransform = film.prop("baton", AT);
  const end: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, front),
  );
  const palm: IAutoMovieVector3 = HumanHand.frame(
    body,
    film.bones("out", AT),
    "right",
    "palm",
    "flat",
  ).point;
  TestValidator.predicate(
    `the baton reaches the outgoing palm inside the zone (${(Vector3.distance(end, palm) * 1000).toFixed(1)} mm at ${end.z.toFixed(2)} m)`,
    Vector3.distance(end, palm) <= 0.04 &&
      end.z >= zone.from.z &&
      end.z <= zone.to.z,
  );

  // 2. One baton, held by one hand then the other.
  const seat: (subject: string, seconds: number) => IAutoMovieVector3 = (
    subject: string,
    seconds: number,
  ): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = film
      .bones(subject, seconds)
      .get("rightHand")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(
        film.prop("baton", seconds).position,
        hand.worldPosition,
      ),
    );
  };
  const drift: (subject: string, from: number, to: number) => number = (
    subject: string,
    from: number,
    to: number,
  ): number => {
    const first: IAutoMovieVector3 = seat(subject, from);
    let most: number = 0;
    for (let t: number = from; t <= to; t += 0.1)
      most = Math.max(most, Vector3.distance(seat(subject, t), first));
    return most;
  };
  TestValidator.predicate(
    "the incoming hand carries the baton until the pass",
    drift("in", 0.1, AT - AutoMovieMotionHumanHandover.relayPass.REACH) <=
      0.001,
  );
  TestValidator.predicate(
    "the outgoing hand carries the same baton after it",
    drift("out", AT + 0.05, film.duration) <= 0.001,
  );

  // 3. A zone the runners have not reached.
  let refused: HumanRefusal | undefined;
  try {
    pass(body, baton, {
      from: { x: 0, y: 0, z: 11 },
      to: { x: 0, y: 0, z: 41 },
    });
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  TestValidator.predicate(
    "a pass outside the takeover zone is refused",
    refused?.axis === "zone",
  );
}

/** Two jogging runners, the incoming one wearing the baton, passing at `AT` within `zone`. */
function pass(
  body: IAutoMovieMotionHumanBody,
  baton: ReturnType<typeof createRelayBaton>,
  zone: IAutoMovieMotionHumanRelayPass.IZone,
): HumanPerformance {
  const ahead: number = 0.75;
  const prop: IAutoMovieMotionHumanProp = {
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
  return new HumanPerformance({
    seed: "relay-zone",
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
        (o: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          o.registered("relayIncoming", {
            partner: "out",
            at: AT,
            baton: "baton",
            end: "front",
            zone,
          }),
      )
      .with(
        HumanChain.subject("out")
          .run({ to: { x: 0, y: 0, z: 20 + ahead }, pace: "jog" })
          .over(
            (o: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              o.registered("relayOutgoing", {
                partner: "in",
                at: AT,
                baton: "baton",
                zone,
              }),
          ),
      ).node,
  });
}
