import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One contact episode, shared by geometric and solved performance paths. */
export interface IAutoMovieContactReceipt {
  /** Unique stable episode id. */
  id: string;
  /** Actual receipt source; geometric receipts never assert a solved impulse. */
  source: "geometric" | "solver";
  /** Film second of first contact. */
  seconds: number;
  /** Film second of final contact in this episode. */
  endSeconds: number;
  /** Actor, bone and shape of the first collider. */
  a: { body: string; bone: string; shape: string; material: string };
  /** Actor, bone and shape of the second collider. */
  b: { body: string; bone: string; shape: string; material: string };
  /** World contact point, metres. */
  point: IAutoMovieVector3;
  /** Unit world normal directed from a toward b. */
  normal: IAutoMovieVector3;
  /** Accumulated normal impulse, N s; null for geometry-only measurement. */
  impulse: number | null;
  /** Most negative measured signed separation, metres. Explicit geometric distance queries may return a positive gap; it never qualifies as contact or spawns an impact. */
  separation: number;
  /** Peak compression, metres, for the provider's local appearance response. */
  compression: number;
  /** Solver-only completed-step measurements; geometric receipts omit these or retain an empty list. An earlier inspection never reads a later impulse. */
  samples?: {
    /** Completed fixed-step second. */ seconds: number;
    /** Step duration used to convert impulse to mean force. */ duration: number;
    /** This step's normal impulse, N s. */ impulse: number;
    /** Normal impulse actually transferred to each canonical side after explicit response gain and native f32 rounding. Omission identifies a direct native manifold measurement; compliant-solver support requires this authority explicitly. */ appliedImpulse?: {
      a: number;
      b: number;
    };
    /** This step's world application point. */ point: IAutoMovieVector3;
    /** This step's normal from a toward b. */ normal: IAutoMovieVector3;
    /** This step's signed surface separation, metres. */ separation: number;
    /** This step's surface compression, metres. */ compression: number;
  }[];
}
