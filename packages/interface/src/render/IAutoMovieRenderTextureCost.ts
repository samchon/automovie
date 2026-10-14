/**
 * One resident texture representation and its bounded texel storage. Project sources and derived environment targets name their asset; an unknown cardinality row groups candidate uses rather than asserting one native allocation. Renderer-owned lookup textures have no project asset and identify their runtime owner.
 *
 * @evidence contracts/common.md#principled-implementation Texture closure groups actual Source and equivalent upload state, environment Texture identity and renderer-owned targets, retaining simultaneously live resident owners and conservative uncompressed storage; unknown allocation or attachment facts remain null.
 * @evidence contracts/common.md#clear-and-simple-design One row carries asset aliases or runtime identity, allocation cardinality, consumers and bounded bytes so shared texture storage is charged once while every dependency remains attributable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Object tokens provide equality rather than portable names, uncertified residency cannot invent native counts, and depth renderbuffer bytes do not increase Texture cardinality; encoded and CPU bytes and driver overhead are outside this estimate.
 * @evidence contracts/common.md#meaningful-documentation Defines upload variant, asset/runtime ownership, alias and resident users, nullable allocation count, sorted material consumers and conservative device-byte gaps.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureCost {
  /**
   * Stable upload-state variant within this asset; absent on legacy reports.
   */
  variant?: string;

  /** Project asset id cited by a material binding. */
  asset: string | null;

  /**
   * Additional asset aliases that share this decoded Source/candidate group. The primary asset is the first id; this list keeps every referenced source name in dependency and diagnostic closures when a host shared their pixels.
   */
  assets?: string[];

  /**
   * Renderer-owned representation, when this row has no project asset. The physically based material lookup is shared by all PBR draws in one context.
   */
  runtime?:
    | "dfg-lut"
    | "pmrem-blur"
    | "display-compositor"
    | "data-texture"
    | "render-target"
    | "transmission-target";

  /**
   * Texture allocations represented by an aggregate target row, including an actual custom depth Texture. Null leaves native cardinality unknown; omission is one legacy allocation. Depth renderbuffers contribute bytes without increasing the Texture population.
   */
  allocations?: number | null;

  /**
   * Stable simultaneously live shot owners using this allocation, when a host supplied a context-level residency record. Shared resources name all users.
   */
  residents?: string[];

  /**
   * Stable runtime owners whose data tables or target attachments use this allocation. A table can share decoded pixels with an asset binding; these users remain named even when that asset supplies the primary diagnostic identity.
   */
  runtimeOwners?: string[];

  /** Material ids that bind this asset, ascending. */
  materials: string[];

  /**
   * Conservative uncompressed resident texel bytes. Missing or unsupported upload, ownership, sampler or attachment facts and unsafe arithmetic leave this null, keeping the texture metric unbounded for admission refusal.
   */
  bytes: number | null;
}
