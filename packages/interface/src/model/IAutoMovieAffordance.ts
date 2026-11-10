import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieAffordanceKind } from "./AutoMovieAffordanceKind";
import { AutoMovieGripKind } from "./AutoMovieGripKind";

/**
 * A semantic contact point an object declares in its **own model-local frame**, where another body may rest, grab, plug, or hang, independent of any bone.
 *
 * Bone attachments couple to a posed skeleton; an affordance instead marks a model-local contact used by prop anchoring and support consumers. propSupportFace transforms a stack-top footprint through the full affordance and staged matrices for placement support. The separate rigid-only affordanceSupportContacts helper currently has no product caller and does not establish a wired toppling pipeline.
 *
 * @evidence contracts/development/design.md#principled-representation A model-local contact transform and optional convex XZ footprint separate point seating from support geometry; prop anchoring composes the frame with the staged model and propSupportFace uses full affine footprint placement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Contact identity, kind, frame and extent form one record beside the model's body; bone attachments use their own skeleton-based representation rather than mixing rig references into a model contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Point contacts require null extent. Stack-top admission checks finite XZ points and a noncollinear convex hull, without certifying the authored order as a simple convex polygon; propSupportFace constructs the transformed hull, so an authored concavity is not preserved as a support notch.
 * The optional `grip`, `aperture`, `depth`, `back`, `length` and `travel` are the few dimensions human action laws read from an environment contact (#3201 A8, the grasping section); each names the kinds that read it, and the rest ignore it. They are flat optional fields of this existing record, the additive form an authored contact can grow without rewriting every affordance; engine admission owns their positivity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States model-local frame ownership, contact-axis convention, coincident seating, model-scoped ids, the stack-top convex XZ extent with null for point contacts, and each optional dimension's unit and reader kinds.
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
   * Stack-top support points in the affordance-local XZ plane, with at least three noncollinear finite XZ points; y is ignored. The intended footprint is convex: propSupportFace transforms the points and constructs their convex hull, filling any authored concavity. Every other kind, point- or line-like, requires null. This does not establish a wired toppling judgment.
   */
  extent: IAutoMovieVector3[] | null;

  /**
   * How a hand holds a `handle`, `bar`, `slider` or `knob`; a grasping law picks the power grip when absent. Other kinds ignore it.
   */
  grip?: AutoMovieGripKind;

  /**
   * The object's width across the grip, metres, positive: the diameter a power or hook grip wraps, or the thickness a precision or lateral grip pinches. The hand pre-shapes to it plus a safety margin during the reach (Jeannerod 1984). Absent, a grasping law reads it from the object's own collider.
   */
  aperture?: number;

  /** A `seat`'s depth from its front edge back along `-Z`, metres, positive; other kinds ignore it. */
  depth?: number;

  /** A `seat`'s backrest height above the sitting surface, metres, positive; absent for a backless seat. Other kinds ignore it. */
  back?: number;

  /** A `bar`'s or `ledge`'s length along `+X`, centred on the frame, metres, positive; other kinds ignore it. */
  length?: number;

  /**
   * The largest movement of an articulated part: a `hinge`'s opening and a `knob`'s turn in degrees, a `slider`'s travel along `+X` and a `button`'s press along `-Y` in metres; positive. Other kinds ignore it.
   */
  travel?: number;
}
