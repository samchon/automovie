import type { IAutoMovieHumanBodyCalibration } from "../../../human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanDiagramSvg } from "./HumanDiagramSvg";
import { humanCurveColour } from "./humanCurveColour";
import { resolveHumanCurves } from "./resolveHumanCurves";
import { sampleHumanSection } from "./sampleHumanSection";

const fit: typeof HumanDiagramSvg.fit = HumanDiagramSvg.fit;
const roundLength: typeof HumanDiagramSvg.roundLength =
  HumanDiagramSvg.roundLength;
const f: typeof HumanDiagramSvg.f = HumanDiagramSvg.f;
const line: typeof HumanDiagramSvg.line = HumanDiagramSvg.line;
const path: typeof HumanDiagramSvg.path = HumanDiagramSvg.path;
const text: typeof HumanDiagramSvg.text = HumanDiagramSvg.text;
const svg: typeof HumanDiagramSvg.svg = HumanDiagramSvg.svg;

/**
 * Draw a 1200 x 1200 diagnostic SVG of one or more lofting curves from the generator's calibration.
 *
 * `curves` is the canonical list of `normalizeHumanCurves`, expanded in order:
 * `<chain>/<k>` (principal layer k) and `<chain>/axis` with `*` globs over the
 * calibration's ids, `<chain>@<s>` (the Hermite section at station s mm, so a
 * station between principal layers can be inspected) and the series
 * `<chain>@<from>:<to>:<step>`. Line i takes `humanCurveColour(i)`. Everything
 * is evaluated by the human package's chain functions, in calibration
 * millimetres; a section is the skin's ring, reliefs included, sampled by
 * `sampleHumanSection`.
 *
 * Sections share one true-scale frame: each is drawn in its own plane (local
 * x to the right, local z downward, so a horizontal section reads like a top
 * view with +X right), which for horizontal chains is the world X-Z frame.
 * Each carries its own curvature comb: at 720 phases a spike along the normal
 * of length proportional to the exact signed curvature
 * `k = (x' z'' - z' x'') / |r'|^3`, outward where the curve is convex, with one
 * scale for all lines: the 95th percentile of |k| maps to 8 percent of the plot
 * extent and spikes are clipped at three times that, so a pinch point does
 * not flatten the comb along the rest of the ring.
 * Ringing shows as alternating spikes. The chain's own vertex phases are
 * dotted and phase 0 is marked with an arrow toward increasing phase.
 *
 * Axes (a list of only `/axis` ids) are drawn as three plots against station:
 * centroid x, centroid z and section perimeter, each chain in its colour with
 * its principal layers ticked. A list mixing axes and sections is refused.
 *
 * @param calibration The generator's body calibration.
 * @param curves Canonical curve list, non-empty.
 * @param scale Model scale of the requested alias relative to the calibration, printed in the legend.
 * @returns A standalone SVG document.
 *
 * @evidence contracts/common.md#principled-implementation Sections are the skin's rings with their reliefs and their curvature takes exact first and second phase derivatives (sampleHumanSection); perimeter is the closed polyline length of 512 ring points; the axis plot's centroid curvature is a central difference over its 240 sampled stations; all values come from the calibration through the human package's chain functions.
 * @evidence contracts/common.md#clear-and-simple-design One pure function from calibration and list to SVG text; transport and rasterization belong to the page and worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown chains, unmatched globs, layer indices or stations outside a chain, empty or oversized series and axis/section mixes throw; no reference file or saved mesh is read.
 * @evidence contracts/common.md#meaningful-documentation States the id grammar, colour order, units, orientation, comb definition and scaling, and the axis plots.
 * @evidence contracts/performance.md#efficient-algorithms O(L N K) harmonic evaluations for L lines, N = 720 phases and order K; an axis costs 240 stations times one 512-point ring; at most 64 lines.
 * @evidence contracts/performance.md#reuse-equivalent-work The calibration module is the one the page's generator already loaded.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one string; retains nothing.
 */
export function drawHumanCurveDiagram(
  calibration: IAutoMovieHumanBodyCalibration,
  curves: string,
  scale: number,
): string {
  const lines: ILine[] = expand(calibration, curves);
  const axes: number = lines.filter(
    (line: ILine): boolean => line.s === null,
  ).length;
  if (axes !== 0 && axes !== lines.length)
    throw new Error("Human curve diagram cannot mix axes and sections");
  const header: string = `calibration mm; model scale x${scale.toFixed(4)}`;
  return axes !== 0
    ? axisDiagram(lines, header)
    : sectionDiagram(lines, header);
}

/** One expanded line: a chain and a station, or null for its axis. */
interface ILine {
  label: string;
  chain: IAutoMovieHumanLoftChain;
  s: number | null;
  colour: string;
}

/** One point of a drawn section with its unit right normal and signed curvature. */
type IPoint = sampleHumanSection.IPoint;

/** Expand the canonical list in order into lines, deduplicated by label. */
function expand(
  calibration: IAutoMovieHumanBodyCalibration,
  curves: string,
): ILine[] {
  const found: Map<string, Omit<ILine, "colour">> = new Map();
  const chain: (name: string) => IAutoMovieHumanLoftChain = (
    name: string,
  ): IAutoMovieHumanLoftChain => {
    const match: IAutoMovieHumanLoftChain | undefined = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
    );
    if (match === undefined) throw new Error("Unknown Human chain: " + name);
    return match;
  };
  for (const pattern of curves.split(",")) {
    const station: RegExpExecArray | null =
      /^(.+)@(-?[\d.]+)(?::(-?[\d.]+):([\d.]+))?$/.exec(pattern);
    if (station !== null) {
      const target: IAutoMovieHumanLoftChain = chain(station[1]!);
      const from: number = Number(station[2]);
      const to: number = station[3] === undefined ? from : Number(station[3]);
      const step: number = station[4] === undefined ? 1 : Number(station[4]);
      const count: number = Math.floor((to - from) / step + 1e-9) + 1;
      if (!(step > 0) || !(count >= 1) || count > 200)
        throw new Error(
          "Human station series must have a positive step and 1 to 200 stations: " +
            pattern,
        );

      // A series keeps the stations inside the chain; a single station must be inside.
      const bottom: number = target.layers[0]!.y;
      const top: number = target.layers[target.layers.length - 1]!.y;
      let kept: number = 0;
      for (let i: number = 0; i < count; i++) {
        const s: number = Number((from + i * step).toFixed(6));
        if (s < bottom || s > top) continue;
        kept++;
        found.set(`${target.name}@${s}`, {
          label: `${target.name}@${s}`,
          chain: target,
          s,
        });
      }
      if (kept === 0)
        throw new Error(
          `Stations of ${pattern} lie outside chain ${target.name} [${f(bottom)}, ${f(top)}] mm`,
        );
      continue;
    }

    // Globs over the calibration's own ids, in calibration order.
    const expression: RegExp = resolveHumanCurves.glob(pattern);
    let matched: number = 0;
    for (const c of calibration.chains)
      for (const [id, s] of [
        ...c.layers.map(
          (
            layer: IAutoMovieHumanLoftChain.ILayer,
            k: number,
          ): [string, number] => [`${c.name}/${k}`, layer.y],
        ),
        [`${c.name}/axis`, null] as [string, null],
      ] as Array<[string, number | null]>)
        if (expression.test(id)) {
          matched++;
          found.set(id, { label: id, chain: c, s });
        }
    if (matched === 0)
      throw new Error("Human curve pattern matches no curve: " + pattern);
  }
  if (found.size === 0) throw new Error("Human curve diagram needs curves=");
  if (found.size > 64)
    throw new Error("Human curve diagram is limited to 64 lines");
  return [...found.values()].map(
    (line: Omit<ILine, "colour">, index: number): ILine => ({
      ...line,
      colour: humanCurveColour(index),
    }),
  );
}

/** All sections in one true-scale plot with their combs and a legend per line. */
function sectionDiagram(lines: ILine[], header: string): string {
  const drawn: Array<ILine & sampleHumanSection.ISection> = lines.map(
    (line: ILine): ILine & sampleHumanSection.ISection => ({
      ...line,
      ...sampleHumanSection(line.chain, line.s!),
    }),
  );
  const xs: number[] = drawn.flatMap((d: (typeof drawn)[number]): number[] =>
    d.points.map((p: IPoint): number => p.x),
  );
  const zs: number[] = drawn.flatMap((d: (typeof drawn)[number]): number[] =>
    d.points.map((p: IPoint): number => p.z),
  );
  const extent: number = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...zs) - Math.min(...zs),
  );
  // Scale by the 95th percentile of |k| so pinch points do not flatten the
  // comb elsewhere; spikes are clipped at three times that typical length.
  const sorted: number[] = drawn
    .flatMap((d: (typeof drawn)[number]): number[] =>
      d.points.map((p: IPoint): number => Math.abs(p.k)),
    )
    .sort((a: number, b: number): number => a - b);
  const typical: number = sorted[Math.floor(0.95 * (sorted.length - 1))]!;
  const comb: number = typical > 0 ? (0.08 * extent) / typical : 0;

  // The plot starts below the legend: two header rows plus one per line.
  const top: number = 40 + (lines.length + 2) * 24 + 16;
  const limit: number = 3 * 0.08 * extent;
  const tip: (p: IPoint) => [number, number] = (
    p: IPoint,
  ): [number, number] => {
    const length: number = Math.max(-limit, Math.min(limit, p.k * comb));
    return [p.x + p.nx * length, p.z + p.nz * length];
  };
  const all: Array<[number, number]> = drawn.flatMap(
    (d: (typeof drawn)[number]) =>
      d.points.flatMap(
        (p: IPoint): Array<[number, number]> => [[p.x, p.z], tip(p)],
      ),
  );
  const map: (x: number, z: number) => [number, number] = fit(
    Math.min(...all.map((p: [number, number]): number => p[0])),
    Math.max(...all.map((p: [number, number]): number => p[0])),
    Math.min(...all.map((p: [number, number]): number => p[1])),
    Math.max(...all.map((p: [number, number]): number => p[1])),
    [40, top, 1120, 1140 - top],
  );
  const pixelsPerMm: number = map(1, 0)[0] - map(0, 0)[0];

  const out: string[] = [];
  for (const d of drawn) {
    // Comb spikes every second phase (clipped ones fainter), the comb envelope
    // broken at clipped spikes so a pinch draws no long chords, then the ring.
    const clipped: (p: IPoint) => boolean = (p: IPoint): boolean =>
      Math.abs(p.k * comb) > limit;
    d.points.forEach((p: IPoint, i: number): void => {
      if (i % 2 === 0)
        out.push(
          line(
            map(p.x, p.z),
            map(...tip(p)),
            d.colour,
            2,
            clipped(p) ? 0.2 : 0.45,
          ),
        );
    });
    let run: Array<[number, number]> = [];
    for (const p of [...d.points, d.points[0]!]) {
      if (clipped(p)) {
        if (run.length > 1) out.push(path(run, d.colour, 2, 0.7, false));
        run = [];
      } else run.push(map(...tip(p)));
    }
    if (run.length > 1) out.push(path(run, d.colour, 2, 0.7, false));
    out.push(
      path(
        d.points.map((p: IPoint) => map(p.x, p.z)),
        d.colour,
        3.5,
        1,
      ),
    );
    for (const v of d.vertices) {
      const [x, y] = map(v[0], v[1]);
      out.push(
        `<circle cx="${f(x)}" cy="${f(y)}" r="2.5" fill="${d.colour}"/>`,
      );
    }

    // Phase 0 with a 28 px arrow along the direction of increasing phase.
    const first: IPoint = d.points[0]!;
    const p0: [number, number] = map(first.x, first.z);
    const p1: [number, number] = [p0[0] - first.nz * 28, p0[1] + first.nx * 28];
    out.push(
      `<circle cx="${f(p0[0])}" cy="${f(p0[1])}" r="7" fill="${d.colour}" stroke="#000" stroke-width="2"/>`,
    );
    out.push(line(p0, p1, "#000", 3, 1));
  }

  const bar: number = roundLength(220 / pixelsPerMm);
  out.push(line([40, 1170], [40 + bar * pixelsPerMm, 1170], "#000", 3, 1));
  out.push(text(40, 1158, `${bar} mm`, "#000", 16));
  out.push(
    text(700, 1170, "x →  z ↓ (section plane)  ● = phase 0", "#495057", 16),
  );

  out.push(
    text(
      40,
      40,
      `${header}   comb spike = k x ${f(comb)} mm (shared, 95th pct = ${f(0.08 * extent)} mm, clipped at 3x)`,
      "#000",
      17,
    ),
  );
  out.push(
    text(
      40,
      64,
      "line   station  K  samples  perimeter  max|k| (min radius)  RMS k  sign changes",
      "#495057",
      15,
    ),
  );
  drawn.forEach((d: (typeof drawn)[number], index: number): void => {
    const framed: string = d.chain.layers.some(
      (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.frame !== undefined,
    )
      ? " framed"
      : "";
    out.push(
      text(
        40,
        88 + index * 24,
        `${d.label}  s=${f(d.s!)}  ${d.chain.basis === "spline" ? "N" : "K"}=${d.chain.order}  n=${d.chain.samples}  P=${f(d.perimeter)}  ${d.maxCurvature.toExponential(2)} (${f(1 / d.maxCurvature)})  ${d.rmsCurvature.toExponential(2)}  ${d.signChanges}${framed}`,
        d.colour,
        16,
      ),
    );
  });
  return svg(out);
}

/** Centroid x, centroid z and perimeter against station for every axis line. */
function axisDiagram(lines: ILine[], header: string): string {
  const series: Array<
    ILine & { stations: number[]; values: number[][]; curvature: number[] }
  > = lines.map((l: ILine) => {
    const bottom: number = l.chain.layers[0]!.y;
    const top: number = l.chain.layers[l.chain.layers.length - 1]!.y;
    const stations: number[] = Array.from(
      { length: 240 },
      (_: unknown, i: number): number => bottom + ((top - bottom) * i) / 239,
    );
    const axis: [number, number, number][] = stations.map(
      (s: number): [number, number, number] =>
        AutoMovieHumanLoftChain.axis(l.chain, s),
    );

    // 3D curvature of the centroid curve by finite differences over stations.
    const curvature: number[] = axis
      .slice(1, -1)
      .map((p: [number, number, number], i: number): number => {
        const a: [number, number, number] = axis[i]!;
        const b: [number, number, number] = axis[i + 2]!;
        const d1: number[] = [0, 1, 2].map(
          (j: number): number => (b[j]! - a[j]!) / 2,
        );
        const d2: number[] = [0, 1, 2].map(
          (j: number): number => b[j]! - 2 * p[j]! + a[j]!,
        );
        const cross: number = Math.hypot(
          d1[1]! * d2[2]! - d1[2]! * d2[1]!,
          d1[2]! * d2[0]! - d1[0]! * d2[2]!,
          d1[0]! * d2[1]! - d1[1]! * d2[0]!,
        );
        return cross / Math.hypot(...d1) ** 3;
      });
    return {
      ...l,
      stations,
      values: [
        axis.map((p: [number, number, number]): number => p[0]),
        axis.map((p: [number, number, number]): number => p[2]),
        stations.map((s: number): number =>
          sampleHumanSection.perimeter(l.chain, s),
        ),
      ],
      curvature,
    };
  });
  const low: number = Math.min(
    ...series.map((d: (typeof series)[number]): number => d.stations[0]!),
  );
  const high: number = Math.max(
    ...series.map(
      (d: (typeof series)[number]): number =>
        d.stations[d.stations.length - 1]!,
    ),
  );
  const top: number = 40 + (lines.length + 1) * 24 + 24;
  const height: number = (1110 - top) / 3 - 30;

  const out: string[] = [];
  ["centroid x (mm)", "centroid z (mm)", "perimeter (mm)"].forEach(
    (label: string, panel: number): void => {
      const y0: number = top + panel * (height + 30);
      const values: number[] = series.flatMap(
        (d: (typeof series)[number]): number[] => d.values[panel]!,
      );
      const map: (x: number, y: number) => [number, number] = fit(
        low,
        high,
        Math.min(...values),
        Math.max(...values),
        [100, y0, 1060, height],
        false,
      );
      out.push(
        `<rect x="100" y="${f(y0)}" width="1060" height="${f(height)}" fill="none" stroke="#adb5bd" stroke-width="2"/>`,
      );
      for (const d of series) {
        for (const layer of d.chain.layers) {
          const [x] = map(layer.y, 0);
          out.push(line([x, y0], [x, y0 + height], d.colour, 2, 0.35));
        }
        out.push(
          path(
            d.stations.map((s: number, i: number) =>
              map(s, d.values[panel]![i]!),
            ),
            d.colour,
            3,
            1,
            false,
          ),
        );
      }
      out.push(
        text(
          108,
          y0 + 22,
          `${label}: ${f(Math.min(...values))} .. ${f(Math.max(...values))}`,
          "#212529",
          16,
        ),
      );
    },
  );
  out.push(
    text(
      100,
      1150,
      `station ${f(low)} .. ${f(high)} mm →   faint verticals: principal layers`,
      "#495057",
      16,
    ),
  );
  out.push(text(40, 40, header, "#000", 17));
  series.forEach((d: (typeof series)[number], index: number): void => {
    const max: number = Math.max(...d.curvature);
    const rms: number = Math.sqrt(
      d.curvature.reduce((s: number, k: number): number => s + k * k, 0) /
        d.curvature.length,
    );
    out.push(
      text(
        40,
        64 + index * 24,
        `${d.label}  ${d.chain.basis === "spline" ? "N" : "K"}=${d.chain.order}  n=${d.chain.samples}  layers ${d.chain.layers.length}  axis k max ${max.toExponential(2)} RMS ${rms.toExponential(2)} /mm`,
        d.colour,
        16,
      ),
    );
  });
  return svg(out);
}
