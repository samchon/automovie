import { applyAutoMovieShadowParticipation as applyAutoMovieShadowParticipationImplementation } from "./internal/applyAutoMovieShadowParticipation.js";
import { assertAutoMovieSceneShadowProfile as assertAutoMovieSceneShadowProfileImplementation } from "./internal/assertAutoMovieSceneShadowProfile.js";
import { invalidateAutoMovieSceneShadowPrograms as invalidateAutoMovieSceneShadowProgramsImplementation } from "./internal/invalidateAutoMovieSceneShadowPrograms.js";

import type * as THREE from "three";
import { type IAutoMovieFramebufferRenderer } from "./IAutoMovieFramebufferRenderer.js";
import { type IAutoMovieShadowRetirementHost } from "./IAutoMovieShadowRetirementHost.js";
import { resetAutoMovieSceneShadowTargets as resetAutoMovieSceneShadowTargetsImplementation } from "./internal/resetAutoMovieSceneShadowTargets.js";
import { type IAutoMovieLight, type IAutoMovieRenderTextureTarget, type IAutoMovieSceneEnvironment } from "@automovie/interface";
import { readAutoMovieShadowLightSource as readAutoMovieShadowLightSourceImplementation } from "./internal/readAutoMovieShadowLightSource.js";
import { type IAutoMovieShadowTextureHost } from "./IAutoMovieShadowTextureHost.js";
import { readAutoMovieShadowTextureTargets as readAutoMovieShadowTextureTargetsImplementation } from "./internal/readAutoMovieShadowTextureTargets.js";
import { readAutoMovieCubeShadowDepth as readCubeDepthImplementation } from "./internal/readAutoMovieCubeShadowDepth.js";
import { retireAutoMovieCubeShadowDepth as retireCubeDepthImplementation } from "./internal/retireAutoMovieCubeShadowDepth.js";
import { guardAutoMovieSceneShadowRetirement as guardAutoMovieSceneShadowRetirementImplementation } from "./internal/guardAutoMovieSceneShadowRetirement.js";


/** Public operations for Auto Movie Scene Shadow. */
export namespace AutoMovieSceneShadow {
  /** Guard retirement and later reads while shadow resources are uncertain. */
  export function guardRetirement(
    scene: THREE.Scene | undefined,
    renderer: IAutoMovieShadowRetirementHost,
    attempt?: {
      resources: readonly (THREE.RenderTarget | THREE.Texture)[];
      nativeDepth: readonly WebGLTexture[];
      run: () => void;
    },
  ): void {
    guardAutoMovieSceneShadowRetirementImplementation(scene, renderer, attempt);
  }

  /**
   * Retire every scene light's retained shadow attachment after a filter change.
   *
   * PCF comparison depth and VSM ordinary depth/distribution attachments are
   * different GPU products. Three's previous filter is renderer-global while
   * targets belong to individual lights, so a light hidden during a switch can
   * retain the wrong product. Include hidden lights, clear public target slots,
   * and mark their next shadow draw dirty. Disposal attempts every unique target
   * and depth texture even if an independent resource listener fails. Retained
   * targets belong exclusively to this renderer context and the scene's complete
   * light population. External depth borrowers must be detached before
   * retirement; an observable caller destination borrowing these resources is
   * rejected before mutation. Native cube depth is queried before disposal and
   * its still-live handle is released once without changing SDK bookkeeping. A
   * cube depth with version zero is known uninitialized in Three r186 and is
   * disposed without binding or allocating it. Positive version is not evidence
   * of GPU residency; all other queried cubes must be actual retained draws in
   * this context, not manually assigned CPU-only maps dirtied with needsUpdate.
   */
  export function resetTargets(scene: THREE.Scene, renderer: IAutoMovieFramebufferRenderer & IAutoMovieShadowRetirementHost): void {
    resetAutoMovieSceneShadowTargetsImplementation(scene, renderer);
  }

  /**
   * Project one actual punctual light into the Engine's shadow-caster identity.
   * The caller supplies the authored or runtime identity. Native class markers
   * own the kind and castShadow owns participation, independent of visibility.
   * Other scene objects and non-punctual lights return null rather than a
   * fabricated shadow source. Admission and allocation formulas stay in Engine.
   */
  export function readLightSource(id: string, object: THREE.Object3D): Pick<IAutoMovieLight, "id" | "type" | "castShadow"> | null {
    return readAutoMovieShadowLightSourceImplementation(id, object);
  }

  /**
   * Describe retained light targets and required native shadow factory bounds.
   * Hidden and noncasting lights keep their actual retained map/blur rows. An
   * enabled caster whose next factory differs also supplies a distinct planned
   * row; this conservative phase union is neither an observed GLuint count nor a
   * claim that every retained and planned attachment is simultaneously live.
   * Supply the scene's effective override before configuring its render pass.
   * Otherwise the current host selects the native VSM or legacy PCF allocator
   * family. Compatibility admission remains the Engine's single policy owner.
   * Caller scope and light keys identify distinct retained light-owned slots;
   * include each scope once when assembling a context's renderTargets closure.
   */
  export function readTextureTargets(scope: string, renderer: IAutoMovieShadowTextureHost, lights: ReadonlyMap<string, THREE.Light>, effectiveShadows?: IAutoMovieSceneEnvironment["shadows"]): IAutoMovieRenderTextureTarget[] {
    return readAutoMovieShadowTextureTargetsImplementation(scope, renderer, lights, effectiveShadows);
  }

  /**
   * Say which objects cast a shadow and which receive one.
   *
   * `stageScene` validates a light's `castShadow` and refuses shadow settings
   * without it; the render inventory counts casters and its budget constrains
   * that count. {@link buildLight} applies the flag and shadow camera settings,
   * while {@link applyRendererEnvironment} sets the renderer shadow policy
   * reversibly. This adapter supplies the remaining mesh participation flags;
   * enabled maps and casting lights alone do not make a mesh participate.
   *
   * That absence is not visible as an absence. A benchmark authored a fascia and
   * soffit band with a deliberate dark recess above the wall, and the darkening
   * reads as a shadow in every captured frame while being nothing but geometry
   * and material response to light direction. Building the appearance out of
   * geometry is what an author reaches for when the mechanism is missing and no
   * gate says it is missing.
   *
   * The requirement asks for caster and receiver to be **distinguished** rather
   * than blanket-enabled, and the product knows the difference at exactly one
   * place, which is here. A model's parts are solids: they cast and they receive,
   * except that a mesh with a blended (transparent) material receives but does
   * not cast, since a shadow map draws it fully opaque. The standable surfaces
   * under {@link SPACE_GROUP_NAME} are open patches for structural guides and
   * optional flat color. They neither cast nor receive. A volume-free patch
   * casting onto its own plane produces depth acne, and its basic material has no
   * shadow response. Objects without geometry are untouched.
   *
   * Exported, and separate from {@link buildScene}, for the reason
   * {@link applySceneFog} is: a host that assembles its own scene graph — a
   * production's film page, which is what the offline renderer captures — must
   * make the same call, or it captures a production whose shadows were declared
   * and never drawn.
   *
   * A scene that declares no shadows is unaffected. `three.js` compiles no shadow
   * code and renders no depth pass while `renderer.shadowMap.enabled` is false,
   * so these flags are inert until a production turns shadows on, and only such a
   * production sees its frames change.
   */
  export function applyParticipation(root: THREE.Object3D): void {
    applyAutoMovieShadowParticipationImplementation(root);
  }

  /**
   * Admit an actual scene's punctual shadow casters through the Engine profile.
   * Include hidden lights because their retained targets can participate in a
   * later sample. Runtime names, or native UUIDs when unnamed, identify this
   * scene projection; its light-array paths are not authored AST positions. Area
   * and ambient lights have no punctual shadow product. The caller resolves
   * effective renderer policy before any mutable pass state or GPU allocation.
   */
  export function assertProfile(scene: THREE.Scene, shadows: IAutoMovieSceneEnvironment["shadows"]): void {
    assertAutoMovieSceneShadowProfileImplementation(scene, shadows);
  }

  /**
   * Invalidate unique scene materials after the effective shadow enablement or
   * filter changes. Three's program keys include shadow state, but changing the
   * renderer flag alone does not always reevaluate an existing material program.
   * The public needsUpdate boundary makes that changed state observable without
   * touching SDK methods or caches. Shared materials are marked only once.
   */
  export function invalidatePrograms(scene: THREE.Scene): void {
    invalidateAutoMovieSceneShadowProgramsImplementation(scene);
  }

  /**
   * Read a native cube shadow target's owned depth handle through its
   * framebuffer. The target is a retained shadow draw resource, not an
   * unallocated authored target. The SDK exposes shadow maps as generic
   * RenderTarget values; observe their WebGL identity before binding rather than
   * asserting a cube subtype's unrelated texture-array type. Native queries avoid
   * private properties. Restore the caller's target, face and mip even when
   * binding or the query fails. A depth version of zero proves that this r186
   * native product has never been initialized, so refuse before binding can
   * allocate it. A positive version is not upload evidence: the retained-draw,
   * exact-context precondition remains the caller's responsibility, including
   * after CPU needsUpdate assignments.
   */
  export function readCubeDepth(
    renderer: IAutoMovieFramebufferRenderer,
    target: THREE.RenderTarget,
  ): WebGLTexture | null {
    return readCubeDepthImplementation(renderer, target);
  }

  /**
   * Release a still-live owned cube depth handle after native target disposal.
   * Three r186 allocates cube depth outside its source-upload cache, so public
   * Texture.dispose can clear SDK bookkeeping while leaving this allocation.
   * Check the native lifetime first: an SDK that already released it needs no
   * supplemental delete. Public resetState reconciles native bindings, then the
   * caller's separate target, face and mip are restored independently.
   */
  export function retireCubeDepth(
    renderer: IAutoMovieFramebufferRenderer,
    handle: WebGLTexture,
  ): void {
    retireCubeDepthImplementation(renderer, handle);
  }
}
