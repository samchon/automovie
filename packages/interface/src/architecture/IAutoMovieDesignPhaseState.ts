import { AutoMovieDesignLifecycleRole } from "./AutoMovieDesignLifecycleRole";
import { AutoMovieDesignPresence } from "./AutoMovieDesignPresence";

/**
 * One subject's classification and presence at one phase.
 *
 * The role describes the whole work and is the same in every snapshot; only
 * the presence depends on the phase asked about. A subject installed on a
 * branch that neither precedes nor follows that phase reads as `pending`.
 *
 * @evidence contracts/common.md#principled-implementation `designLineagePhaseSnapshot` derives the role from whether `introducedIn` and `removedIn` are null and the presence from whether those phases are in the completed set, applying removed before present before pending.
 * @evidence contracts/common.md#clear-and-simple-design Phase-independent classification and phase-dependent presence are two separate members, so a consumer comparing snapshots reads only the field that can change.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A subject on an incomparable branch is reported `pending` rather than ordered against the asked phase by position, and the graph name is copied from the declaration rather than guessed from the id.
 * @evidence contracts/common.md#meaningful-documentation States which member is constant across snapshots and which varies, how an incomparable branch reads, and where the graph name comes from.
 */
export interface IAutoMovieDesignPhaseState {
  /** Declared subject id. */
  subject: string;

  /** The graph that owns the id, carried through from its declaration. */
  graph: string;

  /** How the subject relates to the work as a whole. */
  role: AutoMovieDesignLifecycleRole;

  /** Whether it is in place once this phase completes. */
  presence: AutoMovieDesignPresence;
}
