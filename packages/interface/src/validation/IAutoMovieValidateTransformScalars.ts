import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Transform and reporting sink for shared TRS scalar admission. */
export namespace IAutoMovieValidateTransformScalars {
  /**
   * Inputs to validateTransformScalars, which independently reports
   * out-of-domain translation, rotation and scale fields. All
   * components must be finite, scale axes strictly positive and quaternion norm
   * within 1e-6 of one. It neither normalizes values nor mutates the
   * transform.
   *
   * Findings append through collector.items and collector methods; existing
   * findings are preserved and offending values may be retained by reference.
   * Collector or input-access exceptions propagate without rolling back prior
   * findings. This operation returns no admitted transform or boolean.
   */
  export type IProps = {
    /** TRS value with translation, rotation and scale fields. */
    transform: IAutoMovieTransform;

    /**
     * Location prefix to which ".translation", ".rotation", ".scale" and
     * component suffixes are appended literally.
     */
    path: string;

    /**
     * Human-readable subject used in correction text; not an identifier lookup
     * or validation rule.
     */
    label: string;

    /**
     * Borrowed mutable finding sink; its items array and push/unitQuaternion
     * methods receive synchronous appends, and thrown errors propagate.
     */
    collector: IAutoMovieViolationCollector;
  };
}
