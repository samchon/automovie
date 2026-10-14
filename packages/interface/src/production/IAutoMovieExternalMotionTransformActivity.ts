/**
 * One ordered transformation applied while converting external motion.
 *
 * @evidence contracts/common.md#principled-implementation Each ledger entry identifies a performed conversion step, consumed source elements, produced result elements and serializable parameters; current production emits channel-conversion and, for retargeting, retarget and translation-scale activities.
 * @evidence contracts/common.md#clear-and-simple-design A shared activity shape preserves transformation order without embedding a new executable conversion layer inside provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Basis-normalization, hierarchy-collapse, time-trim and event-remap are currently unproduced schema cases; their names do not claim that the builder performs those transformations or silently compensates for unsupported input.
 * @evidence contracts/common.md#meaningful-documentation Defines ordered actual-step provenance, source and target identities, serializable parameters and the current emitted versus unproduced activity kinds.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionTransformActivity {
  /** Closed motion conversion activity discriminator. */
  kind:
    | "basis-normalization"
    | "hierarchy-collapse"
    | "retarget"
    | "translation-scale"
    | "time-trim"
    | "channel-conversion"
    | "event-remap";

  /** Stable source element identities consumed by this activity. */
  source: string[];

  /** Stable result element identities produced by this activity. */
  target: string[];

  /** Serializable activity metadata; complete replay can also require receipt bases, compiler version and conversion algorithms. */
  parameters: Record<string, string | number | boolean | null>;
}
