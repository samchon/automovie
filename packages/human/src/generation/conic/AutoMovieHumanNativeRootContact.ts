import { AutoMovieHumanNativeRadialContact as Radial } from "./AutoMovieHumanNativeRadialContact";
import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPointSeed,
  IAutoMovieConstructionSeed,
  IAutoMovieHumanNativeRadialContact,
  IAutoMovieHumanNativeRoot,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Prepare the search input for a cutter bound to a native root. */
export namespace AutoMovieHumanNativeRootContact {
  /** Caller-supplied point pair measured in the cutter and realized band charts. */
  interface IBandChart {
    /** Cutter material station in millimetres and phase in radians. */
    part: readonly [number, number];
    /** Mean-chord band coordinate in millimetres and phase in radians. */
    host: readonly [number, number];
  }

  /** The bound host face and the chart data its source can supply. */
  export type IHost =
    | { type: "source"; part: IAutoMovieViewPart }
    | { type: "band"; face: string; chart?: IBandChart };

  /** One search or point seed and observations of its material coordinates. */
  export interface IResult {
    /** Engine input with stations converted to metres. */
    seed: IAutoMovieConstructionSeed;
    /** World point residuals in millimetres. */
    observation: IAutoMovieHumanNativeRoot.ISeedTransport;
  }

  /**
   * Transport an unchanged search line, intersect the cutter with a source host,
   * or issue the caller's measured point pair for a realized band host.
   *
   * @evidence contracts/development/implementation.md#principled-implementation An unchanged root keeps its transported search. A source host supplies the radial intersection with the declared cutter line. A changed band host requires a measured chart pair.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Root identity and the host type select the seed operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Band coordinates come from the caller. A nonfinite or out-of-domain cutter station is refused.
   * @evidence contracts/development/common.md#meaningful-documentation Documents the source and band chart units and the engine conversion.
   * @evidence contracts/development/implementation.md#efficient-algorithms One reader per source and one radial scan followed by a bracketed root for a source contact.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call serves one cutter.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Readers live for the call. The result holds the seed and detached observations.
   */
  export function create(
    spec: IAutoMovieHumanNativeRoot.IRootSpec,
    before: IAutoMovieViewPart,
    current: IAutoMovieViewPart,
    old: IAutoMovieHumanNativeRoot.ISeed,
    host: IHost,
  ): IResult {
    const hostFace: string = host.type === "source" ? host.part.name : host.face;
    if (spec.unchanged) {
      const observation: IAutoMovieHumanNativeRoot.ISeedTransport = spec.seed(before, current, old);
      if (observation.unchanged)
        return {
          seed: { type: "search", partFace: current.name, hostFace, ...observation.seed },
          observation,
        };
    }
    const source: IAutoMovieLoftViewFullSource.IReader = Full.create(current);
    const oldSource: IAutoMovieLoftViewFullSource.IReader = Full.create(before);
    if (host.type === "source")
      return derived(current, source, oldSource, old, host.part);

    const chart: IBandChart | undefined = host.chart;
    if (chart === undefined)
      throw new Error("changed band host requires measured contact coordinates: " + hostFace);
    if (
      !chart.part.every(Number.isFinite) || !chart.host.every(Number.isFinite) ||
      chart.part[0] < Math.max(source.domain[0], oldSource.domain[0]) ||
      chart.part[0] > Math.min(source.domain[1], oldSource.domain[1])
    )
      throw new Error("contact leaves the cutter chart: " + current.name);
    const point: AutoMovieVector3Tuple = source.point(...chart.part);
    const target: AutoMovieVector3Tuple = oldSource.point(...chart.part);
    const seed: IAutoMovieConstructionPointSeed = {
      type: "point", partFace: current.name, hostFace,
      part: [chart.part[0] / 1000, chart.part[1]],
      host: [chart.host[0] / 1000, chart.host[1]],
    };
    return {
      seed,
      observation: {
        seed: { ...old }, unchanged: false, pointSeed: seed,
        controls: [{
          original: [...chart.part], actual: [...chart.part],
          target, point, residual: Vector.sub(point, target), sourceClock: null,
        }],
        qualification: "caller-supplied band chart: current minus original cutter point at the same material coordinate; the band operator checks its chart domain and contact convergence",
      },
    };
  }

  /** Read the radial intersection along the declared cutter line. */
  function derived(
    current: IAutoMovieViewPart,
    source: IAutoMovieLoftViewFullSource.IReader,
    oldSource: IAutoMovieLoftViewFullSource.IReader,
    old: IAutoMovieHumanNativeRoot.ISeed,
    host: IAutoMovieViewPart,
  ): IResult {
    if (!(Number.isFinite(old.phase) && old.from >= 0 && old.to <= 1 && old.to > old.from))
      throw new Error("cutter seed window/phase must be finite and ordered");
    const hostSource: IAutoMovieLoftViewFullSource.IReader = Full.create(host);
    const span: number = source.domain[1] - source.domain[0];
    const found: IAutoMovieHumanNativeRadialContact.IResult = Radial.seed(
      (s: number): readonly number[] => source.point(s, old.phase),
      source.domain[0] + old.from * span,
      source.domain[0] + old.to * span,
      {
        at: (s: number) => host.axis.at(s),
        point: (s: number, t: number): readonly number[] => hostSource.point(s, t),
        domain: hostSource.domain,
      },
    );
    const seed: IAutoMovieConstructionPointSeed = {
      type: "point", partFace: current.name, hostFace: host.name,
      part: [found.part / 1000, old.phase],
      host: [found.host[0] / 1000, found.host[1]],
    };
    const original: AutoMovieVector3Tuple = oldSource.point(found.part, old.phase);
    return {
      seed,
      observation: {
        seed: { ...old }, unchanged: false, pointSeed: seed,
        controls: [{
          original: [found.part, old.phase], actual: [found.part, old.phase],
          target: found.target, point: found.point, residual: Vector.sub(found.point, found.target), sourceClock: null,
        }, {
          original: [found.part, old.phase], actual: [found.part, old.phase],
          target: original, point: found.point, residual: Vector.sub(found.point, original), sourceClock: null,
        }],
        qualification: "derived radial seed: cutter minus host at the contact chart, then current minus original cutter at the same material address; the contact operator checks convergence",
      },
    };
  }
}
