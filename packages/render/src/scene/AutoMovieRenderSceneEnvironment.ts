import type * as THREE from "three";
import { type IAutoMovieRendererEnvironmentHandle } from "./IAutoMovieRendererEnvironmentHandle";
import { type IAutoMovieSceneEnvironment, type AutoMovieGuidePass, type IAutoMovieFog } from "@automovie/interface";
import { applyRendererEnvironment as applyRendererEnvironmentImplementation } from "./internal/applyRendererEnvironment";
import { applySceneEnvironment as applySceneEnvironmentImplementation } from "./internal/applySceneEnvironment";
import { applySceneFog as applySceneFogImplementation } from "./internal/applySceneFog";

/** Public operations for Auto Movie Render Scene Environment. */
export namespace AutoMovieRenderSceneEnvironment {
  /**
   * Configure exposure, tone mapping and shadow policy for one pass. Structural
   * passes bypass all three so their values remain geometric facts.
   *
   * Precedence, settled once here so no caller has to decide it: a scene that
   * declares an `environment` owns the renderer's curve, exposure and shadow
   * policy for its own beauty pass. `delivery` is the render spec's
   * `toneMapping`, the value a whole sequence carries, and it applies only to a
   * scene that declared no environment. Omitting it leaves the host renderer's
   * own curve, exposure and shadow policy exactly as it found them: a caller that
   * knows no delivery curve states none rather than imposing `none`, which is how
   * a pre-environment production keeps rendering what it always rendered.
   *
   * This precedence governs the compiled-scene pass (`AutoMovieRenderScenePass.render`)
   * and its budget projection, which draw straight to their target. On the draw
   * path a draw scene's `optics` owns exposure and curve instead:
   * `AutoMovieRenderFilmResponseStage` holds the renderer's own curve at none and its
   * exposure at one while the beauty pass draws into its linear target.
   */
  export function applyRendererEnvironment(renderer: Pick<
    THREE.WebGLRenderer,
    "shadowMap" | "toneMapping" | "toneMappingExposure"
  >, environment: IAutoMovieSceneEnvironment | null | undefined, pass: AutoMovieGuidePass, delivery?: IAutoMovieSceneEnvironment["toneMapping"]): IAutoMovieRendererEnvironmentHandle {
    return applyRendererEnvironmentImplementation(renderer, environment, pass, delivery);
  }

  /**
   * Apply image lighting and background without adding scene-graph children.
   *
   * A declared image reaches the scene only when the host resolved it; an image
   * the host could not decode leaves image lighting unset and uses the declared
   * solid background, or transparency when that background is null. The resolved
   * texture is configured here (equirectangular mapping and the color-space
   * convention selected from its storage type), so the caller hands over a
   * texture object this scene owns, never one a material is also writing sampling
   * state onto. The exclusive handoff retires earlier cube/PMREM conversions
   * once. Stable inputs keep their cache and version; legal content, sampling or
   * generation changes retire the old conversion before a replacement tuple is
   * accepted. Immutable capacity changes require a new Texture and decoded
   * Source. Shared ownership and failed retirement refuse before scene state
   * changes.
   */
  export function applySceneEnvironment(scene: THREE.Scene, environment: IAutoMovieSceneEnvironment | null | undefined, texture?: THREE.Texture): void {
    applySceneEnvironmentImplementation(scene, environment, texture);
  }

  /**
   * Put the scene's declared atmosphere on a `three.js` scene, or clear it when
   * nothing is declared.
   *
   * `FogExp2` is the exact law {@link IAutoMovieFog} documents and
   * {@link sceneFogTransmittance} reproduces on the CPU: the shader's `1 -
   * exp(-(density * depth)^2)` mix toward `color`. Nothing is converted on the
   * way in. `density` is handed over verbatim, and the color is written with
   * `setRGB` on the working (linear) color space, the same call
   * {@link applyLightState} makes for a light, because `IAutoMovieColor` is linear
   * by contract and a second convention here would make the fog and the key light
   * disagree about what `0.5` means.
   *
   * Exported, and separate from {@link buildScene}, for the reason `buildLight`
   * is: a host that assembles its own scene graph (a production's film page,
   * which is what the offline renderer captures) must apply the FILM's atmosphere
   * through this one call rather than decorating its page with fog of its own. A
   * page that fogs itself proves nothing about the production.
   *
   * Absent or `null` clears `scene.fog`, which is `three.js`'s own "no fog":
   * fog-capable materials stop receiving the fog term. That omission says nothing
   * about other render state or byte-for-byte frame equality.
   */
  export function applySceneFog(scene: THREE.Scene, fog: IAutoMovieFog | null | undefined): void {
    applySceneFogImplementation(scene, fog);
  }
}
