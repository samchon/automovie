import { Vector3, simulateSoftBodyWithBoundaries } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPerformanceSoft,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieSoftAnchor,
  IAutoMovieSoftBodyBoundarySample,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyObserver,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPerformanceSoftBoundary } from "./HumanPerformanceSoftBoundary";
import { HumanPerformanceSoftBudget } from "./HumanPerformanceSoftBudget";

/** The alternatives of `OfWhole`'s site. */
type OfWhole = "steps" | "loads";

/** The alternatives of `OfSolveResult`'s site. */
type OfSolveResult = "steps" | "loads";

/**
 * Read the whole solve the performance prepared for a soft prop.
 *
 * @param state The performance.
 * @param subject The soft prop.
 * @returns The solve.
 * @throws {HumanRefusal} When the performance has no soft prop with this id.
 * @throws {Error} When a declared domain reaches a reader before preparation.
 */
export function HumanPerformanceSoft(
  state: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieMotionHumanPerformanceSoft.ISolved {
  const solved: IAutoMovieMotionHumanPerformanceSoft.ISolved | undefined = state.soft.get(subject);
  if (solved !== undefined) return solved;
  domainOf(state, subject);
  throw new Error(`Soft prop ${subject} has not been prepared`);
}

/** Read a declared soft domain or report the available soft props. */
function domainOf(
  state: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieSoftBodyDomain {
  const domain: IAutoMovieSoftBodyDomain | undefined = state.props.get(subject)?.soft;
  if (domain === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: subject,
      feasible: {
        kind: "alternatives",
        values: [...state.props.values()]
          .filter(
            (p: IAutoMovieMotionHumanProp): boolean => p.soft !== undefined,
          )
          .map((p: IAutoMovieMotionHumanProp): string => p.subject),
      },
      reason: `the prop ${subject} has no soft domain`,
      fix: "read a prop that declares `soft`",
    });
  return domain;
}

/** A soft prop's whole solve from the placed performance. */
function solve(
  state: IAutoMovieMotionHumanPerformanceState,
  subject: string,
): IAutoMovieMotionHumanPerformanceSoft.ISolved {
  const domain: IAutoMovieSoftBodyDomain = domainOf(state, subject);
  const dt: number = domain.solver.fixedStepSeconds;
  const count: number = HumanPerformanceSoftBudget(
    subject,
    domain,
    state.duration,
  );
  const span: IAutoMovieMotionHumanProp.ISoftSpan | undefined = state.props.get(subject)?.softSpan;
  const { seed, spans }: ReturnType<typeof HumanPerformanceSoftBoundary.seed> =
    HumanPerformanceSoftBoundary.seed(state, domain, span, count);

  const grips: HumanPerformanceSoftBoundary.IGripAnchor[] = [];
  const simulate = (
    upto: number,
    record: boolean,
  ): Pick<IAutoMovieMotionHumanPerformanceSoft.ISolved, OfSolveResult> => {
    const gripped: ReadonlySet<number> = new Set(
      grips.map(
        (grip: HumanPerformanceSoftBoundary.IGripAnchor): number =>
          grip.particle,
      ),
    );
    const anchored: IAutoMovieSoftBodyDomain = {
      ...seed,
      anchors: [
        ...seed.anchors.filter(
          (anchor: IAutoMovieSoftAnchor): boolean =>
            !gripped.has(anchor.particle),
        ),
        ...[...gripped].map(
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
      boundaries.push(
        HumanPerformanceSoftBoundary(
          state,
          anchored,
          grips,
          gripped,
          bones,
          k,
          k * dt,
          spans?.[k],
        ),
      );
    const steps: Float64Array[] = [
      new Float64Array(
        HumanPerformanceSoftBoundary.rest(anchored, boundaries[0]!),
      ),
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
        // One hand may bear several particles: their forces add.
        const bear = (key: string, particle: number): void => {
          const f: IAutoMovieVector3 | undefined = held.get(particle);
          if (f === undefined) return;
          const was: IAutoMovieVector3 | undefined = hands.get(key);
          hands.set(key, was === undefined ? f : Vector3.add(was, f));
        };
        for (const g of grips)
          if (
            seconds >= g.from &&
            seconds <= g.to &&
            HumanPerformanceSoftBoundary.owner(grips, g.particle, seconds) === g
          )
            bear(`${g.person}:${g.side}`, g.particle);
        // The domain's own anchors on a hand bone: the hand holds them
        // throughout (a grip that takes a particle over replaces its
        // anchor in `anchored`).
        for (const h of HumanPerformanceSoft.held(anchored))
          bear(`${h.person}:${h.side}`, h.particle);
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
  const windows: IAutoMovieMotionHumanPerformanceState.IGrip[] =
    HumanPerformanceRead.grips(state, subject)
      .filter(
        (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
          g.bone === undefined,
      )
      .map(
        (
          g: IAutoMovieMotionHumanPerformanceState.IGrip,
        ): IAutoMovieMotionHumanPerformanceState.IGrip => ({
          ...g,
          from: Math.max(0, g.from),
          to: Math.min(state.duration, g.to),
        }),
      )
      .filter(
        (g: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
          g.to >= g.from,
      );

  // The displayed bones of every person the domain or a grip names, read
  // before the solves (`HumanPerformanceSoftBoundary.prepareBones`).
  const bones: HumanPerformanceSoftBoundary.BoneReader =
    HumanPerformanceSoftBoundary.prepareBones(state, seed, windows, count, dt);
  for (const window of windows) {
    const k: number = Math.min(count, Math.round(window.from / dt));
    const positions: Float64Array = simulate(k, false).steps[k]!;
    const socket: IAutoMovieVector3 = HumanPerformanceSoftBoundary.gripSocket(
      state,
      bones,
      window.subject,
      window.side,
      k,
      k * dt,
    );

    // A double-ended model cord keeps both attachments when a hand holds it.
    const first: number = span === undefined ? 0 : 1;
    const end: number = positions.length / 3 - first;
    let nearest: number = first;
    let best: number = Infinity;
    for (let p: number = first; p < end; ++p) {
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
  const whole: Pick<IAutoMovieMotionHumanPerformanceSoft.ISolved, OfWhole> =
    simulate(count, true);
  return {
    dt,
    steps: whole.steps,
    loads: whole.loads,
  };
}

/**
 * A performance's soft props: each solved once from the displayed poses of the
 * people who hold it or whose bodies it lies on, at its domain's own fixed
 * step, and read by film seconds.
 *
 * The pass runs after every action is placed. For each step k of the domain's
 * `fixedStepSeconds` from film second 0 to the performance's end, it reads the
 * displayed bones at second k dt and builds that step's boundary: the world
 * point of every moving anchor (an `actor-bone` binding on its person's bone, a
 * `node` binding on a rigid prop of that subject) and the world segment of
 * every body capsule. A hand's grip on the prop (any grip window or hold on it,
 * as `HumanPerformanceRead.grips` lists them) binds the particle nearest the
 * hand's grip socket when the grip closes, read from the solve as it stands
 * then, to that socket for the window, and releases it after, so the particle
 * falls with the velocity the hand gave it. On a cord attached at both ends to
 * a model span, only the interior particles are available to the grip. Two
 * hands on one particle (a handover's shared window) bind it to the hand that
 * closed last, as a rigid prop rides the last grip. The engine solves the whole
 * span once (`simulateSoftBodyWithBoundaries` with an observer that keeps every
 * step), replaying from step 0 once per grip that picks its particle from the
 * solve, so W grips cost W + 1 solves.
 *
 * A read at a film second interpolates linearly between the two steps around
 * it, so a seek costs no solve and two frame rates read the same state at a
 * shared second. The coupling is one-way: the cloth never moves the body
 * (tension enters the hand as a load through `load`, read from the compliant
 * solver's multipliers).
 */
export namespace HumanPerformanceSoft {
  /**
   * Solve a soft prop over the placed performance: what the performance
   * prepares once every action, stop and flight is resolved.
   *
   * @param state The performance.
   * @param subject The soft prop.
   * @returns The solve.
   * @throws {HumanRefusal} When the prop is not soft.
   */
  export function prepare(
    state: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): IAutoMovieMotionHumanPerformanceSoft.ISolved {
    return solve(state, subject);
  }

  /**
   * The particles a soft domain anchors to a hand bone (`actor-bone` on
   * `leftHand` or `rightHand`): a lanyard or a cord the hand holds from the
   * start, whose pull is that hand's load as a grip's is.
   *
   * @param domain The domain, with any grips' anchors already swapped in.
   * @returns The hand anchors, in the domain's order.
   */
  export function held(
    domain: IAutoMovieSoftBodyDomain,
  ): IAutoMovieMotionHumanPerformanceSoft.IHandAnchor[] {
    return domain.anchors.flatMap(
      (
        a: IAutoMovieSoftAnchor,
      ): IAutoMovieMotionHumanPerformanceSoft.IHandAnchor[] =>
        a.binding?.kind === "actor-bone" &&
        (a.binding.bone === "leftHand" || a.binding.bone === "rightHand")
          ? [
              {
                particle: a.particle,
                person: a.binding.actor,
                side: a.binding.bone === "leftHand" ? "left" : "right",
              },
            ]
          : [],
    );
  }

  /**
   * A soft prop's particle positions at a film second.
   *
   * @param state The performance.
   * @param subject The soft prop.
   * @param seconds Film seconds, clamped to the performance.
   * @returns World metres, row-major `[x, y, z, ...]`.
   * @throws {HumanRefusal} When the prop is not soft or its span exceeds its
   *   domain's step budget.
   */
  export function at(
    state: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
  ): number[] {
    const solved: IAutoMovieMotionHumanPerformanceSoft.ISolved =
      HumanPerformanceSoft(state, subject);
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
   * step's anchor force from the compliant solver, the step before the second's
   * (a force is held over its step, not interpolated).
   *
   * @param state The performance.
   * @param subject The soft prop.
   * @param person The gripping person.
   * @param side The hand.
   * @param seconds Film seconds.
   * @returns Newtons, world frame; zero when the hand does not hold it or the
   *   domain declares no compliance.
   */
  export function load(
    state: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    person: string,
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 {
    const solved: IAutoMovieMotionHumanPerformanceSoft.ISolved =
      HumanPerformanceSoft(state, subject);
    const k: number = Math.max(
      0,
      Math.min(solved.loads.length - 1, Math.floor(seconds / solved.dt)),
    );
    return solved.loads[k]?.get(`${person}:${side}`) ?? { x: 0, y: 0, z: 0 };
  }

  /**
   * Every soft prop's pull on the hands that grip it, as sustained forces for
   * the display-time load and balance: one record per grip window on a soft
   * prop, on the gripping person's palm of that side, over the window, and one
   * per hand the domain itself anchors to (`held`), over the whole performance,
   * its force the compliant solver's anchor force at the step before each
   * second (`load`). The coupling is one-way per solve: the cloth is solved
   * from the displayed body, and the body's lean is then read from these
   * forces, never fed back into the solve or into a law's plan.
   *
   * @param state The performance.
   * @returns The forces, in prop and grip order.
   */
  export function sustained(
    state: IAutoMovieMotionHumanPerformanceState,
  ): IAutoMovieMotionHumanSustainedForce[] {
    const out: IAutoMovieMotionHumanSustainedForce[] = [];
    for (const prop of state.props.values()) {
      if (prop.soft === undefined) continue;
      // A hand the domain itself anchors to bears the prop over the whole
      // performance; its record reads every particle that hand bears, so a
      // grip of the same hand adds no record of its own.
      const subject: string = prop.subject;
      const anchored: Map<
        string,
        IAutoMovieMotionHumanPerformanceSoft.IHandAnchor
      > = new Map(
        HumanPerformanceSoft.held(prop.soft).map(
          (
            h: IAutoMovieMotionHumanPerformanceSoft.IHandAnchor,
          ): [string, IAutoMovieMotionHumanPerformanceSoft.IHandAnchor] => [
            `${h.person}:${h.side}`,
            h,
          ],
        ),
      );
      for (const h of anchored.values())
        out.push({
          kind: "sustained",
          subject: h.person,
          at: h.side === "left" ? "palmLeft" : "palmRight",
          from: 0,
          to: state.duration,
          force: (seconds: number): IAutoMovieVector3 =>
            HumanPerformanceSoft.load(
              state,
              subject,
              h.person,
              h.side,
              seconds,
            ),
        });
      for (const g of HumanPerformanceRead.grips(state, prop.subject)) {
        if (g.bone !== undefined || anchored.has(`${g.subject}:${g.side}`))
          continue;
        out.push({
          kind: "sustained",
          subject: g.subject,
          at: g.side === "left" ? "palmLeft" : "palmRight",
          from: g.from,
          to: g.to,
          force: (seconds: number): IAutoMovieVector3 =>
            HumanPerformanceSoft.load(
              state,
              subject,
              g.subject,
              g.side,
              seconds,
            ),
        });
      }
    }
    return out;
  }
}
