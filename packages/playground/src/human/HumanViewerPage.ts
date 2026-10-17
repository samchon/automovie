import {
  AutoMovieHuman,
  AutoMovieHumanConverter,
  IAutoMovieHumanConstructionNet,
  IAutoMovieHumanTraits,
} from "@automovie/human";
import {
  AutoMovieHumanoidBone,
  IAutoMovieExpression,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import {
  AutoMovieTextureCache,
  IAutoMovieModelObject,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { HumanViewerPageOperations } from "./HumanViewerPageOperations";
import { IHumanViewerSession } from "./IHumanViewerSession";
import { IHumanViewerTextureState } from "./IHumanViewerTextureState";
import { admitHumanViewerCaptureView } from "./admitHumanViewerCaptureView";
import { bootHumanViewerPage } from "./bootHumanViewerPage";
import { createHumanViewerDisposer } from "./createHumanViewerDisposer";
import { frameHumanViewerCamera } from "./frameHumanViewerCamera";
import { installHumanViewerCapture } from "./installHumanViewerCapture";
import { installHumanViewerDisplay } from "./installHumanViewerDisplay";
import { installHumanViewerPanels } from "./installHumanViewerPanels";
import { installHumanViewerSession } from "./installHumanViewerSession";
import { lightHumanViewer } from "./lightHumanViewer";
import type { mountHumanCurveDesignControls } from "./mountHumanCurveDesignControls";
import { mountHumanViewerCurveInspection } from "./mountHumanViewerCurveInspection";

/** Framing scale owned by the Human page. */
type Scale = HumanViewerPage.Scale;
/** Accepted documents and their reusable Human instance. */
type IAccepted = HumanViewerPage.IAccepted;
/** Surface/construction composition selected by the page. */
type DisplayMode = HumanViewerPage.DisplayMode;

/** Own one mounted Human page and connect session, scene display, camera/capture and document controls.
 *
 * @evidence contracts/common.md#principled-implementation Installs ordinary page operations before loading saved documents and keeps a single state owner.
 * @evidence contracts/common.md#clear-and-simple-design Responsibility modules borrow this explicit state; the entry file only mounts it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the admitted public documents and the same live page instances; no fixture or capture-only geometry is substituted.
 * @evidence contracts/common.md#meaningful-documentation Describes the module's page responsibility and ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms State coordination is fixed; actual model, UI and capture work remains with its responsible operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Session identity controls Human reuse; edits and captures use the current accepted state rather than a second model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns its observer, controls, model, textures, renderer and teardown.
 */
export class HumanViewerPage extends HumanViewerPageOperations {
  /** Browser storage slot for the admitted Human documents and separate inspection selection. */
  public STORAGE_KEY: string = "automovie.human.session";

  /** Stable model id used by Human generation and ordinary viewer pose lookup. */
  public MODEL_ID: string = "human";

  /** Provisional skin material policy skips texture-field bakers while form is developed; pose and geometry are unchanged. */
  public readonly skinFinish: NonNullable<
    Parameters<AutoMovieHuman["getModel"]>[0]["skinFinish"]
  > = "plain";

  /** Dimensionless camera framing margins for whole and bone-close views. */
  public MARGIN: Record<"whole" | "close", number> = {
    whole: 1.1,
    close: 1.25,
  };

  /** Public traits converter shared by the trait editor and session creation. */
  public converter: AutoMovieHumanConverter = new AutoMovieHumanConverter();

  /** Initial authoring example used only when no valid saved session is available. */
  public DEFAULT_TRAITS: IAutoMovieHumanTraits = {
    version: 1,
    sex: "female",
    age: 30,
    stature: null,
    population: "european",
    build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
  };

  /** Existing skin assembly route; curve design never replaces it. */
  public assembly: "parts" | "joined" = "parts";

  /** Existing profile or demonstration paddle generator chosen before admission. */
  public hand: "profile" | "paddle" = "profile";

  /** Document canvas borrowed by the one mounted renderer. */
  public canvas: HTMLCanvasElement = document.querySelector("#view")!;

  /** Page-owned scene, cleared after model resources and mounted work stop. */
  public scene: THREE.Scene = new THREE.Scene();

  /** Fill light retained for this scene lifetime. */
  public hemisphere: THREE.HemisphereLight = new THREE.HemisphereLight(
    0xffffff,
    0x9aa3b2,
    lightHumanViewer.INTENSITY.default.hemisphere,
  );

  /** Directional key light used by interactive framing and captures. */
  public sun: THREE.DirectionalLight = new THREE.DirectionalLight(
    0xffffff,
    lightHumanViewer.INTENSITY.default.sun,
  );

  /** Page light override; null uses the default directional light. */
  public pageLight: lightHumanViewer.ILight | null = null;

  /** Inspection floor hidden when the camera is below it. */
  public grid: THREE.GridHelper = new THREE.GridHelper(
    6,
    60,
    0xb8c0cc,
    0xd5dbe4,
  );

  /** Perspective camera shared by controls, display and ordinary capture. */
  public camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    30,
    1,
    0.01,
    100,
  );

  /** Orbit controls released when the mounted page ends. */
  public controls!: OrbitControls;

  /** Count of actual mounted loop callbacks, used by automation readiness. */
  public frames: number = 0;

  /** Mounted renderer and loop owner, stopped once during page teardown. */
  public handle: ReturnType<typeof mountViewer> = mountViewer(
    this.canvas,
    this.scene,
    this.camera,
    (): void => {
      this.controls.update();
      ++this.frames;
    },
  );

  /** Actual WebGL renderer string recorded beside ordinary captures. */
  public rendererName: string = ((): string => {
    const gl: WebGLRenderingContext | WebGL2RenderingContext =
      this.handle.renderer.getContext();
    const info: WEBGL_debug_renderer_info | null = gl.getExtension(
      "WEBGL_debug_renderer_info",
    );
    return String(
      gl.getParameter(
        info !== null ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER,
      ),
    );
  })();

  /** Last completely admitted session and its reusable Human instance. */
  public current!: IAccepted;

  /** Current posed and expressed model object, replaced through the display owner. */
  public object: IAutoMovieModelObject | null = null;

  /** Optional skeleton-line helper released on model replacement. */
  public bonesHelper: THREE.SkeletonHelper | null = null;

  /** Trait editing history, which never overrides a saved admitted identity. */
  public traitsDraft: IAutoMovieHumanTraits = structuredClone(
    this.DEFAULT_TRAITS,
  );

  /** Actual skin or construction group ids hidden by part isolation. */
  public hidden: Set<string> = new Set();

  /** Current framing, focus and light request used by both screen and capture. */
  public view: {
    view: frameHumanViewerCamera.View | frameHumanViewerCamera.IAngle;
    scale: Scale;
    focus: AutoMovieHumanoidBone;
    /** Framing margin overriding the scale's own. */
    margin?: number;
    /** Point framed instead of the focus bone's subtree, with `radius` metres around it. */
    point?: admitHumanViewerCaptureView.IPoint;
    radius?: number;
    /** Key light overriding the page's. */
    light?: lightHumanViewer.ILight;
  } = {
    view: "front",
    scale: "whole",
    focus: "head",
  };

  /** Whether the current skeleton helper is mounted. */
  public showBones: boolean = false;

  /** Whether stick geometry remains visible alongside skin. */
  public showStick: boolean = false;

  /** Texture cache for the currently displayed model; stale decodes are released. */
  public textures: AutoMovieTextureCache | null = null;

  /** Completion of current texture priming, awaited before ordinary capture. */
  public textured: Promise<void> = Promise.resolve();

  /** Current accepted display's readiness and actual binding observations, owned by the display installer and described by {@link IHumanViewerTextureState}. */
  public textureState: IHumanViewerTextureState = {
    generation: 0,
    status: "pending",
    declaredOccurrences: 0,
    resolvedOccurrences: 0,
    error: null,
    materials: [],
  };

  /** Supported existing surface and construction compositions. */
  public DISPLAY_MODES: readonly DisplayMode[] = [
    "surface",
    "overlay",
    "net",
    "construction",
  ];

  /** Current composition, restored after capture even on refusal. */
  public displayMode: DisplayMode = "surface";

  /** Current skin construction cached until model display replacement. */
  public nets: IAutoMovieHumanConstructionNet[] | null = null;

  /** Drawn selected net group, disposed before rebuilding its lines and points. */
  public construction: THREE.Group | null = null;

  /** Page-owned transparent comparison material retained across model replacement. */
  public GHOST: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    roughness: 0.9,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  /** Page-owned invisible surface material that preserves framing bounds. */
  public CONSTRUCTION_ONLY: THREE.MeshBasicMaterial =
    new THREE.MeshBasicMaterial({
      visible: false,
    });

  /** Whether existing skin materials sample their normal relief maps. */
  public relief: boolean = true;

  /** Metre-valued close-view margin around the focus skeleton joints. */
  public JOINT_MARGIN: number = 0.06;

  /** Release removed tree resources while retaining the page's two substitution materials.
   *
   * @evidence contracts/common.md#principled-implementation Uses createHumanViewerDisposer with this page's actual ghost and construction-only materials.
   * @evidence contracts/common.md#clear-and-simple-design The page owns the retained policy; disposeHumanViewerObject owns traversal and identity deduplication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No dispose method or global is replaced, and line/point resources are not skipped.
   * @evidence contracts/common.md#meaningful-documentation Documents removed-tree ownership and the separate page-material/texture lifetimes.
   * @evidence contracts/performance.md#efficient-algorithms One fixed retained Set is created; each release traverses actual drawable resources in the removed tree.
   * @evidence contracts/performance.md#reuse-equivalent-work The same retained Set is shared across model and construction replacements on this page.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Tree geometry and materials are attempted once per collected identity; final page disposal separately releases retained materials.
   */
  public readonly disposeObject: (root: THREE.Object3D) => void =
    createHumanViewerDisposer({
      ghost: this.GHOST,
      constructionOnly: this.CONSTRUCTION_ONLY,
    });

  /** Canvas resize observation released at the terminal page boundary. */
  public readonly resizeObserver: ResizeObserver = new ResizeObserver(
    (): void => this.resize(),
  );

  /** Terminal lifetime, also checked by pending texture completion. */
  public closed: boolean = false;

  /** Visible selector and named physical editor for this Human. */
  public curveControls: ReturnType<
    typeof mountHumanCurveDesignControls
  > | null = null;

  /** Human that owns the mounted separate design cache. */
  public curveHuman: AutoMovieHuman | null = null;

  /** Last persisted selection, distinguishing session loads from UI edits. */
  public curveSessionKey: string = "";

  /** Actual selected construction shared with capture. */
  public curveDisplay:
    | import("./HumanCurveDesignInspectionState").HumanCurveDesignInspectionState.Display
    | null = null;

  /** Reconcile the visible inspection editor with this page's admitted Human and saved selection.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to mountHumanViewerCurveInspection using this actual page as the shared consumer state.
   * @evidence contracts/common.md#clear-and-simple-design The adapter owns editor/cache reconciliation while the page owns when accepted display invokes it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not route through a hidden Human or inject source geometry into named physical measurements.
   * @evidence contracts/common.md#meaningful-documentation States that the mounted editor follows admitted Human identity and selection, not traits history.
   * @evidence contracts/performance.md#efficient-algorithms Adapter cost is a key comparison for reuse or editor rebuild plus requested generation when state changes.
   * @evidence contracts/performance.md#reuse-equivalent-work The adapter reuses only the same Human object and matching serialized selection; otherwise it disposes the old editor.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The page retains the returned editor handle and releases it on replacement or terminal disposal.
   */
  public mountCurveInspection: () => void = (): void =>
    mountHumanViewerCurveInspection(this);

  /** End the page once and attempt every acquired viewer resource owner.
   *
   * @evidence contracts/common.md#principled-implementation Sets the terminal flag, attempts independent cleanup operations, and aggregates synchronous failures after all attempts.
   * @evidence contracts/common.md#clear-and-simple-design Page teardown coordinates mounted loop, controls, editor, scene resources, cache and published API owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Public disposal is not proof of OS/GPU kernel release; asynchronous cache errors remain reported separately.
   * @evidence contracts/common.md#meaningful-documentation Documents sticky once-only entry, independent cleanup attempts and error propagation limits.
   * @evidence contracts/performance.md#efficient-algorithms Traverses removed model/construction resources and a fixed panel list; no model is regenerated during shutdown.
   * @evidence contracts/performance.md#reuse-equivalent-work The closed flag suppresses repeated teardown rather than replaying native disposal effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Stops the mount and observer, releases current scene owners and cached textures, clears panel DOM, and removes the page API.
   */
  public dispose(): void {
    if (this.closed) return;
    this.closed = true;
    const failures: unknown[] = [];
    const release: (operation: () => void) => void = (
      operation: () => void,
    ): void => {
      try {
        operation();
      } catch (cause) {
        failures.push(cause);
      }
    };
    release((): void => this.handle.stop());
    release((): void => this.resizeObserver.disconnect());
    release((): void => this.controls?.dispose());
    release((): void => this.curveControls?.dispose());
    if (this.construction !== null)
      release((): void => this.disposeObject(this.construction!));
    if (this.object !== null)
      release((): void => this.disposeObject(this.object!.object));
    if (this.bonesHelper !== null)
      release((): void => this.bonesHelper!.dispose());
    release((): void => this.disposeObject(this.grid));
    release((): void => this.GHOST.dispose());
    release((): void => this.CONSTRUCTION_ONLY.dispose());
    if (this.textures !== null) void this.textures.dispose().catch(this.error);
    this.textures = null;
    this.scene.clear();
    for (const selector of [
      "#views",
      "#parts",
      "#traits",
      "#identity",
      "#pose",
      "#expression",
      "#appearance",
      "#json",
      "#session",
      "#curve-design",
      "#construction-key",
    ])
      document.querySelector(selector)?.replaceChildren();
    delete (window as unknown as { __automovieHuman?: unknown })
      .__automovieHuman;
    if (failures.length !== 0)
      throw new AggregateError(failures, "Human page cleanup failed.");
  }

  /** Write the latest ordinary action message to the page status element.
   *
   * @evidence contracts/common.md#principled-implementation Assigns textContent to the declared status host, keeping error reporting in its separate element.
   * @evidence contracts/common.md#clear-and-simple-design One page setter serves session, editor and capture completion messages.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses native DOM text rather than interpreting messages as HTML or replacing the output host.
   * @evidence contracts/common.md#meaningful-documentation States that status publication does not clear or imply success of the separate error state.
   * @evidence contracts/performance.md#efficient-algorithms Copies the supplied message text; it performs no geometry traversal or parsing.
   * @evidence contracts/performance.md#reuse-equivalent-work This setter coordinates no retained task or equivalence cache; each message is the latest action output.
   * @evidence contracts/performance.md#bound-retention-and-release-resources It owns no listener or external handle; the document owns the existing status element.
   */
  public status: (text: string) => void = (text: string): void => {
    document.querySelector("#status")!.textContent = text;
  };

  /** Write a caught action failure, or clear it with null, without regenerating the person.
   *
   * @evidence contracts/common.md#principled-implementation Uses Error.message for Error instances, String for other causes, and an empty string for null.
   * @evidence contracts/common.md#clear-and-simple-design One page error host is shared by synchronous admission and asynchronous texture/capture failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No retry, replacement model or successful verification claim is synthesized from the caught cause.
   * @evidence contracts/common.md#meaningful-documentation Documents null clearing and the distinction between reporting a failure and rolling back a display mutation.
   * @evidence contracts/performance.md#efficient-algorithms Formats one cause and assigns its text without scanning model data.
   * @evidence contracts/performance.md#reuse-equivalent-work Error publication coordinates no cache; each observed cause replaces the current message.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only DOM text, not the caught Error object, task or resource handle.
   */
  public error: (cause: unknown) => void = (cause: unknown): void => {
    document.querySelector("#error")!.textContent =
      cause === null
        ? ""
        : cause instanceof Error
          ? cause.message
          : String(cause);
  };

  /** Match renderer dimensions and camera aspect to the canvas CSS bounds.
   *
   * @evidence contracts/common.md#principled-implementation Uses client dimensions with a one-pixel zero-size fallback, then updates the perspective projection.
   * @evidence contracts/common.md#clear-and-simple-design ResizeObserver invokes this page operation; mountViewer remains renderer owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The nonzero fallback prevents division by zero and is a layout rule, not a geometry-specific framing correction.
   * @evidence contracts/common.md#meaningful-documentation Names CSS sizing, drawing-buffer update and camera aspect/projection coupling.
   * @evidence contracts/performance.md#efficient-algorithms Page work reads two dimensions and updates the camera; renderer buffer resizing cost belongs to the requested pixel dimensions.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the mounted renderer/camera and does not allocate a second capture viewport.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no new owner; page disposal disconnects the observer and stops the mounted renderer.
   */
  public resize: () => void = (): void => {
    const width: number = this.canvas.clientWidth || 1;
    const height: number = this.canvas.clientHeight || 1;
    this.handle.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  /** Install operations before any saved document is observed. */
  public constructor() {
    super();
    const page: HumanViewerPage = this;
    try {
      this.controls = new OrbitControls(this.camera, this.canvas);
      installHumanViewerSession(page);
      installHumanViewerDisplay(page);
      installHumanViewerCapture(page);
      installHumanViewerPanels(page);
      this.scene.background = new THREE.Color(0xf2f4f8);
      this.scene.add(this.hemisphere, this.sun, this.sun.target, this.grid);
      this.sun.position.copy(lightHumanViewer.DEFAULT_POSITION);
      this.scene.onBeforeRender = (
        _renderer: THREE.WebGLRenderer,
        _scene: THREE.Scene,
        eye: THREE.Camera,
      ): void => {
        this.grid.visible =
          eye.getWorldPosition(new THREE.Vector3()).y > this.grid.position.y;
      };
      this.resizeObserver.observe(this.canvas);
      bootHumanViewerPage(page);
    } catch (cause) {
      try {
        this.dispose();
      } catch (cleanup) {
        throw new AggregateError(
          [cause, cleanup],
          "Human page initialization and cleanup failed.",
        );
      }
      throw cause;
    }
  }
}
/** Page-local document, display and camera types. */
export namespace HumanViewerPage {
  /** Choose whole-model framing or a close bone focus.
   *
   * @evidence contracts/common.md#principled-implementation The closed string union is consumed by actual frame and capture-plan branches.
   * @evidence contracts/common.md#clear-and-simple-design Keeps framing scope distinct from preset direction and optional point focus.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not encode a model-specific camera or a geometry correction.
   * @evidence contracts/common.md#meaningful-documentation Names the two supported scopes and their bounds responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased union performs no framing computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased union coordinates no reused work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An erased union retains no camera or renderer.
   */
  export type Scale = "whole" | "close";

  /** Choose existing surface and construction display composition.
   *
   * @evidence contracts/common.md#principled-implementation The closed union names modes consumed by applyDisplayMode, capture validation and ordinary UI options.
   * @evidence contracts/common.md#clear-and-simple-design Composition is separate from which current-skin or curve-design source is selected.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No member declares that an independently generated skin was produced by the selected design.
   * @evidence contracts/common.md#meaningful-documentation Documents the four supported composition labels and their shared consumer role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased union runs no scene traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased union holds no cross-mode cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An erased union owns no draw resource.
   */
  export type DisplayMode = "surface" | "overlay" | "net" | "construction";

  /** Carry admitted documents and their matching Human/model generation into display.
   *
   * @evidence contracts/common.md#principled-implementation Groups the actual Human, model, skeleton, pose, expression and cloned session returned by admit.
   * @evidence contracts/common.md#clear-and-simple-design One accepted record is the handoff between session admission, display and asynchronous texture identity checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type stores generated output separately from public inputs; it does not imply anatomical or visual acceptance.
   * @evidence contracts/common.md#meaningful-documentation Members name generator/identity reuse keys and the ownership/meaning of each admitted or generated value.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record type performs no validation, generation or drawing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record type itself owns no cache; admit and texture use its explicit keys and record identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handles; the page, Human, display objects and texture cache retain their concrete owners.
   */
  export type IAccepted = HumanViewerPageOperations.IAccepted;
}
