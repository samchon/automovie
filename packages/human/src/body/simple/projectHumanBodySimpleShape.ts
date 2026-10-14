import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";
import { humanBodySimpleChannel } from "./humanBodySimpleChannel";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { measureHumanBodySimpleShape as measure } from "./measureHumanBodySimpleShape";

/** Iterations of the mass and fat fixed point; the density moves little per step. */
const MASS_ITERATIONS: number = 4;

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
 * @evidence contracts/common.md#principled-implementation Invert the table's identity curves after subtracting other muscle terms, and estimate mass from whole-person volume with four density fixed-point updates; this bounded iteration has no general convergence proof.
 * @evidence contracts/common.md#clear-and-simple-design One projection joins identity parameters and physical readings for the editor and residue-preserving expansion; named measurement rules and whole-person geometry retain their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing identity channels read neutral, missing optional tape channels are omitted, and an available requested tape that cannot be measured throws; no hidden vertex control is substituted.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies legacy controls, metres, kilograms, whole-person versus body readings, requested tapes, failure and shared candidate ownership; the returned simple object is fresh.
 * @evidence contracts/performance.md#efficient-algorithms Channel membership is indexed once; table scans and four fixed-point arithmetic passes are bounded, while the single body evaluation and requested skin sections dominate time and geometry storage.
 * @evidence contracts/performance.md#reuse-equivalent-work All tape rules share the same reader, stature and volume are each requested once, and the fixed point reuses those quantities; no result is shared with a different shape or whole reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns its channel set, reader and result until completion; the result transfers to the caller and no model cache, handles or tasks remain.
 */
export function projectHumanBodySimpleShape(
  basis: IAutoMovieHumanBodyBasis,
  whole: IAutoMovieHumanBodySimpleWhole,
  shape: Record<string, number>,
  measurements: readonly (typeof HUMAN_BODY_SIMPLE_SHAPE)["measurements"][number]["parameter"][] = HUMAN_BODY_SIMPLE_SHAPE.measurements.map(
    (
      entry: (typeof HUMAN_BODY_SIMPLE_SHAPE)["measurements"][number],
    ): (typeof HUMAN_BODY_SIMPLE_SHAPE)["measurements"][number]["parameter"] =>
      entry.parameter,
  ),
): IAutoMovieHumanBodySimpleShape {
  const table: typeof HUMAN_BODY_SIMPLE_SHAPE = HUMAN_BODY_SIMPLE_SHAPE;
  const channels: Set<string> = new Set(
    basis.channels.map(
      (channel: IAutoMovieHumanBodyBasis["channels"][number]): string =>
        channel.id,
    ),
  );
  const weight: (channel: string) => number = (channel: string): number =>
    channels.has(channel) ? (shape[channel] ?? 0) : 0;
  const firstRow: (
    channel: string,
  ) => (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number] = (
    channel: string,
  ): (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number] =>
    table.terms.find(
      (row: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number]): boolean =>
        row.channel === channel,
    )!;
  const reader: ReturnType<typeof createHumanBodyMeasurementReader> =
    createHumanBodyMeasurementReader(basis, shape);
  const statureMetres: number = whole.stature(shape);
  const sex: number = math.invertCurve(
    firstRow(table.identity.sex).curves[0].points,
    weight(table.identity.sex) / firstRow(table.identity.sex).gain,
  );
  const ageYears: number = math.invertCurve(
    firstRow(table.identity.ageYears).curves[0].points,
    weight(table.identity.ageYears) / firstRow(table.identity.ageYears).gain,
  );
  // the mass and the fat fraction that sets its density depend on each other
  const volume: number = whole.volume(shape);
  let massKilograms: number = measure.mass(
    volume,
    math.density(table.mass.fatFraction[0] * 100),
  );
  for (let step: number = 0; step < MASS_ITERATIONS; step++) {
    const bodyMassIndex: number =
      massKilograms / (statureMetres * statureMetres);
    massKilograms = measure.mass(
      volume,
      math.density(math.fat({ sex, ageYears }, bodyMassIndex).percent),
    );
  }
  // the muscle channel carries rows that are not the muscle itself
  const muscleRow: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number] = firstRow(
    table.identity.muscle,
  );
  const muscleFree: ReturnType<typeof math.parameters> = math.parameters({
    sex,
    ageYears,
    statureMetres,
    massKilograms,
    muscle: 0,
  });
  const others: number = table.terms
    .filter(
      (row: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number]): boolean =>
        row.channel === table.identity.muscle && row !== muscleRow,
    )
    .reduce(
      (
        sum: number,
        row: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number],
      ): number => sum + math.term(row, muscleFree),
      0,
    );
  const muscle: number = math.invertCurve(
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
    const value: number | null = humanBodySimpleChannel(reader, entry.channel);
    if (value === null)
      throw new Error(
        `The body basis ${basis.id} cannot measure ${entry.channel} for the simple ${entry.parameter}.`,
      );
    simple[entry.parameter] = value;
  }
  return simple;
}
