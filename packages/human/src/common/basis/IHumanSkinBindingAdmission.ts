import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanSkinBinding } from "./IAutoMovieHumanSkinBinding";

/**
 * The binding table, vertex population and owning rig at one source admission
 * boundary. Diagnostic labels belong to the caller so both body and head
 * admission use one numerical rule without manufacturing another basis.
 *
 *
 * @evidence contracts/common.md#principled-implementation Aligns one skin table with its shared-vertex count and the declared rig-name set read by assertHumanSkinBinding.
 * @evidence contracts/common.md#clear-and-simple-design Body and head share numerical admission while surface and description retain caller-specific diagnostic ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every influence uses the supplied declared set; no substitute rig or fallback binding is encoded.
 * @evidence contracts/common.md#meaningful-documentation Documents source-table ownership, vertex denominator and diagnostic labels preserved on refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input record implements no slot traversal; assertHumanSkinBinding owns that algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed binding arrays and declared names carry input data rather than cached validation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no resource; source and rig owners retain their arrays and set.
 *
 *
 * @author Samchon
 */
export interface IHumanSkinBindingAdmission {
  /** Actual source skin's binding table. */
  binding: IAutoMovieHumanSkinBinding;

  /** Number of shared vertices the table must cover. */
  vertices: number;

  /** Names declared by the rig whose frames the skinning consumer reads. */
  declared: ReadonlySet<AutoMovieHumanoidBone>;

  /** Skin surface identity included in every refusal. */
  surface: string;

  /** Owning diagnostic label, such as Body skin or Head skin. */
  description: string;
}
