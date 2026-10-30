import {
  AutoMovieHumanFacade,
  type IAutoMovieHumanVisual,
} from "@automovie/viewer/human";

import type { AutoMovieHumanSkeleton as Skeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanPose } from "../../../human/src/structures/pose/IAutoMovieHumanPose";
import { reportAutoMovieResourceRetirement } from "../../../viewer/src/reportAutoMovieResourceRetirement";
import { HumanStickmanMotions } from "./HumanStickmanMotions";
import { createHumanStickmanVisual } from "./createHumanStickmanVisual";

/**
 * Existing playground name for one public Human facade with local example drawings.
 * The reusable transport/Three binding live in their optional package entries;
 * authored motions and original polygon/cartoon construction stay here.
 * Builder ownership transfers on entry, including cleanup after failed construction.
 *
 * @evidence contracts/common.md#principled-implementation Delegates control to the public facade and passes fresh example definitions plus structural references to the original builders.
 * @evidence contracts/common.md#clear-and-simple-design This constructor is the page's thin composition point; it owns no clock, FK, interpolation, clinical mapping or geometry generator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No optional library path imports playground content, and no builder buffers or authored coordinates move into product packages.
 * @evidence contracts/common.md#meaningful-documentation States package/example responsibilities and transferred builder failure cleanup.
 * @evidence contracts/performance.md#efficient-algorithms Construction assembles fixed example definitions and existing drawing slots once; inherited controls do the runtime work.
 * @evidence contracts/performance.md#reuse-equivalent-work One public facade consumes one prepared body and drawing, retaining clips for that body without regenerating shape.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful construction transfers the sink to the facade; failed construction disposes the adapter, and successful instances inherit one terminal disposer.
 */
export class HumanStickmanController extends AutoMovieHumanFacade {
  /** Assemble original page inputs without changing their geometry or prepared evaluator. */
  public constructor(options: HumanStickmanController.IOptions) {
    let visual: IAutoMovieHumanVisual;
    try {
      visual = createHumanStickmanVisual(options);
    } catch (error: unknown) {
      reportAutoMovieResourceRetirement(
        [
          (): void => { options.polygon?.dispose(); },
          (): void => { options.stickman?.dispose(); },
          (): void => { options.hints?.dispose(); },
        ],
        { error },
      );
      throw error;
    }
    try {
      super({
        rest: options.rest,
        evaluatePose: options.evaluatePose,
        definitions: HumanStickmanMotions.create(),
        visual,
        expression: options.expression,
      });
    } catch (error: unknown) {
      try {
        visual.dispose();
      } catch (cleanup: unknown) {
        throw new AggregateError(
          [error, cleanup],
          "Human playground construction and cleanup failed",
        );
      }
      throw error;
    }
  }
}

/** Compatibility types for the existing page's original builder inputs and snapshot. */
export namespace HumanStickmanController {
  /** Original geometry options plus the same fixed prepared clinical evaluator.
   *
   * @evidence contracts/common.md#principled-implementation Extends the adapter's original drawing inputs with the matching fixed prepared pose evaluator and optional public expression.
   * @evidence contracts/common.md#clear-and-simple-design Only this playground composition type joins example drawings to the reusable facade inputs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No new body schema or fallback evaluator is admitted; the evaluator and rest prototype must describe the same body.
   * @evidence contracts/common.md#meaningful-documentation States prepared-body identity, neutral expression omission and inherited drawing ownership.
   * @evidence contracts/performance.md#efficient-algorithms This erased interface performs no work; construction assembles existing slots and authored definitions once.
   * @evidence contracts/performance.md#reuse-equivalent-work The callback reuses the page's prepared body for later poses instead of regenerating shape.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The type owns no handles; controller construction transfers builders on entry, including failure cleanup.
   */
  export interface IOptions extends createHumanStickmanVisual.IOptions {
    /** Matching existing pose evaluator, prepared once by the page.
     *
     * @evidence contracts/common.md#principled-implementation Accepts existing clinical pose fields and returns the corresponding fixed body's skeleton output in metres using the page-prepared evaluator.
     * @evidence contracts/common.md#clear-and-simple-design The callback leaves clinical interpretation and clamping with the existing skeleton implementation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It must match rest and body shape for the controller lifetime; no alternate FK or body reconstruction is specified.
     * @evidence contracts/common.md#meaningful-documentation Names the prepared evaluator premise; the returned output carries actual applied clamps.
     * @evidence contracts/performance.md#efficient-algorithms The signature is erased; evaluator cost remains with the existing prepared skeleton operation.
     * @evidence contracts/performance.md#reuse-equivalent-work The page prepares one body and this callback supplies subsequent pose evaluations to the facade.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The callback reference is retained by the binding until disposal; returned records become per-operation inputs.
     */
    evaluatePose: (pose: IAutoMovieHumanPose) => Skeleton.IOutput;

    /** Existing public facial input; omission is neutral. */
    expression?: IAutoMovieHumanExpression;
  }

  /** The page now reports the public facade's defensive diagnostic snapshot.
   *
   * @evidence contracts/common.md#principled-implementation Aliases the facade's defensive transport, pose, expression and limitation snapshot.
   * @evidence contracts/common.md#clear-and-simple-design The page compatibility name references the public state contract rather than defining parallel diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias provides no motion, clinical accuracy or continuous-skin guarantee.
   * @evidence contracts/common.md#meaningful-documentation Documents that the page reports the public facade's defensive snapshot.
   * @evidence contracts/performance.md#efficient-algorithms The erased alias adds no traversal or allocation beyond the facade getter.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the existing state type so field meaning and snapshot behavior remain identical.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The alias owns no handles; callers own returned plain diagnostic copies.
   */
  export type IState = AutoMovieHumanFacade.IState;
}
