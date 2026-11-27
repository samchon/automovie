import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanMedium,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanSurface,
} from "@automovie/interface";

import { HumanIceGlide } from "../../carrier/internal/HumanIceGlide";
import { HumanMediumWalk } from "../../carrier/internal/HumanMediumWalk";
import { HumanRoundaboutPush } from "../../carrier/internal/HumanRoundaboutPush";
import { HumanSeesawRide } from "../../carrier/internal/HumanSeesawRide";
import { HumanSupportStep } from "../../carrier/internal/HumanSupportStep";
import { HumanSurfaceBoard } from "../../carrier/internal/HumanSurfaceBoard";
import { HumanSwingLeap } from "../../carrier/internal/HumanSwingLeap";
import { HumanSwingPump } from "../../carrier/internal/HumanSwingPump";
import { measureSurfaceGlide } from "../../carrier/internal/measureSurfaceGlide";
import { planSnowGlide } from "../../carrier/snow/internal/planSnowGlide";
import { swungArms } from "../../carrier/internal/swungArms";

/*
 * The channels a surface carrier leaves to a tool action or a gaze layer.
 */
const YIELDS: IAutoMovieMotionHumanActionLaw["yields"] = [
  "leftArm",
  "rightArm",
  "leftHand",
  "rightHand",
  "head",
  "trunkTurn",
];

/*
 * Preserve the supported feet and inertialize free joints at an end cut.
 */
const AT_END: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  any: [{ window: { start: 1, end: 1 }, kind: "inertialize", entry: 0 }],
};

/*
 * Surface travel under the performer. The ice and snow laws own their paths. A
 * board ride reads an animated prop and keeps the entered stance on it.
 * Upper-body overlays can work during any of the three actions.
 */
export namespace HumanSurface {
  /*
   * Read a pair of displayed equipment samples against the authored surface.
   */
  export const measureGlide: typeof measureSurfaceGlide = measureSurfaceGlide;

  /*
   * Glide, transfer blade supports, turn or ease to rest on level ice.
   */
  export const skate: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISkateParams> =
    {
      name: "skate",
      interrupts: AT_END,
      yields: YIELDS,
      plan: (context: Parameters<typeof HumanIceGlide.skate>[0]) =>
        swungArms(HumanIceGlide.skate(context), context.body),
    };

  /*
   * Slide on a flat leading shoe with a trailing forefoot for a curling
   * delivery.
   */
  export const curlDelivery: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ICurlDeliveryParams> =
    {
      name: "curlDelivery",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanIceGlide.curl,
    };

  /*
   * Traverse a snow plane through an edge change or a Nordic pole stroke.
   */
  export const snowGlide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISnowGlideParams> =
    {
      name: "snowGlide",
      interrupts: AT_END,
      yields: YIELDS,
      // The pole hand is the stroke's planned arm; only the other hangs.
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISnowGlideParams>,
      ) =>
        swungArms(
          planSnowGlide(context),
          context.body,
          (["left", "right"] as const).filter(
            (side: AutoMovieHumanSide): boolean =>
              context.params.nordic?.hand !== side,
          ),
        ),
    };

  /*
   * Carry the acquired stance on a moving deck.
   */
  export const boardRide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.IBoardRideParams> =
    {
      name: "boardRide",
      interrupts: AT_END,
      yields: YIELDS,
      plan: (context: Parameters<typeof HumanSurfaceBoard>[0]) =>
        swungArms(HumanSurfaceBoard(context), context.body),
    };

  /*
   * Publish the skateboard's support cues for the independently posed deck.
   */
  export const SKATEBOARD: typeof HumanSurfaceBoard.SKATEBOARD =
    HumanSurfaceBoard.SKATEBOARD;

  /*
   * Publish the surfboard's entry and transfer cues for the authored board
   * path.
   */
  export const SURFBOARD: typeof HumanSurfaceBoard.SURFBOARD =
    HumanSurfaceBoard.SURFBOARD;

  /*
   * Push, pop, land and recover on an authored skateboard track.
   */
  export const skateboardPhrase: typeof HumanSurfaceBoard.skateboardPhrase = {
    ...HumanSurfaceBoard.skateboardPhrase,
    plan: (
      context: Parameters<typeof HumanSurfaceBoard.skateboardPhrase.plan>[0],
    ) =>
      swungArms(HumanSurfaceBoard.skateboardPhrase.plan(context), context.body),
  };

  /*
   * Enter, paddle and transfer from the palms to the surfboard stance.
   */
  export const surfboardPhrase: typeof HumanSurfaceBoard.surfboardPhrase =
    HumanSurfaceBoard.surfboardPhrase;

  /*
   * Pump a swing from its seat, leaning back on the forward swing and tucking
   * on the backward one.
   */
  export const swingPump: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlayground.ISwingPumpParams> =
    {
      name: "swingPump",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanSwingPump,
    };

  /*
   * Ride a seesaw seat with the feet on the ground at the low end.
   */
  export const seesawRide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlayground.ISeesawRideParams> =
    {
      name: "seesawRide",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanSeesawRide,
    };

  /*
   * Run alongside a roundabout with a hand on its moving grab bar.
   */
  export const roundaboutPush: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlayground.IRoundaboutPushParams> =
    {
      name: "roundaboutPush",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanRoundaboutPush,
    };

  /*
   * Leap off a moving swing seat on its velocity and land standing.
   */
  export const swingLeap: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlayground.ISwingLeapParams> =
    {
      name: "swingLeap",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanSwingLeap,
    };

  /*
   * Step from one support onto another, either of which may move.
   */
  export const supportStep: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISupportStepParams> =
    {
      name: "supportStep",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanSupportStep,
    };

  /*
   * Walk through water, snow, sand or mud, or into a steady wind.
   */
  export const mediumWalk: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanMedium.IWalkParams> =
    {
      name: "mediumWalk",
      interrupts: AT_END,
      yields: YIELDS,
      plan: HumanMediumWalk,
    };

  /*
   * The swing angle one seated pumping turn adds for a body
   * (`HumanSwingPump.increment`).
   */
  export const pumpIncrement: typeof HumanSwingPump.increment =
    HumanSwingPump.increment;
}
