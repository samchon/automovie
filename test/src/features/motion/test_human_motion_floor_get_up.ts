import { type IAutoMovieResolvedBone, physicalShapeBounds } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Getting up from the floor (`getUp`) brings the body from lying on the
 * back, lying on the front or the hands and knees to standing on its feet,
 * continuously and on the floor, and the act after it is entered standing.
 *
 * Standing is read as the hips joint at the height a quiet stance puts it
 * (`stand.posture`), within 20 mm (provisional: the stance's own knee
 * give), with both feet's lowest collider points within the verdicts' skin
 * depth of the floor. Continuity is the verdicts' speed limit for any human
 * joint centre, 30 m/s, read every 120th of a second from 0.1 s before the
 * rise to its end; the floor is the floor audit's 5 mm, read on the
 * colliders at the same instants of the rise once its entering transition
 * has decayed, since that transition carries the act before's own pose (a
 * crawl's tucked toes sink about 14 mm, a fault of the crawl).
 *
 * Scenarios, on the smallest and the largest body of the sweep (`f-small`
 * and `m-large`):
 * 1. A lie down on the back, then the symmetric rise (VanSant 1988's most
 *    common adult pattern): it stands at the end, continuously and on the
 *    floor.
 * 2. The same with the rotation pattern, rolling over to the hands and
 *    knees: the same bounds.
 * 3. A lie down on the front, then a rise: the same bounds.
 * 4. A crawl, then a rise from the hands and knees: the same bounds.
 * 5. A knockdown, a rise and a crawl, as a fall and a crawl away are
 *    written: the three plan.
 * 6. A rise from standing is refused as a `base` refusal on the `base`
 *    axis.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each chain through the public chain and reads displayed bones and colliders; a rise that ends off its feet, jumps, sinks into the floor, or accepts a standing body fails with the case and its numbers.
 * @evidence contracts/development/testing.md#independent-expectations Standing is the stance owner's own hips height; the speed, floor and skin bounds are the verdicts' for any human motion; the 20 mm give is marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Both lying bases, both patterns, the hands and knees, the chain after a knockdown and a refused base, on two extreme bodies; the floor laws' own entries are `test_human_motion_floor_entry_base`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds twelve short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how standing, continuity and the floor are read with their bounds, and the 6 scenarios.
 */
export function test_human_motion_floor_get_up(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const STEP: number = 1 / 120;
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stood: number = poseBones(
      body,
      resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
    ).get("hips")!.worldPosition.y;
    const perform = (composition: {
      node: HumanPerformance.IInput["composition"];
    }): HumanPerformance =>
      new HumanPerformance({
        seed: "get-up",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: composition.node,
      });
    const lowest = (bones: Bones, of: RegExp): number => {
      let low: number = Infinity;
      for (const { bone, pose, shapes } of HumanColliders.placed(body, bones))
        if (of.test(bone))
          for (const shape of shapes)
            low = Math.min(low, physicalShapeBounds(pose, shape).min.y);
      return low;
    };

    // 1 to 4. A rise read through.
    const rise = (
      label: string,
      composition: { node: HumanPerformance.IInput["composition"] },
    ): void => {
      let performance: HumanPerformance;
      try {
        performance = perform(composition);
      } catch (error) {
        all.check(
          `${name} ${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
        return;
      }
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      let fastest: { speed: number; bone: string; seconds: number } = {
        speed: 0,
        bone: "none",
        seconds: 0,
      };
      let deepest: { depth: number; seconds: number } = {
        depth: 0,
        seconds: 0,
      };
      let before: Bones = performance.bones("a", placed.entryTime - 0.1);
      for (
        let seconds: number = placed.entryTime - 0.1 + STEP;
        seconds <= placed.end + 1e-9;
        seconds += STEP
      ) {
        const now: Bones = performance.bones("a", seconds);
        for (const [bone, b] of now) {
          const a: IAutoMovieResolvedBone = before.get(bone)!;
          const speed: number =
            Math.hypot(
              b.worldPosition.x - a.worldPosition.x,
              b.worldPosition.y - a.worldPosition.y,
              b.worldPosition.z - a.worldPosition.z,
            ) / STEP;
          if (speed > fastest.speed) fastest = { speed, bone, seconds };
        }
        // The floor is read on the rise's own posture, once the entering
        // transition has carried off the act before's offset.
        const depth: number =
          seconds >= placed.entryTime + (placed.transition?.blend ?? 0)
            ? -lowest(now, /./)
            : 0;
        if (depth > deepest.depth) deepest = { depth, seconds };
        before = now;
      }
      all.check(
        `${name} ${label}: the fastest joint centre is the ${fastest.bone} at ${fastest.speed.toFixed(1)} m/s at ${fastest.seconds.toFixed(3)} s, below 30 expected`,
        fastest.speed <= 30,
      );
      all.check(
        `${name} ${label}: the body sinks ${(deepest.depth * 1000).toFixed(1)} mm under the floor at ${deepest.seconds.toFixed(2)} s, within 5 expected`,
        deepest.depth <= 0.005,
      );
      const end: Bones = performance.bones("a", placed.end);
      const hips: number = end.get("hips")!.worldPosition.y;
      const feet: number = Math.max(
        lowest(end, /^left(Foot|Toes)$/),
        lowest(end, /^right(Foot|Toes)$/),
      );
      all.check(
        `${name} ${label}: at the end the hips joint is ${(hips * 1000).toFixed(0)} mm high, the stance's ${(stood * 1000).toFixed(0)} within 20 expected, and the higher foot ${(feet * 1000).toFixed(1)} mm off the floor, within 10 expected`,
        Math.abs(hips - stood) <= 0.02 && feet <= 0.01,
      );
    };
    rise(
      "lying on the back, the symmetric rise",
      HumanChain.subject("a")
        .lieDown({ position: "supine", hold: 0.3 })
        .getUp(),
    );
    rise(
      "lying on the back, the rotation",
      HumanChain.subject("a")
        .lieDown({ position: "supine", hold: 0.3 })
        .getUp({ pattern: "rotation" }),
    );
    rise(
      "lying on the front",
      HumanChain.subject("a").lieDown({ position: "prone", hold: 0.3 }).getUp(),
    );
    rise(
      "on the hands and knees",
      HumanChain.subject("a").crawl({ cycles: 1 }).getUp(),
    );

    // 5. A fall, a rise and a crawl away.
    try {
      perform(
        HumanChain.subject("a")
          .knockdown({ seconds: 0.5 })
          .getUp()
          .crawl({ cycles: 1 }),
      );
    } catch (error) {
      all.check(
        `${name} knockdown, getUp, crawl: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }

    // 6. Not from standing.
    let refused: unknown;
    try {
      perform(HumanChain.subject("a").stand({ seconds: 0.3 }).getUp());
    } catch (error) {
      refused = error;
    }
    all.check(
      `${name} stand then getUp: refused on the base, got ${refused instanceof HumanRefusal ? `${refused.kind} on ${refused.axis}` : String(refused)}`,
      refused instanceof HumanRefusal &&
        refused.kind === "base" &&
        refused.axis === "base",
    );
  }
  all.assert("getting up from the floor ends standing on the feet");
}
