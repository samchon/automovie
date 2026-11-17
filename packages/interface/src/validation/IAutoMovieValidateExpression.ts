import type { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/**
 * Data and callback contracts shared by the ValidateExpression operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admit preset/channel membership, intensity/weight ranges and duplicate ARKit channels. Member documentation states the supplied records, units and absence meanings used by validateExpression.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The validator reports invalid membership, duplicate channels and ranges rather than clamping or inventing an expression; omitted collector creates local collection.
 * @evidence contracts/development/design.md#principled-representation expression supplies canonical preset and ARKit weights on [0,1]; path locates diagnostics and optional collector supplies the caller's mutable sink.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateExpression, used by validateExpression. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateExpression {
  /**
   * Admit preset/channel membership, intensity/weight ranges and duplicate ARKit channels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Admit preset/channel membership, intensity/weight ranges and duplicate ARKit channels. Member documentation states the supplied records, units and absence meanings used by validateExpression.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The validator reports invalid membership, duplicate channels and ranges rather than clamping or inventing an expression; omitted collector creates local collection.
   * @evidence contracts/development/design.md#principled-representation expression supplies canonical preset and ARKit weights on [0,1]; path locates diagnostics and optional collector supplies the caller's mutable sink.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateExpression.IProps, used by validateExpression. Its expression, path, collector members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Borrowed preset and optional blendshape weights with inclusive 0..1 magnitudes. */
    expression: IAutoMovieExpression;

    /** Base diagnostic address, defaulting to $input. */
    path?: string;

    /** Optional caller-owned sink advanced by this validation. */
    collector?: IAutoMovieViolationCollector;
  };
}
