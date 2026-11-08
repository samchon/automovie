import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { ImpulseJoint, RigidBody } from "@dimforge/rapier3d-compat";

import type { AutoMoviePhysicsCache } from "./AutoMoviePhysicsCache";
import type { IAutoMoviePhysicalHandoff } from "./IAutoMoviePhysicalHandoff";
import type { PhysicalTargetInterval } from "./PhysicalTargetInterval";
import type { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import type { samplePhysicalAuthoredTargets } from "./samplePhysicalAuthoredTargets";
import type { solvePhysicalCompliantContacts as solveCompliance } from "./solvePhysicalCompliantContacts";

/** Solver handles are transient and rebuilt in creation order after snapshot restore. */
export interface IAutoMoviePhysicalBinding {
  /** Admitted immutable providers shared by fits within this run. */ profiles: Record<
    string,
    P
  >;
  /** Immobile position-kinematic floor; omitted only while native binding is being constructed. */ floor?: RigidBody;
  /** Scene/body segment keys to live rigid bodies. */ bodies: Map<
    string,
    RigidBody
  >;
  /** Body/joint keys to native joint constraints. */ joints: Map<
    string,
    ImpulseJoint
  >;
  /** Contact source identity indexed by collider handle. */ colliders: Map<
    number,
    IAutoMovieContactReceipt["a"]
  >;
  /** Outer surfaces eligible for compliant contact, excluding rigid inner cores. */ surfaces: Map<
    number,
    solveCompliance.ISurface
  >;
  /** Bodies whose persistent motor forces were already cleared on withdrawal. */ released: Set<string>;
  /** Bodies whose declared contact-triggered withdrawal has actually occurred. */ contactReleased: Set<string>;
  /** Current native dynamic ownership, rebuilt from native body types after restore. */ dynamic: Map<
    string,
    Set<string>
  >;
  /** Serialized relative pose/velocity corrections during return to authored motion. */ handoffs: Map<
    string,
    Record<string, IAutoMoviePhysicalHandoff>
  >;
  /** Actual native ownership transitions, shared with the replay cache. */ ownership: AutoMoviePhysicsCache.IOwnership[];
  /** Virtual requested/allocated support demand, never a measured solver impulse. */ supportWrenches: AutoMoviePhysicsCache.ISupportWrench[];
  /** Explicit root-withdrawal quality policies currently applied during protective joint effort. */ reflexQuality: Set<string>;
  /** At most one transient set of recovery motor goals per body and cached interval. */ planned: Map<
    string,
    PhysicalTargetInterval.IPlan & {
      rootDrop: number;
      residuals: Record<string, number>;
      fromRootDrop: number;
    }
  >;
  /** Actual-root support motor targets, rebuilt once per interval and after checkpoint restore. */ supportPlanned: Map<
    string,
    PhysicalTargetInterval.IPlan
  >;
  /** Reused per-body segment maps; no native wrappers escape the run. */ segments: Map<
    string,
    Map<string, RigidBody>
  >;
  /** Joint postorder for linear-work downstream gravity moments. */ gravityOrder: Map<
    string,
    P.IJoint[]
  >;
  /** Stable parent-before-child order for coherent authored reconstruction. */ order: Map<
    string,
    P.ISegment[]
  >;
  /** Immutable profile parent joints, indexed once per binding. */ jointByChild: Map<
    string,
    Map<string, P.IJoint>
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
  /** Dynamic selections are reused only for admitted immutable target arrays. */ selection: Map<
    string,
    {
      /** Owned target-array identity. */ source: readonly string[] | undefined;
      /** Explicit whole-body authored mode. */ kinematic: boolean;
      /** Run-owned segment selection. */ bones: Set<string>;
    }
  >;
  /** Initialized convex queries shared by collider-relative tracking. */ geometry?: preparePhysicalGeometry.IQueries;
  /** Authored interval coefficients rebuilt from admitted targets after restore. */ authoredTargets: Map<
    string,
    samplePhysicalAuthoredTargets.IPlan
  >;
  /** Fitted interval endpoints; native substeps interpolate one coherent moving reference instead of holding its first sample. */ contactTargets: Map<
    string,
    PhysicalTargetInterval.IPlan
  >;
}
