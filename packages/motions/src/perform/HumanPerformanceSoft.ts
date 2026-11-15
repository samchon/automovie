import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSoftBodyBoundarySample,
  type IAutoMovieSoftBodyObserver,
  type IAutoMovieSoftBodyResolvedCapsule,
  Quaternion,
  Vector3,
  type resolveAutoMovieHumanoidSurfaces,
  simulateSoftBodyWithBoundaries,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidSocket,
  IAutoMovieSoftAnchor,
  IAutoMovieSoftAnchorBinding,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftCollider,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
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
    const bones: BoneReader = memoBones(state);
    const grips: IGripAnchor[] = [];
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
                (g: IGripAnchor): boolean => g.particle === a.particle,
              ),
          ),
          ...[
            ...new Set(grips.map((g: IGripAnchor): number => g.particle)),
          ].map(
            (particle: number): IAutoMovieSoftAnchor => ({
              id: `${GRIP}${particle}`,
              particle,
              position: null,
              binding: {
                kind: "node",
                node: `${GRIP}${particle}`,
                offset: { x: 0, y: 0, z: 0 },
              },
            }),
          ),
        ],
      };
      const boundaries: IAutoMovieSoftBodyBoundarySample[] = [];
      for (let k: number = 0; k <= upto; ++k)
        boundaries.push(boundary(state, anchored, grips, bones, k, k * dt));
      const steps: Float64Array[] = [
        new Float64Array(rest(anchored, boundaries[0]!)),
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
              owner(grips, g.particle, seconds) === g
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
      const socket: IAutoMovieVector3 = gripSocket(
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

/** A grip that binds a particle to a hand's socket for a window. */
interface IGripAnchor {
  particle: number;
  person: string;
  side: "left" | "right";
  from: number;
  to: number;
}

/** The solves kept per performance. */
const SOLVED: WeakMap<
  HumanPerformanceState,
  Map<string, HumanPerformanceSoft.ISolved>
> = new WeakMap();

/** Displayed bones by person and step. */
type BoneReader = (
  person: string,
  k: number,
  seconds: number,
) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** A reader of displayed bones by person and step, each read once. */
const memoBones: (state: HumanPerformanceState) => BoneReader = (
  state: HumanPerformanceState,
): BoneReader => {
  const kept: Map<
    string,
    ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
  > = new Map();
  return (
    person: string,
    k: number,
    seconds: number,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const key: string = `${person}:${k}`;
    let read:
      | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
      | undefined = kept.get(key);
    if (read === undefined) {
      read = HumanPerformanceRead.bones(state, person, seconds);
      kept.set(key, read);
    }
    return read;
  };
};

/** The grip that holds a particle at a second: the one that closed last among those open. */
const owner: (
  grips: readonly IGripAnchor[],
  particle: number,
  seconds: number,
) => IGripAnchor | undefined = (
  grips: readonly IGripAnchor[],
  particle: number,
  seconds: number,
): IGripAnchor | undefined =>
  grips
    .filter(
      (g: IGripAnchor): boolean =>
        g.particle === particle && seconds >= g.from && seconds <= g.to,
    )
    .reduce<
      IGripAnchor | undefined
    >((last: IGripAnchor | undefined, g: IGripAnchor): IGripAnchor => (last === undefined || g.from >= last.from ? g : last), undefined);

/** A hand's grip socket in the world at a step. */
const gripSocket: (
  state: HumanPerformanceState,
  bones: BoneReader,
  person: string,
  side: "left" | "right",
  k: number,
  seconds: number,
) => IAutoMovieVector3 = (
  state: HumanPerformanceState,
  bones: BoneReader,
  person: string,
  side: "left" | "right",
  k: number,
  seconds: number,
): IAutoMovieVector3 => {
  const socket: resolveAutoMovieHumanoidSurfaces.IFrame =
    HumanPerformanceRead.person(state, person).performer.body.surfaces.sockets[
      `grip${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidSocket
    ];
  const hand: IAutoMovieResolvedBone = bones(person, k, seconds).get(
    `${side}Hand`,
  )!;
  return Vector3.add(
    hand.worldPosition,
    Quaternion.rotateVector(hand.worldRotation, socket.point),
  );
};

/** One step's boundary: every moving anchor's world point, released grips, and every body capsule. */
const boundary: (
  state: HumanPerformanceState,
  domain: IAutoMovieSoftBodyDomain,
  grips: readonly IGripAnchor[],
  bones: BoneReader,
  k: number,
  seconds: number,
) => IAutoMovieSoftBodyBoundarySample = (
  state: HumanPerformanceState,
  domain: IAutoMovieSoftBodyDomain,
  grips: readonly IGripAnchor[],
  bones: BoneReader,
  k: number,
  seconds: number,
): IAutoMovieSoftBodyBoundarySample => {
  const anchors: { particle: number; position: IAutoMovieVector3 }[] = [];
  const released: number[] = [];
  for (const anchor of domain.anchors) {
    const binding: IAutoMovieSoftAnchorBinding | undefined = anchor.binding;
    if (binding === undefined) continue;
    if (binding.kind === "node" && binding.node.startsWith(GRIP)) {
      const g: IGripAnchor | undefined = owner(grips, anchor.particle, seconds);
      if (g === undefined) released.push(anchor.particle);
      else
        anchors.push({
          particle: anchor.particle,
          position: gripSocket(state, bones, g.person, g.side, k, seconds),
        });
      continue;
    }
    if (binding.kind === "node") {
      const frame: IHumanProp.IFrame = HumanPerformanceRead.prop(
        state,
        binding.node,
        seconds,
      );
      anchors.push({
        particle: anchor.particle,
        position: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, binding.offset),
        ),
      });
      continue;
    }
    const bone: IAutoMovieResolvedBone = bones(binding.actor, k, seconds).get(
      binding.bone,
    )!;
    anchors.push({
      particle: anchor.particle,
      position: Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, binding.offset),
      ),
    });
  }
  const capsules: IAutoMovieSoftBodyResolvedCapsule[] = domain.colliders
    .filter(
      (c: IAutoMovieSoftCollider): c is IAutoMovieSoftCollider.IBodyCapsule =>
        c.kind === "body-capsule",
    )
    .map(
      (
        c: IAutoMovieSoftCollider.IBodyCapsule,
      ): IAutoMovieSoftBodyResolvedCapsule => {
        const read: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          bones(c.actor, k, seconds);
        return {
          id: c.id,
          from: { ...read.get(c.capsule.from)!.worldPosition },
          to: { ...read.get(c.capsule.to)!.worldPosition },
          radius: c.capsule.radius,
        };
      },
    );
  return {
    step: k,
    anchors,
    capsules,
    ...(released.length === 0 ? {} : { released }),
  };
};

/** The node name prefix of an anchor a grip makes. */
const GRIP: string = "grip:";

/** Step 0's positions: the rest with the first boundary's anchors applied, as the engine starts. */
const rest: (
  domain: IAutoMovieSoftBodyDomain,
  first: IAutoMovieSoftBodyBoundarySample,
) => number[] = (
  domain: IAutoMovieSoftBodyDomain,
  first: IAutoMovieSoftBodyBoundarySample,
): number[] => {
  const out: number[] = [...domain.rest];
  for (const a of first.anchors) {
    out[a.particle * 3] = a.position.x;
    out[a.particle * 3 + 1] = a.position.y;
    out[a.particle * 3 + 2] = a.position.z;
  }
  return out;
};
