import { AutoMovieDesignLifecycleRole } from "./AutoMovieDesignLifecycleRole";
import { AutoMovieDesignPresence } from "./AutoMovieDesignPresence";

/**
 * One subject's classification and presence at one phase.
 *
 * The role describes the whole work and is the same in every snapshot; only
 * the presence depends on the phase asked about. A subject installed on a
 * branch that neither precedes nor follows that phase reads as `pending`.
 *
 * @author Samchon
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
