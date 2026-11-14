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
  StrikingRoll,
  dress,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A hat and a pair of spectacles taken up from before the body are put on by their own `wear` socket, on one body: the hand that holds one carries it until the socket lies on the head's crown or the nose's bridge, and from then the head wears it. `test_archetype_wearable_dress_m_average` and its twin read it, one body each.
 *
 * Each wearable (`createWearable`) lies at hip height before the right hand: the hat facing the way it will be worn, held by its brim's right side, and the spectacles facing the body, their bridge toward it. The performer takes it up by its `hold` in the right hand for its use, worn on its region (`HumanGraspUse.IUse`, line `worn`), and puts it on with `dress`, then stands a second.
 *
 * Scenarios, for each item:
 * 1. The pick-up and the dressing plan; at the dressing's `stroke` the item's `wear` socket, read from the displayed item through the archetype's own contact, lies within the held-tool verdict's bound (`StrikingRoll.MISS`, 10 mm: how far a fitted hand may leave a held thing's point of its pose before the pose is refused) of its region on the displayed head.
 * 2. From the stroke on, read halfway to the dressing's `relax`, at `relax`, at the dressing's end and at the film's end (the hand leaving, gone, and the body standing on): a worn thing rides its bone at the offset it took when put on until a grip takes it off (`HumanPerformance`'s prop reading), so its place on the head can change only where a grip or a hold begins or ends, at those events, and the four instants read each span and each such event after the stroke; there the socket keeps the place in the head bone's frame it had just after the stroke within 1 mm (a worn thing's rigid offset, read to the millimetre): the head wears it.
 * 3. Dressing in an item not taken up first is refused on `prop`.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage, the body and the 3 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the pick-up and the dressing through the public chain with the real wearables and reads the displayed item and head against the archetype's own contact and the body's own region.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over two items, one check per scenario, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four films, the worn check read at four instants each: that a worn prop keeps its frame on its bone at every instant between the grips that put it on and take it off is verified over time by its owner's spec, 	est_human_motion_prop_worn (read every quarter of a second through a bone's movement, worn from the start and worn again by a law), so this scenario reads each span after the stroke and each event that could begin a grip; a scene with a grip inside such a span needs that instant read too.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the scenarios exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its checks.
 */
export function archetypeWearableDress(name: motionHumanBody.Name): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  {
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
            ? start.pickUp({
                prop: "item",
                handle: "hold",
                hand: "right",
                use: {
                  tip: "wear",
                  line: "worn",
                  at: { region: dress.WORN[item] },
                  round: item === "hat",
                },
              })
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
      if (!(on <= StrikingRoll.MISS))
        complaints.push(
          `${label}: at the stroke the wear socket is ${mm(on)} mm from its region, within ${mm(StrikingRoll.MISS)} mm expected`,
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
      const relax: number =
        act.start +
        act.plan.events.find((e): boolean => e.name === "relax")!.share *
          act.plan.duration;
      for (const s of [(stroke + relax) / 2, relax, act.end, film.duration])
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
    `a wearable is put on by its own wear socket (${name})`,
    complaints,
    [],
  );
}
