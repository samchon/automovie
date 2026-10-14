import type * as THREE from "three";

/**
 * Borrowed browser services shared by the current face and body stages.
 * Stages own scene state and subscriptions; their browser mount owns the native
 * renderer and controls. Resize registration returns its exact cleanup.
 *
 * @evidence contracts/common.md#principled-implementation Projects public canvas, renderer and orbit operations used by both current stages without requiring a live context at the type boundary; each supplied operation keeps its host ownership and resize registration transfers only subscription cleanup.
 * @evidence contracts/common.md#clear-and-simple-design One shared host contract replaces type borrowing from the unused disposable-preview implementation and removes duplicate face/body port declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The real browser renderer and OrbitControls satisfy these structural ports; no fake renderer, replaced foreign method or model-specific behavior is encoded.
 * @evidence contracts/common.md#meaningful-documentation Identifies borrowed renderer/control ownership, stage subscription ownership and the exact resize cleanup contract; members describe native units and callback purposes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This port interface selects no rendering, observation or event-dispatch algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Hosts supply service references while stages decide retained scene state; the interface coordinates no completed-work sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no renderer, listener or observer; stages withdraw their subscriptions and browser mounts release native services.
 *
 * @author Samchon
 */
export interface IHumanViewportHost {
  /** Drawing surface whose CSS extent and original completion subscription are observed. */
  canvas: {
    /** Current CSS-pixel extent, independent of backing-buffer pixel ratio. */
    getBoundingClientRect: () => Pick<DOMRect, "width" | "height">;

    /** Optional original-producer observer opt-in read. */
    getAttribute?: (name: string) => string | null;

    /** Optional synchronous completion-event delivery on the original canvas. */
    dispatchEvent?: (event: Event) => boolean;
  };

  /** Host device-to-CSS pixel ratio, capped by the stage for display allocation. */
  pixelRatio: number;

  /** Native renderer borrowed until the browser mount's final retirement. */
  renderer: {
    /** Native sampler capability read when preparing material textures. */
    capabilities: Pick<THREE.WebGLCapabilities, "getMaxAnisotropy">;

    /** Configure backing-buffer pixels per CSS pixel. */
    setPixelRatio: (ratio: number) => void;

    /** Output encoding installed by the owning display stage. */
    outputColorSpace: string;

    /** Display curve selected for the current stage. */
    toneMapping: THREE.ToneMapping;

    /** Exposure applied before output encoding. */
    toneMappingExposure: number;

    /** Static shadow selection and explicit invalidation controls. */
    shadowMap: Pick<THREE.WebGLShadowMap, "enabled" | "type" | "autoUpdate" | "needsUpdate">;

    /** Resize drawing storage; false leaves the canvas CSS layout with its host. */
    setSize: (width: number, height: number, updateStyle: boolean) => void;

    /** Install or withdraw this stage's native frame callback. */
    setAnimationLoop: (callback: (() => void) | null) => void;

    /** Draw the stage's current scene and perspective camera. */
    render: (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;

    /** Native completion and hardware-renderer observation capabilities. */
    getContext: () => {
      /** Wait for submitted native draw commands at an explicit finish boundary. */
      finish: () => void;

      /** Optional native device identification extension. */
      getExtension: (name: string) => { UNMASKED_RENDERER_WEBGL: number } | null;

      /** Read a native context parameter without substituting a requested value. */
      getParameter: (parameter: number) => unknown;

      /** Standard renderer identification parameter token. */
      RENDERER: number;
    };
  };

  /**
   * Bind host-owned orbit controls to this stage's camera.
   *
   * @evidence contracts/common.md#principled-implementation Binds actual control state to the stage camera through public target, limits and update/change seams; optional change events distinguish observed native movement from eager legacy adapters.
   * @evidence contracts/common.md#clear-and-simple-design The stage needs camera control capability without owning the browser event implementation or importing a particular controls class.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Host allocation is explicit and no original control method is patched to intercept movement.
   * @evidence contracts/common.md#meaningful-documentation States host ownership, camera binding and the supported change notification and withdrawal seams.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The factory signature chooses no orbit-update or event algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Control allocation is an owned effect rather than a shared camera result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns returned native controls while the stage removes only its registered change callback on close.
   */
  orbit: (camera: THREE.PerspectiveCamera) => {
    /** World-space point the current camera orbits. */
    target: THREE.Vector3;

    /** Whether native updates retain damped camera movement. */
    enableDamping: boolean;

    /** Minimum allowed camera-to-target distance in metres. */
    minDistance: number;

    /** Maximum allowed camera-to-target distance in metres. */
    maxDistance: number;

    /** Synchronize native orbit state with the camera. */
    update: () => unknown;

    /** Optional native change registration; absence retains eager completion saving. */
    addEventListener?: (type: "change", listener: () => void) => void;

    /** Withdraw the stage's own registered change callback. */
    removeEventListener?: (type: "change", listener: () => void) => void;
  };

  /**
   * Observe the canvas extent and return this subscription's cleanup.
   *
   * @evidence contracts/common.md#principled-implementation Each resize registration returns the exact observer/subscription withdrawal operation, so a stage can stop receiving callbacks before its scene is retired.
   * @evidence contracts/common.md#clear-and-simple-design Subscription creation and release stay paired in one host seam rather than assuming an unowned global resize listener.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup belongs to the actual registration and cannot clear a newer independently registered callback by an unrelated identity.
   * @evidence contracts/common.md#meaningful-documentation States both canvas observation and required cleanup ownership returned to the stage.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type chooses no browser ResizeObserver scheduling strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registrations have distinct effects and are not shared solely because their callbacks produce equal dimensions.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned closer is the stage's subscription lifetime boundary; the host remains responsible for the observer implementation.
   */
  observeResize: (callback: () => void) => (() => void);
}
