import { AutoMovieViewCurves, AutoMovieViewLoft, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieHumanNeckSource } from "./AutoMovieHumanNeckSource";

/**
 * The old trunk's temporary neck chain from the actual composed head source.
 * Its internal overlap interval is not an anatomical tape. The public source
 * owner supplies value and parameter jets for each retained interior knot
 * and both boundaries. The same parameter and shared-jet interpolator retain
 * each cubic/quintic span in real arithmetic; binary64 agreement is tested.
 * Open ends and the old trunk's phase resolution differ. The actual axis is
 * borrowed unchanged. The alias head belongs to that trunk consumer, not a
 * second anatomical head or a production-tree view.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates a regular interval of the same original mass source through the engine, retaining its parameter and value/first/second jets. Endpoint Hermite uniqueness preserves each degree-at-most-five span without a refit.
 * @evidence contracts/common.md#clear-and-simple-design One adapter returns its input view and complete engine result; the old trunk still owns its chain readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constructs no Human-local loft, independent harmonic skin, sampled replacement outline or hidden diagnostic fallback.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the original source interval, open adapter chain, old alias, changed output and unfinished anatomical tapes.
 * @evidence contracts/performance.md#efficient-algorithms Prepares four source outlines and one engine loft on the selected existing stations, without a full body or repeated head composition.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the already composed mass's original outlines/fullness and borrows its factory axis; no second head or source conversion is required.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one interval view, its copied scalar records and loft result. Its axis shares the original definition lifetime; no global chain is retained.
 */
export namespace AutoMovieHumanNeckConstruction {
  /**
   * The actual adapter input and every engine outcome.
   *
   * @evidence contracts/common.md#principled-implementation Keeps original source identity separate from surviving loft sections and nullable final chain.
   * @evidence contracts/common.md#clear-and-simple-design A view/result pair exposes both source comparison and all admission diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed station or null chain is promoted to complete geometry.
   * @evidence contracts/common.md#meaningful-documentation States borrowing and open-interval scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This result type coordinates no requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The body owns the result and borrowed source for one definition lifetime.
   */
  export interface IOutput {
    /** Restricted source records and the original axis on the internal interval, calibration mm. */
    part: IAutoMovieViewPart;

    /** Complete engine loft outcome, including every omitted section and nullable chain. */
    loft: AutoMovieViewLoft.IResult;
  }

  /**
   * Evaluate the mass's neck interval for the remaining old trunk.
   *
   * @param mass The exact canonical shoulder-fullness mass composed for the production head.
   * @param placement Existing internal overlap mean, named C7 height and phase resolution; its harmonic rows do not supply this skin.
   * @returns Original interval and complete engine result. A changed interval
   *   is not claimed identical to the old nonplanar harmonic chain or to the
   *   whole mass's final coefficient interpolation between sections.
   *
   * @evidence contracts/common.md#principled-implementation Retains the prepared parameter and expresses its derivatives in the restricted curve's normalized parameter. All interior shape knots survive and source-owner jets define both boundaries. Open closure is represented by an absent pole, independently of the source parameter.
   * @evidence contracts/common.md#clear-and-simple-design Restricts source records to the interval and delegates interpolation, every section and the chain to the engine.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not refit, omit an interior source knot, infer an anatomical base tape, suppress raw failures or recreate an independent harmonic skin.
   * @evidence contracts/common.md#meaningful-documentation States interval meaning, alias, resolution, source preservation and final-loft limits.
   * @evidence contracts/performance.md#efficient-algorithms Prepares each original scalar once, reads its retained knots/boundaries and builds one interval loft. Natural source jets use their owner's linear scans; quintic reads use its indexed spans. No full head or body is rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the caller's already composed mass instead of rebuilding HeadLane or decoding its metre declaration again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one caller-owned view/result pair with copied scalar records and a borrowed original axis, without global retention.
   */
  export function generate(mass: IAutoMovieViewPart, placement: AutoMovieHumanNeckSource.IOutput): IOutput {
    const bottom: number = placement.bottom[1];
    const top: number = placement.head.backLevel;
    if (!(Number.isFinite(bottom) && Number.isFinite(top) && bottom < top && bottom >= mass.stations[0]! && top <= mass.stations.at(-1)!)) throw new Error("Neck adapter needs an increasing regular interval inside the actual head source");
    const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(mass);
    if (source.diagnostics.length !== 0) throw new Error(`Neck adapter source: ${JSON.stringify(source.diagnostics)}`);
    if (mass.fullness.kind !== "shoulder") throw new Error("Neck adapter requires the head mass's declared shoulder owner");
    const interval: (outline: IAutoMovieViewPart.IOutline, prepared: AutoMovieViewOutline.IOutline) => IAutoMovieViewPart.IOutline = (outline: IAutoMovieViewPart.IOutline, prepared: AutoMovieViewOutline.IOutline): IAutoMovieViewPart.IOutline => {
      const read: (station: number) => AutoMovieViewOutline.IReading = (station: number): AutoMovieViewOutline.IReading => {
        const value: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(prepared, station);
        if (typeof value === "string") throw new Error(`Neck interval source: ${value}`);
        return value;
      };
      const span: number = read(top).parameter - read(bottom).parameter;
      if (!(Number.isFinite(span) && span > 0)) throw new Error("Neck interval needs an increasing finite original parameter");
      const knots: IAutoMovieViewPart.IKnot[] = [
        { site: prepared.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.station === bottom)?.site ?? "neck.adapter.bottom", station: bottom, value: 0 },
        ...prepared.knots.filter((k: IAutoMovieViewPart.IKnot): boolean => k.station > bottom && k.station < top),
        { site: prepared.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.station === top)?.site ?? "neck.adapter.top", station: top, value: 0 },
      ].map((k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => {
        const value: AutoMovieViewOutline.IReading = read(k.station);
        return { site: k.site, station: k.station, value: value.value, jet: { first: value.parameterJet[0] * span, second: value.parameterJet[1] * span * span } };
      });
      return { ...outline, knots, ...(prepared.parameter === undefined ? {} : { parameter: prepared.parameter }) };
    };
    const edge: (outline: IAutoMovieViewPart.IOutline, name: AutoMovieViewCurves.ICurve["name"]) => IAutoMovieViewPart.IOutline = (outline: IAutoMovieViewPart.IOutline, name: AutoMovieViewCurves.ICurve["name"]): IAutoMovieViewPart.IOutline => {
      const prepared: AutoMovieViewCurves.ICurve["outline"] = source.curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === name)!.outline;
      if (prepared === null) throw new Error(`Neck adapter has no original ${name}`);
      return interval(outline, prepared);
    };
    const fullness: (outline: IAutoMovieViewPart.IOutline) => IAutoMovieViewPart.IOutline = (outline: IAutoMovieViewPart.IOutline): IAutoMovieViewPart.IOutline => {
      const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
      if ("detail" in prepared) throw new Error(`Neck interval fullness: ${prepared.detail}`);
      return interval(outline, prepared);
    };
    const originalDepartures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> | undefined = mass.fullness.departures;
    const departures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> | undefined = originalDepartures === undefined ? undefined : [fullness(originalDepartures[0]), fullness(originalDepartures[1]), fullness(originalDepartures[2]), fullness(originalDepartures[3])];
    const part: IAutoMovieViewPart = {
      name: "head", axis: mass.axis, order: placement.order, samples: placement.samples,
      stations: [bottom, ...mass.stations.filter((station: number): boolean => station > bottom && station < top), top],
      front: { positive: edge(mass.front.positive, "front.positive"), negative: edge(mass.front.negative, "front.negative") },
      side: { positive: edge(mass.side.positive, "side.positive"), negative: edge(mass.side.negative, "side.negative") },
      fullness: { kind: "shoulder", shoulder: fullness(mass.fullness.shoulder), ...(departures === undefined ? {} : { departures }) },
    };
    return { part, loft: AutoMovieViewLoft.create(part) };
  }
}
