import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the CollectPhysicalSupports operations. */
export namespace IAutoMovieCollectPhysicalSupports {
  /** One measured floor application point and its Coulomb coefficient. */
    export interface IPoint {
      /** Collider-owning segment; a distal endpoint does not carry every patch contact. */
      carrier: string;
      /** World metres. */
      point: IAutoMovieVector3;
      /** Actual native combined coefficient, or the declared mean for a solved compliant-surface receipt fallback. */
      friction: number;
    }

  /** No handle or borrowed manifold survives this collection. */
    export interface ISupport extends IAutoMoviePhysicalBalance.ISupport {
      /** A touching upward constraint carried a positive actual native or compliant-solver impulse. Zero-load constraints remain available for wrench allocation. */
      loaded: boolean;
      /** Actual floor constraints, not a complete nominal sole. */
      samples: IAutoMovieCollectPhysicalSupports.IPoint[];
    }
}
