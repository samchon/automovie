import type { IAutoMovieHumanBodySourcePartAttachment } from "./IAutoMovieHumanBodySourcePartAttachment";
import type { IAutoMovieHumanBodySourcePartSurface } from "./IAutoMovieHumanBodySourcePartSurface";
import type { IAutoMovieHumanBodySourceShapeField } from "./IAutoMovieHumanBodySourceShapeField";
import type { IAutoMovieHumanBodySourceVolumeBinding } from "./IAutoMovieHumanBodySourceVolumeBinding";

/**
 * Acquired or authored members and attachments of one coarse anatomical part.
 *
 * Clinical resolution is deliberately separate. Shape and motion qualification follows the actual shared-source recipe and observed consumer, not the fact that a receipt has been filled. Source surface arrays never enter a personal document.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty boundary tuple preserves independent source members while named attachments, optional quantity bindings and shape fields describe actual supported source capability.
 * @evidence contracts/common.md#clear-and-simple-design One reusable payload separates common source geometry/qualification from the catalogue's anatomical id/tissue pairing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source arrays never enter personal documents, and a filled receipt does not certify shape, motion or clinical tissue resolution.
 * @evidence contracts/common.md#meaningful-documentation Members explain independent boundaries, required muscle roles, source limitations and omission of volume/shape capabilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The payload declaration groups source arrays without selecting their deformation or volume-solve algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Optional fields represent producer support, not cached boundary work shared between authored requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The payload type declares publisher-owned arrays and acquires no running construction or native mesh lease.
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
