import { createBag, AutoMovieArchetypeBowl, AutoMovieArchetypeServingTray } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { everydayTake } from "./everydayTake";

/**
 * The carriage scenes' staging from `test_motion_mechanism_carriage`, as that
 * spec stages them (the backpack and suitcase of the arrival, the waiter's
 * tray, the porter's head load, and the chains that take them up and put them
 * on), so `test_motion_action_pick_up` takes each up as the scenario does and
 * `test_motion_owner_out_of_reach` puts the backpack and the load on the body
 * at the scenario's own asked frames.
 */
export namespace carriageScene {
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
   * The waiter's tray with a bowl mounted on it, as the original stages them.
   *
   * @returns The props.
   */
  export function trayProps(): IAutoMovieMotionHumanProp[] {
    return [
      everydayTake.prop("tray", AutoMovieArchetypeServingTray.create({ id: "tray" }), {
        x: -0.3,
        y: 1.0,
        z: 0.3,
      }),
      {
        ...everydayTake.prop("bowl", AutoMovieArchetypeBowl.create({ id: "bowl" }), {
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
    const basket: everydayTake.IPosable = AutoMovieArchetypeServingTray.create({ id: "basket" });
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
