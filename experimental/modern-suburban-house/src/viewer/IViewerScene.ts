/**
 * Wire format of one scene the viewer server sends to the browser client.
 *
 * Responsibility: name the transient JSON that server.ts writes at GET /scene and the native client consumes. The native response is not persisted as authoring state; Website scene export separately wraps the house payload in its generated compressed transport.
 *
 * Producers include calibration.ts and buildHouseScene.ts, with model and material inspection payloads selected by the native server. The native client, shared scene uploader and Website payload boundary consume this erased TypeScript shape; no runtime implementation is exported by this module. Native client serving and the Website Vite build are separate module-loading paths.
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

  /** X-coordinate in metres of the native client's side-section clipping plane; it keeps X at or below this value without adding cap geometry. A finite cut query selects horizontal clipping instead. */
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
