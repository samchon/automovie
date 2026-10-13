/**
 * Profile trait proving that other bodies can mount this one.
 *
 * `validateProfileCapabilities` and the production design lint require `seats`
 * to be an integer from 1 through 1024 and `payloadMass` to be finite and
 * positive, and allow one mountable trait per profile. No engine verb reads
 * this trait yet.
 *
 * @evidence contracts/common.md#principled-implementation A typed capability variant discriminated by `kind`, so the profile contract grants mounting only through this variant; the seat range and the payload positivity are checked identically by the engine validator and the production lint.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers state capacity, but no engine or production verb reads `seats` or `payloadMass` today, so the record is validated data awaiting a mounting verb, which this chapter's rule against presumed future needs flags.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1024-seat ceiling is a contract constant shared by both validators rather than a fixture value, and a second mountable trait on one profile is refused instead of merged.
 * @evidence contracts/common.md#meaningful-documentation States the seat integer range, the payload unit and positivity, the one-per-profile rule, and that no verb consumes the trait yet.
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
