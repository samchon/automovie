/**
 * Profile trait proving that other bodies can mount this one.
 *
 * `validateProfileCapabilities` and the production design lint require `seats`
 * to be an integer from 1 through 1024 and `payloadMass` to be finite and
 * positive, and allow one mountable trait per profile. No engine verb reads
 * this trait yet.
 *
 * @author Samchon
 */
export interface IAutoMovieMountableTrait {
  /** Trait discriminator. */
  kind: "mountable";

  /** Simultaneous rider capacity, an integer from 1 through 1024. */
  seats: number;

  /** Maximum supported payload in kilograms; finite and positive. */
  payloadMass: number;
}
