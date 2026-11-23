import type { AutoMovieSolidChartVector4 } from "./AutoMovieSolidChartVector4";
import type { IAutoMovieSolidTraceLaw } from "./IAutoMovieSolidTraceLaw";

/** Data and callback contracts shared by the SolidIntersectionWalk operations. */
export namespace IAutoMovieSolidIntersectionWalk {
  /** A walked reference law and the original starting preimages. */
  export interface IWalk {
    /** The original reference-guide law used for requested arc parameterization. */
    law: IAutoMovieSolidTraceLaw.ILaw;

    /** `[s, phi, y, theta]` at `t = 0`. */
    x: AutoMovieSolidChartVector4;

    /** The host face at `t = 0`. */
    face: number;
  }
}
