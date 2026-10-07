import type { IHumanPersonHairContactMesh } from "./IHumanPersonHairContactMesh";

/**
 * Actual posed body and placed hair consumed by the person contact stage.
 *
 * @evidence contracts/common.md#principled-implementation Body source incidence, placed hair and document clearance are carried in one shared frame without recomputing their owners' quantities.
 * @evidence contracts/common.md#clear-and-simple-design One record groups the existing contact stage's actual input and requested clearance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source surface or contact result is replaced by an expected example.
 * @evidence contracts/common.md#meaningful-documentation Each field states source responsibility, placement stage and units.
 * @evidence contracts/modeling.md#spatial-conventions Body and hair share the person model's metre frame; clearance is a length in that frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source producers own the body and hair identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries existing geometry and the hair document's clearance rather than defining a control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The respective producers own surface populations.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact consumer performs the clearance operation.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consumer observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source producers retain biological and measurement responsibility.
 * @evidenceExclude contracts/anatomy.md#permitted-range Numerical clearance admission belongs to the contact consumer and is not a clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These are internal produced coordinates, not personal vertex inputs.
 *
 * @author Samchon
 */
export interface IHumanPersonHairContactProps {
  /** Posed shared body positions, metres in the person model frame. */
  readonly positions: readonly number[];

  /** Retained source triangles over the shared body vertices. */
  readonly indices: readonly number[];

  /** Actual generated hair meshes in the same frame. */
  readonly hair: readonly IHumanPersonHairContactMesh[];

  /** The hair document's requested body clearance, metres. */
  readonly clearance: number;
}
