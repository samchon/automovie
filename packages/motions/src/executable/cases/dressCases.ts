import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../chain/HumanChain";
import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { dress } from "../../dressing/internal/dress";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { dressCaseWearable } from "./internal/dressCaseWearable";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/**
 * Capture cases of the dressing family, from quiet standing, the item first
 * taken up by its `hold` in the right hand from before the body, for its use:
 * worn on its region (`HumanGraspUse.IUse`, line `worn`): `dress-hat` (the hat
 * carried onto the crown, the left palm on the head's surface at the brim's
 * front quarter) and `dress-glasses` (the glasses carried onto the nose's
 * bridge, the left index fingertip at the ear).
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot.
 * Beyond that: at `stroke` the item's `wear` socket within the held-tool bound
 * (`StrikingRoll.MISS`) of its region on the displayed head, and the left
 * hand's surface within the skin's give a hand resting on the body is allowed
 * (`AutoMovieMotionHumanAuditSkin.BUILT`) of its place there; no hand surface
 * inside the head or neck colliders by more than 10 mm through the action
 * (decision 11's penetration bound); and each upper arm's displayed elevation,
 * its angle from the chest's downward axis, at most 121 degrees, the smaller of
 * the functional ranges of daily tasks (flexion 121, abduction 128, Namdari et
 * al. 2012, the issue's ADL ranges). The elevation is read on the displayed
 * bones, since a joint's clinical flexion and abduction channels alias each
 * other once the arm is raised past the horizontal and turned.
 *
 * @param bodies The sweep bodies; `m-average` when absent.
 * @returns The cases.
 */
export function dressCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const who: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    const r: number = who.body.measure.headRadius;
    for (const item of ["hat", "glasses"] as const) {
      const performance: IAutoMovieMotionHumanPerformance =
        FamilyCaseKit.perform(
          "dress",
          [{ subject: "a", body: who.body }],
          HumanChain.subject("a")
            .pickUp({
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
            .act("dress", { item, prop: "item", hand: "right" }).node,
          [
            dressCaseWearable(item, {
              x: -0.2,
              y: who.body.measure.hipHeight,
              z: 0.35,
            }),
          ],
        );
      const act: IAutoMovieMotionHumanSegment = performance
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "dress",
        )!;
      const stroke: number =
        act.start +
        act.plan.events.find((e): boolean => e.name === "stroke")!.share *
          act.plan.duration;
      const surface = (
        bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        side: AutoMovieHumanSide,
      ): IAutoMovieVector3 =>
        item === "hat"
          ? AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
              who.body.surfaces.sockets[
                side === "left" ? "palmLeft" : "palmRight"
              ],
              bones.get(`${side}Hand`)!,
            ).point
          : HumanHand.frame(who.body, bones, side, "indexTip", "point").point;
      const want = (
        bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        side: AutoMovieHumanSide,
      ): IAutoMovieVector3 => {
        const region =
          item === "hat" ? "crown" : side === "left" ? "earLeft" : "earRight";
        const frame = who.body.surfaces.regions[region];
        const at: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          frame,
          bones.get(frame.bone)!,
        ).point;
        if (item !== "hat") return at;
        // The head's displayed surface along the brim's direction.
        const direction: IAutoMovieVector3 = Vector3.normalize({
          x: (side === "left" ? 1 : -1) * dress.HAT.out,
          y: 0,
          z: dress.HAT.ahead,
        });
        return HumanColliders.cast(
          who.body,
          new Map([...bones].filter(([b]) => b === "head" || b === "neck")),
          Vector3.add(
            { ...at, y: at.y - dress.HAT.down * r },
            Vector3.scale(direction, 4 * r),
          ),
          Vector3.scale(direction, -1),
          8 * r,
        )!.point;
      };
      const bones = performance.bones("a", stroke);
      const region = who.body.surfaces.regions[dress.WORN[item]];
      const frame: IAutoMovieRigidTransform = performance.prop("item", stroke);
      const steadied: number = Vector3.length(
        Vector3.subtract(surface(bones, "left"), want(bones, "left")),
      );
      const placed: number = Vector3.length(
        Vector3.subtract(
          Vector3.add(
            frame.position,
            Quaternion.rotateVector(
              frame.rotation,
              dressCaseWearable.WEAR[item].translation,
            ),
          ),
          AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
            region,
            bones.get(region.bone)!,
          ).point,
        ),
      );
      let inside: number = Infinity;
      let elevation: number = 0;
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24) {
        const all = performance.bones("a", t);
        const head: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          new Map([...all].filter(([b]) => b === "head" || b === "neck"));
        for (const side of ["left", "right"] as const) {
          inside = Math.min(
            inside,
            HumanColliders.distance(who.body, head, surface(all, side))
              .distance,
          );
          const along: IAutoMovieVector3 = Vector3.normalize(
            Vector3.subtract(
              all.get(`${side}LowerArm`)!.worldPosition,
              all.get(`${side}UpperArm`)!.worldPosition,
            ),
          );
          const down: IAutoMovieVector3 = Quaternion.rotateVector(
            all.get("chest")!.worldRotation,
            { x: 0, y: -1, z: 0 },
          );
          elevation = Math.max(
            elevation,
            (Math.acos(Math.min(1, Math.max(-1, Vector3.dot(along, down)))) *
              180) /
              Math.PI,
          );
        }
      }
      out.push({
        name: `dress-${item}${suffix}`,
        times: FamilyCaseKit.times(performance, 0.15, [[stroke, "on"]]),
        performers: [FamilyCaseKit.figure(performance, who.man)],
        verdicts: [
          ...everydayVerdicts.standard(performance, "a", who.body),
          everydayVerdicts.within(
            "item's wear socket on its region",
            placed,
            StrikingRoll.MISS,
            "mm",
          ),
          everydayVerdicts.within(
            "free hand on its place on the head",
            steadied,
            AutoMovieMotionHumanAuditSkin.BUILT,
            "mm",
          ),
          everydayVerdicts.within(
            "hand inside the head or neck",
            Math.max(0, -inside),
            0.01,
            "mm",
          ),
          everydayVerdicts.within(
            "shoulder elevation within daily range",
            elevation,
            121,
            "deg",
          ),
        ],
      });
    }
  }
  return out;
}
