import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";
import { humanBodySimpleChannel } from "./humanBodySimpleChannel";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { measureHumanBodySimpleShape as measure } from "./measureHumanBodySimpleShape";

/** Iterations of the mass and fat fixed point; the density moves little per step. */
const MASS_ITERATIONS = 4;

/**
 * Read the simple tier back off a detailed shape: what a body's channel
 * weights say its legacy sex/muscle controls, age, stature, mass, six exterior
 * girths and rig shoulder-centre distance are.
 *
 * Girths and the shoulder-joint distance are read on the shaped body.
 * Stature and the closed volume are read on the whole person (`whole`); mass
 * is that volume at the density of the fat the body's own sex, age and mass
 * imply, iterated to its fixed point; sex, age and muscle read their
 * identity channel through the inverse of that channel's first term row,
 * after the other rows on the channel (the age loss on the muscle) are
 * removed with the parameters read so far. An identity channel the basis
 * lacks reads as its neutral, and `measurements` names which tape
 * measurements to read (all by default). A named tape the basis cannot read
 * (a missing skin landmark or no closed section) refuses by name. This is the projection the editor shows and
 * the expansion subtracts, so a simple edit keeps whatever the detailed
 * shape carried that the simple tier does not name.
 * The physical readings share one evaluated rest skin and landmark set;
 * identity curves and the mass fixed point consume those same values without
 * silently changing the candidate body between two tape sites.
 */
export function projectHumanBodySimpleShape(
  basis: IAutoMovieHumanBodyBasis,
  whole: IAutoMovieHumanBodySimpleWhole,
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
  const reader = createHumanBodyMeasurementReader(basis, shape);
  const statureMetres = whole.stature(shape);
  const sex = math.invertCurve(
    firstRow(table.identity.sex).curves[0].points,
    weight(table.identity.sex) / firstRow(table.identity.sex).gain,
  );
  const ageYears = math.invertCurve(
    firstRow(table.identity.ageYears).curves[0].points,
    weight(table.identity.ageYears) / firstRow(table.identity.ageYears).gain,
  );
  // the mass and the fat fraction that sets its density depend on each other
  const volume = whole.volume(shape);
  let massKilograms = measure.mass(
    volume,
    math.density(table.mass.fatFraction[0] * 100),
  );
  for (let step = 0; step < MASS_ITERATIONS; step++) {
    const bodyMassIndex = massKilograms / (statureMetres * statureMetres);
    massKilograms = measure.mass(
      volume,
      math.density(math.fat({ sex, ageYears }, bodyMassIndex).percent),
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
    // an asked tape the body cannot read is refused by name, never left out
    // of the result as if it had been read
    const value = humanBodySimpleChannel(reader, entry.channel);
    if (value === null)
      throw new Error(
        `The body basis ${basis.id} cannot measure ${entry.channel} for the simple ${entry.parameter}.`,
      );
    simple[entry.parameter] = value;
  }
  return simple;
}
