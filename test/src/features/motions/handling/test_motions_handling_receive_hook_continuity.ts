import { AutoMovieArchetypeDrinkware } from "@automovie/archetypes";
import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanHandover,
  AutoMovieMotionHumanMutual,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanVerdicts,
} from "@automovie/motions";
import assert from "node:assert/strict";

import people from "../../internal/MOTION_HUMAN_PEOPLE.json";

/**
 * A recipient reaches from a chin rest to a mug's hook grip and carries it into
 * the next action. The same performance with a bottle neck checks the existing
 * grip that fits the thumb as well as the fingers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the recipient's hook closure and carry and a bottle neck grip as the control. Measures the displayed right thumb, the mug's frame and both declared right-hand holds.
 * @evidence contracts/development/testing.md#behavioral-verification Plays pickup, handover and the following stand on stored canonical body parameters. Reads the actual displayed bones and carrier frame around the scheduled grip and observes the complete Motion verdict.
 * @evidence contracts/development/testing.md#independent-expectations At two instants one microsecond apart around the close, neither displayed thumb nor the transferred mug can travel a tenth of a millimetre or turn a tenth of a degree. The mug's thumb holds 25 degrees of distal flexion. The bottle's fitted thumb retains 90 degrees. Both continue into the next action and satisfy the Motion audit.
 */
export function test_motions_handling_receive_hook_continuity(): void {
  const fixture = people["f-average"];
  const canonical = AutoMovieHumanCanonicalBody.prepare(
    fixture.params as IAutoMovieHumanParameters,
    { id: "passage-body", mass: fixture.mass },
  );
  const body = AutoMovieMotionHumanBody.create(
    canonical.skeleton,
    canonical.profile,
  );
  const spacing =
    AutoMovieMotionHumanHandover.handshake.gap(body, body) +
    2 * AutoMovieMotionHumanHandover.handshake.stance(body).sternum;
  const shoulder = body.rest.get("rightUpperArm")!;

  for (const kind of ["mug", "waterBottle"] as const) {
    const archetype = AutoMovieArchetypeDrinkware.create({
      id: kind,
      kind,
      ...(kind === "waterBottle" ? { height: 0.229 } : {}),
    });
    const exchange = AutoMovieMotionHumanChain.mutual(
      AutoMovieMotionHumanMutual.handOver,
      {
        giver: AutoMovieMotionHumanChain.subject("giver")
          .stand({ hold: 0.3, sway: 0 })
          .act("pickUp", { prop: kind, handle: "body", hand: "right" }),
        receiver: AutoMovieMotionHumanChain.subject("receiver").rest({
          right: "chinRest",
          hold: 0.9,
        }),
      },
      {
        prop: kind,
        handle: kind === "mug" ? "handle" : "neck",
        hand: "right",
        receiverHand: "right",
      },
      "offer",
    );
    const performance = new AutoMovieMotionHumanPerformance({
      seed: "ordinary-bottle-passage",
      performers: [
        {
          subject: "giver",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          body,
          proficiency: { level: "trained" },
        },
        {
          subject: "receiver",
          at: { x: 0.16, y: 0, z: spacing },
          yaw: 165,
          body,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        AutoMovieMotionHumanObject.prop(kind, archetype, {
          at: { x: shoulder.x, y: body.measure.hipHeight + 0.12, z: 0.36 },
          yaw: 0,
        }),
      ],
      composition: {
        type: "sequence",
        parts: [
          exchange.node,
          AutoMovieMotionHumanChain.subject("receiver").stand(
            { hold: 0.6, sway: 0 },
            "result",
          ).node,
        ],
      },
    });
    const segments = performance.segments("receiver");
    const receiving = segments.find((part) => part.id === "offer.receiver")!;
    const hold = receiving.plan.holds?.find((item) => item.prop === kind);
    assert.equal(hold?.side, "right", kind + " active hand");
    assert.ok(
      hold?.fingers?.rightThumbMetacarpal !== undefined &&
        hold.fingers.rightThumbProximal !== undefined &&
        hold.fingers.rightThumbDistal !== undefined,
      kind + " stored thumb",
    );
    assert.equal(
      hold?.fingers?.rightThumbDistal?.[0],
      kind === "mug" ? 25 : 90,
      kind + " distal thumb in the grip",
    );
    const grip = receiving.start + hold!.from * receiving.plan.duration;
    const before = grip - 0.0000005;
    const after = grip + 0.0000005;
    const thumbBefore = performance
      .bones("receiver", before)
      .get("rightThumbDistal")!;
    const thumbAfter = performance
      .bones("receiver", after)
      .get("rightThumbDistal")!;
    assert.ok(
      AutoMovieEngineVector3.distance(
        thumbBefore.worldPosition,
        thumbAfter.worldPosition,
      ) < 0.0001 &&
        AutoMovieEngineQuaternion.angle(
          thumbBefore.worldRotation,
          thumbAfter.worldRotation,
        ) <
          Math.PI / 1800,
      kind + " thumb continues through closing",
    );
    if (kind === "mug") {
      const propBefore = performance.prop(kind, before);
      const propAfter = performance.prop(kind, after);
      assert.ok(
        AutoMovieEngineVector3.distance(
          propBefore.position,
          propAfter.position,
        ) < 0.0001 &&
          AutoMovieEngineQuaternion.angle(
            propBefore.rotation,
            propAfter.rotation,
          ) <
            Math.PI / 1800,
        kind + " prop continues through custody",
      );
    }
    const continuation = segments.find((part) => part.id === "result")!;
    const playedThumb = (time: number) =>
      performance
        .pose("receiver", time)
        .joints.find((joint) => joint.bone === "rightThumbDistal");
    assert.deepEqual(
      playedThumb(continuation.entryTime - 0.0000005),
      playedThumb(continuation.entryTime + 0.0000005),
      kind + " thumb continues into stand",
    );
    assert.deepEqual(
      [],
      AutoMovieMotionHumanVerdicts.read(performance, 24).findings,
      kind + " motion findings",
    );
  }
}
