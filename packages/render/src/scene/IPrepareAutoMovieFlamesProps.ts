import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/** What `prepareAutoMovieFlames` builds a shot's flames from. */
export interface IPrepareAutoMovieFlamesProps {
  /**
   * The admitted shot: its flame cues, its light clips (a bound flame's binding
   * id is its light clip's id) and its duration.
   */
  shot: Pick<IAutoMovieShot, "flames" | "lightMotions" | "duration">;

  /** The staged scene: node models and the lights a bound flame shows. */
  scene: Pick<IAutoMovieScene, "nodes" | "lights">;

  /** The registered models, which hold each emitter's frame. */
  models: readonly IAutoMovieModel[];

  /**
   * The model object mounted for a scene node; the flame is parented to its
   * `object`.
   */
  resolveNode: (node: string) => IAutoMovieModelObject | undefined;
}
