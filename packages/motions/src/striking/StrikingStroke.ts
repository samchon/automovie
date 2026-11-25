import { Vector3, minimumJerk, superposeMinimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingStroke,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One strike's end-joint path (the wrist or the ankle), from its launch through
 * an optional via point (a kick's chamber) to its contact and back, as
 * superposed minimum-jerk units, with the target's online corrections and the
 * stop at the first surface the weapon meets.
 *
 * A strike aims through its target: its delivery unit would end beyond the
 * contact point, at the share where its speed has fallen to the measured share
 * of its peak at impact ({@link impactShare}), so it lands moving fast instead
 * of arriving at rest. The unit's end is placed along the strike's declared
 * impact direction (straight on, across for a hook or a round kick, up for an
 * uppercut), and a correcting unit over the same span puts the joint exactly on
 * the contact point at the contact second. Units start with zero velocity and
 * acceleration, so the path is continuous in position, velocity and
 * acceleration everywhere except at a contact, where the weapon stops on the
 * surface it met (an impact) and recoils from there on a minimum-jerk unit to
 * its return point.
 */
export namespace StrikingStroke {
  /**
   * How long a weapon stays on the surface it met before it recoils, seconds:
   * the 10 to 20 ms contact of measured punches and kicks (Pędzich et al. 2006;
   * Gavagan and Sayers 2017), taken at its middle.
   */
  export const DWELL: number = 0.015;

  /**
   * The share of a minimum-jerk unit at which its speed has fallen to a share
   * of its peak, after the peak: `s'(u) = 30 u^2 (1-u)^2` against the peak
   * 1.875 at the middle, solved for `u(1-u)` and the root above one half.
   *
   * @param speed The share of the peak speed, in (0, 1].
   * @returns The unit share, in [0.5, 1).
   * @throws {Error} When the speed share lies outside (0, 1].
   */
  export function impactShare(speed: number): number {
    if (!(speed > 0 && speed <= 1))
      throw new Error("An impact speed share lies in (0, 1]");
    const product: number = Math.sqrt((speed * 1.875) / 30);
    return (1 + Math.sqrt(Math.max(0, 1 - 4 * product))) / 2;
  }

  /**
   * The delivery's units: to the via point, then through the contact along the
   * impact direction, plus the correction that puts the joint exactly on the
   * contact point at the contact second.
   *
   * @param d The delivery.
   * @returns Units with film-second starts.
   * @throws {Error} When the delivery would end before it begins.
   */
  export function delivery(
    d: IAutoMovieMotionHumanStrikingStroke.IDelivery,
  ): IAutoMovieSuperposeMinimumJerk.IUnit[] {
    const units: IAutoMovieSuperposeMinimumJerk.IUnit[] = [];
    let from: IAutoMovieVector3 = d.origin;
    let begin: number = d.launch;
    if (d.via !== undefined) {
      units.push({
        displacement: Vector3.subtract(d.via.point, d.origin),
        start: d.via.begin,
        duration: d.via.end - d.via.begin,
      });
      from = d.via.point;
      begin = d.via.end - d.via.overlap;
    }
    const u: number = impactShare(d.speed);
    const s: number = minimumJerk.share(u);
    let span: number = d.contact - begin;
    if (!(span > 0))
      throw new Error("A strike's delivery ends after it begins");
    const length: number = Vector3.distance(d.impact, from);
    const through: IAutoMovieVector3 = Vector3.add(
      d.impact,
      Vector3.scale(Vector3.normalize(d.direction), length * (1 / s - 1)),
    );
    // A unit that peaks at the given speed lasts 1.875 times its length
    // over that speed; it starts that share of itself before the contact.
    if (d.peak !== undefined) {
      const fast: number =
        (u * 1.875 * Vector3.distance(through, from)) / d.peak;
      if (fast < span) {
        begin = d.contact - fast;
        span = fast;
      }
    }
    units.push({
      displacement: Vector3.subtract(through, from),
      start: begin,
      duration: span / u,
    });
    const reached: IAutoMovieVector3 = Vector3.add(
      from,
      Vector3.scale(Vector3.subtract(through, from), s),
    );
    const fix: IAutoMovieVector3 = Vector3.subtract(d.impact, reached);
    if (Vector3.length(fix) > 1e-12)
      units.push({ displacement: fix, start: begin, duration: span });
    return units;
  }

  /**
   * Evaluate a stroke causally: its position at a second reads the target's
   * corrections and the struck body only at or before that second.
   *
   * @param input The stroke.
   * @returns The evaluator.
   */
  export function create(
    input: IAutoMovieMotionHumanStrikingStroke.IInput,
  ): IAutoMovieMotionHumanStrikingStroke.IStroke {
    const corrections: (
      seconds: number,
    ) => readonly IAutoMovieSuperposeMinimumJerk.IUnit[] = (
      seconds: number,
    ): readonly IAutoMovieSuperposeMinimumJerk.IUnit[] =>
      input.tracker?.units(seconds) ?? EMPTY_UNITS;

    // The return from a point at a second: straight, or out through the
    // re-chamber point on two overlapping units (Flash and Hogan's via-point
    // movements are fitted by such overlapping units).
    const recoil = (
      from: IAutoMovieVector3,
      at: number,
    ): IAutoMovieSuperposeMinimumJerk.IUnit[] =>
      input.rechamber === undefined
        ? [
            {
              displacement: Vector3.subtract(input.back(), from),
              start: at,
              duration: input.recoil,
            },
          ]
        : [
            {
              displacement: Vector3.subtract(input.rechamber, from),
              start: at,
              duration: 0.45 * input.recoil,
            },
            {
              displacement: Vector3.subtract(input.back(), input.rechamber),
              start: at + 0.35 * input.recoil,
              duration: 0.65 * input.recoil,
            },
          ];
    const free = (seconds: number): IAutoMovieVector3 => {
      const units: IAutoMovieSuperposeMinimumJerk.IUnit[] = [
        ...input.units,
        ...corrections(seconds),
      ];
      if (seconds > input.contact) {
        const settled: IAutoMovieVector3 = [
          ...input.units,
          ...corrections(input.contact),
        ].reduce(
          (
            p: IAutoMovieVector3,
            u: IAutoMovieSuperposeMinimumJerk.IUnit,
          ): IAutoMovieVector3 => Vector3.add(p, u.displacement),
          input.origin,
        );
        units.push(...recoil(settled, input.contact));
      }
      return superposeMinimumJerk.position(input.origin, units, seconds);
    };

    // The stop is the contact the performance resolved jointly with every
    // other weapon (`fixed`); the stroke scans nothing itself.
    const stop = (seconds: number): number | undefined =>
      input.fixed !== undefined &&
      input.fixed !== null &&
      input.fixed <= seconds
        ? input.fixed
        : undefined;
    return {
      stop,
      free,
      end: (seconds: number): IAutoMovieVector3 => {
        const at: number | undefined = stop(seconds);
        if (at === undefined) return free(seconds);
        const met: IAutoMovieVector3 = free(at);
        return superposeMinimumJerk.position(
          met,
          recoil(met, at + DWELL),
          seconds,
        );
      },
    };
  }
}

/**
 * Shared absence of correction units; consumers only spread this private
 * readonly list.
 */
const EMPTY_UNITS: readonly IAutoMovieSuperposeMinimumJerk.IUnit[] = [];
