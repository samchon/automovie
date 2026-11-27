import { type AutoMovieArchetype, AutoMovieArchetypeEquineFord, type AutoMovieArchetypeEquineFordPlan, AutoMovieArchetypeFrame, type AutoMovieArchetypeQuadrupedFooting, AutoMovieArchetypeHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";

import { equineFordScene } from "./equineFordScene";

/**
 * The mounted rider's horse stages of the ford rider, float and lead-out specs: a horse clip carried on the film clock after the rider sits on, its prop readers, the rider's mount chain and performance, and the compact ford: a level shallow bed where the rider mounts, a descent to just under the floating horse's standing sole level, a few strokes' swim and a halt on the submerged far shelf.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stages and who reads them.
 * @evidence contracts/development/design.md#principled-representation A mount record, the ford stage and their builders.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by test_motion_mount_equine_ford_rider, test_motion_mount_equine_ford_float and equineLeadOut.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equineFordRider {
  /** Seconds the horse stands while the rider sits on. */
  export const WAIT: number = 4;

  /** Seconds of the ordinary ride that settles the seat in the saddle before the mounted figures, as the mounted specs stage it. */
  const SETTLE: number = 3;

  /** Seconds the rider stays seated after sitting on, before the settling ride. */
  const SAT: number = 0.5;

  /** The level near bed the rider mounts on, metres along +Z before the ford descends. */
  const BANK: number = 1.5;

  /** The near bed's height, world metres: a ford's shallows the rider stands in to mount, so the wading to swimming depth is short. */
  const BED: number = -0.9;

  /** The water's surface, world metres: 0.8 m over the near bed. */
  export const WATER: number = -0.1;

  /** The near ford's descent: under the 0.11 at which the shared crossing's tail met the slope. */
  const DESCENT: number = 0.1;

  /** The wading course's end below the floating horse's standing sole level, metres: the descent over the 1.6 m a hind hoof stands behind the course point, and a centimetre more, so the bed under the last wading hooves lies below the stroke. */
  const DEPTH_MARGIN: number = 1.6 * DESCENT + 0.01;

  /** Metres the horse swims: a few strokes, longer than the rider's slide off. */
  const SWIM: number = 6;

  /** Metres the climbing horse walks on the submerged far shelf before it halts: more than its braking distance. */
  const SHORE: number = 2;

  /** Posed horse instants kept for repeated contact reads. */
  const RECENT: number = 64;

  /** The horse producer's model. */
  export type Horse = ReturnType<typeof AutoMovieArchetypeHorse.create>;

  /**
   * A horse clip's displayed instant: its placement and its posed model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The two parts of a ride's or a crossing's sample the prop reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `carry`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IInstant {
    /** The horse's world placement. */
    placement: IAutoMovieTransform;

    /** The posed horse. */
    archetype: AutoMovieArchetype<string, string>;
  }

  /**
   * A horse the rider mounts, carried on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The horse, its prop and readers, the seat and the ground the rider mounts from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ford rider, float and lead-out specs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IMount {
    /** The horse. */
    horse: Horse;

    /** The horse prop. */
    prop: ReturnType<typeof HumanObject.prop>;

    /** The horse's placement at a film second. */
    place: (at: number) => IAutoMovieRigidTransform;

    /** A contact's world frame at a film second. */
    part: (id: string, at: number) => IAutoMovieTransform;

    /** The saddle's seat where the rider sits on. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** The ground's height where the rider stands to sit on, world metres. */
    floor: number;

    /** The film second the horse halts. */
    halt: number;
  }

  /**
   * The compact ford on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The mount and the crossing's two cuts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ford rider and float specs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStage extends IMount {
    /** The film second the horse starts floating. */
    float: number;

    /** The film second the horse lands on the far shelf. */
    land: number;
  }

  /**
   * Carry a horse clip on the film clock: it stands at its first instant for `WAIT` while the rider sits on, then plays.
   *
   * @param horse The horse.
   * @param sample The clip's instant at one of its own seconds.
   * @param duration The clip's length, seconds.
   * @param floor The ground's height where the rider stands to sit on.
   * @returns The mount.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the clock and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Every contact is the posed horse's own affordance composed with its placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A clock, two readers and the prop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One clip sample per instant, kept among the RECENT latest for the contacts read at it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the ford and the lead-out stages.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mount holds the clip and at most RECENT posed instants for the caller.
   */
  export function carry(
    horse: Horse,
    sample: (seconds: number) => IInstant,
    duration: number,
    floor: number,
  ): IMount {
    // A carried rider reads several contacts at each instant, so each posed instant is laid once and kept while it is recent.
    const recent: Map<number, IInstant> = new Map();
    const at = (film: number): IInstant => {
      const seconds: number = Math.max(0, Math.min(duration, film - WAIT));
      let instant: IInstant | undefined = recent.get(seconds);
      if (instant === undefined) {
        instant = sample(seconds);
        recent.set(seconds, instant);
        if (recent.size > RECENT) recent.delete(recent.keys().next().value!);
      }
      return instant;
    };
    const place = (film: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = at(film).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
    const part = (id: string, film: number): IAutoMovieTransform => {
      const instant: IInstant = at(film);
      return AutoMovieArchetypeFrame.compose(
        instant.placement,
        instant.archetype.affordance(id).frame,
      );
    };
    return {
      horse,
      prop: HumanObject.prop("horse", at(0).archetype, place(0), place, part),
      place,
      part,
      // The saddle is the horse's, so a sit that is still settling as the horse sets off is carried with it.
      seat: HumanObject.seat(at(0).archetype, place(0), undefined, "horse"),
      floor,
      halt: WAIT + duration,
    };
  }

  /**
   * Stage the compact ford.
   *
   * @returns The stage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stage returned.
   * @evidence contracts/development/implementation.md#principled-implementation A level shallow bed where the rider mounts, a descent from it to just under the floating horse's standing sole level, a short swim and the crossing's admitted far shelf, on which the horse halts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Horse, footing, crossing, mount.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One crossing is planned; sampling is the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared ford scene supplies the immersion, the swim's speed and cycle and the courses' speeds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The stage holds its crossing for the caller.
   */
  export function stage(): IStage {
    const horse: Horse = AutoMovieArchetypeHorse.create(
      { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
      8,
    );
    // The floating horse's standing sole level: the water less the immersion and the back (0.95 of the withers).
    const level: number = WATER - equineFordScene.IMMERSION - 0.95 * 1.65;
    const shelf: number = level - 0.05;
    // The wading course descends to just under that level, as the shared scene's does.
    const wade: number = (BED + DEPTH_MARGIN - level) / DESCENT;
    const float: number = BANK + wade;
    const plane = (
      id: string,
      y: number,
      from: number,
      to: number,
      slope: number,
    ): AutoMovieArchetypeQuadrupedFooting.IPlane => ({
      id,
      origin: { x: 0, y, z: from },
      x: [-6, 6],
      z: [from, to],
      slope: { x: 0, z: slope },
    });
    const authored: AutoMovieArchetypeEquineFordPlan.IParams =
      equineFordScene.params(shelf);
    const crossing: AutoMovieArchetypeEquineFordPlan.IClip<string, string> =
      AutoMovieArchetypeEquineFord.create(horse, {
        ...authored,
        water: WATER,
        footing: {
          planes: [
            plane("bank", BED, -6, BANK, 0),
            plane("ford", BED, BANK, float + 1.5, -DESCENT),
            plane("channel", -3, float + 1.5, float + 3, 0),
            plane("shelf", shelf, float + 3, float + SWIM + 30, 0),
          ],
        },
        entry: {
          ...authored.entry,
          legs: [
            { kind: "straight", length: BANK },
            { kind: "straight", length: wade, rise: -DESCENT * wade },
          ],
        },
        swim: { ...authored.swim, length: SWIM },
        recovery: {
          ...authored.recovery,
          legs: [{ kind: "straight", length: SHORE }],
        },
      });
    return {
      ...carry(
        horse,
        (seconds: number): IInstant => crossing.sample(seconds),
        crossing.duration,
        BED,
      ),
      float: WAIT + crossing.events.float,
      land: WAIT + crossing.events.land,
    };
  }

  /**
   * The rider's mount: sitting on beside the standing horse, the settling ride with the left hand on the mane and the right on its rein, then the mounted figures.
   *
   * @param staged The mount.
   * @param figures The mounted figures from the settled seat.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the chain.
   * @evidence contracts/development/implementation.md#principled-implementation The mounted specs' sit, settle and figures.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms No sampling.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every variant.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The chain is the caller's.
   */
  export function mount(
    staged: IMount,
    figures: IAutoMovieMotionHumanMounted.IFigure[],
  ): IAutoMovieMotionHumanChain {
    return settle(staged).registered("mounted", {
      on: "horse",
      frame: "seat",
      figures,
    });
  }

  /** The sit and the settling ride before the mounted figures. */
  const settle = (staged: IMount): IAutoMovieMotionHumanChain =>
    HumanChain.subject("rider")
      .sit({ seat: staged.seat, hold: SAT })
      .registered("ride", {
        on: "horse",
        duration: SETTLE,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        hands: { left: "mane", right: "rightRein" },
      });

  /** The mounted supports while wading and climbing: the feet in the stirrups, the left hand on the mane, the right on its rein. */
  export const WADING: IAutoMovieMotionHumanMounted.ISupports = {
    leftFoot: "leftStirrup",
    rightFoot: "rightStirrup",
    leftHand: "mane",
    rightHand: "rightRein",
  };

  /** The mounted supports while the horse swims: the hands only. */
  export const SWIMMING: IAutoMovieMotionHumanMounted.ISupports = {
    leftHand: "mane",
    rightHand: "rightRein",
  };

  /**
   * The film second the mounted figures begin: the sit's lowering and the settling ride timed by a rehearsal of them, so a figure can end on a horse's cue.
   *
   * @param staged The mount.
   * @param body The rider.
   * @returns The film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the timing.
   * @evidence contracts/development/implementation.md#principled-implementation Read from the rehearsed settling ride's segment, not from the authored seconds seated, which exclude the sit's lowering.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rehearsal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The rehearsal is planned, never sampled.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every spec.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function settled(
    staged: IMount,
    body: IAutoMovieMotionHumanBody,
  ): number {
    return perform(staged, body, settle(staged)).segments("rider").at(-1)!.end;
  }

  /**
   * The rider's performance: the rider beside the standing horse's saddle on the ground it mounts from, with the riding, lead and float laws.
   *
   * @param staged The mount.
   * @param body The rider.
   * @param chain The rider's chain.
   * @returns The performance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The mounted specs' start beside the saddle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sampling is the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every spec.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The performance is the caller's.
   */
  export function perform(
    staged: IMount,
    body: IAutoMovieMotionHumanBody,
    chain: IAutoMovieMotionHumanChain,
  ): HumanPerformance {
    return new HumanPerformance({
      seed: "equine-ford-rider",
      props: [staged.prop],
      laws: [
        AutoMovieMotionHumanMount.rideHorse.ride,
        AutoMovieMotionHumanMount.mounted,
        AutoMovieMotionHumanMount.leadHorse,
        AutoMovieMotionHumanSwim.HumanFloatBeside,
      ],
      performers: [
        {
          subject: "rider",
          body,
          at: HumanFrame.point(
            {
              origin: { ...staged.seat.at, y: staged.floor },
              yaw: staged.seat.yaw,
            },
            { x: 0.6, y: 0, z: -0.2 },
          ),
          yaw: staged.seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  }

  /**
   * The horse's declaration of a contact.
   *
   * @param staged The mount.
   * @param id The contact.
   * @returns Its declaration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The horse's own affordance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every spec.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function affordance(staged: IMount, id: string): IAutoMovieAffordance {
    return staged.horse.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
  }

  /**
   * A displayed point in the horse's frame at a film second, its +X the horse's left.
   *
   * @param staged The mount.
   * @param point The world point.
   * @param at The film second.
   * @returns The point in the horse's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and its axis.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of the horse's placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One placement read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every spec.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function local(
    staged: IMount,
    point: IAutoMovieVector3,
    at: number,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieRigidTransform = staged.place(at);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.position),
    );
  }
}
