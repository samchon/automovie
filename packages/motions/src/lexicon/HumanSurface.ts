import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanSurface,
} from "@automovie/interface";

import { HumanIceGlide } from "../carrier/HumanIceGlide";
import { HumanSnowGlide } from "../carrier/HumanSnowGlide";
import { HumanSurfaceBoard } from "../carrier/HumanSurfaceBoard";
import { measureSurfaceGlide } from "../carrier/measureSurfaceGlide";

/** The channels a surface carrier leaves to a tool action or a gaze layer. */
const YIELDS: IAutoMovieMotionHumanActionLaw["yields"] = [
  "leftArm",
  "rightArm",
  "leftHand",
  "rightHand",
  "head",
  "trunkTurn",
];

/** Preserve the supported feet and inertialize free joints at an end cut. */
const AT_END: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  any: [{ window: [1, 1], kind: "inertialize", entry: 0 }],
};

/**
 * Surface travel under the performer. The ice and snow laws own their
 * paths. A board ride reads an animated prop and keeps the entered stance
 * on it. Upper-body overlays can work during any of the three actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the two support relationships and how to layer actions on them.
 * @evidence contracts/development/design.md#principled-representation Shares one bilateral trajectory law across level ice and graded snow and reuses the deck carrier to transport fixed roots and goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Registers skate, curlDelivery, snowGlide, boardRide and the two board sport phrases.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Distinguishes surface bearing from fixed prop-local plants and leaves every law's constraints with its own planner.
 */
export namespace HumanSurface {
  /** Read a pair of displayed equipment samples against the authored surface. */
  export const measureGlide: typeof measureSurfaceGlide = measureSurfaceGlide;

  /** Glide, transfer blade supports, turn or ease to rest on level ice. */
  export const skate: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISkateParams> =
    {
      name: "skate",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanIceGlide.skate,
    };

  /** Slide on a flat leading shoe with a trailing forefoot for a curling delivery. */
  export const curlDelivery: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ICurlDeliveryParams> =
    {
      name: "curlDelivery",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanIceGlide.curl,
    };

  /** Traverse a snow plane through an edge change or a Nordic pole stroke. */
  export const snowGlide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISnowGlideParams> =
    {
      name: "snowGlide",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanSnowGlide,
    };

  /** Carry the acquired stance on a moving deck. */
  export const boardRide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.IBoardRideParams> =
    {
      name: "boardRide",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanSurfaceBoard,
    };

  /** Publish the skateboard's support cues for the independently posed deck. */
  export const SKATEBOARD: typeof HumanSurfaceBoard.SKATEBOARD =
    HumanSurfaceBoard.SKATEBOARD;

  /** Publish the surfboard's entry and transfer cues for the authored board path. */
  export const SURFBOARD: typeof HumanSurfaceBoard.SURFBOARD =
    HumanSurfaceBoard.SURFBOARD;

  /** Push, pop, land and recover on an authored skateboard track. */
  export const skateboardPhrase: typeof HumanSurfaceBoard.skateboardPhrase =
    HumanSurfaceBoard.skateboardPhrase;

  /** Enter, paddle and transfer from the palms to the surfboard stance. */
  export const surfboardPhrase: typeof HumanSurfaceBoard.surfboardPhrase =
    HumanSurfaceBoard.surfboardPhrase;
}
