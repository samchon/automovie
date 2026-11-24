import {
  type AutoMovieArchetype,
  createStageJacket,
} from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "./everydayTake";
import { motionHumanBody } from "./motionHumanBody";
import { wardrobeFilm } from "./wardrobeFilm";

/**
 * The coat scene's dresser from `test_motion_get_dressed_coat_partner`, staged
 * as that spec stages it (its cases, its stage jacket and where the jacket
 * lies), so `test_motion_action_pick_up` takes the jacket up by its back collar
 * as that dresser does.
 */
export namespace coatPartnerScene {
  /** How far the dresser's wrist is asked to rise after its grasp, metres. */
  export const LIFT: number = 0.02;

  /** A jacket model. */
  export type JacketModel = AutoMovieArchetype<
    createStageJacket.Affordance,
    createStageJacket.Dimension
  >;

  /** One case of the original: who coats whom, with which hand. */
  export interface ICase {
    /** The dresser's body. */
    dresser: motionHumanBody.Name;

    /** The partner's body. */
    dressed: motionHumanBody.Name;

    /** The hand that holds the jacket. */
    hand: AutoMovieHumanSide;

    /** The case, for failures. */
    label: string;
  }

  /**
   * The original's cases: the average man coating the small woman and the
   * reverse, with either holding hand.
   */
  export const CASES: readonly ICase[] = [
    caseOf("m-average", "f-small", "right"),
    caseOf("m-average", "f-small", "left"),
    caseOf("f-small", "m-average", "right"),
    caseOf("f-small", "m-average", "left"),
  ];

  /** One case, labelled as the original labels it. */
  function caseOf(
    dresser: motionHumanBody.Name,
    dressed: motionHumanBody.Name,
    hand: AutoMovieHumanSide,
  ): ICase {
    return {
      dresser,
      dressed,
      hand,
      label: `${dresser} coats ${dressed} (${hand} hand)`,
    };
  }

  /**
   * The stage jacket the wardrobe specifications use.
   *
   * @returns The model.
   */
  export function jacket(): JacketModel {
    return createStageJacket({
      id: "jacket",
      width: 0.39,
      depth: 0.3,
      sleeveWidth: 0.19,
      sleeveLength: 0.04,
      length: 0.48,
      zipTravel: 0.15,
    });
  }

  /**
   * The dresser alone taking up the jacket by its back collar, as the
   * original's dresser takes it before the coat.
   *
   * @param a The dresser's body.
   * @param model The jacket.
   * @param hand The holding hand.
   * @returns The take.
   */
  export function pickUp(
    a: IAutoMovieMotionHumanBody,
    model: JacketModel,
    hand: AutoMovieHumanSide,
  ): HumanPerformance {
    return new HumanPerformance({
      seed: "coat-partner",
      performers: [performer("a", a, -0.45)],
      props: [prop(model, hand)],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .pickUp({ prop: "jacket", handle: "backCollar", hand, lift: LIFT })
        .node,
    });
  }

  /** A trained performer facing +Z at a depth. */
  function performer(
    subject: string,
    body: IAutoMovieMotionHumanBody,
    z: number,
  ): everydayTake.IPerformer {
    return {
      subject,
      body,
      at: { x: 0, y: 0, z },
      yaw: 0,
      proficiency: { level: "trained" },
    };
  }
  /** The jacket on the holding hand's side, as the original places it. */
  function prop(
    model: JacketModel,
    hand: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanProp {
    const sign: number = hand === "left" ? 1 : -1;
    return HumanObject.prop(
      "jacket",
      model,
      wardrobeFilm.placement(0.1 * sign + 0.25 * sign, 1.06, -0.25),
    );
  }
}
