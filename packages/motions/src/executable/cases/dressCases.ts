import {
  Quaternion,
  Transform,
  Vector3,
  quaternionFromAutoMovieBasis,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { AutoMovieMotionHumanAuditSkin } from "../../audit/AutoMovieMotionHumanAuditSkin";
import { dress } from "../../dressing/dress";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanHand } from "../../posture/HumanHand";
import { StrikingRoll } from "../../striking/StrikingRoll";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { everydayVerdicts } from "./everydayVerdicts";

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
          [wearable(item, { x: -0.2, y: who.body.measure.hipHeight, z: 0.35 })],
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
          ? resolveAutoMovieHumanoidSurfaces.place(
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
        const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
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
            Quaternion.rotateVector(frame.rotation, WEAR[item].translation),
          ),
          resolveAutoMovieHumanoidSurfaces.place(
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

/**
 * The wear sockets of the two items, in their own frames, as `createWearable`
 * declares them.
 */
const WEAR: Readonly<
  Record<IAutoMovieMotionHumanDress.Item, IAutoMovieAffordance["frame"]>
> = {
  hat: Transform.of(
    { x: 0, y: 0.11, z: 0 },
    quaternionFromAutoMovieBasis(
      { x: 0, y: 0, z: 1 },
      { x: 0, y: -1, z: 0 },
      { x: 1, y: 0, z: 0 },
    ),
  ),
  glasses: Transform.of(
    { x: 0, y: 0.016, z: -0.002 },
    quaternionFromAutoMovieBasis(
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 1, z: 0 },
    ),
  ),
};

/**
 * An item to put on, shaped as `createWearable` shapes it and lying where the
 * hand takes it: a 0.3 m hat 0.12 m high facing the way it is worn, held at its
 * brim's right side, or 0.14 m spectacles facing the body, held at the bridge,
 * each with its `wear` socket.
 *
 * @param item The item.
 * @param at Where it lies, world metres.
 * @returns The prop.
 */
function wearable(
  item: IAutoMovieMotionHumanDress.Item,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanProp {
  const hat: boolean = item === "hat";
  const hold: IAutoMovieAffordance = {
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: Transform.of(
      hat ? { x: -0.13, y: 0.002, z: 0 } : { x: 0, y: 0.02, z: 0 },
      hat
        ? quaternionFromAutoMovieBasis(
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 1, z: 0 },
            { x: -1, y: 0, z: 0 },
          )
        : quaternionFromAutoMovieBasis(
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: -1, z: 0 },
          ),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.004,
  };
  return {
    subject: "item",
    frame: {
      position: at,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, hat ? 0 : 180),
    },
    points: {},
    shapes: [
      {
        id: "body",
        material: hat ? "felt" : "acetate",
        transform: {
          position: hat ? { x: 0, y: 0.06, z: 0 } : { x: 0, y: 0.02, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        kind: "box",
        halfExtents: hat
          ? { x: 0.15, y: 0.06, z: 0.15 }
          : { x: 0.07, y: 0.02, z: 0.002 },
      },
    ],
    affordances: [
      hold,
      { id: "wear", kind: "socket", frame: WEAR[item], extent: null },
    ],
  };
}
