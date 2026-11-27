import type { IAutoMovieColor } from "../color/IAutoMovieColor";
import type { IAutoMovieSceneShadows } from "./IAutoMovieSceneShadows";

/** Image-based lighting, background, exposure, tone mapping, and shadows. */
export interface IAutoMovieSceneEnvironment {
  /**
   * Equirectangular HDR/LDR asset id, or null for no image-based lighting.
   *
   * This carries no authored colour-space field. Production asset closure
   * interprets supported Radiance header facts as linear and PNG/JPEG/WebP
   * facts as sRGB, checking other uses for contradictory intent. The viewer
   * instead treats unsigned-byte decoded storage as sRGB and other storage as
   * linear; the host decoder must agree with that convention. Neither header
   * media nor storage type certifies a source colour profile or physical
   * radiance, and an unresolved image supplies no image lighting.
   */
  image: string | null;

  /** Solid background when `image` is null, or null for transparent black. */
  background: IAutoMovieColor | null;

  /** Non-negative image-based-light intensity. */
  intensity: number;

  /** Finite world-Y rotation of the environment in degrees. */
  rotationDeg: number;

  /**
   * Positive renderer exposure multiplier for the compiled-scene pass
   * (`AutoMovieRenderScenePass.render`) and its render budget projection.
   *
   * On the draw path, which delivers a production's film, the draw scene's
   * `optics` owns exposure instead (see {@link IAutoMovieFilmOptics}); this
   * value does not reach a drawn frame there.
   */
  exposure: number;

  /**
   * Beauty-pass tone mapping of the compiled-scene pass
   * (`AutoMovieRenderScenePass.render`) and its render budget projection; structural
   * passes always bypass it.
   *
   * Authoritative over {@link IAutoMovieRenderSpec.toneMapping} for every scene
   * that declares an environment: the curve belongs with the exposure and image
   * lighting it is chosen against, and one render spec spans many scenes. On
   * the draw path the draw scene's `optics` owns the curve instead, because
   * that pass renders into a linear target and applies the film's response
   * last.
   */
  toneMapping: "none" | "acesFilmic";

  /**
   * Renderer shadow-map policy for physical scene lights.
   *
   * The master switch, and it outranks the lights: `enabled: false` renders no
   * shadow map for this scene's beauty pass however many of its lights declare
   * `castShadow`, and the render budget prices them the same way. A light's
   * `castShadow` and `shadow` settings therefore state what that light would
   * cast; this states whether the scene pays for any of it, which is what lets
   * a draft drop the whole cost without editing every light in the set.
   */
  shadows: IAutoMovieSceneShadows;
}
