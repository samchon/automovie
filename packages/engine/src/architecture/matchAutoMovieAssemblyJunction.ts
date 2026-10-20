import { IAutoMovieAssemblyBreak } from "./IAutoMovieAssemblyBreak";
import { IAutoMovieAssemblyContinuity } from "./IAutoMovieAssemblyContinuity";
import { IAutoMovieAssemblyJunction } from "./IAutoMovieAssemblyJunction";
import { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";

/**
 * The hull and summed thickness of layers sharing one role.
 */
interface IRoleSpan {
  /** Least signed layer endpoint. */
  min: number;

  /** Greatest signed layer endpoint. */
  max: number;

  /** Sum of matching layer thicknesses. */
  thickness: number;
}

/**
 * Report which construction roles survive a junction between two build-ups.
 *
 * Two walls meeting at a corner are two build-ups on one measuring line, and
 * the question a junction asks is not whether they look alike but whether each
 * role reaches across. A role both sides declare is continuous, and the signed
 * spans say whether it actually lines up or merely exists on both sides: an
 * insulation layer that ends where the next one begins is a thermal bridge, and
 * a barrier that stops at a corner is a leak.
 *
 * Roles are matched as declared: the caller decides what a role name means, and
 * a build-up that spends the same role over several layers has those layers
 * summed and spanned together rather than silently reduced to the first one.
 *
 * Spans are compared as numbers on one measuring line, so both build-ups must
 * have been resolved against the same axis and origin; nothing here checks
 * that, because a resolved assembly's axis is host-local and cannot prove two
 * hosts share a line. `overlap` is negative when the spans are apart, and a
 * role is `aligned` when the gap is no larger than `tolerance`. Continuous
 * roles follow the left side's first-appearance order; broken roles list the
 * left side's first, then the right side's. A negative or non-finite tolerance
 * throws an `Error`.
 *
 * @param props.left Build-up on one side of the junction, resolved on the shared line.
 * @param props.right Build-up on the other side, resolved on the same line as `left`.
 * @param props.tolerance Greatest metre gap between two spans still counted as aligned.
 * @returns The continuous roles with their spans and overlap, and the roles only one side carries.
 *
 * @evidence contracts/common.md#principled-implementation Each side's layers are folded into one interval hull and summed thickness per exact role name, and two hulls' signed overlap is `min(max) - max(min)`, which is negative exactly when the intervals are apart; alignment compares that gap with the tolerance. The shared-line premise is the caller's and the documentation says it is not checked.
 * @evidence contracts/common.md#clear-and-simple-design One fold per side into a role map and one pass over each map, with the junction verdict computed from those spans alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no role and gives no role special meaning; an invalid tolerance is refused rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation States what continuity and alignment mean, how repeated roles fold, the unchecked shared-line premise and why it cannot be checked, the sign of `overlap`, the output orders, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the two sides' layer counts, with one map lookup per layer and per role.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure comparison of two resolved values that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the two role maps only for the call; the caller owns the returned junction.
 */
export const matchAutoMovieAssemblyJunction: (props: {
  left: IAutoMovieResolvedAssembly;
  right: IAutoMovieResolvedAssembly;
  tolerance: number;
}) => IAutoMovieAssemblyJunction = (props: {
  /** Build-up on one side of the junction, resolved on the shared line. */
  left: IAutoMovieResolvedAssembly;

  /** Build-up on the other side, resolved on the same line as `left`. */
  right: IAutoMovieResolvedAssembly;

  /** Greatest metre gap between two spans still counted as aligned. */
  tolerance: number;
}): IAutoMovieAssemblyJunction => {
  if (!Number.isFinite(props.tolerance) || props.tolerance < 0)
    throw new Error("junction tolerance must be a finite number >= 0");
  const left: Map<string, IRoleSpan> = rolesOf(props.left);
  const right: Map<string, IRoleSpan> = rolesOf(props.right);
  const continuous: IAutoMovieAssemblyContinuity[] = [];
  const broken: IAutoMovieAssemblyBreak[] = [];
  for (const [role, span] of left) {
    const other: IRoleSpan | undefined = right.get(role);
    if (other === undefined) {
      broken.push({ role, side: "left", thickness: span.thickness });
      continue;
    }
    const overlap: number =
      Math.min(span.max, other.max) - Math.max(span.min, other.min);
    continuous.push({
      role,
      left: { min: span.min, max: span.max },
      right: { min: other.min, max: other.max },
      overlap,
      aligned: overlap >= -props.tolerance,
    });
  }
  for (const [role, span] of right)
    if (!left.has(role))
      broken.push({ role, side: "right", thickness: span.thickness });
  return { continuous, broken };
};

/** Fold one build-up's layers into one span per role, in first-seen order. */
const rolesOf: (
  assembly: IAutoMovieResolvedAssembly,
) => Map<string, IRoleSpan> = (
  assembly: IAutoMovieResolvedAssembly,
): Map<string, IRoleSpan> => {
  const roles: Map<string, IRoleSpan> = new Map();
  for (const layer of assembly.layers) {
    const min: number = Math.min(layer.start, layer.end);
    const max: number = Math.max(layer.start, layer.end);
    const previous: IRoleSpan | undefined = roles.get(layer.role);
    if (previous === undefined)
      roles.set(layer.role, { min, max, thickness: layer.thickness });
    else
      roles.set(layer.role, {
        min: Math.min(previous.min, min),
        max: Math.max(previous.max, max),
        thickness: previous.thickness + layer.thickness,
      });
  }
  return roles;
};
