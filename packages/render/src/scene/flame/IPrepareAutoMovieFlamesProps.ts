import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";

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

  /**
   * The built light for a staged light id, such as `buildScene`'s `lights`
   * index gives it; each `apply` writes a bound flame's light clip onto it, so
   * the light flickers and switches with its flame. Only bound flames call it,
   * once each when the flames are prepared; a light it does not find is
   * refused.
   */
  resolveLight: (light: string) => THREE.Light | undefined;
}
