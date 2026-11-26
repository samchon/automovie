import type {
  IAutoMovieInspectionRequest,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";
import { AutoMovieTransitionDisplays, type IAutoMovieDrawScene, AutoMovieRenderDraw } from "@automovie/render";
import type * as THREE from "three";

/**
 * The inspector's placement of a subject at a painted second and its half of a
 * film picture inside a transition, so the Viewer paints the frame and keeps
 * the records the draw page delivers and captures at the same second.
 *
 * `place` plans the second by `AutoMovieRenderDraw.planPicture` and places the shot
 * the picture shows most of last, by `seekShot` when it is a transition's
 * outgoing shot and by `seek` otherwise, so the mount's diagnostics, marks,
 * camera and every non-film picture follow that shot. For a plain `beauty`
 * request on a WebGL compositor, the condition under which the draw page
 * composites, it first places, paints and holds every other layer of positive
 * weight on its own entry's clock, the outgoing shot in slot 0 and the live
 * entry in slot 1, running the subject's `beforeDraw` after each placement. A
 * layer of weight 0 is neither painted nor held; when it is the shown layer, it
 * is still placed for the frame's records. `finish`, in the mount's paint after
 * the shown layer's records, paints the shown layer when it has weight, holds
 * it, and composites the held layers by their weights through
 * `AutoMovieTransitionDisplays`; a picture none of whose layers has weight, a
 * fade's midpoint, is the cleared canvas. The witness cubes then go to
 * `overlay` and `over` draws them over the composite at full strength. Any
 * other picture is painted by the mount as before and `finish` does nothing.
 *
 * The Viewer paints one sample of each layer with the film's indirect shading,
 * through `AutoMovieInspectorBeauty`, as it does outside transitions, so a
 * subject whose optics set `samples` differs from delivery by its shutter and
 * lens, not by its transitions.
 */
export class AutoMovieInspectorTransition {
  /** The held layers of the planned picture and its overlay. */
  private readonly displays_: AutoMovieTransitionDisplays =
    new AutoMovieTransitionDisplays();

  /** The layers of the picture being composited, or null for one layer. */
  private layers_: IAutoMoviePlaybackLayer[] | null = null;

  /** The shown layer of the planned second, or null outside a transition. */
  private shown_: IAutoMoviePlaybackLayer | null = null;

  /** The compositor of the picture being painted, or null. */
  private compositor_: THREE.WebGLRenderer | null = null;

  /** Whether `dispose` ran, after which nothing is painted or held. */
  private disposed_: boolean = false;

  /** Whether the picture being painted composites a transition's layers. */
  public get composites(): boolean {
    return this.layers_ !== null;
  }

  /** Whether the shown layer was placed by `seekShot`, off the film clock. */
  public get byShot(): boolean {
    return this.shown_ !== null && !this.shown_.live;
  }

  /** The scene a composited picture's witness cubes are attached to. */
  public get overlay(): THREE.Scene {
    return this.displays_.overlay;
  }

  /**
   * Plan the picture at `seconds`, place, paint and hold every other layer of a
   * composited transition, and place the shown layer last. Resolves once the
   * shown layer is ready; a refused plan throws at once.
   */
  public async place(props: {
    /** The subject's name, which a refusal names. */
    name: string;

    /** The created subject. */
    instance: IAutoMovieDrawScene;

    /** The inspection the picture is drawn with. */
    request: IAutoMovieInspectionRequest;

    /** The WebGL renderer that composites, or null when there is none. */
    compositor: THREE.WebGLRenderer | null;

    /** The second painted. */
    seconds: number;

    /** Paint the placed scene's beauty picture onto the canvas. */
    paint: () => void;
  }): Promise<void> {
    const { instance, seconds, compositor }: typeof props = props;
    const plan: ReturnType<typeof AutoMovieRenderDraw.planPicture> =
      AutoMovieRenderDraw.planPicture(props.name, instance, seconds);
    this.shown_ = plan.shown;
    this.layers_ =
      compositor !== null && AutoMovieRenderDraw.isAutoMoviePlainBeautyRequest(props.request)
        ? plan.layers
        : null;
    this.compositor_ = compositor;
    for (const layer of this.drawn()) {
      if (layer === this.shown_) continue;
      await AutoMovieRenderDraw.placeAutoMovieDrawLayer(props.name, instance, layer, seconds);

      // A mount disposed during the placement paints and holds nothing; the
      // subject's render-target work runs after the placement, as the draw
      // page runs it.
      if (this.disposed_) return;
      instance.beforeDraw?.(compositor!, seconds);
      props.paint();
      this.displays_.hold(compositor!, slotOf(layer));
    }
    await AutoMovieRenderDraw.placeAutoMovieDrawLayer(props.name, instance, this.shown_, seconds);
  }

  /**
   * Composite a planned transition after the shown layer's records: paint the
   * shown layer through `paint` when it has weight, hold it and composite the
   * held layers. Returns whether it composited; otherwise the mount paints.
   */
  public finish(paint: () => void): boolean {
    const layers: IAutoMoviePlaybackLayer[] | null = this.layers_;
    const renderer: THREE.WebGLRenderer | null = this.compositor_;
    if (layers === null || renderer === null) return false;
    if (this.shown_!.weight > 0) {
      paint();
      this.displays_.hold(renderer, slotOf(this.shown_!));
    }

    // A fade's midpoint shows no shot: the cleared canvas.
    const drawn: IAutoMoviePlaybackLayer[] = this.drawn();
    if (drawn.length === 0) {
      renderer.setRenderTarget(null);
      renderer.clear();
      return true;
    }
    this.displays_.composite(
      renderer,
      drawn.map(
        (layer: IAutoMoviePlaybackLayer): { weight: number; slot: number } => ({
          weight: layer.weight,
          slot: slotOf(layer),
        }),
      ),
      false,
    );
    return true;
  }

  /** Draw `overlay` over the composite through `camera`, without clearing. */
  public over(camera: THREE.Camera): void {
    if (this.compositor_ !== null)
      this.displays_.over(this.compositor_, camera);
  }

  /** Release the held layers; a placement still pending then paints nothing. */
  public dispose(): void {
    this.disposed_ = true;
    this.displays_.dispose();
  }

  /** The composited layers of positive weight, outgoing first. */
  private drawn(): IAutoMoviePlaybackLayer[] {
    return (this.layers_ ?? []).filter(
      (layer: IAutoMoviePlaybackLayer): boolean => layer.weight > 0,
    );
  }
}

/** The slot a transition layer is held in: the outgoing 0, the live 1. */
function slotOf(layer: IAutoMoviePlaybackLayer): number {
  return layer.live ? 1 : 0;
}
