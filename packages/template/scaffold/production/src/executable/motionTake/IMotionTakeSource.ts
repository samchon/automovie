import type {
  IAutoMovieComposition,
  IAutoMovieEditPlan,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionTakeProvenance,
  IAutoMovieShot,
} from "@automovie/interface";

/**
 * Trusted production authoring inputs for one replayable Human take.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the authored edit, shot inputs and provider declarations used to reopen a take.
 * @evidence contracts/development/design.md#principled-representation Editorial admission consumes the normal plan and shot types. Human reconstruction consumes its owner input for the selected source shot and an optional authored suffix. No serialized callbacks or poses enter the artifact; source modules rebuild runtime owner inputs and are explicitly selected by the author.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The installed host adds file and package provenance. The author supplies project identity, data references, explicit bindings and exact motion inputs.
 */
export interface IMotionTakeSource {
  /** Stable identity common to all takes in this production. */
  production: string;

  /** Stable identity unique among the authored alternatives. */
  take: string;

  /** Editable plan admitted and resolved by the engine. */
  edit: IAutoMovieEditPlan;

  /** Actual authored shots referred to by the edit. */
  shots: readonly IAutoMovieShot[];

  /** Project-relative data dependencies not statically imported as modules. */
  assets: readonly string[];

  /** Explicit stable names and versions for callbacks read by the owner. */
  bindings: readonly {
    /** Stable provider ID. The `npm:` prefix is reserved for installed packages. */
    id: string;

    /** Exact version of provider behavior. */
    version: string;

    /** Bound function rebuilt by the trusted source module. */
    value: (...args: never[]) => unknown;
  }[];

  /** Stable IDs and exact string seeds of other authored owners and entities. */
  seeds: IAutoMovieMotionTakeProvenance["seeds"];

  /** Runtime inputs for the Human source of each supported shot. */
  human: Readonly<Record<string, IAutoMovieMotionHumanPerformance.IInput>>;

  /** Optional separately authored suffix and trusted parent registration. */
  branch?: {
    /** Production-relative path of the original saved artifact. */
    artifact: string;

    /** Production-relative trusted module that registered the original. */
    source: string;

    /** Count of leading original groups whose authored behavior is retained. */
    retainedParts: number;

    /** Replacement composition for all groups following the retained prefix. */
    suffix: IAutoMovieComposition;
  };
}
