import {
  Vector3,
  AutoMovieEngineMotionSampling,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarryHumanPosture,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieTogether,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { lieTogetherCurl } from "./lieTogetherCurl";
import { lieTogetherDrape } from "./lieTogetherDrape";
import { lieTogetherFrame } from "./lieTogetherFrame";
import { lieTogetherNeck } from "./lieTogetherNeck";
import { lieTogetherReach } from "./lieTogetherReach";
import { lieTogetherShifted } from "./lieTogetherShifted";

/*
 * How far off the partner's skin the resting region lies, metres (provisional:
 * a skin contact).
 */
const REST: number = 0.005;

/*
 * The lower arm's fold as the body settles, clinical degrees: the upper arm
 * forward and the elbow bent, the hand up before the face, so the arm a body
 * lies on stays out of the partner (provisional).
 */
const FOLD: Readonly<Record<ArmBone, readonly [number, number, number]>> = {
  upper: [90, 0, 0],
  lower: [140, 0, 0],
};

/*
 * The lower arm's fold when spooning, clinical degrees: the upper arm raised
 * along the floor above the head and the elbow bent back, the forearm under the
 * head as its pillow, so the arm a spooning body lies on stays behind its own
 * head instead of reaching into the partner it lies behind (the forward fold
 * met the partner's chest 42 mm deep; provisional).
 */
const PILLOW: Readonly<Record<ArmBone, readonly [number, number, number]>> = {
  upper: [160, 0, 0],
  lower: [100, 0, 0],
};

/*
 * How far two lying headings may differ, degrees (provisional).
 */
const ALIGNED: number = 25;

/*
 * Lie together with a partner. Both already lie on the support (`lieDown`,
 * `lieOnSurface`, `turnOver`), the performer within its arm's reach (upper arm,
 * forearm and hand) of where it settles; as it settles, the arm on the side it
 * lies on folds up before the face (`FOLD`), or, spooning, under its own head
 * (`PILLOW`), the free arm draped over the partner (`lieTogetherDrape`).
 * Spooning, the performer lies on the same side as the partner, heading within
 * `ALIGNED`, and slides across the support until its chest's sternum region
 * lies `REST` off the partner's upper back; where its hips meet the partner's
 * first, the lumbar spine curls the chest the rest of the way
 * (`lieTogetherCurl`), each midline keeping the height its own lying width
 * gives it. With the head on the chest, it lies on its side beside the partner
 * on the back, its head toward the partner's nearer chest region; it slides
 * toward that region across the support until any part but its head and neck
 * comes `REST` off the partner (`lieTogetherReach`), then the neck's side bend
 * and flexion lay the lower cheek on the partner's surface beneath it, the
 * nearest of the chest it reaches or the shoulder by it, on a coarse grid
 * refined by degrees, a miss over a skin contact refused (`lieTogetherNeck`).
 * The slide is horizontal, so the body stays on the support; it takes the
 * transport time of its distance on a minimum-jerk share, once the arm has
 * folded in the free-space time of its hand's arc. From the start the settled
 * posture is carried rigidly by the bone under the partner's sternum
 * (`carryHumanPosture`), so the contact holds as the partner breathes or
 * shifts. Windows: the body lies on the support throughout, and from the settle
 * the chest bears on the partner's back or the cheek on the partner's chest.
 */
export const lieTogether: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLieTogether> =
  {
    name: "lieTogether",
    interrupts: {},
    plan: planLieTogether,
  };

/*
 * Lie together with a partner. Both already lie on the support (`lieDown`,
 * `lieOnSurface`, `turnOver`), the performer within its arm's reach (upper arm,
 * forearm and hand) of where it settles; as it settles, the arm on the side it
 * lies on folds up before the face (`FOLD`), or, spooning, under its own head
 * (`PILLOW`), the free arm draped over the partner (`lieTogetherDrape`).
 * Spooning, the performer lies on the same side as the partner, heading within
 * `ALIGNED`, and slides across the support until its chest's sternum region
 * lies `REST` off the partner's upper back; where its hips meet the partner's
 * first, the lumbar spine curls the chest the rest of the way
 * (`lieTogetherCurl`), each midline keeping the height its own lying width
 * gives it. With the head on the chest, it lies on its side beside the partner
 * on the back, its head toward the partner's nearer chest region; it slides
 * toward that region across the support until any part but its head and neck
 * comes `REST` off the partner (`lieTogetherReach`), then the neck's side bend
 * and flexion lay the lower cheek on the partner's surface beneath it, the
 * nearest of the chest it reaches or the shoulder by it, on a coarse grid
 * refined by degrees, a miss over a skin contact refused (`lieTogetherNeck`).
 * The slide is horizontal, so the body stays on the support; it takes the
 * transport time of its distance on a minimum-jerk share, once the arm has
 * folded in the free-space time of its hand's arc. From the start the settled
 * posture is carried rigidly by the bone under the partner's sternum
 * (`carryHumanPosture`), so the contact holds as the partner breathes or
 * shifts. Windows: the body lies on the support throughout, and from the settle
 * the chest bears on the partner's back or the cheek on the partner's chest.
 */
function planLieTogether(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLieTogether>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanLieTogether = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  HumanBound.above("hold", p.hold, 0, "s");
  if (p.partner === context.subject)
    throw new AutoMovieMotionHumanRefusal({
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
    throw new AutoMovieMotionHumanRefusal({
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

  // The arm on the side the body lies on folds as it settles: spooning,
  // under the head; else up before the face.
  const lower: AutoMovieHumanSide =
    HumanTrunk.region(body, entry, "shoulderLeft").point.y <=
    HumanTrunk.region(body, entry, "shoulderRight").point.y
      ? "left"
      : "right";
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
      const from: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
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

  // The slide and, with the head on the chest, the neck's lift.
  let slide: IAutoMovieVector3;
  let neck: lieTogetherNeck.INeck = lieTogetherNeck.NONE;
  let own: AutoMovieHumanoidRegion;
  let theirs: AutoMovieHumanoidRegion;
  if (p.way === "spoon") {
    const heading: number = Math.abs(
      ((partner.root(context.start).yaw - entry.yaw + 540) % 360) - 180,
    );
    if (heading > ALIGNED)
      throw new AutoMovieMotionHumanRefusal({
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
      Vector3.dot(lower, normal) > Vector3.dot(upper, normal) ? lower : upper;
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
      poseBones(
        body,
        resolveHumanPosture(body, lieTogetherShifted(entry, slide)),
      ),
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
              AutoMovieEnginePhysics.physicalShapePairDistance(m.pose, s, y.pose, t),
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
    // The body slides toward that chest across the support until any part
    // but its head and neck comes `REST` off the partner, its arm folded
    // as it settles (the slide to the chest's middle ran the body 117 mm
    // into the partner); the cheek then rests on the partner's surface
    // beneath it, the nearest of the chest it reaches, or the shoulder by
    // it, whichever region lies nearer.
    slide = lieTogetherReach.slide(
      body,
      folded(entry, 1),
      flat(Vector3.subtract(region(near).point, cheek)),
      partner.body,
      bones,
      REST,
    );
    const under: IAutoMovieMotionHumanColliders.IHit | undefined =
      lieTogetherReach.beneath(partner.body, bones, Vector3.add(cheek, slide));
    if (under === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "partner",
        value: p.partner,
        feasible: null,
        reason: `the ${own} stops beside the partner, over none of them, where the body meets them`,
        fix: "lie down with the head toward the partner's chest",
      });
    const shoulder: AutoMovieHumanoidRegion =
      near === "chestLeft" ? "shoulderLeft" : "shoulderRight";
    theirs =
      Vector3.distance(region(near).point, under.point) <=
      Vector3.distance(region(shoulder).point, under.point)
        ? near
        : shoulder;
    neck = lieTogetherNeck.lift(
      body,
      lieTogetherShifted(entry, slide),
      own,
      Vector3.addScaled(under.point, under.normal, REST),
    );
  }
  // A body settles from within its arm's reach of where it settles.
  const apart: number =
    body.measure.upperArm + body.measure.forearm + body.measure.hand;
  if (Vector3.length(slide) > apart)
    throw new AutoMovieMotionHumanRefusal({
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
          lieTogetherShifted(entry, slide),
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

  // The arm folds before the body closes in on the partner: the slide's
  // clearance is read with the arm folded (`lieTogetherReach`), and a
  // fold still sweeping as the body arrived passed its fingers 36 mm
  // into the partner. The fold takes the free-space time of the hand's
  // arc about the shoulder, the arm's reach times the upper arm's largest
  // turn; the slide follows in its own transport time.
  const was: readonly [number, number, number] = AutoMovieMotionHumanArm.angles(
    context.entry.pose,
    lower,
  ).upper;
  const folding: number = AutoMovieMotionHumanTiming.transport(
    apart *
      Math.max(
        Math.abs(fold.upper[0] - was[0]),
        Math.abs(fold.upper[1] - was[1]),
        Math.abs(fold.upper[2] - was[2]),
      ) *
      (Math.PI / 180),
  );
  const settle: number =
    folding + AutoMovieMotionHumanTiming.transport(Vector3.length(travel));
  const duration: number = settle + p.hold;
  const settled: IAutoMovieMotionHumanPosture = folded(
    lieTogetherNeck.apply(
      lieTogetherCurl.apply(lieTogetherShifted(entry, travel), bent, 1),
      neck,
      1,
    ),
    1,
  );
  const origin: IAutoMovieMotionHumanCarryHumanPosture.IFrame =
    lieTogetherFrame(partner, context.start);
  const share = (seconds: number, from: number, to: number): number =>
    AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, (seconds - from) / (to - from))));
  // Spooning, the free arm drapes over the partner (`lieTogetherDrape`).
  const drape: lieTogetherDrape.IDrape | undefined =
    p.way === "spoon"
      ? lieTogetherDrape.solve(
          body,
          settled,
          lower === "left" ? "right" : "left",
          partner.body,
          bones,
        )
      : undefined;
  const support: IAutoMovieMotionHumanContactWindow["support"] =
    p.on === undefined
      ? { kind: "ground" }
      : { kind: "prop", subject: p.on.prop };
  const plan: IAutoMovieMotionHumanActionPlan = {
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
      const k: number = share(seconds, folding, settle);
      const lain: IAutoMovieMotionHumanPosture =
        k >= 1
          ? settled
          : folded(
              lieTogetherNeck.apply(
                lieTogetherCurl.apply(
                  lieTogetherShifted(entry, Vector3.scale(travel, k)),
                  bent,
                  k,
                ),
                neck,
                k,
              ),
              share(seconds, 0, folding),
            );
      // The draping arm's goal throughout, which its course lays.
      return carryHumanPosture(
        drape === undefined
          ? lain
          : lieTogetherDrape.write(lain, drape, share(seconds, 0, settle)),
        origin,
        lieTogetherFrame(
          partner,
          context.start + Math.min(duration, Math.max(0, seconds)),
        ),
      );
    },
  };
  return drape === undefined
    ? plan
    : lieTogetherDrape.course({
        context,
        plan,
        drape,
        settle,
        partner: p.partner,
      });
}

/*
 * The two bones of a folding arm.
 */
type ArmBone = "upper" | "lower";
