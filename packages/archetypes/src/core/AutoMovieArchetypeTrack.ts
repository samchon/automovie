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
 * An archetype's own movements: one articulation's travel as a function of film seconds from a start second, for a part that moves by itself once released, as a trebuchet's arm swings when its pin is pulled or a door swings shut on its closer.
 *
 * `swing` lets a body hung on a hinge fall from a release travel as a rigid pendulum under gravity, the model's `+Y` up: `I θ'' = -m g A sin θ`, `θ` the turn from where the body hangs at rest and `A` the centre of mass's lever square to the hinge in the vertical plane. Below `SMALL` it is the closed form `θ0 cos(ω t)`, `ω = sqrt(m g A / I)`; above it the engine's one integrator (`integrateMotionTrajectory`) solves the full equation. `ease` carries a travel from one value to another over a duration on the minimum-jerk profile. A track may name a `launch` travel, the instant and rate at which it first passes that travel, where a released projectile leaves the part. Before its start a track holds its first travel, after its end its last.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a track is, the pendulum's equation and its two solutions, the ease, the launch and the held ends.
 * @evidence contracts/development/design.md#principled-representation A track is a pure function of film seconds over one articulation, the closed-form or integrated solution read the same way, so a performance reads it as it reads an act's drive.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `pendulum` reads a hinged body's figures, `swing` and `ease` make the two tracks #3476 asks for, each with an optional launch, and `agm` gives the exact period's mean that fixes `SMALL`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A track never leaves its articulation's range: a swing or an ease that would is refused when it is made, never clamped.
 */
export namespace AutoMovieArchetypeTrack {
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

    /** The finite film second the movement begins. */
    start: number;

    /** The finite film second it ends, strictly later than start, after which travel holds. */
    end: number;

    /**
     * The travel at a film second, in the articulation's unit: degrees for a hinge, metres for a slider; the first travel before `start`, the last after `end`.
     *
     * @throws {AutoMovieArchetypeRefusal} When the sample second is non-finite.
     * @evidence contracts/development/common.md#meaningful-documentation States the unit, held ends and finite-clock refusal.
     * @evidence contracts/development/implementation.md#principled-implementation ArchetypeTrackTime admits the finite sample and selects exact held offsets before subtraction; the track reads its prepared solution only inside that span.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit finite sample, select held endpoints, then read.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-finite sample times are refused rather than clamped into an endpoint.
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
   * The arithmetic-geometric mean of two finite positive numbers.
   *
   * @param a One number.
   * @param b The other.
   * @returns Their mean, the common limit of the arithmetic and geometric means iterated.
   * @throws {AutoMovieArchetypeRefusal} For non-finite or nonpositive inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Gauss's iteration, quadratically convergent, stopped at agreement or the existing 64-round bound. Ordinary normal inputs retain their order. A subnormal input pair is lifted by the common exact power2^52 when that cannot overflow, so every mean remains normal before final rescaling; a mixed pair too large for that lift already reaches two normal values after its first iteration. Overflowing means or subnormal/overflowing products use equivalent bounded mean and square-root factorizations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid inputs refuse without a clamp or guessed mean; exact homogeneous scaling prevents a subnormal quantization cycle and factorization changes only exceptional numeric evaluation, not the iteration.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most the existing 64 constant-work rounds; actual swing amplitudes converge within a handful.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function agm(a: number, b: number): number {
    if (!(Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0))
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
        Number.isFinite(product) && product >= 2 ** -1022
          ? Math.sqrt(product)
          : Math.sqrt(a) * Math.sqrt(b);
      a = Number.isFinite(next)
        ? next
        : Math.min(a, b) + (Math.max(a, b) - Math.min(a, b)) / 2;
      b = geometric;
    }
    return a / scale;
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
   * @throws {AutoMovieArchetypeRefusal} When the id is no hinge, or gravity turns nothing about it (an upright axis, or the centre of mass on the axis).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, that the whole model swings, its frame and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The moment about the hinge's rest axis by the parallel-axis theorem (`AutoMovieArchetype.moment`); the centre of mass's offset square to the axis turns as `r cos t + (a x r) sin t`, whose height is `A cos(t - phi)`, so the lever is that amplitude and the rest travel is `phi + 180` degrees, where the height is least.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the hinge, project the offset, then the lever and the rest travel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hinge gravity cannot turn is refused, never given a period.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieArchetype.moment` and `AutoMovieArchetypeFrame.axis`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * @param props `start`, the film second it is released; `release`, the travel it is released at, at rest, degrees; `seconds`, how long it swings, after which it holds; `pendulum`, the swinging body's figures, `pendulum(archetype, hinge)` when absent; `launch`, a travel whose first passing is the launch.
   * @returns The track.
   * @throws {AutoMovieArchetypeRefusal} As `pendulum` does; when the interval or custom pendulum figures are invalid or unrepresentable; when the release is outside the single rest-centred oscillatory well (strictly less than 180 degrees from rest); when that oscillation leaves the hinge's range; or when the launch travel is not passed while it swings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, the default body, the held end and the refusals; start and samples are finite, duration is positive and end must remain representably later.
   * @evidence contracts/development/implementation.md#principled-implementation `I θ'' = -m g A sin θ` from rest: below `SMALL` the closed form `θ0 cos(ω t)`, whose period is within `PERIOD` of the exact one; above it the same RK4 owner solves d²θ/dτ²=-sinθ with τ=ωt and converts rate by ω. The fixed STEP value remains unchanged in this dimensionless phase coordinate, avoiding stiffness and tying preparation cost to physical oscillation rather than arbitrary time units. The single-well solution requires abs(release-rest)<180 degrees: the inverted equilibrium separates adjacent potential wells (NIST DLMF22.19(i), https://dlmf.nist.gov/22.19). Within that well energy is conserved, so the swing's reach is the release's distance past rest, checked against the range once. The launch is the closed form's first crossing `acos(θL / θ0) / ω`, or the integrated trajectory's first sign change bisected in phase with a difference-form midpoint; only an interior final phase converts to seconds, while phase endpoints map directly to clock endpoints. A strict interior event must retain an interior clock offset, so scaling cannot promote it to a held endpoint or overflow a physical-time bracket.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Snapshot input scalars and admit the interval and physical figures, then prepare the solution and launch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts ArchetypePendulumFrequency admits custom finite positive figures and classifies every intermediate for frequency arithmetic; small-angle travel stays in degrees; release must stay within the declared rest well without wrapping its authored travel, and nonlinear phase step count and final launch rate must be representable; ArchetypeTrackTime owns interval/sample admission. No friction or air drag damps the swing: none was read; a stop that would end it is the producer's range, refused, not hit.
   * @evidence contracts/development/implementation.md#efficient-algorithms The closed form is constant work; separate scalar angle/rate closures avoid an unused derivative and paired-record allocation per read. Integration retains the engine step value on normalized phase with a finite safe discrete count, then reads in constant time; no global small resource bound is claimed for arbitrary long intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's one integrator; the trajectory is integrated once per track.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The track retains prepared scalar values and, when integrated, its trajectory for as long as its caller keeps it; later mutation of the input record does not rewrite the plan.
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
    if (requested !== undefined && !Number.isFinite(requested))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: name,
        axis: "launch",
        value: requested,
        feasible: null,
        reason: "a launch needs a finite requested travel",
        fix: "give a finite travel the swing actually crosses",
      });
    const end: number = ArchetypeTrackTime.end(name, start, seconds);
    const body: IPendulum = props.pendulum ?? pendulum(archetype, hinge);
    const omega: number = ArchetypePendulumFrequency(name, body);
    const rest: number = body.rest;
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
    const phaseEnd: number = omega * seconds;
    if (!Number.isFinite(phaseEnd))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: name,
        axis: "seconds",
        value: seconds,
        feasible: null,
        reason:
          "the swing's angular phase is not representable over this interval",
        fix: "use a representable swing interval and frequency",
      });
    const amplitude: number = release - rest;
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
      if (!(Number.isSafeInteger(steps) && steps > 0))
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
    if (requested !== undefined) {
      const target: number = requested - rest;
      let atPhase: number | null = null;
      if (Math.abs(theta0) <= SMALL && Math.abs(target) <= Math.abs(amplitude))
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
        !Number.isFinite(at) ||
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
      if (!Number.isFinite(launchRate))
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: name,
          axis: "launch",
          value: requested,
          feasible: null,
          reason: "the swing's launch rate is not representable",
          fix: "use physical figures with a representable release rate",
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
   * An articulation carried from one travel to another over a duration on the minimum-jerk profile, `x0 + (x1 - x0)(10 s^3 - 15 s^4 + 6 s^5)` with `s` the share of the duration elapsed: the path that minimises the integrated squared jerk between two rests (Flash and Hogan, The coordination of arm movements: an experimentally confirmed mathematical model, J. Neurosci. 5(7):1688-1703, 1985, https://www.jneurosci.org/content/5/7/1688), taken for a mechanism such as a door closer as #3476 asks, provisional for one: no closer's measured motion was read.
   *
   * @param archetype The archetype the articulation belongs to, for its range.
   * @param articulation The articulation.
   * @param props `start`, the film second it begins; `from` and `to`, the travels, in the articulation's unit; `seconds`, the duration; `launch`, a travel between them whose passing is the launch.
   * @returns The track.
   * @throws {AutoMovieArchetypeRefusal} When the id is no articulation, interval/sample time is unsupported, a travel is out of range, the endpoint difference or launch rate is unrepresentable, or the launch is outside a moving track.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the profile, its source, its provisional use for a mechanism, each input and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Flash and Hogan's quintic starts and ends at rest with zero acceleration. The launch is its monotone crossing, found by bisection on the share with exact endpoint crossings; the rate `(x1-x0) 30 s^2 (1-s)^2 / T` uses the shared exceptional scalar quotient. The clock owner selects held endpoints before subtraction; a non-finite endpoint difference or final rate is explicitly outside this API's numeric domain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, then the closed form and the launch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A travel outside the range, non-finite clock or unrepresentable span/rate is refused, never capped or clamped; no physical limit or old range margin changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read; the launch's bisection runs once.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call makes one independent track.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only prepared scalar snapshots and pure profile/clock closures, without the mutable input record or model.
   */
  export function ease<Id extends string>(
    archetype: AutoMovieArchetype<Id, string>,
    articulation: Id,
    props: Parameters<typeof ArchetypeTrackEase<Id>>[2],
  ): ITrack<Id> {
    return ArchetypeTrackEase(archetype, articulation, props);
  }
}
