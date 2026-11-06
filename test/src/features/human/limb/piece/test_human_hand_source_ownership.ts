import {
  AutoMovieConstructionViews,
  AutoMovieIllinois,
  AutoMovieLoftChain,
  AutoMovieSolidVector as V,
  AutoMovieViewAxis,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieLoftViewRead } from "../../../../../../packages/engine/src/geometry/construction/AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "../../../../../../packages/engine/src/geometry/construction/AutoMovieLoftViewSource";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanHandBones } from "../../../../../../packages/human/src/generation/hand/AutoMovieHumanHandBones";
import { HumanPeople } from "../../../internal/HumanPeople";
import { nclose } from "../../../internal/nclose";

/**
 * Observe actual f1 palm/digit source ownership before any solid join.
 *
 * Scenarios:
 * 1. A radius-ten circle at across six independently validates both chord
 *    branches; an outside-support query is refused.
 * 2. Each generating MCP/CMC equals its actual digit source pole, while
 *    the first shaft and first joint expose the independently owned section.
 * 3. Both hands' digit pole, first shaft and first joint query the actual
 *    palm section only on its declared straight runs. Turns stay unavailable.
 * 4. Whole source sections, actual frame/units and available physical jets
 *    remain distinct from final Boolean, skin, rig and anatomy acceptance.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls production define once for f1 and reads its last actual arm/digit sources and identical generating joint records. Collects all observations and observer failures without changing source geometry, expectations, joins or public inputs.
 * @evidence contracts/testing.md#independent-expectations A radius-ten circle cut at across six has depth endpoints minus/plus eight, while across eleven has no chord. A declared pole lies at its source axis with zero radii; positive regular sections hold the axis. The declared straight-run coordinate and actual source/raw frame agreement qualify each local parent reading. No positive point margin certifies a complete footprint or final union.
 * @evidence contracts/testing.md#distinguishing-cases Reads both reflected hands and all five digits at their zero pole, first shaft and first joint. Keeps outside-support, turn-only, unavailable jet, nonpositive section and nonempty relief/lift states explicit. Existing definition/input tests own public length identity and material roll; this observer supplies no new fitting target or clinical contact tolerance.
 * @evidence contracts/testing.md#execution-ownership One source-only CPU question, human_hand_source_ownership, uses f1 public inputs and one define including its real head and raw builder loft dependencies. It calls no calibrate, realize, prepare, mesh, skin, rig, reference reader, process, browser or GPU and retains no cross-question state.
 */
export function test_human_hand_source_ownership(): void {
  const defects: string[] = [];
  collect(defects, "circle", (): void => {
    const r: number = AutoMovieViewSection.ELLIPSE;
    const circle: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents: [10, 10, 10, 10] }, [r, r, r, r],
    );
    const ends: [number, number] = chord(circle, 6);
    TestValidator.predicate("independent circle chord", nclose(ends[0], -8, 1e-9) && nclose(ends[1], 8, 1e-9));
    let refused: boolean = false;
    try { chord(circle, 11); } catch { refused = true; }
    TestValidator.predicate("outside circle support refused", refused);
  });
  const definition: AutoMovieHumanBodyLaw.IDefinition = AutoMovieHumanBodyLaw.define(HumanPeople.params("f1"));
  console.log(JSON.stringify({ stage: "source-definition", finalRealization: "not-run", diagnostics: definition.diagnostics }));
  for (const side of ["left", "right"] as const)
    collect(defects, side, (): void => {
      const palm: Prepared = prepare(definition, `arm.${side}`);
      const axis: NonNullable<Source["result"]["view"]>["axis"] | undefined = palm.source.result.view?.axis;
      if (axis?.type !== "jointed") throw new Error("No actual jointed arm/palm source");
      const centres: Vec3[] = axis.centres.map(AutoMovieConstructionViews.point);
      const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, axis.halves.map((half: number): number => half * AutoMovieConstructionViews.SCALE));
      if (typeof runs === "string") throw new Error(runs);
      const owner: Palm = { prepared: palm, centres, runs };
      const hand: AutoMovieHumanHandBones.IOutput = definition.hands[side];
      for (const name of ["Index", "Middle", "Ring", "Little", "Thumb"] as const)
        collect(defects, `${side}/${name}`, (): void => {
          const digitName: string = name === "Thumb" ? `thumb.${side}` : `finger.${side}.${name.toLowerCase()}`;
          const digit: Prepared = prepare(definition, digitName);
          const joints: AutoMovieHumanHandBones.IDigit = name === "Thumb" ? hand.thumb : hand.fingers[name];
          const first: number = digit.part.stations[0]!;
          TestValidator.predicate(`${digitName}: shared generating pole`, V.norm(V.sub(digit.part.axis.at(first).origin, joints.centres[0]!)) <= 1e-9);
          const sites: IAutoMovieViewPart.IKnot[] = digit.part.front.positive.knots;
          const shaft: IAutoMovieViewPart.IKnot | undefined = sites.find((knot: IAutoMovieViewPart.IKnot): boolean => knot.site === "shaft 0");
          const joint: IAutoMovieViewPart.IKnot | undefined = sites.find((knot: IAutoMovieViewPart.IKnot): boolean => knot.site === "joint 1");
          if (shaft === undefined || joint === undefined) throw new Error("No declared proximal shaft/joint source");
          for (const [kind, station] of [["pole", first], ["shaft 0", shaft.station], ["joint 1", joint.station]] as const)
            collect(defects, `${digitName}/${kind}`, (): void => {
              const frame: Frame = digit.part.axis.at(station);
              const values: AutoMovieLoftViewRead.IValues = readValues(digit, station);
              const zero: boolean = kind === "pole";
              TestValidator.predicate(`${digitName}/${kind}: source signs`, values.extents.every((value: number): boolean => zero ? nclose(value, 0, 1e-9) : value > 0));
              console.log(JSON.stringify({ side, digit: digitName, kind, station, point: frame.origin, materialDorsal: joints.dorsal, source: section(digit, station), parent: localParent(owner, frame.origin), scope: "original local sources; no complete contact or final join certificate" }));
            });
        });
    });
  console.log(JSON.stringify({ handSourceFailures: defects }));
  TestValidator.predicate(`hand source observations: ${defects.join(" | ")}`, defects.length === 0);
}

/** Require the actual last producer attempt and prepare its original scalar owner. */
function prepare(definition: AutoMovieHumanBodyLaw.IDefinition, name: string): Prepared {
  const source: Source | undefined = definition.lane.sources.filter((value: Source): boolean => value.name === name).at(-1);
  if (source === undefined || source.result.part === null || source.result.loft?.chain === null || source.result.loft?.chain === undefined)
    throw new Error(`No actual ${name}: ${JSON.stringify(source?.result.diagnostics)}`);
  const admitted: AutoMovieLoftViewSource.IResult | null = AutoMovieLoftViewSource.create(source.result.part);
  if (admitted === null || admitted.source === null || admitted.diagnostics.length !== 0)
    throw new Error(`No direct original source ${name}: ${JSON.stringify(admitted)}`);
  return { source, part: source.result.part, scalar: admitted.source, chain: source.result.loft.chain };
}

/** Preserve an original scalar failure instead of replacing its source. */
function readValues(prepared: Prepared, station: number): AutoMovieLoftViewRead.IValues {
  const values: AutoMovieLoftViewRead.IValues | string = AutoMovieLoftViewRead.values(prepared.scalar, station);
  if (typeof values === "string") throw new Error(values);
  return values;
}

/** Retain one whole local field, its frame, qualified jets and absence of relief. */
function section(prepared: Prepared, station: number): Record<string, unknown> {
  const values: AutoMovieLoftViewRead.IValues = readValues(prepared, station);
  const jets: AutoMovieLoftViewRead.IJets | string = AutoMovieLoftViewRead.jets(prepared.scalar, station);
  const positive: boolean = values.extents.every((value: number): boolean => value > 0);
  const original: AutoMovieViewSection.ISection | null = positive ? makeSection(values) : null;
  const phases: number[][] | null = original === null ? null : Array.from({ length: 16 }, (_: unknown, index: number): number[] => {
    const phi: number = index * Math.PI / 8;
    const radius: number = AutoMovieViewSection.radius(original, phi)[0];
    return [phi, radius * Math.cos(phi), radius * Math.sin(phi)];
  });
  return {
    units: { station: "mm", local: "mm", phase: "radians" },
    stationDirection: "source increasing arclength", phaseDirection: "+u toward +v",
    values, phases, frame: prepared.part.axis.at(station),
    axisJet: prepared.part.axis.jet?.(station) ?? null,
    physical2: typeof jets === "string" ? { available: false, reason: jets } : { available: true, jets },
    reliefs: prepared.chain.reliefs ?? [],
    liftedLayers: prepared.chain.layers.filter((layer: IAutoMovieLoftChain.ILayer): boolean => layer.lift !== undefined).length,
  };
}

/** The same native source section as the original scalar/fullness owner, without quadrature. */
function makeSection(values: AutoMovieLoftViewRead.IValues): AutoMovieViewSection.ISection {
  const result: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
    { extents: values.extents as [number, number, number, number] },
    values.shoulders as [number, number, number, number],
  );
  const fault: string | null = AutoMovieViewSection.fault(result);
  if (fault !== null) throw new Error(fault);
  return result;
}

/** Intersect both source conic branches at an actual chart-v coordinate. */
function chord(original: AutoMovieViewSection.ISection, across: number): [number, number] {
  const extents: AutoMovieViewSection.IBox["extents"] = original.box.extents;
  if (!(across > -extents[3] && across < extents[1])) throw new Error("No interior chord within the original across supports");
  const horizontal: (phi: number) => number = (phi: number): number => AutoMovieViewSection.radius(original, phi)[0] * Math.sin(phi);
  const values: number[] = [];
  for (const start of [-Math.PI / 2, Math.PI / 2]) {
    const phi: number | null = AutoMovieIllinois.root((angle: number): number => horizontal(angle) - across, start, start + Math.PI, 1e-9, 100);
    if (phi === null || !Number.isFinite(phi) || Math.abs(horizontal(phi) - across) > 1e-9) throw new Error("No residual-checked original chord root");
    const value: number = AutoMovieViewSection.radius(original, phi)[0] * Math.cos(phi);
    if (!Number.isFinite(value)) throw new Error("Nonfinite original chord ordinate");
    values.push(value);
  }
  return [Math.min(...values), Math.max(...values)];
}

/** Query the actual arm/palm's local normal section only where its declared bone is straight. */
function localParent(palm: Palm, point: Vec3): Record<string, unknown> {
  for (let index: number = 2; index < palm.runs.length; index++) {
    const from: Vec3 = palm.centres[index]!;
    const tangent: Vec3 | null = V.unit(V.sub(palm.centres[index + 1]!, from));
    if (tangent === null) throw new Error("Degenerate declared palm run");
    const run: AutoMovieViewAxis.IRun = palm.runs[index]!;
    const distance: number = V.dot(V.sub(point, from), tangent);
    if (distance < run.from || distance > run.to) continue;
    const station: number = run.start + distance - run.from;
    const prepared: Prepared = palm.prepared;
    if (station <= prepared.scalar.domain[0] || station >= prepared.scalar.domain[1])
      return { available: false, reason: "outside original positive parent domain", station, index };
    const frame: Frame = prepared.part.axis.at(station);
    const delta: Vec3 = V.sub(point, frame.origin);
    const planeMiss: number = V.dot(delta, AutoMovieViewAxis.normal(frame));
    if (Math.abs(planeMiss) > 1e-9) throw new Error(`Actual parent plane miss ${planeMiss} mm`);
    const u: number = V.dot(delta, frame.u);
    const v: number = V.dot(delta, frame.v);
    const values: AutoMovieLoftViewRead.IValues = readValues(prepared, station);
    const whole: Record<string, unknown> = section(prepared, station);
    if (!(values.extents.every((value: number): boolean => value > 0) && v > -values.extents[3]! && v < values.extents[1]!))
      return { available: false, reason: "outside positive parent across supports", station, index, u, v, planeMiss, source: whole };
    if ((prepared.chain.reliefs?.length ?? 0) !== 0 || prepared.chain.layers.some((layer: IAutoMovieLoftChain.ILayer): boolean => layer.lift !== undefined))
      return { available: false, reason: "original radial field does not include present relief/lift", station, index, source: whole };
    const ends: [number, number] = chord(makeSection(values), v);
    const regular: boolean = station >= prepared.chain.layers[0]!.y && station <= prepared.chain.layers.at(-1)!.y;
    const converted: Frame | null = regular ? AutoMovieLoftChain.frame(prepared.chain, station) : null;
    const frameMiss: number | null = converted === null ? null : Math.max(...(["origin", "u", "v"] as const).map((key: "origin" | "u" | "v"): number => V.norm(V.sub(frame[key], converted[key]))));
    if (frameMiss !== null && frameMiss > 1e-9) throw new Error(`Actual source/raw frame mismatch ${frameMiss} mm`);
    return { available: true, index, run, station, u, v, planeMiss, frameMiss, rawRegular: regular, source: whole, chord: { lower: ends[0], upper: ends[1], spanU: ends[1] - ends[0], centreU: (ends[0] + ends[1]) / 2, lowerMargin: u - ends[0], upperMargin: ends[1] - u, positiveUSupport: values.extents[0] }, scope: "original +u chord at fixed v, not palmar thickness; no full contact/footprint or kept Boolean certificate" };
  }
  return { available: false, reason: "outside declared straight palm runs; no corner-plane substitution" };
}

/** Complete every observation before reporting the round's observer failures. */
function collect(defects: string[], label: string, query: () => void): void {
  try { query(); } catch (error: unknown) {
    defects.push(`${label}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  }
}

/** One actual source-builder attempt. */
type Source = AutoMovieHumanBodyLaw.IDefinition["lane"]["sources"][number];
/** Calibration-mm point or dimensionless material direction. */
type Vec3 = V.Vec3;
/** The original source plane, independently of principal-layer interpolation. */
type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;
/** One immutable original source and its actual returned raw chain. */
interface Prepared {
  /** Last original producer attempt. */
  source: Source;
  /** Original view definition used by production. */
  part: IAutoMovieViewPart;
  /** Actual prepared source scalar/fullness owner. */
  scalar: AutoMovieLoftViewSource.ISource;
  /** Actual returned raw loft, before joins. */
  chain: IAutoMovieLoftChain;
}
/** Qualified parent source and its declared straight course segments. */
interface Palm {
  /** Original arm/palm source and retained raw chain. */
  prepared: Prepared;
  /** Exact canonical source-axis centres, calibration mm. */
  centres: Vec3[];
  /** The same kernel jointed course's fixed straight runs. */
  runs: AutoMovieViewAxis.IRun[];
}
