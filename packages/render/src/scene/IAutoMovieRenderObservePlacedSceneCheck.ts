import type { IAutoMovieConstraintViolation, IAutoMoviePlacedContact, IAutoMoviePlacedContinuity } from "@automovie/interface";
import type { IAutoMovieRenderObservePlacedSceneNativeSupport } from "./IAutoMovieRenderObservePlacedSceneNativeSupport";
import type { IAutoMovieRenderObservePlacedSceneNativeGrip } from "./IAutoMovieRenderObservePlacedSceneNativeGrip";

/** One source-selected obligation and its stable report identity. */
export interface IAutoMovieRenderObservePlacedSceneCheck {
  /**
   * Stable identity of the same rule and entity occurrence across frames. Use
   * a unique key per check kind in each sample.
  */
  readonly key: string;
  /** Whether this declared obligation is required for delivery. */
  readonly required: boolean;
  /** Ordered entity paths, in addition to the failed field when applicable. */
  readonly paths?: readonly string[];
  /**
   * The obligation's observations and limits: a canonical contact or
   * continuity input, a contact bound to displayed native nodes, or the raw
   * clip findings of an authored track.
  */
  readonly input:
    | IAutoMoviePlacedContact.IProps
    | IAutoMoviePlacedContinuity.IProps
    | IAutoMovieRenderObservePlacedSceneNativeSupport
    | IAutoMovieRenderObservePlacedSceneNativeGrip
    | {
        /** Selects the authored track admission result. */
        readonly kind: "track";
        /** Source path of the authored track. */
        readonly path: string;
        /** Canonical raw clip findings prepared once by the source owner. */
        readonly violations?: readonly IAutoMovieConstraintViolation[];
      };
  /**
   * Actual touching evidence for the same declared pair at one film second,
   * in one of three classes. `measured` carries one exact geometric or
   * completed solver separation in metres, with a null impulse when no solver
   * evidence exists. `absent` states that the pair was completely observed at
   * that second and did not touch. `unobservable` states that the producer
   * could not observe the pair and why. The evidence supplements the measured
   * relation and its coverage. It never becomes the expected target, and it
   * never decides intended support or grip ownership on its own.
  */
  readonly observedContact?:
    | {
        readonly status: "measured";
        readonly seconds: number;
        readonly separation: number;
        readonly impulse: number | null;
      }
    | { readonly status: "absent"; readonly seconds: number }
    | {
        readonly status: "unobservable";
        readonly seconds: number;
        readonly reason: string;
      };
}
