import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/** Data and callback contracts shared by the PreparePhysicalGeometry operations. */
export namespace IAutoMoviePreparePhysicalGeometry {
  /** One collider in its current body placement. */
  export interface ICollider {
    /** Scene body id. */ body: string;
    /** Physical segment id. */ bone: string;
    /** Profile-local collider. */ shape: IAutoMoviePhysicalProfile.IShape;
    /** Current world bone placement. */ pose: IAutoMoviePhysicalProfile.ITransform;
  }

  /** Reusable initialized query entry; it owns no physics world. */
  export interface IQueries {
    /** Null when farther apart than prediction; positive separation is never contact. */
    contact: (
      a: IAutoMoviePreparePhysicalGeometry.ICollider,
      b: IAutoMoviePreparePhysicalGeometry.ICollider,
      seconds: number,
      prediction?: number,
    ) => IAutoMovieContactReceipt | null;
    /** Exact lowest world Y for supported sphere, capsule and box shapes. */
    minimumY: (collider: IAutoMoviePreparePhysicalGeometry.ICollider) => number;
    /** Exact closest surface point, including from inside the declared collider. */
    project: (
      collider: IAutoMoviePreparePhysicalGeometry.ICollider,
      point: IAutoMoviePhysicalProfile.ITransform["position"],
    ) => IAutoMoviePhysicalProfile.ITransform["position"];
  }
}
