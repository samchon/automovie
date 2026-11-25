import type {
  IAutoMovieFilmBeautyLayer,
  IAutoMovieFilmOptics,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieTransitionDisplays } from "../scene/AutoMovieTransitionDisplays.js";
import type { AutoMovieFilmAlpha } from "../scene/filmResponse/AutoMovieFilmAlpha.js";
import { AutoMovieFilmResponseStage } from "../scene/filmResponse/AutoMovieFilmResponseStage.js";
import { AutoMovieFilmIndirectStage } from "../scene/filmShading/AutoMovieFilmIndirectStage.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { accumulateAutoMovieFilmSamples } from "./accumulateAutoMovieFilmSamples.js";

/**
 * The draw page's film picture: the stages that give a subject's beauty pass
 * its optics and shading, and the held layers a transition composites.
 *
 * `sample` places one layer at the drawn second through the caller's placement
 * and, when the subject's optics there have `samples`, accumulates the shutter
 * and lens samples with `accumulateAutoMovieFilmSamples`, each inside
 * `AutoMovieFilmIndirectStage` for that sample's camera. `draw` then draws the
 * layer onto the canvas: an accumulated frame through
 * `AutoMovieFilmResponseStage` alone, a single sample through the response
 * stage inside the indirect stage, which bakes probes when their revision
 * changed and measures the occlusion of indirect light for the drawn camera
 * first. Without optics the response stage draws the scene straight to the
 * canvas under the renderer's own curve. With `alpha` `transparent` every
 * render of the layer leaves the scene's backdrop undrawn and the response
 * stage carries the picture's alpha; the caller clears the canvas to alpha 0.
 *
 * `plate` draws the `graphics` pass: with optics through the response stage,
 * alpha kept as the graphics' coverage, so its graphics take the beauty pass's
 * exposure, white balance, curve, glare, medium and grade; without optics
 * straight to the canvas. The plate is one sample without the film's indirect
 * shading: shutter and lens blur stay the beauty pass's, and a probe bake in
 * the plate would read the pass's colourless holdout materials into probes the
 * beauty pass reuses, so a lit graphic's occlusion and bounce are the beauty
 * pass's alone until the stage bakes probes from the beauty materials whatever
 * the pass.
 *
 * `hold` and `composite` hand the layers of a transition to
 * `AutoMovieTransitionDisplays`, a beauty picture's or a plate's alike, and
 * `overlay` and `over` draw a picture's witness cubes over their composite.
 * Every stage allocates nothing for a subject that never asks for it, and
 * `dispose` releases them all.
 */
export class AutoMovieDrawBeauty {
  /** The stage giving a subject's optics their response. */
  private readonly response_: AutoMovieFilmResponseStage =
    new AutoMovieFilmResponseStage();

  /** The stage measuring a subject's indirect shading around each sample. */
  private readonly indirect_: AutoMovieFilmIndirectStage =
    new AutoMovieFilmIndirectStage();

  /** The camera a lens sample is drawn through, its eye on the aperture. */
  private readonly lens_: THREE.PerspectiveCamera =
    new THREE.PerspectiveCamera();

  /** The held layers of a transition. */
  private readonly displays_: AutoMovieTransitionDisplays =
    new AutoMovieTransitionDisplays();

  /** Hold the page's renderer. */
  public constructor(private readonly renderer: THREE.WebGLRenderer) {}

  /**
   * Place a layer at `seconds` and accumulate its shutter and lens samples when
   * its optics there have `samples`; returns those optics, or undefined for a
   * layer `draw` draws as one sample. The scene is placed at `seconds` again
   * after the last sample.
   */
  public async sample(
    props: AutoMovieDrawBeauty.ILayer,
  ): Promise<IAutoMovieFilmOptics | undefined> {
    const { scene, seconds }: AutoMovieDrawBeauty.ILayer = props;
    await props.seek(seconds);
    const optics: IAutoMovieFilmOptics | undefined = scene.optics?.(seconds);
    if (optics?.samples === undefined) return undefined;
    const renderer: THREE.WebGLRenderer = this.renderer;
    await accumulateAutoMovieFilmSamples({
      stage: this.response_,
      renderer,
      scene: scene.scene,
      optics,
      seconds,
      fps: scene.fps,
      fovY: scene.camera.fov,
      width: props.width,
      height: props.height,
      seek: props.seek,
      camera: props.camera,
      scratch: this.lens_,
      ...(props.alpha === undefined ? {} : { alpha: props.alpha }),
      around: (
        sample: { camera: THREE.Camera; seconds: number; index: number },
        draw: () => void,
      ): void =>
        this.bare(scene.scene, props.alpha, (): void =>
          this.indirect_.draw(
            {
              renderer,
              scene: scene.scene,
              camera: sample.camera,
              shading: scene.shading?.(sample.seconds),
              optics: true,
              seconds: sample.seconds,
              width: props.width,
              height: props.height,
              sample: sample.index,
            },
            draw,
          ),
        ),
    });
    return optics;
  }

  /**
   * Draw the placed layer onto the canvas through `camera`: the accumulated
   * frame of `sampled`, or one sample of the subject's optics and shading at
   * `seconds`.
   */
  public draw(props: {
    /** The created subject, placed at the layer. */
    scene: IAutoMovieDrawScene<never>;

    /** The camera drawn through. */
    camera: THREE.Camera;

    /** The drawn second. */
    seconds: number;

    /** Drawn raster width in pixels. */
    width: number;

    /** Drawn raster height in pixels. */
    height: number;

    /** The optics `sample` accumulated with, or undefined for one sample. */
    sampled: IAutoMovieFilmOptics | undefined;

    /** How the picture's alpha is kept; absent draws it opaque. */
    alpha?: AutoMovieFilmAlpha;
  }): void {
    const { scene, sampled }: Parameters<AutoMovieDrawBeauty["draw"]>[0] =
      props;
    const renderer: THREE.WebGLRenderer = this.renderer;
    const optics: IAutoMovieFilmOptics | undefined =
      sampled ?? scene.optics?.(props.seconds);
    const respond: () => void = (): void =>
      this.response_.draw({
        renderer,
        scene: scene.scene,
        camera: props.camera,
        optics,
        seconds: props.seconds,
        width: props.width,
        height: props.height,
        accumulated: sampled !== undefined,
        ...(props.alpha === undefined ? {} : { alpha: props.alpha }),
      });

    // An accumulated frame was drawn sample by sample already, each inside the
    // indirect stage; a single sample measures the film's indirect shading
    // around its one draw.
    this.bare(scene.scene, props.alpha, (): void => {
      if (sampled !== undefined) respond();
      else
        this.indirect_.draw(
          {
            renderer,
            scene: scene.scene,
            camera: props.camera,
            shading: scene.shading?.(props.seconds),
            optics: optics !== undefined,
            seconds: props.seconds,
            width: props.width,
            height: props.height,
            sample: 0,
          },
          respond,
        );
    });
  }

  /** Draw the `graphics` plate of the placed scene onto the canvas. */
  public plate(props: {
    /** The created subject, placed at the drawn second. */
    scene: IAutoMovieDrawScene<never>;

    /** The camera drawn through. */
    camera: THREE.Camera;

    /** The drawn second. */
    seconds: number;

    /** Drawn raster width in pixels. */
    width: number;

    /** Drawn raster height in pixels. */
    height: number;
  }): void {
    const optics: IAutoMovieFilmOptics | undefined = props.scene.optics?.(
      props.seconds,
    );
    if (optics === undefined) {
      this.renderer.render(props.scene.scene, props.camera);
      return;
    }
    this.response_.draw({
      renderer: this.renderer,
      scene: props.scene.scene,
      camera: props.camera,
      optics,
      seconds: props.seconds,
      width: props.width,
      height: props.height,
      alpha: "coverage",
    });
  }

  /** Copy the canvas picture of one transition layer into `slot`. */
  public hold(slot: number): void {
    this.displays_.hold(this.renderer, slot);
  }

  /** Composite the held layers of a transition onto the canvas. */
  public composite(
    layers: readonly (IAutoMovieFilmBeautyLayer & { slot: number })[],
    transparent: boolean,
  ): void {
    this.displays_.composite(this.renderer, layers, transparent);
  }

  /** The scene a composited picture's display overlays are attached to. */
  public get overlay(): THREE.Scene {
    return this.displays_.overlay;
  }

  /** Draw `overlay` over the canvas through `camera`, without clearing. */
  public over(camera: THREE.Camera): void {
    this.displays_.over(this.renderer, camera);
  }

  /** Release every stage and the held layers. */
  public dispose(): void {
    this.response_.dispose();
    this.indirect_.dispose();
    this.displays_.dispose();
  }

  /**
   * Run one render of a layer with the scene's backdrop left undrawn when the
   * picture is transparent, restoring it afterwards even on failure. The
   * backdrop is held out around each render rather than once per call, so a
   * placement that sets the backdrop, as a shot of another set may, never draws
   * it into a transparent picture.
   */
  private bare(
    scene: THREE.Scene,
    alpha: AutoMovieFilmAlpha | undefined,
    render: () => void,
  ): void {
    if (alpha !== "transparent") {
      render();
      return;
    }
    const backdrop: THREE.Scene["background"] = scene.background;
    scene.background = null;
    try {
      render();
    } finally {
      scene.background = backdrop;
    }
  }
}

/** Types of `AutoMovieDrawBeauty`. */
export namespace AutoMovieDrawBeauty {
  /** One layer of a film picture, as `sample` places and accumulates it. */
  export interface ILayer {
    /** The created subject. */
    scene: IAutoMovieDrawScene<never>;

    /** The drawn second. */
    seconds: number;

    /** Drawn raster width in pixels. */
    width: number;

    /** Drawn raster height in pixels. */
    height: number;

    /** Place the layer at an output second: the drawn one or a sample's. */
    seek: (seconds: number) => Promise<void>;

    /** The drawing camera at an output second, after `seek` to it. */
    camera: (seconds: number) => THREE.Camera;

    /** How the picture's alpha is kept; absent draws it opaque. */
    alpha?: AutoMovieFilmAlpha;
  }
}
