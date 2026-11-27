import type {
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";

import type { IAutoMovieRenderModelObject } from "./IAutoMovieRenderModelObject.js";
import type { IAutoMovieRenderTextureLoader } from "./IAutoMovieRenderTextureLoader.js";

/** What `prepareAutoMovieSurfaceGraphics` builds a shot's surface graphics from. */
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
   * The model object mounted for a scene node, as the host built it for
   * `buildScene`; the graphic is parented to its `object`.
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
