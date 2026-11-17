import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanFoot, IAutoMovieVector3 } from "@automovie/interface";

import {
  Vector3,
  convexHull2D,
  minimumJerk,
  pointInHull,
} from "@automovie/engine";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import type { staggerRecover } from "./staggerRecover";

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

  /**
   * A pendulum at the push.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   */
  public constructor(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
  ) {
    this.body = body;
    this.entry = entry;
    this.push = push;
    this.speed = speed;
    this.w = staggerBounds.omega(body);
    this.centre = HumanBalance.support(body, entry.posture).centre;
    this.root = entry.posture.root;
    this.forward = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    this.across = { x: this.forward.z, y: 0, z: -this.forward.x };
    this.entered = StrikingTarget.feet(entry);
    this.feet = { ...this.entered };
    this.v = Vector3.scale(StaggerPendulum.flat(push), speed);
    this.width = this.extent(this.across);
    this.length = this.extent(this.forward);
  }

  /** A point on the floor. */
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
      const u: number =
        span > 0
          ? Math.min(
              1,
              Math.max(0, Vector3.dot(Vector3.subtract(point, a), ab) / span),
            )
          : 0;
      const q: IAutoMovieVector3 = Vector3.add(a, Vector3.scale(ab, u));
      const d: number = Vector3.length(Vector3.subtract(point, q));
      if (d < gap) {
        gap = d;
        best = q;
      }
    }
    return best;
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

  /** The state, to take up again (`restore`). */
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

  /** Take up a state `snapshot` kept. */
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

  /** The feet that bear the body, as one outline from the entry's centre of mass. */
  public bearing(sides: readonly ("left" | "right")[]): IAutoMovieVector3[] {
    return convexHull2D(
      sides.flatMap((side: "left" | "right"): IAutoMovieVector3[] =>
        HumanFoot.sole(this.body, side, this.feet[side]).map(
          (q: IAutoMovieVector3): IAutoMovieVector3 =>
            StaggerPendulum.flat(Vector3.subtract(q, this.centre)),
        ),
      ),
    );
  }

  /** Whether the extrapolated centre of mass lies inside the base the two feet make, the zero-step capture region (Koolen et al. 2012). */
  public captured(): boolean {
    const base: IAutoMovieVector3[] = this.bearing(["left", "right"]);
    return base.length >= 3 && pointInHull(this.xi(), base);
  }

  /**
   * A span of the pendulum: the centre of pressure as near the extrapolated
   * centre of mass as the bearing feet reach (on it, which holds it, or at
   * the nearest point of their outline).
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
    for (let i: number = 0; i < count; i++)
      this.advance(
        Vector3.lerp(p0, p1, minimumJerk((i + 0.5) / count).s),
        seconds / count,
      );
  }

  /** The pendulum over a span with its centre of pressure held. */
  public advance(p: IAutoMovieVector3, seconds: number): void {
    const w: number = this.w;
    this.phases.push({ from: this.t, p, s: this.s, v: this.v });
    const ch: number = Math.cosh(w * seconds);
    const sh: number = Math.sinh(w * seconds);
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

  /**
   * The pendulum's spans so far read at a second: the centre of mass's
   * travel, and the centre of pressure and the extrapolated centre of mass
   * on the floor, world metres; on a span xi - p grows as e^(omega t). The
   * readings hold the spans as they stand when this is called.
   */
  public courses(): staggerRecover.ICourses {
    const phases: readonly staggerRecover.IPhase[] = this.phases;
    const w: number = this.w;
    const centre: IAutoMovieVector3 = this.centre;
    const phaseAt = (seconds: number) => {
      let phase = phases[0]!;
      for (const q of phases) if (q.from <= seconds) phase = q;
      return { phase, u: Math.max(0, seconds - phase.from) };
    };
    return {
      course: (seconds: number): IAutoMovieVector3 => {
        const { phase, u } = phaseAt(seconds);
        return Vector3.add(
          Vector3.add(
            phase.p,
            Vector3.scale(Vector3.subtract(phase.s, phase.p), Math.cosh(w * u)),
          ),
          Vector3.scale(phase.v, Math.sinh(w * u) / w),
        );
      },
      pressure: (seconds: number): IAutoMovieVector3 =>
        StaggerPendulum.flat(Vector3.add(centre, phaseAt(seconds).phase.p)),
      extrapolated: (seconds: number): IAutoMovieVector3 => {
        const { phase, u } = phaseAt(seconds);
        return StaggerPendulum.flat(
          Vector3.add(
            centre,
            Vector3.add(
              phase.p,
              Vector3.scale(
                Vector3.subtract(
                  Vector3.add(phase.s, Vector3.scale(phase.v, 1 / w)),
                  phase.p,
                ),
                Math.exp(w * u),
              ),
            ),
          ),
        );
      },
    };
  }

  /**
   * A step's measured bound in its direction from the performer's heading:
   * between the forward, sideways and backward values on an ellipse.
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

  /** The feet's greatest extent along an axis, a sole's. */
  private extent(axis: IAutoMovieVector3): number {
    return Math.max(
      ...(["left", "right"] as const).map((side: "left" | "right"): number => {
        const along: number[] = HumanFoot.sole(
          this.body,
          side,
          this.entered[side],
        ).map((q: IAutoMovieVector3): number =>
          Vector3.dot(Vector3.subtract(q, this.entered[side].ankle), axis),
        );
        return Math.max(...along) - Math.min(...along);
      }),
    );
  }
}
