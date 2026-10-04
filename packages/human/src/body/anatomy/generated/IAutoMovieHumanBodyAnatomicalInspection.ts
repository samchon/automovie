import type { IAutoMovieHumanBodyCompleteAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyCompleteAnatomicalMeasurements";
import type { IAutoMovieHumanBodyAnatomicalReference } from "./IAutoMovieHumanBodyAnatomicalReference";
import type { IAutoMovieHumanBodyArticularCandidate } from "./IAutoMovieHumanBodyArticularCandidate";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "./IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * Explicit target-radius candidates in a neutral reference rig, not resolved anatomy.
 *
 * Requested body context remains separate from the reference frame. Absence
 * creates no radius prior, and neither sphere placement nor render replay
 * supplies a registered head centre, complete bone or validated body skin.
 *
 * @evidence contracts/common.md#principled-implementation Candidates and unavailable whole anatomy have separate identities and statuses, so a mathematical sphere cannot certify an independently observed surface.
 * @evidence contracts/common.md#clear-and-simple-design One concrete inspection report carries requested context, reference identity and the candidates it actually computed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cohort, error or tissue surface is invented for the unavailable outputs.
 * @evidence contracts/common.md#meaningful-documentation States the reference and candidate qualification limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each candidate names the whole bone it concerns and its carrying rig joint; it is not that complete bone.
 * @evidence contracts/modeling.md#parameter-channels Each explicit target radius remains independent on its anatomical side.
 * @evidence contracts/modeling.md#spatial-conventions Candidate centres and radii are metres in the right-handed Y-up, Z-forward, anatomical-left +X reference frame; requested measurements retain their own units.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This report stores analytic spheres; the candidate model owner creates their meshes.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The candidate model owner observes the displayed mesh.
 * @evidence contracts/anatomy.md#parametric-authority Candidates originate in explicitly named sphere-fitted-radius targets, not personal centres or vertices.
 * @evidence contracts/anatomy.md#anatomical-source A rig centre is a source approximation and does not establish a person's imaging centre or tissue boundary; requested context remains separately recorded.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inspector owns admission, while whole surface and physiological qualification remain unavailable.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalInspection {
  /** Executable inspector revision, distinct from clinical validation. */
  generatorRevision: string;

  /** Exact source reference; its neutral is not the requested person's skin. */
  reference: IAutoMovieHumanBodyAnatomicalReference;

  /** Owned complete request after the simple tier's deterministic lift. */
  requested: IAutoMovieHumanBodyCompleteAnatomicalMeasurements;

  /** This inspector does not generate or validate a whole exterior. */
  skin: IAutoMovieHumanBodyUnvalidatedGeometry;

  /** Only explicit targets produce a candidate; omitted sides remain unknown. */
  candidates: IAutoMovieHumanBodyArticularCandidate[];
}
