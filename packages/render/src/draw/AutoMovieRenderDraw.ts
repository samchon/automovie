import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureLayout,
  IAutoMovieCaptureSubject,
  IAutoMovieCaptureTime,
  IAutoMovieDrawCall,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";

import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { planAutoMovieDrawCall } from "./internal/planAutoMovieDrawCall.js";
import { planAutoMovieDrawLayers } from "./internal/planAutoMovieDrawLayers.js";
import { planAutoMovieDrawPicture } from "./internal/planAutoMovieDrawPicture.js";

/** Public capture and picture planning operations owned by Render's draw topic. */
export namespace AutoMovieRenderDraw {
  /** The capture-plan fields needed to plan one draw page call. */
  export interface IPlanCallProps {
    /** The width and height of the capture subject. */
    subject: Pick<IAutoMovieCaptureSubject, "width" | "height">;
    /** The times covered by the capture plan, in seconds. */
    times: readonly Pick<IAutoMovieCaptureTime, "seconds">[];
    /** The planned raster layout of the capture cell. */
    layout: Pick<IAutoMovieCaptureLayout, "cell">;
  }

  /**
   * Turn one planned capture cell into the call a draw page answers: the
   * cell's second, view and inspection request, subject raster, framing span,
   * and label scale. Every planned second frames a fitted view, so it keeps one
   * camera across the capture; a view with @follow frames on the cell's own
   * second. The call's pass remains the request's shade.
   *
   * @param cell The capture cell's time, view and request.
   * @param plan The subject raster, plan times and cell layout.
   * @returns The draw call for the cell.
   */
  export function planCall(
    cell: Pick<IAutoMovieCaptureCell, "time" | "view" | "request">,
    plan: IPlanCallProps,
  ): IAutoMovieDrawCall {
    return planAutoMovieDrawCall(cell, plan);
  }

  /**
   * Return the layers a film picture composites at a second, outgoing first,
   * or null for the live placement alone. The result comes from engine
   * playbackLayersAt on the subject's sequence and cut. It is null when either
   * is absent and outside a transition, where one live layer has weight 1.
   *
   * If an outgoing layer needs placing and the subject has no seekShot, this
   * throws an error naming the subject, second, entry, transition kind and
   * missing placer.
   *
   * @param name The subject's name, included in placement errors.
   * @param scene The subject's sequence, cut and optional seekShot.
   * @param seconds The second drawn on the playback clock.
   * @returns Transition layers, or null for a single live placement.
   */
  export function planLayers(
    name: string,
    scene: Pick<IAutoMovieDrawScene, "sequence" | "cut" | "seekShot">,
    seconds: number,
  ): IAutoMoviePlaybackLayer[] | null {
    return planAutoMovieDrawLayers(name, scene, seconds);
  }

  /** The transition layers and placement selected for a picture. */
  export interface IPlanPicture {
    /** Transition layers, or null outside a transition. */
    layers: IAutoMoviePlaybackLayer[] | null;
    /** The layer shown most, or null outside a transition. */
    shown: IAutoMoviePlaybackLayer | null;
    /** The entry and shot placed, or null without a cut. */
    placed: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null;
  }

  /**
   * Plan a picture's layers, the layer shown most (greater weight, live on a
   * tie), and the entry used for placement. Outside a transition, the shown
   * layer is null; placement uses the live entry at the second, or null when
   * there is no cut. Draw pages, capture and Viewer use this same plan so the
   * picture and its records follow the same shot.
   *
   * Throws the missing-seekShot error from planLayers when an outgoing
   * shot cannot be placed.
   *
   * @param name The subject's name, included in placement errors.
   * @param scene The subject's sequence, cut and optional seekShot.
   * @param seconds The second drawn on the playback clock.
   * @returns The transition layers, shown layer and placed entry.
   */
  export function planPicture(
    name: string,
    scene: Pick<IAutoMovieDrawScene, "sequence" | "cut" | "seekShot">,
    seconds: number,
  ): IPlanPicture {
    return planAutoMovieDrawPicture(name, scene, seconds);
  }
}
