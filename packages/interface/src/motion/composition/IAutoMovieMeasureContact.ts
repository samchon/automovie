import type { IAutoMovieRigidTransform } from "../../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalProfile } from "../../physics/IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "../../physics/IAutoMoviePreparePhysicalGeometry";
import type { IAutoMovieAuditOutcome } from "./IAutoMovieAuditOutcome";

/**
 * Data and callback contracts shared by the MeasureContact operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieMeasureContact contracts used by packages/engine/src/composition/measureAutoMovieContact.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMeasureContact contract belongs to interface; packages/engine/src/composition/measureAutoMovieContact.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieMeasureContact {
  /**
   * One measured side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieMeasureContact.ISide keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMeasureContact.ISide contract belongs to interface; packages/engine/src/composition/measureAutoMovieContact.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface ISide {
    /** Subject id. */
    subject: string;

    /** Region id reported in the contact record. */
    region: string;

    /** Its physical profile with declared colliders. */
    profile: IAutoMoviePhysicalProfile;

    /** Its displayed world pose by segment. */
    segments: Readonly<Record<string, IAutoMovieRigidTransform>>;

    /** Segments whose colliders form the side. */
    bones: readonly string[];
  }

  /**
   * A measurement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieMeasureContact.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMeasureContact.IResult contract belongs to interface; packages/engine/src/composition/measureAutoMovieContact.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface IResult {
    /** Least signed separation, metres; Infinity when no pair is within the prediction. */
    separation: number;

    /** The acting segment of the closest pair. */
    a: string | null;

    /** The receiving segment of the closest pair. */
    b: string | null;

    /** The contact record when the separation is within tolerance. */
    contact: IAutoMovieAuditOutcome.IContact | null;
  }

  /**
   * Measure whether two displayed bodies meet: the least signed separation, in
   * metres, between every declared collider of one body's named segments (an
   * effector, such as a striking surface) and every declared collider of the
   * other's (a region), at their displayed world poses, by the native geometric
   * contact query. Negative is compression. A pair beyond the prediction
   * distance reads as no contact. The measurement is of the displayed bodies,
   * never of two landmarks, so a refused contact means the bodies did not meet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieMeasureContact.IInput keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Named segments select declared colliders at world poses; separation, prediction and tolerance are metres on the supplied film second. No nearby pair yields Infinity and null ids; a geometric contact carries zero impulse. Missing poses or empty collider sets throw in measureAutoMovieContact. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMeasureContact.IInput contract belongs to interface; packages/engine/src/composition/measureAutoMovieContact.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export type IInput = {
    /** The acting side. */ a: IAutoMovieMeasureContact.ISide;
    /** The receiving side. */ b: IAutoMovieMeasureContact.ISide;
    /** Prepared native geometric queries. */ queries: IAutoMoviePreparePhysicalGeometry.IQueries;
    /** Film seconds of the measurement. */ seconds: number;
    /** Farthest separation the query reports, metres; 1 by default. */ prediction?: number;
    /** Separation counted as contact, metres; 0 by default. */ tolerance?: number;
  };
}
