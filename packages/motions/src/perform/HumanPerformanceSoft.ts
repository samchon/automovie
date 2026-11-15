import {
  type IAutoMovieSoftBodyBoundarySample,
  type IAutoMovieSoftBodyObserver,
  simulateSoftBodyWithBoundaries,
} from "@automovie/engine";
import type {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanForce } from "./HumanForce";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSoftBoundary } from "./HumanPerformanceSoftBoundary";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import type { IHumanProp } from "./IHumanProp";

/**
 * A performance's soft props: each solved once from the displayed poses of
 * the people who hold it or whose bodies it lies on, at its domain's own
 * fixed step, and read by film seconds.
 *
 * The pass runs after every action is placed. For each step k of the
 * domain's `fixedStepSeconds` from film second 0 to the performance's end,
 * it reads the displayed bones at second k dt and builds that step's
 * boundary: the world point of every moving anchor (an `actor-bone` binding
 * on its person's bone, a `node` binding on a rigid prop of that subject)
 * and the world segment of every body capsule. A hand's grip on the prop
 * (any grip window or hold on it, as `HumanPerformanceRead.grips` lists them)
 * binds the particle nearest the hand's grip socket when the grip closes,
 * read from the solve as it stands then, to that socket for the window, and
 * releases it after, so the particle falls with the velocity the hand gave
 * it. Two hands on one particle (a handover's shared window) bind it to the
 * hand that closed last, as a rigid prop rides the last grip. The engine
 * solves the whole span once (`simulateSoftBodyWithBoundaries` with an
 * observer that keeps every step), replaying from step 0 once per grip that
 * picks its particle from the solve, so W grips cost W + 1 solves.
 *
 * A read at a film second interpolates linearly between the two steps
 * around it, so a seek costs no solve and two frame rates read the same
 * state at a shared second. The coupling is one-way: the cloth never moves
 * the body (tension enters the hand as a load through `load`, read from the
 * compliant solver's multipliers).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the pass runs, how each step's boundary is built, how grips choose and release their particles, the solve count, the read's interpolation and the one-way coupling.
 * @evidence contracts/development/design.md#principled-representation A per-performance cache of each soft prop's every step, keyed by the performance's state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanPerformance.soft` and `load` read; the solver is the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The domain's own anchors, capsules and budgets; nothing is invented when a bone or prop is missing: the read throws.
 */
export namespace HumanPerformanceSoft {
  /** One soft prop solved over the whole performance. */
  export interface ISolved {
    /** The domain's step, seconds. */
    dt: number;

    /** Every step's particle positions, step 0 the rest as boundaried, world metres row-major. */
    steps: Float64Array[];

    /** Every step's force on each gripping hand, by `subject:side`, newtons, world frame; empty at a step with no compliant multipliers. */
    loads: Map<string, IAutoMovieVector3>[];
  }

  /**
   * A soft prop's particle positions at a film second.
   *
   * @param state The performance.
   * @param subject The soft prop.
   * @param seconds Film seconds, clamped to the performance.
   * @returns World metres, row-major `[x, y, z, ...]`.
   * @throws {HumanRefusal} When the prop is not soft or its span exceeds its domain's step budget.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the clamp and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation between the two fixed steps around the second, the solve's own states.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cached solve and one interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The interpolation reads only solved states; nothing is re-solved per read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in particles per read after the one solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The solve is kept per performance state and prop subject, both fixed once the performance is placed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cache is a weak map on the state, released with the performance; each prop keeps (steps + 1) x 3P doubles.
   */
  export function at(
    state: HumanPerformanceState,
    subject: string,
    seconds: number,
  ): number[] {
    const solved: ISolved = of(state, subject);
    const last: number = solved.steps.length - 1;
    const t: number = Math.max(0, Math.min(last, seconds / solved.dt));
    const k: number = Math.min(last, Math.floor(t));
    const share: number = t - k;
    const a: Float64Array = solved.steps[k]!;
    const b: Float64Array = solved.steps[Math.min(last, k + 1)]!;
    return Array.from(a, (v: number, i: number): number =>
      share === 0 ? v : v + (b[i]! - v) * share,
    );
  }

  /**
   * The force a soft prop pulls a gripping hand with at a film second: the
   * step's anchor force from the compliant solver, the step before the
   * second's (a force is held over its step, not interpolated).
   *
   * @param state The performance.
   * @param subject The soft prop.
   * @param person The gripping person.
   * @param side The hand.
   * @param seconds Film seconds.
   * @returns Newtons, world frame; zero when the hand does not hold it or the domain declares no compliance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the frame, the step read and the zero cases.
   * @evidence contracts/development/implementation.md#principled-implementation XPBD's constraint force at the anchor, recorded by the engine's observer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cached solve and one lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A plain position-based solve has no forces and reports zero rather than an estimate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after the one solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `at`'s solve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the shared solve.
   */
  export function load(
    state: HumanPerformanceState,
    subject: string,
    person: string,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3 {
    const solved: ISolved = of(state, subject);
    const k: number = Math.max(
      0,
      Math.min(solved.loads.length - 1, Math.floor(seconds / solved.dt)),
    );
    return solved.loads[k]?.get(`${person}:${side}`) ?? { x: 0, y: 0, z: 0 };
  }

  /**
   * Every soft prop's pull on the hands that grip it, as sustained forces
   * for the display-time load and balance (#3431, #3451): one record per grip
   * window on a soft prop, on the gripping person's palm of that side, over
   * the window, its force the compliant solver's anchor force at the step
   * before each second (`load`). The coupling is one-way per solve: the cloth
   * is solved from the displayed body, and the body's lean is then read from
   * these forces, never fed back into the solve or into a law's plan.
   *
   * @param state The performance.
   * @returns The forces, in prop and grip order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each record holds, where it acts, its window and the one-way order.
   * @evidence contracts/development/implementation.md#principled-implementation The XPBD anchor force recorded per gripping hand, read back at a film second as a pure function.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record per grip window, its force delegated to `load`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip worn on a bone is no hand's load and is left out; a plain solve's force reads zero rather than an estimate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the soft props' grip windows; each force read is constant work on the kept solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the solve `at` and `load` keep.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records; the solves are kept by `of`.
   */
  export function sustained(
    state: HumanPerformanceState,
  ): HumanForce.ISustained[] {
    const out: HumanForce.ISustained[] = [];
    for (const prop of state.props.values()) {
      if (prop.soft === undefined) continue;
      for (const g of HumanPerformanceRead.grips(state, prop.subject)) {
        if (g.bone !== undefined) continue;
        const subject: string = prop.subject;
        out.push({
          kind: "sustained",
          subject: g.subject,
          at: g.side === "left" ? "palmLeft" : "palmRight",
          from: g.from,
          to: g.to,
          force: (seconds: number): IAutoMovieVector3 =>
            HumanPerformanceSoft.load(state, subject, g.subject, g.side, seconds),
        });
      }
    }
    return out;
  }

  /**
   * A soft prop's whole solve, made on first read and kept.
   *
   * @param state The performance.
   * @param subject The soft prop.
   * @returns The solve.
   * @throws {HumanRefusal} When the prop is not soft or its span exceeds its domain's step budget.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cache and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Boundaries from the displayed bones at every fixed step, the grips' particles chosen from the solve at their closing step, the engine's one replay with an observer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Boundaries, then grips in time order, then the final solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An over-budget span is refused with its budget named, never truncated.
   * @evidence contracts/development/implementation.md#efficient-algorithms (W + 1) replays of K steps for W grips, each linear in particles times sweeps; the displayed bones are read once per step and person.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Kept per state and subject.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak in the state; (K + 1) x 3P doubles per prop.
   */
  export function of(state: HumanPerformanceState, subject: string): ISolved {
    let memo: Map<string, ISolved> | undefined = SOLVED.get(state);
    if (memo === undefined) {
      memo = new Map();
      SOLVED.set(state, memo);
    }
    const known: ISolved | undefined = memo.get(subject);
    if (known !== undefined) return known;
    const prop: IHumanProp | undefined = state.props.get(subject);
    const domain: IAutoMovieSoftBodyDomain | undefined = prop?.soft;
    if (domain === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: subject,
        feasible: {
          kind: "alternatives",
          values: [...state.props.values()]
            .filter((p: IHumanProp): boolean => p.soft !== undefined)
            .map((p: IHumanProp): string => p.subject),
        },
        reason: `the prop ${subject} has no soft domain`,
        fix: "read a prop that declares `soft`",
      });
    const dt: number = domain.solver.fixedStepSeconds;
    const count: number = Math.ceil(state.duration / dt - 1e-9);
    if (count > domain.solver.maxSteps)
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${subject}.soft.solver.maxSteps`,
        value: count,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: domain.solver.maxSteps,
          unit: "steps",
          whole: true,
        },
        reason: `the performance lasts ${state.duration} s, ${count} steps of ${dt} s, past the domain's budget of ${domain.solver.maxSteps}`,
        fix: "raise the domain's maxSteps within the engine's soft budget, or lengthen its step",
      });

    // The displayed bones of every person the domain or a grip names, read
    // once per step.
    const bones: HumanPerformanceSoftBoundary.BoneReader = HumanPerformanceSoftBoundary.memoBones(state);
    const grips: HumanPerformanceSoftBoundary.IGripAnchor[] = [];
    const solve = (
      upto: number,
      record: boolean,
    ): Pick<HumanPerformanceSoft.ISolved, "steps" | "loads"> => {
      const anchored: IAutoMovieSoftBodyDomain = {
        ...domain,
        anchors: [
          ...domain.anchors.filter(
            (a: IAutoMovieSoftAnchor): boolean =>
              !grips.some(
                (g: HumanPerformanceSoftBoundary.IGripAnchor): boolean => g.particle === a.particle,
              ),
          ),
          ...[
            ...new Set(grips.map((g: HumanPerformanceSoftBoundary.IGripAnchor): number => g.particle)),
          ].map(
            (particle: number): IAutoMovieSoftAnchor => ({
              id: `${HumanPerformanceSoftBoundary.GRIP}${particle}`,
              particle,
              position: null,
              binding: {
                kind: "node",
                node: `${HumanPerformanceSoftBoundary.GRIP}${particle}`,
                offset: { x: 0, y: 0, z: 0 },
              },
            }),
          ),
        ],
      };
      const boundaries: IAutoMovieSoftBodyBoundarySample[] = [];
      for (let k: number = 0; k <= upto; ++k)
        boundaries.push(HumanPerformanceSoftBoundary(state, anchored, grips, bones, k, k * dt));
      const steps: Float64Array[] = [
        new Float64Array(HumanPerformanceSoftBoundary.rest(anchored, boundaries[0]!)),
      ];
      const loads: Map<string, IAutoMovieVector3>[] = [new Map()];
      const observer: IAutoMovieSoftBodyObserver = {
        step: (
          index: number,
          positions: Float64Array<ArrayBufferLike>,
          _velocities: Float64Array<ArrayBufferLike>,
          held: ReadonlyMap<number, IAutoMovieVector3>,
        ): void => {
          steps.push(new Float64Array(positions));
          if (!record) return;
          const hands: Map<string, IAutoMovieVector3> = new Map();
          const seconds: number = index * dt;
          for (const g of grips)
            if (
              seconds >= g.from &&
              seconds <= g.to &&
              HumanPerformanceSoftBoundary.owner(grips, g.particle, seconds) === g
            ) {
              const f: IAutoMovieVector3 | undefined = held.get(g.particle);
              if (f !== undefined) hands.set(`${g.person}:${g.side}`, f);
            }
          loads.push(hands);
        },
      };
      if (upto > 0)
        simulateSoftBodyWithBoundaries(
          anchored,
          upto,
          boundaries,
          null,
          observer,
        );
      return { steps, loads };
    };

    // Each grip binds the particle nearest the hand's socket as it closes,
    // read from the solve as it stands then.
    const windows: HumanPerformanceState.IGrip[] = HumanPerformanceRead.grips(
      state,
      subject,
    )
      .filter((g: HumanPerformanceState.IGrip): boolean => g.bone === undefined)
      .map(
        (g: HumanPerformanceState.IGrip): HumanPerformanceState.IGrip => ({
          ...g,
          from: Math.max(0, g.from),
          to: Math.min(state.duration, g.to),
        }),
      )
      .filter((g: HumanPerformanceState.IGrip): boolean => g.to >= g.from);
    for (const window of windows) {
      const k: number = Math.min(count, Math.round(window.from / dt));
      const positions: Float64Array = solve(k, false).steps[k]!;
      const socket: IAutoMovieVector3 = HumanPerformanceSoftBoundary.gripSocket(
        state,
        bones,
        window.subject,
        window.side,
        k,
        k * dt,
      );
      let nearest: number = 0;
      let best: number = Infinity;
      for (let p: number = 0; p * 3 < positions.length; ++p) {
        const d: number = Math.hypot(
          positions[p * 3]! - socket.x,
          positions[p * 3 + 1]! - socket.y,
          positions[p * 3 + 2]! - socket.z,
        );
        if (d < best) {
          best = d;
          nearest = p;
        }
      }
      grips.push({
        particle: nearest,
        person: window.subject,
        side: window.side,
        from: window.from,
        to: window.to,
      });
    }
    const whole: Pick<HumanPerformanceSoft.ISolved, "steps" | "loads"> = solve(
      count,
      true,
    );
    const out: ISolved = { dt, steps: whole.steps, loads: whole.loads };
    if (!state.resolving) memo.set(subject, out);
    return out;
  }
}

/** The solves kept per performance. */
const SOLVED: WeakMap<
  HumanPerformanceState,
  Map<string, HumanPerformanceSoft.ISolved>
> = new WeakMap();
