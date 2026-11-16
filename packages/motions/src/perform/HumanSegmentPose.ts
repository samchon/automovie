import {
  type IAutoMoviePoseRig,
  type IAutoMovieRandom,
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  type IAutoMovieSwivelSeed,
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
  export function displayed(
    person: HumanSegment.IPerson,
    seconds: number,
  ): IAutoMoviePose {
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

  /** The difference interval of every rate read of a shown pose, seconds. */
  export const STEP: number = 1e-3;

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
    return seeded(person, segment, seconds).pose;
  }

  /**
   * {@link of} with the seed of every limb fit made in it, each fit
   * continued from the same fit of a nearby second where `near` holds one.
   * A fit is named by its place in the action's evaluation (`IFits`): its
   * chain, the overlays written over the leaf it is fitted in, and whether
   * it is the leaf's own fit, a carried hand's, a stopped weapon's or a
   * re-planted limb's. The same fit a moment away has the same name, so a
   * fit `near` holds continues that fit, and one it does not hold is solved
   * cold.
   *
   * @param person The person.
   * @param segment The action.
   * @param seconds Film seconds.
   * @param near The fits of a nearby second to continue, if any.
   * @returns The pose and the seeds of its fits.
   */
  export function seeded(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    seconds: number,
    near?: INear,
  ): ISeeded {
    const body = person.performer.body;
    const seeds: IFits = new Map();

    // The action as it is shown at a second before any transition offset:
    // its posture under the layers, the holds it carries, and the pose with
    // the overlays written over it.
    const shown = (
      t: number,
      fits?: INear,
    ): {
      posture: IHumanPosture;
      carried: HumanSegment.IHeld[];
      pose: IAutoMoviePose;
      seeds: IFits;
    } => {
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
      const overlaid: HumanSegmentOverlay.IOverlaid =
        HumanSegmentOverlay.overlaid(person, written, t, borne, fits);
      return {
        posture: {
          ...written,
          limbs: { ...written.limbs, ...overlaid.contacts },
        },
        carried: borne,
        pose: overlaid.pose,
        seeds: overlaid.seeds,
      };
    };
    const now: ReturnType<typeof shown> = shown(seconds, near);
    for (const [name, seed] of now.seeds) seeds.set(name, seed);
    let posture: IHumanPosture = now.posture;
    const carried: HumanSegment.IHeld[] = now.carried;
    let pose: IAutoMoviePose = now.pose;

    // One more fit of the evaluation, continued where `near` holds its name.
    const fit = (
      name: string,
      at: IAutoMoviePose,
      limb: IHumanPosture.Limb,
      goal: IHumanPosture.IGoal,
    ): IAutoMoviePose => {
      const fitted: IAutoMovieSeededChainFit = resolveHumanPosture.limbSeeded(
        body,
        at,
        limb,
        goal,
        nearby(near, name),
      );
      seeds.set(name, fitted.seed);
      return fitted.pose;
    };

    // A carried hand no overlay drives keeps its goal as a planted one, so
    // the transition's offset below never moves what it holds. A hand an
    // overlay drives is that overlay's, faded in and out by `overlaid`.
    const active: HumanSegment.IOverlay[] = HumanSegmentOverlay.running(
      person,
      seconds,
    );
    const kept: HumanSegment.IHeld[] = carried.filter(
      (h: HumanSegment.IHeld): boolean =>
        !active.some((o: HumanSegment.IOverlay): boolean =>
          HumanSegment.drives(o.plan, h.side),
        ),
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
        const s: number | undefined = person.stops.get(
          HumanSegment.weapon(segment, w.id),
        );
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
        pose = fit(`stop:${w.id}:${w.limb}`, pose, w.limb, goal);
      }
    const transition = segment.transition;
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    ) {
      // The source is read up to the cut and the target from it on: the
      // target's law has no motion before its start to difference across.
      // Each side's rates are read on its fits continued from the cut's
      // (`continued`), so the offset holds the motion, not the fits'
      // resolution.
      transition.offset ??= inertializePose(
        continued(
          (t: number, near?: INear): ISeeded =>
            seeded(person, transition.source, t, near),
          transition.cut,
          "before",
          humanRig(body),
          transition.blend,
        ).state,
        // The target is read as it is shown, its carried hands and its
        // overlays included: an offset taken against the bare posture would
        // hold the difference of an arm the carry or an overlay already
        // places, and add it on top of that placement.
        continued(
          (t: number, near?: INear): ISeeded => shown(t, near),
          transition.cut,
          "after",
          humanRig(body),
          transition.blend,
        ).state,
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
    }
    // Contacts are the final operation, including an overlay's entire
    // declared window: neither a fade, an offset nor the range clamp can
    // move them. The ordinary resolver owns attachment order and arm pairs.
    pose = clampPose(pose, body.skeleton);
    const plants: IHumanPosture["limbs"] = Object.fromEntries(
      Object.entries(posture.limbs).filter(([, goal]) => goal.planted === true),
    );
    const planted: resolveHumanPosture.ISeeded = resolveHumanPosture.refit(
      body,
      pose,
      plants,
      Object.fromEntries(
        resolveHumanPosture.order(plants).flatMap((limb) => {
          const continued = nearby(near, `planted:${limb}`);
          return continued === undefined ? [] : [[limb, continued]];
        }),
      ),
    );
    for (const [limb, seed] of Object.entries(planted.seeds))
      seeds.set(`planted:${limb}`, seed ?? null);
    return { pose: planted.pose, seeds };
  }

  /**
   * A shown pose's state at a second read from one side, its rates read on
   * fits continued from the second's own (`samplePoseVelocity`, `continued`):
   * the pose at the second is read cold, and the samples of its rates, the
   * second's included, continue each of its fits to the tolerance an
   * inertialization of `duration` asks (`samplePoseVelocity.tolerance`).
   *
   * @param read The shown pose at a second with its fits' seeds, continued from `near` where given.
   * @param seconds The second.
   * @param side The side the motion is read from.
   * @param rig The rig the joints are read through.
   * @param duration The decay the state feeds, seconds.
   * @returns The state, and the continued samples its rates were read from.
   */
  export function continued(
    read: (seconds: number, near?: INear) => ISeeded,
    seconds: number,
    side: "before" | "after",
    rig: IAutoMoviePoseRig,
    duration: number,
  ): IContinued {
    const tolerance: number = samplePoseVelocity.tolerance(STEP, duration);
    let fits: IFits = new Map();
    const samples: IAutoMoviePose[] = [];
    const state: samplePoseVelocity.IState = samplePoseVelocity(
      (t: number): IAutoMoviePose => {
        const instant: ISeeded = read(t);
        fits = instant.seeds;
        return instant.pose;
      },
      seconds,
      STEP,
      side,
      rig,
      (t: number): IAutoMoviePose => {
        const sample: IAutoMoviePose = read(t, {
          seeds: fits,
          tolerance,
        }).pose;
        samples.push(sample);
        return sample;
      },
    );
    return {
      state,
      samples: samples as [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose],
    };
  }

  /**
   * The nearby fit a named fit continues: the seed `near` holds under the
   * name, refined to its tolerance; none where it holds none, or no seed.
   *
   * @param near The fits of a nearby second, if any.
   * @param name The fit's name.
   * @returns The fit to continue, if any.
   */
  export function nearby(
    near: INear | undefined,
    name: string,
  ): IAutoMovieSwivelNear | undefined {
    const seed: IAutoMovieSwivelSeed | null | undefined = near?.seeds.get(name);
    return seed === undefined || seed === null
      ? undefined
      : { ...seed, tolerance: near!.tolerance };
  }

  /** Each limb fit of an evaluation by its name, with the seed it was chosen at; null where its fit has none. */
  export type IFits = Map<string, IAutoMovieSwivelSeed | null>;

  /**
   * The fits of a nearby second an evaluation continues.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The seeds by fit name and the one tolerance they are refined to (`IAutoMovieSwivelNear`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieSwivelSeed`.
   */
  export interface INear {
    /** The nearby second's fits. */
    seeds: ReadonlyMap<string, IAutoMovieSwivelSeed | null>;

    /** The swivel tolerance each continued fit is refined to, degrees. */
    tolerance: number;
  }

  /**
   * A shown pose with the seeds of its fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The pose and its fits by name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IFits`.
   */
  export interface ISeeded {
    /** The pose. */
    pose: IAutoMoviePose;

    /** Its fits. */
    seeds: IFits;
  }

  /**
   * A one-sided state read on continued fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The state and the samples its rates were differenced from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `samplePoseVelocity.IState`.
   */
  export interface IContinued {
    /** The pose at the second, read cold, and its rates. */
    state: samplePoseVelocity.IState;

    /** The continued samples at the second and one and two steps toward its side. */
    samples: readonly [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose];
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
