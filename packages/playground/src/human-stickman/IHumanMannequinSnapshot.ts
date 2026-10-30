import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import type { HumanStickmanController } from "./HumanStickmanController";

/** Actual public Mannequin snapshot consumed by the maintained Human capture worker.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the existing snapshot's geometry buffers, world matrices, live controller, camera, lights and WebGL facts; the worker reads this public API rather than reconstructing a scene.
 * @evidence contracts/common.md#clear-and-simple-design A type-only boundary names the existing page data needed by capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Visibility is display metadata, not a replacement for actual geometry; this erased shape does not certify geometry quality.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish physical buffers/placement, actual inputs and render conditions.
 * @evidence contracts/performance.md#efficient-algorithms The erased interface performs no traversal; the existing page snapshot owns its actual buffer reads.
 * @evidence contracts/performance.md#reuse-equivalent-work One snapshot serves model and construction commitments plus capture metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns copied arrays; page geometry lifetime stays with the controller.
 */
export interface IHumanMannequinSnapshot {
  /** Actual completed-draw observation; not a requested frame or model digest domain. */
  completion: {
    ready: boolean;
    sequence: number;
    elapsedSeconds: number | null;
    error: string | null;
    closed: boolean;
  };
  /** Actual immutable body authoring parameters used to prepare this character. */
  parameters: IAutoMovieHumanParameters;
  /** Live pose, expression and playback state, rather than query labels. */
  controller: HumanStickmanController.IState;
  /** Actual page style. */
  style: string;
  /** Visible diagnostic pass, separate from invariant model geometry. */
  pass: string;
  /** Local buffers and actual world placement; visibility remains separately inspectable. */
  geometry: Array<{
    name: string;
    hierarchy: string[];
    kind: string;
    renderOrder: number;
    visible: boolean;
    effectiveVisible: boolean;
    matrixWorld: number[];
    positions: number[];
    normals: number[];
    indices: number[] | null;
    materials: number[];
  }>;
  /** Actual joint markers and their evaluated placements; visibility remains capture state. */
  markers: Array<{
    node: string;
    bone: string;
    detail: string;
    matrixWorld: number[];
    worldPosition: number[];
    visible: boolean;
    effectiveVisible: boolean;
    materials: number[];
  }>;
  /** Actual material objects, once each; geometry/marker indices address this ordered table. */
  materials: IHumanMannequinSnapshot.IMaterial[];
  /** Actual referenced textures, once each; material map indices address this ordered table. */
  textures: IHumanMannequinSnapshot.ITexture[];
  /** Live hint selection, together with the builder's actual rendering settings. */
  hint: {
    mode: string;
    detail: string;
    diameterPixels: number;
    color: number;
    xray: boolean;
  };
  /** Actual facade root, including externally authored placement. */
  root: {
    matrixWorld: number[];
    position: number[];
    quaternion: number[];
    scale: number[];
  };
  /** Number of body shape preparations for this mounted character. */
  bodyPreparations: number;
  /** Number of prepared pose evaluator calls. */
  poseEvaluations: number;
  /** Same actual evaluator call count retained for capture diagnostics. */
  evaluatorCalls: number;
  /** Independent copies of original neck, atlas, head and jaw source bones. */
  headDrivers: Skeleton.IBone[];
  /** Independent rest neck descriptor, without applying the current pose again. */
  neckSurface: Skeleton.IOutput["neckSurface"];
  /** Existing blockout qualification and actual emitted mesh counts. */
  unsupported: readonly string[];
  /** Blockout representation qualifier, without realistic continuous-skin claims. */
  body: string;
  /** Whether the observed blockout has continuous skin binding. */
  skinBinding: boolean;
  /** Number of source rig bones. */
  boneCount: number;
  /** Actual mesh vertex and triangle counts, without inferring displayed visibility. */
  parts: Array<{ name: string; vertices: number; triangles: number }>;
  /** Actual posed skeleton positions used by the diagnostic construction commitment. */
  rig: Array<{
    bone: string;
    parent: string | null;
    position: number[];
    localPosition: number[];
  }>;
  /** Actual perspective camera placement in metres and lens distances in metres. */
  camera: {
    position: number[];
    target: number[];
    up: number[];
    fov: number;
    near: number;
    far: number;
  };
  /** Actual reference directional light placement and intensity. */
  light: {
    mode: string;
    position: number[];
    target: number[];
    intensity: number;
  };
  /** Actual drawing-buffer pixel dimensions. */
  canvas: { width: number; height: number };
  /** Actual WebGL implementation; capture refuses software rendering. */
  renderer: { vendor: string; renderer: string };
}

/** Actual Three material/image fields preserved by the snapshot's existing JSON transport. */
export namespace IHumanMannequinSnapshot {
  /** Actual texture dimensions and numeric pixels when exposed by a DataTexture; unavailable pixels stay null. */
  export interface ITexture {
    /** Actual exposed image width in pixels, or unavailable. */
    width: number | null;
    /** Actual exposed image height in pixels, or unavailable. */
    height: number | null;
    /** Stored Three texture color-space identifier. */
    colorSpace: string;
    /** Stored Three pixel format. */
    format: number;
    /** Actual minification filter. */
    minFilter: number;
    /** Actual magnification filter. */
    magFilter: number;
    /** Copied actual numeric image elements; unavailable pixels are null. */
    data: number[] | null;
  }

  /** Actual shader material state; color uses stored linear RGB and size uses renderer pixels. */
  export interface IMaterial {
    /** Actual Three material class identifier. */
    type: string;
    /** Stored linear RGB components, or absent color support. */
    color: number[] | null;
    /** Actual shader opacity multiplier. */
    opacity: number;
    /** Actual blending enablement. */
    transparent: boolean;
    /** Actual depth comparison enablement; xray markers disable it. */
    depthTest: boolean;
    /** Actual depth-buffer write enablement. */
    depthWrite: boolean;
    /** Actual Three face-side mode. */
    side: number;
    /** Actual Points size in renderer pixels, or inapplicable. */
    size: number | null;
    /** Whether perspective attenuates point size, or inapplicable. */
    sizeAttenuation: boolean | null;
    /** Actual surface roughness, or inapplicable. */
    roughness: number | null;
    /** Actual texture-table addresses, not UUID or query labels. */
    map: number | null;
    /** Actual alpha texture-table address, or no alpha texture. */
    alphaMap: number | null;
  }

  /** Optional page global admitted by the capture worker before using the mounted owner. */
  export interface IPage {
    /** Whether the controls still match the last completed draw. */
    ready: boolean;
    /** Original public draw completion and terminal failure state. */
    completion: IHumanMannequinSnapshot["completion"];
    /** Existing facade owning pose, expression, root and motion controls. */
    controller: HumanStickmanController;
    /** Read the matching completed drawing or reject stale public state. */
    snapshot: () => IHumanMannequinSnapshot;
  }
}
