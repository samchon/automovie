import {
  Vector3,
  convexHull2D,
  minimumJerk,
  pointInHull,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFoot } from "../posture/HumanFoot";
import { staggerBounds } from "./staggerBounds";
import type { staggerRecover } from "./staggerRecover";
import { staggerPendulumCourses } from "./staggerPendulumCourses";
import { prepareStaggerPendulumEntry } from "./prepareStaggerPendulumEntry";

/**
 * A pushed body's centre of mass over the floor as Hof's inverted pendulum
 * (Hof, Gazendam and Sinke 2005; Hof 2008), with the feet and the steps that
 * bear it: the state a recovery's steps advance (`staggerRecover`).
 *
 * The travel `s` and the velocity `v` are horizontal, from the entry's
 * centre of mass; the extrapolated centre of mass is `s + v / omega`. Each
 * span holds a centre of pressure, as near the extrapolated centre of mass
 * as the bearing feet reach, and is integrated in closed form; the spans
 * are kept as phases the courses read.
 *
 * Entry preparation owns the unchanged centre, heading and sole facts. This
 * instance owns the actual state and phases; private source-footprint and
 * integration helpers serve the public support and advance operations.
 * Exact footprint snapshots retain at most one outline per side, alongside
 * the actual phases and steps, until reset or release. Prefix snapshots
 * remain owned by the same complete body/entry/push/speed search.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the model, its state, its frame and what reads it.
 * @evidence contracts/development/design.md#principled-representation One pendulum's state with the geometry of the entry it starts from, so a recovery's steps share it rather than closing over loose variables.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The state, its spans and its readings, as `staggerStep`, `staggerClose` and `staggerRecover` read them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every quantity is the body's own: its feet, its centre of mass and its pendulum's frequency.
 */
export class StaggerPendulum {
  /** The body. */
  public readonly body: IHumanActionContext["body"];

  /** The posture the push meets. */
  public readonly entry: IHumanActionContext["entry"];

  /** The push's horizontal unit direction, world. */
  public readonly push: IAutoMovieVector3;

  /** The centre of mass's speed after the blow, m/s. */
  public readonly speed: number;

  /** The pendulum's eigenfrequency, radians per second (`staggerBounds.omega`). */
  public readonly w: number;

  /** The entry's centre of mass, world metres. */
  public readonly centre: IAutoMovieVector3;

  /** The entry's root, world metres. */
  public readonly root: IAutoMovieVector3;

  /** The entry's heading's forward unit, world. */
  public readonly forward: IAutoMovieVector3;

  /** The entry's heading's unit across, to the body's left. */
  public readonly across: IAutoMovieVector3;

  /** The feet as the entry stands them. */
  public readonly entered: Record<"left" | "right", HumanFoot.IPlacement>;

  /** The narrowest the feet stand, ankle to ankle across the heading, side by side with their outlines touching. */
  public readonly width: number;

  /** A sole's length along the heading. */
  public readonly length: number;

  /** The feet as the steps so far placed them. */
  public feet: Record<"left" | "right", HumanFoot.IPlacement>;

  /** The spans so far: each start, its centre of pressure and the state it started from. */
  public phases: staggerRecover.IPhase[] = [];

  /** The steps so far. */
  public steps: staggerRecover.IStep[] = [];

  /** The centre of mass's travel from the entry's, horizontal. */
  public s: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** The centre of mass's velocity, horizontal. */
  public v: IAutoMovieVector3;

  /** Seconds since the push. */
  public t: number = 0;

  /** One exact placement snapshot per foot; the body's sole geometry is fixed. */
  private readonly footprints: Partial<Record<"left" | "right", {
    placement: HumanFoot.IPlacement;
    relative: IAutoMovieVector3[];
  }>> = {};

  /**
   * Start one push's actual pendulum from the fixed entry geometry.
   * An explicit operation-owned geometry record may share the same complete
   * unchanged body/entry facts across speeds; dynamic state remains local.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param geometry Optional same-operation geometry prepared from this exact unchanged body and entry.
   */
  public constructor(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    geometry?: ReturnType<typeof prepareStaggerPendulumEntry>,
  ) {
    const prepared: ReturnType<typeof prepareStaggerPendulumEntry> = geometry ?? prepareStaggerPendulumEntry(body, entry);
    this.body = body;
    this.entry = entry;
    this.push = push;
    this.speed = speed;
    this.w = staggerBounds.omega(body);
    this.centre = prepared.centre;
    this.root = entry.posture.root;
    this.forward = prepared.forward;
    this.across = prepared.across;
    this.entered = prepared.entered;
    this.feet = { ...this.entered };
    this.v = Vector3.scale(StaggerPendulum.flat(push), speed);
    this.width = prepared.width;
    this.length = prepared.length;
    this.footprints.left = prepared.footprints.left;
    this.footprints.right = prepared.footprints.right;
  }

  /** A point on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Projects a world vector to the horizontal plane without changing x/z.
   * @evidence contracts/development/implementation.md#principled-implementation Copies x/z and sets the vertical coordinate to the floor-frame zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direct vector construction expresses the projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies no offset or tolerance to the supplied horizontal coordinates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work and one output vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All pendulum floor projections use this owner; no vector result is cached.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the vector and the method retains nothing.
   */
  public static flat(p: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: p.x, y: 0, z: p.z };
  }

  /**
   * The point of a convex outline nearest a point, the point itself when
   * inside, on the floor.
   *
   * @param outline The outline.
   * @param point The point.
   * @returns The nearest point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States convex floor-outline projection and the unchanged inside-point result.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the original inside test and complete closed-edge projection search, including collapsed edges and first strict-distance winner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One containment branch precedes the nearest-edge scan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original three-coordinate projection arithmetic, span>0 decision and distance ties; callers provide a nonempty floor outline.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v) edge work for v corners and constant live best-point storage; distance reads avoid one temporary subtraction vector per edge.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each point is searched against current outline coordinates; no nearest answer is reused across points.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the original inside point or a fresh selected edge point, retaining no query state.
   */
  public static nearest(
    outline: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (outline.length >= 3 && pointInHull(point, outline)) return point;
    let best: IAutoMovieVector3 = outline[0]!;
    let gap: number = Infinity;
    for (let i: number = 0; i < outline.length; i++) {
      const a: IAutoMovieVector3 = outline[i]!;
      const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
      const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
      const span: number = Vector3.dot(ab, ab);
      const u: number = span > 0
        ? Math.min(1, Math.max(0, Vector3.dot(Vector3.subtract(point, a), ab) / span))
        : 0;
      const q: IAutoMovieVector3 = Vector3.add(a, Vector3.scale(ab, u));
      const d: number = Vector3.distance(point, q);
      if (d < gap) {
        gap = d;
        best = q;
      }
    }
    return best;
  }

  /** The state back to the push.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Restores initial feet, zero travel/time and push-scaled velocity.
   * @evidence contracts/development/implementation.md#principled-implementation Reinstates the constructor's dynamic conditions while retaining the same entry/body geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct state assignments replace the original step and phase arrays.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the exact original initial values and does not retain a previous order's dynamics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant reset work independent of the previous phase count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed entry centre/heading/sole facts prepared at construction remain shared. Explicit borrowed preparation must belong to the same unchanged body and complete entry; exact outline checks independently validate subsequent foot placements.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Replaces this search-owned instance's phase/step arrays; already issued snapshots retain their original arrays only until the prefix search ends, and footprint storage stays bounded at two records with no global result history or external handle.
   */
  public reset(): void {
    this.feet = { ...this.entered };
    this.phases = [];
    this.steps = [];
    this.s = { x: 0, y: 0, z: 0 };
    this.v = Vector3.scale(StaggerPendulum.flat(this.push), this.speed);
    this.t = 0;
  }

  /** The state, to take up again with restore.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Records the current feet, phases, steps, travel, velocity and action-local time.
   * @evidence contracts/development/implementation.md#principled-implementation Copies mutable collection wrappers while borrowing the original immutable placement/phase/vector records used by prefix continuation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record exposes exactly the state restore consumes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Contains actual current state, without a fitted replay or omitted phase.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(p+s) wrapper copying for p phases and s steps; fixed vectors and placements are borrowed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Matching foot-order prefixes share this exact snapshot under the same search's body, entry, push and speed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns returned snapshots until its prefix map is released; this method retains no extra snapshot history.
   */
  public snapshot(): staggerRecover.IState {
    return {
      feet: { ...this.feet },
      phases: [...this.phases],
      steps: [...this.steps],
      s: this.s,
      v: this.v,
      t: this.t,
    };
  }

  /** Take up a state snapshot kept.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Restores a snapshot of this same pendulum's search context.
   * @evidence contracts/development/implementation.md#principled-implementation Restores every original state component and copies collection wrappers so extending one order cannot mutate another prefix's lists.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The assignments mirror snapshot's six state fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reinstates actual phases/steps and vectors without recomputing or altering their values.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(p+s) list copying for the restored prefix with constant fixed-state work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only prefixes from this same fixed body/entry/push/speed search supply states; foot outline reuse still checks exact placement scalars.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Replaces this instance's current arrays and borrows immutable nested records; the search retains snapshot ownership only for its original prefix map lifetime.
   */
  public restore(state: staggerRecover.IState): void {
    this.feet = { ...state.feet };
    this.phases = [...state.phases];
    this.steps = [...state.steps];
    this.s = state.s;
    this.v = state.v;
    this.t = state.t;
  }

  /** The extrapolated centre of mass, from the entry's centre of mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns current relative centre plus velocity/frequency in world metres.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates Hof's unchanged xi=s+v/omega expression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One velocity scaling and addition express the capture point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses current state and the body's original frequency without a capped lead.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant vector work and output size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the prepared frequency but evaluates current travel/velocity afresh.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no state beyond the owning instance.
   */
  public xi(): IAutoMovieVector3 {
    return Vector3.add(this.s, Vector3.scale(this.v, 1 / this.w));
  }

  /** The bearing feet's convex outline from the entry's centre of mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States selected foot sides and centre-relative floor-metre output.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same placed sole sockets/outlines and original convexHull2D union after horizontal centre-relative translation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Exact per-foot outline readings precede one shared hull owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every selected sole point and original hull computation without a support margin or simplified shape.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v log v) hull work for v selected sole points; unchanged placement scalars avoid rebuilding their rigid geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each outline reuse requires Object.is agreement on all seven ankle/quaternion scalars against the side's copied snapshot under this instance's fixed body and entry centre; no rounded key, support result or dynamic state is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh hull array borrowing prepared points; at most one bounded outline record per side is retained by the instance.
   */
  public bearing(sides: readonly ("left" | "right")[]): IAutoMovieVector3[] {
    return convexHull2D(
      sides.flatMap((side: "left" | "right"): IAutoMovieVector3[] =>
        this.footprint(side, this.feet[side]).relative,
      ),
    );
  }

  /** Whether xi lies inside both feet's base, Koolen's zero-step capture region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines two-foot zero-step capture at the current extrapolated centre.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original two-foot hull and pointInHull test only when it has at least three corners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One support read and containment predicate state the capture decision.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original hull-size and containment thresholds without treating a near miss as capture.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(v log v) support-hull construction and O(v) containment for bounded sole point count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only exact fixed foot geometry through bearing; the current xi is always tested anew.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no capture result or query history.
   */
  public captured(): boolean {
    const base: IAutoMovieVector3[] = this.bearing(["left", "right"]);
    return base.length >= 3 && pointInHull(this.xi(), base);
  }

  /**
   * A span of the pendulum: the centre of pressure as near the extrapolated
   * centre of mass as the bearing feet reach (on it, which holds it, or at
   * the nearest point of their outline).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States selected support feet, duration and nearest supported pressure.
   * @evidence contracts/development/implementation.md#principled-implementation Projects the current xi onto the original support outline and integrates the held-pressure pendulum for the requested seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Support, nearest projection and the shared advance owner retain separate responsibilities.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original pressure and duration without reducing an integration phase.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded support/projection scan and one closed-form advance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses exact outline geometry and the same advance equations as transfer; no dynamic answer is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds the original single phase to this search-owned state and retains no extra query data.
   */
  public bear(sides: readonly ("left" | "right")[], seconds: number): void {
    this.advance(
      StaggerPendulum.nearest(this.bearing(sides), this.xi()),
      seconds,
    );
  }

  /**
   * The weight's transfer onto the stance foot before a step: a foot cannot
   * leave the floor bearing weight, nor bear it as it touches down, so the
   * centre of pressure travels from where it stands onto the stance foot's
   * outline by lift-off, loading a foot that has just landed and unloading
   * the one about to leave, over the measured weight-transfer phase (Cyr,
   * Moglo and Smeesters 2005), on a minimum-jerk course (the model's choice;
   * no source gives the trace of a reactive step's), the pendulum integrated
   * under it in `STEP`s.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States measured transfer timing, minimum-jerk pressure path and preserved STEP integration.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the last pressure and nearest stance-foot endpoint, original rounded interval count and midpoint minimum-jerk interpolation before exact held-pressure advances.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed endpoints and interval factors precede the unchanged pressure-sample loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every interval, sample instant and pressure point; only identical cosh/sinh factors are prepared once.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(c) phases for original count c; fixed interval hyperbolic factors avoid two transcendental calls per repeated step.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All intervals share the exact same duration and this pendulum's frequency, while each pressure sample and dynamic update is calculated separately.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the original c phase records in the search-owned phase array, with only constant additional factor scratch.
   */
  public transfer(stance: "left" | "right", seconds: number): void {
    // It leaves from where the centre of pressure stands, so the weight
    // reaches a foot that has just landed over this transfer, its loading,
    // and never at its touch-down.
    const p0: IAutoMovieVector3 =
      this.phases.at(-1)?.p ??
      StaggerPendulum.nearest(this.bearing(["left", "right"]), this.xi());
    const p1: IAutoMovieVector3 = StaggerPendulum.nearest(
      this.bearing([stance]),
      p0,
    );
    const count: number = Math.max(
      1,
      Math.round(seconds / staggerBounds.STEP),
    );
    const interval: number = seconds / count;
    const ch: number = Math.cosh(this.w * interval);
    const sh: number = Math.sinh(this.w * interval);
    for (let i: number = 0; i < count; i++)
      this.advanceAt(
        Vector3.lerp(p0, p1, minimumJerk.share((i + 0.5) / count)),
        interval,
        ch,
        sh,
      );
  }

  /** The pendulum over a span with its centre of pressure held.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Advances centre-relative travel/velocity over supplied seconds and records the starting phase.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the original inverted-pendulum cosh/sinh propagator through advanceAt.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One duration-specific factor preparation feeds the shared state update.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the exact frequency, supplied pressure, duration and vector-update grouping.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant closed-form work per original phase.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares update equations with the transfer path whose duration factors are already known.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds exactly one original phase; factor scratch dies at return and the search owns phase-array lifetime.
   */
  public advance(p: IAutoMovieVector3, seconds: number): void {
    this.advanceAt(p, seconds, Math.cosh(this.w * seconds), Math.sinh(this.w * seconds));
  }

  /**
   * Advance the original held-pressure law using cosh/sinh for this exact
   * frequency and duration. Record the starting phase before replacing the
   * state; fixed-interval transfers lend their identical prepared factors.
   */
  private advanceAt(p: IAutoMovieVector3, seconds: number, ch: number, sh: number): void {
    const w: number = this.w;
    this.phases.push({ from: this.t, p, s: this.s, v: this.v });
    const next: IAutoMovieVector3 = Vector3.add(
      Vector3.add(p, Vector3.scale(Vector3.subtract(this.s, p), ch)),
      Vector3.scale(this.v, sh / w),
    );
    this.v = Vector3.add(
      Vector3.scale(Vector3.subtract(this.s, p), w * sh),
      Vector3.scale(this.v, ch),
    );
    this.s = next;
    this.t += seconds;
  }

  /** The current spans as world-metre, action-local-second course readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units, common clock and phase-array lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original latest-from<=seconds linear scan and closed-form cosh/sinh/exp expressions, including the original before-first clamp and duplicate-start rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One phase selector and the original travel/pressure/extrapolation formulas serve independent and paired readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not assume sorted immutable phases, add a time cache or skip a requested value; unrequested extrapolation is not evaluated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Individual reads retain one linear phase scan; a paired sample reduces two or three scans to one, with unchanged formulas and speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Stance knots consume a single selected phase for their course and pressure and, when caught, extrapolated centre.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned readers retain the same phase array and constants as before; each sample returns fresh vectors and retains no time-keyed reading.
   */
  public courses(): staggerRecover.ICourses {
    return staggerPendulumCourses(this.phases, this.w, this.centre);
  }

  /**
   * A step's measured bound in its direction from the performer's heading:
   * between the forward, sideways and backward values on an ellipse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names direction, the body's heading axes and the measured forward/side/backward bounds.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the original inverse ellipse radius from normalized forward/across direction components, choosing the forward or backward semi-axis by sign.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One zero-direction branch precedes projection and the ellipse expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all supplied measured bounds and returns the original side bound for a nonpositive direction length.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/vector work independent of steps or phases.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the instance's fixed heading axes while each varying direction is evaluated directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no query data.
   */
  public bound(
    direction: IAutoMovieVector3,
    of: Readonly<Record<"forward" | "side" | "backward", number>>,
  ): number {
    const length: number = Vector3.length(direction);
    if (!(length > 0)) return of.side;
    const ahead: number = Vector3.dot(direction, this.forward) / length;
    const aside: number = Vector3.dot(direction, this.across) / length;
    const along: number = ahead >= 0 ? of.forward : of.backward;
    return 1 / Math.sqrt((ahead / along) ** 2 + (aside / of.side) ** 2);
  }

  /**
   * Read the actual centre-relative sole, reusing only exact Object.is
   * agreement on every ankle/quaternion scalar under the fixed body/centre.
   * Each side retains one copied placement snapshot and latest outline;
   * replacing a slot never mutates a borrowed entry-preparation record.
   */
  private footprint(side: "left" | "right", placement: HumanFoot.IPlacement): {
    placement: HumanFoot.IPlacement;
    relative: IAutoMovieVector3[];
  } {
    const known: (typeof this.footprints)["left"] = this.footprints[side];
    if (
      known !== undefined &&
      Object.is(known.placement.ankle.x, placement.ankle.x) &&
      Object.is(known.placement.ankle.y, placement.ankle.y) &&
      Object.is(known.placement.ankle.z, placement.ankle.z) &&
      Object.is(known.placement.rotation.x, placement.rotation.x) &&
      Object.is(known.placement.rotation.y, placement.rotation.y) &&
      Object.is(known.placement.rotation.z, placement.rotation.z) &&
      Object.is(known.placement.rotation.w, placement.rotation.w)
    ) return known;
    const world: IAutoMovieVector3[] = HumanFoot.sole(this.body, side, placement);
    const made: NonNullable<(typeof this.footprints)["left"]> = {
      placement: { ankle: { ...placement.ankle }, rotation: { ...placement.rotation } },
      relative: world.map(
        (q: IAutoMovieVector3): IAutoMovieVector3 => StaggerPendulum.flat(Vector3.subtract(q, this.centre)),
      ),
    };
    this.footprints[side] = made;
    return made;
  }
}
