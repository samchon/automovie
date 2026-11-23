import type {
  IAutoMovieInspectionRequest,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";
import {
  AutoMovieTransitionDisplays,
  type IAutoMovieDrawScene,
  isAutoMoviePlainBeautyRequest,
  planAutoMovieDrawLayers,
} from "@automovie/render";
import * as THREE from "three";

import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";

/**
 * The inspector's half of a film picture inside a transition, so the Viewer
 * paints the frame the draw page delivers and captures at the same second.
 *
 * `prepare` reads the layers `planAutoMovieDrawLayers` gives for a plain
 * `beauty` request on a WebGL renderer, the condition under which the draw page
 * composites them. When one is a transition's outgoing shot it places that shot
 * through the subject's `seekShot` at the layer's own shot-local second, runs
 * the subject's `beforeDraw`, has the caller paint it and holds the canvas
 * picture, all before the mount places the live second. `finish`, after the
 * mount painted the live entry when `drawsLive` says it is drawn, holds that
 * picture too and composites the held layers by their weights through
 * `AutoMovieTransitionDisplays`. Any other picture is painted as before: no
 * layer is planned, `drawsLive` is true and `finish` does nothing.
 *
 * The Viewer paints one sharp sample without the film's indirect shading, as it
 * does outside transitions, so a subject whose optics set `samples` or whose
 * shading asks for occlusion or probes still differs from delivery by those,
 * not by its transitions.
 */
export class AutoMovieInspectorTransition {
  /** The held layers of the planned picture. */
  private readonly displays_: AutoMovieTransitionDisplays =
    new AutoMovieTransitionDisplays();

  /** The layers of the picture being painted, or null for one live layer. */
  private layers_: IAutoMoviePlaybackLayer[] | null = null;

  /** Whether `dispose` ran, after which nothing is painted or held. */
  private disposed_: boolean = false;

  /** Whether the live entry is drawn in the picture being painted. */
  public get drawsLive(): boolean {
    return (
      this.layers_ === null ||
      this.layers_.some((layer: IAutoMoviePlaybackLayer): boolean => layer.live)
    );
  }

  /**
   * Plan the picture at `seconds` and, inside a transition, place, paint and
   * hold its outgoing shot; the caller places the live second afterwards.
   * Returns null when there is no outgoing shot, so the caller seeks the live
   * second at once, as it did before transitions were drawn, and otherwise the
   * promise of the held outgoing picture. A refused plan throws at once.
   */
  public prepare(props: {
    /** The subject's name, which a refusal names. */
    name: string;

    /** The created subject. */
    instance: IAutoMovieDrawScene;

    /** The inspection the picture is drawn with. */
    request: IAutoMovieInspectionRequest;

    /** The renderer, which composites only when it is a WebGL renderer. */
    renderer: IAutoMovieInspectorSceneHost.IRenderer;

    /** The second painted. */
    seconds: number;

    /** Paint the placed scene's beauty picture onto the canvas. */
    paint: () => void;
  }): Promise<void> | null {
    const renderer: THREE.WebGLRenderer | null =
      props.renderer instanceof THREE.WebGLRenderer ? props.renderer : null;
    this.layers_ =
      renderer !== null && isAutoMoviePlainBeautyRequest(props.request)
        ? planAutoMovieDrawLayers(props.name, props.instance, props.seconds)
        : null;
    const outgoing: IAutoMoviePlaybackLayer | undefined = this.layers_?.find(
      (layer: IAutoMoviePlaybackLayer): boolean => !layer.live,
    );
    if (renderer === null || outgoing === undefined) return null;

    // A planned outgoing layer implies `seekShot`, which the plan requires. The
    // subject's render-target work runs after the placement, as the draw page
    // runs it.
    return props.instance.seekShot!(
      outgoing.shot,
      outgoing.time,
      props.seconds,
    ).then((): void => {
      // A mount disposed during the placement paints and holds nothing.
      if (this.disposed_) return;
      props.instance.beforeDraw?.(renderer, props.seconds);
      props.paint();
      this.displays_.hold(renderer, 0);
    });
  }

  /** Composite the planned layers after the live entry was painted. */
  public finish(renderer: IAutoMovieInspectorSceneHost.IRenderer): void {
    const layers: IAutoMoviePlaybackLayer[] | null = this.layers_;
    if (layers === null || !(renderer instanceof THREE.WebGLRenderer)) return;
    if (this.drawsLive) this.displays_.hold(renderer, 1);
    this.displays_.composite(
      renderer,
      layers.map(
        (layer: IAutoMoviePlaybackLayer): { weight: number; slot: number } => ({
          weight: layer.weight,
          slot: layer.live ? 1 : 0,
        }),
      ),
      false,
    );
  }

  /** Release the held layers; a placement still pending then paints nothing. */
  public dispose(): void {
    this.disposed_ = true;
    this.displays_.dispose();
  }
}
