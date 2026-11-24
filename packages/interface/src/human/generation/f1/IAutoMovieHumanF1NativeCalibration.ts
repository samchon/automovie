import type { IAutoMovieHumanF1NativeLaw } from "./IAutoMovieHumanF1NativeLaw";
import type { IAutoMovieHumanNativeProjectionCourse } from "../conic/IAutoMovieHumanNativeProjectionCourse";

/**
 * Public contracts for reference native calibration.
 */
export namespace IAutoMovieHumanF1NativeCalibration {
  /**
   * Fields and their one source-bound physical projection calibration for this invocation.
   */
  export interface IReference {
    /** Qualified source fields, with projection measured from the original endpoint metric. */
    fields: IAutoMovieHumanF1NativeLaw.IFields;
    /** Same immutable-original owner shared by every full/tape candidate. */
    projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner;
  }
}
