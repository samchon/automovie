import type { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Data and callback contracts shared by the ValidateExpression operations. */
export namespace IAutoMovieValidateExpression {
  /**
   * Admit preset/channel membership, intensity/weight ranges and duplicate
   * ARKit channels.
   */
  export type IProps = {
    /**
     * Borrowed preset and optional blendshape weights with inclusive 0..1
     * magnitudes.
     */
    expression: IAutoMovieExpression;

    /** Base diagnostic address, defaulting to $input. */
    path?: string;

    /** Optional caller-owned sink advanced by this validation. */
    collector?: IAutoMovieViolationCollector;
  };
}
