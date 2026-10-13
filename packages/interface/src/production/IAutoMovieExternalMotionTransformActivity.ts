/**
 * One ordered transformation applied while converting external motion.
 *
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

  /** Serializable parameters that fully characterize the activity. */
  parameters: Record<string, string | number | boolean | null>;
}
