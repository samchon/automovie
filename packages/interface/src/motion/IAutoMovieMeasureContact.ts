import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalProfile } from "../physics/IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "../physics/IAutoMoviePreparePhysicalGeometry";
import type { IAutoMovieAuditOutcome } from "./IAutoMovieAuditOutcome";

/** Data and callback contracts shared by the MeasureContact operations. */
export namespace IAutoMovieMeasureContact {
  /** One measured side. */
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

  /** A measurement. */
  export interface IResult {
    /**
     * Least signed separation, metres; Infinity when no pair is within the
     * prediction.
     */
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
   * never of two landmarks, so a refused contact means the bodies did not
   * meet.
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
