import type { IAutoMovieTextureReference } from "@automovie/interface";

/**
 * One texture asset's decoded upload facts, supplied by its capture host.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries decoded texture dimensions and mip policy for device-memory estimation.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Defines the texture facts required before preflight may report measured bytes.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureSource {
  /**
   * Whether reported current fields can certify native allocation state.
   * False leaves storage and sharing/cardinality unknown. Omission preserves
   * legacy fresh-context facts; this never replaces missing sampler or identity
   * authority. Metadata-only manual layouts cannot certify cached native keys
   * after the SDK mutates their generation flag during upload.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Preserves unobserved native allocation authority instead of treating mutable fields as exact sharing evidence.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps uncertified storage and allocation population unbounded for normal admission refusal.
   */
  allocationStateKnown?: boolean;

  /**
   * Actual inherited upload decoding. Linear material data uses NoColorSpace;
   * linear image lighting uses LinearSRGBColorSpace, a distinct native key.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies the actual color-space key of host-owned runtime texture uploads.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes native allocation states even when their mathematical values are both linear.
   */
  colorSpace?: "srgb" | "linear" | "linear-environment";

  /**
   * Scene image-lighting decoding selected from the actual component type.
   * Explicit internal storage width does not override that decoding decision.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Keeps image-lighting upload state independent of internal storage width.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries the Viewer-owned image decoding choice into environment allocation identity.
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
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Separates raw image storage from its actual derived background representation.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Requires the host's native cube output format rather than inferring it from raw internal storage.
   */
  environmentBackgroundFormat?: "rgba8" | "rgba16f" | "rgba32f";

  /**
   * Sampling intent of the host's sharp-background conversion. The native
   * factory may first upload a configured mip-linear image with a linear
   * filter, then restore the property without changing its cached upload key.
   * Closure retains configured and factory choices as a conservative union;
   * this does not claim either choice is the currently allocated native key.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Bounds distinct configured and native conversion upload variants of one decoded Source.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves initialization-order sampling choices without changing scene texture properties.
   */
  environmentSampler?: IAutoMovieTextureReference["sampler"];

  /**
   * Native factory sampling key for choices outside the authorable sampler
   * union. Null explicitly leaves that intent uncertified. Missing factory
   * facts cannot certify an inherited or mip-linear environment sampler;
   * known legacy non-mip-linear sampling needs no alternate conversion key.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Prevents restored mutable sampling properties from hiding an additional native allocation variant.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps missing or unsupported required factory intent visible to normal admission refusal.
   */
  environmentSamplerState?: string | null;

  /**
   * Opaque equality token for the host's actual decoded Source object. Tokens
   * have no persistent meaning; target identity records their sharing relation
   * rather than their random spelling. Multiple live scopes require this fact.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Separates identical asset names decoded into independently resident source objects.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves actual source sharing without making runtime UUID spelling a deterministic render input.
   */
  sourceIdentity?: string;

  /**
   * Opaque equality token for the actual Texture object. Environment derivatives
   * are cached by this object, including independently configured clones.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Distinguishes environment clone derivatives from their shared decoded pixels.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Identifies actual environment texture sharing independently of source sharing.
   */
  textureIdentity?: string;

  /**
   * Canonical inherited upload flags reported by the host. Binding-controlled
   * sampling and color decoding are accounted separately; UVs are excluded.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Distinguishes format, alpha, orientation and alignment variants of one source upload.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Binds fixed host upload state to allocation identity and report freshness.
   */
  uploadState?: string;

  /**
   * Actual supported uncompressed R16F, RG16F or RGBA layout from the decode host.
   * Omission leaves device bytes unknown; dimensions alone do not identify HDR
   * component storage. Authors do not supply this as a material parameter.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies the decoded upload component width used to bound resident texels.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps unsupported or unreported upload representations out of complete byte estimates.
   */
  format?: "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f";

  /**
   * The decoded source's inherited sampler, reported by its host when known.
   * Binding samplers replace it; UV transforms do not replace upload state.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Joins an explicitly equivalent binding sampler to shared resident source state.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps unreported defaults distinct from known explicit sampler state.
   */
  sampler?: IAutoMovieTextureReference["sampler"];

  /**
   * Actual native sampler key when the host observed it. A null value means
   * unsupported native sampling; omission retains legacy unreported facts.
   * The key preserves supported renderer filters absent from the authorable
   * sampler union. A fully declared binding sampler replaces inherited state.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Distinguishes every supported inherited native sampler allocation without narrowing it to authorable filter choices.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps observed unsupported sampling unbounded while preserving explicit binding recovery.
   */
  samplerState?: string | null;

  /**
   * The source object's generation flag, when the host reports it. Native
   * generation retains a chain even when a binding samples only its base.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Preserves native generated storage independently of the sampling filter.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Counts generated extents even under nearest or linear base-level sampling.
   */
  generateMipmaps?: boolean;

  /**
   * More than one explicit decoded mip level is already present on the source.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Retains declared mip storage even when the selected filter samples only its base.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes explicit source levels from generated levels in the bound.
   */
  explicitMipmaps?: boolean;

  /**
   * Project asset id, as a material binding cites it.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Joins decoded dimensions to the exact texture referenced by materials.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents texture byte estimates from being attributed to a different asset.
   */
  asset: string;

  /**
   * Decoded width in pixels, a positive integer.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies one dimension of the decoded texel population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes texture-memory accounting depend on stated decoded width.
   */
  width: number;

  /**
   * Decoded height in pixels, a positive integer.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the other dimension of the decoded texel population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes texture-memory accounting depend on stated decoded height.
   */
  height: number;

  /**
   * Whether the renderer uploads a full mip chain. A mipmapped 2D texture costs
   * integer-halved levels down to one texel on each axis. Non-square and
   * non-power-of-two chains are counted from those extents, not a multiplier.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the full mip-chain multiplier in decoded texture memory.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes base-only and mipmapped upload cost in preflight.
   */
  mipmapped: boolean;
}
