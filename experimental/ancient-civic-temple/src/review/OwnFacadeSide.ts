
/** Visibility counts for one side of a facade, sampled every 5 cm. */
export interface OwnFacadeSide {
  /** Side of the face along its normal. */
  sign: -1 | 1;
  /** Whether this is the side the facade's address and station face. */
  addressSide: boolean;
  /** Samples on emitted geometry. */
  sampled: number;
  /** Samples the station sees unobstructed. */
  visible: number;
  /** `visible` divided by `sampled`. */
  ratio: number;
}
