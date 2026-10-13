import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieChainBone } from "./IAutoMovieChainBone";
import { IAutoMovieTwoBoneArticulation } from "./IAutoMovieTwoBoneArticulation";
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
 *
 * @evidence contracts/common.md#principled-implementation Places the mid joint by the law-of-cosines lift in a chosen plane, then lowers each world delta into its bone's local frame by conjugation with the rest world rotation; the premises are a resolved chain whose rest frames match the bones' current world frames and unit rotations, and the stated limitation is that without `bendNormal` the plane is a world-down heuristic that suits a knee but not every joint.
 * @evidence contracts/common.md#clear-and-simple-design Pure chain geometry for `solvePreparedChainPlant`, which owns the chain choice, bend-normal search and clinical decomposition; the triangle angles come from the shared `solveTwoBoneIK`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No limb or rig is special-cased; the vertical-axis fallback plane is a stated degeneracy rule, and an unreachable target is extended onto the shell rather than reported as reached.
 * @evidence contracts/common.md#meaningful-documentation States what is measured from the chain, how the bend plane is chosen including both fallbacks, how deltas become bone-local, the unreachable behavior, the free-swing caveat and the hinge alternative, every `null` case with its threshold, and each input's frame.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: a few vector differences, one `solveTwoBoneIK`, two `aimRotation` calls and a handful of quaternion products.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one chain and target that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned rotations.
 * @author Samchon
 */
export const twoBoneChainArticulation = (props: {
  /** Resolved chain-root bone (hip or shoulder) in world space. */
  upper: IAutoMovieChainBone;

  /** Resolved mid bone (knee or elbow) in world space. */
  lower: IAutoMovieChainBone;

  /** World position of the end effector (foot or hand) on the resolved chain. */
  end: IAutoMovieVector3;

  /** World target the end effector should land on. */
  target: IAutoMovieVector3;

  /**
   * World normal of the bend plane, overriding the world-down derivation; any
   * nonzero length. A caller whose mid joint is a hinge passes the hinge axis
   * so the solve stays in the only plane that joint can bend in. Rotation
   * follows the right-hand rule about it, so its two signs are the chain's two
   * bend branches.
   */
  bendNormal?: IAutoMovieVector3;
}): IAutoMovieTwoBoneArticulation | null => {
  const root: IAutoMovieVector3 = props.upper.worldPosition;
  const mid: IAutoMovieVector3 = props.lower.worldPosition;

  const l1: number = Vector3.length(Vector3.subtract(mid, root));
  const l2: number = Vector3.length(Vector3.subtract(props.end, mid));
  if (l1 < 1e-6 || l2 < 1e-6) return null;
  const restUpperDir: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(mid, root),
  );
  const restForeDir: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(props.end, mid),
  );

  const reach: IAutoMovieVector3 = Vector3.subtract(props.target, root);
  const dist: number = Vector3.length(reach);
  if (dist < 1e-6) return null;
  const axis: IAutoMovieVector3 = Vector3.normalize(reach);

  const lift: number = solveTwoBoneIK(l1, l2, dist).lift;

  // Bend plane: the caller's explicit normal when it has one, else normal ⟂
  // (reach axis, world-down pole). The upper segment lifts by `lift` off the
  // axis in this plane, displacing the mid joint toward the pole.
  let normal: IAutoMovieVector3 = props.bendNormal ?? Vector3.cross(axis, POLE);
  if (Vector3.length(normal) < 1e-6)
    normal = Vector3.cross(axis, POLE_FALLBACK);
  normal = Vector3.normalize(normal);

  const upperDir: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle(normal, lift),
    axis,
  );
  const midJoint: IAutoMovieVector3 = Vector3.add(
    root,
    Vector3.scale(upperDir, l1),
  );
  const foreDir: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(props.target, midJoint),
  );

  // Root joint: world delta taking the rest upper dir onto upperDir, lowered
  // into the bone-local articulation (restWorld⁻¹ · Δ · restWorld).
  const rsu: IAutoMovieQuaternion = props.upper.worldRotation;
  const du: IAutoMovieQuaternion = aimRotation(restUpperDir, upperDir);
  const upper: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(rsu),
    Quaternion.multiply(du, rsu),
  );

  // Mid joint: worldRot(L) = du · Rsl · articL, so the fore segment's local
  // axis (Rsl⁻¹ · restForeDir) must rotate onto (Rsl⁻¹ · du⁻¹ · foreDir).
  const rsl: IAutoMovieQuaternion = props.lower.worldRotation;
  const rslInv: IAutoMovieQuaternion = Quaternion.inverse(rsl);
  const localFore: IAutoMovieVector3 = Quaternion.rotateVector(
    rslInv,
    restForeDir,
  );
  const localGoal: IAutoMovieVector3 = Quaternion.rotateVector(
    rslInv,
    Quaternion.rotateVector(Quaternion.inverse(du), foreDir),
  );
  const lower: IAutoMovieQuaternion = aimRotation(localFore, localGoal);

  return { upper, lower };
};
