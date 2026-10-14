import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieAffordanceKind } from "./AutoMovieAffordanceKind";

/**
 * A semantic contact point an object declares in its **own model-local frame**, where another body may rest, grab, plug, or hang, independent of any bone.
 *
 * Bone attachments couple to a posed skeleton; an affordance instead marks a model-local contact used by prop anchoring and support consumers. propSupportFace transforms a stack-top footprint through the full affordance and staged matrices for placement support. The separate rigid-only affordanceSupportContacts helper currently has no product caller and does not establish a wired toppling pipeline.
 *
 * @evidence contracts/common.md#principled-implementation A model-local contact transform and optional convex XZ footprint separate point seating from support geometry; prop anchoring composes the frame with the staged model and propSupportFace uses full affine footprint placement.
 * @evidence contracts/common.md#clear-and-simple-design Contact identity, kind, frame and extent form one record beside the model's body; bone attachments use their own skeleton-based representation rather than mixing rig references into a model contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Point contacts carry no invented support area, and stack-top extents must satisfy the same convex-footprint premise used by the support judgment rather than relying on a table or prop name.
 * @evidence contracts/common.md#meaningful-documentation States model-local frame ownership, contact-axis convention, coincident seating, model-scoped ids and the stack-top convex XZ extent with null for point contacts.
 * @author Samchon
 */
export interface IAutoMovieAffordance {
  /** Stable id, unique within the model; action targets cite it by this. */
  id: string;

  /** What the point is for. Drives which fields apply (see `extent`). */
  kind: AutoMovieAffordanceKind;

  /**
   * The contact frame in the model's local space: `translation` is where the contact sits, `rotation` orients it (`+Y` out of a stack-top face, out of a socket mouth). Seating aligns two of these frames coincident.
   */
  frame: IAutoMovieTransform;

  /**
   * Stack-top support footprint: a convex polygon in the affordance frame's XZ plane with at least three non-collinear points; y is ignored and should be zero. propSupportFace transforms these corners through the full affordance and staged matrices for placement support. Point-like handle, socket and hook kinds require null; this field does not establish a wired toppling judgment.
   */
  extent: IAutoMovieVector3[] | null;
}
