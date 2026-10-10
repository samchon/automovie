import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanSkinBinding } from "./IAutoMovieHumanSkinBinding";

/**
 * The binding table, vertex population and owning rig at one source admission
 * boundary. Diagnostic labels belong to the caller so both body and head
 * admission use one numerical rule without manufacturing another basis.
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
