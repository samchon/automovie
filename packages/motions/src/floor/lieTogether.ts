import {
  Vector3,
  minimumJerk,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarryHumanPosture,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLieTogether,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { lieTogetherCurl } from "./lieTogetherCurl";

/** How far off the partner's skin the resting region lies, metres (provisional: a skin contact). */
const REST: number = 0.005;

/** The miss under which the cheek rests on the chest, metres (provisional: a skin contact, as `headRest`'s). */
const NEAR: number = 0.01;

/** The two bones of a folding arm. */
type ArmBone = "upper" | "lower";

/** The lower arm's fold as the body settles, clinical degrees: the upper arm forward and the elbow bent, the hand up before the face, so the arm a body lies on stays out of the partner (provisional). */
const FOLD: Readonly<Record<ArmBone, readonly [number, number, number]>> = {
  upper: [90, 0, 0],
  lower: [140, 0, 0],
};

/** The lower arm's fold when spooning, clinical degrees: the upper arm raised along the floor above the head and the elbow bent back, the forearm under the head as its pillow, so the arm a spooning body lies on stays behind its own head instead of reaching into the partner it lies behind (the forward fold met the partner's chest 42 mm deep; provisional). */
const PILLOW: Readonly<Record<ArmBone, readonly [number, number, number]>> = {
  upper: [160, 0, 0],
  lower: [100, 0, 0],
};

/** How far two lying headings may differ, degrees (provisional). */
const ALIGNED: number = 25;

/** A posture's limb. */
type Limb = keyof IAutoMovieMotionHumanPosture["limbs"];

/** The neck's two bones a resting head bends over. */
type NeckBone = "neck" | "head";

/** The neck's added flexion and side bend, degrees. */
interface INeck {
  /** Flexion, degrees. */
  flexion: number;

  /** Side bend, degrees. */
  tilt: number;
}

/**
 * Lie together with a partner (#4012). Both already lie on the support
 * (`lieDown`, `lieOnSurface`, `turnOver`), the performer within its arm's
 * reach (upper arm, forearm and hand) of where it settles; as it settles,
 * the arm on the side it lies on folds up before the face (`FOLD`), or, spooning, under its own head (`PILLOW`). Spooning, the performer lies on the same
 * side as the partner, heading within `ALIGNED`, and slides across the
 * support until its chest's sternum region lies `REST` off the partner's
 * upper back; where its hips meet the partner's first, the lumbar spine
 * curls the chest the rest of the way (`lieTogetherCurl`), each midline
 * keeping the height its own lying width gives it. With the head on the chest, it lies on its side facing the
 * partner on the back; it slides across the support until its lower cheek
 * is over the partner's nearer chest region, then the neck's side bend and
 * flexion lift the cheek onto it, on a coarse grid refined by degrees, a
 * miss over `NEAR` refused. The slide is horizontal, so the body stays on
 * the support; it takes the transport time of its distance on a
 * minimum-jerk share. From the start the settled posture is carried
 * rigidly by the bone under the partner's sternum (`carryHumanPosture`), so the
 * contact holds as the partner breathes or shifts. Windows: the body lies
 * on the support throughout, and from the settle the chest bears on the
 * partner's back or the cheek on the partner's chest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, the two ways, the slide, the neck solve, the carriage and the windows.
 * @evidence contracts/development/design.md#principled-representation The lying entry posture slid to a region contact and carried by the partner's bone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the slide, the neck solve and the carriage; the lying postures and the carried posture are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a region on the displayed partner; the slide never lifts the body off the support.
 */
export const lieTogether: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLieTogether> =
  {
    name: "lieTogether",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLieTogether>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanLieTogether = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      HumanBound.above("hold", p.hold, 0, "s");
      if (p.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: p.partner,
          reason: "a performer lies together with another performer",
          fix: "name another performer as the partner",
        });
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const lowest: number = Math.min(
        HumanTrunk.region(body, entry, "upperBack").point.y,
        HumanTrunk.region(body, entry, "sternum").point.y,
      );
      if (lowest > body.measure.hipHeight / 2)
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: context.entry.base.kind,
          feasible: { kind: "alternatives", values: ["lying"] },
          reason: "lying together starts from lying",
          fix: "lie down beside the partner first",
        });
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        p.partner,
      );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        partner.bones(context.start);
      const region = (
        name: AutoMovieHumanoidRegion,
      ): IAutoMovieMotionHumanStrikingBody.IRegionResult =>
        StrikingBody.region(partner.body, bones, name);
      const flat = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: v.x,
        y: 0,
        z: v.z,
      });

      // The slide and, with the head on the chest, the neck's lift.
      let slide: IAutoMovieVector3;
      let neck: INeck = { flexion: 0, tilt: 0 };
      let own: AutoMovieHumanoidRegion;
      let theirs: AutoMovieHumanoidRegion;
      if (p.way === "spoon") {
        const heading: number = Math.abs(
          ((partner.root(context.start).yaw - entry.yaw + 540) % 360) - 180,
        );
        if (heading > ALIGNED)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "way",
            value: p.way,
            reason: `spooning lies on the partner's side and heading, but the headings differ by ${heading.toFixed(0)} degrees`,
            fix: "lie down on the same side as the partner",
          });
        // The front slides up to the partner's back until its first part
        // meets: the chest at the upper back or the belly at the lower back,
        // whichever the slide reaches sooner along the back's normal (the
        // chest alone let the hips overlap 41 mm).
        own = "sternum";
        theirs = "upperBack";
        const meet = (
          mine: AutoMovieHumanoidRegion,
          other: AutoMovieHumanoidRegion,
        ): IAutoMovieVector3 => {
          const back: IAutoMovieMotionHumanStrikingBody.IRegionResult =
            region(other);
          return flat(
            Vector3.subtract(
              Vector3.add(back.point, Vector3.scale(back.normal, REST)),
              HumanTrunk.region(body, entry, mine).point,
            ),
          );
        };
        const upper: IAutoMovieVector3 = meet("sternum", "upperBack");
        const lower: IAutoMovieVector3 = meet("abdomen", "lowerBack");
        const normal: IAutoMovieVector3 = region("upperBack").normal;
        slide =
          Vector3.dot(lower, normal) > Vector3.dot(upper, normal)
            ? lower
            : upper;
        // The pelvis is read on its own colliders: where the slid hips come
        // nearer the partner's than `REST`, the slide stops that much short
        // along the back's normal (the regions let the hips overlap 41 mm).
        const hips = (
          of: IAutoMovieMotionHumanBody,
          bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        ): IAutoMovieMotionHumanColliders.IPlaced[] =>
          HumanColliders.placed(of, bones).filter(
            (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
              s.bone === "hips",
          );
        const mine: IAutoMovieMotionHumanColliders.IPlaced[] = hips(
          body,
          poseBones(body, resolveHumanPosture(body, shifted(entry, slide))),
        );
        const yours: IAutoMovieMotionHumanColliders.IPlaced[] = hips(
          partner.body,
          partner.bones(context.start),
        );
        let gap: number = Infinity;
        for (const m of mine)
          for (const y of yours)
            for (const s of m.shapes)
              for (const t of y.shapes)
                gap = Math.min(
                  gap,
                  physicalShapePairDistance(m.pose, s, y.pose, t),
                );
        if (gap < REST)
          slide = Vector3.add(
            slide,
            Vector3.scale(Vector3.normalize(flat(normal)), REST - gap),
          );
      } else {
        const left: IAutoMovieVector3 = HumanTrunk.region(
          body,
          entry,
          "cheekLeft",
        ).point;
        const right: IAutoMovieVector3 = HumanTrunk.region(
          body,
          entry,
          "cheekRight",
        ).point;
        own = left.y <= right.y ? "cheekLeft" : "cheekRight";
        const cheek: IAutoMovieVector3 = own === "cheekLeft" ? left : right;
        const near: AutoMovieHumanoidRegion =
          Vector3.distance(region("chestLeft").point, cheek) <=
          Vector3.distance(region("chestRight").point, cheek)
            ? "chestLeft"
            : "chestRight";
        theirs = near;
        const chest: IAutoMovieMotionHumanStrikingBody.IRegionResult =
          region(near);
        const target: IAutoMovieVector3 = Vector3.add(
          chest.point,
          Vector3.scale(chest.normal, REST),
        );
        slide = flat(Vector3.subtract(target, cheek));
        neck = lift(body, shifted(entry, slide), own, target);
      }
      // A body settles from within its arm's reach of where it settles.
      const apart: number =
        body.measure.upperArm + body.measure.forearm + body.measure.hand;
      if (Vector3.length(slide) > apart)
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          feasible: { kind: "range", minimum: null, maximum: apart, unit: "m" },
          reason: `the body lies ${(Vector3.length(slide) * 1000).toFixed(0)} mm from where it settles against the partner`,
          fix: "lie down nearer the partner",
        });

      // Spooning, the trunk curls onto the partner's back where the slide
      // stops short of it at the hips (`lieTogetherCurl`).
      const bent: lieTogetherCurl.ICurl =
        p.way === "spoon"
          ? lieTogetherCurl.solve(
              body,
              shifted(entry, slide),
              Vector3.add(
                region("upperBack").point,
                Vector3.scale(region("upperBack").normal, REST),
              ),
              region("upperBack").normal,
              partner.body,
              bones,
            )
          : lieTogetherCurl.NONE;
      const travel: IAutoMovieVector3 = Vector3.add(slide, bent.shift);

      const settle: number = AutoMovieMotionHumanTiming.transport(
        Vector3.length(travel),
      );
      const duration: number = settle + p.hold;
      // The arm on the side the body lies on folds up before the face.
      const lower: AutoMovieHumanSide =
        HumanTrunk.region(body, entry, "shoulderLeft").point.y <=
        HumanTrunk.region(body, entry, "shoulderRight").point.y
          ? "left"
          : "right";
      // Spooning, the arm folds under the head; else up before the face.
      const fold: Readonly<Record<ArmBone, readonly [number, number, number]>> =
        p.way === "spoon" ? PILLOW : FOLD;
      const folded = (
        posture: IAutoMovieMotionHumanPosture,
        k: number,
      ): IAutoMovieMotionHumanPosture => {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        delete limbs[`${lower}Arm`];
        const blend = (
          bone: AutoMovieHumanoidBone,
          to: readonly [number, number, number],
        ): readonly [number, number, number] => {
          const from: readonly [number, number, number] = posture.joints[
            bone
          ] ?? [0, 0, 0];
          return [
            from[0] + (to[0] - from[0]) * k,
            from[1] + (to[1] - from[1]) * k,
            from[2] + (to[2] - from[2]) * k,
          ];
        };
        return {
          ...posture,
          limbs,
          joints: {
            ...posture.joints,
            [`${lower}UpperArm`]: blend(`${lower}UpperArm`, fold.upper),
            [`${lower}LowerArm`]: blend(`${lower}LowerArm`, fold.lower),
          },
        };
      };
      const settled: IAutoMovieMotionHumanPosture = folded(
        necked(lieTogetherCurl.apply(shifted(entry, travel), bent, 1), neck, 1),
        1,
      );
      const origin: IAutoMovieMotionHumanCarryHumanPosture.IFrame = frame(
        partner,
        context.start,
      );
      const share = (seconds: number): number =>
        minimumJerk.share(Math.min(1, Math.max(0, seconds / settle)));
      const support: IAutoMovieMotionHumanContactWindow["support"] =
        p.on === undefined
          ? { kind: "ground" }
          : { kind: "prop", subject: p.on.prop };
      return {
        duration,
        events: [{ name: "settled", share: settle / duration }],
        contacts: [
          { part: "back", kind: "lie", from: 0, to: 1, support },
          {
            part: own === "sternum" ? "chest" : "head",
            kind: "bear",
            region: own,
            from: settle / duration,
            to: 1,
            support: { kind: "person", subject: p.partner, region: theirs },
          },
        ],
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const k: number = share(seconds);
          const posed: IAutoMovieMotionHumanPosture =
            k >= 1
              ? settled
              : folded(
                  necked(
                    lieTogetherCurl.apply(
                      shifted(entry, Vector3.scale(travel, k)),
                      bent,
                      k,
                    ),
                    neck,
                    k,
                  ),
                  k,
                );
          return carryHumanPosture(
            posed,
            origin,
            frame(
              partner,
              context.start + Math.min(duration, Math.max(0, seconds)),
            ),
          );
        },
      };
    },
  };

/** The partner's carrying bone's frame at a film second: the sternum region's bone, which breathes and turns with the trunk. */
function frame(
  partner: IAutoMovieMotionHumanPerformerReader,
  seconds: number,
): IAutoMovieMotionHumanCarryHumanPosture.IFrame {
  const carrier: AutoMovieHumanoidBone =
    partner.body.surfaces.regions.sternum.bone;
  const bone: IAutoMovieResolvedBone = partner
    .bones(seconds, new Set([carrier]))
    .get(carrier)!;
  return { position: bone.worldPosition, rotation: bone.worldRotation };
}

/** A posture slid across the support: its root and every world limb goal moved. */
function shifted(
  posture: IAutoMovieMotionHumanPosture,
  by: IAutoMovieVector3,
): IAutoMovieMotionHumanPosture {
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const name of Object.keys(posture.limbs) as Limb[]) {
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[name];
    if (goal !== undefined)
      limbs[name] =
        goal.on !== undefined
          ? goal
          : {
              ...goal,
              point: Vector3.add(goal.point, by),
              bend: Vector3.add(goal.bend, by),
            };
  }
  return { ...posture, root: Vector3.add(posture.root, by), limbs };
}

/** The neck's side bend and flexion at a share, added over the posture's own. */
function necked(
  posture: IAutoMovieMotionHumanPosture,
  n: INeck,
  k: number,
): IAutoMovieMotionHumanPosture {
  const flexion: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(0, n.flexion * k);
  const bend: IAutoMovieMotionHumanJoints.Angles =
    AutoMovieMotionHumanHead.share(1, n.tilt * k);
  const added = (bone: NeckBone): readonly [number, number, number] => {
    const held: readonly [number, number, number] = posture.joints[bone] ?? [
      0, 0, 0,
    ];
    return [held[0] + flexion[bone]![0], held[1] + bend[bone]![1], held[2]];
  };
  return {
    ...posture,
    joints: { ...posture.joints, neck: added("neck"), head: added("head") },
  };
}

/** The neck's side bend and flexion that bring a head region nearest a point, or the refusal. */
function lift(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  own: AutoMovieHumanoidRegion,
  target: IAutoMovieVector3,
): INeck {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const point: ReturnType<typeof HumanTrunk.preparePoint> =
    HumanTrunk.preparePoint(body, own);
  const miss = (n: INeck): number =>
    Vector3.distance(point(necked(posture, n, 1), resolution), target);
  let best: INeck = { flexion: 0, tilt: 0 };
  let least: number = miss(best);
  const visit = (n: INeck): void => {
    const m: number = miss(n);
    if (m < least) {
      least = m;
      best = n;
    }
  };
  for (let flexion: number = -30; flexion <= 45; flexion += 5)
    for (let tilt: number = -40; tilt <= 40; tilt += 4)
      visit({ flexion, tilt });
  const coarse: INeck = best;
  for (
    let flexion: number = Math.max(-30, coarse.flexion - 4);
    flexion <= Math.min(45, coarse.flexion + 4);
    ++flexion
  )
    for (
      let tilt: number = Math.max(-40, coarse.tilt - 3);
      tilt <= Math.min(40, coarse.tilt + 3);
      ++tilt
    )
      visit({ flexion, tilt });
  if (least > NEAR)
    throw new HumanRefusal({
      kind: "reach",
      axis: "way",
      value: "chest",
      feasible: { kind: "range", minimum: null, maximum: NEAR, unit: "m" },
      reason: `the ${own} stays ${(least * 1000).toFixed(0)} mm from the partner's chest with the neck flexed ${best.flexion} and bent ${best.tilt} degrees`,
      fix: "lie nearer the partner's chest, or spoon instead",
    });
  return best;
}
