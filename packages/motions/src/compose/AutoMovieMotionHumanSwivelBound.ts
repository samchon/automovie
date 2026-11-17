import { Vector3, hingedArmSwivel, swivelArcs } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSwivelBound,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual limb-free canonical solve keeps direct joint admission and only proven requested-goal selection, followed by shoulder/elbow/wrist FK ancestry/output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One explicit local reader shares exact canonical/FK prerequisites; the posture and FK numerical owners retain every required actual operation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The three-name demand, pose/map and local lazy reader end on return/throw; only original shoulder/length values escape.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanSwivelBound.IArm {
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`, `${side}LowerArm`, `${side}Hand`,
    ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture.seeded(body, { ...posture, limbs: {} }, undefined, undefined,
        resolution, requested).pose,
      resolution(),
      requested,
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
   * Whether an arm can place its wrist with the elbow inside half-plane
   * bounds: the wrist within the arm's reach, and some swivel on the circle
   * it leaves the elbow outside every bound's refused arc. An exact
   * necessary condition of any fit that reaches the wrist with its elbow in
   * the bounds, so a search may drop a candidate it refuses before fitting.
   *
   * @param of The arm.
   * @param point The wrist's place, world metres.
   * @param bounds The half-planes.
   * @returns Whether a reaching elbow in the bounds exists.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two conditions and what a search may conclude.
   * @evidence contracts/development/implementation.md#principled-implementation The same circle and exact refused arcs as `bounded` (`swivelArcs`): the union covering every swivel, or no circle at all, leaves no reaching elbow in the bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reach, the circle, one sinusoid per bound, their union.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact roots; the reach is `bounded`'s, a wrist on its edge or beyond leaving no circle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per bound, no fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The circle and the sinusoid arcs `bounded` builds, through the engine's fit, arcs and union (`swivelArcs`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function admits(
    of: IAutoMovieMotionHumanSwivelBound.IArm,
    point: IAutoMovieVector3,
    bounds: readonly IAutoMovieMotionHumanSwivelBound.IHalfPlane[],
  ): boolean {
    const { shoulder, upper, lower } = of;
    const reach: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
    const distance: number = Vector3.length(reach);
    if (!(distance > 1e-9) || distance >= upper + lower || distance <= Math.abs(upper - lower))
      return false;
    const line: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
    const foot: number = (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const radius: number = Math.sqrt(Math.max(0, upper * upper - foot * foot));

    // Any direction across the line serves as the swivel's zero: the union
    // covering every swivel does not depend on where the turn starts.
    const across: IAutoMovieVector3 = Vector3.cross(line,
      Math.abs(line.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 });
    const u: IAutoMovieVector3 = Vector3.normalize(across);
    const v: IAutoMovieVector3 = Vector3.cross(line, u);
    const at: (swivel: number) => IAutoMovieVector3 = (swivel: number): IAutoMovieVector3 => {
      const r: number = (swivel * Math.PI) / 180;
      return Vector3.add(Vector3.scale(line, foot),
        Vector3.scale(Vector3.add(Vector3.scale(u, Math.cos(r)), Vector3.scale(v, Math.sin(r))), radius));
    };
    const refused: IAutoMovieSwivelArcs.IArc[] = [];
    for (const bound of bounds) {
      const past: (elbow: IAutoMovieVector3) => number = (elbow: IAutoMovieVector3): number =>
        -(Vector3.dot(bound.normal, Vector3.subtract(elbow, Vector3.subtract(bound.point, shoulder))) - bound.margin);
      const arc: IAutoMovieSwivelArcs.IArc | "all" | null = swivelArcs.above(
        swivelArcs.fitted(past(at(0)), past(at(90)), past(at(180))), 0);
      if (arc === "all") return false;
      if (arc !== null) refused.push(arc);
    }
    return swivelArcs.union(refused) !== "all";
  }

  /**
   * An elbow hint kept inside half-plane bounds: the hint itself when its
   * swivel meets them all, else the place on its circle at the nearest
   * swivel that does, stood the swivel's resolution
   * (`hingedArmSwivel.RESOLUTION`) inside that end. The hint is kept when no
   * swivel meets them all, or the wrist leaves no circle.
   *
   * @param of The arm.
   * @param point The wrist's place, world metres.
   * @param hint The elbow's hint, world metres.
   * @param bounds The half-planes.
   * @returns The hint, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the choice, the step inside and the cases that keep the hint.
   * @evidence contracts/development/implementation.md#principled-implementation Each bound is an exact sinusoid of the swivel, its refused arc between its roots; the nearest swivel outside their union is the least move that meets them all. That end lies on a bound, and a fit keeps a hint's swivel only to its own resolution, so a hint at the end left the fitted elbow on either side of the bound (a drink refused at a flexion of 67.50 against at most 67.5); the hint stands that resolution inside, unless that enters another refused arc.
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
    const merged: IAutoMovieSwivelArcs.IArc[] | "all" = swivelArcs.union(refused);
    const end: number | null = swivelArcs.nearest(merged, 0);
    if (end === null || end === 0) return hint;

    // The nearest end lies on a bound, where a fit that keeps the hint's
    // swivel to its own resolution (`hingedArmSwivel.RESOLUTION`) lands on
    // either side of it; the hint stands that resolution inside, away from
    // the refused arc, unless that enters another.
    const inside: number =
      end + Math.sign(end) * hingedArmSwivel.RESOLUTION;
    const swivel: number = swivelArcs.covers(merged, inside, inside)
      ? end
      : inside;
    return Vector3.add(shoulder, offset(swivel));
  }

}
