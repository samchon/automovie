/**
 * The public US Army anthropometric working databases, read into memory for
 * the survey readings that reproduce the Human's survey constants, and the
 * statistics those readings print.
 *
 * ANSUR 1988 (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women and 1,774
 * men) and ANSUR II (Gordon et al. 2014, NATICK/TR-15/007; Paquette and
 * Parham 2017; 1,986 women and 4,082 men) are US Government works cleared for
 * unlimited public release (`packages/human/docs/sources/ansur-1988.md`,
 * `ansur-ii.md`). Each file is fetched from Penn State's OpenLab mirror and
 * held only in memory: no subject row is written anywhere, because the
 * repository keeps summary statistics only. The body dimensions data of Heinz
 * et al. (2003, J Stat Educ 11(2); 260 women and 247 men;
 * `heinz-2003-body-dimensions.md`) is one file with a `sex` column (1 for men),
 * in centimetres and kilograms, fetched from OpenIntro the same way.
 */
export namespace HumanSurveyData {
  /** The surveys. */
  export type Survey = "ansur1988" | "ansur2" | "heinz2003";

  /** A surveyed sex; each survey publishes one file per sex. */
  export type Sex = "female" | "male";

  /** Each survey's file per sex, at the mirrors the source notes cite. */
  export const FILES: Readonly<Record<Survey, Readonly<Record<Sex, string>>>> = {
    heinz2003: {
      female: "https://www.openintro.org/data/csv/bdims.csv",
      male: "https://www.openintro.org/data/csv/bdims.csv",
    },
    ansur1988: {
      female: "https://tools.openlab.psu.edu/publicData/ansurWomen.csv",
      male: "https://tools.openlab.psu.edu/publicData/ansurMen.csv",
    },
    ansur2: {
      female: "https://tools.openlab.psu.edu/publicData/ANSUR_II_FEMALE_Public.csv",
      male: "https://tools.openlab.psu.edu/publicData/ANSUR_II_MALE_Public.csv",
    },
  };

  /** One sex's sample of a survey: each numeric column by its header, one value per subject. */
  export type Sample = ReadonlyMap<string, Float64Array>;

  /**
   * Fetch one survey file and read its numeric columns.
   *
   * The files are plain comma-separated text without quoted commas in the
   * measured columns; a column whose first subject's value is not a number
   * (dates, places, ranks) is skipped. A leading byte order mark is dropped.
   *
   * @param survey The survey.
   * @param sex The sex's file.
   * @returns Each numeric column by its header.
   * @throws When the file cannot be fetched.
   */
  export async function load(survey: Survey, sex: Sex): Promise<Sample> {
    const response: Response = await fetch(FILES[survey][sex]);
    if (!response.ok) throw new Error(`${FILES[survey][sex]} answered ${response.status}`);

    // Latin-1 keeps every byte one character; a UTF-8 byte order mark reads
    // as its three bytes and is dropped.
    const raw: string = new TextDecoder("latin1").decode(await response.arrayBuffer());
    const text: string = raw.startsWith(String.fromCharCode(0xef, 0xbb, 0xbf)) ? raw.slice(3) : raw;
    const lines: string[] = text.split(/\r?\n/).filter((line: string): boolean => line.trim().length !== 0);
    const header: string[] = lines[0]!.split(",").map((name: string): string => name.trim());
    const all: string[][] = lines.slice(1).map((line: string): string[] => line.split(","));

    // Heinz et al. keep both sexes in one file; its `sex` column is 1 for men.
    const sexColumn: number = header.indexOf("sex");
    const rows: string[][] =
      survey === "heinz2003" ? all.filter((row: string[]): boolean => (row[sexColumn] === "1") === (sex === "male")) : all;
    const out: Map<string, Float64Array> = new Map();
    header.forEach((name: string, column: number): void => {
      if (!Number.isFinite(Number(rows[0]![column]))) return;
      out.set(name, Float64Array.from(rows, (row: string[]): number => Number(row[column])));
    });
    return out;
  }

  /**
   * One column of a sample.
   *
   * @param sample The sample.
   * @param name Its header.
   * @throws When the sample has no such numeric column.
   */
  export function column(sample: Sample, name: string): Float64Array {
    const values: Float64Array | undefined = sample.get(name);
    if (values === undefined) throw new Error(`the sample has no numeric column ${name}`);
    return values;
  }

  /** Mean and SD (n - 1) of a measure, its unit. */
  export interface IStatistics {
    /** Number of subjects with a finite positive value. */
    n: number;

    /** Mean. */
    mean: number;

    /** Standard deviation, n - 1. */
    sd: number;
  }

  /**
   * Mean and SD of the finite positive values.
   *
   * @param values One value per subject.
   */
  export function statistics(values: ArrayLike<number>): IStatistics {
    const kept: number[] = Array.from(values).filter((v: number): boolean => Number.isFinite(v) && v > 0);
    const mean: number = kept.reduce((s: number, v: number): number => s + v, 0) / kept.length;
    const sd: number = Math.sqrt(kept.reduce((s: number, v: number): number => s + (v - mean) ** 2, 0) / (kept.length - 1));
    return { n: kept.length, mean, sd };
  }

  /** An ordinary least squares line `y = a + b x` with its fit. */
  export interface ILine {
    /** Intercept, y's unit. */
    a: number;

    /** Slope, y's unit per x's. */
    b: number;

    /** Coefficient of determination. */
    r2: number;

    /** Residual standard deviation, n - 2, y's unit. */
    rsd: number;

    /** Number of subjects with both values finite and positive. */
    n: number;
  }

  /**
   * Ordinary least squares of y on x over the subjects with both values finite
   * and positive.
   *
   * @param x Predictor, one value per subject.
   * @param y Response, one value per subject.
   */
  export function line(x: ArrayLike<number>, y: ArrayLike<number>): ILine {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i: number = 0; i < x.length; i++)
      if (Number.isFinite(x[i]!) && Number.isFinite(y[i]!) && x[i]! > 0 && y[i]! > 0) {
        xs.push(x[i]!);
        ys.push(y[i]!);
      }
    const n: number = xs.length;
    const mx: number = xs.reduce((s: number, v: number): number => s + v, 0) / n;
    const my: number = ys.reduce((s: number, v: number): number => s + v, 0) / n;
    let sxx: number = 0;
    let sxy: number = 0;
    let syy: number = 0;
    for (let i: number = 0; i < n; i++) {
      sxx += (xs[i]! - mx) ** 2;
      sxy += (xs[i]! - mx) * (ys[i]! - my);
      syy += (ys[i]! - my) ** 2;
    }
    const b: number = sxy / sxx;
    const residual: number = syy - b * sxy;
    return { a: my - b * mx, b, r2: 1 - residual / syy, rsd: Math.sqrt(residual / (n - 2)), n };
  }

  /**
   * A line as the reading prints it: intercept and slope to the digits the
   * library's constants keep, then R2 and residual SD.
   *
   * @param fit The line.
   */
  export function printed(fit: ILine): string {
    return `${fit.a.toFixed(2)} + ${fit.b.toFixed(4)} x (R2 ${fit.r2.toFixed(2)}, residual SD ${fit.rsd.toFixed(1)}, n ${fit.n})`;
  }
}
