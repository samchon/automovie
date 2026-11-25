import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/**
 * One crossing, located by time from the nearer endpoint rather than a rounded
 * whole-span share.
 */
interface IEvent {
  /** Seconds from the selected time endpoint. */
  offset: number;
  /** True when offset is measured backward from the end. */
  fromEnd: boolean;
  /** Travel per second, signed in the original direction. */
  rate: number;
}

/** A prepared quintic with scalar playback and one monotone inverse. */
interface IProfile {
  /** Value at a phase measured from the chosen nearer endpoint. */
  value(phase: number, fromEnd: boolean): number;
  /** The unique crossing of a supported requested travel. */
  crossing(requested: number): IEvent;
}

/**
 * Compile the same minimum-jerk quintic in a scale-aware, endpoint-anchored
 * form.
 *
 * @param archetype The refusal name.
 * @param from Initial finite travel.
 * @param to Final finite travel.
 * @param seconds Admitted finite positive duration.
 * @returns Scalar playback and a monotone crossing computation.
 * @throws {AutoMovieArchetypeRefusal} For an unrepresentable span, unsupported
 *   crossing or rate/offset.
 */
export function ArchetypeTrackProfile(
  archetype: string,
  from: number,
  to: number,
  seconds: number,
): IProfile {
  const span: number = to - from;
  const magnitude: number = Math.abs(span);
  if (magnitude === Infinity)
    refuse("travel", span, "the endpoint difference is not representable");

  return { value, crossing };

  /** The positive remainder factor of the quintic, in [4,10] on its nearer half. */
  function polynomial(r: number): number {
    return 10 - 15 * r + 6 * r * r;
  }

  /**
   * Evaluate displacement before rounding a tiny polynomial into a standalone
   * scalar.
   */
  function value(r: number, fromEnd: boolean): number {
    if (!(r >= 0 && r <= 1))
      refuse(
        "seconds",
        r,
        "the mechanism phase must be finite and inside its interval",
      );
    if (r === 0) return fromEnd ? to : from;
    const offset: number = ArchetypeMassArithmetic.product(
      span,
      r,
      r,
      r * polynomial(r),
    );
    const result: number = fromEnd ? to - offset : from + offset;
    return result;
  }

  /**
   * Solve from the closer physical endpoint, preserving tiny interior targets
   * and their rates.
   */
  function crossing(requested: number): IEvent {
    if (
      !(
        magnitude > 0 &&
        requested >= Math.min(from, to) &&
        requested <= Math.max(from, to)
      )
    )
      refuse(
        "launch",
        requested,
        "the requested travel is not inside a moving track",
      );
    if (requested === from) return { offset: 0, fromEnd: false, rate: 0 };
    if (requested === to) return { offset: 0, fromEnd: true, rate: 0 };
    const fromDistance: number = Math.abs(requested - from);
    const toDistance: number = Math.abs(to - requested);
    const fromEnd: boolean = toDistance < fromDistance;
    const distance: number = fromEnd ? toDistance : fromDistance;
    let root: number;
    if (fromDistance === toDistance) root = 0.5;
    else {
      const target: number = Math.log(distance) - Math.log(magnitude);
      let low: number = (target - Math.log(10)) / 3;
      let high: number = Math.min(Math.log(0.5), (target - Math.log(4)) / 3);
      for (let k: number = 0; k < 60; k++) {
        const middle: number = low + (high - low) / 2;
        const r: number = Math.exp(middle);
        if (3 * middle + Math.log(polynomial(r)) < target) low = middle;
        else high = middle;
      }
      root = Math.exp(high);
    }
    const offset: number = ArchetypeMassArithmetic.product(seconds, root);
    if (!(offset > 0 && offset < seconds))
      refuse(
        "launch",
        requested,
        "the interior crossing offset is not representable",
      );
    const rate: number =
      Math.sign(span) *
      ArchetypeMassArithmetic.ratio(
        distance,
        30 * (1 - root) * (1 - root),
        seconds,
        root * polynomial(root),
      );
    if (Math.abs(rate) === Infinity)
      refuse("launch", requested, "the crossing rate is not representable");

    return { offset, fromEnd, rate };
  }

  /** Keep unsupported numeric domains in the existing authored repair contract. */
  function refuse(axis: string, value: number, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis,
      value,
      reason,
      feasible: null,
      fix: "use supported endpoint travels and a clock that represents the crossing and rate",
    });
  }
}
