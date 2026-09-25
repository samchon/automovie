import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { AutoMovieHumanBodySimpleParameter } from "../structures/AutoMovieHumanBodySimpleParameter";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";

/** The fractions of a direction's range a measured inversion samples, in order. */
const SAMPLES = [-1, -0.5, 0, 0.5, 1];

/**
 * A direction through the detailed shape that one simple value is solved
 * along: a list of channels with coefficients, and the range of the scalar
 * that scales them. A tape measurement's direction is its channel alone
 * over that channel's envelope; the mass direction spreads a kilogram over
 * the weight macro and the regional fat channels by sex, over the weight
 * macro's envelope, with every channel held inside its own envelope. Given
 * a reading of the shaped body, the scalar is sampled at five fractions of
 * the range and inverted linearly, so the reach a request can be refused
 * against is the reading at the range's ends.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Solves one requested measurement by moving the channels it names in proportion and reading the body back.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the direction, the five-sample inversion and the envelope-holding step the specification fixes for the solved values.
 */
export const humanBodySimpleShapeDirection = {
  /** A channel alone over its envelope. */
  alone(
    basis: IAutoMovieHumanBodyBasis,
    channel: string,
  ): {
    direction: { channel: string; coefficient: number }[];
    range: [number, number];
  } {
    const found = basis.channels.find((one) => one.id === channel);
    if (found === undefined)
      throw new Error("A simple body shape needs the channel " + channel);
    return {
      direction: [{ channel, coefficient: 1 }],
      range: [found.minimum, found.maximum],
    };
  },

  /** The mass direction of the table on this basis at these parameters, channels the basis lacks dropped. */
  mass(
    basis: IAutoMovieHumanBodyBasis,
    parameters: Record<AutoMovieHumanBodySimpleParameter, number>,
  ): {
    direction: { channel: string; coefficient: number }[];
    range: [number, number];
  } {
    const ids = new Set(basis.channels.map((channel) => channel.id));
    const range = basis.channels.find(
      (one) => one.id === HUMAN_BODY_SIMPLE_SHAPE.solved.mass.range,
    );
    if (range === undefined)
      throw new Error(
        "A simple body shape needs the channel " +
          HUMAN_BODY_SIMPLE_SHAPE.solved.mass.range,
      );
    return {
      direction: HUMAN_BODY_SIMPLE_SHAPE.solved.mass.direction
        .filter((row) => ids.has(row.channel))
        .map((row) => ({
          channel: row.channel,
          coefficient: math.term(row, parameters),
        })),
      range: [range.minimum, range.maximum],
    };
  },

  /** The shape with the direction worn at scalar `t`, every channel inside its envelope. */
  worn(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
    direction: { channel: string; coefficient: number }[],
    t: number,
  ): Record<string, number> {
    const trial = { ...shape };
    for (const { channel, coefficient } of direction) {
      const envelope = basis.channels.find((one) => one.id === channel)!;
      trial[channel] = Math.min(
        envelope.maximum,
        Math.max(envelope.minimum, (shape[channel] ?? 0) + t * coefficient),
      );
    }
    return trial;
  },

  /** The reading at the sampled fractions of the range, ascending in `t`. */
  samples(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
    along: {
      direction: { channel: string; coefficient: number }[];
      range: [number, number];
    },
    read: (trial: Record<string, number>) => number | null,
    what: string,
  ): [number, number][] {
    return SAMPLES.map((fraction) => {
      const t =
        fraction < 0 ? -fraction * along.range[0] : fraction * along.range[1];
      const value = read(
        humanBodySimpleShapeDirection.worn(basis, shape, along.direction, t),
      );
      if (value === null)
        throw new Error(`A ${what} cannot be measured on this basis.`);
      return [t, value];
    });
  },

  /**
   * Solve the scalar for `target` and return the worn shape; beyond the
   * reach, refuse, or with `saturate` wear the nearer end of the range. A
   * saturated step belongs inside a coupled fixed point whose final pass is
   * strict: a tape girth solved before the mass has converged can lie past
   * the reach of the unconverged body and inside the reach of the solved
   * one, so only the converged body may refuse it.
   */
  solve(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
    along: {
      direction: { channel: string; coefficient: number }[];
      range: [number, number];
    },
    target: number,
    read: (trial: Record<string, number>) => number | null,
    what: string,
    saturate = false,
  ): Record<string, number> {
    const samples = humanBodySimpleShapeDirection.samples(
      basis,
      shape,
      along,
      read,
      what,
    );
    const inverted = math.invert(samples, target);
    const rising = samples[samples.length - 1][1] > samples[0][1];
    const t =
      inverted !== null || !saturate
        ? inverted
        : target < samples[0][1] === rising
          ? along.range[0]
          : along.range[1];
    if (t === null)
      throw new Error(
        `A ${what} of ${target} is beyond this basis, which reaches ${samples[0][1].toFixed(3)} to ${samples[samples.length - 1][1].toFixed(3)}.`,
      );
    return humanBodySimpleShapeDirection.worn(basis, shape, along.direction, t);
  },
};
