import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { measureHumanBodySimpleShape as measure } from "./measureHumanBodySimpleShape";

/** Iterations of the mass and fat fixed point; the density moves little per step. */
const MASS_ITERATIONS = 4;

/**
 * Read the simple tier back off a detailed shape: what a body's channel
 * weights say its sex, age, stature, mass, muscle and tape measurements are.
 *
 * Stature and the tape measurements are measured on the shaped body; mass is
 * the skin volume at the density of the fat the body's own sex, age and
 * mass imply, over the age-dependent head-and-neck share and iterated to its
 * fixed point; sex, age and muscle read their
 * identity channel through the inverse of that channel's first term row,
 * after the other rows on the channel (the age loss on the muscle) are
 * removed with the parameters read so far. An identity channel the basis
 * lacks reads as its neutral, and `measurements` names which tape
 * measurements to read (all by default). This is the projection the editor shows and
 * the expansion subtracts, so a simple edit keeps whatever the detailed
 * shape carried that the simple tier does not name.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Reads the identity-card values and tape measurements back from any detailed shape, so a simple edit changes only what it names.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the measured readings, the mass fixed point and the inverse-first-row identity reading the specification states.
 */
export function projectHumanBodySimpleShape(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  measurements: readonly (typeof HUMAN_BODY_SIMPLE_SHAPE)["measurements"][number]["parameter"][] = HUMAN_BODY_SIMPLE_SHAPE.measurements.map(
    (entry) => entry.parameter,
  ),
): IAutoMovieHumanBodySimpleShape {
  const table = HUMAN_BODY_SIMPLE_SHAPE;
  const channels = new Set(basis.channels.map((channel) => channel.id));
  const weight = (channel: string): number =>
    channels.has(channel) ? (shape[channel] ?? 0) : 0;
  const firstRow = (channel: string) =>
    table.terms.find((row) => row.channel === channel)!;
  const statureMetres = measure.stature(basis, shape);
  const sex = math.invertCurve(
    firstRow(table.identity.sex).curves[0].points,
    weight(table.identity.sex) / firstRow(table.identity.sex).gain,
  );
  const ageYears = math.invertCurve(
    firstRow(table.identity.ageYears).curves[0].points,
    weight(table.identity.ageYears) / firstRow(table.identity.ageYears).gain,
  );
  // the mass and the fat fraction that sets its density depend on each other
  const volume = measure.volume(basis, shape);
  let massKilograms = measure.mass(
    volume,
    math.density(table.mass.fatFraction[0] * 100),
    ageYears,
    table.mass.headAndNeck.keptNeck.bodyMassIndex,
  );
  for (let step = 0; step < MASS_ITERATIONS; step++) {
    const bodyMassIndex = massKilograms / (statureMetres * statureMetres);
    massKilograms = measure.mass(
      volume,
      math.density(math.fat({ sex, ageYears }, bodyMassIndex).percent),
      ageYears,
      bodyMassIndex,
    );
  }
  // the muscle channel carries rows that are not the muscle itself
  const muscleRow = firstRow(table.identity.muscle);
  const muscleFree = math.parameters({
    sex,
    ageYears,
    statureMetres,
    massKilograms,
    muscle: 0,
  });
  const others = table.terms
    .filter((row) => row.channel === table.identity.muscle && row !== muscleRow)
    .reduce((sum, row) => sum + math.term(row, muscleFree), 0);
  const muscle = math.invertCurve(
    muscleRow.curves[0].points,
    (weight(table.identity.muscle) - others) / muscleRow.gain,
  );
  const simple: IAutoMovieHumanBodySimpleShape = {
    sex,
    ageYears,
    statureMetres,
    massKilograms,
    muscle,
  };
  for (const entry of table.measurements) {
    if (!measurements.includes(entry.parameter) || !channels.has(entry.channel))
      continue;
    const value = measure.channel(basis, shape, entry.channel);
    if (value !== null) simple[entry.parameter] = value;
  }
  return simple;
}
