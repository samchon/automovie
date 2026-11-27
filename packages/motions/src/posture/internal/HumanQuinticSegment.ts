/*
 * One minimum-jerk segment between two boundary states: the quintic with the
 * given position, velocity and acceleration at both ends, in closed form.
 *
 * Flash and Hogan (1985, "The coordination of arm movements: an experimentally
 * confirmed mathematical model", J. Neurosci. 5(7):1688-1703) show that the
 * path minimising the integrated squared jerk over a fixed duration satisfies
 * x⁽⁶⁾ = 0, so it is a fifth-order polynomial fixed by six boundary conditions:
 * position, velocity and acceleration at each end. Their rest-to-rest movement
 * is the special case of zero end velocities and accelerations. On the
 * normalised time τ = t / T the polynomial is `Σ b_i τ^i` with
 *
 * - b0 = p0, b1 = v0 T, b2 = a0 T² / 2,
 * - b3 = 10 Δ − (6 v0 + 4 v1) T − (3 a0 − a1) T² / 2,
 * - b4 = −15 Δ + (8 v0 + 7 v1) T + (3 a0 − 2 a1) T² / 2,
 * - b5 = 6 Δ − 3 (v0 + v1) T − (a0 − a1) T² / 2,
 *
 * Δ = p1 − p0: the six conditions solved for the six coefficients (Biagiotti
 * and Melchiorri 2008, "Trajectory Planning for Automatic Machines and Robots",
 * section 2.1.7, there in seconds rather than τ).
 */
export namespace HumanQuinticSegment {
  /*
   * One end's state, per coordinate, in the coordinates' own units.
   */
  export interface IBoundary {
    /*
     * The position.
     */
    position: readonly number[];

    /*
     * The velocity, units per second.
     */
    velocity: readonly number[];

    /*
     * The acceleration, units per second squared.
     */
    acceleration: readonly number[];
  }

  /*
   * A prepared segment.
   */
  export interface ISegment {
    /*
     * The segment's duration T, seconds, positive.
     */
    duration: number;

    /*
     * Each coordinate's coefficients b0 to b5 on the normalised time τ = t / T,
     * in the coordinate's units.
     */
    coefficients: readonly (readonly number[])[];
  }

  /*
   * The segment's state at an instant, per coordinate.
   */
  export interface IState {
    /*
     * The position.
     */
    position: number[];

    /*
     * The velocity, units per second.
     */
    velocity: number[];

    /*
     * The acceleration, units per second squared.
     */
    acceleration: number[];

    /*
     * The jerk, units per second cubed.
     */
    jerk: number[];
  }

  /*
   * The quintic between two boundary states.
   * Parameter start: The state at the segment's start.
   * Parameter end: The state at its end, with the start's coordinates.
   * Parameter duration: The segment's duration, seconds, positive.
   * Returns: The segment's coefficients.
   */
  export function prepare(
    start: IBoundary,
    end: IBoundary,
    duration: number,
  ): ISegment {
    const T: number = duration;
    const T2: number = T * T;
    return {
      duration,
      coefficients: start.position.map((p0: number, c: number): number[] => {
        const v0: number = start.velocity[c]! * T;
        const v1: number = end.velocity[c]! * T;
        const a0: number = start.acceleration[c]! * T2;
        const a1: number = end.acceleration[c]! * T2;
        const delta: number = end.position[c]! - p0;
        return [
          p0,
          v0,
          0.5 * a0,
          10 * delta - 6 * v0 - 4 * v1 - 1.5 * a0 + 0.5 * a1,
          -15 * delta + 8 * v0 + 7 * v1 + 1.5 * a0 - a1,
          6 * delta - 3 * v0 - 3 * v1 - 0.5 * a0 + 0.5 * a1,
        ];
      }),
    };
  }

  /*
   * The position at an instant, by Horner's rule.
   * Parameter segment: The segment.
   * Parameter seconds: The instant from the segment's start, held within [0, T].
   * Returns: Each coordinate's position.
   */
  export function position(segment: ISegment, seconds: number): number[] {
    const u: number = share(segment, seconds);
    return segment.coefficients.map(
      (b: readonly number[]): number =>
        b[0]! + u * (b[1]! + u * (b[2]! + u * (b[3]! + u * (b[4]! + u * b[5]!)))),
    );
  }

  /*
   * The position and its first three derivatives at an instant: the
   * derivatives of `Σ b_i τ^i` by τ, divided by T once for each order.
   * Parameter segment: The segment.
   * Parameter seconds: The instant from the segment's start, held within [0, T].
   * Returns: The state there.
   */
  export function state(segment: ISegment, seconds: number): IState {
    const u: number = share(segment, seconds);
    const T: number = segment.duration;
    const out: IState = {
      position: [],
      velocity: [],
      acceleration: [],
      jerk: [],
    };
    for (const b of segment.coefficients) {
      out.position.push(
        b[0]! +
          u * (b[1]! + u * (b[2]! + u * (b[3]! + u * (b[4]! + u * b[5]!)))),
      );
      out.velocity.push(
        (b[1]! + u * (2 * b[2]! + u * (3 * b[3]! + u * (4 * b[4]! + u * 5 * b[5]!)))) /
          T,
      );
      out.acceleration.push(
        (2 * b[2]! + u * (6 * b[3]! + u * (12 * b[4]! + u * 20 * b[5]!))) /
          (T * T),
      );
      out.jerk.push(
        (6 * b[3]! + u * (24 * b[4]! + u * 60 * b[5]!)) / (T * T * T),
      );
    }
    return out;
  }
}

/*
 * The normalised time τ of an instant, held within [0, 1].
 */
function share(segment: HumanQuinticSegment.ISegment, seconds: number): number {
  return Math.min(1, Math.max(0, seconds / segment.duration));
}
