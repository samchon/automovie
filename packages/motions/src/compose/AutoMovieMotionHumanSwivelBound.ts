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

import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";

/** The alternatives of `BoundedMerged`'s site. */
type BoundedMerged = IAutoMovieSwivelArcs.IArc[] | "all";

/** The alternatives of `BoundedArc`'s site. */
type BoundedArc = IAutoMovieSwivelArcs.IArc | "all" | null;

/** The alternatives of `AdmitsArc`'s site. */
type AdmitsArc = IAutoMovieSwivelArcs.IArc | "all" | null;

/**
 * Half-plane bounds on an elbow's place, solved in closed form on the circle a
 * wrist's place leaves the elbow (the swivel of Tolani, Goswami and Badler
 * 2000). The elbow on the circle is `C + ρ(u cos ψ + v sin ψ)`, so its signed
 * distance past any plane is one sinusoid of the swivel, refused on the arc
 * between its roots (`swivelArcs`); a hint is kept when its swivel meets every
 * bound, else moved to the nearest swivel that does. The drinking range is four
 * such bounds (`AutoMovieMotionHumanDrinkingSwivel`).
 */
export namespace AutoMovieMotionHumanSwivelBound {
  /**
   * An arm on a posture's trunk, the limbs left unfitted.
   *
   * @param body The body.
   * @param posture The posture.
   * @param side The arm.
   * @returns The arm.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanSwivelBound.IArm {
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        `${side}UpperArm`,
        `${side}LowerArm`,
        `${side}Hand`,
      ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        { ...posture, limbs: {} },
        undefined,
        undefined,
        resolution,
        requested,
      ).pose,
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
   * Whether an arm can place its wrist with the elbow inside half-plane bounds:
   * the wrist within the arm's reach, and some swivel on the circle it leaves
   * the elbow outside every bound's refused arc. An exact necessary condition
   * of any fit that reaches the wrist with its elbow in the bounds, so a search
   * may drop a candidate it refuses before fitting.
   *
   * @param of The arm.
   * @param point The wrist's place, world metres.
   * @param bounds The half-planes.
   * @returns Whether a reaching elbow in the bounds exists.
   */
  export function admits(
    of: IAutoMovieMotionHumanSwivelBound.IArm,
    point: IAutoMovieVector3,
    bounds: readonly IAutoMovieMotionHumanSwivelBound.IHalfPlane[],
  ): boolean {
    const { shoulder, upper, lower } = of;
    const reach: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
    const distance: number = Vector3.length(reach);
    if (
      !(distance > 1e-9) ||
      distance >= upper + lower ||
      distance <= Math.abs(upper - lower)
    )
      return false;
    const line: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
    const foot: number =
      (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const radius: number = Math.sqrt(Math.max(0, upper * upper - foot * foot));

    // Any direction across the line serves as the swivel's zero: the union
    // covering every swivel does not depend on where the turn starts.
    const across: IAutoMovieVector3 = Vector3.cross(
      line,
      Math.abs(line.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 },
    );
    const u: IAutoMovieVector3 = Vector3.normalize(across);
    const v: IAutoMovieVector3 = Vector3.cross(line, u);
    const at: (swivel: number) => IAutoMovieVector3 = (
      swivel: number,
    ): IAutoMovieVector3 => {
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
    const refused: IAutoMovieSwivelArcs.IArc[] = [];
    for (const bound of bounds) {
      const past: (elbow: IAutoMovieVector3) => number = (
        elbow: IAutoMovieVector3,
      ): number =>
        -(
          Vector3.dot(
            bound.normal,
            Vector3.subtract(elbow, Vector3.subtract(bound.point, shoulder)),
          ) - bound.margin
        );
      const arc: AdmitsArc = swivelArcs.above(
        swivelArcs.fitted(past(at(0)), past(at(90)), past(at(180))),
        0,
      );
      if (arc === "all") return false;
      if (arc !== null) refused.push(arc);
    }
    return swivelArcs.union(refused) !== "all";
  }

  /**
   * An elbow hint kept inside half-plane bounds: the hint itself when its
   * swivel meets them all, else the place on its circle at the nearest swivel
   * that does, stood the swivel's resolution (`hingedArmSwivel.RESOLUTION`)
   * inside that end. The hint is kept when no swivel meets them all, or the
   * wrist leaves no circle.
   *
   * @param of The arm.
   * @param point The wrist's place, world metres.
   * @param hint The elbow's hint, world metres.
   * @param bounds The half-planes.
   * @returns The hint, world metres.
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
    const past = (
      bound: IAutoMovieMotionHumanSwivelBound.IHalfPlane,
      at: IAutoMovieVector3,
    ): number =>
      -(
        Vector3.dot(
          bound.normal,
          Vector3.subtract(at, Vector3.subtract(bound.point, shoulder)),
        ) - bound.margin
      );
    const refused: IAutoMovieSwivelArcs.IArc[] = [];
    for (const bound of bounds) {
      const arc: BoundedArc = swivelArcs.above(
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
    const merged: BoundedMerged = swivelArcs.union(refused);
    const end: number | null = swivelArcs.nearest(merged, 0);
    if (end === null || end === 0) return hint;

    // The nearest end lies on a bound, where a fit that keeps the hint's
    // swivel to its own resolution (`hingedArmSwivel.RESOLUTION`) lands on
    // either side of it; the hint stands that resolution inside, away from
    // the refused arc, unless that enters another.
    const inside: number = end + Math.sign(end) * hingedArmSwivel.RESOLUTION;
    const swivel: number = swivelArcs.covers(merged, inside, inside)
      ? end
      : inside;
    return Vector3.add(shoulder, offset(swivel));
  }
}
