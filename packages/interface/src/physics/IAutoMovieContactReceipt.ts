import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One contact episode, shared by geometric and solved performance paths.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (One contact episode, shared by geometric and solved performance paths) and documents 12 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents One contact episode, shared by geometric and solved performance paths: interface of 12 members (`id`, `source`, `seconds`, `endSeconds`, `a`, `b`, ...); units and frames named in its text: second, seconds, world, metres, local. Optional members `samples` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieContactReceipt` in packages/interface/src/physics/IAutoMovieContactReceipt.ts; its surface is the 12 members listed and the text shows 32 other files naming it, mostly packages/engine (18), test (9), movies (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
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
