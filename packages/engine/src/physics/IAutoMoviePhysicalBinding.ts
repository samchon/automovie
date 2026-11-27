import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalHandoff,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSupportWrench,
  IAutoMoviePhysicalTargetInterval,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieSamplePhysicalAuthoredTargets,
  IAutoMovieSolvePhysicalCompliantContacts,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { IPhysicalCoupledTargetRun } from "./internal/IPhysicalCoupledTargetRun";

/**
 * Solver handles are transient and rebuilt in creation order after snapshot
 * restore.
 */
export interface IAutoMoviePhysicalBinding {
  /** Admitted immutable providers shared by fits within this run. */ profiles: Record<
    string,
    IAutoMoviePhysicalProfile
  >;
  /**
   * Immobile position-kinematic floor; omitted only while the binding is being
   * constructed.
   */ floor?: AutoMovieXpbdBody;
  /** Scene/body segment keys to live rigid bodies. */ bodies: Map<
    string,
    AutoMovieXpbdBody
  >;
  /** Body/joint keys to solver joints. */ joints: Map<
    string,
    AutoMovieXpbdJoint
  >;
  /** Contact source identity indexed by collider handle. */ colliders: Map<
    number,
    IAutoMovieContactReceipt["a"]
  >;
  /** Outer surfaces eligible for compliant contact, excluding rigid inner cores. */ surfaces: Map<
    number,
    IAutoMovieSolvePhysicalCompliantContacts.ISurface
  >;
  /** Bodies whose persistent motor forces were already cleared on withdrawal. */ released: Set<string>;
  /** Bodies whose declared contact-triggered withdrawal has actually occurred. */ contactReleased: Set<string>;
  /** Current dynamic ownership, rebuilt from the bodies' kinds after restore. */ dynamic: Map<
    string,
    Set<string>
  >;
  /**
   * Serialized relative pose/velocity corrections during return to authored
   * motion.
   */ handoffs: Map<string, Record<string, IAutoMoviePhysicalHandoff>>;
  /** Actual ownership transitions, shared with the replay cache. */ ownership: IAutoMoviePhysicalOwnershipEvent[];
  /**
   * Virtual requested/allocated support demand, never a measured solver
   * impulse.
   */ supportWrenches: IAutoMoviePhysicalSupportWrench[];
  /**
   * Each body's prepared disturbance response and the recorded inputs it was
   * prepared from (`preparePhysicalDisturbanceSpan`), held until a new span
   * replaces it; rebuilt from the inputs after a restore.
   */ spans: Map<
    string,
    {
      input: NonNullable<IAutoMoviePhysicalRecoveryState["span"]>;
      span: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult;
      handed?: boolean;
      started?: boolean;
    }
  >;

  /**
   * At most one transient set of recovery motor goals per body and cached
   * interval.
   */ planned: Map<
    string,
    IAutoMoviePhysicalTargetInterval.IPlan & {
      rootDrop: number;
      residuals: Record<string, number>;
      fromRootDrop: number;
    }
  >;
  /**
   * Actual-root support motor targets, rebuilt once per interval and after
   * checkpoint restore.
   */ supportPlanned: Map<string, IAutoMoviePhysicalTargetInterval.IPlan>;
  /** Reused per-body segment maps; no solver bodies escape the run. */ segments: Map<
    string,
    Map<string, AutoMovieXpbdBody>
  >;
  /** Joint postorder for linear-work downstream gravity moments. */ gravityOrder: Map<
    string,
    IAutoMoviePhysicalJoint[]
  >;
  /** Stable parent-before-child order for coherent authored reconstruction. */ order: Map<
    string,
    IAutoMoviePhysicalSegment[]
  >;
  /** Immutable profile parent joints, indexed once per binding. */ jointByChild: Map<
    string,
    Map<string, IAutoMoviePhysicalJoint>
  >;
  /** Exact descendant lists compiled once for related-branch coordinate updates. */ descendants: Map<
    string,
    Map<string, readonly string[]>
  >;
  /** Balance posture ownership and required ancestors, compiled once. */ posture: Map<
    string,
    ReadonlySet<string>
  >;
  /** Endpoint-owned descendants with and without an active balance posture. */ supportCoordinates: Map<
    string,
    { all: ReadonlySet<string>; disjoint: ReadonlySet<string> }
  >;
  /** Initialized convex queries shared by collider-relative tracking. */ geometry?: IAutoMoviePreparePhysicalGeometry.IQueries;
  /** Authored interval coefficients rebuilt from admitted targets after restore. */ authoredTargets: Map<
    string,
    IAutoMovieSamplePhysicalAuthoredTargets.IPlan
  >;
  /**
   * Fitted interval endpoints; solver substeps interpolate one coherent moving
   * reference instead of holding its first sample.
   */ contactTargets: Map<string, IAutoMoviePhysicalTargetInterval.IPlan>;
  /**
   * Admitted coupled groups and their report sink; omitted when no target
   * declares a group.
   */ coupling?: IPhysicalCoupledTargetRun;
}
