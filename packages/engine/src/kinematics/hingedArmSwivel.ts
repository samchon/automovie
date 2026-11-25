import type {
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { aimRotation } from "./aimRotation";
import { hingedArmSpan } from "./hingedArmSpan";

/**
 * The geometry of a two-bone chain whose mid joint bends only about its own
 * hinge, as `hingedArmArticulation` poses it: the hinge angles that reach a
 * target's distance (the chain's bend branches, each stopped inside the mid
 * joint's range), and the root rotation that aims the chain at the target and
 * then turns it by a swivel about its own root-to-effector line, which leaves
 * the effector where it is (Tolani, Goswami and Badler 2000). A swivel and a
 * branch name one pose of the chain for any target, so a caller that holds them
 * while the target moves poses the chain exactly as the articulation does, and
 * `read` recovers them from a posed chain.
 */
export namespace hingedArmSwivel {
  /**
   * Swivel resolution of `hingedArmArticulation`'s candidate sweep, in degrees.
   *
   * Every candidate lands the effector on the same point, so the step decides
   * only which of the equally exact poses is chosen, never how close the hand
   * gets. One degree gives 360 candidates per bend branch, and the solve runs
   * once per authored action rather than per frame.
   */
  export const STEP: number = 1;

  /**
   * The golden-section ratio, `(sqrt(5) - 1) / 2`, by which each refinement
   * pass shrinks the swivel bracket.
   */
  export const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

  /**
   * Golden-section passes refining the swivel inside the two-step bracket
   * around each local minimum of the sweep: the fewest that shrink the bracket,
   * `2 STEP`, by `GOLDEN` a pass to within the joint's tolerance
   * (`ROM_TOLERANCE`), since a swivel turns the chain root's joint by itself
   * and a solver need resolve a joint's angle no finer.
   */
  export const REFINEMENTS: number = Math.ceil(
    Math.log(ROM_TOLERANCE / (2 * STEP)) / Math.log(GOLDEN),
  );

  /**
   * The width the refinement leaves of a swivel's bracket, degrees: the
   * two-step bracket shrunk by `GOLDEN` per pass, the swivel's resolution,
   * within `ROM_TOLERANCE`.
   */
  export const RESOLUTION: number = 2 * STEP * GOLDEN ** REFINEMENTS;

  /**
   * The chain's bend branches toward its target: the two hinge angles whose
   * span is the target's distance, `phase + acos` first, or the fully extended
   * or folded one outside the span, each stopped at the nearer limit of the
   * range. The fully extended branch is the rest hinge angle, zero, wherever
   * zero's span is the extended span itself in floating point: a limb straight
   * at rest to within rounding of its bones' offsets then stands straight, on
   * either side of a mirrored body alike.
   *
   * @param chain The chain.
   * @returns The branches, in that order, or null for a degenerate chain
   *   (`hingedArmArticulation`).
   */
  export function branches(
    chain: IAutoMovieHingedChainGeometry,
  ): IAutoMovieHingedArmSwivel.IStop[] | null {
    return branchStops(chain);
  }

  /**
   * The chain posed at a hinge angle, for any swivel: the mid joint turned by
   * the hinge angle, the root aimed so the chain's root-to-effector line points
   * at the target (`aimRotation`), then turned about that line by the swivel.
   *
   * @param chain The chain.
   * @param theta The hinge angle, radians.
   * @returns The bone-local root and mid rotations at a swivel about the
   *   root-to-effector line, degrees.
   */
  export function pose(
    chain: IAutoMovieHingedChainGeometry,
    theta: number,
  ): (swivel: number) => {
    upper: IAutoMovieQuaternion;
    lower: IAutoMovieQuaternion;
  } {
    return poseBranch(chain, theta);
  }

  /** The interface contract (`IAutoMovieHingedArmSwivel.IPrepared`). */
  export type IPrepared = IAutoMovieHingedArmSwivel.IPrepared;

  /** The interface contract (`IAutoMovieHingedArmSwivel.IPreparedTarget`). */
  export type IPreparedTarget = IAutoMovieHingedArmSwivel.IPreparedTarget;

  /** The interface contract (`IAutoMovieHingedArmSwivel.IHarmonic`). */
  export type IHarmonic = IAutoMovieHingedArmSwivel.IHarmonic;

  /**
   * Prepare an unchanged root frame, hinge and segment geometry. The optional
   * span supplies geometry already computed from the same offsets, mid rest and
   * hinge. Each target computes its own distance and root-local goal, with
   * branch angles and each swivel still evaluated at their actual inputs.
   */
  export function prepare(
    source: Omit<IAutoMovieHingedChainGeometry, "target" | "range">,
    shared?: hingedArmSpan.ISpan,
  ): IPrepared {
    const fixed: Omit<IAutoMovieHingedChainGeometry, "target" | "range"> = {
      upper: {
        worldPosition: { ...source.upper.worldPosition },
        worldRotation: { ...source.upper.worldRotation },
      },
      midOffset: { ...source.midOffset },
      midRest: { ...source.midRest },
      endOffset: { ...source.endOffset },
      hinge: { ...source.hinge },
    };
    const computed: hingedArmSpan.ISpan =
      shared?.valid === undefined || shared.geometry === undefined
        ? hingedArmSpan.prepare(fixed)
        : shared;
    const coefficients: IGeometry | null | undefined =
      shared?.geometry === undefined ? computed.geometry : shared.geometry;
    const span: hingedArmSpan.ISpan = {
      valid: shared?.valid ?? computed.valid,
      geometry:
        coefficients === undefined || coefficients === null
          ? coefficients
          : { ...coefficients },
    };
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      fixed.upper.worldRotation,
    );
    const hinge: IAutoMovieVector3 =
      span.geometry === undefined || span.geometry === null
        ? Vector3.normalize(fixed.hinge)
        : { ...span.geometry.hinge };
    return {
      target: (
        point: IAutoMovieVector3,
        range?: IAutoMovieHingedChainGeometry["range"],
      ): IPreparedTarget => {
        const chain: IAutoMovieHingedChainGeometry = {
          ...fixed,
          target: { ...point },
          ...(range === undefined ? {} : { range: { ...range } }),
        };
        const delta: IAutoMovieVector3 = Vector3.subtract(
          chain.target,
          fixed.upper.worldPosition,
        );
        const distance: number = Vector3.length(delta);
        const target: ITargetFrame = {
          hinge,
          goal: Quaternion.rotateVector(inverse, delta),
        };
        return {
          branches: (): IAutoMovieHingedArmSwivel.IStop[] | null =>
            branchStops(chain, span, distance),
          pose: (theta: number): ReturnType<typeof hingedArmSwivel.pose> =>
            poseBranch(chain, theta, target),
          harmonic: (theta: number): IHarmonic => {
            const branch: ReturnType<typeof aimed> = aimed(
              chain,
              theta,
              target,
            );
            const { lower, line, aim }: ReturnType<typeof aimed> = branch;
            const axis: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
              line,
              180,
            );

            // The pure generator has scalar zero algebraically; do not
            // leak floating cos(pi/2) from an evaluated pose into it.
            axis.w = 0;
            return {
              lower,
              cosine: aim,
              sine: Quaternion.multiply(aim, axis),
              pose: (): ReturnType<typeof hingedArmSwivel.pose> =>
                poseBranch(chain, theta, target, branch),
            };
          },
        };
      },
    };
  }

  /** A branch's fixed pose generator, shared by direct and prepared entries. */
  function poseBranch(
    chain: IAutoMovieHingedChainGeometry,
    theta: number,
    target?: ITargetFrame,
    branch?: ReturnType<typeof aimed>,
  ): ReturnType<typeof hingedArmSwivel.pose> {
    const { lower, line, aim }: ReturnType<typeof aimed> =
      branch ?? aimed(chain, theta, target);
    const swivelRotation: ReturnType<typeof Quaternion.prepareAxisAngle> =
      Quaternion.prepareAxisAngle(line);
    return (
      swivel: number,
    ): ReturnType<ReturnType<typeof hingedArmSwivel.pose>> => ({
      upper: Quaternion.multiply(aim, swivelRotation(swivel)),
      lower,
    });
  }

  /**
   * The swivel of a posed chain: the root's turn about the chain's
   * root-to-effector line past the aim `pose` gives for its hinge angle.
   *
   * @param chain The chain, its target where the posed effector lies.
   * @param upper The posed bone-local root rotation.
   * @param theta The posed hinge angle, radians.
   * @returns Degrees, in (-180, 180].
   */
  export function read(
    chain: IAutoMovieHingedChainGeometry,
    upper: IAutoMovieQuaternion,
    theta: number,
  ): number {
    const { line, aim }: ReturnType<typeof aimed> = aimed(chain, theta);
    const rest: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(aim),
      upper,
    );
    const along: number = rest.x * line.x + rest.y * line.y + rest.z * line.z;
    const degrees: number = (2 * Math.atan2(along, rest.w) * 180) / Math.PI;
    return degrees > 180
      ? degrees - 360
      : degrees <= -180
        ? degrees + 360
        : degrees;
  }

  /**
   * The mid rotation, the root-to-effector line in the root's frame and the aim
   * at a hinge angle.
   */
  function aimed(
    chain: IAutoMovieHingedChainGeometry,
    theta: number,
    target?: ITargetFrame,
  ): {
    lower: IAutoMovieQuaternion;
    line: IAutoMovieVector3;
    aim: IAutoMovieQuaternion;
  } {
    const lower: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      target?.hinge ?? Vector3.normalize(chain.hinge),
      theta * RAD2DEG,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      chain.midOffset,
      Quaternion.rotateVector(
        chain.midRest,
        Quaternion.rotateVector(lower, chain.endOffset),
      ),
    );
    const goal: IAutoMovieVector3 =
      target?.goal ??
      Quaternion.rotateVector(
        Quaternion.inverse(chain.upper.worldRotation),
        Vector3.subtract(chain.target, chain.upper.worldPosition),
      );
    return {
      lower,
      line: Vector3.normalize(mid),
      aim: aimRotation(mid, goal),
    };
  }

  /** Source-only hinge span coefficients (`hingedArmSpan.IGeometry`). */
  type IGeometry = hingedArmSpan.IGeometry;

  /** Root-local geometry shared by one target's branch poses. */
  interface ITargetFrame {
    /** Unit hinge of the prepared source. */
    hinge: IAutoMovieVector3;
    /** The target goal in the root frame. */
    goal: IAutoMovieVector3;
  }

  /** Preserve root/length/target/hinge admission, root order and range stops. */
  function branchStops(
    chain: IAutoMovieHingedChainGeometry,
    source?: hingedArmSpan.ISpan,
    preparedDistance?: number,
  ): IAutoMovieHingedArmSwivel.IStop[] | null {
    const root: IAutoMovieVector3 = chain.upper.worldPosition;
    const valid: boolean =
      source?.valid ??
      !(
        Vector3.length(chain.midOffset) < 1e-6 ||
        Vector3.length(chain.endOffset) < 1e-6
      );
    if (!valid) return null;
    const distance: number =
      preparedDistance ?? Vector3.length(Vector3.subtract(chain.target, root));
    if (distance < 1e-6) return null;
    const fixed: IGeometry | null =
      source?.geometry === undefined
        ? hingedArmSpan.of(chain)
        : source.geometry;
    if (fixed === null) return null;
    const { k, alpha, beta, span, phase }: IGeometry = fixed;
    const ratio: number = (distance * distance - k) / span;
    const squared: (theta: number) => number = (theta: number): number =>
      k + alpha * Math.cos(theta) + beta * Math.sin(theta);

    // The extended branch is the rest angle wherever its computed span is the
    // maximum's: the hinge angles between them are equal maxima, and the
    // least articulation among them is the rest.
    const extended: number = squared(0) === squared(phase) ? 0 : phase;
    const thetas: number[] =
      ratio >= 1
        ? [extended]
        : ratio <= -1
          ? [phase + Math.PI]
          : [phase + Math.acos(ratio), phase - Math.acos(ratio)];
    const outside: boolean = ratio >= 1 || ratio <= -1;
    const short: (theta: number) => number = (theta: number): number =>
      Math.abs(Math.sqrt(Math.max(0, squared(theta))) - distance);
    const range: IAutoMovieHingedChainGeometry["range"] = chain.range;
    return thetas.map((theta: number): IAutoMovieHingedArmSwivel.IStop => {
      if (range === undefined)
        return { theta, shortfall: outside ? short(theta) : 0 };
      const centre: number = (range.min + range.max) / 2;
      const wrapped: number =
        theta - 2 * Math.PI * Math.round((theta - centre) / (2 * Math.PI));
      const legal: number = Math.min(range.max, Math.max(range.min, wrapped));
      return {
        theta: legal,
        shortfall: legal === wrapped && !outside ? 0 : short(legal),
      };
    });
  }

  /** Degrees per radian. */
  const RAD2DEG: number = 180 / Math.PI;
}
