import {
  ArchetypeFrame,
  EquineFord,
  type EquineFordPlan,
  type QuadrupedFooting,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSeated,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFloatBeside,
  HumanFrame,
  HumanHand,
  HumanLeadHorse,
  HumanMounted,
  HumanObject,
  HumanPerformance,
  HumanRide,
} from "@automovie/motions";

import { equineFordScene } from "./equineFordScene";

/**
 * The compact ford of the ford rider and float specs: a horse that the rider mounts on a level near bank, which wades, swims a few strokes, lands on a submerged far shelf and climbs a steep exit to a dry top where it halts, then, when a lead is laid, walks on led; its prop readers on the film clock, the rider's seat, mount chain and performance, and the contact readers the specs measure with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged crossing, the led walk and who reads it.
 * @evidence contracts/development/design.md#principled-representation A stage record and its builders.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by test_archetype_equine_ford_rider and test_archetype_equine_ford_float.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equineFordRider {
  /** Seconds the horse stands while the rider sits on. */
  export const WAIT: number = 4;

  /** Seconds of the ordinary ride that settles the seat in the saddle before the mounted figures, as the mounted specs stage it. */
  export const SETTLE: number = 3;

  /** Seconds the sit onto the saddle takes. */
  export const SAT: number = 0.5;

  /** The level near bank the rider mounts on, metres along +Z before the ford descends. */
  const BANK: number = 3;

  /** The water's surface, world metres: just under the dry banks at zero. */
  export const WATER: number = -0.1;

  /** The near ford's descent: under the 0.11 at which the shared crossing's tail met the slope. */
  const DESCENT: number = 0.1;

  /** The wading course's end below the floating horse's standing sole level, metres: the shared scene's margin, so the bed under the last wading hooves lies below the stroke. */
  const DEPTH_MARGIN: number = 0.11;

  /** Metres the horse swims: a few strokes, longer than the rider's slide off. */
  const SWIM: number = 6;

  /** The far exit's grade up to the dry top, a steep river bank a horse climbs out on: authored. */
  const GRADE: number = 0.25;

  /** Metres the climbing horse walks on the submerged shelf before the exit. */
  const SHORE: number = 1;

  /** Metres the horse walks on the dry top before it halts. */
  const TOP: number = 3;

  /** The horse producer's model. */
  export type Horse = ReturnType<typeof createHorse>;

  /** A horse ride along a course. */
  export type Ride = ReturnType<typeof rideHorse>;

  /**
   * A led walk laid after the crossing: the ride and the film second it starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The ride and its start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `stage`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ILed {
    /** The led ride, from the halt. */
    ride: Ride;

    /** The film second it starts. */
    start: number;
  }

  /**
   * One staged crossing on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The horse, the crossing, its readers and the rider's seat.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ford rider spec.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStage {
    /** The horse. */
    horse: Horse;

    /** The crossing, started at `WAIT`. */
    crossing: EquineFordPlan.IClip<string, string>;

    /** The horse prop. */
    prop: ReturnType<typeof HumanObject.prop>;

    /** The horse's placement at a film second. */
    place: (at: number) => IAutoMovieRigidTransform;

    /** A contact's world frame at a film second. */
    part: (id: string, at: number) => IAutoMovieTransform;

    /** The saddle's seat where the rider sits on. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** The film second the horse starts floating. */
    float: number;

    /** The film second the horse lands on the far shelf. */
    land: number;

    /** The film second the horse halts on the dry top. */
    halt: number;
  }

  /**
   * Stage the crossing, with the led walk when given.
   *
   * @param led The led walk after the halt, absent while it is rehearsed.
   * @returns The stage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the stage returned.
   * @evidence contracts/development/implementation.md#principled-implementation A compact ford: a level near bank where the rider mounts, a descent to just under the floating horse's standing sole level, a short swim, the crossing's admitted far shelf and a steep exit from it to a dry top level with the near bank.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Horse, footing, crossing, readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One crossing is planned; sampling is the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared ford scene supplies the immersion, the swim's speed and cycle and the courses' speeds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The stage holds its rides for the caller.
   */
  export function stage(led?: ILed): IStage {
    const horse: Horse = createHorse(
      { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
      8,
    );
    // The floating horse's standing sole level: the water less the immersion and the back (0.95 of the withers).
    const level: number = WATER - equineFordScene.IMMERSION - 0.95 * 1.65;
    const shelf: number = level - 0.05;
    // The wading course descends to just under that level, as the shared scene's does, then the swim and a shore's walk.
    const wade: number = (DEPTH_MARGIN - level) / DESCENT;
    const float: number = BANK + wade;
    const ramp: number = float + SWIM + SHORE;
    const climb: number = -shelf / GRADE;
    const plane = (
      id: string,
      y: number,
      from: number,
      to: number,
      slope: number,
    ): QuadrupedFooting.IPlane => ({
      id,
      origin: { x: 0, y, z: from },
      x: [-6, 6],
      z: [from, to],
      slope: { x: 0, z: slope },
    });
    const authored: EquineFordPlan.IParams = equineFordScene.params(shelf);
    const crossing: EquineFordPlan.IClip<string, string> = EquineFord(horse, {
      ...authored,
      water: WATER,
      footing: {
        planes: [
          plane("bank", 0, -6, BANK, 0),
          plane("ford", 0, BANK, float + 1.5, -DESCENT),
          plane("channel", -3, float + 1.5, float + 3, 0),
          plane("shelf", shelf, float + 3, ramp, 0),
          plane("ramp", shelf, ramp, ramp + climb, GRADE),
          plane("top", 0, ramp + climb, ramp + climb + 30, 0),
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
        legs: [
          { kind: "straight", length: SHORE },
          { kind: "straight", length: climb, rise: -shelf },
          { kind: "straight", length: TOP },
        ],
      },
    });    const local = (at: number): number =>
      Math.max(0, Math.min(crossing.duration, at - WAIT));
    const placed = (frame: IAutoMovieTransform): IAutoMovieRigidTransform => ({
      position: frame.translation,
      rotation: frame.rotation,
    });
    const place = (at: number): IAutoMovieRigidTransform =>
      led !== undefined && at >= led.start
        ? placed(led.ride.at(Math.min(led.ride.duration, at - led.start)).placement)
        : placed(crossing.sample(local(at)).placement);
    const part = (id: string, at: number): IAutoMovieTransform => {
      if (led !== undefined && at >= led.start)
        return led.ride.frame(
          id as createHorse.Affordance,
          Math.min(led.ride.duration, at - led.start),
        );
      const sample: EquineFordPlan.ISample<string, string> = crossing.sample(
        local(at),
      );
      return ArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance(id).frame,
      );
    };
    return {
      horse,
      crossing,
      prop: HumanObject.prop(
        "horse",
        crossing.sample(0).archetype,
        place(0),
        place,
        part,
      ),
      place,
      part,
      seat: HumanObject.seat(crossing.sample(0).archetype, place(0)),
      float: WAIT + crossing.events.float,
      land: WAIT + crossing.events.land,
      halt: WAIT + crossing.duration,
    };
  }

  /**
   * The rider's mount: sitting on beside the standing horse, the settling ride with the left hand on the mane and the right on its rein, then the mounted figures.
   *
   * @param staged The stage.
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
    staged: IStage,
    figures: IAutoMovieMotionHumanMounted.IFigure[],
  ): IAutoMovieMotionHumanChain {
    return HumanChain.subject("rider")
      .sit({ seat: staged.seat, seconds: SAT })
      .registered("ride", {
        on: "horse",
        seconds: SETTLE,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        hands: { left: "mane", right: "rightRein" },
      })
      .registered("mounted", { on: "horse", frame: "seat", figures });
  }

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
   * The wading figure from the settled seat to the float.
   *
   * @param staged The stage.
   * @returns The figure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the figure.
   * @evidence contracts/development/implementation.md#principled-implementation The figure ends at the float on the film clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Closed form.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both variants.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function wading(staged: IStage): IAutoMovieMotionHumanMounted.IFigure {
    return {
      seat: "entered",
      transfer: 0.4,
      seconds: staged.float - SAT - SETTLE - 0.4,
      supports: WADING,
    };
  }

  /**
   * The rider's performance on the stage: the rider beside the standing horse's saddle, the riding, lead and float laws.
   *
   * @param staged The stage.
   * @param body The rider.
   * @param chain The rider's chain.
   * @returns The performance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The mounted specs' start beside the saddle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sampling is the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both specs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The performance is the caller's.
   */
  export function perform(
    staged: IStage,
    body: IAutoMovieMotionHumanBody,
    chain: IAutoMovieMotionHumanChain,
  ): HumanPerformance {
    return new HumanPerformance({
      seed: "equine-ford-rider",
      props: [staged.prop],
      laws: [HumanRide.ride, HumanMounted, HumanLeadHorse, HumanFloatBeside],
      performers: [
        {
          subject: "rider",
          body,
          at: HumanFrame.point(
            { origin: { ...staged.seat.at, y: 0 }, yaw: staged.seat.yaw },
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
   * @param staged The stage.
   * @param id The contact.
   * @returns Its declaration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The horse's own affordance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both specs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function affordance(staged: IStage, id: string): IAutoMovieAffordance {
    return staged.horse.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
  }

  /**
   * A displayed point in the horse's frame at a film second, its +X the horse's left.
   *
   * @param staged The stage.
   * @param point The world point.
   * @param at The film second.
   * @returns The point in the horse's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and its axis.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of the horse's placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One placement read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both specs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function local(
    staged: IStage,
    point: IAutoMovieVector3,
    at: number,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieRigidTransform = staged.place(at);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.position),
    );
  }
  /**
   * How far a held round contact is from the palm: the palm frame's centre against the contact's axis less its radius, metres, as the lead and the handles are checked.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param side The hand.
   * @param contact The contact's world frame.
   * @param affordance The contact's declaration.
   * @returns The miss, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation A round bar seats across the palm's middle anywhere round its axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One palm frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanHand.frame`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function bar(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    contact: IAutoMovieTransform,
    affordance: IAutoMovieAffordance,
  ): number {
    return Math.abs(
      Vector3.distance(
        HumanHand.frame(body, bones, side, "palm").point,
        contact.translation,
      ) -
        (affordance.aperture ?? 0) / 2,
    );
  }

  /**
   * How far a rein-kind contact's skin is from the palm's own contact point, metres, as the seated rider specs check a rein.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param side The hand.
   * @param contact The contact's world frame.
   * @param affordance The contact's declaration.
   * @returns The miss, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure and its unit.
   * @evidence contracts/development/implementation.md#principled-implementation The rein's skin lies along the contact's +Y by its radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One palm offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanHand.offset`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources None retained.
   */
  export function rein(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    contact: IAutoMovieTransform,
    affordance: IAutoMovieAffordance,
  ): number {
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const palm: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, side, "palm").point,
      ),
    );
    return Vector3.distance(
      palm,
      Vector3.addScaled(
        contact.translation,
        Quaternion.rotateVector(contact.rotation, { x: 0, y: 1, z: 0 }),
        (affordance.aperture ?? 0) / 2,
      ),
    );
  }
}
