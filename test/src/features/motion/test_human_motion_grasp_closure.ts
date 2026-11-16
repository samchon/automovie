import { createLongGun, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import {
  HumanChain,
  HumanMusketDrill,
  HumanObject,
  HumanPerformance,
  HumanWeaponPresent,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanProp,
  StrikingHeld,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A grasp's prospective rigid offset is the offset the performance captures
 * when the fingers close, including when another hand already carries it.
 *
 * Scenarios on the average man:
 * 1. A sword picked up for its forearm use has one of the prospective
 *    offsets recorded by the next law, within 1 micrometre and 0.001 degree.
 * 2. A musket taken under the left butt, shouldered and seized by the right
 *    hand has the offset its recover demand weighed, at the same bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both closure modes, the observed frame and numerical bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Records candidate tools through the demands seam, then reads the actual held tool at the following action's entry; a different closure pose cannot match a candidate offset.
 * @evidence contracts/development/testing.md#independent-expectations Prospective and actual readings come from different public lifecycle seams; one micrometre and 0.001 degree are numerical bounds inside the campaign's 1 mm rigid-grip requirement.
 * @evidence contracts/development/testing.md#distinguishing-cases An initially free prop and one already in the other hand, a use and a future action demand.
 * @evidence contracts/development/testing.md#execution-ownership Two short in-memory performances using package exports, with no viewer or external host.
 */
export function test_human_motion_grasp_closure(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  for (const kind of ["sword", "musket"] as const) {
    const prospective: IHumanProp.IFrame[] = [];
    const points: StrikingHeld.IPoints =
      kind === "sword"
        ? { tip: "point", edge: "edge" }
        : { tip: "muzzle", edge: "sight" };
    const law: IHumanActionLaw<{ prop: string }> = {
      name: "inspectClosure",
      interrupts: {},
      demands: (
        ahead: IHumanActionLaw.IAhead<{ prop: string }>,
      ): readonly IHumanActionLaw.IDemand[] => {
        prospective.push(ahead.grip.tool(points).held!.frame);
        return kind === "sword"
          ? []
          : HumanWeaponPresent.present.demands!({
              ...ahead,
              params: { gun: ahead.params.prop, carriage: "recover" },
            });
      },
      plan: (
        context: IHumanActionContext<{ prop: string }>,
      ): IHumanActionPlan => {
        const actual: IHumanProp.IFrame = StrikingHeld.of(
          context,
          "right",
          context.params.prop,
          points,
        ).held!.frame;
        let closest: number = Infinity;
        let position: number = Infinity;
        let angle: number = Infinity;
        for (const candidate of prospective) {
          const distance: number = Vector3.length(
            Vector3.subtract(candidate.position, actual.position),
          );
          const relative: ReturnType<typeof Quaternion.multiply> =
            Quaternion.multiply(
              Quaternion.inverse(candidate.rotation),
              actual.rotation,
            );
          const turn: number =
            (2 * Math.acos(Math.min(1, Math.abs(relative.w))) * 180) / Math.PI;
          const error: number = distance + (turn * Math.PI) / 180;
          if (error < closest) {
            closest = error;
            position = distance;
            angle = turn;
          }
        }
        if (position > 1e-6 || angle > 1e-3)
          complaints.push(
            `${kind}: closure differs from every prospective offset: ${(position * 1000).toFixed(3)} mm, ${angle.toFixed(4)} degrees (${prospective.length} candidates)`,
          );
        return stand.plan({ ...context, params: { seconds: 0.1 } });
      },
    };
    try {
      if (kind === "sword") {
        const sword: ReturnType<typeof createSword> = createSword({
          kind: "armingSword",
        });
        const stature: number = body.measure.stature;
        new HumanPerformance({
          seed: "grasp",
          laws: [law],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: [
            HumanObject.prop("sword", sword, {
              at: { x: -0.1 * stature, y: 0.62 * stature, z: 0.12 * stature },
              yaw: 0,
            }),
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .pickUp({
              prop: "sword",
              handle: "grip",
              use: { tip: "point", line: "forearm" },
            })
            .registered("inspectClosure", { prop: "sword" }).node,
        });
      } else {
        const musket: ReturnType<typeof createLongGun> = createLongGun({
          kind: "musket",
        });
        new HumanPerformance({
          seed: "recover-drill",
          laws: [
            HumanMusketDrill.takeFirelock,
            HumanMusketDrill.shoulderArms,
            HumanMusketDrill.seize,
            law,
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
          props: [
            HumanObject.prop("musket", musket, {
              at: Vector3.subtract(
                {
                  x: body.measure.shoulderHalfWidth,
                  y: body.measure.waistHeight,
                  z: body.measure.forearm,
                },
                musket.affordance("butt").frame.translation,
              ),
              yaw: 0,
            }),
          ],
          composition: HumanChain.subject("a")
            .registered("takeFirelock", { prop: "musket" })
            .registered("shoulderArms", { gun: "musket", seconds: 1 })
            .registered("seize", { prop: "musket" })
            .registered("inspectClosure", { prop: "musket" }).node,
        });
      }
    } catch (error) {
      complaints.push(
        `${kind}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.predicate(complaints.join("\n"), complaints.length === 0);
}
