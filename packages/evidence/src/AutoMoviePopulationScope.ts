import type { AutoMoviePopulationTransitionReceipt } from "./AutoMoviePopulationTransition";

/**
 * Selects the exact authored population being written and reviewed.
 *
 * A first pilot narrows only a branch with a real partition selector. For a film, treatments remain flat and contain only the events the pilot can realize, while scripts and screenplays select one delivery group. A library pilot has no invented group selector: it starts before sibling owners exist and takes the first real design/source branch through review.
 *
 * A complete-production reset selects the complete population and requires the exact reviewed construction predecessor through its transition receipt. Rebuilding begins in complete-production mode after that checkpoint; the authoring caller must retain recoverable pilot history and archive unready descendants outside the governed population. This erased selection type performs no archival or publication.
 *
 * @evidence contracts/common.md#principled-implementation A mode-discriminated union represents complete work, a first pilot and an authorized reset; reset mode requires both its accepting owner and historical transition receipt.
 * @evidence contracts/common.md#clear-and-simple-design Population selection is one explicit declaration, with optional partitioning confined to the first-pilot case and reset proof confined to reset mode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A library pilot does not fabricate a group selector, and resetting does not erase the reviewed predecessor that authorizes the transition.
 * @evidence contracts/common.md#meaningful-documentation The comment explains flat treatment selection, film delivery groups, library pilot ownership and the checkpoint meaning of a complete-production reset; members name the accepting owner and retained receipt.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The population-scope declaration selects no runtime algorithm; population file producers implement its modes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A population-scope value names selection and predecessor identity without coordinating file reads or sharing mutations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased scope union opens no archive; its caller owns receipt/host input records and validateAutoMoviePopulationTransition holds them only while checking reset or retained-pilot admission.
 *
 * @author Samchon
 */
export type AutoMoviePopulationScope =
  | {
      /** Select every active authored owner in the production. */
      mode: "complete-production";
    }
  | {
      /** Select the complete population while retaining the passed pilot. */
      mode: "complete-production-reset";

      /** Current owner accepting responsibility for the reset transition. */
      owner: string;

      /** Exact passed-pilot predecessor that authorizes this reset. */
      transition: AutoMoviePopulationTransitionReceipt;
    }
  | {
      /** Select the first reviewable branch before complete population work. */
      mode: "first-pilot";

      /** The one group selected only where an active branch owns a partition. */
      partitionGroup?: `001-${string}`;
    };
