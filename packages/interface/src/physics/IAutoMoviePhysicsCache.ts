import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalControllerCheckpoint } from "./IAutoMoviePhysicalControllerCheckpoint";
import type { IAutoMoviePhysicalFrame } from "./IAutoMoviePhysicalFrame";
import type { IAutoMoviePhysicalOwnershipEvent } from "./IAutoMoviePhysicalOwnershipEvent";
import type { IAutoMoviePhysicalRecoveryState } from "./IAutoMoviePhysicalRecoveryState";
import type { IAutoMoviePhysicalSupportWrench } from "./IAutoMoviePhysicalSupportWrench";

/**
 * Fixed-step display/audit frames and complete state needed to restart the same
 * physical performance.
 *
 * Frames use local film seconds at cached rate; checkpoint keys count cached
 * intervals, while ownership and contact samples may carry finer native times.
 * AutoMovieEnginePhysicalSimulation fills this cache and freezes published ordinary
 * records. Methods allocate samples, but public arrays, Maps and snapshot
 * buffers are borrowed producer state. readonly prevents property reassignment,
 * not Map or typed-buffer mutation. Consumers must preserve snapshots and
 * records; frames alone cannot restore native/controller state.
 */
export interface IAutoMoviePhysicsCache {
  /** Stored with replay data so incompatible checkpoints never resume. */
  readonly protocol: string;

  /**
   * Borrowed producer array containing frame zero then every completed cached
   * interval. Completed simulation freezes its ordinary records; direct cache
   * construction can leave it incomplete.
   */
  readonly frames: IAutoMoviePhysicalFrame[];

  /**
   * Borrowed Map from cached interval index to opaque full native-world
   * snapshot bytes. Map entries and typed arrays are not made immutable by
   * object freezing; consumers must not edit them.
   */
  readonly checkpoints: Map<number, Uint8Array>;

  /**
   * Borrowed controller-state Map paired with native snapshots at the same
   * cached indices; required to restore contacts, compliance, ownership and
   * target plans.
   */
  readonly controllerCheckpoints: Map<
    number,
    IAutoMoviePhysicalControllerCheckpoint
  >;

  /**
   * Causal native ownership changes; return explicitly uses position-based
   * kinematic authority.
   */
  readonly ownership: IAutoMoviePhysicalOwnershipEvent[];

  /**
   * Requested/allocated virtual support wrenches at cache instants. These are
   * motor-demand diagnostics; only native contact receipts measure achieved
   * floor force.
   */
  readonly supportWrenches: IAutoMoviePhysicalSupportWrench[];

  /**
   * Borrowed recovery-state Map paired with native/controller checkpoints at
   * the same cached indices; preserve its contents for continuation.
   */
  readonly balanceCheckpoints: Map<
    number,
    Record<string, IAutoMoviePhysicalRecoveryState>
  >;

  /** Actual recovery requests, exposed to the authored support-plan consumer. */
  readonly recovery: Record<string, IAutoMoviePhysicalRecoveryState>;

  /** Contact episodes, in start-time order. */
  readonly contacts: IAutoMovieContactReceipt[];

  /** SHA-256 of solver build and complete sampled inputs. */
  readonly identity: string;

  /** Fixed steps per second. */
  readonly rate: number;

  /** Complete film seconds. */
  readonly duration: number;

  /**
   * Read finite local seconds in [0,duration] without advancing a solver.
   * Returns a detached mutable frame using linear position/velocity and
   * shortest-arc quaternion interpolation. Throws for invalid time or
   * unavailable bounding frames.
   */
  at(seconds: number): IAutoMoviePhysicalFrame;

  /**
   * Return the last causal ownership event for body/bone at or before finite
   * local seconds in [0,duration], including substep transitions. Throws for
   * invalid time or absent matching history.
   */
  ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): IAutoMoviePhysicalOwnershipEvent["kind"];
}
