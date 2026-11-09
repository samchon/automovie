/**
 * Profile trait declaring rider and payload capacity.
 *
 * validateProfileCapabilities, also called by validateModel and production design admission, requires integer seats from 1 through 1024 and finite positive payloadMass, allowing one mountable trait per profile. No engine verb currently reads these capacities or establishes supported riding from them.
 *
 * @evidence contracts/development/design.md#principled-representation `validateProfileCapabilities` checks `seats` with `Number.isInteger` inside `[1, 1024]` and `payloadMass` as finite and positive, and refuses a repeated trait kind within one profile.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two scalars state the capacity claim, and the trait sits in the profile's `traits` list as one discriminated member beside the destructible trait.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The 1024 seat ceiling is a fixed contract bound applied to every profile, and no mounting behaviour is implied while no verb reads the trait.
 * @evidence contracts/development/common.md#meaningful-documentation States what the trait claims, the exact ranges and units, which validators enforce them, the one-per-profile rule, and that no engine verb reads it yet.
 */
export interface IAutoMovieMountableTrait {
  /** Trait discriminator. */
  kind: "mountable";

  /** Simultaneous rider capacity, an integer from 1 through 1024. */
  seats: number;

  /** Maximum supported payload in kilograms; finite and positive. */
  payloadMass: number;
}
