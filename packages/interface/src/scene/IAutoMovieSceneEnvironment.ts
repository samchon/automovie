import { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * Image-based lighting, background, exposure, tone mapping, and shadows.
 *
 * @evidence contracts/common.md#principled-implementation Environment admission checks image/background exclusivity and finite intensity, rotation, exposure and closed policies. Asset closure assigns Radiance headers linear intent and other admitted image media sRGB intent; the viewer separately uses decoded texture storage type, requiring decoder agreement rather than proving image radiometry.
 * @evidence contracts/common.md#clear-and-simple-design Lighting image and presentation controls share scene ownership, overriding a global render specification where their appearance decision actually belongs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Asset closure refuses contradictory decoding intent; contextual shadow admission refuses enabled VSM point shadows. Header facts do not prove complete decoding or transfer functions. Unresolved viewer images leave lighting unset, pcfSoft aliases PCF, and disabled shadows price no map work.
 * @evidence contracts/common.md#meaningful-documentation Defines image/background nulls, color decoding, physical intensity and rotation, exposure authority and effective shadow policy.
 * @author Samchon
 */
export interface IAutoMovieSceneEnvironment {
  /**
   * Equirectangular HDR/LDR asset id, or null for no image-based lighting.
   *
   * This carries no authored colour-space field. Production asset closure interprets supported Radiance header facts as linear and PNG/JPEG/WebP facts as sRGB, checking other uses for contradictory intent. The viewer instead treats unsigned-byte decoded storage as sRGB and other storage as linear; the host decoder must agree with that convention. Neither header media nor storage type certifies a source colour profile or physical radiance, and an unresolved image supplies no image lighting.
   */
  image: string | null;

  /** Solid background when `image` is null, or null for transparent black. */
  background: IAutoMovieColor | null;

  /** Non-negative image-based-light intensity. */
  intensity: number;

  /** Finite world-Y rotation of the environment in degrees. */
  rotationDeg: number;

  /** Positive renderer exposure multiplier. */
  exposure: number;

  /**
   * Beauty-pass tone mapping; structural passes always bypass it.
   *
   * Authoritative over {@link IAutoMovieRenderSpec.toneMapping} for every scene that declares an environment: the curve belongs with the exposure and image lighting it is chosen against, and one render spec spans many scenes.
   */
  toneMapping: "none" | "acesFilmic";

  /**
   * Renderer shadow-map policy for physical scene lights.
   *
   * The master switch, and it outranks the lights: `enabled: false` renders no shadow map for this scene's beauty pass however many of its lights declare `castShadow`, and the render budget prices them the same way. A light's `castShadow` and `shadow` settings therefore state what that light would cast; this states whether the scene pays for any of it, which is what lets a draft drop the whole cost without editing every light in the set.
   */
  shadows: {
    /** Whether shadow maps are rendered in beauty passes. */
    enabled: boolean;

    /**
     * Effective filters are PCF and VSM. The legacy pcfSoft spelling is a PCF alias. VSM is supported for directional and spot shadows; enabled shadow-casting point lights with VSM are refused before rendering.
     */
    type: "pcf" | "pcfSoft" | "vsm";
  };
}
