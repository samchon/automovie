import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";

/** Local accumulating appearance weight at an actual provider surface point. */
export namespace IAutoMovieSampleContactSurfaceResponse {
  /**
   * Local accumulating appearance weight at an actual provider surface point.
   * Provider-owned colour/roughness channels consume this scalar. Each contact
   * centre is supplied in the same current provider frame as the sample, so
   * skin marks follow the struck region through later articulation. Engine does
   * not choose a whole-part tint or assert a medical bruise model.
   */
  export type IInput = {
    /** Actual receipts for this provider body. */
    contacts: readonly IAutoMovieContactReceipt[];
    /** Film second being drawn. */
    seconds: number;
    /** Surface sample in the provider's selected metre frame. */
    point: IAutoMovieVector3;
    /**
     * Contact centre transported into that same frame.
     *
     * Synchronously transport the sampled contact event into the same current
     * metre frame as point. Return a finite point without mutating the borrowed
     * event; exceptions propagate. The returned point is read immediately and
     * no callback or point is retained after sampling.
     */
    center: (receipt: IAutoMovieContactReceipt) => IAutoMovieVector3;
    /** Explicit appearance radius, metres. */
    radius: number;
    /** Accumulation weight per N s. */
    weightPerImpulse: number;
    /** Positive decay time, seconds; Infinity retains marks. */
    decaySeconds: number;
    /** Formula-derived N s for geometric contacts. */
    geometricImpulses: Readonly<Record<string, number>>;
  };
}
