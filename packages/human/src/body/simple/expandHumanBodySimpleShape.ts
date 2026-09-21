import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { measureHumanBodySimpleShape as measure } from "./measureHumanBodySimpleShape";
import { projectHumanBodySimpleShape } from "./projectHumanBodySimpleShape";

/** The weights each measured inversion samples, in order. */
const SAMPLES = [-1, 0, 1];
/**
 * The coupled inversions (a girth changes the volume the mass is read from
 * and the mass changes the girth) are solved in rounds with each other worn
 * until no solved weight moves more than the tolerance, or this many rounds.
 */
const PASSES = 8;
const CONVERGENCE = 1e-5;

/**
 * Expand the simple tier into the detailed one: channel weights of a body
 * document from sex, age, stature, mass, muscle and the tape measurements
 * given.
 *
 * The term table `HUMAN_BODY_SIMPLE_SHAPE` gives every channel its weight as
 * a sum of gains times products of curves over the parameters and the two
 * derived ones (Deurenberg's body fat from the mass and stature, and that
 * fat less the sex's essential fat); a row naming a channel the basis lacks
 * is skipped, so an older revision without the individuality channels still
 * expands its macros, and a sum past a channel's envelope saturates at it.
 * The measured values are then solved in turn, each with the weights so far
 * worn: the height channel is sampled at -1, 0 and +1 and the stature (ring
 * height above the ground plus the head allowance) inverted linearly
 * between the samples; then, in rounds until no weight moves, because a
 * girth and the mass change each other, each tape measurement given for its
 * channel's rule and the weight channel for the mass the skin volume
 * encloses at the fat fraction's density over the head-and-neck share. A value
 * outside what the samples reach is refused with the reach, never clamped;
 * a basis without the solved channels, or a measurement its surface cannot
 * answer, is refused before geometry is kept.
 *
 * With `over`, an existing detailed shape, the result keeps that shape's
 * residue: the shape is projected back to the simple tier, the projection is
 * expanded, and only the difference between the new expansion and that one
 * is added to the shape, so an unchanged simple value changes nothing, a
 * detailed edit on a named channel survives, and the same simple values
 * give the same body whatever was edited in between. Channels the table
 * does not name pass through untouched. The result is a fresh record; the
 * detailed tier remains the document's canonical form.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Turns the identity-card values and tape measurements into the detailed channel weights a document stores, met by measurement, and keeps the detailed residue when applied over a shape.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Evaluates the term table, the measured inversions in the specified order, the envelope refusals and the residual composition the specification lists.
 */
export function expandHumanBodySimpleShape(
  basis: IAutoMovieHumanBodyBasis,
  simple: IAutoMovieHumanBodySimpleShape,
  over?: Record<string, number>,
): Record<string, number> {
  const table = HUMAN_BODY_SIMPLE_SHAPE;
  for (const name of Object.keys(
    table.limits,
  ) as (keyof typeof table.limits)[]) {
    const value = simple[name];
    if (value === undefined) continue;
    const [low, high] = table.limits[name];
    if (!Number.isFinite(value) || value < low || value > high)
      throw new Error(
        `A simple body ${name} must lie in [${low}, ${high}]: ${value}`,
      );
  }
  for (const name of [
    "sex",
    "ageYears",
    "statureMetres",
    "massKilograms",
    "muscle",
  ] as const)
    if (simple[name] === undefined)
      throw new Error(`A simple body needs its ${name}.`);
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  for (const id of [table.solved.stature, table.solved.mass])
    if (!channels.has(id))
      throw new Error("A simple body shape needs the channel " + id);
  const parameters = math.parameters(simple);
  const shape: Record<string, number> = {};
  for (const row of table.terms) {
    const channel = channels.get(row.channel);
    if (channel === undefined) continue;
    shape[row.channel] = Math.min(
      channel.maximum,
      Math.max(
        channel.minimum,
        (shape[row.channel] ?? 0) + math.term(row, parameters),
      ),
    );
  }
  const solve = (
    channel: string,
    target: number,
    read: (trial: Record<string, number>) => number | null,
    what: string,
  ): void => {
    const samples: [number, number][] = SAMPLES.map((weight) => {
      const value = read({ ...shape, [channel]: weight });
      if (value === null)
        throw new Error(`A ${what} cannot be measured on this basis.`);
      return [weight, value];
    });
    const weight = math.invert(samples, target);
    if (weight === null)
      throw new Error(
        `A ${what} of ${target} is beyond this basis, which reaches ${samples[0][1].toFixed(3)} to ${samples[2][1].toFixed(3)}.`,
      );
    shape[channel] = weight;
  };
  solve(
    table.solved.stature,
    simple.statureMetres,
    (trial) => measure.stature(basis, trial),
    "stature",
  );
  const density = math.density(
    math.fat(simple, parameters.bodyMassIndex).percent,
  );
  for (const entry of table.measurements)
    if (simple[entry.parameter] !== undefined && !channels.has(entry.channel))
      throw new Error("A simple body shape needs the channel " + entry.channel);
  for (let pass = 0; pass < PASSES; pass++) {
    const before = { ...shape };
    for (const entry of table.measurements) {
      const target = simple[entry.parameter];
      if (target === undefined) continue;
      solve(
        entry.channel,
        target,
        (trial) => measure.channel(basis, trial, entry.channel),
        entry.parameter,
      );
    }
    solve(
      table.solved.mass,
      simple.massKilograms,
      (trial) => measure.mass(measure.volume(basis, trial), density),
      "mass",
    );
    const moved = Math.max(
      ...Object.keys(shape).map((id) =>
        Math.abs(shape[id] - (before[id] ?? 0)),
      ),
    );
    if (moved < CONVERGENCE) break;
  }
  if (over === undefined) return shape;
  // only the measurements this request names are read back, so an omitted
  // one leaves its channel exactly as the shape had it
  const origin = expandHumanBodySimpleShape(
    basis,
    projectHumanBodySimpleShape(
      basis,
      over,
      table.measurements
        .map((entry) => entry.parameter)
        .filter((parameter) => simple[parameter] !== undefined),
    ),
  );
  const result: Record<string, number> = { ...over };
  for (const id of new Set([...Object.keys(shape), ...Object.keys(origin)])) {
    const channel = channels.get(id)!;
    const value = Math.min(
      channel.maximum,
      Math.max(
        channel.minimum,
        (over[id] ?? 0) + (shape[id] ?? 0) - (origin[id] ?? 0),
      ),
    );
    if (value === 0) delete result[id];
    else result[id] = value;
  }
  return result;
}
