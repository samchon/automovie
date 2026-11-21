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
import { HumanChain, HumanHand, HumanObject } from "@automovie/motions";

import { equineFordScene } from "./equineFordScene";

/**
 * The staged ford of `test_archetype_equine_ford_rider`: a horse that mounts on a level near bank, wades, swims, lands on a submerged far shelf and climbs a ramp to a dry level top where it halts, then, when a lead is laid, walks on led; its prop readers on the film clock, the rider's seat and mount chain, and the contact readers the spec measures with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged crossing, the led walk and who reads it.
 * @evidence contracts/development/design.md#principled-representation A stage record and its builders.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ford rider spec only.
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

  /** The far ramp's grade up to the dry top: the near ford's descent. */
  const GRADE: number = 0.08;

  /** Metres the climbing horse walks on the submerged shelf before the ramp. */
  const SHORE: number = 2;

  /** Metres the horse walks on the dry top before it halts. */
  const TOP: number = 4;

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
   * @evidence contracts/development/implementation.md#principled-implementation The near bank is level where the rider mounts; the far shelf is the crossing's admitted bank, and a ramp at the near ford's grade climbs from it to a dry top at the water's original ground.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Horse, footing, crossing, readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One crossing is planned; sampling is the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared ford scene supplies the water, the swim and the near ford.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The stage holds its rides for the caller.
   */
  export function stage(led?: ILed): IStage {
    const horse: Horse = createHorse(
      { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
      8,
    );
    const level: number =
      equineFordScene.WATER - equineFordScene.IMMERSION - 0.95 * 1.65;
    const shelf: number = level - 0.05;
    const authored: EquineFordPlan.IParams = equineFordScene.params(shelf);
    // The swim starts where the wading course ends and lands its own length on; the ramp starts a shore's walk further.
    const ramp: number =
      equineFordScene.FLOAT_AT + equineFordScene.LENGTH + SHORE;
    const climb: number = -shelf / GRADE;
    const planes: QuadrupedFooting.IPlane[] = authored.footing.planes.flatMap(
      (plane: QuadrupedFooting.IPlane): QuadrupedFooting.IPlane[] =>
        plane.id === "ford"
          ? [
              { ...plane, id: "bank", z: [plane.z[0], BANK], slope: { x: 0, z: 0 } },
              {
                ...plane,
                origin: { x: 0, y: 0, z: BANK },
                z: [BANK, plane.z[1]],
                slope: { x: 0, z: -0.08 },
              },
            ]
          : plane.id === "shelf"
            ? [
                { ...plane, z: [plane.z[0], ramp] },
                {
                  ...plane,
                  id: "ramp",
                  origin: { x: 0, y: shelf, z: ramp },
                  z: [ramp, ramp + climb],
                  slope: { x: 0, z: GRADE },
                },
                {
                  ...plane,
                  id: "top",
                  origin: { x: 0, y: 0, z: ramp + climb },
                  z: [ramp + climb, ramp + climb + 30],
                  slope: { x: 0, z: 0 },
                },
              ]
            : [plane],
    );
    const crossing: EquineFordPlan.IClip<string, string> = EquineFord(horse, {
      ...authored,
      footing: { planes },
      entry: {
        ...authored.entry,
        legs: [
          { kind: "straight", length: BANK },
          {
            kind: "straight",
            length: equineFordScene.FLOAT_AT - BANK,
            rise: -0.08 * (equineFordScene.FLOAT_AT - BANK),
          },
        ],
      },
      recovery: {
        ...authored.recovery,
        legs: [
          { kind: "straight", length: SHORE },
          { kind: "straight", length: climb, rise: -shelf },
          { kind: "straight", length: TOP },
        ],
      },
    });
    const local = (at: number): number =>
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
