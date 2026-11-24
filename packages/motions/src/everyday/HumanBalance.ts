import {
  bracketedBisection,
  bracketedRoot,
  convexHull2D,
  pointInHull,
  prepareAutoMovieMassModel,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalanceExtrapolated } from "./HumanBalanceExtrapolated";
import { HumanBalanceReading } from "./HumanBalanceReading";
import { prepareHumanBalanceCentre } from "./prepareHumanBalanceCentre";

/** The record of `IShiftDown`'s site. */
type IShiftDown = { found: boolean; back: number };

/** The record of `IShiftFirstResult`'s site. */
type IShiftFirstResult = { found: boolean; back: number };

/** The record of `IShiftFirst`'s site. */
type IShiftFirst = { found: boolean; back: number };

/**
 * Backward hip travel to support the body's segmental centre (Winter, ch. 4).
 * The closest boundary suffices (Hof et al. 2005). The planted legs may move
 * during fitting, so a rigid correction is checked on the actual pose.
 */
export namespace HumanBalance {
  /**
   * How far back the balance search looks unless told otherwise, hip heights:
   * the shift of a trunk pitched over hips that stand over the feet.
   */
  export const RANGE: number = 0.4;

  /**
   * How far back the balance search looks for a posture whose hips may stand
   * anywhere the planted legs let them, hip heights: a leg's length ahead of
   * the feet, about one hip height, back to a foot's length behind them, about
   * 0.3.
   */
  export const REACH: number = 1.3;

  /**
   * The resolution a balance search solves a shift or a travel to, metres: half
   * a millimetre, under the millimetre the margins are reported in.
   */
  export const TOLERANCE: number = 5e-4;

  /**
   * The hips' backward shift that puts the whole-body centre of mass over the
   * base of support along the heading, the feet where they bear
   * (`HumanFoot.base`): over its middle (`offset`), or a stated distance ahead
   * of it (`target`), as a lean holds the centre where the body stood.
   *
   * Where fitting changes support, a feasible endpoint brackets the first
   * supported shift to `TOLERANCE`. If the heel cannot bear, the forefoot
   * bears, and a missing crossing leaves the nearer endpoint for the audit.
   *
   * @param body The body.
   * @param build The posture for a backward shift of the hips, metres; a
   *   negative shift moves them forward.
   * @param range How far the search looks either way, hip heights; `RANGE` when
   *   absent, and `REACH` for a posture whose hips do not start over the feet.
   * @param target How far ahead of the base's middle the centre is put, metres.
   *   Without a target, first keep a supported posture or try the nearest
   *   boundary.
   * @returns The shift, metres, negative forward; 0 when the centre lies inside
   *   the base no farther ahead than the target without one.
   */
  export function shift(
    body: IAutoMovieMotionHumanBody,
    build: (back: number) => IAutoMovieMotionHumanPosture,
    range: number = RANGE,
    target?: number,
  ): number {
    // Each shift is read once within a call: the searches below revisit
    // their brackets' ends.
    const read0: Map<number, HumanBalanceReading.IReading> = new Map();
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    let frames: ReturnType<typeof poseBones.prepare> | undefined;
    const model: prepareAutoMovieMassModel.IPrepared =
      prepareAutoMovieMassModel(body.massModel);
    const mass: () => prepareAutoMovieMassModel.IPrepared =
      (): prepareAutoMovieMassModel.IPrepared => model;
    const at: (back: number) => HumanBalanceReading.IReading = (
      back: number,
    ): HumanBalanceReading.IReading => {
      let r: HumanBalanceReading.IReading | undefined = read0.get(back);
      if (r === undefined) {
        r = HumanBalanceReading.read(
          body,
          build(back),
          resolution,
          projection,
          frames,
          mass,
          back === 0 && target === undefined,
        );
        if (frames === undefined)
          frames = poseBones.prepare(
            body,
            new Set([...HumanColliders.bones(body), ...HumanFoot.bones(body)]),
          );
        read0.set(back, r);
      }
      return r;
    };
    try {
      const start: HumanBalanceReading.IReading = at(0);
      const span: number = range * body.measure.hipHeight;
      if (target === undefined && start.margin >= 0) return 0;
      const nearest: (back: number) => number = (back: number): number => {
        if (target !== undefined || at(back).margin <= 0) return back;
        let supported: number = back;
        bracketedBisection(
          (current: number): boolean => {
            if (at(current).margin < 0) return true;
            supported = current;
            return false;
          },
          0,
          back,
          TOLERANCE,
        );
        return supported;
      };
      if (start.candidate !== undefined && Math.abs(start.candidate) <= span) {
        const landed: HumanBalanceReading.IReading = at(start.candidate);
        if (landed.margin >= 0 && landed.flat === start.flat)
          return nearest(start.candidate);
      }
      // The shift from `from` the given way, within the range, at which
      // `error` is no longer positive: the bracket is the range's two ends,
      // and the crossing in it is refined to the tolerance, by the engine's
      // bracketed root for a continuous error (`bracketedRoot`, the Illinois
      // false position of Dowell and Jarratt 1971, superlinear and never
      // leaving the bracket, so a stretch where the error stops responding,
      // the planted legs at their range, costs steps and no divergence) and by
      // the engine's bisection (`bracketedBisection`) for a yes-or-no one. With no crossing in the range, the end
      // that comes nearer is returned.
      const first: (
        from: number,
        sign: number,
        error: (r: HumanBalanceReading.IReading) => number,
        smooth: boolean,
      ) => IShiftFirst = (
        from: number,
        sign: number,
        error: (r: HumanBalanceReading.IReading) => number,
        smooth: boolean,
      ): IShiftFirstResult => {
        const near: number = error(at(from));
        if (near <= 0) return { found: true, back: from };
        const end: number = from + sign * span;
        const far: number = error(at(end));
        if (far > 0) return { found: false, back: far < near ? end : from };
        return {
          found: true,
          back: smooth
            ? bracketedRoot(
                (b: number): number => error(at(b)),
                from,
                end,
                TOLERANCE,
              )
            : bracketedBisection(
                (b: number): boolean => error(at(b)) > 0,
                from,
                end,
                TOLERANCE,
              ),
        };
      };
      const ahead: (r: HumanBalanceReading.IReading) => number = (
        r: HumanBalanceReading.IReading,
      ): number => r.offset - (target ?? 0);
      // Flat feet first: a heel the planted leg lifted is brought down by
      // moving the hips back; on flat feet a centre ahead of the target is
      // brought back to it, and one behind it is left while it lies inside.
      const down: IShiftDown = first(
        0,
        1,
        (r: HumanBalanceReading.IReading): number => (r.flat ? 0 : 1),
        false,
      );
      if (down.found) {
        const landed: HumanBalanceReading.IReading = at(down.back);
        if (ahead(landed) > 0)
          return nearest(first(down.back, 1, ahead, true).back);
        if (landed.margin > 0) return nearest(down.back);
      }
      // Otherwise the forefoot: the centre brought over its middle, back when
      // ahead of it, forward when outside behind it.
      if (ahead(start) > 0) return nearest(first(0, 1, ahead, true).back);
      if (start.margin > 0) return 0;
      return nearest(
        first(
          0,
          -1,
          (r: HumanBalanceReading.IReading): number => -ahead(r),
          true,
        ).back,
      );
    } finally {
      if (model !== undefined) prepareAutoMovieMassModel.release(model);
    }
  }

  /**
   * The static margin of stability of a posture: the horizontal distance from
   * the engine's whole-body centre of mass to the edge of the hull of base of
   * support, the feet's outlines where they bear (`HumanFoot.base`) (Hof et al.
   * 2005, with zero velocity), positive inside.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres.
   */
  export function margin(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): number {
    const placed: HumanBalanceReading.IPlaced = HumanBalanceReading.placement(
      body,
      posture,
    );
    return resolveAutoMovieCenterOfMass.margin(placed.centre, placed.base);
  }

  /**
   * Whole-body mass centre of the actual solved posture, without foot-support
   * geometry for callers that only need the centre's position.
   *
   * @param body The unchanged body owning its prepared classic mass model.
   * @param posture The actual posture with every limb and digit goal retained.
   * @param resolution Optional exact FK workspace or lazy supplier borrowed
   *   from the same synchronous body operation.
   * @param projection Optional genuine same-body ROM projector borrowed only
   *   from that synchronous operation; unissued functions keep ordinary
   *   admission.
   * @param resolved The cold resolve of this very posture when its caller
   *   already holds it, read in place of solving the posture here.
   * @returns The whole-body centre, world metres.
   */
  export function centre(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    resolved?: ReturnType<typeof resolveHumanPosture>,
  ): IAutoMovieVector3 {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    return resolveAutoMovieCenterOfMass.place(
      body.massModel,
      body.colliderBones.map(
        resolved ??
          resolveHumanPosture.seeded(
            body,
            posture,
            undefined,
            {},
            read,
            undefined,
            projection,
          ).pose,
        read(),
      ),
    );
  }

  /**
   * Fixed-body centre observations owned by prepareHumanBalanceCentre. Its
   * actual profile-name producer prepares only immutable FK demand; each reader
   * call keeps complete fitting, current mass placement and optional
   * same-operation FK/ROM borrowing. Release it with the owning action.
   */
  export const prepareCentre: typeof prepareHumanBalanceCentre =
    prepareHumanBalanceCentre;

  /**
   * The dynamic margin of stability at an instant of a movement (Hof, Gazendam
   * and Sinke 2005): the engine's whole-body centre of mass plus its velocity
   * (a central difference over 1/240 s) over the inverted pendulum's
   * eigenfrequency `sqrt(g / l)` with `l` 1.34 hip heights (Hof's leg length),
   * measured to the edge of the feet's base, positive inside.
   *
   * @param body The body.
   * @param at The movement's posture at a second.
   * @param seconds The instant.
   * @returns Metres.
   */
  export function extrapolated(
    body: IAutoMovieMotionHumanBody,
    at: (seconds: number) => IAutoMovieMotionHumanPosture,
    seconds: number,
  ): number {
    return HumanBalanceExtrapolated(body, at, seconds);
  }

  /**
   * Fixed-body dynamic margin reader owned by HumanBalanceExtrapolated.prepare.
   * Every t-h, t+h and t callback/full fit remains actual; current callbacks
   * may synchronously borrow FK/ROM metadata and no sample enters retained
   * state.
   */
  export const prepareExtrapolated: typeof HumanBalanceExtrapolated.prepare =
    HumanBalanceExtrapolated.prepare;

  /**
   * The engine's whole-body centre of mass of a posture and the support points
   * of its feet (the bearing outline of each, `HumanFoot.base`), world metres.
   *
   * @param body The body.
   * @param posture The posture.
   * @param resolution Optional exact FK workspace or lazy supplier borrowed
   *   only from this synchronous same-body operation.
   * @param projection Optional genuine same-body ROM metadata; every current
   *   joint and goal still receives ordinary complete admission.
   * @returns The centre and the support points.
   */
  export function support(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    sides?: readonly AutoMovieHumanSide[],
  ): IAutoMovieMotionHumanBalance.ISupport {
    const placed: HumanBalanceReading.IPlaced = HumanBalanceReading.placement(
      body,
      posture,
      resolution,
      projection,
      undefined,
      undefined,
      sides,
    );
    return {
      centre: placed.centre,
      points: placed.base,
    };
  }

  /**
   * The margin of stability along one horizontal direction: how far a point may
   * move that way before it leaves the convex hull of the support points, the
   * margin against a perturbation pushing it that way (Hof et al. 2005 measure
   * the margin along the perturbation's direction).
   *
   * @param point The point (a centre of mass or its extrapolation), world
   *   metres; its height is ignored.
   * @param points The support points.
   * @param direction The direction, horizontal; normalized here.
   * @returns Metres to the hull's edge along the direction; negative when the
   *   point is outside the hull.
   */
  export function along(
    point: IAutoMovieVector3,
    points: readonly IAutoMovieVector3[],
    direction: IAutoMovieVector3,
  ): number {
    const hull: IAutoMovieVector3[] = convexHull2D(points);
    const d: number = Math.hypot(direction.x, direction.z);
    const dx: number = direction.x / d;
    const dz: number = direction.z / d;
    let exit: number = -Infinity;
    for (let i: number = 0; i < hull.length; i++) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;
      const denominator: number = dx * ez - dz * ex;
      if (Math.abs(denominator) < 1e-12) continue;
      const t: number =
        ((a.x - point.x) * ez - (a.z - point.z) * ex) / denominator;
      const u: number =
        ((a.x - point.x) * dz - (a.z - point.z) * dx) / denominator;
      if (u >= -1e-12 && u <= 1 + 1e-12) exit = Math.max(exit, t);
    }
    if (exit === -Infinity) return -Infinity;
    return hull.length >= 3 && pointInHull(point, hull)
      ? exit
      : -Math.abs(exit);
  }

  /**
   * How far the whole-body centre of mass lies ahead of the middle of the base
   * of support along a posture's heading, metres: the middle between the
   * rearmost and the foremost point of the feet where they bear
   * (`HumanFoot.base`), so a heel lifted off the floor moves the middle forward
   * over the forefoot the body then stands on.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres; positive ahead.
   */
  export function offset(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): number {
    return HumanBalanceReading.projected(
      HumanBalanceReading.placement(body, posture),
      posture.yaw,
    );
  }
}
