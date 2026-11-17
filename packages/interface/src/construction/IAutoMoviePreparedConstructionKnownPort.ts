import type { IAutoMovieConstructionKnownPort } from "./IAutoMovieConstructionKnownPort";
import type { IAutoMovieConstructionKnownPortSide } from "./IAutoMovieConstructionKnownPortSide";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Prepared original-field port surface and the neighboring owners it retains.
 *
 * @evidence contracts/development/design.md#principled-representation The kernel surface transposes the authored rectangle to transverse u and original-clock v while retaining source identities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface KnownPort returns one surface with its descriptor and resolved rails for downstream composition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retained owner references are not cloned functions or proof of shared material/binding semantics.
 * @evidence contracts/development/common.md#meaningful-documentation Names the chart transposition and retained dependency ownership.
 */
export namespace IAutoMoviePreparedConstructionKnownPort {
  /**
   * Surface with u in [0,1] from parent to child and v in the original clock
   * interval. Its orientation is the negative of definition.orientation because
   * the chart axes are transposed; an authored period is retained on v. Points
   * are world millimetres and all jet orders use these transposed variables.
   *
   * The descriptor is detached, but field/map owners remain borrowed and must
   * stay immutable. Point queries work independently of map total2. Jet queries
   * reject null/nonfinite map derivatives and degenerate tangent planes; callback
   * exceptions propagate. Returned vectors are freshly computed.
   *
   * @evidence contracts/development/design.md#principled-representation Extends the common surface chart with exact source-side ownership and a copied authored declaration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface KnownPort's point/jet closures use the same resolved parent and child records exposed here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime domain and finite/regular-jet admission do not prove C2, shared bindings or derivatives over unqueried points.
   * @evidence contracts/development/common.md#meaningful-documentation States chart order, orientation, units, copy/borrow lifetime and nullable derivative failure behavior.
   */
    export interface IPrepared extends IAutoMovieSolidSurface {
      /** Detached descriptor retains original clock bounds and authored outward convention. */
      definition: IAutoMovieConstructionKnownPort;
  
      /** Actual immutable field/map owners of both rails; labels alone certify no weights. */
      rails: {
        /** Original field and map that own the transverse-zero boundary. */
        parent: IAutoMovieConstructionKnownPortSide;

        /** Original field and map that own the transverse-one boundary. */
        child: IAutoMovieConstructionKnownPortSide;
      };
    }
}
