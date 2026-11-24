import {
  AutoMovieSolidVector as V,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

import { FamilyConicMpfbParentFit as Fit } from "./FamilyConicMpfbParentFit";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { FamilyConicMpfbSubdivision as Subdivision } from "./FamilyConicMpfbSubdivision";
import { FamilyConicMpfbUpperTop as Top } from "./FamilyConicMpfbUpperTop";

/** Observations on the independently generated parent continuation. */
interface IReceipt extends Fit.IInput {
  source: Mpfb.ISource["source"];
  subdivision: { depth: number };
  guide: { geometry: { foldDepth: number } };
  context: { owners: { analyticTriangles: number } };
  candidate: {
    mesh: { positions: number[]; indices: number[] };
    guide: { points: Point[] };
  };
}

/**
 * Resample both fitted projections on their identified public context. The
 * accepted analytic shoulder and one incident ring of public faces are fixed.
 */
function atlasPreview(
  body: IReceipt["candidate"]["mesh"],
  analyticTriangles: number,
  radial: (p: Point) => Fit.IChartPoint | null,
  top: (p: Point) => Fit.IChartPoint | null,
) {
  const { indices } = body;
  const positions: number[] = [...body.positions];
  const point = (i: number): Point => [
    body.positions[3 * i]!,
    body.positions[3 * i + 1]!,
    body.positions[3 * i + 2]!,
  ];
  const authored = new Uint8Array(positions.length / 3);
  const boundary: number = 3 * analyticTriangles;
  for (let i: number = 0; i < boundary; ++i) authored[indices[i]!] = 1;
  const protectedVertices = authored.slice();
  for (let i: number = boundary; i < indices.length; i += 3) {
    const face: number[] = indices.slice(i, i + 3);
    if (face.some((id): boolean => authored[id] === 1))
      for (const id of face) protectedVertices[id] = 1;
  }
  const altered = new Uint8Array(protectedVertices.length);
  let changed: number = 0;
  let overlap: number = 0;
  let maximumShift: number = 0;
  for (let i: number = 0; i < protectedVertices.length; ++i) {
    if (protectedVertices[i]) continue;
    const p: Point = point(i);
    const samples: Fit.IChartPoint[] = [radial(p), top(p)].filter(
      (sample): sample is Fit.IChartPoint =>
        sample !== null && sample.support > 0,
    );
    if (samples.length === 0) continue;
    const weights: number[] = samples.map(
      ({ conditioning, support }): number => conditioning * support,
    );
    const sum: number = weights.reduce((a, b): number => a + b, 0);
    const coverage: number =
      1 - samples.reduce((a, { support }): number => a * (1 - support), 1);
    const offset: Point = V.combine(
      samples.map(({ position }, j) => [
        (coverage * weights[j]!) / sum,
        V.sub(position, p),
      ]),
    );
    const lifted: Point = V.add(p, offset);
    if (V.dot(offset, offset) === 0) continue;
    positions[3 * i] = lifted[0];
    positions[3 * i + 1] = lifted[1];
    positions[3 * i + 2] = lifted[2];
    altered[i] = 1;
    ++changed;
    if (samples.length === 2) ++overlap;
    maximumShift = Math.max(maximumShift, V.norm(offset));
  }
  const changedFaces: number[] = [];
  let turnedFaces: number = 0;
  const corner = (id: number): Point => [
    positions[3 * id]!,
    positions[3 * id + 1]!,
    positions[3 * id + 2]!,
  ];
  for (let i: number = 0; i < indices.length; i += 3)
    if (
      altered[indices[i]!] ||
      altered[indices[i + 1]!] ||
      altered[indices[i + 2]!]
    ) {
      const [a, b, c]: number[] = indices.slice(i, i + 3);
      const from: Point = point(a!),
        to: Point = corner(a!);
      const before: Point = V.cross(
        V.sub(point(b!), from),
        V.sub(point(c!), from),
      );
      const after: Point = V.cross(
        V.sub(corner(b!), to),
        V.sub(corner(c!), to),
      );
      if (V.dot(before, after) <= 0) ++turnedFaces;
      changedFaces.push(a!, b!, c!);
    }
  const all: IAutoMovieMesh = {
    positions: positions.map((mm): number => mm / 1_000),
    indices,
    normals: null,
    skin: null,
    uvs: null,
  };
  const crossingWitnesses: number = measureAutoMovieMeshCrossings(
    { ...all, indices: changedFaces },
    all,
    { allPairs: true },
  ).length;
  return {
    positions,
    indices,
    changed,
    overlap,
    maximumShift,
    turnedFaces,
    crossingWitnesses,
  };
}

/** Fit the same top chart at independent whole-cell and half-cell pitches. */
async function main(): Promise<void> {
  const started: number = performance.now();
  const arg = (name: string): string | undefined =>
    process.argv
      .find((x): boolean => x.startsWith(`--${name}=`))
      ?.slice(name.length + 3);
  const receiptPath: string | undefined = arg("receipt");
  const output: string | undefined = arg("out");
  if (receiptPath === undefined || output === undefined)
    throw new Error(
      "Use --receipt=<local shoulder receipt> --out=<diagnostic json>",
    );
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as IReceipt;
  const asset = await Mpfb.load(arg("mesh"));
  if (receipt.source.sha256 !== asset.source.sha256)
    throw new Error("The supplied shoulder proof references a different asset");
  const source: Subdivision.ISample = Subdivision.sample(
    asset.body,
    receipt.subdivision.depth,
  );
  const ray = Fit.vertical(source);
  const supported = receipt.stockRail.rows.filter(
    ({ measured }): boolean => (measured?.radii?.length ?? 0) > 1,
  );
  const points: Point[] = supported.map(({ position }): Point => position);
  const foldDepth: number = receipt.guide.geometry.foldDepth;
  const top = Fit.topStudy(source, points, foldDepth / 4);
  const rail = top.rail;
  const fits = [4, 8].map((cells) => {
    // ESTIMATE: four physical cells across the measured fold resolve the
    // section scale. The half-pitch control checks the coarser result.
    const pitch: number = foldDepth / cells;
    const fit = Top.fit(rail, top.height, pitch);
    return { pitch, fit };
  });
  const studies = fits.map(({ pitch, fit }) => {
    return {
      pitch,
      xs: fit.xs,
      zs: fit.zs,
      maximumMm: Math.max(
        ...fit.validation.map((row): number => row.millimetres),
      ),
      maximumNormal: Math.max(
        ...fit.validation.map((row): number => row.radians!),
      ),
      minimumUp: Math.min(...fit.validation.map((row): number => row.normalUp)),
      validation: fit.validation,
    };
  });
  const radial = process.argv.includes("--radial")
    ? [8, 16].map((cells) =>
        Fit.radialStudy(
          receipt,
          { ...asset, body: source.body },
          source,
          foldDepth / cells,
        ),
      )
    : [];
  const arc: Fit.IRailRow[] = Fit.topArc(receipt, ray);
  const extended = Fit.topStudy(
    source,
    arc.map(({ position }): Point => position),
    foldDepth / 4,
  );
  const upper = [8, 16].map((cells) =>
    Fit.tiledTop(extended, foldDepth / cells),
  );
  const coverage = radial.map((study, i) => {
    const topPoints = new Set(
      upper[i]!.validation.map(({ point }): Point => point),
    );
    const radialPoints = new Set(study.covered);
    return {
      pitch: study.pitch,
      overlap: study.covered.filter((point): boolean => topPoints.has(point))
        .length,
      unsupported: receipt.stockRail.rows.filter(
        ({ position }): boolean =>
          !topPoints.has(position) && !radialPoints.has(position),
      ),
    };
  });
  const preferred =
    radial.length === 0
      ? undefined
      : (() => {
          const flank = radial[0]!;
          const cap = upper[1]!;
          const overlap = receipt.stockRail.rows.flatMap(({ position }) => {
            const from: Fit.IChartPoint | null = flank.at(position);
            const to: Fit.IChartPoint | null = cap.at(position);
            return from === null || to === null
              ? []
              : [
                  {
                    millimetres: V.norm(V.sub(from.position, to.position)),
                    radians: Fit.angle(from.normal, to.normal),
                  },
                ];
          });
          const covered = new Set([
            ...flank.covered,
            ...cap.validation.map(({ point }): Point => point),
          ]);
          return {
            heldOut: covered.size,
            overlap: overlap.length,
            maximumMm: Math.max(
              ...overlap.map(({ millimetres }): number => millimetres),
            ),
            maximumNormal: Math.max(
              ...overlap.map(({ radians }): number => radians),
            ),
          };
        })();
  const preview: string | undefined = arg("preview");
  let reconstruction:
    | Omit<ReturnType<typeof atlasPreview>, "positions" | "indices">
    | undefined;
  if (preview !== undefined) {
    if (radial.length === 0) throw new Error("--preview requires --radial");
    const { positions, indices, ...observed } = atlasPreview(
      receipt.candidate.mesh,
      receipt.context.owners.analyticTriangles,
      radial[0]!.at,
      upper[1]!.at,
    );
    reconstruction = observed;
    await writeFile(
      preview,
      JSON.stringify({
        source: receipt.source,
        candidate: { ...receipt.candidate, mesh: { positions, indices } },
      }) + "\n",
    );
  }
  await writeFile(
    output,
    JSON.stringify(
      {
        source: asset.source,
        subdivision: receipt.subdivision.depth,
        heldOut: rail.length,
        upperComponents: top.cap.components,
        upperTriangles: top.cap.triangles,
        studies,
        radial,
        upper,
        coverage,
        preferred,
        reconstruction,
        elapsedMs: performance.now() - started,
      },
      null,
      2,
    ) + "\n",
  );
}

if (
  require.main === module &&
  /^FamilyConicMpfbParentAtlas\.[cm]?[jt]s$/u.test(
    basename(process.argv[1] ?? ""),
  )
)
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
