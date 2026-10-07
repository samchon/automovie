import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanSkinBinding } from "./IAutoMovieHumanSkinBinding";

/**
 * The binding table, vertex population and owning rig at one source admission
 * boundary. Diagnostic labels belong to the caller so both body and head
 * admission use one numerical rule without manufacturing another basis.
 *
 * @evidence contracts/common.md#principled-implementation The vertex count and declared-joint population come from the source the binding actually addresses.
 * @evidence contracts/common.md#clear-and-simple-design Explicit populations and diagnostic labels accompany the one binding table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callers provide the real table and rig rather than a synthetic body wrapper.
 * @evidence contracts/common.md#meaningful-documentation States ownership, populations and why labels are caller-owned.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Admission transport defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Admission transport adds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Admission transport emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Vertex counts, names and indices have no physical unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries This input describes no geometric boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation This input displays no result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rig owner supplies joint meanings; this transport adds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range This transport adds no biological bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This transport adds no person input.
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
