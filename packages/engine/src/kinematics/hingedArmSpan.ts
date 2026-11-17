import type {
  IAutoMovieHingedArmSpan,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The span of a two-bone chain whose mid joint bends only about its own
 * hinge, as a sinusoid of the hinge angle: `hingedArmSwivel` reads its bend
 * branches off it. Splitting the far segment into the part along the hinge
 * and the part it swings gives the squared root-to-effector span
 *
 *     |m(theta)|^2 = k + alpha cos theta + beta sin theta
 *
 * whose coefficients depend on the chain's mid offset, mid rest, end offset
 * and hinge alone, not on the root's frame or a target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sinusoid, what its coefficients depend on and who reads it.
 * @evidence contracts/development/design.md#principled-representation The coefficients of an exact sinusoid in metres squared with its amplitude and phase in radians, and a holder that is empty until read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The coefficient record, its holder, the holder's maker and the one reading, all read by `hingedArmSwivel`; a body-lifetime chain rig keeps one holder per limb.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No target, root frame, branch or pose is kept in a holder.
 */
export namespace hingedArmSpan {
  /**
   * A chain's rest records the span depends on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The four rest records of `hingedArmSwivel.IChain` that the span reads, in the same frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `of`; `hingedArmSwivel.IChain` has them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No root frame or target, which the span does not depend on.
   */
  export interface IChain {
    /** Mid bone's rest offset from the chain root, in the root's bone frame, metres. */
    midOffset: IAutoMovieVector3;

    /** Mid bone's rest rotation relative to the chain root. */
    midRest: IAutoMovieQuaternion;

    /** Effector's rest offset from the mid joint, in the mid bone's frame, metres. */
    endOffset: IAutoMovieVector3;

    /** The mid joint's flexion axis in the mid bone's frame; any length. */
    hinge: IAutoMovieVector3;
  }

  /**
   * The interface contract (`IAutoMovieHingedArmSpan.IGeometry`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the interface record this owner's name stands for.
   * @evidence contracts/development/design.md#principled-representation The record is the interface's; the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type IGeometry = IAutoMovieHingedArmSpan.IGeometry;

  /**
   * The interface contract (`IAutoMovieHingedArmSpan.ISpan`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the interface record this owner's name stands for.
   * @evidence contracts/development/design.md#principled-representation The record is the interface's; the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type ISpan = IAutoMovieHingedArmSpan.ISpan;

  /**
   * Make an empty holder.
   *
   * @returns A holder no query has filled.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation An empty record whose members the first branch query fills at its original admission sites.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes nothing ahead of the query that would have computed it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Shares nothing itself; `hingedArmSwivel.prepare` states what a holder shares.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a caller-owned record.
   */
  export function empty(): ISpan {
    return {};
  }

  /**
   * Read a chain's span coefficients.
   *
   * @param chain The chain's rest records.
   * @returns The coefficients; null for a hinge shorter than 1e-6 or one that cannot change the span (amplitude below `SPAN_EPSILON`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and both null cases; the namespace states the sinusoid.
   * @evidence contracts/development/implementation.md#principled-implementation Rotation about the hinge leaves the far segment's part along the hinge fixed and turns the rest in a circle, so the squared span is an exact first harmonic of the hinge angle; the coefficients are its projections on the mid offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The split of the far segment, the constant term, the two coefficients, then amplitude and phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The thresholds are the engine's shared length scale and the span's own epsilon; a degenerate hinge returns null rather than a guess.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading; its callers hold the result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(chain: IChain): IGeometry | null {
    if (Vector3.length(chain.hinge) < 1e-6) return null;
    const hinge: IAutoMovieVector3 = Vector3.normalize(chain.hinge);
    const along: number = Vector3.dot(hinge, chain.endOffset);
    const swung: IAutoMovieVector3 = Vector3.subtract(
      chain.endOffset, Vector3.scale(hinge, along),
    );
    const radius: number = Vector3.length(swung);
    const k: number = Vector3.dot(chain.midOffset, chain.midOffset) +
      Vector3.dot(chain.endOffset, chain.endOffset) +
      2 * along * Vector3.dot(chain.midOffset,
        Quaternion.rotateVector(chain.midRest, hinge));
    let alpha: number = 0;
    let beta: number = 0;
    if (radius >= SPAN_EPSILON) {
      const unit: IAutoMovieVector3 = Vector3.scale(swung, 1 / radius);
      alpha = 2 * radius * Vector3.dot(chain.midOffset,
        Quaternion.rotateVector(chain.midRest, unit));
      beta = 2 * radius * Vector3.dot(chain.midOffset,
        Quaternion.rotateVector(chain.midRest, Vector3.cross(hinge, unit)));
    }
    const span: number = Math.hypot(alpha, beta);
    return span < SPAN_EPSILON ? null
      : { hinge, k, alpha, beta, span, phase: Math.atan2(beta, alpha) };
  }
}

/** Below this the mid joint cannot change the chain's span at all. */
const SPAN_EPSILON: number = 1e-9;
