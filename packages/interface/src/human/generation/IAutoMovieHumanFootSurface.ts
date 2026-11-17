import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSide } from "../AutoMovieHumanSide";

/** Type contracts exchanged by AutoMovieHumanFootSurface; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootSurface {
  /** One sampled loft course; descriptor extents do not resize its retained points.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One sampled loft course; descriptor extents do not resize its retained points.
   * @evidence contracts/development/design.md#principled-representation `chain`: Canonical chain owning every sample. `stationMm`: Material station in calibration mm, not world Y. `centre`: Phase-mean source centre in registered bind metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootCourse.course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chain`, `stationMm`, `centre`, `depth`, `breadth`, `points`, `sourcePhases`, `displayCoordinates`; callers supply the complete record.
   */
  export interface ICourse {
    /** Canonical chain owning every sample. */ chain: Chain;

    /** Material station in calibration mm, not world Y. */ stationMm: number;

    /** Phase-mean source centre in registered bind metres. */ centre: AutoMovieVector3Tuple;

    /** Retained samples' extent along the section's first axis, metres. */ depth: number;

    /** Retained samples' extent along the section's second axis, metres. */ breadth: number;

    /** Actual evaluated source points, retained without projection. */ points: AutoMovieVector3Tuple[];

    /** Corresponding material phases in radians. */ sourcePhases: number[];

    /** Cumulative cyclic chord length divided by polygon perimeter, times 2 pi; for display joining only. */ displayCoordinates: number[];
  }

  /** Canonical foot chains, excluding independently articulated toes.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Canonical foot chains, excluding independently articulated toes.
   * @evidence contracts/development/design.md#principled-representation Canonical foot chains, excluding independently articulated toes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootSurface.Chain is the canonical exchange used by AutoMovieHumanFootCourse.course, chain.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootCourse.course, chain for canonical foot chains, excluding independently articulated toes.
   */
  export type Chain = `foot.${AutoMovieHumanSide}`;

  /** The three anatomical plantar samples the original renderer retains.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The three anatomical plantar samples the original renderer retains.
   * @evidence contracts/development/design.md#principled-representation The three anatomical plantar samples the original renderer retains. The closed alternatives are "plantarHeel", "medialBall", "lateralBall".
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootSurface.Landmark is the canonical exchange used by landmarks, heights.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by landmarks, heights for the three anatomical plantar samples the original renderer retains.
   */
  export type Landmark = "plantarHeel" | "medialBall" | "lateralBall";

  /** Courses belonging to one existing rigid joint.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Courses belonging to one existing rigid joint.
   * @evidence contracts/development/design.md#principled-representation `bone`: Exact existing evaluator joint; not a new pivot. `axis`: Direction of the ordered module courses, dimensionless. `courses`: Same number of source points in every course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootSurface.IModule is the canonical exchange used by modules.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `axis`, `courses`; callers supply the complete record.
   */
  export interface IModule {
    /** Exact existing evaluator joint; not a new pivot. */ bone:
      | `${AutoMovieHumanSide}Subtalar`
      | `${AutoMovieHumanSide}Midfoot`;

    /** Direction of the ordered module courses, dimensionless. */ axis: AutoMovieVector3Tuple;

    /** Same number of source points in every course. */ courses: ICourse[];
  }

  /** Address of a source point that must also be an emitted polygon vertex.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Address of a source point that must also be an emitted polygon vertex.
   * @evidence contracts/development/design.md#principled-representation `module`: Existing rigid module carrying the point. `course`: Zero-based course index in that module. `point`: Zero-based source point, giving ring-major emitted identity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootSurface.ILandmark is the canonical exchange used by landmarks, address.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `module`, `course`, `point`; callers supply the complete record.
   */
  export interface ILandmark {
    /** Existing rigid module carrying the point. */ module:
      | "hindfoot"
      | "forefoot";

    /** Zero-based course index in that module. */ course: number;

    /** Zero-based source point, giving ring-major emitted identity. */ point: number;
  }

  /** One person's source foot; its seam has one geometry owner.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One person's source foot; its seam has one geometry owner.
   * @evidence contracts/development/design.md#principled-representation `hindfoot`: Ankle and calcaneal envelope driven by Subtalar. `forefoot`: Continuation from the shared course, driven by Midfoot. `landmarks`: Source addresses of actual plantar anatomical samples.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `hindfoot`, `forefoot`, `landmarks`, `support`; callers supply the complete record.
   */
  export interface ISide {
    /** Ankle and calcaneal envelope driven by Subtalar. */ hindfoot: IModule;

    /** Continuation from the shared course, driven by Midfoot. */ forefoot: IModule;

    /** Source addresses of actual plantar anatomical samples. */ landmarks: Record<
      Landmark,
      ILandmark
    >;

    /** Sampled heights, not a weight-bearing or full-foot clearance claim. */ support: {
      /** Minimum of these source course points only, metres. */ minimumHeight: number;

      /** Bind-body Y of each named source point, metres. */ landmarkHeights: Record<
        Landmark,
        number
      >;
    };
  }

  /** Deeply frozen bilateral display data, shared by evaluations of one fixed body.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Deeply frozen bilateral display data, shared by evaluations of one fixed body.
   * @evidence contracts/development/design.md#principled-representation `units`: All coordinates and extents use physical metres. `left`: Left source foot. `right`: Right source foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSurface.derive. Also types AutoMovieHumanFootSurface.output, AutoMovieHumanSkeleton.footSurface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `units`, `left`, `right`; callers supply the complete record.
   */
  export interface IOutput {
    /** All coordinates and extents use physical metres. */ units: "metres";

    /** Left source foot. */ left: ISide;

    /** Right source foot. */ right: ISide;
  }
}
