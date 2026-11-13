import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanFloorFall,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A goalkeeper's dive and a sliding tackle (`HumanFloorFall`): falls onto
 * the floor on purpose, the dive with one airborne part turning about the
 * body's forward axis only, the slide never leaving the floor.
 *
 * Scenarios, on the small woman and the average man, each row after a
 * 0.3 s stand:
 * 1. The three rows plan.
 * 2. A dive to the left and to the right carries the hips at least 0.6 m to
 *    its side (provisional) and lands with the head toward that side.
 * 3. In a dive, at the middle of the flight both ankles lie at least 50 mm
 *    above where they stood (provisional): it is airborne.
 * 4. In a dive, through the flight the chest's forward axis stays within
 *    20 degrees of where it pointed at take-off (provisional): the body
 *    turns about that one axis.
 * 5. A slide carries the hips at least 0.6 m forward (provisional).
 * 6. Landed, for every row, the hips joint lies within 0.4 m of the floor
 *    and the lowest joint centre within 0.15 m of it (provisional), and the
 *    seat's contact window with the ground is declared from there.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each row through the public chain and reads displayed joints and the plan's contact windows; a dive that never leaves the floor, tumbles, falls the wrong way, or a slide that stays standing fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are stated provisional and name what each fall is; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides of the dive and the slide on two statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds six short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 6 scenarios with their bounds.
 */
export function test_human_motion_floor_fall(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const [row, toward] of [
      ["goalkeeperDiveLeft", 1],
      ["goalkeeperDiveRight", -1],
      ["slidingTackle", 0],
    ] as const) {
      const label: string = `${name} ${row}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "fall",
          laws: [
            HumanFloorFall.goalkeeperDiveLeft,
            HumanFloorFall.goalkeeperDiveRight,
            HumanFloorFall.slidingTackle,
          ],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(row, {}).node,
        });
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      const at = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );
      const joint = (
        bone: "hips" | "head" | "leftFoot" | "rightFoot",
        seconds: number,
      ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);
      const end: number = placed.end;
      if (toward !== 0) {
        // 2. To its side, the head toward it (the left is +X).
        const moved: number =
          toward * (joint("hips", end).x - joint("hips", placed.start).x);
        if (!(moved >= 0.6))
          complaints.push(
            `${label}: the hips travel ${mm(moved)} mm to the side, at least 600 mm expected`,
          );
        if (!(toward * (joint("head", end).x - joint("hips", end).x) > 0))
          complaints.push(
            `${label}: landed, the head is not toward the dive's side`,
          );

        // 3. Airborne.
        const middle: number = (at("takeOff") + at("landed")) / 2;
        for (const bone of ["leftFoot", "rightFoot"] as const) {
          const rise: number =
            joint(bone, middle).y - joint(bone, placed.start).y;
          if (!(rise >= 0.05))
            complaints.push(
              `${label}: at the flight's middle the ${bone} joint is ${mm(rise)} mm above where it stood, at least 50 mm expected`,
            );
        }

        // 4. One axis.
        const facing = (seconds: number): IAutoMovieVector3 => {
          const chest = performance.bones("a", seconds).get("chest")!;
          const q = chest.worldRotation;
          // The chest's +Z turned into the world.
          const x: number = 2 * (q.x * q.z + q.w * q.y);
          const y: number = 2 * (q.y * q.z - q.w * q.x);
          const z: number = 1 - 2 * (q.x * q.x + q.y * q.y);
          return { x, y, z };
        };
        const first: IAutoMovieVector3 = facing(at("takeOff"));
        let worst: number = 0;
        for (
          let seconds: number = at("takeOff");
          seconds <= at("landed");
          seconds += 1 / 24
        ) {
          const here: IAutoMovieVector3 = facing(seconds);
          worst = Math.max(
            worst,
            (Math.acos(
              Math.max(
                -1,
                Math.min(
                  1,
                  here.x * first.x + here.y * first.y + here.z * first.z,
                ),
              ),
            ) *
              180) /
              Math.PI,
          );
        }
        if (!(worst <= 20))
          complaints.push(
            `${label}: the chest's forward axis turns ${worst.toFixed(1)} degrees in the flight, within 20 expected`,
          );
      } else {
        // 5. Forward.
        const moved: number =
          joint("hips", end).z - joint("hips", placed.start).z;
        if (!(moved >= 0.6))
          complaints.push(
            `${label}: the hips travel ${mm(moved)} mm forward, at least 600 mm expected`,
          );
      }

      // 6. On the floor.
      const lowest: number = Math.min(
        ...[...performance.bones("a", end).values()].map(
          (b): number => b.worldPosition.y,
        ),
      );
      if (!(joint("hips", end).y <= 0.4))
        complaints.push(
          `${label}: landed, the hips joint is ${mm(joint("hips", end).y)} mm above the floor, within 400 mm expected (the lowest joint ${[...performance.bones("a", end).entries()].reduce((a, b) => (b[1].worldPosition.y < a[1].worldPosition.y ? b : a))[0]}; hips to head ${mm(joint("head", end).x - joint("hips", end).x)} mm across, ${mm(joint("head", end).y - joint("hips", end).y)} mm up, ${mm(joint("head", end).z - joint("hips", end).z)} mm ahead)`,
        );
      if (!(lowest <= 0.15))
        complaints.push(
          `${label}: landed, the lowest joint centre is ${mm(lowest)} mm above the floor, within 150 mm expected`,
        );
      if (
        !placed.plan.contacts.some(
          (c: IHumanContactWindow): boolean =>
            c.part === "seat" && c.support.kind === "ground" && c.to >= 1,
        )
      )
        complaints.push(
          `${label}: no seat contact with the ground is declared to the end`,
        );
    }
  }
  TestValidator.equals("a dive and a slide onto the floor", complaints, []);
}
