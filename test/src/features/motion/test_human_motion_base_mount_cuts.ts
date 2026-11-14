import { createSeat } from "@automovie/archetypes";
import {
  HumanChain,
  HumanFrame,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Getting onto a high seat and getting off it can be broken off wherever
 * the sitting actions say they can, and the body ends where the action that
 * took over leaves it: on the floor after a stand or a walk, on the seat
 * after sitting down again.
 *
 * A person changes their mind half way onto a stool, slides off a saddle
 * and walks away, or settles back before leaving the seat. Each is a cut
 * inside a window `sit` or `rise` declares; a cut outside them is refused.
 *
 * Scenarios, the average man on a bar stool read with its bar; the saddle
 * sat astride is `test_human_motion_base_saddle_cuts`'s, on the small woman:
 * 1. `sit` cut by `stand` at 2 % of its length and at its `commit` event,
 *    while both feet are still on the floor: one second later both feet
 *    bear on the floor and the hip joints stand within 20 mm of the quiet
 *    stance's height.
 * 2. `sit` cut by `rise` at `seatContact` and at 95 %: at the end both feet
 *    bear on the floor and the hips are at the quiet stance's height within
 *    20 mm.
 * 3. `rise` cut by `sit` on the same seat at 5 % (before `seatOff`): at the
 *    end the seat region rests within 10 mm of the seat's height.
 * 4. `rise` followed at its `standing` event by a walk of 2 m: the walk
 *    plans and ends with both feet bearing.
 * 5. Refused as cuts `sit` does not declare: a walk at 50 %, and a stand at
 *    50 %, when a foot has left the floor and only getting off brings the
 *    body down.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each cut through the public chain on real bodies and reads the displayed feet, hips and seat region after it; a cut that leaves the body in the air, crouched or beside the seat, or a forbidden cut that is accepted, fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the body ends after each cut is what the action that took over means; the quiet stance is the film's own first posture, the 20 mm on its hip height a provisional reading margin, and the 10 mm the campaign's bound for a held contact. A plan that ignored its entry and replayed from rest would end beside the seat or off the stance height. Limitation: the instants between the cut and the end are the continuity audit's to judge.
 * @evidence contracts/development/testing.md#distinguishing-cases Every cut window `sit` and `rise` declare, each at an event and at a share, and one cut outside the windows.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds eight short performances in memory, reading the first instant and the last of each. One body is enough here because the other build is read on the higher seat by the saddle's test, and the instants are enough because each claim is about where the body ends.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_base_mount_cuts(): void {
  const complaints: string[] = [];
  const where: HumanObject.Placement = { at: { x: 0, y: 0, z: -0.6 }, yaw: 0 };
  const seats: readonly (readonly [string, seated.ISeat])[] = [
    [
      "the bar stool",
      HumanObject.seat(createSeat({ kind: "barStool" }), where),
    ],
  ];
  for (const name of ["m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const [kind, seat] of seats) {
      const astride: boolean = seat.astride === true;
      const off: { to?: "left" } = astride ? { to: "left" } : {};
      const perform = (
        then: (chain: HumanChain) => HumanChain,
      ): HumanPerformance =>
        new HumanPerformance({
          seed: "cuts",
          performers: [
            {
              subject: "a",
              body,
              at: HumanFrame.point(
                { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
                astride ? { x: 0.6, y: 0, z: -0.2 } : { x: 0, y: 0, z: 0.2 },
              ),
              yaw: seat.yaw,
              proficiency: { level: "trained" },
            },
          ],
          composition: then(HumanChain.subject("a").sit({ seat, seconds: 0.5 }))
            .node,
        });
      const check = (
        what: string,
        then: (chain: HumanChain) => HumanChain,
        ends: "standing" | "seated",
      ): void => {
        const label: string = `${name} on ${kind}, ${what}`;
        let performance: HumanPerformance;
        try {
          performance = perform(then);
        } catch (error) {
          complaints.push(
            `${label}: ${error instanceof Error ? error.message : String(error)}`,
          );
          return;
        }
        const reader: HumanSignature.IReader = HumanSignature.of(
          performance,
          "a",
          body,
          seat.yaw,
        );
        const segments: readonly HumanSegment.ISegment[] =
          performance.segments("a");
        const end: number = segments[segments.length - 1]!.end;
        const hips = (t: number): number =>
          (HumanSignature.joint(reader, t, "leftUpperLeg").y +
            HumanSignature.joint(reader, t, "rightUpperLeg").y) /
          2;
        if (ends === "seated") {
          const rests: number = HumanSignature.region(reader, "seat", end).y;
          if (Math.abs(rests - seat.at.y) > 0.01)
            complaints.push(
              `${label}: the seat region ends at ${rests.toFixed(3)} m, within 10 mm of the seat's ${seat.at.y.toFixed(3)} m expected`,
            );
          return;
        }
        for (const side of ["left", "right"] as const)
          if (!HumanSignature.bears(reader, end, side))
            complaints.push(
              `${label}: the ${side} foot does not bear on the floor at the end`,
            );
        if (Math.abs(hips(end) - hips(0)) > 0.02)
          complaints.push(
            `${label}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
          );
      };

      // 1. Thinking better of it, while the feet are still on the floor.
      check(
        "sit cut by stand at 0.02",
        (chain: HumanChain): HumanChain =>
          chain.until({ share: 0.02 }).stand({ seconds: 1 }),
        "standing",
      );
      check(
        "sit cut by stand at commit",
        (chain: HumanChain): HumanChain =>
          chain.until({ event: "commit" }).stand({ seconds: 1 }),
        "standing",
      );

      // 2. Half on, off again.
      check(
        "sit cut by rise at seatContact",
        (chain: HumanChain): HumanChain =>
          chain.until({ event: "seatContact" }).rise(off),
        "standing",
      );
      check(
        "sit cut by rise at 0.95",
        (chain: HumanChain): HumanChain =>
          chain.until({ share: 0.95 }).rise(off),
        "standing",
      );

      // 3. Settling back.
      check(
        "rise cut by sit at 0.05",
        (chain: HumanChain): HumanChain =>
          chain.rise(off).until({ share: 0.05 }).sit({ seat, seconds: 0.5 }),
        "seated",
      );

      // 4. Off and away, to the side the body got off on.
      check(
        "rise cut by walk at standing",
        (chain: HumanChain): HumanChain =>
          chain
            .rise(off)
            .until({ event: "standing" })
            .walk({
              to: HumanFrame.point(
                { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
                astride ? { x: 1, y: 0, z: 2 } : { x: 0, y: 0, z: 2.6 },
              ),
            }),
        "standing",
      );

      // 5. Cuts sit does not declare: a walk, and a stand once a foot is off the floor.
      const forbidden: readonly (readonly [
        string,
        (chain: HumanChain) => HumanChain,
      ])[] = [
        [
          "sit cut by walk at 0.5",
          (chain: HumanChain): HumanChain =>
            chain
              .until({ share: 0.5 })
              .walk({ to: { x: 0, y: 0, z: seat.at.z + 3 } }),
        ],
        [
          "sit cut by stand at 0.5",
          (chain: HumanChain): HumanChain =>
            chain.until({ share: 0.5 }).stand({ seconds: 1 }),
        ],
      ];
      for (const [what, then] of forbidden) {
        let thrown: unknown = null;
        try {
          perform(then);
        } catch (error) {
          thrown = error;
        }
        if (!(thrown instanceof HumanRefusal))
          complaints.push(
            `${name} on ${kind}, ${what}: expected a refusal, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
          );
      }
    }
  }
  TestValidator.equals("getting on and off can be broken off", complaints, []);
}
