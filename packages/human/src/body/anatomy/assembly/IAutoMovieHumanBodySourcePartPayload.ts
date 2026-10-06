import type { IAutoMovieHumanBodySourcePartAttachment } from "./IAutoMovieHumanBodySourcePartAttachment";
import type { IAutoMovieHumanBodySourcePartSurface } from "./IAutoMovieHumanBodySourcePartSurface";
import type { IAutoMovieHumanBodySourceVolumeBinding } from "./IAutoMovieHumanBodySourceVolumeBinding";
import type { IAutoMovieHumanBodySourceShapeField } from "./IAutoMovieHumanBodySourceShapeField";

/**
 * Acquired or authored members and attachments of one coarse anatomical part.
 *
 * Clinical resolution is deliberately separate. Shape and motion qualification
 * follows the actual shared-source recipe and observed consumer, not the fact
 * that a receipt has been filled. Source surface arrays never enter a personal
 * document.
 *
 * @evidence contracts/common.md#principled-implementation Source surfaces and shared attachment references remain independent of clinical resolution.
 * @evidence contracts/common.md#clear-and-simple-design One payload preserves subdivisions and attachment accounts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonempty actual source subdivisions, their independent member identities and named attachments remain explicit rather than empty parts or relabeled tissue primitives.
 * @evidence contracts/common.md#meaningful-documentation Separates source geometry and scientific qualification.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The distributed source part owns closed identity and tissue.
 * @evidenceExclude contracts/modeling.md#parameter-channels Named numerical generator inputs have separate ownership.
 * @evidence contracts/modeling.md#emitted-geometry At least one actual source member supplies the boundary population.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The source surface and shared graph own the common frame.
 * @evidence contracts/modeling.md#shared-boundaries Named source attachments reference shared graph sites.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body/person assembly consumer owns observation.
 * @evidence contracts/anatomy.md#anatomical-source The qualification account records acquisition or offline authoring limits without changing clinical resolution.
 * @evidenceExclude contracts/anatomy.md#permitted-range Shared source joints admit supported movement.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This payload is offline source, not public vertex authoring.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourcePartPayload {
  /** Nonempty independent source boundaries, preserving separate muscle heads or islands. */
  surfaces: readonly [IAutoMovieHumanBodySourcePartSurface, ...IAutoMovieHumanBodySourcePartSurface[]];
  /** Named source graph references; muscle source requires origin and insertion roles. */
  attachments: readonly IAutoMovieHumanBodySourcePartAttachment[];
  /** Atlas or authored-reference meaning and unresolved scientific limits. */
  qualification: string;
  /** Actual source boundary-volume instruments bound to existing anatomical record paths; omission offers no volume target capability. */
  quantityBindings?: readonly IAutoMovieHumanBodySourceVolumeBinding[];
  /** Producer-supported metre fields and held attachments used by those target bindings; never personal document vertices. */
  shapeFields?: readonly IAutoMovieHumanBodySourceShapeField[];
}
