import type {
  IAutoMovieHingedArmSpan,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The span of a two-bone chain whose mid joint bends only about its own hinge,
 * as a sinusoid of the hinge angle: `hingedArmSwivel` reads its bend branches
 * off it. Splitting the far segment into the part along the hinge and the part
 * it swings gives the squared root-to-effector span
 *
 *     |m(theta)|^2 = k + alpha cos theta + beta sin theta
 *
 * Whose coefficients depend on the chain's mid offset, mid rest, end offset and
 * hinge alone, not on the root's frame or a target.
 */
export namespace hingedArmSpan {
  /** A chain's rest records the span depends on. */
  export interface IChain {
    /**
     * Mid bone's rest offset from the chain root, in the root's bone frame,
     * metres.
     */
    midOffset: IAutoMovieVector3;

    /** Mid bone's rest rotation relative to the chain root. */
    midRest: IAutoMovieQuaternion;

    /**
     * Effector's rest offset from the mid joint, in the mid bone's frame,
     * metres.
     */
    endOffset: IAutoMovieVector3;

    /** The mid joint's flexion axis in the mid bone's frame; any length. */
    hinge: IAutoMovieVector3;
  }

  /** The interface contract (`IAutoMovieHingedArmSpan.IGeometry`). */
  export type IGeometry = IAutoMovieHingedArmSpan.IGeometry;

  /** The interface contract (`IAutoMovieHingedArmSpan.ISpan`). */
  export type ISpan = IAutoMovieHingedArmSpan.ISpan;

  /**
   * Make an empty holder.
   *
   * @returns An empty record for a caller without shared span geometry.
   */
  export function empty(): ISpan {
    return {};
  }

  /** Prepare the segment-length gate and the admitted chain's fixed span. */
  export function prepare(chain: IChain): ISpan {
    const valid: boolean = !(
      Vector3.length(chain.midOffset) < 1e-6 ||
      Vector3.length(chain.endOffset) < 1e-6
    );
    return { valid, geometry: valid ? of(chain) : null };
  }

  /**
   * Read a chain's span coefficients.
   *
   * @param chain The chain's rest records.
   * @returns The coefficients; null for a hinge shorter than 1e-6 or one that
   *   cannot change the span (amplitude below `SPAN_EPSILON`).
   */
  export function of(chain: IChain): IGeometry | null {
    if (Vector3.length(chain.hinge) < 1e-6) return null;
    const hinge: IAutoMovieVector3 = Vector3.normalize(chain.hinge);
    const along: number = Vector3.dot(hinge, chain.endOffset);
    const swung: IAutoMovieVector3 = Vector3.subtract(
      chain.endOffset,
      Vector3.scale(hinge, along),
    );
    const radius: number = Vector3.length(swung);
    const k: number =
      Vector3.dot(chain.midOffset, chain.midOffset) +
      Vector3.dot(chain.endOffset, chain.endOffset) +
      2 *
        along *
        Vector3.dot(
          chain.midOffset,
          Quaternion.rotateVector(chain.midRest, hinge),
        );
    let alpha: number = 0;
    let beta: number = 0;
    if (radius >= SPAN_EPSILON) {
      const unit: IAutoMovieVector3 = Vector3.scale(swung, 1 / radius);
      alpha =
        2 *
        radius *
        Vector3.dot(
          chain.midOffset,
          Quaternion.rotateVector(chain.midRest, unit),
        );
      beta =
        2 *
        radius *
        Vector3.dot(
          chain.midOffset,
          Quaternion.rotateVector(chain.midRest, Vector3.cross(hinge, unit)),
        );
    }
    const span: number = Math.hypot(alpha, beta);
    return span < SPAN_EPSILON
      ? null
      : { hinge, k, alpha, beta, span, phase: Math.atan2(beta, alpha) };
  }
}

/** Below this the mid joint cannot change the chain's span at all. */
const SPAN_EPSILON: number = 1e-9;
