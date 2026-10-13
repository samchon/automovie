/** Profile trait proving that other bodies can mount this one. */
export interface IAutoMovieMountableTrait {
  /** Trait discriminator. */
  kind: "mountable";

  /** Positive simultaneous rider capacity. */
  seats: number;

  /** Maximum supported payload in kilograms. */
  payloadMass: number;
}
