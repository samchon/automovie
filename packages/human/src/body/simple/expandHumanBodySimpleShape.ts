import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import { invertHumanMeasurement } from "../../common/measure/invertHumanMeasurement";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";
import { assertHumanBodySimpleValues } from "./assertHumanBodySimpleValues";
import type { IHumanBodySimpleUnknown } from "./IHumanBodySimpleUnknown";
import { humanBodySimpleChannel } from "./humanBodySimpleChannel";
import { humanBodySimpleShapeDirection as direction } from "./humanBodySimpleShapeDirection";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { measureHumanBodySimpleShape as measure } from "./measureHumanBodySimpleShape";
import { projectHumanBodySimpleShape } from "./projectHumanBodySimpleShape";
import { solveHumanBodySimpleCoupling } from "./solveHumanBodySimpleCoupling";

/**
 * Numerical acceptance budgets for the canonical expanded body: one
 * millimetre for tapes, a tenth of a millimetre for stature and fifty grams
 * for mass. These budgets do not establish instrument or anatomical accuracy.
 */
const TAPE_TOLERANCE_METRES = 1e-3;
const STATURE_TOLERANCE_METRES = 1e-4;
const MASS_TOLERANCE_KILOGRAMS = 0.05;
type Reader = ReturnType<typeof createHumanBodyMeasurementReader>;
/** Warm-up passes before simultaneous inversion; failure resumes the original eight-pass budget. */
const ROUNDS = 2;
const PASSES = 8;
const CONVERGENCE = 1e-5;

/**
 * Expand the simple tier into the detailed one: channel weights of a body
 * document from legacy appearance sex/muscle controls, age, stature, mass,
 * six optional exterior girths and an optional rig-shoulder-centre distance.
 *
 * The term table `HUMAN_BODY_SIMPLE_SHAPE` gives every channel its weight as
 * a sum of gains times products of curves over the parameters and the two
 * derived ones (Deurenberg's age-specific body fat from mass and stature, and
 * that fat less the sex's essential fat); a row naming a channel the basis
 * lacks is skipped, so an older revision without the individuality channels still
 * expands its macros, and the sum of a channel's rows is saturated once at
 * the channel's envelope, never row by row, because the projection reads an
 * identity back as the first row's inverse of the weight less the other rows,
 * which is only the sum's inverse.
 * The measured values are then solved in turn, each with the weights so far
 * worn: the height channel is inverted against the whole person's actual
 * stature (`whole.stature`, floor to the top of the head) through the same
 * bounded inverse the detailed editor uses. Because stature, girth and mass
 * change one another, their weights are then solved in rounds until none
 * moves: each requested girth or rig distance uses its channel's rule, and the
 * weight channel reads the mass the whole person's closed skin
 * (`whole.volume`) encloses at the fat fraction's density. A value outside measured reach is refused with that reach, never clamped;
 * a basis without the solved channels, or a measurement its surface cannot
 * answer, is refused before geometry is kept.
 *
 * With `over`, an existing detailed shape, the result keeps that shape's
 * residue: the shape is projected back to the simple tier, the projection is
 * expanded, and only the difference between the new expansion and that one
 * is added to the shape, so an unchanged simple value changes nothing and a
 * detailed edit on a named channel survives. The result still depends on
 * that detailed residue: identical simple inputs over different detailed
 * shapes need not produce identical bodies. Channels the table does not name
 * pass through untouched. The detailed tier remains the document's canonical
 * form, and the returned record is fresh. The canonical expansion is checked
 * against all requested readings before this detailed residue is reapplied.
 * The residue-bearing body is then solved again along the same named
 * directions and checked against the same readings, so every channel outside
 * those directions keeps its residue, and a request the residue makes
 * unreachable is refused like any other.
 *
 * @evidence contracts/common.md#principled-implementation Table terms are summed before envelope projection so the inverse reads the same combined channel map. Sequential measured-reach inversions warm up a simultaneous shared-body solve; unresolved systems retain complete strict reach sampling. A final shared-body assertion checks every canonical requested reading after stature reconciliation. The optional detailed-residue result is the difference of two expansions, which is exact only where readings add over channels, so it is solved again from where it stands and passes the same assertion.
 * @evidence contracts/common.md#clear-and-simple-design One compiler orders table expansion, measured inversion, canonical verification and optional residue transfer; numerical iteration and measurement definitions have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person or photograph is selected. The numerical budgets and pass counts are stated policies, not anatomical limits; measured-reach refusal remains separate from transient warm-up saturation.
 * @evidence contracts/common.md#meaningful-documentation States the simple-to-detailed conversion, coupled physical readings, omitted measurements, refusal, detailed residue and the precise boundary of canonical target verification.
 * @evidence contracts/modeling.md#spatial-conventions Requested stature and tapes use metres and mass uses kilograms; measurement owners read the shaped rest skin and channel weights remain dimensionless.
 * @evidence contracts/modeling.md#parameter-channels The simple fields compile into existing detailed basis channels through the declared term and measurement tables; omitted tapes are not read back during residue transfer and unknown table channels are skipped.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This compiler defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits detailed weights; the body builder owns the resulting surface.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the body builder owns the emitted form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The simple table and measurement owners define the anatomical formulas and constants; this compiler introduces only explicitly numerical acceptance budgets.
 * @evidenceExclude contracts/anatomy.md#permitted-range The table and basis own admitted parameter envelopes; this compiler enforces those existing envelopes without defining a new physiological interval.
 * @evidence contracts/anatomy.md#parametric-authority Named simple measurements compile to the detailed tier, which remains canonical. The optional detailed residue preserves that existing detailed authority on every channel outside the solved named directions, and the body it yields is held to the requested readings.
 */
export function expandHumanBodySimpleShape(
  basis: IAutoMovieHumanBodyBasis,
  whole: IAutoMovieHumanBodySimpleWhole,
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
  const parameters = math.parameters(simple);
  // the rows naming a channel are summed first and the sum saturated once:
  // saturating after each row would let a row past the envelope lose the
  // part a later row on the same channel takes back, and the projection
  // reads the muscle as the first row's inverse after the other rows are
  // subtracted from the weight, which is the sum's inverse
  const sums = new Map<string, number>();
  for (const row of table.terms)
    if (channels.has(row.channel))
      sums.set(
        row.channel,
        (sums.get(row.channel) ?? 0) + math.term(row, parameters),
      );
  const shape: Record<string, number> = {};
  for (const [id, sum] of sums) {
    const channel = channels.get(id)!;
    shape[id] = Math.min(channel.maximum, Math.max(channel.minimum, sum));
  }
  const solve = (
    along: ReturnType<typeof direction.alone>,
    target: number,
    read: (trial: Record<string, number>) => number | null,
    what: string,
    saturate = false,
  ): void => {
    Object.assign(
      shape,
      direction.solve(basis, shape, along, target, read, what, saturate),
    );
  };
  const stature = table.solved.stature;
  const statureChannel = channels.get(stature);
  if (statureChannel === undefined)
    throw new Error("A simple body needs the stature channel " + stature + ".");
  // the stature channel inverted against the whole person's actual stature
  const matchStature = (): void => {
    const worn = (weight: number): Record<string, number> => {
      const trial = { ...shape };
      if (weight === 0) delete trial[stature];
      else trial[stature] = weight;
      return trial;
    };
    shape[stature] = invertHumanMeasurement({
      range: [statureChannel.minimum, statureChannel.maximum],
      current: shape[stature] ?? 0,
      targetMetres: simple.statureMetres,
      read: (weight) => whole.stature(worn(weight)),
      label: "stature",
    }).weight;
    if (shape[stature] === 0) delete shape[stature];
  };
  matchStature();
  const density = math.density(
    math.fat(simple, parameters.bodyMassIndex).percent,
  );
  // Girths, mass and stature move one another. The intermediate pass may
  // saturate a target outside that transient body's reach; the pass after
  // convergence is strict, and the final stature reading is inverted on the
  // body after its mass and tape weights have settled.
  const statureAlong = direction.alone(basis, stature);
  const pass = (saturate: boolean): number => {
    const before = { ...shape };
    for (const entry of table.measurements) {
      const target = simple[entry.parameter];
      if (target === undefined) continue;
      solve(
        direction.alone(basis, entry.channel),
        target,
        (trial) => measure.channel(basis, trial, entry.channel),
        entry.parameter,
        saturate,
      );
    }
    solve(
      direction.mass(basis, parameters),
      simple.massKilograms,
      (trial) => measure.mass(whole.volume(trial), density),
      "mass",
      saturate,
    );
    solve(
      statureAlong,
      simple.statureMetres,
      (trial) => whole.stature(trial),
      "stature",
      saturate,
    );
    return Math.max(
      ...Object.keys(shape).map((id) =>
        Math.abs(shape[id] - (before[id] ?? 0)),
      ),
    );
  };
  let round = 0;
  for (; round < ROUNDS; round++) if (pass(true) < CONVERGENCE) break;
  const unknowns: IHumanBodySimpleUnknown[] = [
    ...table.measurements.flatMap((entry) => {
      const target = simple[entry.parameter];
      return target === undefined
        ? []
        : [
            {
              name: entry.parameter,
              tolerance: TAPE_TOLERANCE_METRES,
              along: direction.alone(basis, entry.channel),
              target,
              read: (reader: Reader) =>
                humanBodySimpleChannel(reader, entry.channel),
            },
          ];
    }),
    {
      name: "massKilograms",
      tolerance: MASS_TOLERANCE_KILOGRAMS,
      along: direction.mass(basis, parameters),
      target: simple.massKilograms,
      read: (_reader: Reader, trial: Record<string, number>) => measure.mass(whole.volume(trial), density),
    },
    {
      name: "statureMetres",
      tolerance: STATURE_TOLERANCE_METRES,
      along: statureAlong,
      target: simple.statureMetres,
      read: (_reader: Reader, trial: Record<string, number>) => whole.stature(trial),
    },
  ];
  const together = solveHumanBodySimpleCoupling(basis, shape, unknowns);
  if (together === null) {
    for (; round < PASSES; round++) if (pass(true) < CONVERGENCE) break;
    pass(false);
  } else Object.assign(shape, together);
  matchStature();
  assertHumanBodySimpleValues(basis, shape, unknowns);
  if (over === undefined) return shape;
  // only the measurements this request names are read back, so an omitted
  // one leaves its channel exactly as the shape had it
  const origin = expandHumanBodySimpleShape(
    basis,
    whole,
    projectHumanBodySimpleShape(
      basis,
      whole,
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
  // The difference of two expansions is exact only where the readings add up
  // over the channels, and a skin volume or a tape section does not. The
  // composed body is therefore solved again along the same named directions
  // from where it stands, so the residue on every channel outside them is
  // kept, a body already inside its budgets is returned unchanged, and a
  // request the residue makes unreachable is refused rather than answered
  // with a compromise.
  const final = solveHumanBodySimpleCoupling(basis, result, unknowns) ?? result;
  assertHumanBodySimpleValues(basis, final, unknowns);
  return final;
}
