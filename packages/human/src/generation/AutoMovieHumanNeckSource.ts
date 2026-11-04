import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";
import { AutoMovieHumanNeckPrior } from "./AutoMovieHumanNeckPrior";

/**
 * The retained neck's generating records, before any chain is constructed.
 * The head needs their mean, adopted posterior C7 point and endpoint jet;
 * the transitional trunk adapter still samples their original harmonic rows.
 * Their private shape and XZ perimeter normalization are not a published
 * infrathyroid plane or a closed three-dimensional base-tape construction.
 *
 * @evidence contracts/common.md#principled-implementation Shares the existing four generating rows and their units, reads harmonic means analytically and takes the endpoint secant from the same final two authored points as the previous chain's linear endpoint derivative.
 * @evidence contracts/common.md#clear-and-simple-design One pure input record serves head layout and the remaining old trunk adapter, without constructing an unused neck mesh for the head.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no generated-skin read, reference fit, ray intersection, new person constant or substitute tape claim.
 * @evidence contracts/common.md#meaningful-documentation Separates calibration units, original data, named C7 closure, projected normalization and unfinished anatomical tape contracts.
 * @evidence contracts/performance.md#efficient-algorithms Four fixed harmonic rows and two posterior evaluations supply the head frame; no periodic spline chain or section rings are needed by that consumer.
 * @evidence contracts/performance.md#reuse-equivalent-work The body passes this same resolved record to the head and transitional neck generator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns four small descriptors and scalar frame data; only the immutable prior persists globally.
 */
export namespace AutoMovieHumanNeckSource {
  /** One original generating row, with dimensions in calibration mm. */
  export interface IRow {
    /** Unmodified dimensionless x/z and millimetre y harmonics. */
    ring: AutoMovieHumanNeckPrior.IRing;
    /** Baseline forward and vertical translation before harmonic offsets. */
    origin: [number, number, number];
    /** Lateral harmonic scale, calibration mm. */
    width: number;
    /** Forward harmonic scale, calibration mm. */
    depth: number;
    /** Calibration mm per world mm, applied to y harmonics. */
    scale: number;
  }

  /** Shared source descriptors, not a loft result or final neck surface. */
  export interface IOutput {
    /** The original four rows in rising mean-height order. */
    rows: IRow[];
    /** Analytic top mean, adopted posterior point and endpoint dx/dy. */
    head: IAutoMovieHumanHeadNeck;
    /** Bottom generating row's analytic phase mean; not a named base-tape point. */
    bottom: [number, number, number];
    /** Calibration mm per world mm supplied by the body input boundary. */
    scale: number;
    /** Original periodic row controls; only the transitional chain adapter uses these. */
    order: number;
    /** Original emitted row density; not the density of the head's view curves. */
    samples: number;
  }

  /**
   * Resolve world inputs into their one calibration-space source definition.
   *
   * @evidence contracts/common.md#principled-implementation Preserves the existing log-interpolated sizes and harmonic rows, closes posterior phase pi at public C7, and reads the exact two-point endpoint secant rather than fitting a new interpolation.
   * @evidence contracts/common.md#clear-and-simple-design Produces descriptors and placement numbers only; a separate consumer may construct the old trunk's temporary chain.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The old projected perimeter remains explicitly interim; no emitted chain, mesh, sampled ray or anatomical-site compensation determines the head frame.
   * @evidence contracts/common.md#meaningful-documentation States world-to-calibration conversion and the difference between a generating frame and actual skin/tape geometry.
   * @evidence contracts/performance.md#efficient-algorithms A bounded four-row normalization and two analytic phase reads replace constructing a periodic chain merely to recover its inputs.
   * @evidence contracts/performance.md#reuse-equivalent-work One returned record supplies both consumers in the production definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Descriptor arrays are caller-owned and retain only immutable prior rows; no global body or source cache is added.
   */
  export function of(inputs: Pick<IAutoMovieHumanHeadInputs, "neck" | "neckBase" | "sex">, scale: number): IOutput {
    if (!(Number.isFinite(scale) && scale > 0 && inputs.neck > 0 && inputs.neckBase.girth > 0)) throw new Error("A neck source needs positive tapes and a positive finite calibration scale");
    const prior: AutoMovieHumanNeckPrior.IPrior = AutoMovieHumanNeckPrior.PRIOR;
    const last: number = prior.rings.length - 1;
    const logs: (k: number) => number = (k: number): number => (1 - k / last) * Math.log(inputs.neckBase.girth) + (k / last) * Math.log(inputs.neck);
    const size: (s: AutoMovieHumanNeckPrior.ISize, k: number) => number = (s: AutoMovieHumanNeckPrior.ISize, k: number): number => scale * Math.exp(s.level[k]! + s.sex[k]! * inputs.sex + s.gain[k]! * logs(k));
    const aspect: number = size(prior.depth, last) / size(prior.width, last);
    const meanTop: number = inputs.neckBase.cervicaleHeight * scale - scale * even(prior.rings[last]!.y, Math.PI);
    const rows: IRow[] = prior.rings.map((ring: AutoMovieHumanNeckPrior.IRing, k: number): IRow => {
      const width: number = scale * Math.exp(logs(k)) / perimeter(ring, aspect, prior.order);
      return { ring, origin: [(prior.place.level[k]! + prior.place.sex[k]! * inputs.sex) * scale, meanTop + prior.drop[k]! * scale, 0], width, depth: aspect * width, scale };
    });
    const top: IRow = rows[last]!;
    const centre: [number, number, number] = mean(top);
    const posterior: [number, number, number] = point(top, Math.PI);
    const previous: [number, number, number] = point(rows[last - 1]!, Math.PI);
    const dy: number = posterior[1] - previous[1];
    if (dy === 0 || !Number.isFinite(dy)) throw new Error("The neck's authored posterior endpoint has no finite height secant");
    return {
      rows, scale, order: prior.order, samples: prior.samples, bottom: mean(rows[0]!),
      head: { level: centre[1], x: centre[0], radius: inputs.neck * scale / (2 * Math.PI), back: posterior[0], backLevel: posterior[1], backSlope: (posterior[0] - previous[0]) / dy },
    };
  }

  /**
   * Evaluate the original harmonic authoring row, before any interpolation.
   *
   * @evidence contracts/common.md#principled-implementation Uses the prior's original cosine forward/height and sine lateral definitions with their declared scale and translation.
   * @evidence contracts/common.md#clear-and-simple-design A point evaluator is shared with the transitional chain adapter; no second shape formula is introduced.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads no emitted geometry or reference and applies no endpoint clamp.
   * @evidence contracts/common.md#meaningful-documentation Names authoring phase and calibration-mm output, distinct from an interpolated skin.
   * @evidence contracts/performance.md#efficient-algorithms Linear work in the fixed harmonic count.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One synchronous point read coordinates no requests or cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one owned tuple without retaining source data.
   */
  export function point(row: IRow, phase: number): [number, number, number] {
    return [row.origin[0] + row.depth * even(row.ring.x, phase), row.origin[1] + row.scale * even(row.ring.y, phase), row.origin[2] + row.width * odd(row.ring.z, phase)];
  }

  /** Exact full-period mean of the authored harmonics, calibration mm. */
  function mean(row: IRow): [number, number, number] {
    return [row.origin[0] + row.depth * row.ring.x[0]!, row.origin[1] + row.scale * row.ring.y[0]!, row.origin[2]];
  }

  /** Retained XZ polygon normalization; it is not the nonplanar row's 3D length. */
  function perimeter(ring: AutoMovieHumanNeckPrior.IRing, aspect: number, order: number): number {
    let sum: number = 0;
    let previous: [number, number] = [aspect * even(ring.x, 0), odd(ring.z, 0)];
    for (let j: number = 1; j <= order; j++) {
      const phase: number = 2 * Math.PI * j / order;
      const next: [number, number] = [aspect * even(ring.x, phase), odd(ring.z, phase)];
      sum += Math.hypot(next[0] - previous[0], next[1] - previous[1]);
      previous = next;
    }
    return sum;
  }

  /** Original cosine series including its mean term. */
  function even(values: readonly number[], phase: number): number {
    return values.reduce((sum: number, value: number, k: number): number => sum + value * Math.cos(k * phase), 0);
  }

  /** Original sine series, whose full-period mean is zero. */
  function odd(values: readonly number[], phase: number): number {
    return values.reduce((sum: number, value: number, k: number): number => sum + value * Math.sin((k + 1) * phase), 0);
  }
}
