import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalSupportPatch } from "./IAutoMoviePhysicalSupportPatch";

/**
 * One measured floor application point and its Coulomb coefficient. No handle
 * or borrowed manifold survives this collection.
 */
export namespace IAutoMovieCollectPhysicalSupports {
  /** One measured floor application point and its Coulomb coefficient. */
  export interface IPoint {
    /**
     * Collider-owning segment; a distal endpoint does not carry every patch
     * contact.
     */
    carrier: string;
    /** World metres. */
    point: IAutoMovieVector3;
    /**
     * Actual native combined coefficient, or the declared mean for a solved
     * compliant-surface receipt fallback.
     */
    friction: number;
  }

  /** No handle or borrowed manifold survives this collection. */
  export interface ISupport extends IAutoMoviePhysicalSupportPatch {
    /**
     * A touching upward constraint carried a positive actual native or
     * compliant-solver impulse. Zero-load constraints remain available for
     * wrench allocation.
     */
    loaded: boolean;
    /** The upward normal impulse the floor applied to the limb's patches over this native step, newton seconds: the actual native contact impulses, or a compliant receipt's applied impulse over its share of the step. */
    impulse: number;
    /** The actual native contact points of this step weighted by their normal impulses, world metres: the patch's realized centre of pressure; absent without a native load. */
    pressure?: IAutoMovieVector3;
    /** Actual floor constraints, not a complete nominal sole. */
    samples: IAutoMovieCollectPhysicalSupports.IPoint[];
  }
}
