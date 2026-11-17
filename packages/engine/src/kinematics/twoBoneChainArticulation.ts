import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IAutoMovieTwoBoneArticulation,
  type IAutoMovieTwoBoneChainArticulation,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { aimRotation } from "./aimRotation";
import { solveTwoBoneIK } from "./solveTwoBoneIK";

/** World-down, the direction the default bend displaces the mid joint toward. */
const POLE: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/** Bend-plane axis used when the reach axis is parallel to `POLE`. */
const POLE_FALLBACK: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The bone-local articulation of a resolved two-segment chain that lands its
 * end effector on `target`: the leg plant's solve.
 *
 * Segment lengths and rest directions are measured from the chain's resolved
 * world positions. The upper segment is lifted off the root-to-target axis by
 * {@link solveTwoBoneIK}'s `lift`, turning about the bend-plane normal: the
 * caller's `bendNormal` when given, otherwise `axis × world-down` so the mid
 * joint is displaced toward world-down, or `axis × +Z` when the axis is
 * vertical. The root's world change is lowered to bone-local as
 * `restWorld⁻¹ · Δ · restWorld`, and the mid joint aims the fore segment's
 * bone-local direction at the target. An unreachable target extends or folds
 * the chain toward it, so the effector stops on the reachable shell.
 *
 * The mid rotation is a free swing, so it may carry abduction and twist; a
 * caller whose mid joint is a hinge passes the hinge axis as `bendNormal` to
 * keep the solve in its plane. The arm reach uses
 * {@link hingedArmArticulation} instead, which turns the elbow about its hinge
 * by construction. Which bones form the chain and how the deltas become
 * clinical angles stay with the caller.
 *
 * Returns `null` for a degenerate chain: a segment shorter than `1e-6`, or a
 * target within `1e-6` of the root.
 * Inputs remain unchanged during one call; explicit preparation additionally
 * keeps source frames fixed across targets and a target fixed across normals.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Places the mid joint by the law-of-cosines lift in a chosen plane, then lowers each world delta into its bone's local frame by conjugation with the rest world rotation; the premises are a resolved chain whose rest frames match the bones' current world frames and unit rotations, and the stated limitation is that without `bendNormal` the plane is a world-down heuristic that suits a knee but not every joint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Private source geometry, target geometry and candidate evaluation are the shared owners used by this direct entry and explicit scoped preparation; solvePreparedChainPlant keeps clinical decomposition and solveTwoBoneIK keeps the triangle law.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No limb or rig is special-cased; the vertical-axis fallback plane is a stated degeneracy rule, and an unreachable target is extended onto the shell rather than reported as reached.
 * @evidence contracts/development/common.md#meaningful-documentation States what is measured from the chain, how the bend plane is chosen including both fallbacks, how deltas become bone-local, the unreachable behavior, the free-swing caveat and the hinge alternative, every `null` case with its threshold, and each input's frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant direct work includes the triangle solve, two ordinary aims and quaternion products, with no prepared-aim closures on that one-shot path. Explicit source preparation also shares two unchanged source-direction validations/normalizations across all target/normal candidates, while every actual target direction and shortest arc still runs. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The direct entry derives actual source and target each call. Explicit preparation shares source lengths/rest directions/inverses and aimRotation.prepare's source-only readings across targets, and one target shares its reach triangle across normals. First-use aim admission retains its original stage; every candidate still has fresh upper/lower rotations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Private fixed-size source/target records end with this direct call; only fresh upper/lower quaternions escape, with no input reference or handle retained.
 */
export function twoBoneChainArticulation(
  props: IProps,
): IAutoMovieTwoBoneArticulation | null {
  const source: ISource | null = readSource(props);
  if (source === null) return null;
  const target: ITarget | null = readTarget(source, props);
  return target === null ? null : evaluate(source, target, props.bendNormal);
}

/**
 * Exact source and target geometry shared within one unchanged chain fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates fixed resolved chain geometry, each target's reach triangle and each bend normal's actual articulation, with explicit unchanged-input and release boundaries.
 * @evidence contracts/development/design.md#principled-representation Chain lengths/rest directions depend only on the resolved source, and target axis/lift depend only on that source and target; distinct bend normals share these exact geometric quantities while preserving the original candidate formulas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves prepareChainFit and the bend search through one source reader and one current target reader; no result population, solver policy or arbitrary numerical callback is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source/target degeneracies and scalar admission retain their original stages, fixed frame inverses remain lazy at their original first use, and every solve computes a fresh articulation with unchanged default-plane/sign/fallback rules.
 */
export namespace twoBoneChainArticulation {
  /** Fixed source geometry, valid only while its resolved frames and end point remain unchanged. */
  export interface IPrepared {
    /** Prepare the actual target triangle, or null at the original root-distance gate; release it after that target's bend search. */
    target(point: IAutoMovieVector3): IPreparedTarget | null;
  }

  /** One unchanged target's geometry; no candidate articulation is retained. */
  export interface IPreparedTarget {
    /** Compute this bend normal's actual upper/lower deltas, with fresh quaternion outputs. */
    solve(bendNormal?: IAutoMovieVector3): IAutoMovieTwoBoneArticulation;
  }

  /**
   * Prepare fixed lengths and rest directions at the first actual geometric
   * solve. The source frames/end must stay unchanged until caller release.
   * Each target prepares its own reach axis and law-of-cosines lift; a root
   * target returns null before scalar triangle admission, as in the direct
   * entry. Source frame inverses/local fore direction are lazy at their
   * original first-use sites and shared only after successful computation.
   * All candidate orientations and clinical decomposition remain actual.
   *
   * Preparation and each new target take constant arithmetic and fixed-size
   * records. A target's repeated solves omit only identical completed geometry;
   * every normal still runs the original plane, aim and quaternion formulas.
   * The caller owns one source reader for a chain operation and each target
   * reader for that target's search, releasing both on completion or failure.
   * No target history, candidate result, global cache or callback is retained.
   */
  export function prepare(
    props: Pick<IProps, "upper" | "lower" | "end">,
  ): IPrepared | null {
    const source: ISource | null = readSource(props);
    if (source === null) return null;
    return {
      target: (point: IAutoMovieVector3): IPreparedTarget | null => {
        const target: ITarget | null = readTarget(source, { target: point });
        return target === null
          ? null
          : {
              solve: (
                bendNormal?: IAutoMovieVector3,
              ): IAutoMovieTwoBoneArticulation =>
                evaluate(source, target, bendNormal, true),
            };
      },
    };
  }
}

/** Direct source/target inputs in resolved world coordinates (the interface contract). */
type IProps = IAutoMovieTwoBoneChainArticulation.IProps;

/** One fixed source, with inverses first completed at their original evaluation sites. */
interface ISource {
  /** Original frame owner, retaining each late world-rotation read at its original site. */
  frames: Pick<IProps, "upper" | "lower" | "end">;

  /** Source root point in world metres. */
  root: IAutoMovieVector3;

  /** Actual root-to-mid segment length. */
  l1: number;

  /** Actual mid-to-end segment length. */
  l2: number;

  /** Original normalized upper-segment direction. */
  restUpperDir: IAutoMovieVector3;

  /** Original normalized fore-segment direction. */
  restForeDir: IAutoMovieVector3;

  /** Exact normalized inverse, admitted only after the first upper aim. */
  upperInverse?: IAutoMovieQuaternion;

  /** Exact normalized inverse, admitted at the first lower evaluation. */
  lowerInverse?: IAutoMovieQuaternion;

  /** Fixed fore direction lowered through that same completed inverse. */
  localFore?: IAutoMovieVector3;

  /** Lazy actual aim from the unchanged source upper direction. */
  aimUpper?: ReturnType<typeof aimRotation.prepare>;

  /** Lazy actual aim from the unchanged lowered fore direction. */
  aimLower?: ReturnType<typeof aimRotation.prepare>;
}

/** One fixed target's triangle data, before selecting any bend normal. */
interface ITarget {
  /** Original point owner, retaining the second target read at the candidate's fore-direction stage. */
  goal: Pick<IProps, "target">;

  /** Original normalized source-root-to-target direction. */
  axis: IAutoMovieVector3;

  /** Original solveTwoBoneIK lift, degrees. */
  lift: number;
}

/** Keep length degeneracy before rest directions or any target read, as in the direct solve. */
function readSource(
  props: Pick<IProps, "upper" | "lower" | "end">,
): ISource | null {
  const root: IAutoMovieVector3 = props.upper.worldPosition;
  const mid: IAutoMovieVector3 = props.lower.worldPosition;

  const l1: number = Vector3.distance(mid, root);
  const l2: number = Vector3.distance(props.end, mid);
  if (l1 < 1e-6 || l2 < 1e-6) return null;
  const restUpperDir: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(mid, root),
  );
  const restForeDir: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(props.end, mid),
  );
  return {
    frames: props,
    root,
    l1,
    l2,
    restUpperDir,
    restForeDir,
  };
}

/** Keep root-distance degeneracy before the scalar solver's length/distance validation. */
function readTarget(
  source: ISource,
  goal: Pick<IProps, "target">,
): ITarget | null {
  const reach: IAutoMovieVector3 = Vector3.subtract(goal.target, source.root);
  const dist: number = Vector3.length(reach);
  if (dist < 1e-6) return null;
  const axis: IAutoMovieVector3 = Vector3.normalize(reach);

  const lift: number = solveTwoBoneIK(source.l1, source.l2, dist).lift;
  return { goal, axis, lift };
}

/** Compute one actual candidate using the same original expression grouping and admission order. */
function evaluate(
  source: ISource,
  target: ITarget,
  bendNormal?: IAutoMovieVector3,
  shareAims: boolean = false,
): IAutoMovieTwoBoneArticulation {
  const axis: IAutoMovieVector3 = target.axis;

  // Bend plane: the caller's explicit normal when it has one, else normal ⟂
  // (reach axis, world-down pole). The upper segment lifts by `lift` off the
  // axis in this plane, displacing the mid joint toward the pole.
  let normal: IAutoMovieVector3 = bendNormal ?? Vector3.cross(axis, POLE);
  if (Vector3.length(normal) < 1e-6)
    normal = Vector3.cross(axis, POLE_FALLBACK);
  normal = Vector3.normalize(normal);

  const upperDir: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(normal, target.lift),
    axis,
  );
  const midJoint: IAutoMovieVector3 = Vector3.add(
    source.root,
    Vector3.scale(upperDir, source.l1),
  );
  const foreDir: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(target.goal.target, midJoint),
  );

  // Root joint: world delta taking the rest upper dir onto upperDir, lowered
  // into the bone-local articulation (restWorld⁻¹ · Δ · restWorld).
  const rsu: IAutoMovieQuaternion = source.frames.upper.worldRotation;
  const du: IAutoMovieQuaternion = shareAims
    ? (source.aimUpper ??= aimRotation.prepare(source.restUpperDir))(upperDir)
    : aimRotation(source.restUpperDir, upperDir);
  source.upperInverse ??= Quaternion.inverse(rsu);
  const upper: IAutoMovieQuaternion = Quaternion.multiply(
    source.upperInverse,
    Quaternion.multiply(du, rsu),
  );

  // Mid joint: worldRot(L) = du · Rsl · articL, so the fore segment's local
  // axis (Rsl⁻¹ · restForeDir) must rotate onto (Rsl⁻¹ · du⁻¹ · foreDir).
  const rsl: IAutoMovieQuaternion = source.frames.lower.worldRotation;
  source.lowerInverse ??= Quaternion.inverse(rsl);
  const rslInv: IAutoMovieQuaternion = source.lowerInverse;
  source.localFore ??= Quaternion.rotateVector(rslInv, source.restForeDir);
  const localGoal: IAutoMovieVector3 = Quaternion.rotateVector(
    rslInv,
    Quaternion.rotateVector(Quaternion.inverse(du), foreDir),
  );
  const lower: IAutoMovieQuaternion = shareAims
    ? (source.aimLower ??= aimRotation.prepare(source.localFore))(localGoal)
    : aimRotation(source.localFore, localGoal);

  return { upper, lower };
}
