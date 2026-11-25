/**
 * Profile trait declaring rider and payload capacity.
 *
 * ValidateProfileCapabilities, also called by validateModel and production
 * design admission, requires integer seats from 1 through 1024 and finite
 * positive payloadMass, allowing one mountable trait per profile. No engine
 * verb currently reads these capacities or establishes supported riding from
 * them.
 */
export interface IAutoMovieMountableTrait {
  /** Trait discriminator. */
  kind: "mountable";

  /** Simultaneous rider capacity, an integer from 1 through 1024. */
  seats: number;

  /** Maximum supported payload in kilograms; finite and positive. */
  payloadMass: number;
}
