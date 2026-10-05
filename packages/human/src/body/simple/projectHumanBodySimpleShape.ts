import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
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
 *
 * @evidence contracts/common.md#principled-implementation Stature and tapes are read on one shaped rest skin through a shared reader. Mass is that skin's volume at the density of the fat that the body's own sex, age and mass imply, iterated a fixed four steps from the lowest admitted fat fraction toward their fixed point; the density moves little per step, but the iteration is a truncation that is not checked for convergence. Each identity channel is read through the inverse of its first term row after the other rows on that channel are removed with the parameters read so far, which inverts the same sum the expansion builds, and this requires those curves to be invertible.
 * @evidence contracts/common.md#clear-and-simple-design One projection function over one reader; curve inversion, volume, density and the tape channel readings keep their own owners, and the expansion subtracts this same projection instead of repeating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, photograph or expected value is named; an identity channel the basis lacks reads as its neutral by the table's rule, and a tape the surface cannot answer is omitted rather than invented.
 * @evidence contracts/common.md#meaningful-documentation States what is read back and how, the shared skin, the mass fixed point, the muscle's removal of other rows, the neutral for absent channels, the default of all tapes and the editor and expansion consumers.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group.
 * @evidence contracts/modeling.md#parameter-channels It reads the identity channels (sex, age, muscle) through their term rows, and a channel the basis lacks reads as its neutral zero, which projects to sex 0, age 25 and muscle 0. It defines no channel and does not establish that the identity channels vary independent traits.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a record of simple values and no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Stature and tapes are metres and mass is kilograms on the shaped rest skin, age is years and sex and muscle are dimensionless macro values; the readers own the skin frame and no conversion happens here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; it reports numbers.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The term table and the measurement rules own the anatomical formulas and sources; this projection adds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reports what a body's weights say and refuses nothing; admission of the values belongs to the expansion and the basis envelopes.
 * @evidence contracts/anatomy.md#parametric-authority It is the documented inverse of the simple-to-detailed conversion that the expansion applies: the same weights give the same named values (sex, age, stature, mass, muscle, tapes), so an editor shows named measurements and never a morph weight, and the expansion subtracts this projection to keep detailed residue. No input addresses geometry.
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
  let massKilograms = measure.mass(volume, math.density(table.mass.fatFraction[0] * 100));
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
