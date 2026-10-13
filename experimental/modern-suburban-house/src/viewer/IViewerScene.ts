/**
 * Wire format of one scene the viewer server sends to the browser client.
 *
 * Responsibility: name the exact shape of the transient JSON that
 * `server.cts` writes at `GET /scene` and `client.mjs` reads. Nothing is
 * stored; settings `execution-boundary` forbids a JSON state file, so this value lives only inside one HTTP response.
 *
 * Producers: `calibration.cts` (`buildCalibrationScene`) and `houseScene.cts` (`buildHouseScene`, from the spaces producer). Consumers: the browser client through JSDoc type imports only, so no runtime code crosses into the browser from this module.
 *
 * Units follow settings `coordinate-units`: right-handed Y-up, meters, degrees only where a field name says `Deg`. Colors are sRGB hex integers; the client converts them to linear working color through three.js color management.
 */
import type { IAutoMovieLight, IAutoMovieSceneEnvironment } from "@automovie/interface";
import type { ViewerSceneSubject } from "./ViewerSceneSubject";
import type { IViewerSceneCamera } from "./IViewerSceneCamera";
import type { IViewerSceneLighting } from "./IViewerSceneLighting";
import type { IViewerSceneItem } from "./IViewerSceneItem";

/**
 * Complete payload of `GET /scene`.
 *
 * @author Samchon
 */
export interface IViewerScene {
  /** Authored portable physical lights; calibration retains its own simple rig. */
  physicalLighting?: {
    lights: IAutoMovieLight[];
    environment: IAutoMovieSceneEnvironment;
  };

  /** Subject drawn by this scene. */
  subject: ViewerSceneSubject;

  /** True when the scene is inspection material rather than a delivery view. */
  inspection: boolean;

  /** Digest of the production source the server read, so a frame names its basis. */
  sourceDigest: string;

  /** Raster the comparison frame uses, from settings `frame-condition`. */
  raster: { width: number; height: number; pixelRatio: number };

  /** Starting camera. */
  camera: IViewerSceneCamera;

  /** Light rig. */
  lighting: IViewerSceneLighting;

  /** Placed meshes. */
  items: IViewerSceneItem[];

  /** Supplemental native model inspection, separate from the whole-house views. */
  modelReview?: {
    id: string;
    view: "front" | "side" | "diagonal";
    overlay: boolean;
    faces: string[];
    models: string[];
  };

  /** Actual active material identities, top row first, for an inspection plate. */
  materialReview?: {
    page: number;
    mode: "neutral" | "baseline";
    total: number;
    rows: string[];
  };

  /** Side-section plane keeps the source's X<=0 half without adding cap geometry. */
  sectionX?: number;

  /**
 * Self-space observation poses derived by `src/spaces/observations.ts`, for the `observe=<id>` inspection query; absent for the calibration scene.
 */
  observations?: {
    id: string;
    fovDeg?: number;
    near?: number;
    position: [number, number, number];
    target: [number, number, number];
  }[];
}
