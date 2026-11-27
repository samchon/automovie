import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEnginePhysicalDisturbanceForm } from "./AutoMovieEnginePhysicalDisturbanceForm";
import { AutoMovieEnginePhysicalIcpPlannerTools as Tools } from "./AutoMovieEnginePhysicalIcpPlannerTools";
import { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";
import { AutoMovieEnginePhysicalSupportSpanContacts as Contacts } from "./AutoMovieEnginePhysicalSupportSpanContacts";

/** One closed form of a plan's capture point (`AutoMovieEnginePhysicalDisturbanceForm`). */
type IForm = AutoMovieEnginePhysicalDisturbanceForm.IForm;

/** A plan's capture point as consecutive closed forms. */
type IReference = AutoMovieEnginePhysicalDisturbanceForm.IReference;

/** One closed-form piece of the response. */
type IPiece = AutoMovieEnginePhysicalDisturbanceForm.IPiece;

/** A capture point and centre of mass at an instant. */
type IState = AutoMovieEnginePhysicalDisturbanceForm.IState;

/** The closed forms the response follows and samples. */
const {
  ZULU,
  add,
  capture,
  center,
  decompose,
  formAt,
  scaled,
  shift,
  toLocal,
  toWorld,
  value,
}: typeof AutoMovieEnginePhysicalDisturbanceForm = AutoMovieEnginePhysicalDisturbanceForm;

/**
 * A disturbance response followed piece by piece
 * (`preparePhysicalDisturbanceSpan`): the ICP controller's error and
 * centre-of-pressure constraint over a plan, the swing feet's cubics and the
 * prepared span's sampling.
 */
export namespace AutoMovieEnginePhysicalDisturbanceFollow {
  /**
   * The response over an interval tracking a reference on a support, piece by
   * piece: at each form's start the error is split again; while the unconstrained
   * pivot lies outside the support the pivot is held there. Pushes its pieces and
   * returns the state at the interval's end.
   */
  export function follow(
    pieces: IPiece[],
    input: {
      phase: IPiece["phase"];
      reference: IReference;
      support: readonly Polygon.IPoint[];
      start: number;
      end: number;
      xi: Tools.IFloor;
      c: Tools.IFloor;
      omega: number;
    },
  ): IState {
    const { omega } = input;
    let t: number = input.start;
    let state: IState = { xi: input.xi, c: input.c };
    const push = (piece: IPiece): void => {
      pieces.push(piece);
      if (piece.end !== Infinity)
        state = {
          xi: capture(piece, piece.end, omega).position,
          c: center(piece, piece.end, omega),
        };
    };
    for (let guard: number = 0; guard < 65536 && t < input.end; ++guard) {
      const form: IForm = formAt(input.reference, t);
      const next: number | undefined = input.reference.find(
        (candidate: IForm): boolean => candidate.start > t,
      )?.start;
      const until: number = Math.min(
        input.end,
        next ?? Number.POSITIVE_INFINITY,
      );
      const desired: Tools.IState = value(form, t, omega);
      const split: { b: Tools.IFloor; rate: number; gain: number }[] =
        decompose(desired.velocity, add(state.xi, desired.position, -1), omega);
      const unconstrained: Tools.IFloor = split.reduce(
        (sum: Tools.IFloor, term): Tools.IFloor =>
          add(sum, term.b, 1 + term.gain),
        add(desired.position, desired.velocity, -1 / omega),
      );
      if (
        input.support.length < 3 ||
        Polygon.inside(input.support, toLocal(unconstrained))
      ) {
        push({
          start: t,
          end: until,
          phase: input.phase,
          saturated: false,
          form: shift(form, t, omega),
          errors: split.map((term) => ({ b: term.b, rate: term.rate })),
          c0: state.c,
        });
        t = until;
        continue;
      }

      // The pivot held on the support: xi = cmp + (xi0 - cmp) e^(omega u).
      const held: Tools.IFloor = toWorld(
        Polygon.project(input.support, toLocal(unconstrained)),
      );
      const d: Tools.IFloor = add(state.xi, held, -1);
      const exit: number =
        form.kind === "exp"
          ? reentry(
              {
                ...form,
                start: t,
                r: scaled(form.r, Math.exp(omega * (t - form.start))),
              },
              held,
              d,
              split,
              input.support,
              omega,
            )
          : crossing(form, held, d, split, input.support, t, until, omega);
      // The program's active constraint is taken again each control period,
      // as the controller solves it once per update (Zulu's period), the projection held over the period.
      const period: number = Math.min(until, t + ZULU.controlDt);
      const stop: number = exit > t && exit < period ? exit : period;
      push({
        start: t,
        end: stop,
        phase: input.phase,
        saturated: true,
        form: { kind: "exp", start: t, q: held, r: d },
        errors: [],
        c0: state.c,
      });
      t = stop;
    }
    return state;
  }

  /**
   * When the unconstrained pivot comes back inside the support while the pivot is
   * held over a cubic reference: its path, the cubic's pivot xi_d - xi_d' / omega
   * plus the gain on xi - xi_d with xi = cmp + d e^(omega u), mixes a polynomial
   * and an exponential, so its first entry is bracketed on a grid of the interval
   * and refined by bisection, once as the response is prepared. The interval's
   * end, when it stays outside.
   */
  export function crossing(
    form: IForm,
    held: Tools.IFloor,
    d: Tools.IFloor,
    split: readonly { b: Tools.IFloor; gain: number }[],
    support: readonly Polygon.IPoint[],
    start: number,
    until: number,
    omega: number,
  ): number {
    if (until === Infinity) return until;
    const gain: number = 1 + (split[0]?.gain ?? 0);
    const inside = (time: number): boolean => {
      const desired: Tools.IState = value(form, time, omega);
      const xi: Tools.IFloor = add(held, d, Math.exp(omega * (time - start)));
      const pivot: Tools.IFloor = add(
        add(desired.position, desired.velocity, -1 / omega),
        add(xi, desired.position, -1),
        gain,
      );
      return Polygon.inside(support, toLocal(pivot));
    };
    const grid: number = 64;
    let before: number = start;
    for (let i: number = 1; i <= grid; ++i) {
      const time: number = start + ((until - start) * i) / grid;
      if (inside(time)) {
        let low: number = before;
        let high: number = time;
        for (let j: number = 0; j < 48; ++j) {
          const middle: number = (low + high) / 2;
          if (inside(middle)) high = middle;
          else low = middle;
        }
        return high;
      }
      before = time;
    }
    return until;
  }

  /**
   * When the unconstrained pivot comes back inside the support while the pivot is
   * held, over a reference form with a constant pivot q from the same start: with
   * xi = cmp + d s and xi_d = q + r s, s = e^(omega u), the pivot q + K (cmp
   *
   * - Q + (d - r) s) moves along a line in s, inside a convex polygon over an
   *   interval of s found edge by edge. Never, when it stays outside.
   */
  export function reentry(
    form: Extract<IForm, { kind: "exp" }>,
    held: Tools.IFloor,
    d: Tools.IFloor,
    split: readonly { b: Tools.IFloor; gain: number }[],
    support: readonly Polygon.IPoint[],
    omega: number,
  ): number {
    // The gain operator of the split: K v = sum (1 + k_i) (v . u_i) u_i over
    // its unit directions, or (1 + k) v for a single gain.
    const units: { u: Tools.IFloor; k: number }[] = split
      .filter((term) => Math.hypot(term.b.x, term.b.z) > 0)
      .map((term) => ({
        u: scaled(term.b, 1 / Math.hypot(term.b.x, term.b.z)),
        k: 1 + term.gain,
      }));
    const gain = (v: Tools.IFloor): Tools.IFloor =>
      split.length === 1 || units.length < 2
        ? scaled(v, 1 + (split[0]?.gain ?? 0))
        : units.reduce(
            (sum: Tools.IFloor, unit): Tools.IFloor =>
              add(sum, unit.u, unit.k * (v.x * unit.u.x + v.z * unit.u.z)),
            { x: 0, z: 0 },
          );
    const base: Tools.IFloor = add(form.q, gain(add(held, form.q, -1)));
    const slope: Tools.IFloor = gain(add(d, form.r, -1));
    const b0: Polygon.IPoint = toLocal(base);
    const b1: Polygon.IPoint = toLocal(add(base, slope));
    const direction: Polygon.IPoint = { x: b1.x - b0.x, y: b1.y - b0.y };
    const centre: Polygon.IPoint = Polygon.centroid([...support]);
    let lower: number = 1;
    let upper: number = Number.POSITIVE_INFINITY;
    for (let i: number = 0; i < support.length; ++i) {
      const a: Polygon.IPoint = support[i]!;
      const b: Polygon.IPoint = support[(i + 1) % support.length]!;
      const cross = (p: Polygon.IPoint): number =>
        (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      const sign: number = cross(centre) >= 0 ? 1 : -1;
      const alpha: number = sign * cross(b0);
      const beta: number =
        sign * ((b.x - a.x) * direction.y - (b.y - a.y) * direction.x);
      if (beta > 0) lower = Math.max(lower, -alpha / beta);
      else if (beta < 0) upper = Math.min(upper, -alpha / beta);
      else if (alpha < 0) upper = Number.NEGATIVE_INFINITY;
    }
    if (lower > upper) return Number.POSITIVE_INFINITY;
    return form.start + Math.log(lower) / omega;
  }

  /** A swing foot's cubic to its footstep. */
  export interface ISwing {
    /** The swinging foot's endpoint bone. */
    bone: string;

    /** When the cubic starts and lands, local seconds. */
    start: number;

    /** When it lands. */
    end: number;

    /** Where and how fast the foot is as the cubic starts. */
    from: Tools.IState;

    /** The footstep. */
    to: Tools.IFloor;
  }

  /** A swing foot's place and rate at a time on its latest cubic. */
  export function swingAt(
    swings: readonly ISwing[],
    bone: string,
    seconds: number,
  ): Tools.IState {
    let swing: ISwing | undefined;
    for (const candidate of swings)
      if (candidate.bone === bone && candidate.start <= seconds)
        swing = candidate;
    if (swing === undefined) throw new Error(`No swing of ${bone}.`);
    if (seconds >= swing.end)
      return { position: swing.to, velocity: { x: 0, z: 0 } };
    return Tools.cubic(
      {
        duration: swing.end - swing.start,
        initial: swing.from.position,
        initialVelocity: swing.from.velocity,
        final: swing.to,
        finalVelocity: { x: 0, z: 0 },
      },
      seconds - swing.start,
    );
  }

  /** The span from its pieces. */
  export function span(input: {
    pieces: readonly IPiece[];
    branches: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanBranch[];
    footstep: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult["footstep"];
    input: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanInput;
    until: number;
    feet: (seconds: number) => Record<string, Tools.IFloor>;
    contacts: (seconds: number) => string[];
    outline: (bone: string, at: Tools.IFloor) => Tools.IFloor[];
  }): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult {
    const { pieces } = input;
    const { omega, mass, gravity, floor } = input.input;
    return {
      branches: input.branches,
      ...(input.footstep ? { footstep: input.footstep } : {}),
      until: input.until,
      sample: (seconds: number): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample => {
        const piece: IPiece | undefined =
          pieces.find((p: IPiece): boolean => seconds < p.end) ??
          pieces[pieces.length - 1];
        if (piece === undefined) throw new Error("A span has no piece.");
        const at: number = Math.max(piece.start, seconds);
        const xi: Tools.IState = capture(piece, at, omega);
        const c: Tools.IFloor = center(piece, at, omega);
        const cmp: Tools.IFloor = add(xi.position, xi.velocity, -1 / omega);
        const feet: Record<string, Tools.IFloor> = input.feet(seconds);
        const planted: string[] = input.contacts(seconds);

        // The weight's split over the planted limbs' outlines at the pivot,
        // for any number (`AutoMovieEnginePhysicalSupportSpanContacts.loads`).
        // Each outline vertex is a contact of its own, so the pivot held on the
        // outlines' hull has a split; a limb's share is its vertices' sum.
        const vertices: Contacts.IContact[] = planted.flatMap(
          (bone: string): Contacts.IContact[] =>
            input.outline(bone, feet[bone]!).map(
              (point: Tools.IFloor, k: number): Contacts.IContact => ({
                bone: `${bone}#${k}`,
                points: [point],
              }),
            ),
        );
        const loads: Record<string, number> = Object.fromEntries(
          planted.map((bone: string): [string, number] => [bone, 0]),
        );
        Contacts.loads(vertices, cmp).forEach(
          (load: Contacts.ILoad, k: number): void => {
            const bone: string = vertices[k]!.bone.slice(
              0,
              vertices[k]!.bone.lastIndexOf("#"),
            );
            loads[bone] = (loads[bone] ?? 0) + load.share;
          },
        );
        return {
          phase: piece.phase,
          saturated: piece.saturated,
          capture: xi.position,
          captureVelocity: xi.velocity,
          pivot: cmp,
          center: { x: c.x, y: input.input.center.y, z: c.z },
          centerVelocity: {
            x: omega * (xi.position.x - c.x),
            y: 0,
            z: omega * (xi.position.z - c.z),
          },
          feet: Object.fromEntries(
            Object.entries(feet).map(
              ([bone, p]: [string, Tools.IFloor]): [
                string,
                IAutoMovieVector3,
              ] => [bone, { x: p.x, y: floor, z: p.z }],
            ),
          ),
          reaction: {
            point: { x: cmp.x, y: floor, z: cmp.z },
            force: {
              x: mass * omega * omega * (c.x - cmp.x),
              y: mass * gravity,
              z: mass * omega * omega * (c.z - cmp.z),
            },
          },
          loads,
        };
      },
    };
  }
}
