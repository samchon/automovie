import {
  type AutoMovieArchetype,
  createSeat,
  createStageFootwear,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionHumanBody } from "../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../features/internal/wardrobeFilm";

/**
 * The seated footwear exchange of `test_motion_dress_wardrobe_footwear`, staged
 * as that spec stages it, with its readers, so each action of the exchange is a
 * unit of its own: the footwear's pose across a custody change and the foot's
 * heel and toe in the opening.
 */
export namespace wardrobeFootwearScene {
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
      lift: 0.04,
    });
  }

  /** The foot's heel and toe in the footwear's opening frame at a second. */
  export function inOpening(
    s: IScene,
    film: HumanPerformance,
    side: AutoMovieHumanSide,
    time: number,
  ): IAutoMovieVector3[] {
    const opening: IAutoMovieAffordance = s.model.affordance("opening");
    const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      s.body,
      film.bones("actor", time),
      side,
    );
    return [sockets[0]!, sockets[2]!].map(
      ({ point }: IAutoMovieMotionHumanFoot.ISocket): IAutoMovieVector3 =>
        wardrobeFilm.localSite(film.prop("footwear", time), opening, point),
    );
  }

  /**
   * The original's custody check at one boundary: the footwear keeps its pose
   * across it, within 2 mm and 0.005 rad.
   */
  export function custody(
    checks: motionComplaints.IGatherer,
    label: string,
    film: HumanPerformance,
    boundary: number,
  ): void {
    const before: IAutoMovieRigidTransform = film.prop(
      "footwear",
      boundary - 0.001,
    );
    const after: IAutoMovieRigidTransform = film.prop(
      "footwear",
      boundary + 0.001,
    );
    checks.check(
      `${label}: the footwear keeps its pose across custody (${(Vector3.distance(before.position, after.position) * 1000).toFixed(2)} mm, ${Quaternion.angle(before.rotation, after.rotation).toFixed(4)} rad)`,
      Vector3.distance(before.position, after.position) < 0.002 &&
        Quaternion.angle(before.rotation, after.rotation) < 0.005,
    );
  }
}
