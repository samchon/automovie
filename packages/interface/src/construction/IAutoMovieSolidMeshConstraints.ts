/** Data and callback contracts shared by the SolidMeshConstraints operations. */
export namespace IAutoMovieSolidMeshConstraints {
  /** An existing straight native-chart segment and its periodic lift. */
  export interface ISegment {
    /** Original first endpoint ID. */
    a: number;

    /** Original second endpoint ID. */
    b: number;

    /** Integer periods added to b's stored phase; zero in a nonperiodic chart. */
    turn: number;
  }

  /** One subconstraint with every inducing input segment preserved. */
  export interface IEdge extends IAutoMovieSolidMeshConstraints.ISegment {
    /** Original input segment indices that contain this subconstraint. */
    sources: number[];
  }
}
