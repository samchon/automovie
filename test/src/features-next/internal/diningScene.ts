import {
  createBowl,
  createChopsticks,
  createFoodPortion,
  createFork,
  createTableKnife,
} from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { diningTable } from "../../features/internal/diningTable";
import { everydayTake } from "../../features/internal/everydayTake";

/**
 * The chopsticks and the knife-and-fork scenes of
 * `test_motion_dining_utensils_*`, staged as those specs stage them, so the
 * pickUp and eatWith action units enter their actions at the same table: the
 * props at the originals' places for a diner of a dominant hand, each prop's
 * model by its subject, and the take without the whole-take verdict, which
 * stays the originals'.
 */
export namespace diningScene {
  /** A diner's hands. */
  export interface IHands {
    /** The dominant hand. */
    side: AutoMovieHumanSide;

    /** The other hand. */
    other: AutoMovieHumanSide;

    /**
     * World `x` of the dominant side: world +X is the seated diner's left, so
     * -1 for a right hand.
     */
    sign: number;
  }

  /** One seated scene for a diner of a dominant hand. */
  export interface IScene extends IHands {
    /** The chair and the table. */
    stage: diningTable.IStage;

    /** The props, as the original spec places them. */
    props: IAutoMovieMotionHumanProp[];

    /** Each prop's model by its subject. */
    models: Record<string, everydayTake.IPosable>;
  }

  /** The chopsticks scene of `test_motion_dining_utensils_chopsticks`. */
  export interface IChopsticks extends IScene {
    /** The rice portion's place on the table top. */
    rice: IAutoMovieVector3;

    /**
     * The seated chin's height, metres: the standing shoulder less the thigh's
     * drop (0.3 m), as the original reads it.
     */
    chin: number;
  }

  /** The knife-and-fork scene of `test_motion_dining_utensils_cut`. */
  export interface ICut extends IScene {
    /** The plate's place on the table top, under the steak. */
    plate: IAutoMovieVector3;

    /** The cut line's across offset on the steak's top, metres. */
    edge: number;
  }

  /** The chopsticks scene for a dominant hand. */
  export function chopsticks(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IChopsticks {
    const stage: diningTable.IStage = diningTable.stage();
    const sign: number = side === "right" ? -1 : 1;
    const rice: IAutoMovieVector3 = diningTable.on(stage, sign * 0.15, 0.08);
    const models: Record<string, everydayTake.IPosable> = {
      rice: createFoodPortion({ id: "rice", kind: "steak" }),
      morsel: createFoodPortion({ id: "morsel", kind: "morsel" }),
      sticks: createChopsticks({ id: "sticks" }),
      bowl: createBowl({ id: "bowl" }),
    };
    return {
      ...hands(side),
      stage,
      rice,
      chin: body.measure.shoulderHeight - 0.3,
      models,
      props: [
        ...stage.props,
        everydayTake.prop("rice", models.rice!, rice, undefined, true),
        everydayTake.prop("morsel", models.morsel!, {
          ...rice,
          y: rice.y + 0.02,
        }),
        everydayTake.prop(
          "sticks",
          models.sticks!,
          diningTable.on(stage, sign * 0.18, 0.07),
        ),
        everydayTake.prop(
          "bowl",
          models.bowl!,
          diningTable.on(stage, -sign * 0.2, 0.12),
        ),
      ],
    };
  }

  /** The knife-and-fork scene for a dominant hand. */
  export function cut(side: AutoMovieHumanSide): ICut {
    const stage: diningTable.IStage = diningTable.stage();
    const sign: number = side === "right" ? -1 : 1;
    const plate: IAutoMovieVector3 = diningTable.on(stage, sign * 0.04, 0.08);
    const models: Record<string, everydayTake.IPosable> = {
      steak: createFoodPortion({ id: "steak", kind: "steak" }),
      piece: createFoodPortion({ id: "piece", kind: "piece" }),
      knife: createTableKnife({ id: "knife" }),
      fork: createFork({ id: "fork" }),
    };
    return {
      ...hands(side),
      stage,
      plate,
      edge: sign * 0.06,
      models,
      props: [
        ...stage.props,
        everydayTake.prop("steak", models.steak!, plate, undefined, true),

        // The piece abuts the steak's end on the knife's side.
        everydayTake.prop("piece", models.piece!, {
          ...plate,
          x: plate.x + sign * (0.06 + 0.0125),
        }),
        everydayTake.prop(
          "knife",
          models.knife!,
          diningTable.on(stage, sign * 0.18, 0.07),
        ),
        everydayTake.prop(
          "fork",
          models.fork!,
          diningTable.on(stage, -sign * 0.18, 0.07),
        ),
      ],
    };
  }

  /**
   * The take of a chain, with every shipped law, and no verdict asserted: a
   * unit reads its own action's bounds (`motionActionUnit.bounds`).
   *
   * @param seed The take's seed, the original's for the same body.
   * @param body The diner's body.
   * @param props The scene's props.
   * @param chain The diner's chain, subject `actor`.
   * @returns The take.
   */
  export function perform(
    seed: string,
    body: IAutoMovieMotionHumanBody,
    props: readonly IAutoMovieMotionHumanProp[],
    chain: IAutoMovieMotionHumanChain,
  ): HumanPerformance {
    return everydayTake.perform(
      `dining-${seed}`,
      body,
      props,
      chain,
      Object.values(HUMAN_LEXICON).flat(),
    );
  }

  /** The hands of a diner whose dominant hand is `side`. */
  function hands(side: AutoMovieHumanSide): IHands {
    return {
      side,
      other: side === "right" ? "left" : "right",
      sign: side === "right" ? -1 : 1,
    };
  }
}
