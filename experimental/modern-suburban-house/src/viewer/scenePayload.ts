/**
 * Wire format of one scene the viewer server sends to the browser client.
 *
 * Responsibility: name the exact shape of the transient JSON that
 * `server.cts` writes at `GET /scene` and `client.mjs` reads. Nothing is
 * stored; settings `execution-boundary` forbids a JSON state file, so this
 * value lives only inside one HTTP response.
 *
 * Producers: `calibration.cts` (`buildCalibrationScene`) and `houseScene.cts`
 * (`buildHouseScene`, from the spaces producer). Consumers: the
 * browser client through JSDoc type imports only, so no runtime code crosses
 * into the browser from this module.
 *
 * Units follow settings `coordinate-units`: right-handed Y-up, meters,
 * degrees only where a field name says `Deg`. Colors are sRGB hex integers;
 * the client converts them to linear working color through three.js color
 * management.
 */

import type { HousePartRole } from "../spaces/solids";

/** Which subject a scene draws: the calibration shape or the house. */
export type ViewerSceneSubject = "calibration" | "house" | "model";

/** One triangle mesh placed in world space by translation only. */
export interface IViewerSceneItem {
  /** Stable id used in inspection output and capture records. */
  id: string;

  /** What the item is: a calibration role or a spaces part role. */
  role: "ground" | "axis" | "tick" | "reference" | "model" | HousePartRole;

  /** Source owner under `src/spaces`, when the item is a house part. */
  owner?: string;

  /** Base color as an sRGB hex integer, for example 0xd94a3a. */
  color: number;

  /** Model material response for isolated prototype views. */
  opacity?: number;
  roughness?: number;
  metalness?: number;

  /** World translation of the mesh origin, meters. */
  position: [number, number, number];

  /** Flat vertex positions from the engine mesh, meters. */
  positions: number[];

  /** Flat per-vertex normals from the engine mesh. */
  normals: number[];

  /** Triangle indices into the vertex arrays. */
  indices: number[];

  /** Whether the item throws a shadow onto other items. */
  castShadow: boolean;

  /** Whether the item shows shadows thrown onto it. */
  receiveShadow: boolean;
}

/** Perspective camera the client starts from and returns to on reset. */
export interface IViewerSceneCamera {
  /** Eye position, meters. */
  position: [number, number, number];

  /** Point the camera looks at, meters. */
  target: [number, number, number];

  /** Vertical field of view in degrees. */
  fovDeg: number;

  /** Near clip plane distance, meters. */
  near: number;

  /** Far clip plane distance, meters. */
  far: number;
}

/** Light rig recorded with the scene so a capture names its conditions. */
export interface IViewerSceneLighting {
  /** Direction the key light comes FROM, as a world vector (not normalized). */
  keyFrom: [number, number, number];

  /** Key light intensity in three.js physical units. */
  keyIntensity: number;

  /** Sky color of the hemisphere fill, sRGB hex. */
  skyColor: number;

  /** Ground color of the hemisphere fill, sRGB hex. */
  groundColor: number;

  /** Hemisphere fill intensity. */
  fillIntensity: number;

  /** Fixed tone-mapping exposure; settings `lighting-state` forbids per-view brightness. */
  exposure: number;

  /** Half extent of the key light shadow box around its target, meters; 8 when absent. */
  shadowHalfExtent?: number;

  /** World point the key light aims at; the origin when absent. */
  keyTarget?: [number, number, number];
}

/** Complete payload of `GET /scene`. */
export interface IViewerScene {
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
  /**
   * Self-space observation poses derived by `src/spaces/observations.ts`, for
   * the `observe=<id>` inspection query; absent for the calibration scene.
   */
  observations?: { id: string; position: [number, number, number]; target: [number, number, number] }[];
}
