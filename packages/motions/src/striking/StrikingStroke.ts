import { Vector3, minimumJerk, superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { StrikingAim } from "./StrikingAim";
import { StrikingContact } from "./StrikingContact";

/**
 * One strike's end-joint path (the wrist or the ankle), from its launch
 * through an optional via point (a kick's chamber) to its contact and back,
 * as superposed minimum-jerk units, with the target's online corrections and
 * the stop at the first surface the weapon meets.
 *
 * A strike aims through its target: its delivery unit would end beyond the
 * contact point, at the share where its speed has fallen to the measured
 * share of its peak at impact ({@link impactShare}), so it lands moving fast
 * instead of arriving at rest. The unit's end is placed along the strike's
 * declared impact direction (straight on, across for a hook or a round kick,
 * up for an uppercut), and a correcting unit over the same span puts the
 * joint exactly on the contact point at the contact second. Units start with
 * zero velocity and acceleration, so the path is continuous in position,
 * velocity and acceleration everywhere except at a contact, where the weapon
 * stops on the surface it met (an impact) and recoils from there on a
 * minimum-jerk unit to its return point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path model, the aim through the target, the continuity it keeps and where it breaks.
 * @evidence contracts/development/design.md#principled-representation A delivery and a stroke in world metres and film seconds as superposed minimum-jerk units, with the stop as a film second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dwell, the impact share, the delivery and stroke types and the two builders the punch and kick laws use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's minimum-jerk units and the tracker type.
 */
export namespace StrikingStroke {
  /**
   * How long a weapon stays on the surface it met before it recoils,
   * seconds: the 10 to 20 ms contact of measured punches and kicks (Pędzich et
   * al. 2006; Gavagan and Sayers 2017), taken at its middle.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the derivation, the domain, the range and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk speed profile solved in closed form for the later root of `u(1-u)` at the given share of the peak.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One validation and one closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A share outside its domain throws; the discriminant is floored at zero only against rounding at a share of 1.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function impactShare(speed: number): number {
    if (!(speed > 0 && speed <= 1))
      throw new Error("An impact speed share lies in (0, 1]");
    const product: number = Math.sqrt((speed * 1.875) / 30);
    return (1 + Math.sqrt(Math.max(0, 1 - 4 * product))) / 2;
  }

  /**
   * A planned delivery, film seconds and world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation World points and a direction, film-second instants, an optional via point with its timing, and a speed share; the delivery's span is checked when building.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a punch and a kick (with its chamber) pass to the builder.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IDelivery {
    /** The end joint at the launch. */
    origin: IAutoMovieVector3;

    /** An optional via point (a chamber) with the second it is reached and how early the delivery overlaps it. */
    via?: {
      point: IAutoMovieVector3;
      begin: number;
      end: number;
      overlap: number;
    };

    /** Where the end joint is at the contact. */
    impact: IAutoMovieVector3;

    /** The direction the joint travels at the contact. */
    direction: IAutoMovieVector3;

    /** The launch, film seconds. */
    launch: number;

    /** The contact, film seconds. */
    contact: number;

    /** The share of peak speed left at the contact. */
    speed: number;

    /**
     * The joint's peak speed on the delivery unit, m/s: the unit then starts
     * so late that it reaches this peak, the joint holding its place before.
     * Absent, the unit spans the whole delivery from the launch.
     */
    peak?: number;
  }

  /**
   * The delivery's units: to the via point, then through the contact along
   * the impact direction, plus the correction that puts the joint exactly on
   * the contact point at the contact second.
   *
   * @param d The delivery.
   * @returns Units with film-second starts.
   * @throws {Error} When the delivery would end before it begins.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units produced and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A via unit to the chamber, a delivery unit aimed through the contact so the measured share of peak speed remains at it, and a correcting unit over the same span that lands the joint exactly on the contact point. With a peak speed, the unit lasts as long as a minimum-jerk unit over its length takes to peak at that speed (its peak is 1.875 times its mean speed), ending at the contact share, so the joint's own movement is as fast as measured while the delivery keeps its measured length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Via, delivery and correction in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive span throws; a correction under 1e-12 m is omitted as rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function delivery(d: IDelivery): superposeMinimumJerk.IUnit[] {
    const units: superposeMinimumJerk.IUnit[] = [];
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
    const s: number = minimumJerk(u).s;
    let span: number = d.contact - begin;
    if (!(span > 0))
      throw new Error("A strike's delivery ends after it begins");
    const length: number = Vector3.length(Vector3.subtract(d.impact, from));
    const through: IAutoMovieVector3 = Vector3.add(
      d.impact,
      Vector3.scale(Vector3.normalize(d.direction), length * (1 / s - 1)),
    );
    // A unit that peaks at the given speed lasts 1.875 times its length
    // over that speed; it starts that share of itself before the contact.
    if (d.peak !== undefined) {
      const fast: number =
        (u * 1.875 * Vector3.length(Vector3.subtract(through, from))) / d.peak;
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
   * What a stroke evaluates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and the meaning of an absent value.
   * @evidence contracts/development/design.md#principled-representation The delivery's units, optional tracking, the return in world metres and seconds, an optional own-scan gap and the jointly resolved stop, where null means resolved to meet nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch and kick laws pass; the gap and scan serve a stroke not resolved jointly, which the strike laws no longer use, and remain for that capability and its CI test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's units and the tracker type.
   */
  export interface IInput {
    /** The end joint at the launch, world metres. */
    origin: IAutoMovieVector3;

    /** The delivery's units. */
    units: readonly superposeMinimumJerk.IUnit[];

    /** The target's corrections, when the strike tracks one. */
    tracker?: StrikingAim.ITracker;

    /** The planned contact, film seconds: the free recoil starts here when nothing is met. */
    contact: number;

    /** Where the joint returns to. */
    back: IAutoMovieVector3;

    /** The recoil's duration, seconds. */
    recoil: number;

    /**
     * A point the recoil passes on its way back (a kick's re-chamber, which
     * clears the struck body before the foot comes down); a straight return
     * when absent.
     */
    rechamber?: IAutoMovieVector3;

    /**
     * The weapon's signed gap to the struck body at a second, given the end
     * joint's position then; positive while apart. Absent when nothing can be
     * met (a strike at the air).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the sign and the meaning of absence.
     * @evidence contracts/development/implementation.md#principled-implementation Supplied by the caller as a signed distance from the weapon to the struck body's colliders at that second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A single callback the scan reads.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms The caller's distance query, once per scan sample.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The stroke memoises the scan, not each gap.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callback retains what its caller gives it.
     */
    gap?: (end: IAutoMovieVector3, seconds: number) => number;

    /** The contact scan's span and step, film seconds. */
    scan: { from: number; to: number; step: number };

    /**
     * The contact second the performance resolved jointly with every other
     * weapon (`resolveAutoMovieContactEvents`), or null when it resolved that
     * the weapon meets nothing; the stroke's own scan runs only when absent.
     */
    fixed?: number | null;
  }

  /**
   * An evaluated stroke.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its timebase and frame.
   * @evidence contracts/development/design.md#principled-representation The shown path, the free path and the stop as functions of the film second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three readings the strike laws compose and record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IStroke {
    /**
     * The end joint at a second.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the timebase and the frame.
     * @evidence contracts/development/implementation.md#principled-implementation The free path before the stop; after it the met point, held for the dwell and recoiling on minimum-jerk units.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One stop read and one branch.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the units.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the memoised stop.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the stroke.
     */
    end(seconds: number): IAutoMovieVector3;

    /**
     * The second the weapon met a surface, when it has by a second.
     *
     * @param seconds Film seconds.
     * @returns The contact second, or undefined.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the timebase and the meaning of undefined.
     * @evidence contracts/development/implementation.md#principled-implementation The jointly resolved second when given; otherwise the stroke's own fixed-step scan of the gap, bisected at the first crossing and never reading past the asked second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolved second, the memo, then the scan.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms The scan advances once over its span across all calls.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The scan's progress and its found second are memoised for the stroke's life.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one scan position and one found second, released with the stroke.
     */
    stop(seconds: number): number | undefined;

    /**
     * The end joint on its free path, as if it met nothing: what a joint
     * contact resolution sweeps.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the free path is and who reads it.
     * @evidence contracts/development/implementation.md#principled-implementation The delivery's units with the corrections started by the second, and after the planned contact the free recoil from where the units settle.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One superposition.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the units and corrections.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the second and the stroke's input.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    free(seconds: number): IAutoMovieVector3;
  }

  /**
   * Evaluate a stroke causally: its position at a second reads the target's
   * corrections and the struck body only at or before that second.
   *
   * @param input The stroke.
   * @returns The evaluator, memoising its scan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the causality kept and the memo.
   * @evidence contracts/development/implementation.md#principled-implementation Superposed minimum-jerk units for the paths, a recoil through the optional re-chamber on two overlapping units (Flash and Hogan's via-point fit), and a causal scan for the stop when none is resolved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The recoil, the free path and the stop as closures, composed into the shown path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; a nested read during a scan sees the free path, as documented in its comment.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the units per evaluation; the scan's samples are spent once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The scan's progress and found second are memoised so every evaluation order gives the same stop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closures hold the input and the scan state, released with the stroke.
   */
  export function create(input: IInput): IStroke {
    const corrections = (seconds: number): superposeMinimumJerk.IUnit[] => [
      ...(input.tracker?.units(seconds) ?? []),
    ];

    // The return from a point at a second: straight, or out through the
    // re-chamber point on two overlapping units (Flash and Hogan's via-point
    // movements are fitted by such overlapping units).
    const recoil = (
      from: IAutoMovieVector3,
      at: number,
    ): superposeMinimumJerk.IUnit[] =>
      input.rechamber === undefined
        ? [
            {
              displacement: Vector3.subtract(input.back, from),
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
              displacement: Vector3.subtract(input.back, input.rechamber),
              start: at + 0.35 * input.recoil,
              duration: 0.65 * input.recoil,
            },
          ];
    const free = (seconds: number): IAutoMovieVector3 => {
      const units: superposeMinimumJerk.IUnit[] = [
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
            u: superposeMinimumJerk.IUnit,
          ): IAutoMovieVector3 => Vector3.add(p, u.displacement),
          input.origin,
        );
        units.push(...recoil(settled, input.contact));
      }
      return superposeMinimumJerk(input.origin, units, seconds).position;
    };

    // The scan advances on a fixed grid and remembers how far it has found no
    // contact, so the found second is the same whatever order seconds are
    // evaluated in.
    //
    // While a scan reads the struck body, that body may read this weapon back
    // at the same instants (two strikes thrown at once, an arm crossing an
    // arm). Such a nested read sees the weapon on its free path, which is its
    // real path up to the contact the scan is still looking for; resolving
    // both contacts simultaneously would need a joint solve, which this
    // kinematic law does not attempt.
    let clear: number = input.scan.from;
    let armed: boolean = false;
    let found: number | undefined;
    let scanning: boolean = false;
    const stop = (seconds: number): number | undefined => {
      if (input.fixed !== undefined)
        return input.fixed !== null && input.fixed <= seconds
          ? input.fixed
          : undefined;
      if (found !== undefined) return found <= seconds ? found : undefined;
      const gap = input.gap;
      if (gap === undefined || scanning) return undefined;
      scanning = true;
      try {
        // A weapon already touching at the scan's start has met that surface
        // at once (a kick jammed against a leg before its chamber).
        if (!armed) {
          armed = true;
          if (gap(free(clear), clear) <= 0) {
            found = clear;
            return found <= seconds ? found : undefined;
          }
        }
        const until: number = Math.min(seconds, input.scan.to);
        while (clear < until - 1e-12) {
          const next: number = Math.min(input.scan.to, clear + input.scan.step);

          // The struck body is never read beyond the second asked about: a
          // grid point past it is decided by reading at that second instead,
          // and the bisection takes any midpoint past it as already in
          // contact, so the found second is the grid's whenever the weapon
          // stays in contact once it touches.
          if (next > until + 1e-12) {
            if (gap(free(until), until) > 0) return undefined;
            let lo: number = clear;
            let hi: number = next;
            for (let i: number = 0; i < 24; i++) {
              const mid: number = (lo + hi) / 2;
              if (mid >= until || gap(free(mid), mid) <= 0) hi = mid;
              else lo = mid;
            }
            found = hi;
            return found <= seconds ? found : undefined;
          }
          const g: number = gap(free(next), next);
          if (g <= 0) {
            found = StrikingContact.first(
              (t: number): number => gap(free(t), t),
              clear,
              next,
              next - clear,
            );
            return found !== undefined && found <= seconds ? found : undefined;
          }
          clear = next;
        }
        return undefined;
      } finally {
        scanning = false;
      }
    };
    return {
      stop,
      free,
      end: (seconds: number): IAutoMovieVector3 => {
        const at: number | undefined = stop(seconds);
        if (at === undefined) return free(seconds);
        const met: IAutoMovieVector3 = free(at);
        return superposeMinimumJerk(met, recoil(met, at + DWELL), seconds)
          .position;
      },
    };
  }
}
