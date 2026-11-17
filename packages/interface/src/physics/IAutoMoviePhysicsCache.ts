import type { IAutoMovieAdvancePhysicalBalance } from "./IAutoMovieAdvancePhysicalBalance";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalControllerCheckpoint } from "./IAutoMoviePhysicalControllerCheckpoint";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Fixed-step display/audit frames and complete state needed to restart the same physical performance.
 *
 * Frames use local film seconds at cached rate; checkpoint keys count cached intervals, while ownership and contact samples may carry finer native times. AutoMoviePhysicalSimulation fills this cache and freezes published ordinary records. Methods allocate samples, but public arrays, Maps and snapshot buffers are borrowed producer state. readonly prevents property reassignment, not Map or typed-buffer mutation. Consumers must preserve snapshots and records; frames alone cannot restore native/controller state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fixed-step display/audit frames and complete state needed to restart the same physical performance.
 * @evidence contracts/development/design.md#principled-representation Frames use local film seconds at cached rate; checkpoint keys count cached intervals, while ownership and contact samples may carry finer native times.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMoviePhysicalSimulation fills this cache and freezes published ordinary records. Methods allocate samples, but public arrays, Maps and snapshot buffers are borrowed producer state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts readonly prevents property reassignment, not Map or typed-buffer mutation. Consumers must preserve snapshots and records; frames alone cannot restore native/controller state.
 */
export interface IAutoMoviePhysicsCache  {

  /** Stored with replay data so incompatible checkpoints never resume. */
  readonly protocol: string;

/** Borrowed producer array containing frame zero then every completed cached interval. Completed simulation freezes its ordinary records; direct cache construction can leave it incomplete. */
  readonly frames: IAutoMoviePhysicsCache.IFrame[];

/** Borrowed Map from cached interval index to opaque full native-world snapshot bytes. Map entries and typed arrays are not made immutable by object freezing; consumers must not edit them. */
  readonly checkpoints: Map<number, Uint8Array>;

/** Borrowed controller-state Map paired with native snapshots at the same cached indices; required to restore contacts, compliance, ownership and target plans. */
  readonly controllerCheckpoints: Map<number, IAutoMoviePhysicalControllerCheckpoint>;

/** Causal native ownership changes; return explicitly uses position-based kinematic authority. */
  readonly ownership: IAutoMoviePhysicsCache.IOwnership[];

/** Requested/allocated virtual support wrenches at cache instants. These are motor-demand diagnostics; only native contact receipts measure achieved floor force. */
  readonly supportWrenches: IAutoMoviePhysicsCache.ISupportWrench[];

/** Borrowed recovery-state Map paired with native/controller checkpoints at the same cached indices; preserve its contents for continuation. */
  readonly balanceCheckpoints: Map<
    number,
    Record<string, IAutoMovieAdvancePhysicalBalance.IState>
  >;

/** Actual recovery requests, exposed to the authored support-plan consumer. */
  readonly recovery: Record<string, IAutoMovieAdvancePhysicalBalance.IState>;

/** Contact episodes, in start-time order. */
  readonly contacts: IAutoMovieContactReceipt[];

/** SHA-256 of solver build and complete sampled inputs. */
    readonly identity: string;

/** Fixed steps per second. */
    readonly rate: number;

/** Complete film seconds. */
    readonly duration: number;

/** Read finite local seconds in [0,duration] without advancing a solver. Returns a detached mutable frame using linear position/velocity and shortest-arc quaternion interpolation. Throws for invalid time or unavailable bounding frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the at callback or sampling contract, including its clock and ownership obligations.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   */
  at(seconds: number): IAutoMoviePhysicsCache.IFrame ;

/** Return the last causal ownership event for body/bone at or before finite local seconds in [0,duration], including substep transitions. Throws for invalid time or absent matching history.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the ownershipAt callback or sampling contract, including its clock and ownership obligations.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   */
  ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): IAutoMoviePhysicsCache.IOwnership["kind"] ;
}

/** World replay frames, native authority history and virtual support-allocation diagnostics. */
export namespace IAutoMoviePhysicsCache {
  /**
     * Virtual world force and moment at a support-allocation diagnostic origin.
     *
     * force uses N and torque N m about the associated root COM; both vectors use world axes. trackPhysicalWorld stores these vectors as requested, allocated and residual quantities in ISupportWrench. A virtual wrench is a controller prediction, not an observed contact impulse; the origin belongs to the enclosing diagnostic.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Virtual world force and moment at a support-allocation diagnostic origin.
     * @evidence contracts/development/design.md#principled-representation force uses N and torque N m about the associated root COM; both vectors use world axes.
     * @evidence contracts/development/design.md#minimal-and-owned-surface trackPhysicalWorld stores these vectors as requested, allocated and residual quantities in ISupportWrench.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A virtual wrench is a controller prediction, not an observed contact impulse; the origin belongs to the enclosing diagnostic.
     */
    export interface IWrench {
      
      /** World newtons. */
      force: IAutoMovieVector3;
      
      /** World newton metres about the recorded root COM. */
      torque: IAutoMovieVector3;
    }

  /**
     * Requested and geometrically allocated support wrench before native integration.
     *
     * origin is the actual pre-integration root COM in world metres; seconds is the associated cache instant and residual equals requested minus allocated. trackPhysicalWorld records the allocation from actual floor witnesses for replay and diagnosis; contact receipts independently report transferred impulse. Even zero residual does not prove achieved load after motor caps or integration; pointCount may be zero and counts participating witnesses rather than support limbs.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Requested and geometrically allocated support wrench before native integration.
     * @evidence contracts/development/design.md#principled-representation origin is the actual pre-integration root COM in world metres; seconds is the associated cache instant and residual equals requested minus allocated.
     * @evidence contracts/development/design.md#minimal-and-owned-surface trackPhysicalWorld records the allocation from actual floor witnesses for replay and diagnosis; contact receipts independently report transferred impulse.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Even zero residual does not prove achieved load after motor caps or integration; pointCount may be zero and counts participating witnesses rather than support limbs.
     */
    export interface ISupportWrench {
      
      /** Scene body requesting the root wrench. */
      body: string;
      
      /** Local cache instant associated with the prediction, seconds; its origin and allocation are evaluated before the corresponding integration. */
      seconds: number;
      
      /** Actual root COM used as the allocation's moment origin, world metres before integration. */
      origin: IAutoMovieVector3;
      
      /** Requested root force in N and moment in N m. */
      requested: IAutoMoviePhysicsCache.IWrench;
      
      /** Geometrically feasible force allocation before native motor caps and integration. */
      allocated: IAutoMoviePhysicsCache.IWrench;
      
      /** Requested minus allocated, in the same SI units; zero is not a measured physical success. */
      residual: IAutoMoviePhysicsCache.IWrench;
      
      /** Number of actual floor witnesses participating in this allocation, 0..1024. */
      pointCount: number;
    }

  /**
     * One causal change of a segment's native motion authority.
     *
     * seconds is local film time including native substeps; kind separates dynamic, C1 kinematic return and authored authority. advancePhysicalOwnership emits events consumed by cache and playback ownershipAt using the latest matching event at or before the query. A return event is a kinematic reconciliation, not force response. Callers preserve producer order and initial events; missing matching history causes sampling to throw.
     *
     * @evidence contracts/development/common.md#meaningful-documentation One causal change of a segment's native motion authority.
     * @evidence contracts/development/design.md#principled-representation seconds is local film time including native substeps; kind separates dynamic, C1 kinematic return and authored authority.
     * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalOwnership emits events consumed by cache and playback ownershipAt using the latest matching event at or before the query.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A return event is a kinematic reconciliation, not force response. Callers preserve producer order and initial events; missing matching history causes sampling to throw.
     */
    export interface IOwnership {
      
      /** Provider identity. */
      body: string;
      
      /** Segment identity. */
      bone: string;
      
      /** Local seconds, including native substeps. */
      seconds: number;
      
      /** Return is a C1 kinematic reconciliation, not a dynamic force response. */
      kind: "dynamic" | "return" | "authored";
    }

  /**
     * Observed pose and velocity of one bone origin in world coordinates.
     *
     * Inherited position is metres and rotation is a unit quaternion; velocity is m/s and angularVelocity rad/s in world axes. Simulation capture writes the segment record and cache/playback interpolation returns newly allocated samples for display and audit. This is bone-origin velocity, not automatically COM velocity or the derivative of an interpolated display path; consumers must preserve that distinction.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Observed pose and velocity of one bone origin in world coordinates.
     * @evidence contracts/development/design.md#principled-representation Inherited position is metres and rotation is a unit quaternion; velocity is m/s and angularVelocity rad/s in world axes.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Simulation capture writes the segment record and cache/playback interpolation returns newly allocated samples for display and audit.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts This is bone-origin velocity, not automatically COM velocity or the derivative of an interpolated display path; consumers must preserve that distinction.
     */
    export interface ISegment extends IAutoMoviePhysicalProfile.ITransform {
      
      /** World linear velocity of the bone origin in m/s, including any COM-to-origin rotational contribution. */
      velocity: IAutoMovieVector3;
      
      /** World angular velocity, rad/s. */
      angularVelocity: IAutoMovieVector3;
    }

  /**
     * A completed cache sample or an interpolated display sample of every admitted segment.
     *
     * seconds is local film time from zero; bodies indexes scene body then bone, with each segment represented in world SI coordinates. Simulation stores completed samples; cache.at and playback.at allocate detached sampled records at arbitrary valid seconds. The frame carries no native contacts or controller memory and cannot restart simulation. Body/segment completeness is enforced by producers and motion-frame admission.
     *
     * @evidence contracts/development/common.md#meaningful-documentation A completed cache sample or an interpolated display sample of every admitted segment.
     * @evidence contracts/development/design.md#principled-representation seconds is local film time from zero; bodies indexes scene body then bone, with each segment represented in world SI coordinates.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Simulation stores completed samples; cache.at and playback.at allocate detached sampled records at arbitrary valid seconds.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The frame carries no native contacts or controller memory and cannot restart simulation. Body/segment completeness is enforced by producers and motion-frame admission.
     */
    export interface IFrame {
      
      /** Local film seconds from zero; may lie between cached instants when returned by at. */
      seconds: number;
      
      /** Complete world segment states indexed first by scene body id, then by bone id; no native handles are retained. */
      bodies: Record<
        string,
        Record<string, IAutoMoviePhysicsCache.ISegment>
      >;
    }
}
