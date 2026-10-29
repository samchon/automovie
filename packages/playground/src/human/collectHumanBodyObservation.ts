import { AutoMovieHuman } from "../../../human/src/AutoMovieHuman";
import type { AutoMovieHumanBodyObservation as Observation } from "../../../human/src/generation/AutoMovieHumanBodyObservation";
import { AutoMovieHumanBodyWarp as Warp } from "../../../human/src/generation/AutoMovieHumanBodyWarp";
import type { AutoMovieHumanBodyWarpField as Field } from "../../../human/src/generation/AutoMovieHumanBodyWarpField";
import { AutoMovieHumanEventJoin as Join } from "../../../human/src/generation/AutoMovieHumanEventJoin";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain as Loft } from "../../../human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftJet as Jet } from "../../../human/src/lofting/AutoMovieHumanLoftJet";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";

/** A finite scalar table row; vectors and borrowed calibration objects are not published. */
type Row = Record<string, string | number | boolean | null>;
/** Three calibration-mm coordinates retained only during this synchronous generation. */
type V = [number, number, number];

/** Selected observations from one actual generator invocation, rather than a second law evaluation. */
interface Report {
  /** What the numbers measure and what they do not measure. */
  meaning: string;
  /** Exact requested chain names, in canonical order. */
  selection: string[];
  /** Coordinate and parameter conventions shared by the scalar tables. */
  units: string;
  /** Actual principal chart stations, one finite scalar per row. */
  stations: Row[];
  /** Declared courses with provisional field addresses and actual post-transport addresses. */
  courses: Row[];
  /** Differences from requested field points and actual pre-join points, plus available derivative norms. */
  probes: Row[];
  /** Selected raw-phase coordinates from the same evaluations, in calibration mm. */
  points: Row[];
  /** The producer's support rule evaluated on each observed stage; these are not executed joins. */
  supports: Row[];
  /** Executed positional branches; maxMove is requested movement before projection, not final surface displacement. */
  joins: Observation.IJoin[];
  /** Existing producer diagnostics, restricted to finite scalar fields. */
  diagnostics: Row[];
  /** Unsupported values and observation failures; none changes the generated shape. */
  unavailable: string[];
}

/** A probe owns only numeric values, never a source body, chain or field closure. */
interface Probe {
  /** Owning chart. */
  chain: string;
  /** Source chart station. */
  source: number;
  /** Provisional destination chart station before the producer accepts or retains the chain. */
  current: number;
  /** Unmodified angular parameter in radians. */
  phase: number;
  /** Source world point in calibration mm. */
  point: V;
  /** Requested field point before the producer accepts or retains the chain. */
  expected: V;
  /** Actual pre-join point, when it was finite and in range. */
  preJoin?: V;
}

/** Normal generation result with an optional developer-only observation summary. */
interface Output {
  /** The unchanged public generated result. */
  result: IAutoMovieHumanGenerated;
  /** Elapsed generation and observation time; null remains valid for imported viewer results. */
  milliseconds: number | null;
  /** Same-execution scalar observations, absent for ordinary calls. */
  observation?: Report;
}

/**
 * Run the existing generator once, optionally observing selected chains through its execution context.
 *
 * @param parameters Already admitted, privately owned authored input.
 * @param selection Exact chain names; absent means ordinary generation without observation work.
 * @returns The public result and call-owned finite scalar tables. No model or parameter is modified.
 *
 * @evidence contracts/common.md#principled-implementation Uses the actual BodyLaw stage and join callbacks, public address/support/ring operations, and rich jets only when carries holds.
 * @evidence contracts/common.md#clear-and-simple-design Keeps request-scoped scalar reduction beside the viewer; the generator and shared formulas retain their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses generic selections and actual course/event addresses, with no specimen constants, private reconstruction or derivative fallback.
 * @evidence contracts/common.md#meaningful-documentation Labels calibration units, chart parameters, unavailable derivatives and executed versus calculated join observations.
 * @evidence contracts/performance.md#efficient-algorithms Traverses selected layers, courses and event phases with chain-name lookup scans; at most 4096 numeric probes are evaluated at the observed stages.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses one actual generation and reuses numeric field/pre-join probes for subsequent stage comparisons.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar tables escape; numeric temporary probes are cleared in finally and no borrowed body or field is retained.
 */
export function collectHumanBodyObservation(
  parameters: IAutoMovieHumanParameters,
  selection?: readonly string[],
): Output {
  if (selection !== undefined && (!Array.isArray(selection) || selection.length === 0 ||
    selection.length > 8 || selection.some((name: string): boolean =>
      typeof name !== "string" || name.length > 128 || !/^[a-z][a-z0-9]*(?:\.[a-z0-9]+)*$/.test(name))))
    throw new Error("Human observation request: select 1 to 8 exact chain names");
  const names: string[] = [...new Set(selection ?? [])].sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0);
  const selected: ReadonlySet<string> = new Set(names);
  const report: Report | undefined = selection === undefined ? undefined : {
    meaning: "Same-execution law observations; not loaded skin mesh measurements or clinical validation",
    selection: names,
    units: "Positions/course/reach: calibration mm; sourceStation: original chart address; evaluationStation: formula input address; currentStation: coordinate chart address; fieldStation: provisional mapped course address; phase: radians; derivative norms use station/phase parameters; provisional rows are requested field values, not applied transport",
    stations: [], courses: [], probes: [], points: [], supports: [], joins: [], diagnostics: [], unavailable: [],
  };
  const probes: Probe[] = [];
  let transported: boolean = false;

  /** Record a bounded explanation without throwing into the shape producer. */
  const unavailable: (message: string) => void = (message: string): void => {
    if (report !== undefined && report.unavailable.length < 32 && !report.unavailable.includes(message))
      report.unavailable.push(message.slice(0, 240));
  };

  /** Resolve course addresses only after the producer has decided which chains it retained. */
  const resolveCourses: (stage: "preJoin" | "final", body: Readonly<Body>, field: Readonly<Field.IField>) => void = (
    stage: "preJoin" | "final", body: Readonly<Body>, field: Readonly<Field.IField>,
  ): void => {
    for (const row of report!.courses) {
      const chain: Chain | undefined = body.chains.find((candidate: Chain): boolean => candidate.name === row.chain);
      const retained: boolean = field.retained.has(String(row.chain));
      const candidate: unknown = retained ? row.sourceStation : row.fieldStation;
      const station: number | null = typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
      const inside: boolean = chain !== undefined && station !== null &&
        station >= chain.layers[0]!.y && station <= chain.layers[chain.layers.length - 1]!.y;
      row.stage = stage;
      row.retained = retained;
      row.provisional = false;
      row.currentStation = inside ? station : null;
      if (!inside) unavailable(`${stage}: ${String(row.chain)} course address is unavailable in the actual chart`);
    }
  };

  /** Reduce corresponding source, requested-field and actual points at explicit chart addresses. */
  const measure: (stage: Observation.Stage, body: Readonly<Body>, field: Readonly<Field.IField>) => void = (
    stage: Observation.Stage, body: Readonly<Body>, field: Readonly<Field.IField>,
  ): void => {
    const rows: Map<string, Row> = new Map();
    for (const probe of probes) {
      const chain: Chain | undefined = body.chains.find((candidate: Chain): boolean => candidate.name === probe.chain);
      const retained: boolean | null = stage === "source" ? false : stage === "field" ? null : field.retained.has(probe.chain);
      const station: number = stage === "source" || retained === true ? probe.source : probe.current;
      const evaluation: number = stage === "field" ? probe.source : station;
      if (chain === undefined || evaluation < chain.layers[0]!.y || evaluation > chain.layers[chain.layers.length - 1]!.y) {
        unavailable(`${stage}: ${probe.chain} mapped probe lies outside the actual chart`); continue;
      }
      const point: V = stage === "field" ? probe.expected :
        stage === "source" ? probe.point : Loft.ring(chain, station, [probe.phase])[0]!;
      if (!point.every(Number.isFinite)) { unavailable(`${stage}: nonfinite ${probe.chain} point`); continue; }
      report!.points.push({ stage, chain: probe.chain, sourceStation: probe.source,
        evaluationStation: evaluation, currentStation: station, phase: probe.phase, retained, provisional: stage === "field",
        x: point[0], y: point[1], z: point[2] });
      const key: string = `${probe.chain}@${probe.source}`;
      let row: Row | undefined = rows.get(key);
      if (row === undefined) {
        row = { stage, chain: probe.chain, sourceStation: probe.source, evaluationStation: evaluation, currentStation: station,
          retained, provisional: stage === "field", phaseSamples: 0, pointNormMax: 0, fieldDeltaMax: 0,
          preJoinDeltaMax: null, sNormMax: null, ssNormMax: null, tNormMax: null, stNormMax: null };
        rows.set(key, row);
      }
      row.phaseSamples = Number(row.phaseSamples) + 1;
      row.pointNormMax = Math.max(Number(row.pointNormMax), Math.hypot(...point));
      row.fieldDeltaMax = Math.max(Number(row.fieldDeltaMax), Math.hypot(...point.map((v: number, i: number): number => v - probe.expected[i]!)));
      if (stage === "preJoin") probe.preJoin = [...point];
      if (stage === "final" && probe.preJoin !== undefined)
        row.preJoinDeltaMax = Math.max(Number(row.preJoinDeltaMax ?? 0), Math.hypot(...point.map((v: number, i: number): number => v - probe.preJoin![i]!)));
      if (stage !== "field" && Jet.carries(chain)) {
        const jet: Jet.IJet = Jet.at(chain, station, probe.phase);
        for (const name of ["s", "ss", "t", "st"] as const) {
          const norm: number = Math.hypot(...jet[name]);
          if (Number.isFinite(norm)) row[`${name}NormMax`] = Math.max(Number(row[`${name}NormMax`] ?? 0), norm);
          else unavailable(`${stage}: nonfinite ${probe.chain} ${name} derivative`);
        }
      } else unavailable(`${stage}: ${probe.chain} rich derivatives unavailable; no derivative fallback`);
    }
    report!.probes.push(...rows.values());
  };

  /** Observe existing stages without retaining their borrowed objects or changing producer branches. */
  const stage: Observation.IObserver["stage"] = (name: Observation.Stage, body: Readonly<Body>, field: Readonly<Field.IField> | null): void => {
    try {
      if (name === "source") for (const chainName of names)
        if (!body.chains.some((chain: Chain): boolean => chain.name === chainName))
          unavailable(`source: requested chain ${chainName} is absent`);
      for (const chain of body.chains) if (selected.has(chain.name)) {
        for (const [index, layer] of chain.layers.entries()) if (Number.isFinite(layer.y))
          report!.stations.push({ stage: name, chain: chain.name, index, station: layer.y });
      }
      for (const diagnostic of body.deformationDiagnostics ?? []) {
        const row: Row = { stage: name, name: diagnostic.name, status: diagnostic.status };
        for (const key of ["requested", "achieved", "residual"] as const) {
          const value: number | undefined = diagnostic[key];
          if (value !== undefined && Number.isFinite(value)) row[key] = value;
        }
        report!.diagnostics.push(row);
      }
      if (name !== "field") for (const event of body.events) for (const split of event.splits) {
        if (!selected.has(event.parent) && !selected.has(split.child)) continue;
        const child: Chain | undefined = body.chains.find((chain: Chain): boolean => chain.name === split.child);
        if (child === undefined) continue;
        report!.supports.push({ stage: name, parent: event.parent, child: split.child,
          direction: event.direction, ...Join.support(child, event.direction) });
      }
      if (name === "field" && field !== null) {
        for (const request of field.requests) if (selected.has(request.chain)) {
          const address: Body.IAnchor = Warp.address(body, field, request);
          report!.courses.push({ stage: "field", name: request.name, chain: request.chain, sourceStation: request.station,
            fieldStation: Number.isFinite(address.station) ? address.station : null,
            currentStation: null, retained: null, provisional: true,
            requested: Number.isFinite(request.target) ? request.target : null,
            calibrationPerPhysicalMm: Number.isFinite(field.calibrationPerPhysicalMm) ? field.calibrationPerPhysicalMm : null });
        }
        for (const chain of body.chains) if (selected.has(chain.name)) {
          const stations: Set<number> = new Set();
          const intervals: Set<number> = new Set([0, chain.layers.length - 2]);
          for (const request of field.requests) if (request.chain === chain.name) {
            stations.add(request.station);
            intervals.add(Loft.bracket(chain, request.station)[0]);
          }
          for (const index of intervals) {
            if (index < 0 || index + 1 >= chain.layers.length) continue;
            const a: number = chain.layers[index]!.y;
            const b: number = chain.layers[index + 1]!.y;
            for (const fraction of [0, 0.25, 0.5, 0.75, 1]) stations.add(a + fraction * (b - a));
          }
          const phases: Set<number> = new Set([0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]);
          for (const event of body.events) if (event.parent === chain.name)
            for (const split of event.splits) for (const arc of split.arcs)
              for (const phase of [arc[0], arc[0] + ((arc[1] < arc[0] ? arc[1] + 2 * Math.PI : arc[1]) - arc[0]) / 2, arc[1]]) phases.add(phase);
          for (const source of stations) {
            const current: number = Warp.address(body, field, { chain: chain.name, station: source }).station;
            for (const phase of phases) {
              const point: V = Loft.ring(chain, source, [phase])[0]!;
              const expected: V = field.point(chain.name, source, point);
              if (probes.length >= 4096) { unavailable("Selected probe budget reached; remaining probes omitted"); break; }
              if ([current, ...point, ...expected].every(Number.isFinite))
                probes.push({ chain: chain.name, source, current, phase, point, expected });
              else unavailable(`field: nonfinite ${chain.name} probe`);
            }
          }
        }
        measure("source", body, field); measure("field", body, field);
      }
      if ((name === "preJoin" || name === "final") && field !== null) {
        if (name === "preJoin") transported = true;
        if (transported) {
          resolveCourses(name, body, field);
          measure(name, body, field);
        } else if (report!.courses.length !== 0 || probes.length !== 0)
          unavailable(`${name}: transport was not observed; actual course and probe addresses remain unavailable`);
      }
    } catch (error) {
      unavailable(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const observer: Observation.IObserver | undefined = report === undefined ? undefined : {
    chains: selected, stage,
    join: (summary: Observation.IJoin): void => {
      if (Object.values(summary).every((value: unknown): boolean => typeof value !== "number" || Number.isFinite(value)))
        report.joins.push({ ...summary });
      else unavailable("Nonfinite executed join summary omitted");
    },
  };
  const start: number = performance.now();
  try {
    const result: IAutoMovieHumanGenerated = AutoMovieHuman.generate(parameters, { observe: observer });
    if (report !== undefined) for (const rows of [report.stations, report.courses, report.probes, report.points, report.supports, report.diagnostics])
      for (const row of rows) for (const key of Object.keys(row))
        if (typeof row[key] === "number" && !Number.isFinite(row[key])) {
          row[key] = null;
          unavailable("Nonfinite scalar replaced by unavailable null");
        }
    return { result, milliseconds: performance.now() - start, observation: report };
  } finally {
    probes.length = 0;
  }
}
