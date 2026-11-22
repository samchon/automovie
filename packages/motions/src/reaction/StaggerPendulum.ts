import { Vector3, convexHull2D, pointInHull } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import { staggerNearest } from "./staggerNearest";
import { staggerPendulumCourses } from "./staggerPendulumCourses";
import type { staggerRecover } from "./staggerRecover";
import { staggerTransfer } from "./staggerTransfer";

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
 * The entry's fixed geometry (`prepare`: the centre, root, heading, feet and
 * soles' extents) is read once per search and shared by every speed and
 * foot order it probes. This instance owns the actual state and phases;
 * private source-footprint and integration helpers serve the public support
 * and advance operations.
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
  public readonly body: IAutoMovieMotionHumanActionContext["body"];

  /** The posture the push meets. */
  public readonly entry: IAutoMovieMotionHumanActionContext["entry"];

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
  public readonly entered: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

  /** The narrowest the feet stand, ankle to ankle across the heading, side by side with their outlines touching. */
  public readonly width: number;

  /** A sole's length along the heading. */
  public readonly length: number;

  /** The centre of mass's shift per sine of the trunk's pitch and roll on the entry's feet, metres (`staggerKnots.bending`). */
  public readonly bend: Record<"pitch" | "roll", IAutoMovieVector3>;

  /** The feet as the steps so far placed them. */
  public feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

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
    placement: IAutoMovieMotionHumanFoot.IPlacement;
    relative: IAutoMovieVector3[];
  }>> = {};

  /**
   * Start one push's pendulum on its entry's fixed geometry.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param fixed The entry's geometry (`prepare`) for this same body and entry, shared by every speed one search probes; read here when absent.
   */
  public constructor(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    fixed: ReturnType<typeof StaggerPendulum.prepare> = StaggerPendulum.prepare(body, entry),
  ) {
    this.body = body;
    this.entry = entry;
    this.push = push;
    this.speed = speed;
    this.w = fixed.w;
    this.centre = fixed.centre;
    this.root = fixed.root;
    this.forward = fixed.forward;
    this.across = fixed.across;
    this.entered = fixed.entered;
    this.feet = { ...this.entered };
    this.v = Vector3.scale(StaggerPendulum.flat(push), speed);
    this.width = fixed.width;
    this.length = fixed.length;
    this.bend = fixed.bend;
  }

  /**
   * The entry's geometry a pendulum starts from, which depends on the body
   * and the entry alone: the frequency, the whole-body centre of mass (one
   * full forward-kinematics read), the root, the heading's axes, the feet,
   * the soles' narrowest side-by-side width and length, and the trunk's
   * shift of the centre of mass per sine of its tilt (`staggerKnots.bending`,
   * three more centre-of-mass reads).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @returns The fixed geometry, shared by every pendulum of one search over speeds and foot orders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, its frames and who shares it.
   * @evidence contracts/development/implementation.md#principled-implementation The pendulum's frequency from Hof's leg length, the centre of mass read from the entry posture, and the soles' extents along the heading's axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of every speed-independent quantity the constructor used to read per pendulum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every value is read from the actual body and entry; nothing is a constant of one body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four centre-of-mass reads (the entry's and the bending's three) and two sole-extent scans per search instead of per probed speed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The record depends on the body and the entry alone, so a search over speeds and pushes on one entry shares it; a different entry prepares its own.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record that its search owns until it returns.
   */
  public static prepare(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
  ): Pick<StaggerPendulum, "w" | "centre" | "root" | "forward" | "across" | "entered" | "width" | "length" | "bend"> {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
    const entered: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = StrikingTarget.feet(entry);
    return {
      w: staggerBounds.omega(body),
      centre: HumanBalance.centre(body, entry.posture),
      root: entry.posture.root,
      forward,
      across,
      entered,
      width: StaggerPendulum.extent(body, entered, across),
      length: StaggerPendulum.extent(body, entered, forward),
      bend: staggerKnots.bending(body, entry),
    };
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

  /** The state back to the push.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Restores initial feet, zero travel/time and push-scaled velocity.
   * @evidence contracts/development/implementation.md#principled-implementation Reinstates the constructor's dynamic conditions while retaining the same entry/body geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct state assignments replace the original step and phase arrays.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the exact original initial values and does not retain a previous order's dynamics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant reset work independent of the previous phase count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This actual recovery's own constructor observations remain with its original prefix search. Exact outline checks independently validate every subsequent foot placement; no completed entry measurement crosses recovery calls.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the side's footprint outline and the one held-pressure propagator (`advance`); no dynamic answer is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds the original single phase to this search-owned state and retains no extra query data.
   */
  public bear(sides: readonly ("left" | "right")[], seconds: number): void {
    this.advance(staggerNearest.of(this.bearing(sides), this.xi()), seconds);
  }

  /**
   * The centre of pressure where the last span left it, from the entry's
   * centre of mass: a weight shift's end, or a held span's point; before any
   * span, the point of both feet's outline nearest the extrapolated centre
   * of mass, where the push's first span holds it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the three cases.
   * @evidence contracts/development/implementation.md#principled-implementation A span's pressure at its end is its shift's target or its held point; the first span's rule gives it before any span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of the last span and one fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the recorded span; nothing is re-aimed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work, or one hull and projection before any span.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The weight shift and the held spans start from this one reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a recorded or fresh vector and retains nothing.
   */
  public pressure(): IAutoMovieVector3 {
    const last: staggerRecover.IPhase | undefined = this.phases.at(-1);
    return last === undefined
      ? staggerNearest.of(this.bearing(["left", "right"]), this.xi())
      : (last.to ?? last.p);
  }

  /**
   * The weight's transfer onto the stance foot before a step: a foot cannot
   * leave the floor bearing weight, nor bear it as it touches down, so the
   * centre of pressure travels from where it stands onto the stance foot's
   * outline by lift-off, loading a foot that has just landed and unloading
   * the one about to leave, over the measured weight-transfer phase (Cyr,
   * Moglo and Smeesters 2005), on a minimum-jerk course (the model's choice;
   * no source gives the trace of a reactive step's), the pendulum integrated
   * under it exactly in one span (`staggerTransfer`).
   *
   * The course ends where the swing that follows holds the centre of
   * pressure, the stance foot's point nearest the extrapolated centre of
   * mass at lift-off (`hold`), so the pressure runs on without a jump from
   * the weight shift into the swing, as it does from the touch-down into
   * the next shift: it moves continuously under the feet, rolling onto the
   * stance foot and shifting between the feet over double support, as the
   * extrapolated centre of mass's stepping models have it (Hof 2008, Hum Mov
   * Sci 27:112). The end is the fixed point of that rule: the extrapolated
   * centre of mass at lift-off is affine in the end, `a + c q` with one
   * scalar `c` of magnitude under one (the end acts through the span's
   * course, `|c| = omega * integral of e^(omega (T - t)) s(t / T) dt` over
   * the span, under 0.3 at the measured 138 ms), and the projection onto the convex outline does not
   * expand distances, so the rule contracts and is iterated to `FIXED`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States measured transfer timing, the minimum-jerk pressure path, its end's fixed point with its contraction, the continuity it gives and its exact integration.
   * @evidence contracts/development/implementation.md#principled-implementation The pressure where the last span left it and the stance-foot point nearest the extrapolated centre of mass at the shift's end are the course's ends; the pendulum under a quintic pressure course has an exact closed form, linear in the end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The start, the end's fixed point, one span, the state at its end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No time step: the span's course is the exact solution of the pendulum under the stated pressure course; the fixed point is iterated until it moves less than `FIXED`, bounded by `PASSES` passes of a contraction.
   * @evidence contracts/development/implementation.md#efficient-algorithms One phase per shift; the fixed point costs one closed-form read and one projection per pass, at a contraction under 0.3 a few tens of passes at most.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The course readers evaluate the same span through the same closed form; the stance foot's outline is read once for every pass.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Appends one phase record to the search-owned phase array.
   */
  public transfer(stance: "left" | "right", seconds: number): void {
    // It leaves from where the centre of pressure stands, so the weight
    // reaches a foot that has just landed over this transfer, its loading,
    // and never at its touch-down.
    const p0: IAutoMovieVector3 = this.pressure();

    // It ends where the swing holds it: the stance foot's point nearest the
    // extrapolated centre of mass at the shift's end, the fixed point of a
    // contraction.
    const outline: IAutoMovieVector3[] = this.bearing([stance]);
    const lifted: (q: IAutoMovieVector3) => IAutoMovieVector3 = (q: IAutoMovieVector3): IAutoMovieVector3 => {
      const end: ReturnType<typeof staggerTransfer> = staggerTransfer(
        { p: p0, s: this.s, v: this.v },
        q,
        seconds,
        this.w,
        seconds,
      );
      return Vector3.add(end.s, Vector3.scale(end.v, 1 / this.w));
    };
    let p1: IAutoMovieVector3 = staggerNearest.of(outline, this.xi());
    for (let k: number = 0; k < StaggerPendulum.PASSES; k++) {
      const next: IAutoMovieVector3 = staggerNearest.of(outline, lifted(p1));
      const moved: number = Vector3.distance(next, p1);
      p1 = next;
      if (moved <= StaggerPendulum.FIXED) break;
    }

    // One span in closed form over the whole shift (`staggerTransfer`).
    this.phases.push({ from: this.t, p: p0, s: this.s, v: this.v, to: p1, span: seconds });
    const end: ReturnType<typeof staggerTransfer> = staggerTransfer(
      { p: p0, s: this.s, v: this.v },
      p1,
      seconds,
      this.w,
      seconds,
    );
    this.s = end.s;
    this.v = end.v;
    this.t += seconds;
  }

  /**
   * Where a landing foot must take the centre of pressure for the body to be
   * held there once it has taken the weight: the point the extrapolated
   * centre of mass reaches at the end of a weight shift onto it, the shift
   * running from where the pressure stands (`pressure`) over `seconds`. A
   * foot takes no weight as it touches down, so the extrapolated centre of
   * mass runs on over its loading, and a capture step aims where it will be
   * then, the divergent component's continuous double support (Englsberger,
   * Ott and Albu-Schaffer 2015, IEEE Trans Robot 31:355). The extrapolated
   * centre of mass at the shift's end is affine in its target, `a + c q`
   * with one scalar `c` (`transfer`), so the point is `a / (1 - c)` in closed
   * form.
   *
   * @param seconds The weight shift's span.
   * @returns The point, from the entry's centre of mass, on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point, its premise, its source and its closed form.
   * @evidence contracts/development/implementation.md#principled-implementation The fixed point of the affine map from a weight shift's target to the extrapolated centre of mass at its end, under the exact minimum-jerk shift (`staggerTransfer`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two closed-form reads give the map, one division its fixed point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact for the pendulum and shift stated; nothing is iterated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two closed-form span reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same shift owner as `transfer`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains nothing.
   */
  public loaded(seconds: number): IAutoMovieVector3 {
    const p0: IAutoMovieVector3 = this.pressure();
    const xiAt: (q: IAutoMovieVector3) => IAutoMovieVector3 = (q: IAutoMovieVector3): IAutoMovieVector3 => {
      const end: ReturnType<typeof staggerTransfer> = staggerTransfer(
        { p: p0, s: this.s, v: this.v },
        q,
        seconds,
        this.w,
        seconds,
      );
      return StaggerPendulum.flat(Vector3.add(end.s, Vector3.scale(end.v, 1 / this.w)));
    };
    const a: IAutoMovieVector3 = xiAt({ x: 0, y: 0, z: 0 });
    const c: number = xiAt({ x: 1, y: 0, z: 0 }).x - a.x;
    return Vector3.scale(a, 1 / (1 - c));
  }

  /**
   * The pendulum over a span with its centre of pressure held where the last
   * span left it (`pressure`): a swing's, on the stance foot where the weight
   * shift put it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the held point and the span.
   * @evidence contracts/development/implementation.md#principled-implementation The held-pressure propagator (`advance`) at the pressure the last span ended on, so the pressure does not jump between spans.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading and one advance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The span is integrated exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `pressure` and `advance`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds one phase record to the search-owned phase array.
   */
  public hold(seconds: number): void {
    this.advance(this.pressure(), seconds);
  }

  /** The pendulum over a span with its centre of pressure held.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Advances centre-relative travel/velocity over supplied seconds and records the starting phase.
   * @evidence contracts/development/implementation.md#principled-implementation The linear inverted pendulum's closed-form propagator under a held centre of pressure: s - p grows by cosh and v by sinh of omega times the span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the span's starting state, then one state update.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No time step: the span is integrated exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant closed-form work per span.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The course readers evaluate the recorded span with the same propagator (`staggerPendulumCourses`).
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds one phase record to the search-owned phase array.
   */
  public advance(p: IAutoMovieVector3, seconds: number): void {
    const w: number = this.w;
    const ch: number = Math.cosh(w * seconds);
    const sh: number = Math.sinh(w * seconds);
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
   * @evidence contracts/development/implementation.md#principled-implementation Selects the latest span starting at or before the second, the first before every start, and evaluates the closed-form cosh/sinh/exp expressions (`staggerPendulumCourses`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One phase selector and the travel/pressure/extrapolation formulas.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no time cache; the spans are this pendulum's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms A binary search over the spans per read, valid because this pendulum appends spans at its advancing clock.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The admission, the close and the displayed feet read these same spans.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned readers retain the phase array and constants; each read returns fresh vectors and retains no time-keyed reading.
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
   * replacing a slot never mutates an earlier outline record.
   */
  private footprint(side: "left" | "right", placement: IAutoMovieMotionHumanFoot.IPlacement): {
    placement: IAutoMovieMotionHumanFoot.IPlacement;
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

  /** How near, metres, a weight shift's end comes to its fixed point (`transfer`): a nanometre, far under any displayed length. */
  private static readonly FIXED: number = 1e-9;

  /** The most passes of a weight shift's fixed point (`transfer`): at a contraction under 0.3 a pass, 64 passes leave 3e-34 of the first error, so the bound only guards a degenerate span. */
  private static readonly PASSES: number = 64;

  /** Each entry sole's ankle-relative extent along an axis, the larger of the two. */
  private static extent(
    body: IAutoMovieMotionHumanActionContext["body"],
    entered: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    axis: IAutoMovieVector3,
  ): number {
    return Math.max(
      ...(["left", "right"] as const).map((side: "left" | "right"): number => {
        const along: number[] = HumanFoot.sole(body, side, entered[side]).map(
          (q: IAutoMovieVector3): number =>
            Vector3.dot(Vector3.subtract(q, entered[side].ankle), axis),
        );
        return Math.max(...along) - Math.min(...along);
      }),
    );
  }
}
