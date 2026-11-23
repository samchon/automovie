import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/** Data and callback contracts shared by the ValidateModel operations. */
export namespace IAutoMovieValidateModel {
  /**
   * Assemble id/reference, primitive/mesh, skeleton (with declared joint axes),
   * gaze, transform, body/profile/affordance and material checks in stable
   * order.
   */
  export type IProps = {
    /**
     * Borrowed typed model; numeric/reference checks append faults without
     * repairing it.
     */
    model: IAutoMovieModel;
  };
}
