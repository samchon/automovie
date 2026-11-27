import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { AutoMovieHumanSide } from "./AutoMovieHumanSide";

/**
 * Retained foot source samples and plantar landmark addresses for rigid display
 * modules in metres. Runtime construction and admission remain with
 * AutoMovieHumanFootSurface in Human.
 */
export namespace IAutoMovieHumanFootSurface {
  /**
   * One sampled loft course; descriptor extents do not resize its retained
   * points.
   */
  export interface ICourse {
    /** Canonical chain owning every sample. */ chain: Chain;

    /** Material station in calibration mm, not world Y. */ stationMm: number;

    /** Phase-mean source centre in registered bind metres. */ centre: AutoMovieVector3Tuple;

    /** Retained samples' extent along the section's first axis, metres. */ depth: number;

    /** Retained samples' extent along the section's second axis, metres. */ breadth: number;

    /** Actual evaluated source points, retained without projection. */ points: AutoMovieVector3Tuple[];

    /** Corresponding material phases in radians. */ sourcePhases: number[];

    /**
     * Cumulative cyclic chord length divided by polygon perimeter, times 2 pi;
     * for display joining only.
     */ displayCoordinates: number[];
  }

  /** Canonical foot chains, excluding independently articulated toes. */
  export type Chain = `foot.${AutoMovieHumanSide}`;

  /** The three anatomical plantar samples the original renderer retains. */
  export type Landmark = "plantarHeel" | "medialBall" | "lateralBall";

  /** Courses belonging to one existing rigid joint. */
  export interface IModule {
    /** Exact existing evaluator joint; not a new pivot. */ bone:
      | `${AutoMovieHumanSide}Subtalar`
      | `${AutoMovieHumanSide}Midfoot`;

    /** Direction of the ordered module courses, dimensionless. */ axis: AutoMovieVector3Tuple;

    /** Same number of source points in every course. */ courses: ICourse[];
  }

  /** Address of a source point that must also be an emitted polygon vertex. */
  export interface ILandmark {
    /** Existing rigid module carrying the point. */ module:
      | "hindfoot"
      | "forefoot";

    /** Zero-based course index in that module. */ course: number;

    /** Zero-based source point, giving ring-major emitted identity. */ point: number;
  }

  /** One person's source foot; its seam has one geometry owner. */
  export interface ISide {
    /** Ankle and calcaneal envelope driven by Subtalar. */ hindfoot: IModule;

    /** Continuation from the shared course, driven by Midfoot. */ forefoot: IModule;

    /** Source addresses of actual plantar anatomical samples. */ landmarks: Record<
      Landmark,
      ILandmark
    >;

    /** Sampled heights, not a weight-bearing or full-foot clearance claim. */ support: ISideSupport;
  }

  /** The support object of {@link ISide}. */
  export type ISideSupport = {
    /** Minimum of these source course points only, metres. */ minimumHeight: number;

    /** Bind-body Y of each named source point, metres. */ landmarkHeights: Record<
      Landmark,
      number
    >;
  };

  /**
   * Deeply frozen bilateral display data, shared by evaluations of one fixed
   * body.
   */
  export interface IOutput {
    /** All coordinates and extents use physical metres. */ units: "metres";

    /** Left source foot. */ left: ISide;

    /** Right source foot. */ right: ISide;
  }
}
