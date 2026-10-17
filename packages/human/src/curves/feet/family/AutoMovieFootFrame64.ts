import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";
import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/** Resolve a proper bone-local gauge and actual cardinal cut center before generation. */
export namespace AutoMovieFootFrame64 {
  /**
   * Resolve the actual cut centre in the declared bone-local gauge, then apply placement.
   * Outer/inner poles determine X and front/back poles determine Z; the cut need not
   * equal the joint origin. Checks proper parent/placement bases, coplanar poles and
   * alignment of the proximal ankle axis. Only the final anatomical X receives chirality.
   * Failures throw before a frame is returned; no world-space correction is applied later.
   */
  export function construct(
    context: AutoMovieCurveParentContext,
    binding: D.Binding,
    input: D.Side,
    ankle: C.Boundary,
  ): M.Frame {
    const gauge: M.Frame = {
      origin: context.point(binding.bone, binding.ankleChart.originMm),
      basis: binding.ankleChart.axes.map(
        (axis: C.Vector): C.Vector => context.direction(binding.bone, axis),
      ) as unknown as C.Matrix,
    };
    const poles: C.Vector[] = ankle.section.spans.map(
      (s: C.Span): C.Vector => M.local(gauge, s[0]),
    );
    const cutCenter: C.Vector = [
      (poles[0]![0] + poles[2]![0]) / 2,
      poles[0]![1],
      (poles[1]![2] + poles[3]![2]) / 2,
    ];
    const parent: M.Frame = {
      origin: M.world(gauge, cutCenter),
      basis: gauge.basis,
    };
    const checkProper: (basis: C.Matrix) => void = (basis: C.Matrix): void => {
      const cross: C.Vector = [
        basis[0][1] * basis[1][2] - basis[0][2] * basis[1][1],
        basis[0][2] * basis[1][0] - basis[0][0] * basis[1][2],
        basis[0][0] * basis[1][1] - basis[0][1] * basis[1][0],
      ];
      if (
        basis.flat().some((v: number): boolean => !Number.isFinite(v)) ||
        Math.abs(M.dot(cross, basis[2]) - 1) > 1e-8 ||
        basis.some(
          (axis: C.Vector): boolean => Math.abs(M.norm(axis) - 1) > 1e-8,
        ) ||
        Math.abs(M.dot(basis[0], basis[1])) > 1e-8 ||
        Math.abs(M.dot(basis[1], basis[2])) > 1e-8 ||
        Math.abs(M.dot(basis[0], basis[2])) > 1e-8
      )
        throw new Error("Proper orthonormal semantic gauge required");
    };
    const placement: D.Placement = input.placement;
    const properLocal: C.Matrix = [
      placement.basisX_parent,
      placement.basisY_parent,
      placement.basisZ_parent,
    ];
    checkProper(parent.basis);
    checkProper(properLocal);
    if (placement.localChirality !== 1 && placement.localChirality !== -1)
      throw new Error("Explicit anatomical chart chirality required");
    if (M.norm(M.sub(ankle.longitudinalAxis, parent.basis[1])) > 1e-8)
      throw new Error(
        "Ankle longitudinal axis must match declared transported gauge +Y",
      );
    if (
      poles.some((p: C.Vector): boolean => Math.abs(p[1] - cutCenter[1]) > 1e-7)
    )
      throw new Error(
        "Upstream ankle poles must share their declared transverse plane",
      );
    const proper: C.Matrix = properLocal.map(
      (axis: C.Vector): C.Vector => M.direction(parent.basis, axis),
    ) as unknown as C.Matrix;
    const frame: M.Frame = {
      origin: M.world(parent, placement.originOffset_parent_mm),
      basis: [M.mul(proper[0], placement.localChirality), proper[1], proper[2]],
    };
    return frame;
  }
}
