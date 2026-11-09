import { AutoMovieViewCurves, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";
import type { IHumanInspectionDocument } from "./IHumanInspectionDocument";
import type { HumanInspectionParts } from "./HumanInspectionParts";
import type { HumanInspectionClock } from "./HumanInspectionClock";

/** Display subdivisions retain the existing source anchors; they are not a curve-error certificate. */
const STEPS: number = 16;

/** Original edge/axis display evaluation, independent of complete fullness and top-ring consumption. */
export namespace HumanInspectionOriginalLines {
  /** Borrowed original inputs and the current selection/observer; no producer is acquired here. */
  export interface IInput {
    /** Actual original owner name. */
    name: string;

    /** Existing display ID prefix for this owner. */
    id: string;

    /** Existing owner colour, unchanged across its displayed edges. */
    colour: string;

    /** Already available original controls and physical frame map, without a full-source request. */
    original: HumanInspectionParts.IGuides["source"];

    /** Same actual prepared source outlines, including their failures. */
    source: AutoMovieViewCurves.IResult;

    /** First actual physical source station, calibration mm. */
    bottom: number;

    /** Last actual physical source station, calibration mm. */
    top: number;

    /** Existing selection and retained-ID decision; no new curve is requested. */
    wanted: (suffix: string, view: "front" | "side" | "top" | "axis") => boolean;

    /** Existing actual-domain predicate; support controls stay intact. */
    inside: (station: number) => boolean;

    /** Same optional observer and actual measurement ownership. */
    clock: HumanInspectionClock.ISession | undefined;

    /** Original calibration-mm to display-metre mapping. */
    place: (origin: readonly number[], direction: readonly number[], radius: number) => IHumanInspectionDocument.Point;

    /** Existing output buffer; failed edges are never joined across missing data. */
    curves: IHumanInspectionDocument.ICurve[];

    /** Existing source-display diagnostic sink. */
    report: (detail: string) => void;
  }

  /** Reuse the actual prepared outlines and station union, keeping every value/frame error and timing boundary. */
  export function draw(input: IInput): void {
    const { name, id, colour, original, source, bottom, top, wanted, inside, clock, place, curves, report }: IInput = input;
      const axisStations: Set<number> = new Set(
        original.stations.filter(inside),
      );
      for (const edge of source.curves) {
        const suffix: string = edge.name.replace("positive", "pos").replace("negative", "neg");
        if (edge.outline === null) {
          if (wanted(suffix, suffix.startsWith("front") ? "front" : "side")) clock?.emit(name, id + suffix, "evaluation", null, 0, "unavailable");
          continue;
        }
        const anchorsStarted: number | undefined = clock?.now();
        const ends: Readonly<AutoMovieViewOutline.IEnds> = edge.outline.ends;
        const anchors: number[] = [
          bottom,
          top,
          ...edge.outline.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          ),
          ...AutoMovieViewOutline.criticalStations(edge.outline),
          ...original.stations.filter(
            (s: number): boolean =>
              Number.isFinite(s) &&
              (ends.bottom === undefined || s >= ends.bottom) &&
              (ends.top === undefined || s <= ends.top),
          ),
        ].filter(inside);
        anchors.forEach((s: number): void => {
          axisStations.add(s);
        });
        clock?.emit(name, null, "edge-and-axis-anchors:" + suffix, clock.delta(anchorsStarted), anchors.length, "ok");
        if (!wanted(suffix, suffix.startsWith("front") ? "front" : "side")) continue;
        const curveStarted: number | undefined = clock?.now();
        const stationsStarted: number | undefined = clock?.now();
        const stations: number[] = sampled(anchors);
        clock?.emit(name, id + suffix, "display-stations", clock.delta(stationsStarted), stations.length, "ok");
        const points: IHumanInspectionDocument.Point[] = [];
        let failure: string | null = null;
        let evaluation: number = 0;
        let materialization: number = 0;
        let readings: number = 0;
        for (const station of stations) {
          const readStarted: number | undefined = clock?.now();
          const read: AutoMovieViewCurves.IReading | string =
            AutoMovieViewCurves.at(edge, original.axis, station);
          evaluation += clock?.delta(readStarted) ?? 0;
          readings++;
          if (typeof read === "string") {
            failure = read;
            break;
          }
          const pointStarted: number | undefined = clock?.now();
          points.push(place(read.point, [0, 0, 0], 0));
          materialization += clock?.delta(pointStarted) ?? 0;
        }
        clock?.emit(name, id + suffix, "evaluation", evaluation, readings, failure === null ? "ok" : "failed");
        clock?.emit(name, id + suffix, "point-materialization", materialization, points.length, failure === null ? "ok" : "failed");
        clock?.span(name, id + suffix, curveStarted, readings, failure === null ? "ok" : "failed");
        if (failure !== null) report(failure);
        else
          curves.push({
            id:
              id +
              edge.name.replace("positive", "pos").replace("negative", "neg"),
            closed: false,
            points,
            colour,
          });
      }
      const axis: IHumanInspectionDocument.Point[] = [];
      const axisStarted: number | undefined = clock?.now();
      const axisStationsStarted: number | undefined = clock?.now();
      const axisSamples: number[] = wanted("axis", "axis") ? sampled([...axisStations]) : [];
      if (wanted("axis", "axis")) clock?.emit(name, id + "axis", "display-stations", clock.delta(axisStationsStarted), axisSamples.length, "ok");
      let axisEvaluation: number = 0;
      let axisMaterialization: number = 0;
      let axisReadings: number = 0;
      let axisFailed: boolean = false;
      for (const station of axisSamples) {
        const frameStarted: number | undefined = clock?.now();
        let frameRead: boolean = false;
        axisReadings++;
        try {
          const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
            original.axis.at(station);
          axisEvaluation += clock?.delta(frameStarted) ?? 0;
          frameRead = true;
          if (!frame.origin.every(Number.isFinite)) {
            report("axis at " + station + " has a nonfinite origin");
            axis.length = 0;
            axisFailed = true;
            break;
          }
          const pointStarted: number | undefined = clock?.now();
          axis.push(place(frame.origin, [0, 0, 0], 0));
          axisMaterialization += clock?.delta(pointStarted) ?? 0;
        } catch (error) {
          if (!frameRead) axisEvaluation += clock?.delta(frameStarted) ?? 0;
          axisFailed = true;
          report(
            "axis at " +
              station +
              ": " +
              (error instanceof Error
                ? (error.stack ?? error.message)
                : String(error)),
          );
          axis.length = 0;
          break;
        }
      }
      if (wanted("axis", "axis")) {
        clock?.emit(name, id + "axis", "evaluation", axisEvaluation, axisReadings, axisFailed ? "failed" : axis.length < 2 ? "unavailable" : "ok");
        clock?.emit(name, id + "axis", "point-materialization", axisMaterialization, axis.length, axisFailed ? "failed" : axis.length < 2 ? "unavailable" : "ok");
        clock?.span(name, id + "axis", axisStarted, axisReadings, axisFailed ? "failed" : axis.length < 2 ? "unavailable" : "ok");
      }
      if (axis.length >= 2)
        curves.push({ id: id + "axis", closed: false, points: axis, colour });

  }

  /**
   * Display stations, including all supplied anchors exactly; sampling is not a world-curve error bound.
   *
   * Deduplicates finite knots, extrema and declared stations, retaining each exactly and inserting
   * 15 uniform interior stations per interval. This chooses display stations without changing source
   * interpolation, clamping extrema or deciding section admission. Two sorts of at most 16K numbers
   * cost O(K log K). The result is a fresh O(K) array; temporary sets end with the call.
   */
  function sampled(anchors: readonly number[]): number[] {
    const sorted: number[] = [...new Set(anchors.filter(Number.isFinite))].sort(
      (a: number, b: number): number => a - b,
    );
    const stations: Set<number> = new Set(sorted);
    for (let i: number = 1; i < sorted.length; i++)
      for (let j: number = 1; j < STEPS; j++)
        stations.add(
          sorted[i - 1]! + ((sorted[i]! - sorted[i - 1]!) * j) / STEPS,
        );
    return [...stations].sort((a: number, b: number): number => a - b);
  }
}
