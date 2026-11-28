import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";

import type { IAutoMovieRenderModelObject } from "./IAutoMovieRenderModelObject";
import type { IAutoMovieRenderTextureLoader } from "./IAutoMovieRenderTextureLoader";

/** Inputs for mounting and playing one shot's surface graphics. */
export interface IAutoMovieRenderPrepareSurfaceGraphicsProps {
  /**
   * The admitted shot: its surface graphic tracks, its duration and the font
   * sources its text layers name.
   */
  shot: Pick<IAutoMovieShot, "surfaceGraphics" | "duration" | "fonts">;

  /** The shot's staged scene, which maps each node to its model id. */
  scene: Pick<IAutoMovieScene, "nodes">;

  /**
   * The registered models, which hold each surface's affordance frame and
   * extents and the images a model carries.
   */
  models: readonly IAutoMovieModel[];

  /**
   * The mounted model object for a scene node. A fixed graphic attaches to its
   * root. A moving graphic attaches to the corresponding entry in `parts`, so
   * it uses the same rigid part as the staged articulation.
   */
  resolveNode: (node: string) => IAutoMovieRenderModelObject | undefined;

  /**
   * Loader for an image layer's project asset, an id no model carries. The
   * graphics take ownership of each returned texture. Absent, such an image is
   * refused while preparing.
   */
  loadImage?: IAutoMovieRenderTextureLoader;

  /**
   * Reader of an `"asset"` font source's bytes by its project asset path.
   * Absent, such a source is refused while preparing.
   */
  readFontAsset?: (path: string) => Promise<Uint8Array>;
}
