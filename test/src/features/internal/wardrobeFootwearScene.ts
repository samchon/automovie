import {
  type AutoMovieArchetype,
  createSeat,
  createStageFootwear,
} from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { wardrobeFilm } from "./wardrobeFilm";

/**
 * The seated footwear exchange's staging from
 * `test_motion_dress_wardrobe_footwear`, as that spec stages it, so
 * `test_motion_action_pick_up` takes the footwear up from the same table top.
 */
export namespace wardrobeFootwearScene {
  /**
   * How far the wrist rises after taking the footwear up, metres: the
   * original's.
   */
  export const LIFT: number = 0.04;

  /** A footwear model. */
  export type Footwear = AutoMovieArchetype<
    createStageFootwear.Affordance,
    createStageFootwear.Dimension
  >;

  /** One case of the original: a cast, the raised foot and the footwear's kind. */
  export interface ICase {
    /** The case's label. */
    label: string;

    /** The cast. */
    cast: motionHumanBody.Name;

    /** The foot the footwear goes on. */
    side: AutoMovieHumanSide;

    /** The footwear's kind. */
    kind: createStageFootwear.Kind;
  }

  /** A shoe and a sock on two casts and opposite feet, as the original. */
  export const CASES: readonly ICase[] = [
    {
      label: "shoe, m-average",
      cast: "m-average",
      side: "right",
      kind: "shoe",
    },
    { label: "sock, f-small", cast: "f-small", side: "left", kind: "sock" },
  ];

  /** One case's scene: the body, the hand, the props and where they stand. */
  export interface IScene {
    /** The performer's body. */
    body: IAutoMovieMotionHumanBody;

    /** The hand that pulls the footwear on: the opposite one, as the original. */
    hand: AutoMovieHumanSide;

    /** The footwear's model. */
    model: Footwear;

    /** The chair's seat. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /**
     * Where the footwear rests on its table top before and after, the
     * original's `touch`.
     */
    touch: IAutoMovieRigidTransform;

    /** The footwear and the chair. */
    props: IAutoMovieMotionHumanProp[];
  }

  /** A case's scene, as the original stages it. */
  export function scene(c: ICase): IScene {
    // The opposite hand pulls the footwear on: in the seated lean the raised
    // thigh lies under the same-side shoulder, so that arm would pass through it.
    const hand: AutoMovieHumanSide = c.side === "right" ? "left" : "right";
    const sign: number = hand === "left" ? 1 : -1;
    const model: Footwear = createStageFootwear({
      id: "footwear",
      kind: c.kind,
      length: 0.34,
      width: 0.15,
      height: 0.045,
    });
    const chair: AutoMovieArchetype<
      createSeat.Affordance,
      createSeat.Dimension
    > = createSeat({
      kind: "office",
      seatHeight: c.cast === "f-small" ? 0.39 : 0.43,
    });
    const chairAt: IAutoMovieRigidTransform = wardrobeFilm.placement(
      0,
      0,
      -0.25,
    );
    const touch: IAutoMovieRigidTransform = wardrobeFilm.placement(
      sign * 0.34,
      0.73,
      0.25,
    );
    return {
      body: motionHumanBody(c.cast),
      hand,
      model,
      seat: HumanObject.seat(chair, chairAt),
      touch,
      props: [
        HumanObject.prop("footwear", model, touch),
        HumanObject.prop("chair", chair, chairAt),
      ],
    };
  }

  /**
   * The take of a chain on a scene, the wardrobe law registered, as the
   * original.
   */
  export function perform(
    s: IScene,
    chain: IAutoMovieMotionHumanChain,
  ): HumanPerformance {
    return wardrobeFilm.stage(s.body, s.props, chain.node);
  }

  /**
   * The chain's first step, the footwear taken up from its table top, as the
   * original.
   */
  export function pickUp(s: IScene): IAutoMovieMotionHumanChain {
    return HumanChain.subject("actor").pickUp({
      prop: "footwear",
      handle: "hold",
      hand: s.hand,
      lift: LIFT,
    });
  }
}
