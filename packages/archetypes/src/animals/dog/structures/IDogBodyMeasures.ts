/** Source measurements, all centimetres; no body mass occurs in this table. */
export interface IDogBodyMeasures {
  /** Eye separation. */
  eyes: number;
  /** Snout length. */
  snout: number;
  /** Outer ear length. */
  ear: number;
  /** Chest width. */
  chestWidth: number;
  /** Neck circumference. */
  neck: number;
  /** Chest circumference. */
  girth: number;
  /** Withers height. */
  withers: number;
  /** Tail-base height. */
  tailBase: number;
  /** Withers-to-tail-base surface length. */
  body: number;
  /** Tail length. */
  tail: number;
  /** Upper forelimb surface segment. */
  upperFore: number;
  /** Lower forelimb surface segment. */
  lowerFore: number;
  /** Whole forefoot surface length, before control-bar discretization. */
  foreFoot: number;
  /** Forefoot circumference, used as a uniform bar cross-section proxy. */
  foreCircumference: number;
  /** Upper hindlimb surface distance, not true femur length. */
  upperHind: number;
  /** Lower hindlimb surface segment. */
  lowerHind: number;
  /** Whole hindfoot surface length, including the entire pes. */
  hindFoot: number;
}
