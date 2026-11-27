import {
  AutoMovieConstructionAdmission,
  AutoMovieConstructionSplitBand,
  AutoMovieConstructionSplitSeam,
  AutoMovieConstructionViews,
  AutoMovieSolidChain,
  AutoMovieSolidVector as V,
  AutoMovieViewLoft,
} from "@automovie/engine";
import {
  AutoMovieHumanF1 as H,
  AutoMovieHumanF1Placing as T,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieHumanF1,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Five explicitly supplied hip-support perturbations, not population percentiles.
 * This preflight reads actual full source factories (including reliefs), their
 * world jets and the actual shared crotch seam/SplitBand operators. It never
 * draws a whole skin or accepts anatomy from a finite grid. Other sources are
 * reused only after their parameters and complete sampled jets show the exact
 * predicted rigid translation/identity. Run an esbuild CJS bundle from test
 * with --out=<absolute directory under packages/human/.shots>.
 */
namespace FamilyConicHipSupport {
  /** One actual source material address. */
  interface Reading {
    station: number;
    phase: number;
    jet: IAutoMovieSolidSurface.IJet | { unavailable: string };
  }
  /** One retained original raw source and its full relieved surface reader. */
  interface Source {
    chain: IAutoMovieLoftChain;
    surface: IAutoMovieSolidSurface;
    readings: Reading[];
    parameterHash: string;
  }
  /** Baseline source data and independent accepted-constructor AST. */
  interface Baseline {
    sources: Map<string, Source>;
    assembly: IAutoMovieHumanF1.IAssembly;
    original: {
      root: IAutoMovieConstructionNode;
      fills: IAutoMovieHumanF1.IConstruction["fills"];
    };
  }

  const CASES: readonly number[] = [193.28, 183.28, 203.28, 173.28, 213.28];
  const ORDERS: readonly (keyof IAutoMovieSolidSurface.IJet)[] = [
    "p",
    "u",
    "v",
    "uu",
    "uv",
    "vv",
  ];

  /** Exact data fingerprint; callable axis ownership is read separately. */
  function hash(value: unknown): string {
    return createHash("sha256").update(JSON.stringify(value)).digest("hex");
  }
  /** Every original non-axis parameter, including actual caps, grids and reliefs. */
  function parameters(part: IAutoMovieViewPart): unknown {
    return {
      name: part.name,
      stations: part.stations,
      front: part.front,
      side: part.side,
      fullness: part.fullness,
      pole: part.pole ?? "open",
      order: part.order,
      samples: part.samples,
      reliefs: part.reliefs ?? [],
    };
  }
  /** Preserve genuine unavailable source2, never invent derivatives. */
  function jet(
    surface: IAutoMovieSolidSurface,
    station: number,
    phase: number,
  ): Reading["jet"] {
    try {
      const value: IAutoMovieSolidSurface.IJet = surface.jet(station, phase);
      if (
        !ORDERS.every((order: keyof IAutoMovieSolidSurface.IJet): boolean =>
          value[order].every(Number.isFinite),
        )
      )
        return { unavailable: "Actual full-source jet is nonfinite" };
      return value;
    } catch (error: unknown) {
      return {
        unavailable: error instanceof Error ? error.message : String(error),
      };
    }
  }
  /** Expected movement from the actual course datum bindings and chain ancestry. */
  function translation(name: string, delta: number): number | null {
    const canonical: string = name.replace(/\.mirror$/, "");
    const course: string[] | undefined = T.COURSES[canonical];
    if (course === undefined) return null;
    const descends = (frame: string): boolean => {
      let current: string | null = frame;
      while (current !== null) {
        if (current === "femur") return true;
        const entry: IAutoMovieHumanSegmentJoint | undefined = T.CHAIN.find(
          (joint: IAutoMovieHumanSegmentJoint): boolean => joint.name === current,
        );
        if (entry === undefined)
          throw new Error("Missing declared course frame " + current);
        current = entry.parent;
      }
      return false;
    };
    const carried: boolean[] = course.map((datum: string): boolean =>
      descends(T.POINTS[datum]!.frame),
    );
    if (carried.every((yes: boolean): boolean => !yes)) return 0;
    return carried.every((yes: boolean): boolean => yes)
      ? delta * (name.endsWith(".mirror") ? -1 : 1)
      : null;
  }
  /** Find an actual declaration without fabricating a smaller construction. */
  function crotch(
    node: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionSplit | undefined {
    if (node.type === "split" && node.name === "crotch") return node;
    if ("host" in node) return crotch(node.host);
    return undefined;
  }
  /** Full-source two-band preflight through the existing generating operators. */
  function bands(
    split: IAutoMovieConstructionSplit,
    sources: Map<string, Source>,
  ): unknown {
    const host: Source | undefined = sources.get(split.hostFace);
    if (host === undefined)
      return { unavailable: "Full host source2 unavailable" };
    const hostInto: 1 | -1 = split.hostEnd === "bottom" ? -1 : 1;
    const layer: IAutoMovieLoftChain.ILayer =
      host.chain.layers[
        split.hostEnd === "bottom" ? 0 : host.chain.layers.length - 1
      ]!;
    if (layer.frame === undefined)
      return { unavailable: "Actual host end frame absent" };
    const normal: AutoMovieVector3Tuple | null = V.unit(
      V.scale(V.cross(layer.frame.v, layer.frame.u), hostInto),
    );
    if (normal === null)
      return { unavailable: "Actual host end plane degenerate" };
    const scale: number = AutoMovieConstructionViews.SCALE;
    const curve: IAutoMovieConstructionSplitSeam.ISeam | string | undefined =
      split.profile === undefined
        ? undefined
        : AutoMovieConstructionSplitSeam.create({
            host: host.surface,
            station: layer.y,
            into: hostInto,
            seam: split.seam,
            normal,
            knots: split.profile.knots.map(({ alongM, depthM }) => ({
              alongMm: alongM * scale,
              depthMm: depthM * scale,
            })),
            ...(split.profile.heading === undefined
              ? {}
              : { heading: split.profile.heading }),
          });
    if (typeof curve === "string")
      return { unavailable: "Actual seam: " + curve };
    return {
      host: {
        name: split.hostFace,
        station: layer.y,
        domain: host.surface.domain,
        pole: host.chain.pole ?? null,
        frame: layer.frame,
        normal,
      },
      profile: split.profile ?? null,
      children: split.children.map(
        (child: IAutoMovieConstructionSplit.IChild, index: number): unknown => {
          const source: Source | undefined = sources.get(child.partFace);
          if (source === undefined)
            return {
              name: child.partFace,
              unavailable: "Full child source2 unavailable",
            };
          const into: 1 | -1 = child.partEnd === "bottom" ? 1 : -1;
          const end: number =
            source.chain.layers[
              child.partEnd === "bottom" ? 0 : source.chain.layers.length - 1
            ]!.y;
          const rail: number = end + into * child.rail * scale;
          const domain: readonly [number, number] = source.surface.domain ?? [
            source.chain.layers[0]!.y,
            source.chain.layers.at(-1)!.y,
          ];
          if (!(rail > domain[0] && rail < domain[1]))
            return {
              name: child.partFace,
              rail,
              domain,
              unavailable: "Actual child rail leaves its open owned domain",
            };
          const band: IAutoMovieConstructionSplitBand.IBand | string =
            AutoMovieConstructionSplitBand.create({
              name: child.band,
              host: { surface: host.surface, station: layer.y, into: hostInto },
              arc:
                index === 0
                  ? [split.seam.startPhaseRad, split.seam.endPhaseRad]
                  : [split.seam.endPhaseRad, split.seam.startPhaseRad + 2 * Math.PI],
              normal,
              child: { surface: source.surface, station: rail, into },
              count: split.count,
              ...(child.crease === undefined ? {} : { crease: child.crease }),
              ...(child.correspondence === undefined
                ? {}
                : { correspondence: child.correspondence }),
              ...(curve === undefined || split.profile === undefined
                ? {}
                : { seam: { curve, corner: split.profile.corner } }),
            });
          if (typeof band === "string")
            return {
              name: child.partFace,
              rail,
              domain,
              unavailable: "Actual SplitBand: " + band,
            };
          return {
            name: child.partFace,
            rail,
            domain,
            scale: band.scale,
            length: band.length,
            publishedColumns: band.loop.length,
            sourceColumns:
              band.scale.columns.length + band.scale.backward.length,
            loop: band.loop,
            childPhases: band.childPhases,
            hostArcJets: band.hostPhases.map((phase: number): Reading["jet"] =>
              jet(host.surface, layer.y, phase),
            ),
            railJets: band.childPhases.map((phase: number): Reading["jet"] =>
              jet(source.surface, rail, phase),
            ),
            boundaryJets: band.loop.map(
              (_: AutoMovieVector3Tuple, column: number): unknown => ({
                clock: (2 * Math.PI * column) / band.loop.length,
                host: jet(
                  band.surface,
                  0,
                  (2 * Math.PI * column) / band.loop.length,
                ),
                child: jet(
                  band.surface,
                  band.length,
                  (2 * Math.PI * column) / band.loop.length,
                ),
              }),
            ),
          };
        },
      ),
    };
  }
  /** Gather all failures for one case, then continue the remaining four cases. */
  function inspect(
    breadth: number,
    baseline: Baseline,
  ): { report: unknown; sources: Map<string, Source>; assembly: IAutoMovieHumanF1.IAssembly } {
    const assembly: IAutoMovieHumanF1.IAssembly = H.assembleBody({
      hipJointCentreBreadth: breadth,
    });
    const declared: IAutoMovieHumanF1.IConstruction = H.constructionFrom(assembly);
    const failures: { owner: string; detail: string }[] = [];
    try {
      AutoMovieConstructionAdmission.admit(declared.root);
    } catch (error: unknown) {
      failures.push({
        owner: "tree admission",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    const sources: Map<string, Source> = new Map();
    const rows: unknown[] = [];
    for (const [name, part] of declared.sources) {
      try {
        const raw: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
        if (raw.chain === null) {
          failures.push({
            owner: name,
            detail: JSON.stringify(raw.diagnostics),
          });
          continue;
        }
        const chain: IAutoMovieLoftChain = AutoMovieSolidChain.framed(
          raw.chain,
        );
        const surface: IAutoMovieSolidSurface | null =
          AutoMovieSolidChain.surface(chain);
        if (surface === null) {
          failures.push({
            owner: name,
            detail: "Actual full-source2 surface unavailable",
          });
          continue;
        }
        const previous: Source | undefined = baseline.sources.get(name);
        const addresses: { station: number; phase: number }[] =
          previous?.readings ??
          [0.25, 0.5, 0.75].flatMap(
            (share: number): { station: number; phase: number }[] =>
              [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(
                (phase: number): { station: number; phase: number } => ({
                  station:
                    chain.layers[0]!.y +
                    (chain.layers.at(-1)!.y - chain.layers[0]!.y) * share,
                  phase,
                }),
              ),
          );
        const readings: Reading[] = addresses.map(
          ({ station, phase }): Reading => ({
            station,
            phase,
            jet: jet(surface, station, phase),
          }),
        );
        const parameterHash: string = hash(parameters(part));
        sources.set(name, { chain, surface, readings, parameterHash });
        const dz: number | null = translation(name, (breadth - CASES[0]!) / 2);
        const residuals: unknown[] = readings.map(
          (reading: Reading, index: number): unknown => {
            const old: Reading | undefined = previous?.readings[index];
            if (old === undefined) return { address: index, baseline: true };
            if (
              "unavailable" in reading.jet ||
              "unavailable" in old.jet ||
              dz === null
            )
              return {
                address: index,
                unavailable:
                  "Unqualified actual jet or mixed source dependency",
                actual: reading.jet,
                expectedOwner: old.jet,
              };
            const now: IAutoMovieSolidSurface.IJet = reading.jet;
            const before: IAutoMovieSolidSurface.IJet = old.jet;
            return {
              address: index,
              signed: Object.fromEntries(
                ORDERS.map(
                  (
                    order: keyof IAutoMovieSolidSurface.IJet,
                  ): [string, number[]] => [
                    order,
                    now[order].map(
                      (value: number, k: number): number =>
                        value -
                        before[order][k]! -
                        (order === "p" && k === 2 ? dz : 0),
                    ),
                  ],
                ),
              ),
            };
          },
        );
        rows.push({
          name,
          domain: surface.domain,
          sourceDiagnostics: raw.diagnostics,
          reliefs: part.reliefs?.length ?? 0,
          parameters: parameterHash,
          parametersIdentical:
            previous === undefined
              ? null
              : parameterHash === previous.parameterHash,
          expectedTranslationZ: dz,
          readings,
          residuals,
        });
      } catch (error: unknown) {
        failures.push({
          owner: name,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const split: IAutoMovieConstructionSplit | undefined = crotch(
      declared.root,
    );
    let crotchReport: unknown;
    try {
      crotchReport =
        split === undefined
          ? { unavailable: "Actual crotch declaration absent" }
          : bands(split, sources);
    } catch (error: unknown) {
      crotchReport = {
        unavailable: error instanceof Error ? error.message : String(error),
      };
    }
    const frames: unknown[] = [...assembly.frames].map(
      ([name, frame]): unknown => {
        const old: IAutoMovieHumanSegmentFrame | undefined = baseline.assembly.frames.get(name);
        return {
          name,
          origin: frame.origin,
          axes: frame.axes,
          deltaFromBaseline:
            old === undefined ? null : F.sub(frame.origin, old.origin),
          rotationIdentical:
            old === undefined ? null : hash(frame.axes) === hash(old.axes),
        };
      },
    );
    return {
      assembly,
      sources,
      report: {
        breadth,
        qualification:
          "supplied parameter;193.28 baseline is synthetic rig-support calibration P; perturbations are not percentiles",
        failures,
        oldConstructorAstIdentical:
          breadth === CASES[0]
            ? hash({ root: declared.root, fills: declared.fills }) ===
              hash(baseline.original)
            : null,
        rootAndFills: { root: declared.root, fills: declared.fills },
        frames,
        sources: rows,
        crotch: crotchReport,
        limits: [
          "finite original-source samples do not certify whole-domain source health",
          "no full skin/trim/topology realization or anatomy acceptance",
          "unchanged ports require identical source parameters and zero full-jet residual; moved leg/toe sources require the declared rigid-translation residual",
          "backward columns are recorded independently of diagnostics",
        ],
      },
    };
  }
  /** Run one complete five-case source/column inspection round without final skin. */
  export async function main(): Promise<void> {
    const output: string | undefined = process.argv
      .find((argument: string): boolean => argument.startsWith("--out="))
      ?.slice(6);
    if (output === undefined || !path.isAbsolute(output))
      throw new Error("--out needs an absolute directory");
    const root: string = path.resolve(
      process.cwd(),
      process.cwd().endsWith("test") ? ".." : ".",
    );
    if (
      !path
        .resolve(output)
        .startsWith(path.join(root, "packages/human/.shots") + path.sep)
    )
      throw new Error("Output must be under packages/human/.shots");
    const receipt: { payload: string } = JSON.parse(
      await fs.readFile(
        path.join(root, "packages/human/.shots/ownership-20261116/before.json"),
        "utf8",
      ),
    ) as { payload: string };
    const original: Baseline["original"] = JSON.parse(
      receipt.payload,
    ) as Baseline["original"];
    let baseline: Baseline = {
      sources: new Map(),
      assembly: H.assemble(),
      original: { root: original.root, fills: original.fills },
    };
    await fs.mkdir(output, { recursive: true });
    for (const breadth of CASES) {
      const result: ReturnType<typeof inspect> = inspect(breadth, baseline);
      const file: string = path.join(output, "case-" + breadth + ".json");
      await fs.writeFile(file, JSON.stringify(result.report), { flag: "wx" });
      if (breadth === CASES[0])
        baseline = {
          sources: result.sources,
          assembly: result.assembly,
          original: baseline.original,
        };
      process.stdout.write(
        JSON.stringify({ breadth, file, sources: result.sources.size }) + "\n",
      );
    }
  }
}

void FamilyConicHipSupport.main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
