import type { IAutoMovieHumanBodyCalibration } from "../../../human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../human/src/lofting/IAutoMovieHumanLoftChain";
import { humanCurveColour } from "./humanCurveColour";
import { resolveHumanCurves } from "./resolveHumanCurves";

/**
 * Draw a 1200 x 1200 diagnostic SVG of one or more lofting curves from the generator's calibration.
 *
 * `curves` is the canonical list of `normalizeHumanCurves`, expanded in order:
 * `<chain>/<k>` (principal layer k) and `<chain>/axis` with `*` globs over the
 * calibration's ids, `<chain>@<s>` (the Hermite section at station s mm, so a
 * station between principal layers can be inspected) and the series
 * `<chain>@<from>:<to>:<step>`. Line i takes `humanCurveColour(i)`. Everything
 * is evaluated by the human package's `AutoMovieHumanLoftChain` and
 * `AutoMovieHumanLoftChain.section`, in calibration millimetres.
 *
 * Sections share one true-scale frame: each is drawn in its own plane (local
 * x to the right, local z downward, so a horizontal section reads like a top
 * view with +X right), which for horizontal chains is the world X-Z frame.
 * Each carries its own curvature comb: at 720 phases a spike along the normal
 * of length proportional to the signed curvature
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
 * @evidence contracts/common.md#principled-implementation Curvature uses the analytic first phase derivative and a central difference of it (step 1e-4 rad) for the second; perimeter is the closed polyline length of 512 ring points; all values come from the calibration through the human package's chain functions.
 * @evidence contracts/common.md#clear-and-simple-design One pure function from calibration and list to SVG text; transport and rasterization belong to the page and worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown chains, unmatched globs, layer indices or stations outside a chain, empty or oversized series and axis/section mixes throw; no reference file or saved mesh is read.
 * @evidence contracts/common.md#meaningful-documentation States the id grammar, colour order, units, orientation, comb definition and scaling, and the axis plots.
 * @evidence contracts/performance.md#efficient-algorithms O(L N K) harmonic evaluations for L lines, N = 720 phases and order K; an axis costs 240 stations times one 512-point ring; at most 64 lines.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumes the caller's evaluated calibration for every selected curve; the page reevaluates BodyLaw from actual parameters rather than reusing stored model jets.
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
interface IPoint {
  x: number;
  z: number;
  nx: number;
  nz: number;
  k: number;
}

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
  const drawn: Array<ILine & ReturnType<typeof section>> = lines.map(
    (line: ILine) => ({
      ...line,
      ...section(line.chain, line.s!),
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

/** Sample a section in its plane with normals, curvature and the chain's vertex phases. */
function section(
  chain: IAutoMovieHumanLoftChain,
  s: number,
): {
  points: IPoint[];
  vertices: Array<[number, number]>;
  perimeter: number;
  maxCurvature: number;
  rmsCurvature: number;
  signChanges: number;
} {
  const c: number[] = AutoMovieHumanLoftChain.coefficients(chain, s);
  const evaluate: (t: number) => [number, number, number, number] = (
    t: number,
  ): [number, number, number, number] =>
    AutoMovieHumanLoftChain.section(chain, c, t);

  // Second derivative by a central difference of the analytic first derivative.
  const h: number = 1e-4;
  const points: IPoint[] = Array.from(
    { length: 720 },
    (_: unknown, i: number): IPoint => {
      const t: number = (2 * Math.PI * i) / 720;
      const [x, z, dx, dz] = evaluate(t);
      const ahead: [number, number, number, number] = evaluate(t + h);
      const behind: [number, number, number, number] = evaluate(t - h);
      const ddx: number = (ahead[2] - behind[2]) / (2 * h);
      const ddz: number = (ahead[3] - behind[3]) / (2 * h);
      const speed: number = Math.hypot(dx, dz) || 1e-12;
      return {
        x,
        z,
        nx: dz / speed,
        nz: -dx / speed,
        k: (dx * ddz - dz * ddx) / speed ** 3,
      };
    },
  );
  const curvatures: number[] = points.map((p: IPoint): number => p.k);
  const signChanges: number = curvatures.filter(
    (k: number, i: number): boolean =>
      Math.sign(k) !== Math.sign(curvatures[(i + 1) % curvatures.length]!),
  ).length;
  return {
    points,
    vertices: Array.from(
      { length: chain.samples },
      (_: unknown, i: number): [number, number] => {
        const p: [number, number, number, number] = evaluate(
          (2 * Math.PI * i) / chain.samples,
        );
        return [p[0], p[1]];
      },
    ),
    perimeter: perimeter(chain, s),
    maxCurvature: Math.max(...curvatures.map(Math.abs)),
    rmsCurvature: Math.sqrt(
      curvatures.reduce((sum: number, k: number): number => sum + k * k, 0) /
        curvatures.length,
    ),
    signChanges,
  };
}

/** Closed polyline length of the world ring at station s, 512 phases. */
function perimeter(chain: IAutoMovieHumanLoftChain, s: number): number {
  const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
    chain,
    s,
    Array.from(
      { length: 512 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 512,
    ),
  );
  return ring.reduce(
    (sum: number, p: [number, number, number], i: number): number => {
      const q: [number, number, number] = ring[(i + 1) % ring.length]!;
      return sum + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    },
    0,
  );
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
        stations.map((s: number): number => perimeter(l.chain, s)),
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

/** Map a data box into a pixel rectangle; `equal` keeps one scale on both axes and flips nothing. */
function fit(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  [left, top, width, height]: [number, number, number, number],
  equal: boolean = true,
): (x: number, y: number) => [number, number] {
  const kx: number = width / (x1 - x0 || 1);
  const ky: number = height / (y1 - y0 || 1);
  if (!equal)
    return (x: number, y: number): [number, number] => [
      left + (x - x0) * kx,
      top + height - (y - y0) * ky * 0.9 - height * 0.05,
    ];
  const k: number = Math.min(kx, ky);
  const ox: number = left + (width - (x1 - x0) * k) / 2;
  const oy: number = top + (height - (y1 - y0) * k) / 2;
  return (x: number, y: number): [number, number] => [
    ox + (x - x0) * k,
    oy + (y - y0) * k,
  ];
}

/** Largest 1, 2 or 5 times a power of ten not above `value`. */
function roundLength(value: number): number {
  const power: number = 10 ** Math.floor(Math.log10(value));
  return (
    [5, 2, 1]
      .map((m: number): number => m * power)
      .find((v: number): boolean => v <= value) ?? power
  );
}

/** Fixed two-decimal number text. */
function f(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : String(value);
}

/** SVG line element. */
function line(
  a: [number, number],
  b: [number, number],
  colour: string,
  width: number,
  opacity: number,
): string {
  return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${colour}" stroke-width="${width}" stroke-opacity="${opacity}"/>`;
}

/** SVG polyline, closed unless `closed` is false. */
function path(
  points: Array<[number, number]>,
  colour: string,
  width: number,
  opacity: number,
  closed: boolean = true,
): string {
  const d: string = points
    .map(
      (p: [number, number], i: number): string =>
        `${i === 0 ? "M" : "L"}${f(p[0])} ${f(p[1])}`,
    )
    .join(" ");
  return `<path d="${d}${closed ? " Z" : ""}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linejoin="round"/>`;
}

/** SVG text element with escaped content. */
function text(
  x: number,
  y: number,
  value: string,
  colour: string,
  size: number,
): string {
  const escaped: string = value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<text x="${f(x)}" y="${f(y)}" fill="${colour}" font-size="${size}" font-family="ui-monospace, Consolas, monospace">${escaped}</text>`;
}

/** Standalone 1200 x 1200 SVG document on a white background. */
function svg(body: string[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="100%" height="100%" fill="#fff"/>${body.join("")}</svg>`;
}
