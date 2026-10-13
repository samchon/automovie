import { AutoMovieDesignLifecycleRole } from "./AutoMovieDesignLifecycleRole";
import { AutoMovieDesignPresence } from "./AutoMovieDesignPresence";

/** One subject's classification and presence at one phase. */
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
