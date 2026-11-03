import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPopulation } from "../HumanPopulation";
import { HumanUniversality } from "./HumanUniversality";

/**
 * A fixed-seed Latin hypercube sample of people over the input domain the
 * population ends span, for the universality gate's property test: every
 * driver of `HumanPopulation.IDrivers` takes a standard deviate between the
 * 1st and 99th percentile (`HumanPopulation.Z`), the deviates of each driver
 * cut into as many equal strata as there are people and each stratum used
 * once, so the sample covers every driver's whole range evenly and its
 * combinations without a grid. Each person is built by the population's own
 * conditional model (`HumanPopulation.params`), so its inputs stay one body;
 * the sexes alternate.
 *
 * The sample is read in batches: one run builds one batch, chosen by
 * {@link BATCH_VARIABLE}, so the whole sample is covered over
 * {@link COUNT} / {@link BATCH} runs and each batch is the same people in
 * every run.
 */
export namespace HumanUniversalitySample {
  /** One sampled person. */
  export interface IPerson {
    /** The population end it is built as, its drivers at their deviates. */
    end: HumanPopulation.IEnd;

    /** Its public inputs. */
    params: IAutoMovieHumanParameters;
  }

  /** People in the whole sample. */
  export const COUNT: number = 200;

  /** People a run builds: about 22 minutes at 66 s a person. */
  export const BATCH: number = 20;

  /** The seed of the sample: fixed, so a failing person is the same person in every run. */
  export const SEED: number = 20261104;

  /** The environment variable naming the batch, 0 to `COUNT / BATCH - 1`; absent, batch 0. */
  export const BATCH_VARIABLE: string = "AUTOMOVIE_HUMAN_SAMPLE";

  /** The drivers the sample varies, every one `HumanPopulation.IDrivers` declares. */
  export const DRIVERS: readonly (keyof HumanPopulation.IDrivers)[] = ["stature", "bmi", "muscle", "crotchHeight", "biacromial", "arm", "hand", "foot", "headLength", "headBreadth"];

  /** The batch this run reads. */
  export function batch(): number {
    const value: string | undefined = process.env[BATCH_VARIABLE];
    const index: number = value === undefined || value === "" ? 0 : Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= COUNT / BATCH) throw new Error(`${BATCH_VARIABLE} must be an integer from 0 to ${COUNT / BATCH - 1}, not ${value}`);
    return index;
  }

  /** The whole sample, in order. */
  export function all(): IPerson[] {
    const random: () => number = mulberry32(SEED);
    const columns: number[][] = DRIVERS.map((): number[] => {
      const strata: number[] = Array.from({ length: COUNT }, (_: unknown, i: number): number => (i + random()) / COUNT);
      for (let i: number = COUNT - 1; i > 0; i--) {
        const j: number = Math.floor(random() * (i + 1));
        [strata[i], strata[j]] = [strata[j]!, strata[i]!];
      }
      return strata;
    });
    return Array.from({ length: COUNT }, (_: unknown, i: number): IPerson => {
      const drivers: HumanPopulation.IDrivers = {};
      DRIVERS.forEach((d: keyof HumanPopulation.IDrivers, k: number): void => {
        drivers[d] = HumanPopulation.Z * (2 * columns[k]![i]! - 1);
      });
      const end: HumanPopulation.IEnd = { name: `sample-${String(i).padStart(3, "0")}`, sex: i % 2 === 0 ? "female" : "male", core: false, drivers };
      return { end, params: HumanPopulation.params(end) };
    });
  }

  /** The people of one batch. */
  export function people(index: number): IPerson[] {
    return all().slice(index * BATCH, (index + 1) * BATCH);
  }

  /**
   * One sampled person through the universality gate's stages.
   *
   * @param p The person.
   */
  export function build(p: IPerson): HumanUniversality.IPerson {
    return HumanUniversality.build(p.end.name, p.params);
  }

  /**
   * The input ranges that separate failing people from passing ones: for each
   * failing piece (its stage and the first clause of its message), each
   * driver's deviates on the people it fails against those of the passing
   * people, so the report names the piece's law and the input range it does
   * not serve.
   *
   * @param sample The sampled people.
   * @param results Their stages, in the same order.
   */
  export function ranges(sample: readonly IPerson[], results: readonly HumanUniversality.IPerson[]): string[] {
    const range: (values: number[]) => string = (values: number[]): string => (values.length === 0 ? "-" : `${Math.min(...values).toFixed(2)}..${Math.max(...values).toFixed(2)}`);
    const passing: number[] = results.flatMap((r: HumanUniversality.IPerson, i: number): number[] => (!HumanUniversality.fails(r) ? [i] : []));
    const pieces: Map<string, number[]> = new Map();
    results.forEach((r: HumanUniversality.IPerson, i: number): void => {
      if (!HumanUniversality.fails(r)) return;
      const piece: string = r.failed !== null ? `${r.failed}: ${r.message.split(/[:.;]/)[0]!.slice(0, 80)}` : r.diagnostics.length !== 0 ? `diagnostic ${r.diagnostics[0]!.split(":")[0]}` : "flung rings";
      pieces.set(piece, [...(pieces.get(piece) ?? []), i]);
    });
    const out: string[] = [];
    for (const [piece, failing] of pieces) {
      out.push(`${piece} fails ${failing.length} (${failing.map((i: number): string => sample[i]!.end.name).join(", ")})`);
      for (const d of DRIVERS) {
        const at: (ids: number[]) => number[] = (ids: number[]): number[] => ids.map((i: number): number => sample[i]!.end.drivers[d]!);
        out.push(`    ${d.padEnd(13)} failing z ${range(at(failing)).padEnd(13)} passing z ${range(at(passing))}`);
      }
    }
    return out;
  }

  /** A small seeded generator of uniform numbers in [0, 1) (Tommy Ettinger's Mulberry32). */
  function mulberry32(seed: number): () => number {
    let a: number = seed >>> 0;
    return (): number => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t: number = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
