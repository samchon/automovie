/** A complete native cubic coefficient owner retained by a chart. */
export interface IAutoMovieRecoveryNativeCurveOwner {
  /** Native cubic authority identity. */
  id: string;

  /** Ordered complete cubic owner indices in the recipe. */
  controlIds: [number, number, number, number];

  /** Original ordered cubic control net, millimetres. */
  net: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ];
}
