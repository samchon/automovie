import type { IGalleryCatalogue } from "./structures/IGalleryCatalogue";
import type { IGalleryRequest } from "./structures/IGalleryRequest";
import type { IGalleryView } from "./structures/IGalleryView";

/**
 * The one boundary between the gallery page and the AutoMovie packages.
 *
 * The page imports no `@automovie/*` package. It asks the adapter for the
 * catalogue, hands it a canvas, and asks it to show one subject at a time.
 */
export interface IGalleryAdapter {
  /** Everything the gallery can show, read from the packages. */
  catalogue: IGalleryCatalogue;

  /**
   * Start drawing into a canvas.
   *
   * @param canvas The canvas the scene is drawn on.
   * @param labels The element laid over the canvas that the affordance ids are placed in.
   * @returns The stage.
   */
  mount(canvas: HTMLCanvasElement, labels: HTMLElement): IGalleryAdapter.IStage;
}
export namespace IGalleryAdapter {
  /** A mounted drawing. */
  export interface IStage {
    /**
     * Build a subject and draw it in place of the one shown.
     *
     * @param request What to show.
     * @param frame Whether to put the camera back on the whole subject; false keeps the view while a seed or an articulation changes.
     * @returns What was built.
     * @throws {Error} When the packages refuse the request, with their message.
     */
    show(request: IGalleryRequest, frame: boolean): Promise<IGalleryView>;

    /**
     * Turn the camera about the subject.
     *
     * @param azimuth Degrees about the vertical axis, added to the current view.
     * @param elevation Degrees above the horizon, added to the current view.
     * @param zoom The factor the distance is multiplied by.
     */
    orbit(azimuth: number, elevation: number, zoom: number): void;

    /**
     * Put the camera on a named side of the subject.
     *
     * @param view The side.
     */
    view(view: View): void;

    /** Stop drawing and release the scene and its renderer. */
    unmount(): void;
  }

  /** The named views. */
  export type View = "front" | "back" | "left" | "right" | "top" | "quarter";
}
