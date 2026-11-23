import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieSamplePhysicalTarget } from "./IAutoMovieSamplePhysicalTarget";

/** One authored cached interval, independent of fitted controller plans. */
export namespace IAutoMovieSamplePhysicalAuthoredTargets {
  /** One authored cached interval, independent of fitted controller plans. */
  export interface IPlan {
    /** Enclosing cache interval. */ step: number;
    /** Original cache frequency, hertz. */ rate: number;
    /** Original admitted start transforms. */ from: Record<
      string,
      IAutoMovieRigidTransform
    >;
    /** Original admitted end transforms. */ targets: Record<
      string,
      IAutoMovieRigidTransform
    >;
    /** Bone coefficient ownership with value-aware mutation checks. */ bones: Map<
      string,
      {
        /** Bound start-transform reference, with scalar invalidation. */ before: IAutoMovieRigidTransform;
        /** Bound end-transform reference, with scalar invalidation. */ after: IAutoMovieRigidTransform;
        /** Per-bone prepared interpolation and twist. */ sample: (
          fraction: number,
        ) => IAutoMovieSamplePhysicalTarget.IResult;
      }
    >;
  }
}
