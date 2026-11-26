import type * as THREE from "three";
import { type IAutoMovieFramebufferRenderer } from "./IAutoMovieFramebufferRenderer.js";
import { type IAutoMovieShadowRetirementHost } from "./IAutoMovieShadowRetirementHost.js";
import { resetAutoMovieSceneShadowTargets as resetAutoMovieSceneShadowTargetsImplementation } from "./internal/resetAutoMovieSceneShadowTargets.js";
import { type IAutoMovieLight, type IAutoMovieRenderTextureTarget, type IAutoMovieSceneEnvironment } from "@automovie/interface";
import { readAutoMovieShadowLightSource as readAutoMovieShadowLightSourceImplementation } from "./internal/readAutoMovieShadowLightSource.js";
import { type IAutoMovieShadowTextureHost } from "./IAutoMovieShadowTextureHost.js";
import { readAutoMovieShadowTextureTargets as readAutoMovieShadowTextureTargetsImplementation } from "./internal/readAutoMovieShadowTextureTargets.js";

/** Public operations for Auto Movie Scene Shadow. */
export namespace AutoMovieSceneShadow {
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
}
