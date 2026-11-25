import { Quaternion, Transform } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGesture,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { motionHandleShapes } from "./motionHandleShapes";

const { HumanUpperRows } = AutoMovieMotionHumanGesture;

/**
 * The cast the upper-body phrase specs share (#3361): the rows of
 * `HumanUpperRows`, the region each row with an open target is given, the rows
 * that move a held prop, and one performance of a row after a quiet stance or
 * after picking up a stick.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member gives and the stick's points.
 * @evidence contracts/development/design.md#principled-representation The rows, two tables keyed by row name and one performance builder through the public chain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the phrase specs share and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The performance goes through `HumanPerformance` and `HumanChain`; nothing is posed by hand.
 */
export namespace motionUpperPhrase {
  /** The rows of `HumanUpperRows`, the phrase law among them. */
  export const ROWS: IAutoMovieMotionHumanActionLaw<never>[] =
    Object.values(HumanUpperRows);

  /**
   * The region given to each row whose target is open, written for the right
   * hand.
   */
  export const OPEN: Record<string, AutoMovieHumanoidRegion> = {
    pointAt: "kneeRight",
    tapOn: "thighFrontRight",
    pressOn: "chestRight",
    rubOn: "thighFrontRight",
    strokeDown: "upperArmLeft",
    wipeAcross: "thighFrontRight",
    hammerStrokes: "thighFrontRight",
    sawStrokes: "thighFrontRight",
    stirStrokes: "thighFrontRight",
    patOn: "thighFrontRight",
    squeezeOn: "upperArmLeft",
    holdOn: "upperArmLeft",
    scratchOn: "thighFrontRight",
  };

  /** The rows that move a held prop: the performer first picks up a stick. */
  export const HELD: readonly string[] = [
    "hammerStrokes",
    "sawStrokes",
    "stirStrokes",
    "hatOnHead",
    "phoneToEar",
    "teethBrushing",
    "hairCombing",
    "drinkFrom",
    "eatWith",
  ];

  /**
   * The stick's end, 12 cm along its +Y from the handle, as both a vessel's lip
   * and a utensil's face for the rows that bring a held point.
   */
  export const END: IAutoMovieVector3 = { x: 0, y: 0.12, z: 0 };

  /**
   * Perform one law after a quiet stance, or after picking up the stick placed
   * ahead of the hand's side at the waist.
   *
   * @param body The body.
   * @param law The law's name.
   * @param params Its parameters.
   * @param pick Whether the stick is picked up first.
   * @param hand The hand that picks it up; the right when absent.
   * @returns The performance.
   */
  export function perform(
    body: IAutoMovieMotionHumanBody,
    law: string,
    params: object,
    pick: boolean,
    hand: AutoMovieHumanSide = "right",
  ): IAutoMovieMotionHumanPerformance {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const affordances: IAutoMovieAffordance[] = [
      {
        id: "handle",
        kind: "handle",
        frame: Transform.identity(),
        extent: null,
        radius: 0.015,
      },
      ...(["lip", "face"] as const).map((id: string) => ({
        id,
        kind: "surface" as const,
        frame: { ...Transform.identity(), translation: END },
        extent: null,
      })),
    ];
    const stick: IAutoMovieMotionHumanProp = {
      subject: "stick",
      frame: {
        position: {
          x: hand === "right" ? -m.shoulderHalfWidth : m.shoulderHalfWidth,
          y: m.waistHeight,
          z: 0.6 * (m.upperArm + m.forearm),
        },
        rotation: Quaternion.identity(),
      },
      points: {},
      affordances,
      shapes: motionHandleShapes(affordances),
    };
    return new HumanPerformance({
      seed: "upper",
      laws: ROWS,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [stick],
      composition: (pick
        ? HumanChain.subject("a").pickUp({
            prop: "stick",
            handle: "handle",
            hand,
          })
        : HumanChain.subject("a").stand({ hold: 0.3 })
      ).registered(law, params).node,
    });
  }
}
