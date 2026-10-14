import { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * Image-based lighting, background, exposure, tone mapping, and shadows.
 *
 * @evidence contracts/common.md#principled-implementation Verified environment image media determines linear HDR or sRGB LDR decoding, while explicit intensity, Y rotation, exposure, tone curve and shadow policy configure the shared viewer and inventory paths.
 * @evidence contracts/common.md#clear-and-simple-design Lighting image and presentation controls share scene ownership, overriding a global render specification where their appearance decision actually belongs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contradictory image decoding and enabled VSM point shadows refuse; pcfSoft is the documented PCF alias and disabled shadows price no map work regardless of light flags.
 * @evidence contracts/common.md#meaningful-documentation Defines image/background nulls, color decoding, physical intensity and rotation, exposure authority and effective shadow policy.
 * @author Samchon
 */
export interface IAutoMovieSceneEnvironment {
  /**
   * Equirectangular HDR/LDR asset id, or null for no image-based lighting.
   *
   * Unlike a material's texture binding this states no decoding intent, because an environment image has only one: a Radiance HDR already holds linear radiance, and an 8-bit PNG, JPEG or WebP holds sRGB-encoded colour. The engine proves the media from the registered bytes and the viewer decodes on that fact, so the same image bound as a linear material measurement elsewhere is refused as a contradiction rather than decoded two ways.
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
