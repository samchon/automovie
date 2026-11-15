import { Vector3, integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeArticulation } from "./ArchetypeArticulation";
import { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeUnits } from "./ArchetypeUnits";

/**
 * An archetype's own movements: one articulation's travel as a function of film seconds from a start second, for a part that moves by itself once released, as a trebuchet's arm swings when its pin is pulled or a door swings shut on its closer.
 *
 * `swing` lets a body hung on a hinge fall from a release travel as a rigid pendulum under gravity, the model's `+Y` up: `I θ'' = -m g A sin θ`, `θ` the turn from where the body hangs at rest and `A` the centre of mass's lever square to the hinge in the vertical plane. Below `SMALL` it is the closed form `θ0 cos(ω t)`, `ω = sqrt(m g A / I)`; above it the engine's one integrator (`integrateMotionTrajectory`) solves the full equation. `ease` carries a travel from one value to another over a duration on the minimum-jerk profile. A track may name a `launch` travel, the instant and rate at which it first passes that travel, where a released projectile leaves the part. Before its start a track holds its first travel, after its end its last.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a track is, the pendulum's equation and its two solutions, the ease, the launch and the held ends.
 * @evidence contracts/development/design.md#principled-representation A track is a pure function of film seconds over one articulation, the closed-form or integrated solution read the same way, so a performance reads it as it reads an act's drive.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `pendulum` reads a hinged body's figures, `swing` and `ease` make the two tracks #3476 asks for, each with an optional launch, and `agm` gives the exact period's mean that fixes `SMALL`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A track never leaves its articulation's range: a swing or an ease that would is refused when it is made, never clamped.
 */
export namespace ArchetypeTrack {
  /**
   * One articulation's travel through film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The articulation's id, the film seconds the movement spans, a pure travel function in the articulation's own unit and the launch, if one was asked for.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `swing` and `ease` and read by whatever poses the archetype at a second.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The travel is a function, not samples on a frame grid.
   */
  export interface ITrack<Id extends string = string> {
    /** The articulation moved. */
    articulation: Id;

    /** The film second the movement begins. */
    start: number;

    /** The film second it ends, after which the travel holds. */
    end: number;

    /**
     * The travel at a film second, in the articulation's unit: degrees for a hinge, metres for a slider; the first travel before `start`, the last after `end`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the unit and the held ends.
     * @evidence contracts/development/implementation.md#principled-implementation The track's own solution read at the second's offset from its start, clamped to its span.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamp, then read.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: a closed form, or one trajectory read.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work An integrated track reads the trajectory integrated once when it was made.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing per call.
     */
    travel(seconds: number): number;

    /** Where the travel first passes the launch travel asked for; null when none was asked. */
    launch: ILaunch | null;
  }

  /**
   * The instant a track first passes its launch travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The film second, the travel and its rate there, in the articulation's units per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; written by `swing` and `ease` and read by what releases a projectile from the part.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ILaunch {
    /** The film second. */
    seconds: number;

    /** The travel, the one asked for. */
    travel: number;

    /** The travel's rate there, degrees or metres per second. */
    rate: number;
  }

  /**
   * A body hung on a hinge, as the pendulum equation reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The moment about the hinge, the mass, the gravity lever and the travel at which the body hangs at rest: the four figures `I θ'' = -m g A sin θ` needs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `pendulum` from an archetype, or by a producer for a part it knows, and read by `swing`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPendulum {
    /** The moment of inertia about the hinge's axis, kg m squared. */
    moment: number;

    /** The swinging mass, kilograms. */
    mass: number;

    /** The centre of mass's distance from the hinge's axis, projected square to the axis and to the horizontal, metres: the lever gravity turns it by. */
    arm: number;

    /** The hinge's travel at which the body hangs at rest, its centre of mass lowest, degrees. */
    rest: number;
  }

  /** The largest share by which the closed form's period may fall short of the true one: 0.5 %, the bound #3476 holds a swing's period to. */
  export const PERIOD: number = 0.005;

  /**
   * The arithmetic-geometric mean of two positive numbers.
   *
   * @param a One number.
   * @param b The other.
   * @returns Their mean, the common limit of the arithmetic and geometric means iterated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Gauss's iteration, quadratically convergent, stopped when the two means agree to the last bit or after 64 rounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms A handful of rounds for any amplitude a swing takes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function agm(a: number, b: number): number {
    for (let k: number = 0; k < 64 && a !== b; k++) {
      const next: number = (a + b) / 2;
      b = Math.sqrt(a * b);
      a = next;
    }
    return a;
  }

  /** The release amplitude, radians, up to which the closed form's period, `2 pi / ω`, is within `PERIOD` of the exact one, `2 pi / (ω agm(1, cos(θ0 / 2)))` (Carvalhaes and Suppes, Approximations for the period of the simple pendulum based on the arithmetic-geometric mean, Am. J. Phys. 76(12):1150-1154, 2008, https://suppescorpus.stanford.edu/sites/g/files/sbiybj32751/files/media/file/approximations_for_the_period_of_the_simple_pendulum_based_on_the_arithmetic-geometric_mean_431.pdf): about 0.28 rad, found once by bisection. */
  export const SMALL: number = ((): number => {
    let low: number = 0;
    let high: number = Math.PI / 2;
    for (let k: number = 0; k < 60; k++) {
      const middle: number = (low + high) / 2;
      if (1 / agm(1, Math.cos(middle / 2)) - 1 < PERIOD) low = middle;
      else high = middle;
    }
    return low;
  })();

  /**
   * An archetype as a pendulum on one of its hinges: the whole model swinging, so it fits an archetype that is itself the hinged body, such as an assembly's member hung on a hinge or a body built for the purpose.
   *
   * @param archetype The body, its `+Y` up.
   * @param hinge The hinge it swings on.
   * @returns Its pendulum figures, from its own mass properties at rest.
   * @throws {ArchetypeRefusal} When the id is no hinge, or gravity turns nothing about it (an upright axis, or the centre of mass on the axis).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, that the whole model swings, its frame and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The moment about the hinge's rest axis by the parallel-axis theorem (`Archetype.moment`); the centre of mass's offset square to the axis turns as `r cos t + (a x r) sin t`, whose height is `A cos(t - phi)`, so the lever is that amplitude and the rest travel is `phi + 180` degrees, where the height is least.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the hinge, project the offset, then the lever and the rest travel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hinge gravity cannot turn is refused, never given a period.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `Archetype.moment` and `ArchetypeFrame.axis`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pendulum<Id extends string>(
    archetype: Archetype<Id, string>,
    hinge: Id,
  ): IPendulum {
    const affordance: IAutoMovieAffordance = archetype
      .articulate({})
      .affordance(hinge);
    if (affordance.kind !== "hinge")
      throw new ArchetypeRefusal({
        kind: "articulation",
        archetype: archetype.archetype,
        axis: "hinge",
        value: hinge,
        reason: `${hinge} is a ${affordance.kind}, not a hinge a body swings on`,
        fix: "name a hinge",
      });
    const axis: IAutoMovieVector3 = ArchetypeFrame.axis(affordance.frame, "y");
    const through: IAutoMovieVector3 = affordance.frame.translation;
    const offset: IAutoMovieVector3 = Vector3.subtract(
      archetype.properties.centerOfMass,
      through,
    );
    const square: IAutoMovieVector3 = Vector3.subtract(
      offset,
      Vector3.scale(axis, Vector3.dot(offset, axis)),
    );
    const a: number = square.y;
    const b: number = Vector3.cross(axis, square).y;
    const arm: number = Math.hypot(a, b);
    if (!(arm > 1e-9))
      throw new ArchetypeRefusal({
        kind: "articulation",
        archetype: archetype.archetype,
        axis: "hinge",
        value: hinge,
        reason: `gravity turns nothing about ${hinge}: its centre of mass is ${arm} m from the upright plane through its axis`,
        fix: "swing a body on a hinge whose axis is not upright and off its centre of mass",
      });
    const phi: number = Math.atan2(b, a) / ArchetypeUnits.DEGREE + 180;
    return {
      moment: archetype.moment(through, axis),
      mass: archetype.properties.mass,
      arm,
      rest: phi > 180 ? phi - 360 : phi,
    };
  }

  /**
   * A body released on its hinge and left to swing.
   *
   * @param archetype The archetype the hinge belongs to, for its range.
   * @param hinge The hinge.
   * @param props `start`, the film second it is released; `release`, the travel it is released at, at rest, degrees; `seconds`, how long it swings, after which it holds; `pendulum`, the swinging body's figures, `pendulum(archetype, hinge)` when absent; `launch`, a travel whose first passing is the launch.
   * @returns The track.
   * @throws {ArchetypeRefusal} As `pendulum` does; when `seconds` is not positive; when the swing, which reaches as far past rest as it was released from it, leaves the hinge's range; or when the launch travel is not passed while it swings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the default body, the held end and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation `I θ'' = -m g A sin θ` from rest: below `SMALL` the closed form `θ0 cos(ω t)`, whose period is within `PERIOD` of the exact one; above it RK4 on `(θ, θ')` by `integrateMotionTrajectory` over the swing. Energy is conserved, so the swing's reach is the release's distance past rest, checked against the range once. The launch is the closed form's first crossing `acos(θL / θ0) / ω`, or the integrated trajectory's first sign change found by bisection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The body, the admission, the solution, the launch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No friction or air drag damps the swing: none was read; a stop that would end it is the producer's range, refused, not hit.
   * @evidence contracts/development/implementation.md#efficient-algorithms The closed form is constant work; the integration is one pass at the engine's step, read in constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's one integrator; the trajectory is integrated once per track.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources An integrated track holds its trajectory for as long as its caller keeps it.
   */
  export function swing<Id extends string>(
    archetype: Archetype<Id, string>,
    hinge: Id,
    props: {
      start: number;
      release: number;
      seconds: number;
      pendulum?: IPendulum;
      launch?: number;
    },
  ): ITrack<Id> {
    const body: IPendulum = props.pendulum ?? pendulum(archetype, hinge);
    positive(archetype, "seconds", props.seconds);
    const reach: number = Math.abs(props.release - body.rest);
    within(archetype, hinge, "release", props.release, [
      body.rest - reach,
      body.rest + reach,
    ]);
    const omega: number = Math.sqrt(
      (body.mass * ArchetypeCourse.GRAVITY * body.arm) / body.moment,
    );
    const theta0: number = (props.release - body.rest) * ArchetypeUnits.DEGREE;

    // The turn from rest and its rate, radians and radians per second, at a second since the release.
    let state: (since: number) => { angle: number; rate: number };
    if (Math.abs(theta0) <= SMALL)
      state = (since: number): { angle: number; rate: number } => ({
        angle: theta0 * Math.cos(omega * since),
        rate: -theta0 * omega * Math.sin(omega * since),
      });
    else {
      const trajectory: integrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({
          f: (_t: number, x: readonly number[]): integrateMotionTrajectory.IRate => ({
            dx: [x[1]!, -omega * omega * Math.sin(x[0]!)],
          }),
          x0: [theta0, 0],
          t0: 0,
          t1: props.seconds,
        });
      state = (since: number): { angle: number; rate: number } => {
        const x: number[] = trajectory.at(since).x;
        return { angle: x[0]!, rate: x[1]! };
      };
    }
    const travel = (since: number): number =>
      body.rest +
      state(Math.max(0, Math.min(props.seconds, since))).angle /
        ArchetypeUnits.DEGREE;

    // The launch: the first time the turn reaches the launch's.
    let launch: ILaunch | null = null;
    if (props.launch !== undefined) {
      const target: number = (props.launch - body.rest) * ArchetypeUnits.DEGREE;
      let at: number | null = null;
      if (Math.abs(theta0) <= SMALL && Math.abs(target) <= Math.abs(theta0))
        at = Math.acos(theta0 === 0 ? 1 : target / theta0) / omega;
      else if (Math.abs(theta0) > SMALL) {
        const step: number = integrateMotionTrajectory.STEP;
        const gap = (since: number): number => state(since).angle - target;
        for (let low: number = 0; low < props.seconds; low += step) {
          const high: number = Math.min(props.seconds, low + step);
          if (gap(low) === 0) {
            at = low;
            break;
          }
          if (Math.sign(gap(low)) !== Math.sign(gap(high))) {
            let a: number = low;
            let b: number = high;
            for (let k: number = 0; k < 60; k++) {
              const middle: number = (a + b) / 2;
              if (Math.sign(gap(middle)) === Math.sign(gap(a))) a = middle;
              else b = middle;
            }
            at = b;
            break;
          }
        }
      }
      if (at === null || at > props.seconds)
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: archetype.archetype,
          axis: "launch",
          value: props.launch,
          feasible: {
            kind: "range",
            minimum: body.rest - reach,
            maximum: body.rest + reach,
            unit: "degrees",
          },
          reason: `${hinge} released at ${props.release} degrees does not pass ${props.launch} degrees in ${props.seconds} s`,
          fix: "give a launch travel the swing passes, or swing it longer",
        });
      launch = {
        seconds: props.start + at,
        travel: props.launch,
        rate: state(at).rate / ArchetypeUnits.DEGREE,
      };
    }
    return {
      articulation: hinge,
      start: props.start,
      end: props.start + props.seconds,
      travel: (seconds: number): number => travel(seconds - props.start),
      launch,
    };
  }

  /**
   * An articulation carried from one travel to another over a duration on the minimum-jerk profile, `x0 + (x1 - x0)(10 s^3 - 15 s^4 + 6 s^5)` with `s` the share of the duration elapsed: the path that minimises the integrated squared jerk between two rests (Flash and Hogan, The coordination of arm movements: an experimentally confirmed mathematical model, J. Neurosci. 5(7):1688-1703, 1985, https://www.jneurosci.org/content/5/7/1688), taken for a mechanism such as a door closer as #3476 asks, provisional for one: no closer's measured motion was read.
   *
   * @param archetype The archetype the articulation belongs to, for its range.
   * @param articulation The articulation.
   * @param props `start`, the film second it begins; `from` and `to`, the travels, in the articulation's unit; `seconds`, the duration; `launch`, a travel between them whose passing is the launch.
   * @returns The track.
   * @throws {ArchetypeRefusal} When the id is no articulation, `seconds` is not positive, a travel lies outside the articulation's range, or the launch travel does not lie between `from` and `to`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the profile, its source, its provisional use for a mechanism, each input and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Flash and Hogan's quintic, which starts and ends at rest with zero acceleration; the launch is its monotone crossing, found by bisection on the share, with the rate `(x1 - x0)(30 s^2 - 60 s^3 + 30 s^4) / T`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, then the closed form and the launch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A travel outside the range is refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read; the launch's bisection runs once.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call makes one independent track.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond its inputs.
   */
  export function ease<Id extends string>(
    archetype: Archetype<Id, string>,
    articulation: Id,
    props: {
      start: number;
      from: number;
      to: number;
      seconds: number;
      launch?: number;
    },
  ): ITrack<Id> {
    positive(archetype, "seconds", props.seconds);
    within(archetype, articulation, "from", props.from, [props.from]);
    within(archetype, articulation, "to", props.to, [props.to]);
    const profile = (s: number): number => s * s * s * (10 - 15 * s + 6 * s * s);
    const share = (seconds: number): number =>
      Math.max(0, Math.min(1, (seconds - props.start) / props.seconds));
    const span: number = props.to - props.from;
    let launch: ILaunch | null = null;
    if (props.launch !== undefined) {
      const part: number = span === 0 ? Number.NaN : (props.launch - props.from) / span;
      if (!(part >= 0 && part <= 1))
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: archetype.archetype,
          axis: "launch",
          value: props.launch,
          feasible: {
            kind: "range",
            minimum: Math.min(props.from, props.to),
            maximum: Math.max(props.from, props.to),
            unit: "",
          },
          reason: `${articulation} eased from ${props.from} to ${props.to} does not pass ${props.launch}`,
          fix: "give a launch travel between the two travels",
        });
      let low: number = 0;
      let high: number = 1;
      for (let k: number = 0; k < 60; k++) {
        const middle: number = (low + high) / 2;
        if (profile(middle) < part) low = middle;
        else high = middle;
      }
      launch = {
        seconds: props.start + high * props.seconds,
        travel: props.launch,
        rate:
          (span * 30 * high * high * (1 - high) * (1 - high)) / props.seconds,
      };
    }
    return {
      articulation,
      start: props.start,
      end: props.start + props.seconds,
      travel: (seconds: number): number =>
        props.from + span * profile(share(seconds)),
      launch,
    };
  }

  /**
   * Refuse a duration that is not positive.
   *
   * @param archetype The archetype, for the refusal's name.
   * @param axis The field.
   * @param seconds The duration.
   */
  function positive(
    archetype: Archetype<string, string>,
    axis: string,
    seconds: number,
  ): void {
    if (!(Number.isFinite(seconds) && seconds > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: archetype.archetype,
        axis,
        value: seconds,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: `a track lasts a positive time, not ${seconds} s`,
        fix: "give the seconds it moves",
      });
  }

  /**
   * Refuse travels outside an articulation's range.
   *
   * @param archetype The archetype.
   * @param articulation The articulation.
   * @param axis The field the travels came from.
   * @param value The value given.
   * @param travels The travels the track reaches.
   */
  function within<Id extends string>(
    archetype: Archetype<Id, string>,
    articulation: Id,
    axis: string,
    value: number,
    travels: readonly number[],
  ): void {
    const affordance: IAutoMovieAffordance = archetype
      .articulate({})
      .affordance(articulation);
    if (!ArchetypeArticulation.KINDS.has(affordance.kind))
      throw new ArchetypeRefusal({
        kind: "articulation",
        archetype: archetype.archetype,
        axis: "articulation",
        value: articulation,
        reason: `${articulation} is a ${affordance.kind}, which does not travel`,
        fix: "name an articulation",
      });
    const range: { minimum: number | null; maximum: number | null } =
      ArchetypeArticulation.range(affordance);
    for (const travel of travels)
      if (
        !Number.isFinite(travel) ||
        (range.minimum !== null && travel < range.minimum - 1e-9) ||
        (range.maximum !== null && travel > range.maximum + 1e-9)
      )
        throw new ArchetypeRefusal({
          kind: "articulation",
          archetype: archetype.archetype,
          axis,
          value,
          feasible: { kind: "range", ...range, unit: "" },
          reason: `${articulation}'s track reaches ${travel}, outside its range`,
          fix: "keep the track inside the articulation's range",
        });
  }
}
