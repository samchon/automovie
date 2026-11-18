import {
  Quaternion,
  Vector3,
  bracketedBisection,
  bracketedRoot,
  convexHull2D,
  pointInHull,
  prepareAutoMovieMassModel,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
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
import { prepareHumanBalanceCentre } from "./prepareHumanBalanceCentre";

/**
 * How far the hips move back so the whole-body centre of mass stands over
 * the feet, found on the solved posture itself.
 *
 * A law that pitches the trunk forward over planted feet (a bow, a stoop)
 * builds its posture as a function of the hips' backward shift; this finds
 * the shift at which the engine's whole-body centre of mass
 * (`resolveAutoMovieCenterOfMass.place`, the segmental method of Winter,
 * Biomechanics and Motor Control of Human Movement, ch. 4) lies over the
 * middle of the base of support along the heading, the feet where they bear
 * (`HumanFoot.base`), the static balance condition. The posture is solved
 * (legs on their planted goals, arms on theirs) and the centre placed from the solved bones at each trial of a
 * scan and bisection over the shift. A bow solves it once per plan at its
 * deepest pitch and scales the shift with the sine of the pitch in between,
 * which is exact for a rigid upper body and leaves only the legs'
 * reconfiguration unmodelled at intermediate pitches; a lean into work,
 * whose reaching arm is no rigid part of the trunk, solves it at steps of
 * the pitch (`AutoMovieMotionHumanLeanInto`). Their captures check
 * the margin of stability (Hof et al. 2005) on every frame they draw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, the engine owner, the iteration and how laws use the result.
 * @evidence contracts/development/design.md#principled-representation Pure balance functions and explicit fixed-body centre/dynamic readers return world-metre shifts/margins/offsets and points. The unchanged body owns its engine mass model, while operation-scoped genuine FK/ROM producers share only static or exact checked dependencies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the motions balance queries over solved postures; read by the bow, bend, brace and rise laws, the everyday captures and the balance test; the centre-of-mass model, hull and margin belong to the engine and are imported.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No motions-local centre of mass or hull duplicates the engine's and no body or law is special-cased; `margin` serves the trunk's counterbalance composition (`AutoMovieMotionHumanTrunk`) as well as the balance tests.
 */
export namespace HumanBalance {
  /** How far back the balance search looks unless told otherwise, hip heights: the shift of a trunk pitched over hips that stand over the feet. */
  export const RANGE: number = 0.4;

  /**
   * How far back the balance search looks for a posture whose hips may stand
   * anywhere the planted legs let them, hip heights: a leg's length ahead of
   * the feet, about one hip height, back to a foot's length behind them,
   * about 0.3.
   */
  export const REACH: number = 1.3;

  /** The resolution a balance search solves a shift or a travel to, metres: half a millimetre, under the millimetre the margins are reported in. */
  export const TOLERANCE: number = 5e-4;

  /**
   * The hips' backward shift that puts the whole-body centre of mass over
   * the base of support along the heading, the feet where they bear
   * (`HumanFoot.base`): over its middle (`offset`), or a stated distance
   * ahead of it (`target`), as a lean holds the centre where the body stood.
   *
   * The feet stand flat where they can, the larger base: a heel the planted
   * leg lifted with its ankle at its range is brought down by moving the
   * hips back, and on flat feet a centre ahead of the target is brought back
   * to it while one behind it is left where it is inside the base. Where no
   * shift within the range stands the body on flat feet with its centre
   * inside, it stands on the forefoot, and the hips and trunk bring the
   * centre over the middle of the forefoot, back when it is ahead and
   * forward when it is outside behind, as a deep squat with its heels up
   * does. Each search's bracket is its start and the end of the range,
   * `range` hip heights the needed way; the crossing in it is refined to
   * `TOLERANCE` by the engine's bracketed root for the centre's place (the
   * Illinois false position, `bracketedRoot`), whose bracket keeps it safe
   * where the centre stops following the hips
   * once the planted legs reach the limit of their range, and by the engine's
   * bisection (`bracketedBisection`) for whether the heels are down. When no shift in the range balances the
   * body, the end that comes nearer is returned, and the law's
   * margin-of-stability verdict reports the remainder.
   *
   * @param body The body.
   * @param build The posture for a backward shift of the hips, metres; a negative shift moves them forward.
   * @param range How far the search looks either way, hip heights; `RANGE` when absent, and `REACH` for a posture whose hips do not start over the feet.
   * @param target How far ahead of the base's middle the centre is put, metres; 0, the middle itself, when absent.
   * @returns The shift, metres, negative forward; 0 when the centre lies inside the base no farther ahead than the target without one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, the flat feet sought before the forefoot, the cases on each, the search range in hip heights, the tolerance, the bracket and its refinement, and the nearer end when none balances.
   * @evidence contracts/development/implementation.md#principled-implementation Static balance (centre of mass inside the base that bears after the leg fit, over its middle along the heading) found on one bracket per search, by the engine's bracketed root (`bracketedRoot`, the Illinois false position) for the centre's continuous place and bisection for the heels' yes-or-no; both need only a bracket, so they hold where the solved legs saturate their range and where the base changes under a lifting heel. A flat foot is the larger base, so it is sought before the forefoot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per trial (`read`), each shift read once per call, and one bracketed search per case; the balance measures live in one place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ranges (`RANGE`, and `REACH` for a posture whose hips start away from the feet) and the tolerance (0.5 mm) are named search parameters, not tuned to a case; a body that cannot balance gets its nearest shift and the laws' stability verdicts report the remainder.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each search reads its bracket's two ends, then the bracketed root converges superlinearly where the centre's place is smooth, and bisection takes log2(range / tolerance), near 10, posture solves; each solve is one forward-kinematics pass with limb fits, read once for both measures and once per shift in the call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One genuine same-body ROM projector and exact FK workspace serve all complete current fits. At the original first mass-placement point, one genuine mass-model epoch snapshots the unchanged classic model; exact current frame scalar keys share only fixed local rotations while every ordered mass sum runs. After the first original full observation succeeds, one poseBones.prepare demand binds actual mass-profile and foot socket/outline names for later final frames. Every joint still projects and admits in order, all changed FK dependencies are checked, and each trial shares only its actual sole placement between base and heel tests.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The trial map, fixed-name FK demand, genuine ROM projector and exact FK workspace end with this solve; each foot reader ends with its synchronous trial, the classic model is borrowed lazily from the body and its operation token is released in finally on every success/failure; no dynamic context or model/result cache survives the search.
   */
  export function shift(
    body: IAutoMovieMotionHumanBody,
    build: (back: number) => IAutoMovieMotionHumanPosture,
    range: number = RANGE,
    target: number = 0,
  ): number {
    // Each shift is read once within a call: the searches below revisit
    // their brackets' ends.
    const read0: Map<number, IReading> = new Map();
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
    let frames: ReturnType<typeof poseBones.prepare> | undefined;
    let model: prepareAutoMovieMassModel.IPrepared | undefined;
    const mass: () => prepareAutoMovieMassModel.IPrepared = (): prepareAutoMovieMassModel.IPrepared => {
      model ??= prepareAutoMovieMassModel(body.massModel);
      return model;
    };
    const at: (back: number) => IReading = (back: number): IReading => {
      let r: IReading | undefined = read0.get(back);
      if (r === undefined) {
        r = read(body, build(back), resolution, projection, frames, mass);
        if (frames === undefined)
          frames = poseBones.prepare(body, new Set([...HumanColliders.bones(body), ...HumanFoot.bones(body)]));
        read0.set(back, r);
      }
      return r;
    };
    try {
      const start: IReading = at(0);
      const span: number = range * body.measure.hipHeight;
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
        error: (r: IReading) => number,
        smooth: boolean,
      ) => { found: boolean; back: number } = (
        from: number,
        sign: number,
        error: (r: IReading) => number,
        smooth: boolean,
      ): { found: boolean; back: number } => {
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
      const ahead: (r: IReading) => number = (r: IReading): number => r.offset - target;
      // Flat feet first: a heel the planted leg lifted is brought down by
      // moving the hips back; on flat feet a centre ahead of the target is
      // brought back to it, and one behind it is left while it lies inside.
      const down: { found: boolean; back: number } = first(
        0,
        1,
        (r: IReading): number => (r.flat ? 0 : 1),
        false,
      );
      if (down.found) {
        const landed: IReading = at(down.back);
        if (ahead(landed) > 0) return first(down.back, 1, ahead, true).back;
        if (landed.margin > 0) return down.back;
      }
      // Otherwise the forefoot: the centre brought over its middle, back when
      // ahead of it, forward when outside behind it.
      if (ahead(start) > 0) return first(0, 1, ahead, true).back;
      if (start.margin > 0) return 0;
      return first(0, -1, (r: IReading): number => -ahead(r), true).back;
    } finally {
      if (model !== undefined) prepareAutoMovieMassModel.release(model);
    }
  }

  /**
   * The static margin of stability of a posture: the horizontal distance
   * from the engine's whole-body centre of mass to the edge of the hull of
   * base of support, the feet's outlines where they bear (`HumanFoot.base`) (Hof et al. 2005, with zero
   * velocity), positive inside.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured quantity, its sign, the support points used and the static (zero-velocity) form of Hof's margin.
   * @evidence contracts/development/implementation.md#principled-implementation Hof et al. 2005 margin with zero velocity: the engine's segmental centre of mass to the convex hull of the feet's bearing outlines (`HumanFoot.base`), from the solved posture's bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Solves common centre/support geometry once and delegates only the requested hull margin to the engine, leaving directional projection and heel-state queries to consumers that need them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case: every posture uses the same bearing outlines and the engine's model.
   * @evidence contracts/development/implementation.md#efficient-algorithms One full posture solve, common mass/support placement and the hull of the two outlines' points; it no longer computes an unused heading offset or repeats sole-socket queries for heel state.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure query; nothing to reuse across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Borrows the body's prepared mass model during this synchronous query and retains no model or result.
   */
  export function margin(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture): number {
    const placed: IPlaced = placement(body, posture);
    return resolveAutoMovieCenterOfMass.margin(placed.centre, placed.base);
  }

  /**
   * Whole-body mass centre of the actual solved posture, without foot-support
   * geometry for callers that only need the centre's position.
   *
   * @param body The unchanged body owning its prepared classic mass model.
   * @param posture The actual posture with every limb and digit goal retained.
   * @param resolution Optional exact FK workspace or lazy supplier borrowed from the same synchronous body operation.
   * @param projection Optional genuine same-body ROM projector borrowed only from that synchronous operation; unissued functions keep ordinary admission.
   * @param resolved The cold resolve of this very posture when its caller already holds it, read in place of solving the posture here.
   * @returns The whole-body centre, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual complete posture solving, classic mass-model ownership and world-metre output, with support geometry outside this request.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the ordinary complete canonical posture solver, then demands the actual profile-bearing FK frames consumed by the same classic mass model and engine placement used by support; no leg, contact or digit fit is omitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy exact reader serves the actual complete pose solve and final profile FK, then body-owned mass placement exposes the centre-only dependency that reaction entry and bending observations need.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original authored goals, clamping, actual limb/digit fitting and mass model; it omits unused foot-outline/socket/hull work without substituting a guessed centre or achieved target.
   * @evidence contracts/development/implementation.md#efficient-algorithms Costs one full posture solve, ordered joint admission, demanded profile/ancestor FK and linear placement over mass segments; centre-only requests allocate no unrelated bone frames or foot bearing points and run no support projection/hull query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The classic mass model and collider metadata share actual profile-name demands. A local/borrowed operation FK reader shares exact dependencies, and a genuine same-body projection loan shares only static ROM metadata through seeded's provenance gate; every current joint, fit and mass placement still evaluates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local getter ends with the synchronous query, while an optional parent retains only its own operation workspace. The returned fresh vector retains no body, pose, model, reader or support data.
   */
  export function centre(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    resolved?: ReturnType<typeof resolveHumanPosture>,
  ): IAutoMovieVector3 {
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    return resolveAutoMovieCenterOfMass.place(
      body.massModel,
      body.colliderBones.map(resolved ?? resolveHumanPosture.seeded(body, posture, undefined, {}, read, undefined, projection).pose, read()),
    );
  }

  /**
   * Fixed-body centre observations owned by prepareHumanBalanceCentre.
   * Its actual profile-name producer prepares only immutable FK demand;
   * each reader call keeps complete fitting, current mass placement and
   * optional same-operation FK/ROM borrowing. Release it with the owning action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names prepareHumanBalanceCentre as the implementation owner and states fixed metadata, complete current fitting, borrowed operation context and lifetime.
   */
  export const prepareCentre: typeof prepareHumanBalanceCentre = prepareHumanBalanceCentre;

  /**
   * The dynamic margin of stability at an instant of a movement (Hof,
   * Gazendam and Sinke 2005): the engine's whole-body centre of mass plus
   * its velocity (a central difference over 1/240 s) over the inverted
   * pendulum's eigenfrequency `sqrt(g / l)` with `l` 1.34 hip heights (Hof's
   * leg length), measured to the edge of the feet's base, positive inside.
   *
   * @param body The body.
   * @param at The movement's posture at a second.
   * @param seconds The instant.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extrapolation, the difference step, the pendulum length convention, the support and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Hof, Gazendam and Sinke 2005 extrapolated centre of mass: position plus velocity over sqrt(g / l) with l = 1.34 hip heights (Hof's leg length), velocity by a central difference over 1/240 s of the movement's own postures, measured to the hull of the feet's bearing outlines.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the centre at three instants and hands extrapolation and margin to the engine; the base's gathering repeats `margin`'s reading on the bones already solved for the instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1/240 s step is a numerical choice finer than the 24 Hz film and the length is Hof's (`resolveAutoMovieCenterOfMass.pendulum`); the difference amplifies any discontinuity in the caller's posture function, which callers must keep smooth.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three posture solves per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One mass-name demand serves both neighbours and one genuine ROM projector/exact FK workspace serves all three actual full fits/display readings. Each joint still projects in order and every changed FK dependency is checked, without fitted-pose or finite-difference sample reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Borrows the body's prepared mass model for these actual three solves, retaining no model, sampled frame or result after return.
   */
  export function extrapolated(
    body: IAutoMovieMotionHumanBody,
    at: (seconds: number) => IAutoMovieMotionHumanPosture,
    seconds: number,
  ): number {
    return HumanBalanceExtrapolated.of(body, at, seconds);
  }

  /**
   * Fixed-body dynamic margin reader owned by HumanBalanceExtrapolated.prepare.
   * Every t-h, t+h and t callback/full fit remains actual; current callbacks may
   * synchronously borrow FK/ROM metadata and no sample enters retained state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the fixed-body dynamic reader owner, original three-instant full-fit policy, optional synchronous loans and absence of retained movement samples.
   */
  export const prepareExtrapolated: typeof HumanBalanceExtrapolated.prepare = HumanBalanceExtrapolated.prepare;

  /**
   * The engine's whole-body centre of mass of a posture and the support
   * points of its feet (the bearing outline of each, `HumanFoot.base`), world metres.
   *
   * @param body The body.
   * @param posture The posture.
   * @param resolution Optional exact FK workspace or lazy supplier borrowed only from this synchronous same-body operation.
   * @param projection Optional genuine same-body ROM metadata; every current joint and goal still receives ordinary complete admission.
   * @returns The centre and the support points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned, its frame and which sockets form the support.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segmental centre of mass and the feet's bearing outline points of the solved posture, for callers that measure margins along a direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the raw centre and points so `along` can measure any direction without solving again.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case present.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers reuse its result for several directions (brace reads push and lateral margins from one observation), and may lend genuine same-operation FK/ROM metadata across repeated full fits. Current goals, joint projection, mass and support placement remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the body's prepared mass model and optional synchronous exact FK/genuine ROM metadata, returning fresh support data without retaining a reader, projector, result, model or sampled history.
   */
  export function support(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanBalance.ISupport {
    const placed: IPlaced = placement(body, posture, resolution, projection);
    return {
      centre: placed.centre,
      points: placed.base,
    };
  }

  /**
   * The margin of stability along one horizontal direction: how far a point
   * may move that way before it leaves the convex hull of the support
   * points, the margin against a perturbation pushing it that way (Hof et
   * al. 2005 measure the margin along the perturbation's direction).
   *
   * @param point The point (a centre of mass or its extrapolation), world metres; its height is ignored.
   * @param points The support points.
   * @param direction The direction, horizontal; normalized here.
   * @returns Metres to the hull's edge along the direction; negative when the point is outside the hull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured distance, the frame (horizontal, height ignored), the direction's normalisation and the sign outside the hull.
   * @evidence contracts/development/implementation.md#principled-implementation Casts the horizontal point along the direction against each edge of the engine's convex hull of the support points and takes the farthest crossing, the exit; inside-ness comes from the engine's `pointInHull`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the hull's edges; the hull and containment come from the engine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1e-12 tolerances guard parallel edges and endpoint hits numerically; a hull of fewer than three points counts as outside, and a zero direction is not guarded (callers pass unit headings).
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n log n) for the hull of n support points (two foot outlines in practice) plus O(n) for its edges.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function; nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates the hull per call and retains nothing.
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
   * How far the whole-body centre of mass lies ahead of the middle of the
   * base of support along a posture's heading, metres: the middle between
   * the rearmost and the foremost point of the feet where they bear
   * (`HumanFoot.base`), so a heel lifted off the floor moves the middle
   * forward over the forefoot the body then stands on.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres; positive ahead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quantity, the reference (the bearing base's middle along the heading), the axis (the posture's heading) and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's centre of mass minus the middle of the base that bears after the leg fit, both projected on the heading from the posture's yaw: the static balance error `shift` drives to zero, which a heel-off moves with the base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solved centre/support preparation feeds the same heading projection shared by shift's complete reading; offset requests do not compute hull margins or heel state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case present.
   * @evidence contracts/development/implementation.md#efficient-algorithms One full posture solve and linear projection over actual bearing points; the unused support-hull margin and heel-state socket queries are omitted.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure query; nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Borrows the body's prepared mass model during one synchronous solve and retains no duplicate model or output.
   */
  export function offset(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture): number {
    return projected(placement(body, posture), posture.yaw);
  }
}

/** A posture's balance: `HumanBalance.offset` and `HumanBalance.margin`, metres, and whether both heels bear. */
interface IReading {
  /** How far the centre of mass lies ahead of the base's middle along the heading, metres. */
  offset: number;

  /** The static margin of stability, metres, positive inside the base. */
  margin: number;

  /** Whether both heels bear. */
  flat: boolean;
}

/** A posture's balance, read on one solve of it. */
function read(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
  frames?: ReturnType<typeof poseBones.prepare>,
  mass?: () => prepareAutoMovieMassModel.IPrepared,
): IReading {
  const placed: IPlaced = placement(body, posture, resolution, projection, frames, mass);
  return {
    offset: projected(placed, posture.yaw),
    margin: resolveAutoMovieCenterOfMass.margin(placed.centre, placed.base),

    // A heel bears within the bearing height of the lowest sole socket.
    flat: (["left", "right"] as const).every(
      (side: "left" | "right"): boolean => {
        const sockets: readonly IAutoMovieMotionHumanFoot.ISocket[] = placed.feet.sockets(side);
        return sockets[0]!.point.y <=
          Math.min(sockets[1]!.point.y, sockets[2]!.point.y) + HumanFoot.BEARING;
      },
    ),
  };
}

/** Common solved geometry needed by all static balance measurements. */
interface IPlaced {
  /** Borrowed sole geometry bound to this trial's complete displayed FK. */
  feet: ReturnType<typeof HumanFoot.reading>;

  /** Actual whole-body mass centre in world metres. */
  centre: IAutoMovieVector3;

  /** Original foot-outline bearing points in their original order. */
  base: IAutoMovieVector3[];
}

/** Solve once and prepare only the common mass-centre and support geometry. */
function placement(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
  frames?: ReturnType<typeof poseBones.prepare>,
  mass?: () => prepareAutoMovieMassModel.IPrepared,
): IPlaced {
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const pose: ReturnType<typeof resolveHumanPosture> =
    resolveHumanPosture.seeded(body, posture, undefined, {}, read, undefined, projection).pose;
  const bones: ReturnType<typeof poseBones> = frames === undefined
    ? poseBones(body, pose, read()) : frames(pose, read());
  const feet: ReturnType<typeof HumanFoot.reading> = HumanFoot.reading(body, bones);
  return {
    feet,
    centre: mass === undefined ? resolveAutoMovieCenterOfMass.place(body.massModel, bones)
      : prepareAutoMovieMassModel.place(mass(), bones),
    base: feet.base(),
  };
}

/** Project the same mass centre and base on the heading without a hull or heel query. */
function projected(placed: IPlaced, yaw: number): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
    { x: 0, y: 0, z: 1 },
  );
  let rear: number = Infinity;
  let front: number = -Infinity;
  for (const p of placed.base) {
    const along: number = Vector3.dot(p, forward);
    rear = Math.min(rear, along);
    front = Math.max(front, along);
  }
  return Vector3.dot(placed.centre, forward) - (rear + front) / 2;
}

