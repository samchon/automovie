import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropWear,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { HumanPerformanceGrips } from "./HumanPerformanceGrips";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanSegment } from "./HumanSegment";

/** The bones under each limb, by the part of the bone's name after its side. */
const LIMBS: Readonly<Record<string, LimbKind>> = {
  Shoulder: "Arm",
  UpperArm: "Arm",
  LowerArm: "Arm",
  Hand: "Arm",
  UpperLeg: "Leg",
  LowerLeg: "Leg",
  Foot: "Leg",
  Toes: "Leg",
};

/**
 * The bindings of a performance: each worn prop whose wear carries a link
 * (`IAutoMovieMotionPropWear.link`) holds the wearer's bound limbs where they
 * were when it went on, within the link's slack, until a later grip, wear or
 * mount takes the prop off. A binding is a layer on the wearer over that span,
 * so it comes in and goes out over an overlay's fade, and an action of the
 * wearer that grips or plants with a bound limb inside it is refused the way
 * any layer over a held limb is.
 */
export namespace HumanPerformanceBonds {
  /**
   * Add a binding layer to each wearer for every linked wear placed.
   *
   * @param self The placed performance, its schedule resolved.
   * @throws {HumanRefusal} When a link names both or neither end, has a bad
   *   slack, or binds a bone outside the limbs or two bones of one limb.
   */
  export function attach(self: IAutoMovieMotionHumanPerformanceState): void {
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        for (const wear of segment.plan.wears ?? []) {
          if (wear.link === undefined) continue;
          const from: number =
            segment.start + wear.from * segment.plan.duration;
          if (from < segment.entryTime - 1e-9 || from > segment.end + 1e-9)
            continue;
          const wearer: string = wear.wearer ?? person.performer.subject;
          const bound: IAutoMovieMotionHumanSegment.IPerson =
            HumanPerformanceRead.person(self, wearer);
          const limbs: readonly IBound[] = admit(wearer, wear, wear.link);
          const span: IAutoMovieMotionHumanPerformanceState.IGrip | undefined =
            HumanPerformanceGrips(self, wear.prop).find(
              (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
                g.subject === wearer &&
                g.bone === wear.bone &&
                Math.abs(g.from - from) <= 1e-9,
            );
          // Placed as a scheduled layer, so a bound limb that an action
          // grips or plants with inside the binding is refused.
          bound.layers.push(
            HumanPerformanceLayers.window(self, bound, {
              layer: layer(self, wearer, wear, wear.link, limbs, from),
              from,
              // A binding no grip takes off holds to the film's end, not
              // fading out before it as a window ending there would.
              to: span?.to ?? Infinity,
              fade: HumanSegment.FADE,
            }),
          );
        }
  }
}

/** The limbs a link binds, refusing a malformed link. */
function admit(
  wearer: string,
  wear: IAutoMovieMotionPropWear,
  link: IAutoMovieMotionPropWear.ILink,
): readonly IBound[] {
  const refuse = (
    axis: string,
    value: Refused,
    reason: string,
    fix: string,
  ): never => {
    throw new HumanRefusal({
      kind: "parameter",
      performer: wearer,
      axis: `wears.link.${axis}`,
      value,
      reason,
      fix,
    });
  };
  if ((link.bone === undefined) === (link.target === undefined))
    refuse(
      "bone",
      link.bone ?? "none",
      `the binding of ${wear.prop} names ${link.bone === undefined ? "neither" : "both"} a second bone and a target`,
      "link the worn bone to exactly one other end",
    );
  if (!(link.slack >= 0))
    refuse(
      "slack",
      link.slack,
      "a binding's slack is a finite length of zero or more",
      "give the chain's or the rope's free length in metres",
    );
  const first: IBound =
    limbOf(wear.bone) ??
    refuse(
      "bone",
      wear.bone,
      `${wear.prop} is worn on ${wear.bone}, which no limb carries`,
      "bind a wrist, a forearm, an ankle or a shin",
    );
  if (link.bone === undefined) return [first];
  const second: IBound =
    limbOf(link.bone) ??
    refuse(
      "bone",
      link.bone,
      `${link.bone} lies on no limb`,
      "link a bone of another limb, such as the other wrist",
    );
  if (second.limb === first.limb)
    refuse(
      "bone",
      link.bone,
      `${wear.bone} and ${link.bone} lie on one limb`,
      "link a bone of another limb, such as the other wrist",
    );
  return [first, second];
}

/**
 * The limb that carries a bone, with its end and middle bones; none for the
 * trunk and the head.
 */
function limbOf(bone: AutoMovieHumanoidBone): IBound | undefined {
  const side: AutoMovieHumanSide | undefined = bone.startsWith("left")
    ? "left"
    : bone.startsWith("right")
      ? "right"
      : undefined;
  if (side === undefined) return undefined;
  const kind: LimbKind | undefined = LIMBS[bone.slice(side.length)];
  if (kind === undefined) return undefined;
  return {
    limb: `${side}${kind}`,
    end: kind === "Arm" ? `${side}Hand` : `${side}Foot`,
    middle: kind === "Arm" ? `${side}LowerArm` : `${side}LowerLeg`,
  };
}

/**
 * The binding layer: each bound limb's end and middle joint as the wearer
 * showed them when the prop went on, read once. Two bound limbs are kept in the
 * frame of the bone they hang from (the chest for arms, whose shoulders ride
 * it, the hips for legs), so the bound pair travels and turns with the body and
 * the trunk's own turn in a walk carries it; a limb bound to a target is kept
 * at its offset from the target, so a tied wrist stays at the chair's rail.
 * Ends further apart than the slack are drawn together to it.
 */
function layer(
  self: IAutoMovieMotionHumanPerformanceState,
  wearer: string,
  wear: IAutoMovieMotionPropWear,
  link: IAutoMovieMotionPropWear.ILink,
  limbs: readonly IBound[],
  from: number,
): IAutoMovieMotionHumanLayer {
  // The bone the bound limbs hang from: the chest carries both shoulders,
  // the hips both legs; a binding across the two hangs from the hips.
  const carrier: AutoMovieHumanoidBone = limbs.every(
    (l: IBound): boolean => l.limb === "leftArm" || l.limb === "rightArm",
  )
    ? "chest"
    : "hips";
  let kept: readonly IKept[] | undefined;
  // Each bound arm's or leg's own solution as it was bound, so its fit
  // stays on that branch and swivel while the binding holds it.
  let references: readonly IAutoMovieHumanLimbReference[] | undefined;
  const keep: (
    context: IAutoMovieMotionHumanLayer.IContext,
  ) => readonly IKept[] = (
    context: IAutoMovieMotionHumanLayer.IContext,
  ): readonly IKept[] => {
    if (kept !== undefined) return kept;
    const pose: IAutoMoviePose = HumanPerformanceRead.pose(self, wearer, from);
    references = limbs.map(
      (l: IBound): IAutoMovieHumanLimbReference =>
        HumanLimbFit.reference(pose, l.limb),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanPerformanceRead.bones(
        self,
        wearer,
        from,
        new Set<AutoMovieHumanoidBone>([
          carrier,
          ...limbs.flatMap((l: IBound): AutoMovieHumanoidBone[] => [
            l.end,
            l.middle,
          ]),
        ]),
      );
    const hips: IAutoMovieResolvedBone = bones.get(carrier)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hips.worldRotation,
    );
    const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(inverse, Vector3.subtract(p, hips.worldPosition));
    const read: IKept[] = limbs.map(
      (l: IBound): IKept => ({
        point: bones.get(l.end)!.worldPosition,
        bend: bones.get(l.middle)!.worldPosition,
        rotation: bones.get(l.end)!.worldRotation,
      }),
    );
    if (link.target !== undefined) {
      // Kept as offsets from the target, at most the slack long.
      const anchor: IAutoMovieVector3 = context.aim(link.target, from).point;
      const offset: IAutoMovieVector3 = Vector3.subtract(
        read[0]!.point,
        anchor,
      );
      const length: number = Vector3.length(offset);
      const drawn: IAutoMovieVector3 =
        length > link.slack
          ? Vector3.scale(offset, link.slack / length)
          : offset;
      kept = [
        {
          point: drawn,
          bend: Vector3.add(
            drawn,
            Vector3.subtract(read[0]!.bend, read[0]!.point),
          ),
          rotation: read[0]!.rotation,
        },
      ];
      return kept;
    }
    // Two ends in the carrying bone's frame, drawn to the slack about their
    // middle; each hand's turn kept after the bone's.
    const [a, b] = read.map(
      (k: IKept): IKept => ({
        point: local(k.point),
        bend: local(k.bend),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, k.rotation),
        ),
      }),
    ) as [IKept, IKept];
    const apart: number = Vector3.distance(a.point, b.point);
    const middle: IAutoMovieVector3 = Vector3.lerp(a.point, b.point, 0.5);
    const draw: (k: IKept) => IKept = (k: IKept): IKept => {
      if (!(apart > link.slack)) return k;
      const point: IAutoMovieVector3 = Vector3.add(
        middle,
        Vector3.scale(Vector3.subtract(k.point, middle), link.slack / apart),
      );
      return {
        point,
        bend: Vector3.add(point, Vector3.subtract(k.bend, k.point)),
        rotation: k.rotation,
      };
    };
    kept = [draw(a), draw(b)];
    return kept;
  };
  return {
    name: `bond:${wear.prop}`,
    channels: limbs.map((l: IBound): Limb => l.limb),
    apply: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      context: IAutoMovieMotionHumanLayer.IContext,
    ): IAutoMovieMotionHumanPosture => {
      const ends: readonly IKept[] = keep(context);
      const goals: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      if (link.target !== undefined) {
        const at: IAutoMovieVector3 = context.aim(link.target, seconds).point;
        goals[limbs[0]!.limb] = {
          point: Vector3.add(at, ends[0]!.point),
          bend: Vector3.add(at, ends[0]!.bend),
          rotation: ends[0]!.rotation,
          reference: references![0]!,
        } satisfies IAutoMovieHumanLimbGoal;
      } else
        limbs.forEach((l: IBound, k: number): void => {
          goals[l.limb] = {
            point: ends[k]!.point,
            bend: ends[k]!.bend,
            rotation: ends[k]!.rotation,
            on: carrier,
            reference: references![k]!,
          } satisfies IAutoMovieHumanLimbGoal;
        });
      return { ...posture, limbs: goals };
    },
  };
}

/** The kind of limb a bone lies on. */
type LimbKind = "Arm" | "Leg";

/** A value a refused link names. */
type Refused = string | number;

/** A limb channel of the posture. */
type Limb = keyof IAutoMovieMotionHumanPosture["limbs"];

/** A limb a binding holds: its channel and the bones that end and bend it. */
interface IBound {
  /** The limb's channel. */
  limb: Limb;

  /**
   * The bone at its end: the hand or the foot, whose origin is the wrist or the
   * ankle.
   */
  end: AutoMovieHumanoidBone;

  /**
   * The bone at its middle joint: the forearm or the shin, whose origin is the
   * elbow or the knee.
   */
  middle: AutoMovieHumanoidBone;
}

/** One bound limb's end and middle joint, kept from the binding. */
interface IKept {
  /** The wrist or the ankle. */
  point: IAutoMovieVector3;

  /** The elbow or the knee. */
  bend: IAutoMovieVector3;

  /**
   * The hand's or the foot's rotation from its rest, so the bound hand keeps
   * the turn it was bound in.
   */
  rotation: IAutoMovieQuaternion;
}
