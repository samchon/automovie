/**
 * The immutable source registration an exterior target builder evaluates on.
 *
 * It accompanies an immutable basis, never a numerical body request. The instrument and solving channel of each answerable target come from `HUMAN_BODY_EXTERIOR_TARGETS`; this record names only the exact source, its rest frame and its topology authority. The bare rest convention is not a registered anthropometric acquisition.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis identity, source-rest evaluation and explicit topology authority distinguish compiled exterior registration from a person's acquisition.
 * @evidence contracts/common.md#clear-and-simple-design Reference metadata names only source/frame/incidence while target tables own instruments and solving channels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source-rest convention does not imply a registered anthropometric posture, site or measurement acquisition.
 * @evidence contracts/common.md#meaningful-documentation Members give immutable source identity, rest-frame evaluation and the two admitted topology authorities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference typing performs no native-incidence analysis or source-rest body evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The identity record describes builder dependencies without itself caching compiled source evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source reference strings own no immutable basis clone or compiled builder lifetime.
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
