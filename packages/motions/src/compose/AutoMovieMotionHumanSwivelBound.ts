import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSwivelBound, IAutoMovieResolvedBone, IAutoMovieSwivelArcs, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3, swivelArcs } from "@automovie/engine";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Half-plane bounds on an elbow's place, solved in closed form on the
 * circle a wrist's place leaves the elbow (the swivel of Tolani, Goswami and
 * Badler 2000). The elbow on the circle is `C + ρ(u cos ψ + v sin ψ)`, so its
 * signed distance past any plane is one sinusoid of the swivel, refused on
 * the arc between its roots (`swivelArcs`); a hint is kept when its swivel
 * meets every bound, else moved to the nearest swivel that does. The
 * drinking range is four such bounds
 * (`AutoMovieMotionHumanDrinkingSwivel`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the circle, why each bound is a sinusoid, the choice and who reads it.
 * @evidence contracts/development/design.md#principled-representation A bound is a half-plane, its normal, a point on it and a margin; an arm is its shoulder and its two lengths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records, the arm on a posture and the bounded hint: what every closed-form bound on an elbow shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The arcs are the engine's; nothing is sampled.
 */
export namespace AutoMovieMotionHumanSwivelBound {

  /**
   * An arm on a posture's trunk, the limbs left unfitted.
   *
   * @param body The body.
   * @param posture The posture.
   * @param side The arm.
   * @returns The arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and on what.
   * @evidence contracts/development/implementation.md#principled-implementation The posed trunk carries the shoulder; the lengths are the rig's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture solve and three reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the posture resolver and `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: IAutoMovieMotionHumanHand.Side,
  ): IAutoMovieMotionHumanSwivelBound.IArm {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = trunk(
      body,
      posture,
    );
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)!.worldPosition;
    return {
      shoulder: at(`${side}UpperArm`),
      upper: Vector3.length(
        Vector3.subtract(at(`${side}LowerArm`), at(`${side}UpperArm`)),
      ),
      lower: Vector3.length(
        Vector3.subtract(at(`${side}Hand`), at(`${side}LowerArm`)),
      ),
    };
  }

  /**
   * An elbow hint kept inside half-plane bounds: the hint itself when its
   * swivel meets them all, else the place on its circle at the nearest
   * swivel that does. The hint is kept when no swivel meets them all, or the
   * wrist leaves no circle.
   *
   * @param of The arm.
   * @param point The wrist's place, world metres.
   * @param hint The elbow's hint, world metres.
   * @param bounds The half-planes.
   * @returns The hint, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the choice and the cases that keep the hint.
   * @evidence contracts/development/implementation.md#principled-implementation Each bound is an exact sinusoid of the swivel, its refused arc between its roots; the nearest swivel outside their union is the least move that meets them all.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The circle, one sinusoid per bound, their union and its nearest swivel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sweep and no sampling beyond the exact three-point fit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's fit, arcs and union (`swivelArcs`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function bounded(
    of: IAutoMovieMotionHumanSwivelBound.IArm,
    point: IAutoMovieVector3,
    hint: IAutoMovieVector3,
    bounds: readonly IAutoMovieMotionHumanSwivelBound.IHalfPlane[],
  ): IAutoMovieVector3 {
    const { shoulder, upper, lower } = of;
    const reach: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
    const distance: number = Vector3.length(reach);
    if (
      !(distance > 1e-9) ||
      distance >= upper + lower ||
      distance <= Math.abs(upper - lower)
    )
      return hint;
    const line: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
    const foot: number =
      (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const radius: number = Math.sqrt(Math.max(0, upper * upper - foot * foot));
    const radial: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(hint, shoulder),
      Vector3.scale(line, Vector3.dot(Vector3.subtract(hint, shoulder), line)),
    );
    if (!(Vector3.length(radial) > 1e-9)) return hint;
    const u: IAutoMovieVector3 = Vector3.normalize(radial);
    const v: IAutoMovieVector3 = Vector3.cross(line, u);
    // The elbow from the shoulder at a swivel from the hint's, degrees.
    const offset = (swivel: number): IAutoMovieVector3 => {
      const r: number = (swivel * Math.PI) / 180;
      return Vector3.add(
        Vector3.scale(line, foot),
        Vector3.scale(
          Vector3.add(
            Vector3.scale(u, Math.cos(r)),
            Vector3.scale(v, Math.sin(r)),
          ),
          radius,
        ),
      );
    };
    const [zero, quarter, half] = [0, 90, 180].map(offset) as [
      IAutoMovieVector3,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ];
    // How far past a bound an elbow lies, from its offset from the
    // shoulder, refused where positive.
    const past = (bound: IAutoMovieMotionHumanSwivelBound.IHalfPlane, at: IAutoMovieVector3): number =>
      -(
        Vector3.dot(
          bound.normal,
          Vector3.subtract(at, Vector3.subtract(bound.point, shoulder)),
        ) - bound.margin
      );
    const refused: IAutoMovieSwivelArcs.IArc[] = [];
    for (const bound of bounds) {
      const arc: IAutoMovieSwivelArcs.IArc | "all" | null = swivelArcs.above(
        swivelArcs.fitted(
          past(bound, zero),
          past(bound, quarter),
          past(bound, half),
        ),
        0,
      );
      if (arc === "all") return hint;
      if (arc !== null) refused.push(arc);
    }
    const swivel: number | null = swivelArcs.nearest(
      swivelArcs.union(refused),
      0,
    );
    return swivel === null || swivel === 0
      ? hint
      : Vector3.add(shoulder, offset(swivel));
  }

  /** The posture's bones with no limb fitted. */
  const trunk = (
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, { ...posture, limbs: {} }));
}
