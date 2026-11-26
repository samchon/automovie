import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { staggerNearest } from "./staggerNearest";
import { staggerPendulumCourses } from "./staggerPendulumCourses";
import { staggerPendulumEntry } from "./staggerPendulumEntry";
import type { staggerRecover } from "./staggerRecover";
import { staggerTransfer } from "./staggerTransfer";

/** The record of `IFootprintResult`'s site. */
type IFootprintResult = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  relative: IAutoMovieVector3[];
};

/** The alternatives of `OfEntryItem`'s site. */
type OfEntryItem = "forward" | "side" | "backward";

/** The record of `IFootprintsEntryItem`'s site. */
type IFootprintsEntryItem = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  relative: IAutoMovieVector3[];
};

/** The alternatives of `StaggerPendulumBendEntry`'s site. */
type StaggerPendulumBendEntry = "pitch" | "roll";

/**
 * A pushed body's centre of mass over the floor as Hof's inverted pendulum
 * (Hof, Gazendam and Sinke 2005; Hof 2008), with the feet and the steps that
 * bear it: the state a recovery's steps advance (`staggerRecover`).
 *
 * The travel `s` and the velocity `v` are horizontal, from the entry's centre
 * of mass; the extrapolated centre of mass is `s + v / omega`. Each span holds
 * a centre of pressure, as near the extrapolated centre of mass as the bearing
 * feet reach, and is integrated in closed form; the spans are kept as phases
 * the courses read.
 *
 * The entry's fixed geometry (`prepare`: the centre, root, heading, feet and
 * soles' extents) is read once per search and shared by every speed and foot
 * order it probes. This instance owns the actual state and phases; private
 * source-footprint and integration helpers serve the public support and advance
 * operations. Exact footprint snapshots retain at most one outline per side,
 * alongside the actual phases and steps, until reset or release. Prefix
 * snapshots remain owned by the same complete body/entry/push/speed search.
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
  public readonly entered: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanFoot.IPlacement
  >;

  /**
   * The narrowest the feet stand, ankle to ankle across the heading, side by
   * side with their outlines touching.
   */
  public readonly width: number;

  /** A sole's length along the heading. */
  public readonly length: number;

  /**
   * The centre of mass's shift per sine of the trunk's pitch and roll on the
   * entry's feet, metres (`staggerKnots.bending`).
   */
  public readonly bend: Record<StaggerPendulumBendEntry, IAutoMovieVector3>;

  /** The feet as the steps so far placed them. */
  public feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

  /**
   * The spans so far: each start, its centre of pressure and the state it
   * started from.
   */
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
  private readonly footprints: Partial<
    Record<AutoMovieHumanSide, IFootprintsEntryItem>
  > = {};

  /**
   * Start one push's pendulum on its entry's fixed geometry.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param fixed The entry's geometry (`prepare`) for this same body and entry,
   *   shared by every speed one search probes; read here when absent.
   */
  public constructor(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    fixed: ReturnType<
      typeof staggerPendulumEntry.prepare
    > = staggerPendulumEntry.prepare(body, entry),
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

  /** A point on the floor. */
  public static flat(p: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: p.x, y: 0, z: p.z };
  }

  /** The state back to the push. */
  public reset(): void {
    this.feet = { ...this.entered };
    this.phases = [];
    this.steps = [];
    this.s = { x: 0, y: 0, z: 0 };
    this.v = Vector3.scale(StaggerPendulum.flat(this.push), this.speed);
    this.t = 0;
  }

  /** The state, to take up again with restore. */
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

  /** Take up a state snapshot kept. */
  public restore(state: staggerRecover.IState): void {
    this.feet = { ...state.feet };
    this.phases = [...state.phases];
    this.steps = [...state.steps];
    this.s = state.s;
    this.v = state.v;
    this.t = state.t;
  }

  /** The extrapolated centre of mass, from the entry's centre of mass. */
  public xi(): IAutoMovieVector3 {
    return Vector3.add(this.s, Vector3.scale(this.v, 1 / this.w));
  }

  /** The bearing feet's convex outline from the entry's centre of mass. */
  public bearing(sides: readonly AutoMovieHumanSide[]): IAutoMovieVector3[] {
    return AutoMovieEngineMath.convexHull2D(
      sides.flatMap(
        (side: AutoMovieHumanSide): IAutoMovieVector3[] =>
          this.footprint(side, this.feet[side]).relative,
      ),
    );
  }

  /** Whether xi lies inside both feet's base, Koolen's zero-step capture region. */
  public captured(): boolean {
    const base: IAutoMovieVector3[] = this.bearing(["left", "right"]);
    return base.length >= 3 && AutoMovieEngineMath.pointInHull(this.xi(), base);
  }

  /**
   * A span of the pendulum: the centre of pressure as near the extrapolated
   * centre of mass as the bearing feet reach (on it, which holds it, or at the
   * nearest point of their outline).
   */
  public bear(sides: readonly AutoMovieHumanSide[], seconds: number): void {
    this.advance(staggerNearest(this.bearing(sides), this.xi()), seconds);
  }

  /**
   * The centre of pressure where the last span left it, from the entry's centre
   * of mass: a weight shift's end, or a held span's point; before any span, the
   * point of both feet's outline nearest the extrapolated centre of mass, where
   * the push's first span holds it.
   */
  public pressure(): IAutoMovieVector3 {
    const last: staggerRecover.IPhase | undefined = this.phases.at(-1);
    return last === undefined
      ? staggerNearest(this.bearing(["left", "right"]), this.xi())
      : (last.to ?? last.p);
  }

  /**
   * The weight's transfer onto the stance foot before a step: a foot cannot
   * leave the floor bearing weight, nor bear it as it touches down, so the
   * centre of pressure travels from where it stands onto the stance foot's
   * outline by lift-off, loading a foot that has just landed and unloading the
   * one about to leave, over the measured weight-transfer phase (Cyr, Moglo and
   * Smeesters 2005), on a minimum-jerk course (the model's choice; no source
   * gives the trace of a reactive step's), the pendulum integrated under it
   * exactly in one span (`staggerTransfer`).
   *
   * The course ends where the swing that follows holds the centre of pressure,
   * the stance foot's point nearest the extrapolated centre of mass at lift-off
   * (`hold`), so the pressure runs on without a jump from the weight shift into
   * the swing, as it does from the touch-down into the next shift: it moves
   * continuously under the feet, rolling onto the stance foot and shifting
   * between the feet over double support, as the extrapolated centre of mass's
   * stepping models have it (Hof 2008, Hum Mov Sci 27:112). The end is the
   * fixed point of that rule: the extrapolated centre of mass at lift-off is
   * affine in the end, `a + c q` with one scalar `c` of magnitude under one
   * (the end acts through the span's course, `|c| = omega * integral of
   * e^(omega (T - t)) s(t / T) dt` over the span, under 0.3 at the measured 138
   * ms), and the projection onto the convex outline does not expand distances,
   * so the rule contracts and is iterated to `FIXED`.
   */
  public transfer(stance: AutoMovieHumanSide, seconds: number): void {
    // It leaves from where the centre of pressure stands, so the weight
    // reaches a foot that has just landed over this transfer, its loading,
    // and never at its touch-down.
    const p0: IAutoMovieVector3 = this.pressure();

    // It ends where the swing holds it: the stance foot's point nearest the
    // extrapolated centre of mass at the shift's end, the fixed point of a
    // contraction.
    const outline: IAutoMovieVector3[] = this.bearing([stance]);
    const lifted: (q: IAutoMovieVector3) => IAutoMovieVector3 = (
      q: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const end: ReturnType<typeof staggerTransfer> = staggerTransfer(
        { p: p0, s: this.s, v: this.v },
        q,
        seconds,
        this.w,
        seconds,
      );
      return Vector3.add(end.s, Vector3.scale(end.v, 1 / this.w));
    };
    let p1: IAutoMovieVector3 = staggerNearest(outline, this.xi());
    for (let k: number = 0; k < StaggerPendulum.PASSES; k++) {
      const next: IAutoMovieVector3 = staggerNearest(outline, lifted(p1));
      const moved: number = Vector3.distance(next, p1);
      p1 = next;
      if (moved <= StaggerPendulum.FIXED) break;
    }

    // One span in closed form over the whole shift (`staggerTransfer`).
    this.phases.push({
      from: this.t,
      p: p0,
      s: this.s,
      v: this.v,
      to: p1,
      span: seconds,
    });
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
   * held there once it has taken the weight: the point the extrapolated centre
   * of mass reaches at the end of a weight shift onto it, the shift running
   * from where the pressure stands (`pressure`) over `seconds`. A foot takes no
   * weight as it touches down, so the extrapolated centre of mass runs on over
   * its loading, and a capture step aims where it will be then, the divergent
   * component's continuous double support (Englsberger, Ott and Albu-Schaffer
   * 2015, IEEE Trans Robot 31:355). The extrapolated centre of mass at the
   * shift's end is affine in its target, `a + c q` with one scalar `c`
   * (`transfer`), so the point is `a / (1 - c)` in closed form.
   *
   * @param seconds The weight shift's span.
   * @returns The point, from the entry's centre of mass, on the floor.
   */
  public loaded(seconds: number): IAutoMovieVector3 {
    const p0: IAutoMovieVector3 = this.pressure();
    const xiAt: (q: IAutoMovieVector3) => IAutoMovieVector3 = (
      q: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const end: ReturnType<typeof staggerTransfer> = staggerTransfer(
        { p: p0, s: this.s, v: this.v },
        q,
        seconds,
        this.w,
        seconds,
      );
      return StaggerPendulum.flat(
        Vector3.add(end.s, Vector3.scale(end.v, 1 / this.w)),
      );
    };
    const a: IAutoMovieVector3 = xiAt({ x: 0, y: 0, z: 0 });
    const c: number = xiAt({ x: 1, y: 0, z: 0 }).x - a.x;
    return Vector3.scale(a, 1 / (1 - c));
  }

  /**
   * The pendulum over a span with its centre of pressure held where the last
   * span left it (`pressure`): a swing's, on the stance foot where the weight
   * shift put it.
   */
  public hold(seconds: number): void {
    this.advance(this.pressure(), seconds);
  }

  /** The pendulum over a span with its centre of pressure held. */
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

  /** The current spans as world-metre, action-local-second course readers. */
  public courses(): staggerRecover.ICourses {
    return staggerPendulumCourses(this.phases, this.w, this.centre);
  }

  /**
   * A step's measured bound in its direction from the performer's heading:
   * between the forward, sideways and backward values on an ellipse.
   */
  public bound(
    direction: IAutoMovieVector3,
    of: Readonly<Record<OfEntryItem, number>>,
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
  private footprint(
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
  ): IFootprintResult {
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
    )
      return known;
    const world: IAutoMovieVector3[] = HumanFoot.sole(
      this.body,
      side,
      placement,
    );
    const made: NonNullable<(typeof this.footprints)["left"]> = {
      placement: {
        ankle: { ...placement.ankle },
        rotation: { ...placement.rotation },
      },
      relative: world.map(
        (q: IAutoMovieVector3): IAutoMovieVector3 =>
          StaggerPendulum.flat(Vector3.subtract(q, this.centre)),
      ),
    };
    this.footprints[side] = made;
    return made;
  }

  /**
   * How near, metres, a weight shift's end comes to its fixed point
   * (`transfer`): a nanometre, far under any displayed length.
   */
  private static readonly FIXED: number = 1e-9;

  /**
   * The most passes of a weight shift's fixed point (`transfer`): at a
   * contraction under 0.3 a pass, 64 passes leave 3e-34 of the first error, so
   * the bound only guards a degenerate span.
   */
  private static readonly PASSES: number = 64;
}
