import {
  createBag,
  createBowl,
  createServingTray,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { everydayTake } from "../../features/internal/everydayTake";

/**
 * The carriage scenes of `test_motion_mechanism_carriage`, staged as that spec
 * stages them, with its readers and bounds, so each carried action is a unit of
 * its own and the scenes keep only their cross-action checks.
 */
export namespace carriageScene {
  /** A worn or held prop drifts at most this on its carrier, metres. */
  export const HOLD: number = 0.005;

  /** A tray's surface stays within this of level, degrees. */
  export const LEVEL: number = 10;

  /** Wheels on the floor within this, metres. */
  export const FLOOR: number = 0.02;

  /** A strap lies over its shoulder within this, metres. */
  export const STRAP: number = 0.1;

  /** A hand change's two-handed overlap lasts at most this, seconds. */
  export const OVERLAP: number = 1.5;

  /** A towed case lies at most this ahead of the walker's hips, metres. */
  export const AHEAD: number = 0.1;

  /** The palm lies under a tray's centre within this, read level, metres. */
  export const CENTRE: number = 0.1;

  /** A doffed pack leaves its worn frame by at least this, metres. */
  export const OFF: number = 0.05;

  /** A bag is never set down: it stays above this, metres. */
  export const CARRIED: number = 0.3;

  /** Turned half round: a bag's back toward a wearer facing `+Z`. */
  const BEHIND: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };

  /**
   * A take of a scene, every shipped law registered, as the original's `play`
   * stages it, without its verdict: a unit reads the bounds of its own action
   * and an integration scene asserts the verdict itself.
   *
   * @param label The scene, for the seed.
   * @param body The carrier's body.
   * @param props The props.
   * @param chain The carrier's chain.
   * @param others Other performers.
   * @returns The take.
   */
  export function perform(
    label: string,
    body: IAutoMovieMotionHumanBody,
    props: readonly IAutoMovieMotionHumanProp[],
    chain: IAutoMovieMotionHumanChain,
    others: readonly everydayTake.IOther[] = [],
  ): HumanPerformance {
    return everydayTake.perform(
      `carriage-${label}`,
      body,
      props,
      chain,
      Object.values(HUMAN_LEXICON).flat(),
      others,
    );
  }

  /**
   * The segments of one law, in order.
   *
   * @param take The take.
   * @param law The law's name.
   * @param subject The performer.
   * @returns The segments.
   */
  export function named(
    take: HumanPerformance,
    law: string,
    subject: string = "actor",
  ): IAutoMovieMotionHumanSegment[] {
    return take
      .segments(subject)
      .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
  }

  /**
   * A prop's frame in a bone's posed frame at a second.
   *
   * @param take The take.
   * @param bone The carrier's bone.
   * @param subject The prop.
   * @param t Film seconds.
   * @returns The frame.
   */
  export function relative(
    take: HumanPerformance,
    bone: AutoMovieHumanoidBone,
    subject: string,
    t: number,
  ): IAutoMovieRigidTransform {
    return HumanPropFrame.relative(
      HumanPropFrame.bone(take.bones("actor", t).get(bone)!),
      take.prop(subject, t),
    );
  }

  /**
   * A prop's largest drift on a bone over a span, read at 24 steps.
   *
   * @param take The take.
   * @param bone The carrier's bone.
   * @param subject The prop.
   * @param from First film second.
   * @param to Last film second.
   * @returns Metres.
   */
  export function onBone(
    take: HumanPerformance,
    bone: AutoMovieHumanoidBone,
    subject: string,
    from: number,
    to: number,
  ): number {
    const rest: IAutoMovieRigidTransform = relative(take, bone, subject, from);
    let most: number = 0;
    for (let i: number = 1; i <= 24; ++i)
      most = Math.max(
        most,
        Vector3.distance(
          relative(take, bone, subject, from + ((to - from) * i) / 24).position,
          rest.position,
        ),
      );
    return most;
  }

  /**
   * A bone-local frame that puts a prop at a world frame, read off a still
   * standing body.
   */
  function offsetOn(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
    world: (b: IAutoMovieResolvedBone) => IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
    const still: HumanPerformance = everydayTake.perform(
      "carriage-rest",
      body,
      [],
      HumanChain.subject("actor").stand({ hold: 0.2, sway: 0 }),
    );
    const b: IAutoMovieResolvedBone = still.bones("actor", 0.1).get(bone)!;
    return HumanPropFrame.relative(HumanPropFrame.bone(b), world(b));
  }

  /** The airport arrival's backpack and suitcase, as the original stages them. */
  export interface IArrival {
    /** The backpack's model. */
    pack: everydayTake.IPosable;

    /** The suitcase's model. */
    case: everydayTake.IPosable;

    /** The suitcase's telescoping handle, a slider. */
    telescope: IAutoMovieAffordance;

    /** The backpack's worn frame on the chest bone. */
    worn: IAutoMovieRigidTransform;

    /** The two props. */
    props: IAutoMovieMotionHumanProp[];
  }

  /**
   * The airport arrival's props for a body.
   *
   * @param body The carrier's body.
   * @returns The props and their places.
   */
  export function arrival(body: IAutoMovieMotionHumanBody): IArrival {
    const pack: everydayTake.IPosable = createBag({
      id: "pack",
      kind: "backpack",
    });
    const suitcase: everydayTake.IPosable = createBag({
      id: "case",
      kind: "suitcase",
    });
    return {
      pack,
      case: suitcase,
      telescope: (suitcase.affordances ?? []).find(
        (a: IAutoMovieAffordance): boolean => a.id === "telescope",
      )!,
      worn: offsetOn(
        body,
        "chest",
        (b: IAutoMovieResolvedBone): IAutoMovieRigidTransform => ({
          position: Vector3.add(b.worldPosition, { x: 0, y: -0.35, z: -0.2 }),
          rotation: BEHIND,
        }),
      ),
      props: [
        // Before the right shoulder, by the hand that takes it and swings it
        // on round that side.
        everydayTake.prop(
          "pack",
          pack,
          { x: -body.measure.shoulderHalfWidth, y: 0.75, z: 0.25 },
          BEHIND,
        ),
        // Standing ahead on the left, by the hand that draws and pulls it.
        everydayTake.prop("case", suitcase, { x: 0.2, y: 0, z: 0.4 }),
      ],
    };
  }

  /**
   * The backpack taken by its strap and put on the back, as the original.
   *
   * @param chain The chain so far.
   * @param a The arrival's props.
   * @returns The chain with the pickUp and the putDown appended.
   */
  export function don(
    chain: IAutoMovieMotionHumanChain,
    a: IArrival,
  ): IAutoMovieMotionHumanChain {
    return chain
      .pickUp({ prop: "pack", handle: "rightStrap", hand: "right", lift: 0 })
      .putDown({
        prop: "pack",
        on: { bone: "chest", offset: a.worn },
        hand: "right",
      });
  }

  /**
   * The suitcase's pull handle drawn out by the stooped left hand, as the
   * original.
   *
   * @param chain The chain so far.
   * @param a The arrival's props.
   * @returns The chain with the operation appended.
   */
  export function draw(
    chain: IAutoMovieMotionHumanChain,
    a: IArrival,
  ): IAutoMovieMotionHumanChain {
    return chain.operate({
      hand: "left",
      kind: {
        kind: "slider",
        at: { kind: "prop", subject: "case", point: "telescope" },
        travel: a.telescope.travel!,
      },
    });
  }

  /**
   * The suitcase taken by its drawn pull handle, as the original.
   *
   * @param chain The chain so far.
   * @returns The chain with the pickUp appended.
   */
  export function pull(
    chain: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanChain {
    return chain.pickUp({
      prop: "case",
      handle: "pull",
      hand: "left",
      lift: 0,
    });
  }

  /**
   * The walk and the turn of the arrival, as the original.
   *
   * @param chain The chain so far.
   * @returns The chain with both walks appended.
   */
  export function walks(
    chain: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanChain {
    return chain
      .walk({ to: { x: 0, y: 0, z: 1.5 } })
      .walk({ to: { x: 1.2, y: 0, z: 2.2 } });
  }

  /**
   * The backpack off the shoulder by its strap and swung round before the body,
   * as the original.
   *
   * @param chain The chain so far.
   * @param body The carrier's body.
   * @returns The chain with the pickUp and the workHeld appended.
   */
  export function doff(
    chain: IAutoMovieMotionHumanChain,
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanChain {
    return chain
      .pickUp({ prop: "pack", handle: "rightStrap", hand: "right", lift: 0 })
      .registered("workHeld", {
        prop: "pack",
        hand: "right",
        at: {
          out: body.measure.shoulderHalfWidth + 0.05,
          up: body.measure.hipHeight + 0.1,
          forward: 0.15,
        },
        duration: 0.6,
      });
  }

  /**
   * The suitcase's wheels and its place behind the walker through walks, read
   * at 13 steps of each, as the original reads them.
   *
   * @param take The take.
   * @param walks The walks.
   * @returns The wheels' greatest height off the floor and whether the case
   *   stayed behind.
   */
  export function towed(
    take: HumanPerformance,
    walks: readonly IAutoMovieMotionHumanSegment[],
  ): ITowed {
    let wheels: number = 0;
    let behind: boolean = true;
    for (const walk of walks)
      for (let i: number = 0; i <= 12; ++i) {
        const t: number = walk.start + ((walk.end - walk.start) * i) / 12;
        const frame: IAutoMovieRigidTransform = take.prop("case", t);
        wheels = Math.max(wheels, Math.abs(frame.position.y));
        const hips: IAutoMovieResolvedBone = take
          .bones("actor", t)
          .get("hips")!;
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(
          hips.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
        behind &&=
          Vector3.dot(
            Vector3.subtract(frame.position, hips.worldPosition),
            forward,
          ) < AHEAD;
      }
    return { wheels, behind };
  }

  /** A towed suitcase's reading through walks. */
  export interface ITowed {
    /** The wheels' greatest height off the floor, metres. */
    wheels: number;

    /** Whether the case stayed behind the walker's hips throughout. */
    behind: boolean;
  }

  /**
   * The waiter's tray with a bowl mounted on it, as the original stages them.
   *
   * @returns The props.
   */
  export function trayProps(): IAutoMovieMotionHumanProp[] {
    return [
      everydayTake.prop("tray", createServingTray({ id: "tray" }), {
        x: -0.3,
        y: 1.0,
        z: 0.3,
      }),
      {
        ...everydayTake.prop("bowl", createBowl({ id: "bowl" }), {
          x: -0.3,
          y: 1.01,
          z: 0.3,
        }),
        mounted: {
          prop: "tray",
          point: "rest",
          offset: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
      },
    ];
  }

  /**
   * The tray taken on the flat palm, as the original.
   *
   * @param chain The chain so far.
   * @returns The chain with the pickUp appended.
   */
  export function lift(
    chain: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanChain {
    return chain.pickUp({
      prop: "tray",
      handle: "palm",
      hand: "right",
      lift: 0,
    });
  }

  /**
   * The tray raised level just under shoulder height, as the original.
   *
   * @param chain The chain so far.
   * @param body The carrier's body.
   * @returns The chain with the workHeld appended.
   */
  export function raise(
    chain: IAutoMovieMotionHumanChain,
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanChain {
    return chain.registered("workHeld", {
      prop: "tray",
      hand: "right",
      at: {
        out: 0.2,
        // The palm just under shoulder height, the forearm level.
        up: body.measure.shoulderHeight - 0.1,
        forward: 0.25,
        level: true,
      },
      duration: 0.5,
    });
  }

  /**
   * A prop's tilt from level at a second, degrees.
   *
   * @param take The take.
   * @param prop The prop.
   * @param t Film seconds.
   * @returns Degrees between its up and the world's.
   */
  export function tilt(
    take: HumanPerformance,
    prop: string,
    t: number,
  ): number {
    const up: IAutoMovieVector3 = Quaternion.rotateVector(
      take.prop(prop, t).rotation,
      { x: 0, y: 1, z: 0 },
    );
    return (Math.acos(Math.min(1, up.y)) * 180) / Math.PI;
  }

  /**
   * The bowl's distance from the tray's origin at a second.
   *
   * @param take The take.
   * @param t Film seconds.
   * @returns Metres.
   */
  export function bowl(take: HumanPerformance, t: number): number {
    return Vector3.distance(
      take.prop("bowl", t).position,
      take.prop("tray", t).position,
    );
  }

  /**
   * The porter's basket and the crown frame it is set on, as the original
   * stages them.
   */
  export interface IHeadLoad {
    /** The basket's model, a porter's flat tray. */
    basket: everydayTake.IPosable;

    /** The basket's worn frame on the head bone. */
    crown: IAutoMovieRigidTransform;

    /** The prop. */
    props: IAutoMovieMotionHumanProp[];
  }

  /**
   * The porter's head load for a body.
   *
   * @param body The carrier's body.
   * @returns The basket and its crown frame.
   */
  export function headLoad(body: IAutoMovieMotionHumanBody): IHeadLoad {
    // A porter's flat tray, the bundle's base, lifted by its end grip.
    const basket: everydayTake.IPosable = createServingTray({ id: "basket" });
    return {
      basket,
      crown: offsetOn(
        body,
        "head",
        (b: IAutoMovieResolvedBone): IAutoMovieRigidTransform => ({
          position: Vector3.add(b.worldPosition, { x: 0, y: 0.18, z: 0 }),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      ),
      props: [everydayTake.prop("basket", basket, { x: 0.3, y: 0.9, z: 0.3 })],
    };
  }

  /**
   * The basket taken by its end grip and set on the crown, as the original.
   *
   * @param chain The chain so far.
   * @param h The head load.
   * @returns The chain with the pickUp and the putDown appended.
   */
  export function place(
    chain: IAutoMovieMotionHumanChain,
    h: IHeadLoad,
  ): IAutoMovieMotionHumanChain {
    return chain
      .pickUp({ prop: "basket", handle: "rightHandle", hand: "right", lift: 0 })
      .putDown({
        prop: "basket",
        on: { bone: "head", offset: h.crown },
        hand: "right",
      });
  }
}
