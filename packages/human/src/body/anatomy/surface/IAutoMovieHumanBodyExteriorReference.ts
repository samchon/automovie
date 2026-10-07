/**
 * The immutable source registration an exterior target builder evaluates on.
 *
 * It accompanies an immutable basis, never a numerical body request. The
 * instrument and solving channel of each answerable target come from
 * `HUMAN_BODY_EXTERIOR_TARGETS`; this record names only the exact source, its
 * rest frame and its topology authority. The bare rest convention is not a
 * registered anthropometric acquisition.
 *
 * @evidence contracts/common.md#principled-implementation Names the source once; instruments and channels keep their owners in the rule and target tables.
 * @evidence contracts/common.md#clear-and-simple-design One source registration supplies the concrete exterior producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reference convention certifies neither individual tissue nor a measured population.
 * @evidence contracts/common.md#meaningful-documentation States constructor ownership and the acquisition boundary.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorReference {
  /** Exact immutable connected source identity. */
  readonly basis: string;
  /** The authored rest frame, without an independently prescribed pose. */
  readonly evaluation: "source-rest";
  /** Explicit topology authority, independent of clinical and normal records. */
  readonly incidence: "native-indexed" | "source-partition";
}
