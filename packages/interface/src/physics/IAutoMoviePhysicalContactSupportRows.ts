import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "./IAutoMoviePreparePhysicalGeometry";

/**
 * Original endpoint and floor-patch promises used by a contact articulation fit.
 * Returned residual closures retain these borrowed inputs for their fit lifetime.
 *
 * @evidence contracts/development/design.md#principled-representation Endpoint XYZ rows remain independent of optional planted witnesses and global floor nonpenetration; explicit witnesses select equality rows without removing the original endpoint goal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Generic carrier bones and local points describe a patch without anatomical or native-body dependencies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonfinite floors/points, missing carriers, duplicate patch carriers and more than 64 witnesses are refused; a fitted endpoint cannot replace the original promise.
 * @evidence contracts/development/common.md#meaningful-documentation Local witness coordinates and world goals are metres; optional patches and borrowed closure lifetime are stated.
 */
export namespace IAutoMoviePhysicalContactSupportRows {
  /** A world endpoint always keeps all three original coordinate rows. */
  export interface ISupport {
    /** Endpoint carrier. */ bone: string;
    /** Carrier-local endpoint. */ localPoint?: IAutoMovieVector3;
    /** Original world goal; fitting must never replace it with an unmet output. */ point: IAutoMovieVector3;
    /** An explicitly planted patch, independent of anatomical vocabulary. */ patch?: {
      /** Every real carrier of this patch. */ contacts: readonly string[];
      /** Declared local surface witnesses sharing the plane. */ floorPoints?: readonly {
        /** Carrier present in patch.contacts; invalid references are refused. */
        bone: string;
        /** Finite carrier-local surface point in metres; its world Y is fitted to patch.floor. */
        localPoint: IAutoMovieVector3;
      }[];
      /** Original horizontal support plane, metres. */ floor: number;
    };
  }

  /**
   * Keep an endpoint's existing XYZ promise and its explicitly declared real support plane in the same solve. Geometry, witnesses and original goals are borrowed only for this invocation.
   */
  export type IInput = {
    /** Borrowed fixed geometry for this invocation. */ profile: IAutoMoviePhysicalProfile;
    /** Original endpoints and explicit support patches. */ supports: readonly IAutoMoviePhysicalContactSupportRows.ISupport[];
    /** Source scene identity. */ body: string;
    /** Initialized no-dynamics queries. */ geometry: IAutoMoviePreparePhysicalGeometry.IQueries;
    /** Global nonpenetration plane, metres. */ floor: number;
  };
}
