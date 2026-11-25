import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A vaulter's swing on a flexible pole: Linthorne's flexible-pole model
 * (Linthorne 2000, "Energy loss in the pole vault take-off and the advantage of
 * the flexible pole", Sports Engineering 3:205-218), integrated once.
 *
 * The vaulter is a point mass on the end of a massless pole planted at its tip,
 * the end the top hand grips ("the pole length is the height of the vaulter's
 * upper grip on the pole"). At the plant the vaulter's body dissipates `F0^2 /
 * (2k) cos^2(phi + alpha)` (Eq. 3), the buckling load `F0` and the body's
 * stiffness `k`, never more than the rigid pole's loss `1/2 M v^2 cos^2(phi +
 * alpha)` (Eq. 1), the energy of the velocity along the pole; the speed falls
 * by it and keeps its direction. After the plant the only forces are gravity
 * and the pole's, along its chord from the tip, `F = F0 + 0.6 F0 (L0 - L) / L0`
 * while the pole is bent shorter than its length `L0` (Eq. 2, Hubbard 1980's
 * elastica without an end moment). The motion is integrated at the paper's
 * constant step of 0.01 s, each interval's position and velocity from the
 * previous ones and the forces acting ("Results"), as uniformly accelerated
 * motion over the interval. The vaulter releases the pole when it has recoiled
 * to its length ("Take-off and pole plant phases").
 *
 * The motion is in the vault's plane: `forward` along the run from the tip,
 * `up` vertical.
 *
 * @param props The plant's state, the vaulter's mass and the pole.
 * @returns The swing.
 * @throws {HumanRefusal} When the swing does not reach the release
 *   (`poleVaultSwing.integrate`): the run is too slow.
 */
export function poleVaultSwing(
  props: poleVaultSwing.IProps,
): poleVaultSwing.ISwing {
  const outcome: poleVaultSwing.IOutcome = poleVaultSwing.integrate(props);
  if (outcome.failure !== null)
    throw new HumanRefusal({
      kind: "base",
      axis: "run",
      value: props.run,
      reason: `at ${props.run.toFixed(2)} m/s ${outcome.failure}`,
      fix: "run faster into the vault, or grip lower",
    });
  const samples: readonly poleVaultSwing.ISample[] = outcome.samples;
  return {
    samples,
    duration: samples[samples.length - 1]!.seconds,
    length: outcome.length,
    at: (seconds: number): poleVaultSwing.ISample => {
      const k: number = Math.min(
        samples.length - 1,
        Math.max(0, Math.floor(seconds / poleVaultSwing.STEP)),
      );
      const from: poleVaultSwing.ISample = samples[k]!;
      const tau: number = Math.max(0, seconds - from.seconds);
      return {
        seconds,
        position: {
          forward:
            from.position.forward +
            from.velocity.forward * tau +
            0.5 * from.acceleration.forward * tau * tau,
          up:
            from.position.up +
            from.velocity.up * tau +
            0.5 * from.acceleration.up * tau * tau,
        },
        velocity: {
          forward: from.velocity.forward + from.acceleration.forward * tau,
          up: from.velocity.up + from.acceleration.up * tau,
        },
        acceleration: from.acceleration,
      };
    },
  };
}

/** Companion types and constants of {@link poleVaultSwing}. */
export namespace poleVaultSwing {
  /**
   * The integration's step, seconds: Linthorne 2000's constant 0.01 s, "found
   * to be adequate".
   */
  export const STEP: number = 0.01;

  /**
   * The vaulter's body stiffness in the pole plant, newtons per metre (`k` of
   * Eq. 3: about 250 for a world-class vaulter, Gros and Kunkel 1988, 1990;
   * Angulo-Kinzler et al. 1994, as Linthorne 2000 reads them).
   */
  export const BODY: number = 250;

  /**
   * The newtons of Euler buckling load per kilogram of a pole's stiffness
   * rating: a pole rated at 80 kg buckles at about 800 N (Fuchimoto, Ito and
   * Kaneko 1991, as Linthorne 2000 reads it).
   */
  export const RATING: number = 800 / 80;

  /** A vector in the vault's plane, metres or metres per second. */
  export interface IPlane {
    /** Along the run from the planted tip. */
    forward: number;

    /** Vertical. */
    up: number;
  }

  /** What a swing starts from. */
  export interface IProps {
    /** The top hand's grip from the planted tip at the plant, metres. */
    radius: IPlane;

    /** The grip's velocity at the plant, metres per second. */
    velocity: IPlane;

    /** The vaulter's mass, kilograms. */
    mass: number;

    /** The pole's Euler buckling load, newtons. */
    buckling: number;

    /** Gravity's magnitude, metres per second squared. */
    gravity: number;

    /**
     * The chord's angle from upright, radians, past which a swing that stops
     * turning has carried the pole upright.
     */
    upright: number;

    /** The run's speed, for the refusal, metres per second. */
    run: number;
  }

  /** One integrated instant of the swing. */
  export interface ISample {
    /** Seconds after the plant. */
    seconds: number;

    /** The grip from the tip, metres. */
    position: IPlane;

    /** The grip's velocity, metres per second. */
    velocity: IPlane;

    /** The acceleration over the interval from this instant. */
    acceleration: IPlane;
  }

  /** How an integration ended. */
  export interface IOutcome {
    /** The instants at the step, from the plant to the last reached. */
    samples: readonly ISample[];

    /** The pole's chord at rest, the grip's distance from the tip, metres. */
    length: number;

    /** Why the swing stops short of the release; null when it reaches it. */
    failure: string | null;
  }

  /** The integrated swing and its reader. */
  export interface ISwing {
    /** The instants at the step, from the plant to the release. */
    samples: readonly ISample[];

    /** Seconds from the plant to the release. */
    duration: number;

    /** The pole's chord at rest, the grip's distance from the tip, metres. */
    length: number;

    /**
     * The grip at a second of the swing: the interval's uniformly accelerated
     * motion from its start, the model's own.
     */
    at: (seconds: number) => ISample;
  }

  /**
   * Integrate a swing from the plant until the pole recoils to its length, or
   * until it fails: the plant carries the vaulter away from the tip at once,
   * the vaulter swings back before the pole stands upright, or comes down to
   * the floor.
   *
   * @param props The plant's state, the vaulter's mass and the pole.
   * @returns The instants and how the integration ended.
   */
  export function integrate(props: IProps): IOutcome {
    const length: number = Math.hypot(props.radius.forward, props.radius.up);
    const along: IPlane = {
      forward: props.radius.forward / length,
      up: props.radius.up / length,
    };

    // Eq. 3, capped by Eq. 1: the velocity's component along the pole carries
    // the energy the plant can take.
    const speed: number = Math.hypot(props.velocity.forward, props.velocity.up);
    const cosine: number =
      speed > 0
        ? (props.velocity.forward * along.forward +
            props.velocity.up * along.up) /
          speed
        : 0;
    const rigid: number = 0.5 * props.mass * speed * speed * cosine * cosine;
    const lost: number = Math.min(
      rigid,
      ((props.buckling * props.buckling) / (2 * BODY)) * cosine * cosine,
    );
    const kept: number =
      speed > 0
        ? Math.sqrt(Math.max(0, speed * speed - (2 * lost) / props.mass)) /
          speed
        : 0;

    // The integration at the paper's step, from the plant to the release.
    const samples: ISample[] = [
      {
        seconds: 0,
        position: { ...props.radius },
        velocity: {
          forward: props.velocity.forward * kept,
          up: props.velocity.up * kept,
        },
        acceleration: { forward: 0, up: -props.gravity },
      },
    ];
    let bent: boolean = false;
    for (;;) {
      const now: ISample = samples[samples.length - 1]!;
      const chord: number = Math.hypot(now.position.forward, now.position.up);
      const force: number =
        chord < length
          ? props.buckling + (0.6 * props.buckling * (length - chord)) / length
          : props.buckling;
      const acceleration: IPlane = {
        forward: (force / props.mass) * (now.position.forward / chord),
        up: (force / props.mass) * (now.position.up / chord) - props.gravity,
      };
      now.acceleration = acceleration;
      const h: number = STEP;
      const next: ISample = {
        seconds: now.seconds + h,
        position: {
          forward:
            now.position.forward +
            now.velocity.forward * h +
            0.5 * acceleration.forward * h * h,
          up:
            now.position.up +
            now.velocity.up * h +
            0.5 * acceleration.up * h * h,
        },
        velocity: {
          forward: now.velocity.forward + acceleration.forward * h,
          up: now.velocity.up + acceleration.up * h,
        },
        acceleration,
      };
      const reached: number = Math.hypot(
        next.position.forward,
        next.position.up,
      );
      const angle: number = Math.atan2(next.position.forward, next.position.up);
      const rate: number =
        (next.position.up * next.velocity.forward -
          next.position.forward * next.velocity.up) /
        (reached * reached);
      if (reached < length) bent = true;
      else if (!bent)
        return {
          samples,
          length,
          failure: "the plant carries the body away from the planted pole",
        };
      if (bent && reached >= length) {
        samples.push(next);
        return { samples, length, failure: null };
      }
      if (!(rate > 0) && angle < props.upright)
        return {
          samples,
          length,
          failure: `the body swings back from the bent pole at ${((angle * 180) / Math.PI).toFixed(0)} degrees from upright`,
        };
      if (next.position.up <= 0)
        return {
          samples,
          length,
          failure: "the body comes down to the floor on the pole",
        };
      samples.push(next);
    }
  }
}
