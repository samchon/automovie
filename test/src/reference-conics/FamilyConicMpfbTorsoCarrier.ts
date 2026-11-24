import { AutoMovieSolidVector as V } from "@automovie/engine";
import {
  AutoMovieHumanTrunkCarrier as Carrier,
  AutoMovieHumanConicLoft as Loft,
} from "@automovie/human";
import type {
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as Plane,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbDirectedSheet as Sheet } from "./FamilyConicMpfbDirectedSheet";
import type { FamilyConicMpfbParentFit as Fit } from "./FamilyConicMpfbParentFit";
import { FamilyConicMpfbScalarAtlas as Scalar } from "./FamilyConicMpfbScalarAtlas";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";
import { FamilyConicMpfbTorsoRail as Rail } from "./FamilyConicMpfbTorsoRail";

/** A held-out position with its optional analytic parent boundary data. */
interface IRail extends Fit.IRailRow {
  /** World point and analytic derivatives published by the original parent. */
  worldJet?: IAutoMovieSolidSurface.IJet;
}

/** Analytic parent outlet and section frames from the accepted source fit. */
interface IReceipt extends Fit.IInput {
  /** Identity of the public observation source. */
  source: Mpfb.ISource["source"];
  /** Catmull–Clark resolution of the observation surface. */
  subdivision: { depth: number };
  /** Fold depth that supplies the projected sampling and continuation lengths. */
  guide: { geometry: { foldDepth: number } };
  /** Physical station of the lower torso outlet on the same axis. */
  lowerEnd: number;
  /** Ordered analytic rail samples and their available world jets. */
  stockRail: { rows: IRail[] };
  /** Matching analytic parent mesh dimensions for exact rail indices. */
  tessellation: { columns: number; rows: number };
  /** Public comparison context is present only on contextualized receipts. */
  context?: unknown;
  /** Accepted analytic geometry and its protected anatomical guide. */
  candidate: {
    mesh: { positions: number[]; indices: number[] };
    guide: { points: Point[] };
  };
}

/** Connected, outward source face selected by the independent ray observations. */
interface ICarrier {
  /** Anatomical origin choice reported in the visibility comparison. */
  name: string;
  /** Projection centre on the independent torso course, millimetres. */
  origin: Point;
  /** Prepared directed public ray reader for this projection. */
  sheet: ReturnType<typeof Sheet.prepare>;
  /** Unique connected component that contains every protected rail point. */
  owner: number;
  /** Least positive observed projection Jacobian along the rail. */
  minimum: number;
}

/** Whole upper-torso visibility from an explicit point on the parent course. */
export namespace FamilyConicMpfbTorsoCarrier {
  /**
   * Check whether central projection supplies one continuous source carrier at
   * the protected parent outlet. Train no shape on the measured outlet itself.
   * Each point must select the positive, unique hit on one connected
   * component.
   *
   * @see https://www.cs.ubc.ca/tr/1992/tr-92-27
   * @see https://www.nist.gov/publications/defining-shape-measures-3d-star-shaped-particles-sphericity-roundness-and-dimensions
   */
  export function probe(
    receipt: IReceipt,
    source: Mpfb.IGeometry,
    fine: Subdivision.ISample,
    subdivisions: number = 1,
    anchorCells?: number,
    reference: boolean = false,
  ) {
    const rail: readonly IRail[] = receipt.stockRail.rows;
    const depth: number = receipt.guide.geometry.foldDepth;
    const first: number = Math.min(
      ...rail.map(({ station }): number => station),
    );
    const last: number = Math.max(
      ...rail.map(({ station }): number => station),
    );
    const base: number = receipt.support.centres[0]![1];
    const axis = Loft.axis(receipt.support);
    const side = Armscye.divider(Armscye.measure(source)).side;
    const gauges: { name: string; station: number }[] = [
      { name: "below-outlet", station: receipt.lowerEnd },
      { name: "outlet-base", station: first },
      { name: "outlet-midpoint", station: (first + last) / 2 },
    ];
    let best: ICarrier | undefined;
    const probes = gauges.map(({ name, station }) => {
      const origin: Point = axis.at(station).origin;
      const sheet = Sheet.prepare(fine, (p: Point): Point | null => {
        if (
          p[1] < base + receipt.lowerEnd - depth ||
          p[1] > base + last + depth
        )
          return null;
        if (side([p[0], p[1], Math.abs(p[2])]) > 0) return null;
        return V.unit(V.sub(p, origin));
      });
      const observed = rail.map(({ position }) => {
        const offset: Point = V.sub(position, origin);
        const radius: number = V.norm(offset);
        const direction: Point = V.scale(offset, 1 / radius);
        const hit: Sheet.IHit | null = sheet.unique(origin, direction);
        return {
          position,
          gap: hit === null ? null : Math.abs(radius - hit.distance),
          jacobian: hit === null ? null : V.dot(direction, hit.normal),
          component: hit?.component ?? null,
        };
      });
      const matches = observed.filter(
        ({ gap }): boolean => gap !== null && gap <= 0.01,
      );
      const owners = new Set(matches.map(({ component }) => component));
      const minimum: number = Math.min(
        ...matches.map(({ jacobian }): number => jacobian!),
      );
      if (
        matches.length === rail.length &&
        owners.size === 1 &&
        (best === undefined || minimum > best.minimum)
      )
        best = { name, origin, sheet, owner: matches[0]!.component!, minimum };
      return {
        name,
        station,
        origin,
        sourceComponents: sheet.components,
        sourceTriangles: sheet.triangles,
        railPoints: rail.length,
        matched: matches.length,
        retainedComponents: owners.size,
        minSignedJacobian: matches.length > 0 ? minimum : null,
        largestGap:
          matches.length > 0
            ? Math.max(...matches.map(({ gap }): number => gap!))
            : null,
        refused: observed.filter(
          ({ gap }): boolean => gap === null || gap > 0.01,
        ),
      };
    });
    const choice: ICarrier | undefined = best;
    return {
      probes,
      selected: choice?.name,
      studies:
        choice === undefined
          ? []
          : [8, 16].map(
              (cells): ReturnType<typeof fit> =>
                fit(
                  choice,
                  rail,
                  depth / cells,
                  depth,
                  subdivisions,
                  anchorCells,
                  reference,
                ),
            ),
    };
  }
}

/**
 * Fit a depth field on the mediolateral gnomonic plane. Its depth is along
 * anatomical left rather than ray length, so the world pullback is affine in
 * the two projective coordinates and the depth's ordinary two-jet.
 */
function fit(
  carrier: ICarrier,
  rail: readonly IRail[],
  pitch: number,
  fold: number,
  subdivisions: number,
  anchorCells: number | undefined,
  reference: boolean,
) {
  const { origin, sheet, owner } = carrier;
  const depths: number[] = rail
    .map(({ position }): number => position[2] - origin[2])
    .sort((a, b): number => a - b);
  const reach: number = depths[Math.floor(depths.length / 2)]!;
  const project = (point: Point): Plane => {
    const [x, y, z] = V.sub(point, origin);
    return [(reach * x) / z, (reach * y) / z];
  };
  const direction = (x: number, y: number): Point => [x / reach, y / reach, 1];
  const drafts = rail.every(({ worldJet }): boolean => worldJet !== undefined)
    ? [fold / 4, fold / 2, fold].map((length) => {
        const layers: number = Math.ceil(length / pitch);
        const anchor: number = Math.min(
          length,
          (anchorCells ?? Infinity) * pitch,
        );
        const lines = rail.map(({ worldJet }) =>
          Carrier.prepare({ origin, reach, length, anchor, rail: worldJet! }),
        );
        return { length, layers, lines, anchor };
      })
    : [];
  const bounds = sheet.boundaries.flatMap(
    ({ component, edge: [a, b] }): Scalar.IBoundary[] => {
      // With positive projective depth, each chord projects to the line segment
      // joining its endpoints. A chord through the pole is outside this domain.
      if (component !== owner || Math.min(a[2], b[2]) <= origin[2]) return [];
      const p: Plane = project(a),
        q: Plane = project(b);
      const margin: number = 0.01;
      const interval = (k: 0 | 1): Plane => [
        Math.min(p[k], q[k]) - margin,
        Math.max(p[k], q[k]) + margin,
      ];
      return [{ component, u: interval(0), v: interval(1) }];
    },
  );
  const atlas = Scalar.prepare({
    domain: [
      ...rail.map(({ position }): Plane => project(position)),
      ...drafts.flatMap(({ layers, lines }): Plane[] =>
        lines.flatMap(({ address }): Plane[] =>
          Array.from(
            { length: layers + 1 },
            (_, j): Plane => address(j / layers)[0],
          ),
        ),
      ),
    ],
    pitch,
    boundaries: bounds,
    observe:
      (x: number) =>
      (y: number): Scalar.IObservation | null => {
        const ray: Point = V.unit(direction(x, y))!;
        const hit: Sheet.IHit | null = sheet.unique(origin, ray);
        return hit?.component === owner
          ? { component: owner, value: ray[2] * hit.distance }
          : null;
      },
  });
  const read = (x: number, y: number): IAutoMovieSolidSurface.IJet | null => {
    const sample = atlas.read(x)(y, owner);
    if (sample === null) return null;
    const { jet } = sample;
    const d: Point = direction(x, y);
    const du: Point = [1 / reach, 0, 0],
      dv: Point = [0, 1 / reach, 0];
    const r: number = jet.p[1],
      ru: number = jet.u[1],
      rv: number = jet.v[1];
    return {
      p: V.add(origin, V.scale(d, r)),
      u: V.combine([
        [ru, d],
        [r, du],
      ]),
      v: V.combine([
        [rv, d],
        [r, dv],
      ]),
      uu: V.combine([
        [jet.uu[1], d],
        [2 * ru, du],
      ]),
      uv: V.combine([
        [jet.uv[1], d],
        [rv, du],
        [ru, dv],
      ]),
      vv: V.combine([
        [jet.vv[1], d],
        [2 * rv, dv],
      ]),
    };
  };
  const heldOut = rail.flatMap(({ position }) => {
    const [u, v] = project(position);
    const jet: IAutoMovieSolidSurface.IJet | null = read(u, v);
    if (jet === null) return [];
    const ray: Point = V.unit(V.sub(position, origin))!;
    const hit: Sheet.IHit | null = sheet.unique(origin, ray);
    const normal: Point | null = V.unit(V.cross(jet.u, jet.v));
    if (hit === null || normal === null) return [];
    return [
      {
        position,
        millimetres: V.norm(V.sub(jet.p, position)),
        radians: Math.atan2(
          V.norm(V.cross(normal, hit.normal)),
          V.dot(normal, hit.normal),
        ),
        jacobian: V.dot(normal, ray),
      },
    ];
  });
  return {
    pitch,
    reach,
    tiles: atlas.tiles,
    boundaryRefusals: atlas.boundaryRefusals,
    interpolationRefusals: atlas.interpolationRefusals,
    heldOut,
    maximumMm: Math.max(
      ...heldOut.map(({ millimetres }): number => millimetres),
    ),
    maximumNormal: Math.max(...heldOut.map(({ radians }): number => radians)),
    minimumJacobian: Math.min(
      ...heldOut.map(({ jacobian }): number => jacobian),
    ),
    continuations: drafts.map(({ layers, anchor, ...draft }) => ({
      anchor,
      ...Rail.study({
        ...draft,
        layers: layers * subdivisions,
        read,
        reference,
        observe: (x, y): { position: Point; normal: Point } | null => {
          const ray: Point = V.unit(direction(x, y))!;
          const hit: Sheet.IHit | null = sheet.unique(origin, ray);
          return hit?.component !== owner
            ? null
            : {
                position: V.add(origin, V.scale(ray, hit.distance)),
                normal: hit.normal,
              };
        },
      }),
    })),
  };
}

/** Compare fixed anatomical gauges on the same evaluated public subject. */
async function main(): Promise<void> {
  const started: number = performance.now();
  const arg = (name: string): string | undefined =>
    process.argv
      .find((x): boolean => x.startsWith(`--${name}=`))
      ?.slice(name.length + 3);
  const receiptPath: string | undefined = arg("receipt");
  const out: string | undefined = arg("out");
  if (receiptPath === undefined || out === undefined)
    throw new Error(
      "Use --receipt=<accepted parent receipt> --out=<torso carrier diagnostic>",
    );
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as IReceipt;
  const asset = await Mpfb.load(arg("mesh"));
  if (receipt.source.sha256 !== asset.source.sha256)
    throw new Error(
      "The supplied parent receipt references a different public asset",
    );
  const fine = Subdivision.sample(asset.body, receipt.subdivision.depth);
  const subdivisions: number = Number(arg("tessellation") ?? 1);
  if (!Number.isInteger(subdivisions) || subdivisions < 1)
    throw new Error(
      "The comparison needs a positive integer tessellation multiplier",
    );
  const cells: string | undefined = arg("anchor-cells");
  const anchor: number | undefined =
    cells === undefined ? undefined : Number(cells);
  if (anchor !== undefined && !(anchor > 0 && Number.isFinite(anchor)))
    throw new Error(
      "The explicitly measured rail correction needs positive cells",
    );
  const proof = FamilyConicMpfbTorsoCarrier.probe(
    receipt,
    { ...asset, body: fine.body },
    fine,
    subdivisions,
    anchor,
    process.argv.includes("--control"),
  );
  const surface: string | undefined = arg("surface");
  const visual: string | undefined = arg("comparison");
  let welded:
    | Omit<ReturnType<typeof Rail.weld>, "mesh" | "outerRim">
    | undefined;
  let contextualized:
    | Omit<ReturnType<typeof Rail.comparison>, "mesh">
    | { diagnostic: string }
    | undefined;
  if (surface !== undefined) {
    const trial = proof.studies
      .flatMap(({ continuations }) => continuations)
      .filter(
        ({ complete, crossings, minimumProgress }): boolean =>
          complete && crossings === 0 && minimumProgress > 0,
      )
      .sort((a, b): number => b.length - a.length)[0];
    const target = process.argv.includes("--control")
      ? trial?.control
      : trial?.mesh;
    if (target !== undefined && trial !== undefined) {
      let candidate: IReceipt["candidate"] = {
        ...receipt.candidate,
        mesh: target,
      };
      if (process.argv.includes("--sew")) {
        if (receipt.context !== undefined)
          throw new Error(
            "Use an open analytic parent receipt when sewing the independent torso continuation",
          );
        const { columns, rows } = receipt.tessellation;
        const baseRim: number[] = Array.from(
          { length: columns },
          (_, i): number => i * (rows + 1) + rows,
        );
        const whole = Rail.weld({
          base: receipt.candidate.mesh,
          extension: target,
          baseRim,
          layers: trial.layers,
        });
        const { mesh, outerRim: _, ...proof } = whole;
        candidate = { ...candidate, mesh };
        welded = proof;
        if (visual !== undefined && proof.crossings === 0)
          try {
            const { mesh, ...proof } = Rail.comparison(
              { ...asset, body: fine.body },
              whole,
            );
            contextualized = proof;
            await writeFile(
              visual,
              JSON.stringify({
                source: asset.source,
                candidate: { ...candidate, mesh },
              }) + "\n",
            );
          } catch (error) {
            contextualized = {
              diagnostic:
                error instanceof Error ? error.message : String(error),
            };
          }
      }
      await writeFile(
        surface,
        JSON.stringify({ source: asset.source, candidate }) + "\n",
      );
    }
  }
  await writeFile(
    out,
    JSON.stringify(
      {
        source: asset.source,
        ...proof,
        studies: proof.studies.map(({ continuations, ...study }) => ({
          ...study,
          continuations: continuations.map(
            ({ mesh: _, control: __, ...trial }) => trial,
          ),
        })),
        welded,
        contextualized,
        elapsedMs: performance.now() - started,
      },
      null,
      2,
    ) + "\n",
  );
}

if (
  require.main === module &&
  /^FamilyConicMpfbTorsoCarrier\.[cm]?[jt]s$/u.test(
    basename(process.argv[1] ?? ""),
  )
)
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
