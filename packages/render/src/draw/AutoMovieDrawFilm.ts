import { playbackEntryAt } from "@automovie/engine";
import type {
  AutoMovieInspectionShade,
  IAutoMovieFilmOptics,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieRenderModeHandle } from "../scene/IAutoMovieRenderModeHandle.js";
import { applyRenderMode } from "../scene/applyRenderMode.js";
import type { AutoMovieFilmAlpha } from "../scene/filmResponse/AutoMovieFilmAlpha.js";
import type { AutoMovieDrawBeauty } from "./AutoMovieDrawBeauty.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { placeAutoMovieDrawLayer } from "./placeAutoMovieDrawLayer.js";
import { planAutoMovieDrawPicture } from "./planAutoMovieDrawPicture.js";

/**
 * One draw call's picture of a subject: which shot it shows, and for a film
 * picture its transition's layers and its shutter and lens samples.
 *
 * The constructor plans the drawn second by `planAutoMovieDrawPicture`: the
 * shown layer is the shot the picture shows most of, or outside every
 * transition the entry live at the second. `seekShown` places it at an output
 * second by `placeAutoMovieDrawLayer` when it is a transition's outgoing shot,
 * so every record of the frame, from marks and trails to diagnostics, mouths,
 * the camera and every structural pass, follows the shot on screen; it is
 * undefined for the live entry, which the inspection's own `seek` places. A
 * refused plan throws from the constructor.
 *
 * A film picture is a `beauty` picture or a `graphics` plate drawn as the
 * delivered film. Inside a transition it composites the planned layers by their
 * weights, the plate exactly as the picture, so a plate composited in post
 * matches the film through a dissolve or a fade. `prepare`, before the host
 * places the shown layer, places, draws and holds every other layer of positive
 * weight, the outgoing shot in slot 0 and the live entry in slot 1: a beauty
 * layer through `AutoMovieDrawBeauty.sample` and `draw`, a plate through
 * `plate` under the `graphics` render mode. A `beauty` film picture of a
 * subject with optics then accumulates the shown layer's shutter and lens
 * samples, each placed on that layer's own entry clock, so a frame at a hard
 * cut integrates only the incoming shot. Each placement, a layer's or a
 * sample's, runs the subject's `beforeDraw` right after it, before any render
 * mode applies, and the canvas's clear alpha is set before any sample is drawn.
 * A layer of weight 0, the live entry on a dissolve's first frame or at a
 * fade's midpoint, is neither placed, sampled nor drawn.
 *
 * `draw`, once the host has placed the shown layer, draws it through the given
 * camera with the samples `prepare` accumulated and, for a transition, holds it
 * and composites the held layers onto the canvas, toward alpha 0 for a
 * transparent picture or the plate; a picture none of whose layers has weight,
 * a fade's midpoint, is the cleared canvas, black or transparent. Any other
 * picture is drawn as one placement.
 */
export class AutoMovieDrawFilm {
  /** The layers a film picture composites, or null for one placement. */
  public readonly layers: IAutoMoviePlaybackLayer[] | null;

  /**
   * Place the shown layer at an output second when it is a transition's
   * outgoing shot; undefined when the inspection's `seek` places it.
   */
  public readonly seekShown: ((seconds: number) => Promise<void>) | undefined;

  /** The planned shown layer, or null outside every transition. */
  private readonly shown_: IAutoMoviePlaybackLayer | null;

  /** The shown layer's entry and shot, or null without a cut. */
  private readonly placed_: Pick<
    IAutoMoviePlaybackLayer,
    "entry" | "shot"
  > | null;

  /** The optics the shown layer's samples were accumulated with. */
  private sampled_: IAutoMovieFilmOptics | undefined = undefined;

  /** Plan the picture at the drawn second; a refused plan throws. */
  public constructor(private readonly props: AutoMovieDrawFilm.IProps) {
    const { scene, seconds }: AutoMovieDrawFilm.IProps = props;
    const plan: ReturnType<typeof planAutoMovieDrawPicture> =
      planAutoMovieDrawPicture(props.name, scene, seconds);
    this.layers = props.film ? plan.layers : null;
    const shown: IAutoMoviePlaybackLayer | null = plan.shown;
    this.shown_ = shown;
    this.placed_ =
      shown ??
      (scene.cut === undefined
        ? null
        : playbackEntryAt(scene.cut.entries, seconds));
    this.seekShown =
      shown === null || shown.live
        ? undefined
        : (at: number): Promise<void> =>
            placeAutoMovieDrawLayer(props.name, scene, shown, at);
  }

  /** Whether the picture composites a transition's layers. */
  public get composites(): boolean {
    return this.layers !== null;
  }

  /**
   * Place, draw and hold every layer of positive weight but the shown one, then
   * accumulate the shown layer's samples, before the host places the shown
   * layer.
   */
  public async prepare(): Promise<void> {
    for (const layer of this.drawn())
      if (layer !== this.shown_) await this.hold(layer);
    if (
      this.drawsShown() &&
      this.props.film &&
      this.props.shade === "beauty" &&
      this.props.scene.optics !== undefined
    ) {
      this.props.restore();
      this.props.prepare();
      this.sampled_ = await this.sample(this.placed_);
    }
  }

  /**
   * Draw the placed shown layer through `camera` and, for a transition, hold it
   * and composite the held layers onto the canvas.
   */
  public draw(camera: THREE.Camera): void {
    if (this.layers === null) {
      this.render(camera, this.sampled_);
      return;
    }
    if (this.drawsShown()) {
      this.render(camera, this.sampled_);
      this.props.beauty.hold(slotOf(this.shown_!));
    }

    // A fade's midpoint draws no shot: black, or alpha 0 when transparent.
    const drawn: IAutoMoviePlaybackLayer[] = this.drawn();
    if (drawn.length === 0) {
      this.props.renderer.setRenderTarget(null);
      this.props.renderer.clear();
      return;
    }
    this.props.beauty.composite(
      drawn.map(
        (layer: IAutoMoviePlaybackLayer): { weight: number; slot: number } => ({
          weight: layer.weight,
          slot: slotOf(layer),
        }),
      ),
      this.props.transparent,
    );
  }

  /** The planned layers of positive weight, outgoing first. */
  private drawn(): IAutoMoviePlaybackLayer[] {
    return (this.layers ?? []).filter(
      (layer: IAutoMoviePlaybackLayer): boolean => layer.weight > 0,
    );
  }

  /**
   * Whether the shown layer is drawn: always for one placement, and inside a
   * transition when its weight is positive.
   */
  private drawsShown(): boolean {
    return this.layers === null || this.shown_!.weight > 0;
  }

  /** Place, draw and hold one layer drawn before the shown one. */
  private async hold(layer: IAutoMoviePlaybackLayer): Promise<void> {
    const props: AutoMovieDrawFilm.IProps = this.props;
    props.restore();
    props.prepare();
    if (props.shade === "graphics") {
      await this.place(layer)(props.seconds);

      // The plate's holdouts apply after the layer's feeds were drawn.
      const mode: IAutoMovieRenderModeHandle = applyRenderMode(
        props.scene.scene,
        "graphics",
      );
      try {
        this.render(props.camera(props.seconds), undefined);
      } finally {
        mode.restore();
      }
    } else {
      const sampled: IAutoMovieFilmOptics | undefined =
        await this.sample(layer);
      props.prepare();
      this.render(props.camera(props.seconds), sampled);
    }
    props.beauty.hold(slotOf(layer));
  }

  /**
   * Place a layer at the drawn second through `AutoMovieDrawBeauty.sample`,
   * which accumulates its samples when its optics there have them.
   */
  private sample(
    layer: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null,
  ): Promise<IAutoMovieFilmOptics | undefined> {
    const props: AutoMovieDrawFilm.IProps = this.props;
    return props.beauty.sample({
      scene: props.scene,
      seconds: props.seconds,
      width: props.width,
      height: props.height,
      seek: this.place(layer),
      camera: props.camera,
      ...(props.alpha === undefined ? {} : { alpha: props.alpha }),
    });
  }

  /**
   * A layer's placement at an output second on its own entry clock, followed by
   * the subject's render-target work at that second.
   */
  private place(
    layer: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null,
  ): (seconds: number) => Promise<void> {
    const props: AutoMovieDrawFilm.IProps = this.props;
    return async (at: number): Promise<void> => {
      await placeAutoMovieDrawLayer(props.name, props.scene, layer, at);
      props.scene.beforeDraw?.(props.renderer, at);
    };
  }

  /** Draw the placed layer: the beauty picture or the graphics plate. */
  private render(
    camera: THREE.Camera,
    sampled: IAutoMovieFilmOptics | undefined,
  ): void {
    const props: AutoMovieDrawFilm.IProps = this.props;
    if (props.shade === "graphics")
      props.beauty.plate({
        scene: props.scene,
        camera,
        seconds: props.seconds,
        width: props.width,
        height: props.height,
      });
    else
      props.beauty.draw({
        scene: props.scene,
        camera,
        seconds: props.seconds,
        width: props.width,
        height: props.height,
        sampled,
        ...(props.alpha === undefined ? {} : { alpha: props.alpha }),
      });
  }
}

/** The slot a transition layer is held in: the outgoing 0, the live 1. */
function slotOf(layer: IAutoMoviePlaybackLayer): number {
  return layer.live ? 1 : 0;
}

/** Types of `AutoMovieDrawFilm`. */
export namespace AutoMovieDrawFilm {
  /** What one draw call's picture is drawn with. */
  export interface IProps {
    /** The subject's name, which a refusal names. */
    name: string;

    /** The created subject. */
    scene: IAutoMovieDrawScene;

    /** The page's renderer, which `beforeDraw` and a cleared picture use. */
    renderer: THREE.WebGLRenderer;

    /** The beauty stages, the graphics plate and the held layers. */
    beauty: Pick<
      AutoMovieDrawBeauty,
      "sample" | "draw" | "plate" | "hold" | "composite"
    >;

    /**
     * The call's shade; `beauty` and `graphics` are drawn by `draw`, every
     * other pass by the host.
     */
    shade: AutoMovieInspectionShade;

    /** The drawn second. */
    seconds: number;

    /** Drawn raster width in pixels. */
    width: number;

    /** Drawn raster height in pixels. */
    height: number;

    /** How a beauty picture's alpha is kept; absent draws it opaque. */
    alpha?: AutoMovieFilmAlpha;

    /**
     * Whether the composite falls toward alpha 0: a transparent picture or the
     * graphics plate.
     */
    transparent: boolean;

    /**
     * Whether the picture is the film picture: a delivered or plain `beauty`
     * picture or `graphics` plate, which composites transitions and, in
     * `beauty`, accumulates samples.
     */
    film: boolean;

    /** The drawing camera at an output second, after its placement. */
    camera: (seconds: number) => THREE.Camera;

    /** Size the canvas to the drawn raster and set its clear alpha. */
    prepare: () => void;

    /** End the current inspection before the picture places the subject. */
    restore: () => void;
  }
}
