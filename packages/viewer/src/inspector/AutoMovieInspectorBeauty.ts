import {
  AutoMovieFilmIndirectStage,
  AutoMovieFilmResponseStage,
  type IAutoMovieDrawScene,
} from "@automovie/render";
import type * as THREE from "three";

import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";

/**
 * The inspector's beauty picture: a subject's optics and indirect shading
 * through the stages the draw page delivers one sample with.
 *
 * `draw` runs `AutoMovieFilmResponseStage` inside `AutoMovieFilmIndirectStage`,
 * which admits the subject's `shading` at the second against its optics, bakes
 * probes when their revision changed and measures the occlusion of indirect
 * light for the drawn camera first, so a shaded subject's paused frame shows
 * what a delivered single-sample frame of that second shows. Without optics the
 * response stage draws the scene straight to the canvas under the renderer's
 * own curve, as the page always did. A shutter or lens is drawn as its one
 * sample: the interactive page does not accumulate sub-frame samples. Both
 * stages allocate nothing for a subject that never asks for them, and `dispose`
 * releases them.
 */
export class AutoMovieInspectorBeauty {
  /** The stage giving a subject's optics their response. */
  private readonly response_: AutoMovieFilmResponseStage =
    new AutoMovieFilmResponseStage();

  /** The stage measuring a subject's indirect shading around the draw. */
  private readonly indirect_: AutoMovieFilmIndirectStage =
    new AutoMovieFilmIndirectStage();

  /** Draw the placed subject's beauty picture at `seconds` onto the canvas. */
  public draw(props: {
    /** The inspector's renderer. */
    renderer: IAutoMovieInspectorSceneHost.IRenderer;

    /** The created subject, placed at `seconds`. */
    instance: IAutoMovieDrawScene;

    /** The camera drawn through. */
    camera: THREE.Camera;

    /** The drawn second. */
    seconds: number;

    /** Drawn raster width in device pixels. */
    width: number;

    /** Drawn raster height in device pixels. */
    height: number;
  }): void {
    const { renderer, instance, camera, seconds, width, height }: typeof props =
      props;
    const optics:
      | ReturnType<NonNullable<IAutoMovieDrawScene["optics"]>>
      | undefined = instance.optics?.(seconds);
    this.indirect_.draw(
      {
        renderer,
        scene: instance.scene,
        camera,
        shading: instance.shading?.(seconds),
        optics: optics !== undefined,
        seconds,
        width,
        height,
        sample: 0,
      },
      (): void =>
        this.response_.draw({
          renderer,
          scene: instance.scene,
          camera,
          optics,
          seconds,
          width,
          height,
        }),
    );
  }

  /** Release both stages. */
  public dispose(): void {
    this.response_.dispose();
    this.indirect_.dispose();
  }
}
