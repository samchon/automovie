import {
  type AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import { HumanDebugReferenceCut } from "./HumanDebugReferenceCut";
import type { HumanDebugViewParts } from "./HumanDebugViewParts";

type Vec3 = [number, number, number];

/** Angles each built section is read at for its distance to the skin. */
const RING: number = 48;

/**
 * Each built part's view curves against the same person's reference skin, cut by the part's own
 * section planes (`HumanDebugReferenceCut`): a diagnostic for the modelers, never an acceptance and
 * never a target any shape is fitted to.
 *
 * At every emitted station of a part, in person millimetres (the calibration scaled by the
 * person's stature about the floor):
 *
 * - edges: where the reference cut's heuristic candidate around the axis is found, each of the four outline edges
 *   (`+u`, `+v`, `-u`, `-v`, the front pair then the side pair) minus the reference's extreme on
 *   that side, positive where the built extent exceeds that candidate's, also as a share of the
 *   reference's breadth (front edges) or depth (side edges) there;
 * - touches: the distance from each of the four touch points to the nearest reference skin in the
 *   cut, read for every part, a face part merged into the head included;
 * - ring: the distance from the built section, read at {@link RING} equal angles, to the nearest
 *   reference skin: the fullness and the extremes together.
 *
 * Each part's row keeps the largest and the mean absolute value of each over its stations and the
 * station of the largest edge deviation, as its share of the part's station span and its nearest
 * named site. Rows hold aggregates only, never a reference coordinate.
 * The cut's 9/12-sector and 10 mm linkage rules do not prove closure or containment; slab
 * projection and incomplete source arcs make these approximate diagnostics, not exact
 * three-dimensional skin distances or anatomical acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Measures admitted raw sections against the independently sampled reference segment set; selected names restrict work without changing any retained part's diagnostic calculation.
 * @evidence contracts/common.md#clear-and-simple-design Part selection, station readings and aggregate rows share this diagnostic owner; source construction and rendering remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing raw sections produce no row and missing reference support remains nonfinite; neither is anatomical agreement or final realization.
 * @evidence contracts/common.md#meaningful-documentation States units, heuristic E/B, projected T/R, selected scope and actual measured-station coverage.
 * @evidence contracts/performance.md#efficient-algorithms Reads only selected parts' stations; each station scans its region segments up to five times and each supported station makes 52 nearest-segment queries, plus the cut's linkage work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares each station cut between its four touch and 48 ring readings; the caller supplies one flattened reference set.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns aggregate rows, with temporary station arrays bounded by the selected source and no retained parts, reference buffers or renderer handles.
 */
export namespace HumanDebugViewDeviation {
  /**
   * Requested diagnostic coverage and its actual work, separate from anatomical acceptance.
   *
   * @evidence contracts/common.md#principled-implementation Reports selected source names, unsupported or partly supported measurements and counts from the same station loop as the rows.
   * @evidence contracts/common.md#clear-and-simple-design One result keeps rows with their scope so an empty or partial table cannot lose its qualification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete means every selected raw station had reference support, never a final skin, containment or anatomy pass.
   * @evidence contracts/common.md#meaningful-documentation Names source-part selection, missing versus partial measurement and actual cut/distance call counts.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A result type chooses no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The diagnostic owner computes this result with its rows.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned aggregate rows and name arrays; no source geometry is retained.
   */
  export interface IOutput {
    /** Approximate rows, unchanged for a retained part when scope changes. */
    rows: IRow[];

    /** Measurement coverage, never source visibility or anatomical acceptance. */
    scope: {
      status: "complete" | "partial" | "unavailable";
      requestedParts: string[];
      parts: string[];
      allSourceParts: boolean;
      unavailableParts: string[];
      partiallyMeasuredParts: string[];
      emptySelection: boolean;
    };

    /** Actual selected source/station and query counts. */
    work: {
      diagnosticParts: number;
      rawStations: number;
      measuredStations: number;
      cutQueries: number;
      distanceQueries: number;
      rows: number;
    };
  }

  /**
   * One source part's raw-section aggregates and reference support coverage.
   *
   * @evidence contracts/common.md#principled-implementation Distinguishes emitted, reference-supported and heuristically surrounded stations; signed bias and nonnegative distances have separate fields.
   * @evidence contracts/common.md#clear-and-simple-design One aggregate record qualifies every diagnostic quantity without retaining source coordinates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null extents and nonfinite absent distances remain unavailable rather than zero error.
   * @evidence contracts/common.md#meaningful-documentation Names mm units, sign, approximate support and emitted-versus-measured counts.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A row type chooses no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its owner aggregates one source part once.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns scalar aggregates and fresh region-name arrays.
   */
  export interface IRow {
    /** The part's name. */
    name: string;

    /** Regions of the pack the part was cut against. */
    regions: string[];

    /** Emitted stations. */
    stations: number;

    /** Stations with nonempty reference-cut support; 52 distance queries are made for each. */
    measuredStations: number;

    /** Stations where the reference's piece around the axis was found. */
    surrounded: number;

    /** Largest and mean absolute candidate-edge deviation, mm, and share of candidate breadth/depth; null without a heuristic candidate. */
    edge: {
      max: number;
      mean: number;
      share: number;
      edge: string;
      at: number;
      site: string;
    } | null;

    /** Mean signed candidate-edge deviation `[+u, +v, -u, -v]`, mm (positive: larger built extent); null without a heuristic candidate. */
    bias: [number, number, number, number] | null;

    /** Largest and mean distance of the four touch points to the skin, mm. */
    touch: { max: number; mean: number };

    /** Largest and mean distance of the built section to the skin, mm. */
    ring: { max: number; mean: number };
  }

  /**
   * Compare only the requested source parts; the default retains the whole table.
   *
   * @param built The person's parts.
   * @param regions The reference's segments by region.
   * @param patterns Existing `part` globs; selection changes no retained row's geometry or formulas.
   * @returns Rows and explicit requested/support coverage; no raw stations means unavailable.
   *
   * @evidence contracts/common.md#principled-implementation Filters source names before any station cut, then uses the same raw sections and reference calculations as the full request.
   * @evidence contracts/common.md#clear-and-simple-design The existing part selector bounds this diagnostic; no new preview source, async job or fixture path is introduced.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A selected part without raw sections remains unavailable rather than gaining a zero row; an empty selection does not become agreement.
   * @evidence contracts/common.md#meaningful-documentation Names default whole scope and distinguishes emitted from actually supported measurement stations.
   * @evidence contracts/performance.md#efficient-algorithms Name matching precedes cuts; selected S stations make S cut calls and supported M stations make exactly 52M distance calls. Segment scans and linkage retain their documented costs.
   * @evidence contracts/performance.md#reuse-equivalent-work Each measured cut serves all four edge touches and 48 radii; a scoped row equals the corresponding full-request row.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns only result rows and call-local per-station/per-part scratch; input parts and segments remain borrowed and unchanged.
   */
  export function of(
    built: HumanDebugViewParts.IOutput,
    regions: readonly HumanDebugReferenceCut.IRegion[],
    patterns: readonly string[] = ["*"],
  ): IOutput {
    const rows: IRow[] = [];
    const selected: HumanDebugViewParts.IPart[] = built.parts.filter(
      (part: HumanDebugViewParts.IPart): boolean =>
        HumanDebugPattern.matches(part.name, patterns, ""),
    );
    for (const p of selected) {
      const sections: AutoMovieViewLoft.IStation[] = p.loft?.sections ?? [];
      if (sections.length === 0) continue;
      const names: string[] = regionsOf(p.name);
      const read: HumanDebugReferenceCut.IRegion[] = regions.filter(
        (r: HumanDebugReferenceCut.IRegion): boolean =>
          names.length === 0 || names.includes(r.name),
      );
      const knots: IAutoMovieViewPart.IKnot[] = p.part.front.positive.knots;
      const first: number = sections[0]!.station;
      const last: number = sections[sections.length - 1]!.station;
      const edges: number[] = [];
      const signed: number[][] = [[], [], [], []];
      const touches: number[] = [];
      const rings: number[] = [];
      let measuredStations: number = 0;
      let worst: IRow["edge"] = null;
      for (const s of sections) {
        const k: number = built.scale;
        const e: number[] = s.section.box.extents.map(
          (x: number): number => x * k,
        );
        const origin: Vec3 = [
          s.frame.origin[0]! * k,
          s.frame.origin[1]! * k,
          s.frame.origin[2]! * k,
        ];
        const u: Vec3 = [s.frame.u[0]!, s.frame.u[1]!, s.frame.u[2]!];
        const v: Vec3 = [s.frame.v[0]!, s.frame.v[1]!, s.frame.v[2]!];
        const cut: HumanDebugReferenceCut.ICut = HumanDebugReferenceCut.of(
          read,
          origin,
          u,
          v,
          Math.max(...e),
        );
        if (cut.segments.length === 0) continue;
        measuredStations++;
        const touch: [number, number][] = [
          [e[0]!, 0],
          [0, e[1]!],
          [-e[2]!, 0],
          [0, -e[3]!],
        ];
        for (const [x, z] of touch)
          touches.push(HumanDebugReferenceCut.distance(cut, x, z));
        for (let i: number = 0; i < RING; i++) {
          const phi: number = (2 * Math.PI * i) / RING;
          const r: number = AutoMovieViewSection.radius(s.section, phi)[0] * k;
          rings.push(
            HumanDebugReferenceCut.distance(
              cut,
              r * Math.cos(phi),
              r * Math.sin(phi),
            ),
          );
        }
        if (cut.extents === null) continue;
        const ref: [number, number, number, number] = cut.extents;
        const breadth: number = ref[0] + ref[2];
        const depth: number = ref[1] + ref[3];
        for (let q: number = 0; q < 4; q++) {
          const d: number = e[q]! - ref[q]!;
          edges.push(Math.abs(d));
          signed[q]!.push(d);
          if (worst === null || Math.abs(d) > worst.max) {
            const site: string = knots.reduce(
              (
                a: IAutoMovieViewPart.IKnot,
                b: IAutoMovieViewPart.IKnot,
              ): IAutoMovieViewPart.IKnot =>
                Math.abs(b.station - s.station) <
                Math.abs(a.station - s.station)
                  ? b
                  : a,
            ).site;
            worst = {
              max: Math.abs(d),
              mean: 0,
              share: Math.abs(d) / (q % 2 === 0 ? breadth : depth),
              edge: ["+u", "+v", "-u", "-v"][q]!,
              at: last > first ? (s.station - first) / (last - first) : 0,
              site,
            };
          }
        }
      }
      const mean = (a: number[]): number =>
        a.length === 0
          ? NaN
          : a.reduce((x: number, y: number): number => x + y, 0) / a.length;
      const finite = (a: number[]): number[] => a.filter(Number.isFinite);
      const largest = (a: number[]): number =>
        finite(a).reduce(
          (x: number, y: number): number => Math.max(x, y),
          -Infinity,
        );
      if (worst !== null) worst.mean = mean(edges);
      rows.push({
        name: p.name,
        regions: names,
        stations: sections.length,
        measuredStations,
        surrounded: signed[0]!.length,
        edge: worst,
        bias:
          signed[0]!.length === 0
            ? null
            : (signed.map(mean) as [number, number, number, number]),
        touch: { max: largest(touches), mean: mean(finite(touches)) },
        ring: { max: largest(rings), mean: mean(finite(rings)) },
      });
    }
    const measured: Map<string, IRow> = new Map(
      rows.map((row: IRow): [string, IRow] => [row.name, row]),
    );
    const unavailable: string[] = [
      ...built.observation.unavailableParts.filter((name: string): boolean =>
        HumanDebugPattern.matches(name, patterns, ""),
      ),
      ...selected
        .filter(
          (part: HumanDebugViewParts.IPart): boolean =>
            (measured.get(part.name)?.measuredStations ?? 0) === 0,
        )
        .map((part: HumanDebugViewParts.IPart): string => part.name),
    ];
    const partial: string[] = rows
      .filter(
        (row: IRow): boolean =>
          row.measuredStations > 0 && row.measuredStations < row.stations,
      )
      .map((row: IRow): string => row.name);
    const measuredStations: number = rows.reduce(
      (sum: number, row: IRow): number => sum + row.measuredStations,
      0,
    );
    const rawStations: number = selected.reduce(
      (sum: number, part: HumanDebugViewParts.IPart): number =>
        sum + (part.loft?.sections.length ?? 0),
      0,
    );
    return {
      rows,
      scope: {
        status:
          measuredStations === 0
            ? "unavailable"
            : unavailable.length === 0 && partial.length === 0
              ? "complete"
              : "partial",
        requestedParts: [...patterns],
        parts: selected.map(
          (part: HumanDebugViewParts.IPart): string => part.name,
        ),
        allSourceParts:
          selected.length === built.parts.length &&
          built.observation.unavailableParts.every((name: string): boolean =>
            HumanDebugPattern.matches(name, patterns, ""),
          ),
        unavailableParts: unavailable,
        partiallyMeasuredParts: partial,
        emptySelection: selected.length === 0,
      },
      work: {
        diagnosticParts: selected.length,
        rawStations,
        measuredStations,
        cutQueries: rawStations,
        distanceQueries: 52 * measuredStations,
        rows: rows.length,
      },
    };
  }

  /**
   * The pack regions a part is cut against, by the words of its name; empty reads every region.
   *
   * @param name The part's name.
   */
  export function regionsOf(name: string): string[] {
    const side: string | null = /left/.test(name)
      ? "_l"
      : /right/.test(name)
        ? "_r"
        : null;
    if (
      /(^|\.)(head|neck|nose|nasal|lip|ear|auricle|lid|eyelid|orbit|brow|zyg|cheek|chin|jaw|mouth|philtrum|malar|temple)/.test(
        name,
      )
    )
      return ["head", "trunk"];
    if (side !== null) {
      if (/foot|toe|hallux/.test(name)) return ["foot" + side, "leg" + side];
      if (
        /hand|finger|thumb|palm|index|middle|ring|little|pinky|digit/.test(name)
      )
        return ["hand" + side, "arm" + side];
      if (/arm|elbow|wrist|deltoid/.test(name))
        return ["arm" + side, "hand" + side, "trunk"];
      if (/leg|thigh|calf|knee|shank|ankle/.test(name))
        return ["leg" + side, "foot" + side, "trunk"];
    }
    if (/trunk|breast|glut|buttock|chest|abdomen|pelvis|upper/.test(name))
      return ["trunk"];
    return [];
  }
}
