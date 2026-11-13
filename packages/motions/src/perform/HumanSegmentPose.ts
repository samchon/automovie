import {
  type IAutoMovieRandom,
  type IAutoMovieResolvedBone,
  clampPose,
  inertializePose,
  minimumJerk,
  samplePoseVelocity,
} from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { humanRig } from "../posture/humanRig";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";

/**
 * A person's displayed pose: the active action's posture under the layers,
 * the holds it carries, its overlays, a stopped weapon's hold, the entering
 * transition's offset, the re-planted contacts and the range-of-motion
 * clamp, in the order `HumanSegment` states.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanSegment` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentPose {
  /**
   * A person's displayed pose at a film second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function displayed(person: HumanSegment.IPerson, seconds: number): IAutoMoviePose {
    const cached: IAutoMoviePose | undefined = person.resolving
      ? undefined
      : person.cache.get(seconds);
    if (cached !== undefined) return cached;
    let active: HumanSegment.ISegment | undefined;
    for (const s of person.segments)
      if (s.entryTime <= seconds + 1e-12) active = s;
    const pose: IAutoMoviePose =
      active === undefined ? initial(person) : of(person, active, seconds);
    if (person.resolving) return pose;
    if (person.cache.size >= 4096)
      person.cache.delete(person.cache.keys().next().value!);
    person.cache.set(seconds, pose);
    return pose;
  }

  /**
   * One action's displayed pose at a film second, whether or not it is the
   * active one: its posture, its entering offset, its re-planted contacts and
   * the range-of-motion clamp.
   *
   * @param person The person.
   * @param segment The action.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function of(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    seconds: number,
  ): IAutoMoviePose {
    const body = person.performer.body;
    // The action as it is shown at a second before any transition offset:
    // its posture under the layers, the holds it carries, and the pose with
    // the overlays written over it.
    const shown = (
      t: number,
    ): { posture: IHumanPosture; carried: HumanSegment.IHeld[]; pose: IAutoMoviePose } => {
      let written: IHumanPosture = layered(
        person,
        segment.plan.posture(
          Math.min(segment.plan.duration, Math.max(0, t - segment.start)),
        ),
        t,
      );

      // A hold rides every action entered before its takeover, at any
      // second: an interrupted action evaluated past its cut (a transition's
      // source, an entry state) still carries what it carried when it was
      // cut.
      const held: HumanSegment.IHeld[] = person.holds.filter(
        (h: HumanSegment.IHeld): boolean =>
          h.source !== segment &&
          h.from <= t &&
          (t < h.until ||
            (h.riding === true
              ? t < h.until + HumanSegment.FADE
              : segment.entryTime < h.until)) &&
          !HumanSegment.drives(segment.plan, h.side),
      );

      // An overlay that takes a hold over fades in from the body without
      // it, which must still carry the hand as the hold it took over did. So
      // that hold keeps carrying through the fade, ahead of the hold the
      // overlay leaves, which carries from there on and under the overlay's
      // way out.
      const borne: HumanSegment.IHeld[] = held.filter(
        (h: HumanSegment.IHeld, index: number): boolean =>
          !held
            .slice(0, index)
            .some(
              (earlier: HumanSegment.IHeld): boolean =>
                earlier.riding === true && earlier.side === h.side,
            ),
      );
      for (const h of borne)
        written = { ...written, joints: { ...written.joints, ...h.fingers } };
      return {
        posture: written,
        carried: borne,
        pose: HumanSegmentOverlay.overlaid(person, written, t, borne),
      };
    };
    const now: ReturnType<typeof shown> = shown(seconds);
    let posture: IHumanPosture = now.posture;
    const carried: HumanSegment.IHeld[] = now.carried;
    let pose: IAutoMoviePose = now.pose;

    // A carried hand no overlay drives keeps its goal as a planted one, so
    // the transition's offset below never moves what it holds. A hand an
    // overlay drives is that overlay's, faded in and out by `overlaid`.
    const active: HumanSegment.IOverlay[] = HumanSegmentOverlay.running(person, seconds);
    const kept: HumanSegment.IHeld[] = carried.filter(
      (h: HumanSegment.IHeld): boolean =>
        !active.some((o: HumanSegment.IOverlay): boolean => HumanSegment.drives(o.plan, h.side)),
    );
    if (kept.length !== 0)
      posture = {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...Object.fromEntries(HumanSegmentCarry.carries(person, pose, kept)),
        },
      };
    // A stopped weapon's limb holds its contact when its law does not take its
    // stops itself; a law that does shows its own dwell and recoil.
    if (segment.plan.stop === undefined)
      for (const w of segment.plan.weapons ?? []) {
        const s: number | undefined = person.stops.get(HumanSegment.weapon(segment, w.id));
        if (s === undefined || seconds <= s) continue;
        const side: "left" | "right" = w.limb.startsWith("left")
          ? "left"
          : "right";
        const arm: boolean = w.limb.endsWith("Arm");
        const map = poseBones(person.performer.body, of(person, segment, s));
        const effector: IAutoMovieResolvedBone = map.get(
          `${side}${arm ? "Hand" : "Foot"}`,
        )!;
        const goal: IHumanPosture.IGoal = {
          point: effector.worldPosition,
          rotation: effector.worldRotation,
          bend: map.get(`${side}${arm ? "LowerArm" : "LowerLeg"}`)!
            .worldPosition,
          planted: true,
        };
        posture = { ...posture, limbs: { ...posture.limbs, [w.limb]: goal } };
        pose = resolveHumanPosture.limb(body, pose, w.limb, goal);
      }
    const transition = segment.transition;
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    ) {
      // The source is read up to the cut and the target from it on: the
      // target's law has no motion before its start to difference across.
      transition.offset ??= inertializePose(
        samplePoseVelocity(
          (t: number): IAutoMoviePose => of(person, transition.source, t),
          transition.cut,
          1e-3,
          "before",
          humanRig(body),
        ),
        // The target is read as it is shown, its carried hands and its
        // overlays included: an offset taken against the bare posture would
        // hold the difference of an arm the carry or an overlay already
        // places, and add it on top of that placement.
        samplePoseVelocity(
          (t: number): IAutoMoviePose => shown(t).pose,
          transition.cut,
          1e-3,
          "after",
          humanRig(body),
        ),
        transition.blend,
        // A joint cut as it passes the next action's pose keeps its rate and
        // follows through; stopped short it would lose that rate at once.
        true,
        // Joints blend as rotations read through the displayed rig, so an arm
        // hanging at its shoulder chart's gimbal does not swing on the way.
        humanRig(body),
      );
      // The offset pose is clamped first and the planted limbs re-solved last,
      // so no later step moves a plant (the limb fit keeps its own angles in range).
      pose = clampPose(
        transition.offset(Math.max(0, seconds - transition.cut), pose),
        body.skeleton,
      );
      // Attached goals are fitted after the limb they ride on (resolveHumanPosture.order).
      for (const limb of resolveHumanPosture.order(posture.limbs)) {
        const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
        if (goal?.planted === true)
          pose = resolveHumanPosture.limb(body, pose, limb, goal);
      }
      return pose;
    }
    return clampPose(pose, body.skeleton);
  }

  /** A posture with the person's layers added in order. */
  export function layered(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
  ): IHumanPosture {
    // Each layer draws from streams keyed by its own name, as IHumanLayer
    // documents, so two layers that name a channel alike stay independent.
    const action = (): IHumanLayer.IAction | undefined => {
      let active: HumanSegment.ISegment | undefined;
      for (const s of person.segments)
        if (s.entryTime <= seconds + 1e-12) active = s;
      return active === undefined
        ? undefined
        : {
            name: active.name,
            family: active.law.family ?? active.name,
            from: active.entryTime,
            to: active.end,
            events: active.plan.events.map((e) => ({
              name: e.name,
              seconds: active.start + e.share * active.plan.duration,
            })),
            contacts: active.plan.contacts,
          };
    };
    return person.layers.reduce(
      (
        p: IHumanPosture,
        { layer, from, to, fade }: HumanSegment.ILayered,
      ): IHumanPosture => {
        // A windowed layer comes in and goes out on a minimum-jerk ramp, as
        // the weight of what it adds.
        const edge: number = Math.min(seconds - from, to - seconds);
        if (!(edge > 0)) return p;
        const weight: number = edge >= fade ? 1 : minimumJerk(edge / fade).s;
        return mixHumanPosture(
          p,
          layer.apply(p, seconds, {
            ...person.layer,
            action,
            random: (channel: string): IAutoMovieRandom =>
              HumanSkill.stream(
                person.skill,
                person.performer.subject,
                `layer:${layer.name}`,
                0,
                channel,
              ),
          }),
          weight,
        );
      },
      posture,
    );
  }

  /** The standing pose before a person's first action. */
  export function initial(person: HumanSegment.IPerson): IAutoMoviePose {
    return resolveHumanPosture(person.performer.body, person.initial);
  }
}
