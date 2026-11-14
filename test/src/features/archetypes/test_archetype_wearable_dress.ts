import { createWearable } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
  dress,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hat and a pair of spectacles taken up from before the body are put on by their own `wear` socket: the hand that holds one carries it until the socket lies on the head's crown or the nose's bridge, and from then the head wears it.
 *
 * Each wearable (`createWearable`) lies at hip height before the right hand: the hat facing the way it will be worn, held by its brim's right side, and the spectacles facing the body, their bridge toward it. The performer takes it up by its `hold` in the right hand and puts it on with `dress`, then stands a second.
 *
 * Scenarios, on the average man and the small woman, for each item:
 * 1. The pick-up and the dressing plan; at the dressing's `stroke` the item's `wear` socket, read from the displayed item through the archetype's own contact, lies within 15 mm (the capture cases' contact bound) of its region on the displayed head.
 * 2. From the stroke to the film's end, read every tenth of a second, the socket keeps its place in the head bone's frame within 1 mm (the campaign's grip bound): the head wears it.
 * 3. Dressing in an item not taken up first is refused on `prop`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the pick-up and the dressing through the public chain with the real wearables and reads the displayed item and head; an item put on beside its place, one left behind as the head moves, or one put on from the table fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The socket is the archetype's own contact and the region the body's own; the bounds are the existing ones.
 * @evidence contracts/development/testing.md#distinguishing-cases A hat on the crown and spectacles on the nose, held and not, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and eight short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_archetype_wearable_dress(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const item of ["hat", "glasses"] as const) {
      const label: string = `${name} ${item}`;
      const model: ReturnType<typeof createWearable> = createWearable({
        kind: item === "hat" ? "hat" : "spectacles",
      });
      const wear: IAutoMovieVector3 = model.affordance("wear").frame.translation;
      const perform = (taken: boolean): HumanPerformance => {
        const start: HumanChain = HumanChain.subject("a").stand({
          seconds: 0.3,
        });
        return new HumanPerformance({
          seed: "dress",
          laws: [],
          props: [
            HumanObject.prop("item", model, {
              at: { x: -0.2, y: body.measure.hipHeight, z: 0.35 },
              yaw: item === "hat" ? 0 : 180,
            }),
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
          composition: (taken
            ? start.pickUp({ prop: "item", handle: "hold", hand: "right" })
            : start
          )
            .dress({ item, prop: "item", hand: "right" })
            .stand({ seconds: 1 }).node,
        });
      };

      // 1. It is put on at its place.
      let film: HumanPerformance;
      try {
        film = perform(true);
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const act: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === "dress")!;
      const stroke: number =
        act.start +
        act.plan.events.find((e): boolean => e.name === "stroke")!.share *
          act.plan.duration;
      const socket = (seconds: number): IAutoMovieVector3 => {
        const frame: IHumanProp.IFrame = film.prop("item", seconds);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, wear),
        );
      };
      const region: IHumanBody["surfaces"]["regions"]["crown"] =
        body.surfaces.regions[dress.WORN[item]];
      const on: number = Vector3.length(
        Vector3.subtract(
          socket(stroke),
          resolveAutoMovieHumanoidSurfaces.place(
            region,
            film.bones("a", stroke).get(region.bone)!,
          ).point,
        ),
      );
      if (!(on <= 0.015))
        complaints.push(
          `${label}: at the stroke the wear socket is ${mm(on)} mm from its region, within 15 mm expected`,
        );

      // 2. The head wears it.
      const local = (seconds: number): IAutoMovieVector3 => {
        const head: IAutoMovieResolvedBone = film
          .bones("a", seconds)
          .get("head")!;
        return Quaternion.rotateVector(
          Quaternion.inverse(head.worldRotation),
          Vector3.subtract(socket(seconds), head.worldPosition),
        );
      };
      const first: IAutoMovieVector3 = local(stroke + 0.01);
      let drift: number = 0;
      for (let s: number = stroke + 0.01; s <= film.duration; s += 0.1)
        drift = Math.max(
          drift,
          Vector3.length(Vector3.subtract(local(s), first)),
        );
      if (!(drift <= 0.001))
        complaints.push(
          `${label}: the worn item moves ${mm(drift)} mm on the head after the stroke, within 1 mm expected`,
        );

      // 3. Not taken up, not put on.
      try {
        perform(false);
        complaints.push(`${label}: an item left lying was put on`);
      } catch (error) {
        if (!(error instanceof HumanRefusal) || error.axis !== "prop")
          complaints.push(
            `${label}: an item not held failed with ${error instanceof Error ? error.message : String(error)}, a refusal on prop expected`,
          );
      }
    }
  }
  TestValidator.equals(
    "a wearable is put on by its own wear socket",
    complaints,
    [],
  );
}
