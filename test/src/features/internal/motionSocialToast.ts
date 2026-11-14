import { createDrinkware } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSocial,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * One cast of the toast, which the `test_human_motion_social_toast_*` specs
 * read one cast each: two people of different height clink glasses, each an
 * archetype held by the hand that picked it up (#3350, #3358).
 *
 * The host (a) and the guest (b) face each other 0.8 m apart. Each glass
 * starts at its taker's waist height before the right shoulder, 0.6 of the
 * arm ahead.
 *
 * Scenarios, at the clink (`HumanChain.mutual(HumanSocial.toast, ...)`):
 * 1. Both roles' `meet` is one film second within a 24 Hz frame.
 * 2. The two rims lie within 15 mm of each other (#3350: shared contacts
 *    within 15 mm at their decisive instants).
 * 3. Both glasses stand within 10 degrees of upright (#3361).
 * 4. The rims meet between the lower chest height and the higher shoulder
 *    height of the two (#3350, provisional there).
 * 5. Each glass has kept its place in its hand within 1 mm since its grip
 *    (the campaign's grip bound), read every quarter of a second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cast, the placement and the 5 scenarios with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Places real archetypes, joins the cast through the public mutual join and reads displayed prop frames and hands.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance and five readings, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cast that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms One two-person performance per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each cast's spec, so the readings exist once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The performance lives as long as the call.
 */
export namespace motionSocialToast {
  /**
   * Perform one cast and assert its five scenarios.
   *
   * @param first The host's body.
   * @param second The guest's body.
   */
  export function check(
    first: motionHumanBody.Name,
    second: motionHumanBody.Name,
  ): void {
    const complaints: string[] = [];
    const glass: ReturnType<typeof createDrinkware> = createDrinkware({
      kind: "glass",
    });
    const mm = (metres: number): string => (metres * 1000).toFixed(1);
    const apart: number = 0.8;
    {
      const bodies: Record<"a" | "b", IHumanBody> = {
        a: motionHumanBody(first),
        b: motionHumanBody(second),
      };
      const label: string = `${first} with ${second}`;

      // Before a performer's right shoulder; b faces a, so b's right is +X.
      const before = (who: "a" | "b"): HumanObject.Placement => {
        const m: IHumanBody["measure"] = bodies[who].measure;
        const ahead: number = 0.6 * (m.upperArm + m.forearm);
        return {
          at: {
            x: who === "a" ? -m.shoulderHalfWidth : m.shoulderHalfWidth,
            y: m.waistHeight,
            z: who === "a" ? ahead : apart - ahead,
          },
          yaw: who === "a" ? 0 : 180,
        };
      };
      const perform = (
        props: IHumanProp[],
        composition: { node: HumanPerformance.IInput["composition"] },
      ): HumanPerformance =>
        new HumanPerformance({
          seed: "social",
          laws: [HumanSocial.fistBump],
          props,
          performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
            subject,
            body: bodies[subject],
            at: { x: 0, y: 0, z: subject === "a" ? 0 : apart },
            yaw: subject === "a" ? 0 : 180,
            proficiency: { level: "trained" as const },
          })),
          composition: composition.node,
        });
      const instant = (segment: HumanSegment.ISegment, event: string): number =>
        segment.start +
        (segment.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          segment.plan.duration;
      const axis = (
        performance: HumanPerformance,
        prop: string,
        seconds: number,
      ): IAutoMovieVector3 =>
        Quaternion.rotateVector(performance.prop(prop, seconds).rotation, {
          x: 0,
          y: 1,
          z: 0,
        });

      // How far a prop moves in a right hand's frame between two seconds.
      const drift = (
        performance: HumanPerformance,
        who: string,
        prop: string,
        from: number,
        to: number,
      ): number => {
        const seat = (seconds: number): IAutoMovieVector3 => {
          const hand: IAutoMovieResolvedBone = performance
            .bones(who, seconds)
            .get("rightHand")!;
          return Quaternion.rotateVector(
            Quaternion.inverse(hand.worldRotation),
            Vector3.subtract(
              performance.prop(prop, seconds).position,
              hand.worldPosition,
            ),
          );
        };
        const start: IAutoMovieVector3 = seat(from);
        let worst: number = 0;
        for (let seconds: number = from; seconds <= to; seconds += 0.25)
          worst = Math.max(
            worst,
            Vector3.length(Vector3.subtract(seat(seconds), start)),
          );
        return Math.max(
          worst,
          Vector3.length(Vector3.subtract(seat(to), start)),
        );
      };

      // The glasses meet rim to rim.
      try {
        const toast: HumanPerformance = perform(
          [
            HumanObject.prop("glassA", glass, before("a")),
            HumanObject.prop("glassB", glass, before("b")),
          ],
          HumanChain.mutual(
            HumanSocial.toast,
            {
              host: HumanChain.subject("a").pickUp({
                prop: "glassA",
                handle: "body",
                use: { tip: "lip", line: "square" },
              }),
              guest: HumanChain.subject("b").pickUp({
                prop: "glassB",
                handle: "body",
                use: { tip: "lip", line: "square" },
              }),
            },
            { glasses: { host: "glassA", guest: "glassB" } },
          ),
        );
        const meets: number[] = (["a", "b"] as const).map(
          (who: "a" | "b"): number => instant(toast.segments(who)[1]!, "meet"),
        );
        if (!(Math.abs(meets[0]! - meets[1]!) <= 1 / 24))
          complaints.push(
            `${label}: the two roles meet at ${meets[0]!.toFixed(3)} and ${meets[1]!.toFixed(3)} s, one 24 Hz frame apart at most expected`,
          );
        const meet: number = meets[0]!;
        const lip: IAutoMovieVector3 =
          glass.affordance("lip").frame.translation;
        const radius: number = Math.hypot(lip.x, lip.z);
        const centre = (prop: string): IAutoMovieVector3 => {
          const frame: IHumanProp.IFrame = toast.prop(prop, meet);
          return Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, { x: 0, y: lip.y, z: 0 }),
          );
        };

        // The least distance between the two rims: points of A's rim against
        // B's rim circle.
        const up: IAutoMovieVector3 = axis(toast, "glassA", meet);
        const side: IAutoMovieVector3 = Vector3.normalize(
          Vector3.cross(up, { x: 0.3, y: 0.1, z: 0.9 }),
        );
        const other: IAutoMovieVector3 = Vector3.cross(up, side);
        const theirs: IAutoMovieVector3 = axis(toast, "glassB", meet);
        let rims: number = Infinity;
        for (let i: number = 0; i < 360; i++) {
          const angle: number = (i * Math.PI) / 180;
          const point: IAutoMovieVector3 = Vector3.subtract(
            Vector3.add(
              centre("glassA"),
              Vector3.add(
                Vector3.scale(side, radius * Math.cos(angle)),
                Vector3.scale(other, radius * Math.sin(angle)),
              ),
            ),
            centre("glassB"),
          );
          const along: number = Vector3.dot(point, theirs);
          const across: number = Vector3.length(
            Vector3.subtract(point, Vector3.scale(theirs, along)),
          );
          rims = Math.min(rims, Math.hypot(across - radius, along));
        }
        if (!(rims <= 0.015))
          complaints.push(
            `${label}: the two rims are ${mm(rims)} mm apart at the clink, within 15 mm expected`,
          );
        for (const [who, prop] of [
          ["a", "glassA"],
          ["b", "glassB"],
        ] as const) {
          const moved: number = drift(
            toast,
            who,
            prop,
            instant(toast.segments(who)[0]!, "gripClosed") + 1e-3,
            toast.duration,
          );
          if (!(moved <= 0.001))
            complaints.push(
              `${label}: ${who}'s glass moves ${mm(moved)} mm in the hand's frame, within 1 mm expected`,
            );
        }
        for (const prop of ["glassA", "glassB"] as const) {
          const tipped: number =
            (Math.acos(Math.min(1, axis(toast, prop, meet).y)) * 180) / Math.PI;
          if (!(tipped <= 10))
            complaints.push(
              `${label}: ${prop} tilts ${tipped.toFixed(1)} degrees at the clink, within 10 expected`,
            );
        }
        const height: number = (centre("glassA").y + centre("glassB").y) / 2;
        const low: number = Math.min(
          bodies.a.measure.chestHeight,
          bodies.b.measure.chestHeight,
        );
        const high: number = Math.max(
          bodies.a.measure.shoulderHeight,
          bodies.b.measure.shoulderHeight,
        );
        if (!(height >= low && height <= high))
          complaints.push(
            `${label}: the rims meet ${height.toFixed(3)} m above the floor, between ${low.toFixed(3)} and ${high.toFixed(3)} m expected`,
          );
      } catch (error) {
        complaints.push(
          `${label}: the toast: expected to plan, got ${(error as Error).message}`,
        );
      }
    }
    TestValidator.equals(
      `glasses clinked between two heights (${first} with ${second})`,
      complaints,
      [],
    );
  }
}
