import type { IAutoMovieHumanBodySourcePartAttachment } from "./IAutoMovieHumanBodySourcePartAttachment";
import type { IAutoMovieHumanBodySourcePartSurface } from "./IAutoMovieHumanBodySourcePartSurface";
import type { IAutoMovieHumanBodySourceShapeField } from "./IAutoMovieHumanBodySourceShapeField";
import type { IAutoMovieHumanBodySourceVolumeBinding } from "./IAutoMovieHumanBodySourceVolumeBinding";

/**
 * Acquired or authored members and attachments of one coarse anatomical part.
 *
 * Clinical resolution is deliberately separate. Shape and motion qualification
 * follows the actual shared-source recipe and observed consumer, not the fact
 * that a receipt has been filled. Source surface arrays never enter a personal
 * document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourcePartPayload {
  /** Nonempty independent source boundaries, preserving separate muscle heads or islands. */
  surfaces: readonly [
    IAutoMovieHumanBodySourcePartSurface,
    ...IAutoMovieHumanBodySourcePartSurface[],
  ];
  /** Named source graph references; muscle source requires origin and insertion roles. */
  attachments: readonly IAutoMovieHumanBodySourcePartAttachment[];
  /** Atlas or authored-reference meaning and unresolved scientific limits. */
  qualification: string;
  /** Actual source boundary-volume instruments bound to existing anatomical record paths; omission offers no volume target capability. */
  quantityBindings?: readonly IAutoMovieHumanBodySourceVolumeBinding[];
  /** Producer-supported metre fields and held attachments used by those target bindings; never personal document vertices. */
  shapeFields?: readonly IAutoMovieHumanBodySourceShapeField[];
}
