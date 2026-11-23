/** Contracts used by WorkoutSupport.at. */
export namespace IAutoMovieMotionHumanWorkoutSupport {
  /**
   * Where a prop's affordance is as the action starts. Input on of
   * WorkoutSupport.at. The prop's subject id, the affordance's id and, for a
   * support of two places such as a dip station's two bars, the other
   * affordance's id.
   */
  export type IAtOn = {
    /** Scene subject id of the exercise support prop. */
    prop: string;
    /** Affordance id on that prop used for the first contact. */
    affordance: string;
    /**
     * Optional second support affordance id on the same prop; omitted uses the
     * single-contact case.
     */
    other?: string;
  };
}
