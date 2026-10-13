import type { IAutoMovieTextureReference } from "@automovie/interface";

/**
 * One texture asset's decoded upload facts, supplied by its capture host.
 *
 * @author Samchon
 */
export interface IAutoMovieRenderTextureSource {
  /**
   * Whether reported current fields can certify native allocation state.
   * False leaves storage and sharing/cardinality unknown. Omission preserves
   * legacy fresh-context facts; this never replaces missing sampler or identity
   * authority. Metadata-only manual layouts cannot certify cached native keys
   * after the SDK mutates their generation flag during upload.
   */
  allocationStateKnown?: boolean;

  /**
   * Actual inherited upload decoding. Linear material data uses NoColorSpace;
   * linear image lighting uses LinearSRGBColorSpace, a distinct native key.
   */
  colorSpace?: "srgb" | "linear" | "linear-environment";

  /**
   * Scene image-lighting decoding selected from the actual component type.
   * Explicit internal storage width does not override that decoding decision.
   */
  environmentColorSpace?: "srgb" | "linear-environment";

  /**
   * Owned sharp-background cube color storage, observed from the source's
   * component type and the renderer's RGBA cube factory. The factory inherits
   * component type but does not inherit raw channel count or internal format.
   * Existing cached conversions require an unchanged owned creation tuple;
   * current mutable source properties alone cannot certify those allocations.
   * Changed or unsuccessfully retired conversions set allocationStateKnown
   * false even when this prospective factory format remains reportable.
   * Missing or unsupported output facts leave required cube bytes unknown.
   * This is a host runtime fact, never an author-entered byte estimate.
   */
  environmentBackgroundFormat?: "rgba8" | "rgba16f" | "rgba32f";

  /**
   * Sampling intent of the host's sharp-background conversion. The native
   * factory may first upload a configured mip-linear image with a linear
   * filter, then restore the property without changing its cached upload key.
   * Closure retains configured and factory choices as a conservative union;
   * this does not claim either choice is the currently allocated native key.
   */
  environmentSampler?: IAutoMovieTextureReference["sampler"];

  /**
   * Native factory sampling key for choices outside the authorable sampler
   * union. Null explicitly leaves that intent uncertified. Missing factory
   * facts cannot certify an inherited or mip-linear environment sampler;
   * known legacy non-mip-linear sampling needs no alternate conversion key.
   */
  environmentSamplerState?: string | null;

  /**
   * Opaque equality token for the host's actual decoded Source object. Tokens
   * have no persistent meaning; target identity records their sharing relation
   * rather than their random spelling. Multiple live scopes require this fact.
   */
  sourceIdentity?: string;

  /**
   * Opaque equality token for the actual Texture object. Environment derivatives
   * are cached by this object, including independently configured clones.
   */
  textureIdentity?: string;

  /**
   * Canonical inherited upload flags reported by the host. Binding-controlled
   * sampling and color decoding are accounted separately; UVs are excluded.
   */
  uploadState?: string;

  /**
   * Actual supported uncompressed R16F, RG16F or RGBA layout from the decode host.
   * Omission leaves device bytes unknown; dimensions alone do not identify HDR
   * component storage. Authors do not supply this as a material parameter.
   */
  format?: "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f";

  /**
   * The decoded source's inherited sampler, reported by its host when known.
   * Binding samplers replace it; UV transforms do not replace upload state.
   */
  sampler?: IAutoMovieTextureReference["sampler"];

  /**
   * Actual native sampler key when the host observed it. A null value means
   * unsupported native sampling; omission retains legacy unreported facts.
   * The key preserves supported renderer filters absent from the authorable
   * sampler union. A fully declared binding sampler replaces inherited state.
   */
  samplerState?: string | null;

  /**
   * The source object's generation flag, when the host reports it. Native
   * generation retains a chain even when a binding samples only its base.
   */
  generateMipmaps?: boolean;

  /**
   * More than one explicit decoded mip level is already present on the source.
   */
  explicitMipmaps?: boolean;

  /** Project asset id, as a material binding cites it. */
  asset: string;

  /** Decoded width in pixels, a positive integer. */
  width: number;

  /** Decoded height in pixels, a positive integer. */
  height: number;

  /**
   * Whether the renderer uploads a full mip chain. A mipmapped 2D texture costs
   * integer-halved levels down to one texel on each axis. Non-square and
   * non-power-of-two chains are counted from those extents, not a multiplier.
   */
  mipmapped: boolean;
}
