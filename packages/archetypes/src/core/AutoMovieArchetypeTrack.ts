import { Vector3, integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";
import { ArchetypePendulumFrequency } from "./ArchetypePendulumFrequency";
import { ArchetypeTrackEase } from "./ArchetypeTrackEase";
import { ArchetypeTrackRange } from "./ArchetypeTrackRange";
import { ArchetypeTrackTime } from "./ArchetypeTrackTime";
import type { AutoMovieArchetype } from "./AutoMovieArchetype";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeUnits } from "./AutoMovieArchetypeUnits";

/**
 * An archetype's own movements: one articulation's travel as a function of film
 * seconds from a start second, for a part that moves by itself once released,
 * as a trebuchet's arm swings when its pin is pulled or a door swings shut on
 * its closer.
 *
 * `swing` lets a body hung on a hinge fall from a release travel as a rigid
 * pendulum under gravity, the model's `+Y` up: `I θ'' = -m g A sin θ`, `θ` the
 * turn from where the body hangs at rest and `A` the centre of mass's lever
 * square to the hinge in the vertical plane. Below `SMALL` it is the closed
 * form `θ0 cos(ω t)`, `ω = sqrt(m g A / I)`; above it the engine's one
 * integrator (`integrateMotionTrajectory`) solves the full equation. `ease`
 * carries a travel from one value to another over a duration on the
 * minimum-jerk profile. A track may name a `launch` travel, the instant and
 * rate at which it first passes that travel, where a released projectile leaves
 * the part. Before its start a track holds its first travel, after its end its
 * last.
 */
export namespace AutoMovieArchetypeTrack {
  /** One articulation's travel through film seconds. */
  export interface ITrack<Id extends string = string> {
    /** The articulation moved. */
    articulation: Id;

    /** The finite film second the movement begins. */
    start: number;

    /**
     * The finite film second it ends, strictly later than start, after which
     * travel holds.
     */
    end: number;

    /**
     * The travel at a film second, in the articulation's unit: degrees for a
     * hinge, metres for a slider; the first travel before `start`, the last
     * after `end`.
     *
     * @throws {AutoMovieArchetypeRefusal} When the sample second is non-finite.
     */
    travel(seconds: number): number;

    /**
     * Where the travel first passes the launch travel asked for; null when none
     * was asked.
     */
    launch: ILaunch | null;
  }

  /** The instant a track first passes its launch travel. */
  export interface ILaunch {
    /** The film second. */
    seconds: number;

    /** The travel, the one asked for. */
    travel: number;

    /** The travel's rate there, degrees or metres per second. */
    rate: number;
  }

  /** A body hung on a hinge, as the pendulum equation reads it. */
  export interface IPendulum {
    /** The moment of inertia about the hinge's axis, kg m squared. */
    moment: number;

    /** The swinging mass, kilograms. */
    mass: number;

    /**
     * The centre of mass's distance from the hinge's axis, projected square to
     * the axis and to the horizontal, metres: the lever gravity turns it by.
     */
    arm: number;

    /**
     * The hinge's travel at which the body hangs at rest, its centre of mass
     * lowest, degrees.
     */
    rest: number;
  }

  /**
   * The largest share by which the closed form's period may fall short of the
   * true one: 0.5 %, the bound #3476 holds a swing's period to.
   */
  export const PERIOD: number = 0.005;

  /**
   * The arithmetic-geometric mean of two finite positive numbers.
   *
   * @param a One number.
   * @param b The other.
   * @returns Their mean, the common limit of the arithmetic and geometric means
   *   iterated.
   * @throws {AutoMovieArchetypeRefusal} For non-finite or nonpositive inputs.
   */
  export function agm(a: number, b: number): number {
    if (!(a > 0 && a < Infinity && b > 0 && b < Infinity))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "track",
        axis: "agm",
        value: { a, b },
        feasible: null,
        reason: "the arithmetic-geometric mean needs finite positive inputs",
        fix: "give two finite values above zero",
      });

    // Homogeneity lifts MIN_VALUE to least-normal before means can quantize a cycle.
    const scale: number =
      Math.min(a, b) < 2 ** -1022 &&
      Math.max(a, b) <= Number.MAX_VALUE / 2 ** 52
        ? 2 ** 52
        : 1;
    a *= scale;
    b *= scale;
    for (let k: number = 0; k < 64 && a !== b; k++) {
      const next: number = (a + b) / 2;
      const product: number = a * b;
      const geometric: number =
        product >= 2 ** -1022 && product !== Infinity
          ? Math.sqrt(product)
          : Math.sqrt(a) * Math.sqrt(b);
      a =
        next !== Infinity
          ? next
          : Math.min(a, b) + (Math.max(a, b) - Math.min(a, b)) / 2;
      b = geometric;
    }
    return a / scale;
  }

  /**
   * The release amplitude, radians, up to which the closed form's period, `2 pi
   * / ω`, is within `PERIOD` of the exact one, `2 pi / (ω agm(1, cos(θ0 / 2)))`
   * (Carvalhaes and Suppes, Approximations for the period of the simple
   * pendulum based on the arithmetic-geometric mean, Am. J. Phys.
   * 76(12):1150-1154, 2008,
   * https://suppescorpus.stanford.edu/sites/g/files/sbiybj32751/files/media/file/approximations_for_the_period_of_the_simple_pendulum_based_on_the_arithmetic-geometric_mean_431.pdf):
   * about 0.28 rad, found once by bisection.
   */
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
   * An archetype as a pendulum on one of its hinges: the whole model swinging,
   * so it fits an archetype that is itself the hinged body, such as an
   * assembly's member hung on a hinge or a body built for the purpose.
   *
   * @param archetype The body, its `+Y` up.
   * @param hinge The hinge it swings on.
   * @returns Its pendulum figures, from its own mass properties at rest.
   * @throws {AutoMovieArchetypeRefusal} When the id is no hinge, or gravity
   *   turns nothing about it (an upright axis, or the centre of mass on the
   *   axis).
   */
  export function pendulum<Id extends string>(
    archetype: AutoMovieArchetype<Id, string>,
    hinge: Id,
  ): IPendulum {
    const affordance: IAutoMovieAffordance = archetype
      .articulate({})
      .affordance(hinge);
    if (affordance.kind !== "hinge")
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype: archetype.archetype,
        axis: "hinge",
        value: hinge,
        reason: `${hinge} is a ${affordance.kind}, not a hinge a body swings on`,
        fix: "name a hinge",
      });
    const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      affordance.frame,
      "y",
    );
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
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype: archetype.archetype,
        axis: "hinge",
        value: hinge,
        reason: `gravity turns nothing about ${hinge}: its centre of mass is ${arm} m from the upright plane through its axis`,
        fix: "swing a body on a hinge whose axis is not upright and off its centre of mass",
      });
    const phi: number = Math.atan2(b, a) / AutoMovieArchetypeUnits.DEGREE + 180;
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
   * @param props `start`, the film second it is released; `release`, the travel
   *   it is released at, at rest, degrees; `seconds`, how long it swings, after
   *   which it holds; `pendulum`, the swinging body's figures,
   *   `pendulum(archetype, hinge)` when absent; `launch`, a travel whose first
   *   passing is the launch.
   * @returns The track.
   * @throws {AutoMovieArchetypeRefusal} As `pendulum` does; when the interval
   *   or custom pendulum figures are invalid or unrepresentable; when the
   *   release is outside the single rest-centred oscillatory well (strictly
   *   less than 180 degrees from rest); when that oscillation leaves the
   *   hinge's range; or when the launch travel is not passed while it swings.
   */
  export function swing<Id extends string>(
    archetype: AutoMovieArchetype<Id, string>,
    hinge: Id,
    props: {
      start: number;
      release: number;
      seconds: number;
      pendulum?: IPendulum;
      launch?: number;
    },
  ): ITrack<Id> {
    const name: string = archetype.archetype;
    const start: number = props.start;
    const seconds: number = props.seconds;
    const release: number = props.release;
    const requested: number | undefined = props.launch;
    const end: number = ArchetypeTrackTime.end(name, start, seconds);
    const body: IPendulum = props.pendulum ?? pendulum(archetype, hinge);
    const omega: number = ArchetypePendulumFrequency(name, body);
    const rest: number = body.rest;
    if (!(rest > -Infinity && rest < Infinity))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: name,
        axis: "pendulum.rest",
        value: rest,
        feasible: null,
        reason: "a stable pendulum well needs a finite resting travel",
        fix: "set the neutral travel to an angle on the articulation",
      });
    const reach: number = Math.abs(release - rest);
    const checked: IAutoMovieAffordance = ArchetypeTrackRange(
      archetype,
      hinge,
      "release",
      release,
      [rest - reach, rest + reach],
    );
    if (checked.kind !== "hinge")
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype: name,
        axis: "hinge",
        value: hinge,
        reason: `${hinge} is a ${checked.kind}, not a hinge a body swings on`,
        fix: "name a hinge",
      });

    // A single rest-centred libration cannot cross the inverted equilibrium.
    if (!(reach < 180))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: name,
        axis: "release",
        value: release,
        feasible: null,
        reason:
          "this rest-centred pendulum requires a release strictly within 180 degrees of rest",
        fix: "declare the appropriate stable rest travel and keep the release inside its oscillatory well",
      });
    const amplitude: number = release - rest;
    const target: number | undefined =
      requested === undefined ? undefined : requested - rest;
    if (target !== undefined && !(Math.abs(target) <= reach))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: name,
        axis: "launch",
        value: requested,
        feasible: {
          kind: "range",
          minimum: rest - reach,
          maximum: rest + reach,
          unit: "degrees",
        },
        reason: "the requested travel is outside the pendulum's excursion",
        fix: "choose a launch angle within the swing's excursion",
      });
    const phaseEnd: number = omega * seconds;
    const theta0: number = amplitude * AutoMovieArchetypeUnits.DEGREE;

    // Scalar consumers need either angle or rate, never a newly allocated pair.
    let angle: (phase: number) => number;
    let rate: (phase: number) => number;
    if (Math.abs(theta0) <= SMALL) {
      // Degree amplitude avoids losing a representable travel to radian conversion.
      angle = (phase: number): number => amplitude * Math.cos(phase);
      rate = (phase: number): number =>
        ArchetypeMassArithmetic.product(-amplitude, omega, Math.sin(phase));
    } else {
      const steps: number = Math.ceil(
        phaseEnd / integrateMotionTrajectory.STEP,
      );

      // The integrator advances one exactly indexed step at a time.
      if (!(steps > 0 && steps <= Number.MAX_SAFE_INTEGER))
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: name,
          axis: "seconds",
          value: seconds,
          feasible: null,
          reason:
            "the nonlinear solver's phase step count is not representable",
          fix: "use a representable finite phase interval",
        });
      const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({
          f: (
            _t: number,
            x: readonly number[],
          ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
            dx: [x[1]!, -Math.sin(x[0]!)],
          }),
          x0: [theta0, 0],
          t0: 0,
          t1: phaseEnd,
        });
      angle = (phase: number): number =>
        trajectory.at(phase).x[0]! / AutoMovieArchetypeUnits.DEGREE;
      rate = (phase: number): number =>
        ArchetypeMassArithmetic.product(
          omega,
          trajectory.at(phase).x[1]!,
          1 / AutoMovieArchetypeUnits.DEGREE,
        );
    }
    const travel: (since: number) => number = (since: number): number =>
      rest + angle(omega * since);

    // The launch: the first time the turn reaches the launch's.
    let launch: ILaunch | null = null;
    if (requested !== undefined && target !== undefined) {
      let atPhase: number | null = null;
      if (Math.abs(theta0) <= SMALL)
        atPhase = Math.acos(amplitude === 0 ? 1 : target / amplitude);
      else if (Math.abs(theta0) > SMALL) {
        const step: number = integrateMotionTrajectory.STEP;
        const gap: (phase: number) => number = (phase: number): number =>
          angle(phase) - target;
        for (let phase: number = 0; phase < phaseEnd; phase += step) {
          const low: number = phase;
          const high: number = Math.min(phaseEnd, phase + step);
          if (gap(low) === 0) {
            atPhase = low;
            break;
          }
          if (Math.sign(gap(low)) !== Math.sign(gap(high))) {
            let a: number = low;
            let b: number = high;
            for (let k: number = 0; k < 60; k++) {
              const middle: number = a + (b - a) / 2;
              if (Math.sign(gap(middle)) === Math.sign(gap(a))) a = middle;
              else b = middle;
            }
            atPhase = b;
            break;
          }
        }
      }

      // Phase endpoints own exact clock endpoints; an interior phase must stay interior.
      const at: number | null =
        atPhase === null
          ? null
          : atPhase === 0
            ? 0
            : atPhase === phaseEnd
              ? seconds
              : atPhase / omega;
      if (
        atPhase === null ||
        at === null ||
        atPhase < 0 ||
        atPhase > phaseEnd ||
        (atPhase > 0 && atPhase < phaseEnd && !(at > 0 && at < seconds))
      )
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: archetype.archetype,
          axis: "launch",
          value: requested,
          feasible: {
            kind: "range",
            minimum: rest - reach,
            maximum: rest + reach,
            unit: "degrees",
          },
          reason:
            atPhase !== null && atPhase >= 0 && atPhase <= phaseEnd
              ? "the first crossing has no representable clock offset inside this interval"
              : `${hinge} released at ${release} degrees does not pass ${requested} degrees in ${seconds} s`,
          fix: "choose a passed travel and a clock that represents its crossing instant",
        });
      const launchRate: number = rate(atPhase);
      if (Math.abs(launchRate) === Infinity)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: name,
          axis: "launch",
          value: requested,
          feasible: null,
          reason: "the crossing rate is not representable",
          fix: "use a pendulum whose crossing rate is representable",
        });

      launch = {
        seconds: ArchetypeTrackTime.instant(name, start, end, seconds, at),
        travel: requested,
        rate: launchRate,
      };
    }
    return {
      articulation: hinge,
      start: start,
      end,
      travel: (sample: number): number => {
        const elapsed: number = ArchetypeTrackTime.elapsed(
          name,
          sample,
          start,
          end,
          seconds,
        );
        return elapsed === 0 ? release : travel(elapsed);
      },
      launch,
    };
  }

  /**
   * An articulation carried from one travel to another over a duration on the
   * minimum-jerk profile, `x0 + (x1 - x0)(10 s^3 - 15 s^4 + 6 s^5)` with `s`
   * the share of the duration elapsed: the path that minimises the integrated
   * squared jerk between two rests (Flash and Hogan, The coordination of arm
   * movements: an experimentally confirmed mathematical model, J. Neurosci.
   * 5(7):1688-1703, 1985, https://www.jneurosci.org/content/5/7/1688), taken
   * for a mechanism such as a door closer as #3476 asks, provisional for one:
   * no closer's measured motion was read.
   *
   * @param archetype The archetype the articulation belongs to, for its range.
   * @param articulation The articulation.
   * @param props `start`, the film second it begins; `from` and `to`, the
   *   travels, in the articulation's unit; `seconds`, the duration; `launch`, a
   *   travel between them whose passing is the launch.
   * @returns The track.
   * @throws {AutoMovieArchetypeRefusal} When the id is no articulation,
   *   interval/sample time is unsupported, a travel is out of range, the
   *   endpoint difference or launch rate is unrepresentable, or the launch is
   *   outside a moving track.
   */
  export function ease<Id extends string>(
    archetype: AutoMovieArchetype<Id, string>,
    articulation: Id,
    props: Parameters<typeof ArchetypeTrackEase<Id>>[2],
  ): ITrack<Id> {
    return ArchetypeTrackEase(archetype, articulation, props);
  }
}
