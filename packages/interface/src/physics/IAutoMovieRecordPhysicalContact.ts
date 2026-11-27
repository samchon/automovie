import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";

/**
 * Measured impulse contributions and caller-owned mutable contact-episode
 * collections.
 */
export namespace IAutoMovieRecordPhysicalContact {
  /**
   * One measured solver contribution and the mutable episode collections it
   * updates.
   *
   * Seconds is the completed native instant, dt its positive duration in
   * seconds, impulse N s, point world metres and separation signed metres.
   * recordPhysicalContact mutates contacts, active, found and any active
   * receipt in place, returning that shared receipt. It copies new endpoint
   * identifiers and points and canonicalizes pair order. The caller supplies
   * admitted positive measured impulses and consistent times; the recorder does
   * not validate them. Multiple contributions at the same instant merge and use
   * an impulse-weighted point.
   */
  export type IInput = {
    /** First mapped shape. */
    a: IAutoMovieContactReceipt["a"];

    /** Second mapped shape. */
    b: IAutoMovieContactReceipt["b"];

    /**
     * Completed native-step local second, shared by core and compliant
     * contributions being merged.
     */
    seconds: number;

    /**
     * Positive native integration duration represented by this sample, seconds;
     * contributions merged at one instant must use the same duration.
     */
    dt: number;

    /**
     * Measured world application point, metres; copied for a new sample and
     * impulse-weighted when merging at the same instant.
     */
    point: IAutoMovieVector3;

    /**
     * World unit normal pointing from input a toward b; flipped if canonical
     * endpoint order is reversed.
     */
    normal: IAutoMovieVector3;

    /**
     * Positive measured normal impulse in N s before explicit response gains;
     * caller owns finite-value admission.
     */
    impulse: number;

    /**
     * Actual transferred soft-solver normal impulses; omission retains direct
     * native manifold authority.
     */
    appliedImpulse?: IInputAppliedImpulse;

    /**
     * Measured signed surface gap in metres; contact penetration is negative
     * and no predicted air gap belongs here.
     */
    separation: number;

    /**
     * Mutable complete episode array; new receipts are appended and existing
     * receipts may be updated by reference.
     */
    contacts: IAutoMovieContactReceipt[];

    /**
     * Mutable canonical-pair episode Map; new and returned receipts share
     * identity with contacts entries.
     */
    active: Map<string, IAutoMovieContactReceipt>;

    /**
     * Mutable set of pair keys touched in the caller's collection window;
     * simulation accumulates all native substeps of one cached interval before
     * retiring absent episodes.
     */
    found: Set<string>;
  };

  /** The appliedImpulse object of {@link IInput}. */
  export type IInputAppliedImpulse = {
    /**
     * Actual normal impulse transferred to input a, N s, after response gain
     * and native rounding; may be zero for a nondynamic side.
     */
    a: number;

    /**
     * Actual normal impulse transferred to input b, N s, after response gain
     * and native rounding; may differ from a.
     */
    b: number;
  };
}
