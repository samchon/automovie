import { AutoMovieDesignLifecycleRole } from "./AutoMovieDesignLifecycleRole";
import { AutoMovieDesignPresence } from "./AutoMovieDesignPresence";

/**
 * One subject's classification and presence at one phase.
 *
 * The role describes the whole work and is the same in every snapshot; only
 * the presence depends on the phase asked about. A subject installed on a
 * branch that neither precedes nor follows that phase reads as `pending`.
 *
 * @evidence contracts/common.md#principled-implementation Joins a role computed from which lifecycle ends are null with a presence computed from whether the installing and removing phases are among the reached phases, so both are total functions of the lifecycle and the requested phase.
 * @evidence contracts/common.md#clear-and-simple-design Four fields; `graph` is copied from the subject declaration so a consumer can filter rows by owning graph without a second lookup into the lineage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No graph name or subject is interpreted; an incomparable branch is reported as pending instead of being ordered against the requested phase by invention.
 * @evidence contracts/common.md#meaningful-documentation States which subject, its copied owning graph, that role is whole-work while presence is per phase, and how an incomparable branch reads.
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
