import type {
  AutoMovieViewAxis,
  AutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/engine";

import { HumanCurveCostReport as R } from "./HumanCurveCostReport";

/** Re-preparation and explicit reads of borrowed scalar/axis declarations, separate from original acquisition. */
export namespace HumanScalarProbe {
  /** Actual returned-native refusal count shared with the invocation report. */
  export interface IState {
    /** Rejected/unavailable results actually observed; thrown failures have a separate owner. */
    rejectedOrUnavailable: number;
  }

  /** Existing call clock and result ownership; no source producer is called here. */
  export interface IInput {
    /** Actual disjoint call measurement, preserving original throws and observer failures. */
    timed: <T>(
      id: string,
      owner: string,
      action: () => T,
      progress?: boolean,
    ) => R.Result<T>;

    /** Scalar rows owned by the current diagnostic. */
    scalars: Record<string, unknown>[];

    /** Axis rows owned by the current diagnostic. */
    axes: Record<string, unknown>[];

    /** Names of actual provided original sources, never invented from a plan count. */
    actualNames: Set<string>;

    /** Same invocation's returned-native refusal counter. */
    state: IState;
  }

  /** Explicit probe operations over unchanged original declarations. */
  export interface IOutput {
    /** Read the actual part's signed/fullness records and physical axis. */
    part(source: IAutoMovieViewPart, refs: string[], membership: string): void;

    /** Prepare one actual scalar/control context, then read its named knots. */
    scalar(
      owner: string,
      field: string,
      input: IAutoMovieViewPart.IOutline,
      closureEnds: AutoMovieViewOutline.IEnds,
      unit: string,
      refs: string[],
      membership: string,
      physicalDomain: readonly [number, number] | null,
    ): void;

    /** Read the actual axis at named physical stations without declaring a cold constructor cost. */
    axis(
      owner: string,
      source: AutoMovieViewAxis.IAxis,
      knots: number[],
      refs: string[],
      membership: string,
    ): void;

    /** Preserve unavailable fields without substitute controls or successful zero-cost rows. */
    unavailable(
      owner: string,
      membership: string,
      refs: string[],
      reason: unknown,
    ): void;
  }

  /** One invocation owns identity aliases and its actual public interpolator; no import or geometry is moved into a global cache. */
  export function create(
    engine: typeof import("@automovie/engine"),
    input: IInput,
  ): IOutput {
    const { timed, scalars, axes, actualNames, state }: IInput = input;
    const identities: Map<
      IAutoMovieViewPart.IOutline,
      Map<string, string>
    > = new Map();
    return { part, scalar, axis, unavailable };

    /** Probes exact production part inputs; no source, axis, station or fullness is replaced. */
    function part(
      source: IAutoMovieViewPart,
      refs: string[],
      membership: string,
    ): void {
      actualNames.add(source.name);
      const radialEnds: AutoMovieViewOutline.IEnds = ends(source);
      const physicalDomain: readonly [number, number] | null = domain(
        source.stations,
      );
      for (const view of ["front", "side"] as const)
        for (const sign of ["positive", "negative"] as const)
          scalar(
            source.name,
            view + "." + sign,
            source[view][sign],
            radialEnds,
            "mm",
            refs,
            membership,
            physicalDomain,
          );
      const fullness: IAutoMovieViewPart.Fullness = source.fullness;
      if (fullness.kind === "girth")
        scalar(
          source.name,
          "fullness.girth",
          fullness.girth,
          {},
          "mm",
          refs,
          membership,
          physicalDomain,
        );
      else if (fullness.kind === "shoulder")
        scalar(
          source.name,
          "fullness.shoulder",
          fullness.shoulder,
          {},
          "dimensionless",
          refs,
          membership,
          physicalDomain,
        );
      else
        for (const [quarter, outline] of fullness.shoulders.entries())
          scalar(
            source.name,
            "fullness.quarter." + quarter,
            outline,
            {},
            "dimensionless",
            refs,
            membership,
            physicalDomain,
          );
      if (fullness.kind !== "top" && fullness.departures !== undefined)
        for (const [quarter, outline] of fullness.departures.entries())
          scalar(
            source.name,
            "fullness.departure." + quarter,
            outline,
            {},
            "dimensionless",
            refs,
            membership,
            physicalDomain,
          );
      axis(source.name, source.axis, [...source.stations], refs, membership);
    }

    /** Re-prepares one borrowed scalar record for each actual closure context; identity aliases remain references. */
    function scalar(
      owner: string,
      field: string,
      input: IAutoMovieViewPart.IOutline,
      closureEnds: AutoMovieViewOutline.IEnds,
      unit: string,
      refs: string[],
      membership: string,
      physicalDomain: readonly [number, number] | null,
    ): void {
      const id: string = owner + "/" + field;
      const contextKey: string = JSON.stringify(closureEnds);
      let known: Map<string, string> | undefined = identities.get(input);
      if (known === undefined) {
        known = new Map();
        identities.set(input, known);
      }
      const alias: string | undefined = known.get(contextKey);
      const row: Record<string, unknown> = {
        id,
        owner,
        field,
        membership,
        unit,
        knots: input.knots.length,
        controlRecordSha256: R.hash(JSON.stringify(input)),
        physicalDomain,
        supportKnotDomain: domain(
          input.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          ),
        ),
        closureEnds,
        aliasOf: alias ?? null,
        originalConstructorMilliseconds: null,
        preparationMilliseconds: null,
        sharedAcquisitionRefs: refs,
        meaning:
          "Preparation of an actual borrowed scalar control record, not the creation of its original representative formula or a display curve. Support controls remain intact; support-knot scalar probes are distinct from physical-domain axis/display readings.",
      };
      scalars.push(row);
      if (alias !== undefined) {
        row.status = "alias-of-probe-record-context";
        row.preparationMilliseconds = null;
        return;
      }
      known.set(contextKey, id);
      const preparedScalar: R.Result<
        AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure
      > = timed(
        "prepare:" + id,
        "Public ViewOutline.create on this actual record",
        (): AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =>
          engine.AutoMovieViewOutline.create(input, closureEnds),
      );
      row.preparationMilliseconds = preparedScalar.phase.milliseconds;
      if (!preparedScalar.ok) {
        row.status = "prepare-threw";
        row.error = R.message(preparedScalar.error);
        return;
      }
      if ("detail" in preparedScalar.value) {
        state.rejectedOrUnavailable++;
        row.status = "prepare-rejected";
        row.error = preparedScalar.value;
        return;
      }
      row.status = "prepared";
      const source: AutoMovieViewOutline.IOutline = preparedScalar.value;
      const stations: number[] = namedStations(
        input.knots.map(
          (knot: IAutoMovieViewPart.IKnot): number => knot.station,
        ),
      );
      row.probeStations = stations;
      row.readOrder =
        "First value, first at, then value/at at one different actual named knot. New diagnostic interpolant; no display grid.";
      const reads: Record<string, unknown>[] = [];
      for (const [index, station] of stations.entries()) {
        const value: R.Result<number | string> = timed(
          "value:" + id + ":" + index,
          "Actual scalar-only public value",
          (): number | string =>
            engine.AutoMovieViewOutline.value(source, station),
        );
        if (value.ok && typeof value.value === "string")
          state.rejectedOrUnavailable++;
        reads.push({
          operation: index === 0 ? "first-value" : "different-knot-value",
          station,
          milliseconds: value.phase.milliseconds,
          status: !value.ok
            ? "threw"
            : typeof value.value === "string"
              ? "rejected"
              : "returned",
          result: value.ok ? value.value : R.message(value.error),
        });
        const jet: R.Result<AutoMovieViewOutline.IReading | string> = timed(
          "at:" + id + ":" + index,
          "Actual scalar value/jet; axis and native section excluded",
          (): AutoMovieViewOutline.IReading | string =>
            engine.AutoMovieViewOutline.at(source, station),
        );
        if (jet.ok && typeof jet.value === "string")
          state.rejectedOrUnavailable++;
        reads.push({
          operation:
            index === 0
              ? "first-at-after-value"
              : "different-knot-at-after-value",
          station,
          milliseconds: jet.phase.milliseconds,
          status: !jet.ok
            ? "threw"
            : typeof jet.value === "string"
              ? "rejected"
              : "returned-qualified-jet",
          result: jet.ok ? jet.value : R.message(jet.error),
        });
      }
      row.reads = reads;
    }

    /** Reads actual retained axes separately; these are first probe calls, not asserted first-ever production reads. */
    function axis(
      owner: string,
      source: AutoMovieViewAxis.IAxis,
      knots: number[],
      refs: string[],
      membership: string,
    ): void {
      const reads: Record<string, unknown>[] = [];
      const stations: number[] = namedStations(knots);
      for (const [index, station] of stations.entries()) {
        const read: R.Result<ReturnType<AutoMovieViewAxis.IAxis["at"]>> = timed(
          "axis:" + owner + ":" + index,
          "Actual axis.at; includes its real deferred frame/contact/transport work",
          (): ReturnType<AutoMovieViewAxis.IAxis["at"]> => source.at(station),
        );
        reads.push({
          operation:
            index === 0 ? "first-probe-axis-read" : "different-knot-axis-read",
          station,
          milliseconds: read.phase.milliseconds,
          status: read.ok ? "returned" : "threw",
          resultSha256: read.ok ? R.hash(JSON.stringify(read.value)) : null,
          error: read.ok ? null : R.message(read.error),
        });
      }
      axes.push({
        owner,
        membership,
        physicalDomain: domain(knots),
        stationSource:
          "Actual declared physical stations, not excluded scalar-support knots",
        sharedAcquisitionRefs: refs,
        priorProductionConsumption:
          "May already have occurred inside acquisition; no cold/first-ever claim",
        reads,
      });
    }

    /** Keeps known signed-field failures explicit without inventing knot, fullness or source data. */
    function unavailable(
      owner: string,
      membership: string,
      refs: string[],
      reason: unknown,
    ): void {
      state.rejectedOrUnavailable++;
      for (const field of [
        "front.positive",
        "front.negative",
        "side.positive",
        "side.negative",
      ])
        scalars.push({
          id: owner + "/" + field,
          owner,
          field,
          membership,
          status: "blocked-no-actual-control-record",
          knots: null,
          controlRecordSha256: null,
          aliasOf: null,
          originalConstructorMilliseconds: null,
          preparationMilliseconds: null,
          sharedAcquisitionRefs: refs,
          error: reason,
        });
      axes.push({
        owner,
        membership,
        status: "blocked-no-actual-axis",
        sharedAcquisitionRefs: refs,
        reads: [],
        milliseconds: null,
      });
    }
  }

  /** Uses only existing named stations; prefer regular interior knots and retain a distinct later knot when present. */
  function namedStations(values: readonly number[]): number[] {
    const unique: number[] = [...new Set(values)];
    if (unique.length === 0) return [];
    const interior: number[] = unique.slice(1, -1);
    const first: number = unique.length > 2 ? unique[1]! : unique[0]!;
    const later: number | undefined =
      [...interior]
        .reverse()
        .find((station: number): boolean => station !== first) ??
      unique.find((station: number): boolean => station !== first);
    return later === undefined ? [first] : [first, later];
  }

  /** Actual finite increasing endpoints, or null without fabricating a missing source interval. */
  export function domain(
    values: readonly number[],
  ): readonly [number, number] | null {
    const first: number | undefined = values[0];
    const last: number | undefined = values.at(-1);
    return first !== undefined &&
      last !== undefined &&
      Number.isFinite(first) &&
      Number.isFinite(last) &&
      first < last
      ? [first, last]
      : null;
  }

  /** Supplies radial closure only for original signed edges; fullness and placement coordinates have their own parameters. */
  export function ends(source: {
    pole?: IAutoMovieViewPart["pole"];
    stations: readonly number[];
  }): AutoMovieViewOutline.IEnds {
    const result: AutoMovieViewOutline.IEnds = {};
    if (source.pole === "bottom" || source.pole === "both")
      result.bottom = source.stations[0];
    if (source.pole === "top" || source.pole === "both")
      result.top = source.stations.at(-1);
    return result;
  }
}
