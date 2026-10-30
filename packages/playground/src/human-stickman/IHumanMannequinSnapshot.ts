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
  /** Actual texture dimensions and numeric pixels when exposed by a DataTexture; unavailable pixels stay null.
   *
   * @evidence contracts/common.md#principled-implementation Describes actual Three image dimensions, format/filter state and copied numeric pixels, with unavailable values represented as null.
   * @evidence contracts/common.md#clear-and-simple-design An ordered texture table is referenced by material map indices, independent of query labels or texture UUIDs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not invent raster pixels when an image exposes no numeric data or decode an image.
   * @evidence contracts/common.md#meaningful-documentation Documents pixel dimensions, stored colour space and the meaning of null image data.
   * @evidence contracts/performance.md#efficient-algorithms The interface is erased; the reader copies exposed pixel elements once per distinct texture.
   * @evidence contracts/performance.md#reuse-equivalent-work Material references share table indices for the same actual texture within one snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Copied arrays belong to the snapshot caller; this record owns no original texture or decoding handle.
   */
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

  /** Actual shader material state; color uses stored linear RGB and size uses renderer pixels.
   *
   * @evidence contracts/common.md#principled-implementation Records actual stored Three shader fields and indices into the snapshot's actual texture table.
   * @evidence contracts/common.md#clear-and-simple-design Separates material identity from per-geometry slots so shared material objects appear once.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null marks inapplicable fields; colours remain stored linear RGB and point size is not relabelled as metres.
   * @evidence contracts/common.md#meaningful-documentation Names depth state, opacity, side, point-size attenuation and optional texture addresses.
   * @evidence contracts/performance.md#efficient-algorithms The erased type adds no shader work; the reader copies a fixed field set per distinct material.
   * @evidence contracts/performance.md#reuse-equivalent-work Geometry and marker slots reuse ordered material-table addresses.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Plain values belong to the snapshot; no material or texture disposal ownership transfers.
   */
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

  /** Optional page global admitted by the capture worker before using the mounted owner.
   *
   * @evidence contracts/common.md#principled-implementation Names the mounted page's readiness/completion, existing controller and matching completed-draw snapshot callback.
   * @evidence contracts/common.md#clear-and-simple-design The optional page global exposes one owner rather than another capture renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Presence of the type does not certify freshness; snapshot must reject stale controls or failed drawing.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes ready state, actual draw completion and the owner supplying pose/expression controls.
   * @evidence contracts/performance.md#efficient-algorithms The interface is erased; actual scene copying occurs only when snapshot is invoked.
   * @evidence contracts/performance.md#reuse-equivalent-work The worker reads the existing controller and completed page instead of regenerating geometry.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns resources and callback lifetime; callers own snapshot copies, not the mounted renderer.
   */
  export interface IPage {
    /** Whether the controls still match the last completed draw. */
    ready: boolean;
    /** Original public draw completion and terminal failure state. */
    completion: IHumanMannequinSnapshot["completion"];
    /** Existing facade owning pose, expression, root and motion controls. */
    controller: HumanStickmanController;
    /** Read the matching completed drawing or reject stale public state.
     *
     * @evidence contracts/common.md#principled-implementation Returns the existing page's actual snapshot only when public controls match a completed draw.
     * @evidence contracts/common.md#clear-and-simple-design A single callback supplies the same observation to page and capture consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It must reject stale or failed state rather than passing requested values off as rendered pixels.
     * @evidence contracts/common.md#meaningful-documentation States matching completed-draw admission and its rejection behavior.
     * @evidence contracts/performance.md#efficient-algorithms Invocation copies actual scene buffers through the reader; the signature itself is erased.
     * @evidence contracts/performance.md#reuse-equivalent-work The callback reuses mounted scene and controller data without another body preparation.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned arrays; invoking this callback does not transfer page or renderer ownership.
     */
    snapshot: () => IHumanMannequinSnapshot;
  }
}
