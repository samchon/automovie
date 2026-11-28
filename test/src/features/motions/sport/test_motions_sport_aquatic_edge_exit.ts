import { AutoMovieArchetypePoolEdge } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
  AutoMovieMotionHumanSwim,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { HumanFoot } from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";
import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A swimmer loads the palms on the named deck before pressing up, lifts the
 * knees over its edge and stands on the deck. Two body sizes perform the exit
 * and refuse a lip higher than they can press over.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the contact, clearance and recovery of the pool exit.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the shipped aquatic law on the same named pool prop for two canonical bodies. Samples their displayed hand, knee, hip and foot positions and checks the native audit.
 * @evidence contracts/development/testing.md#independent-expectations Places the wall at z=0 and deck at y=0.3. Compares displayed samples directly to those surfaces without using planned limb targets. Compares an ordinary pool wall with one that exceeds the reach limit.
 */
export function test_motions_sport_aquatic_edge_exit(): void {
  const height = 0.3;
  const swimmer = "swimmer";
  for (const profile of ["m-average", "f-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);
    const edge = AutoMovieMotionHumanObject.prop(
      "edge",
      AutoMovieArchetypePoolEdge.create({ kind: "deckEdge" }, 1),
      { at: { x: 0, y: height, z: 0 }, yaw: 0, fixed: true },
    );
    const take = (water: number): AutoMovieMotionHumanPerformance =>
      new AutoMovieMotionHumanPerformance({
        seed: "edge-exit",
        laws: [AutoMovieMotionHumanSwim.aquatic],
        props: [edge],
        performers: [
          {
            subject: swimmer,
            body,
            at: { x: 0, y: water - 1.35, z: 0.4 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: AutoMovieMotionHumanChain.subject(swimmer).registered(
          "aquatic",
          {
            kind: "edgeExit",
            water,
            support: "edge",
          },
        ).node,
      });
    const film: AutoMovieMotionHumanPerformance = take(0);
    const segment: IAutoMovieMotionHumanSegment = film.segments(swimmer)[0]!;
    const at = (name: string): number =>
      segment.start +
      segment.plan.duration *
        segment.plan.events.find((event) => event.name === name)!.share;
    const ready = film.bones(swimmer, at("hands"));
    const first = film.bones(swimmer, 0);
    TestValidator.predicate(
      profile + " loads both palms before raising the hips",
      Math.abs(
        ready.get("hips")!.worldPosition.y - first.get("hips")!.worldPosition.y,
      ) < 0.05 &&
        HumanHand.SIDES.every(
          (side) =>
            Math.abs(
              HumanHand.frame(body, ready, side, "palm").point.y - height,
            ) < 0.03,
        ),
    );
    const knee = film.bones(swimmer, at("knee"));
    TestValidator.predicate(
      profile + " brings each knee to the deck before releasing the palms",
      HumanHand.SIDES.every((side) => {
        const placed = knee.get(
          side === "left" ? "leftLowerLeg" : "rightLowerLeg",
        )!.worldPosition;
        return placed.y >= height && placed.z < 0;
      }),
    );
    let penetration = 0;
    for (let i = 0; i <= 40; ++i) {
      const bones = film.bones(swimmer, (film.duration * i) / 40);
      for (const name of [
        "hips",
        "leftLowerLeg",
        "rightLowerLeg",
        "leftFoot",
        "rightFoot",
      ] as const) {
        const p = bones.get(name)!.worldPosition;
        if (p.y < height - 0.02) penetration = Math.max(penetration, -p.z);
      }
    }
    TestValidator.predicate(
      profile + " keeps submerged joints in front of the wall",
      penetration < 0.02,
    );
    const end = film.bones(swimmer, film.duration);
    TestValidator.predicate(
      profile + " stands on the deck",
      end.get("hips")!.worldPosition.z < 0 &&
        HumanHand.SIDES.every(
          (side) =>
            Math.abs(HumanFoot.sockets(body, end, side)[1]!.point.y - height) <
            0.03,
        ),
    );
    assertTakeClean(profile + " pool exit", film);

    let refusal: unknown;
    try {
      take(height - 0.7);
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      profile + " refuses an overhigh deck",
      refusal instanceof AutoMovieMotionHumanRefusal &&
        refusal.axis === "support",
    );
  }
}
