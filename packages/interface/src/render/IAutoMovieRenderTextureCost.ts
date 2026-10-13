/**
 * One resident texture representation and its bounded texel storage. Project
 * sources and derived environment targets name their asset; an unknown
 * cardinality row groups candidate uses rather than asserting one native
 * allocation. Renderer-owned lookup textures have no project asset and identify
 * their runtime owner.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `IAutoMovieRenderTextureCost` as the portable data boundary for the rendering texture decode requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `IAutoMovieRenderTextureCost` for the spec render material color system contract.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureCost {
  /**
   * Stable upload-state variant within this asset; absent on legacy reports.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Names separately resident sampling or upload representations of one decoded image.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Preserves the representation identity beside its source asset and material users.
   */
  variant?: string;

  /**
   * Project asset id cited by a material binding.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `asset` as the portable data boundary for the rendering texture decode requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `asset` for the spec render material color system contract.
   */
  asset: string | null;

  /**
   * Additional asset aliases that share this decoded Source/candidate group.
   * The primary asset is the first id; this list keeps every referenced source
   * name in dependency and diagnostic closures when a host shared their pixels.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Preserves all declared asset identities sharing one measured upload.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps source aliases attributable without duplicating resident storage.
   */
  assets?: string[];

  /**
   * Renderer-owned representation, when this row has no project asset. The
   * physically based material lookup is shared by all PBR draws in one context.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Identifies renderer-owned storage without inventing a project asset.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps the shared PBR lookup distinct from decoded source ownership.
   */
  runtime?: "dfg-lut" | "pmrem-blur" | "display-compositor" | "data-texture" | "render-target" | "transmission-target";

  /**
   * Texture allocations represented by an aggregate target row, including an
   * actual custom depth Texture. Null leaves native cardinality unknown; omission
   * is one legacy allocation. Depth renderbuffers
   * contribute bytes without increasing the Texture population.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Preserves actual attachment population when one target owns several color textures.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Separates framebuffer color texture count from companion attachment bytes.
   */
  allocations?: number | null;

  /**
   * Stable simultaneously live shot owners using this allocation, when a host
   * supplied a context-level residency record. Shared resources name all users.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Preserves the live owner population beside a shared resident representation.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps shared allocation attribution independent of scene ordering.
   */
  residents?: string[];

  /**
   * Stable runtime owners whose data tables or target attachments use this allocation.
   * A table can share decoded pixels with an asset binding; these users remain
   * named even when that asset supplies the primary diagnostic identity.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Preserves runtime table users of shared texture storage.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Keeps generated table ownership visible beside source asset aliases.
   */
  runtimeOwners?: string[];

  /**
   * Material ids that bind this asset, ascending.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `materials` as the portable data boundary for the rendering texture decode requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `materials` for the spec render material color system contract.
   */
  materials: string[];

  /**
   * Conservative uncompressed resident texel bytes. Missing or unsupported
   * upload, ownership, sampler or attachment facts and unsafe arithmetic leave
   * this null, keeping the texture metric unbounded for admission refusal.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Exposes `bytes` as the portable data boundary for the rendering texture decode requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Types `bytes` for the spec render material color system contract.
   */
  bytes: number | null;
}
