import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import {
  AutoMovieNaturalSpline,
  AutoMovieSolidChain,
  AutoMovieSolidVector as V,
  AutoMovieViewLoft,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanHipSupportPlacement,
} from "@automovie/human";
import {
  AutoMovieHumanF1 as Figure,
  AutoMovieHumanF1NativeLaw as Law,
  AutoMovieHumanF1Placing as Placing,
} from "@automovie/human/capture";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieLoftSectionFrame,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Read actual root-frame/parent-chart coordinates beside the completed inputs.
 * Bundle with esbuild and pass absolute --roots=<root-inputs.json>, --out.
 * No root law is changed; a tangent projection is only a local linearization.
 */
namespace FamilyConicNativeRootFrames {
  /** A saved actual root column, not a recreated band. */
  interface Column {
    column: number;
    host: { chart?: [number, number]; full2?: IAutoMovieSolidSurface.IJet };
    child: {
      station: number;
      phase: number;
      full2: IAutoMovieSolidSurface.IJet;
    };
  }

  /** Narrow saved case values used without replaying its operators. */
  interface Case {
    id: string;
    fields: IAutoMovieHumanF1NativeLaw.IFields;
    fieldsHash: string;
    operators: {
      rows: {
        owner: string;
        kind: string;
        columns?: Column[];
        controls?: number[];
        bounds?: [number, number];
      }[];
    };
    actualBands: {
      owner: string;
      event: {
        kind: string;
        childPhases?: number[];
        columns?: { start: { point: AutoMovieVector3Tuple } }[];
      };
    }[];
  }

  /** Finite sample centroid, never an anatomical or supplied datum. */
  function centroid(points: readonly AutoMovieVector3Tuple[]): AutoMovieVector3Tuple {
    return V.scale(
      points.reduce(
        (sum: AutoMovieVector3Tuple, point: AutoMovieVector3Tuple): AutoMovieVector3Tuple => V.add(sum, point),
        [0, 0, 0],
      ),
      1 / points.length,
    );
  }

  /** Reconstruct a declared original port chart at the same actual column clock. */
  function chart(
    loop: IAutoMovieConstructionPortLoop,
    k: number,
    count: number,
  ): [number, number] {
    const clock: number = (2 * Math.PI * k) / count,
      q: number = loop.shape?.[k] ?? 1;
    return [
      loop.centre[0] * 1000 + q * loop.semi[0] * 1000 * Math.cos(clock),
      loop.centre[1] + q * (loop.sense ?? 1) * loop.semi[1] * Math.sin(clock),
    ];
  }

  /** The actual analytic source-axis frame2, not a finite difference. */
  function frame(
    axis: IAutoMovieViewAxis.IAxis,
    station: number,
  ): {
    value: IAutoMovieLoftSectionFrame;
    actual2: IAutoMovieViewAxisJet.IJet | { unavailable: string };
  } {
    return {
      value: axis.at(station),
      actual2: axis.jet?.(station) ?? {
        unavailable: "source axis has no actual station2",
      },
    };
  }

  /**
   * Inspect all columns of eight root contrasts using existing geometry owners.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses saved full root/ribbon2 and actual axis frame2; existing solve3 decomposes child axes in the parent station/phase/normal basis. A separately identified trunk source supplies only unpublished failed-port physical2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original bank/calibration and complete bone cache serve eight cases; no operator or inverse is rerun.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No axis swap, rail scaling, new field, fake partial assembly or bare-for-relieved substitution occurs. Whole-loop linearization residuals remain explicit.
   * @evidence contracts/development/common.md#meaningful-documentation Separates world mm, physical station/phase derivatives, unit frame axes and dimensionless-cross ribbon2.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads bounded saved reports and actual frame callbacks; only missing parent trunk source preparation is additional geometry work, not a whole figure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the completed case fields/source hashes, original native bank and existing matrix/source evaluators without another solver or root pipeline.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes immutable per-case tables and retains only original preparation, a small bone cache and current saved case data.
   */
  export async function main(): Promise<void> {
    const option: (name: string) => string | undefined = (
      name: string,
    ): string | undefined =>
      process.argv
        .find((value: string): boolean => value.startsWith(name + "="))
        ?.slice(name.length + 1);
    const input: string | undefined = option("--roots"),
      output: string | undefined = option("--out"),
      root: string = path.resolve(
        process.cwd(),
        process.cwd().endsWith("test") ? ".." : ".",
      );
    if (
      input === undefined ||
      output === undefined ||
      !path.isAbsolute(input) ||
      !path.isAbsolute(output) ||
      !path
        .resolve(output)
        .toLowerCase()
        .startsWith(
          (path.join(root, "packages/human/.shots") + path.sep).toLowerCase(),
        )
    )
      throw new Error("absolute --roots and new human/.shots --out required");
    const bytes: Buffer = await fs.readFile(input);
    const completed: {
      provenance: { diagnostic: { sourceHashes: Record<string, string> } };
    } = JSON.parse(bytes.toString());
    for (const [relative, expected] of Object.entries(
      completed.provenance.diagnostic.sourceHashes,
    ))
      if (
        Identity.byteHash(await fs.readFile(path.join(root, relative))) !==
        expected
      )
        throw new Error("frozen diagnostic generation changed: " + relative);
    await fs.mkdir(output, { recursive: true });
    const started: number = performance.now(),
      original: IAutoMovieHumanF1.IAssembly = Figure.assemble(),
      originals: ReturnType<typeof Figure.constructionFrom>["sources"] =
        Figure.constructionFrom(original).sources,
      prepared: IAutoMovieHumanF1NativeLaw.IPrepared = Law.prepare(original, originals);
    const bones: Map<number, IAutoMovieHumanF1.IAssembly> = new Map([
        [prepared.fields.hipJointCentreBreadth, original],
      ]),
      summary: unknown[] = [];
    const baselineBytes: Buffer = await fs.readFile(
        path.join(path.dirname(input), "f1.json"),
      ),
      baseline: Case = JSON.parse(baselineBytes.toString());
    const cases: readonly string[] = [
      "f1",
      "bust95",
      "allsite5",
      "allsite95",
      "tissue-0.8",
      "tissue-1.2",
      "tagged-fields-minus",
      "tagged-fields-plus",
    ];
    for (const id of cases) {
      const began: number = performance.now(),
        casePath: string = path.join(path.dirname(input), id + ".json"),
        caseBytes: Buffer = await fs.readFile(casePath),
        saved: Case = JSON.parse(caseBytes.toString());
      const rows: unknown[] = [],
        failures: { owner: string; detail: string }[] = [];
      try {
        if (
          saved.id !== id ||
          saved.fieldsHash !== Identity.dataHash(saved.fields)
        )
          throw new Error("case id/fields hash mismatch");
        let bone: IAutoMovieHumanF1.IAssembly | undefined = bones.get(
          saved.fields.hipJointCentreBreadth,
        );
        if (bone === undefined) {
          bone = Figure.assemble(
            undefined,
            AutoMovieHumanHipSupportPlacement(
              saved.fields,
              Placing.CHAIN,
              "femur",
            ),
          );
          bones.set(saved.fields.hipJointCentreBreadth, bone);
        }
        const assembly: IAutoMovieHumanF1.IAssembly =
          id === "f1" ? original : prepared.apply(saved.fields, bone);
        const originalPart: IAutoMovieViewPart | undefined = originals.get(
          original.body.trunk.name,
        );
        if (originalPart === undefined)
          throw new Error("original trunk native source absent");
        const parentPart: ReturnType<typeof H.part> = H.part(
            assembly.body.trunk,
            originalPart.stations,
          ),
          parentRaw: ReturnType<typeof AutoMovieViewLoft.create> =
            AutoMovieViewLoft.create(parentPart);
        if (parentRaw.chain === null)
          throw new Error(JSON.stringify(parentRaw.diagnostics));
        const parent: IAutoMovieSolidSurface | null =
          AutoMovieSolidChain.surface(
            AutoMovieSolidChain.framed(parentRaw.chain),
          );
        if (parent === null)
          throw new Error("full relieved trunk differential unavailable");
        for (const key of ["arm", "nose", "breast"] as const)
          for (const side of key === "nose" ? [0] : [0, 1]) {
            const owner: string = "band." + key + (side === 1 ? ".mirror" : "");
            try {
              const made: IAutoMovieHumanConicLoft.IFamily =
                  side === 0
                    ? assembly.body[key]
                    : H.mirror(
                        assembly.body[key],
                        assembly.body[key].name + ".mirror",
                      ),
                prior: IAutoMovieHumanConicLoft.IFamily =
                  side === 0
                    ? original.body[key]
                    : H.mirror(
                        original.body[key],
                        original.body[key].name + ".mirror",
                      );
              const axis: IAutoMovieViewAxis.IAxis = H.axis(made),
                oldAxis: IAutoMovieViewAxis.IAxis = H.axis(prior);
              const loop: IAutoMovieConstructionPortLoop =
                key === "nose"
                  ? assembly.roots.nose
                  : assembly.roots[key][side]!;
              const oldLoop: IAutoMovieConstructionPortLoop =
                key === "nose"
                  ? original.roots.nose
                  : original.roots[key][side]!;
              const published: Column[] | undefined = saved.operators.rows.find(
                (row): boolean =>
                  row.owner === owner && row.kind === "actual-band",
              )?.columns;
              const oldPublished: Column[] | undefined =
                baseline.operators.rows.find(
                  (row): boolean =>
                    row.owner === owner && row.kind === "actual-band",
                )?.columns;
              const preparedColumns:
                | Case["actualBands"][number]["event"]
                | undefined = saved.actualBands.find(
                (row): boolean =>
                  row.owner === owner && row.event.kind === "prepared",
              )?.event;
              if (
                preparedColumns?.columns === undefined ||
                preparedColumns.childPhases === undefined ||
                oldPublished === undefined
              )
                throw new Error(
                  "saved actual prepared/baseline columns absent",
                );
              const count: number = preparedColumns.columns.length;
              const railRecord: Case["operators"]["rows"][number] | undefined =
                saved.operators.rows.find(
                  (row): boolean =>
                    row.kind === "curved-rail-domain" &&
                    row.owner.includes(key) &&
                    row.owner.endsWith(".mirror") === (side === 1),
                );
              const stations: number[] | undefined = railRecord?.controls;
              if (key !== "breast" && stations === undefined)
                throw new Error("actual curved rail control record absent");
              const along: ((phase: number) => number) | undefined =
                stations === undefined
                  ? undefined
                  : AutoMovieNaturalSpline.periodic(stations);
              const sourceFirst: number = prior.knots[0]!,
                fallbackStation: number =
                  sourceFirst + (key === "arm" ? 10 : key === "nose" ? 1.5 : 1);
              const hostReadings: IAutoMovieSolidSurface.IJet[] = [];
              let clock0: IAutoMovieSolidSurface.IJet | undefined;
              const columns: unknown[] = [];
              for (let k: number = 0; k < count; ++k) {
                try {
                  const address: [number, number] =
                    published?.[k]?.host.chart ?? chart(loop, k, count);
                  const fresh: IAutoMovieSolidSurface.IJet = parent.jet(
                      address[0],
                      address[1],
                    ),
                    stored: IAutoMovieSolidSurface.IJet | undefined =
                      published?.[k]?.host.full2,
                    host: IAutoMovieSolidSurface.IJet = stored ?? fresh;
                  const sourceResiduals: Record<string, number | null> = {};
                  for (const order of [
                    "p",
                    "u",
                    "v",
                    "uu",
                    "uv",
                    "vv",
                  ] as const)
                    sourceResiduals[order] =
                      stored === undefined
                        ? null
                        : V.norm(V.sub(fresh[order], stored[order]));
                  const station: number =
                    published?.[k]?.child.station ??
                    (along === undefined
                      ? fallbackStation
                      : along(preparedColumns.childPhases[k]!));
                  const actual: ReturnType<typeof frame> = frame(axis, station),
                    before: ReturnType<typeof frame> = frame(
                      oldAxis,
                      oldPublished[k]!.child.station,
                    );
                  const normal: AutoMovieVector3Tuple | null = V.unit(V.cross(host.u, host.v));
                  if (normal === null)
                    throw new Error(
                      "actual parent chart is singular at column " + k,
                    );
                  const depth: AutoMovieVector3Tuple | null = V.solve3(
                      host.u,
                      host.v,
                      normal,
                      actual.value.u,
                    ),
                    breadth: AutoMovieVector3Tuple | null = V.solve3(
                      host.u,
                      host.v,
                      normal,
                      actual.value.v,
                    );
                  const oldHost: IAutoMovieSolidSurface.IJet | undefined =
                    oldPublished[k]!.host.full2;
                  const oldNormal: AutoMovieVector3Tuple | null =
                    oldHost === undefined
                      ? null
                      : V.unit(V.cross(oldHost.u, oldHost.v));
                  const oldDepth: AutoMovieVector3Tuple | null =
                      oldHost === undefined || oldNormal === null
                        ? null
                        : V.solve3(
                            oldHost.u,
                            oldHost.v,
                            oldNormal,
                            before.value.u,
                          ),
                    oldBreadth: AutoMovieVector3Tuple | null =
                      oldHost === undefined || oldNormal === null
                        ? null
                        : V.solve3(
                            oldHost.u,
                            oldHost.v,
                            oldNormal,
                            before.value.v,
                          );
                  if (k === 0) clock0 = host;
                  const q0: [number, number] = chart(loop, 0, count),
                    linear: AutoMovieVector3Tuple | null =
                      clock0 === undefined
                        ? null
                        : V.add(
                            clock0.p,
                            V.combine([
                              [address[0] - q0[0], clock0.u],
                              [address[1] - q0[1], clock0.v],
                            ]),
                          );
                  const pointResidual: AutoMovieVector3Tuple = V.sub(
                    host.p,
                    preparedColumns.columns[k]!.start.point,
                  );
                  hostReadings.push(host);
                  columns.push({
                    column: k,
                    parentChart: address,
                    originalParentChart:
                      oldPublished[k]!.host.chart ?? chart(oldLoop, k, count),
                    station,
                    oldStation: oldPublished[k]!.child.station,
                    childPhase: preparedColumns.childPhases[k],
                    frame: actual,
                    originalFrame: before,
                    childDepthAxisInParentChart: depth,
                    childBreadthAxisInParentChart: breadth,
                    originalDepthAxisInParentChart: oldDepth,
                    originalBreadthAxisInParentChart: oldBreadth,
                    parentNormal: normal,
                    parentStationSpeed: V.norm(host.u),
                    parentPhaseSpeed: V.norm(host.v),
                    freshVsStoredPhysical2Norms: sourceResiduals,
                    reconstructedParentPointResidual: pointResidual,
                    reconstructedParentPointResidualMm: V.norm(pointResidual),
                    wholeLoopAtClock0LinearizationResidual:
                      linear === null
                        ? { unavailable: "actual clock0 reading failed" }
                        : V.sub(host.p, linear),
                    wholeLoopAtClock0LinearizationResidualMm:
                      linear === null ? null : V.norm(V.sub(host.p, linear)),
                    source2Address:
                      "saved actual root inputs: " + owner + "/column" + k,
                    parent2Scope:
                      published === undefined
                        ? "additional one-trunk native/full-relief source owner on original grid; saved start-point residual shown; unavailable old partial comparison stays null"
                        : "saved actual full physical source2; separately reevaluated p/u/v/uu/uv/vv residuals shown",
                  });
                } catch (error: unknown) {
                  const detail: string =
                    error instanceof Error ? error.message : String(error);
                  failures.push({ owner: owner + "/column" + k, detail });
                  columns.push({ column: k, unavailable: detail });
                }
              }
              const parentCentre: AutoMovieVector3Tuple | null =
                hostReadings.length === 0
                  ? null
                  : centroid(
                      hostReadings.map(
                        (jet: IAutoMovieSolidSurface.IJet): AutoMovieVector3Tuple => jet.p,
                      ),
                    );
              const named: ReturnType<typeof frame> = frame(
                  axis,
                  fallbackStation,
                ),
                zero: ReturnType<typeof frame> = frame(axis, 0);
              rows.push({
                owner,
                key,
                side,
                source: made.name,
                fields: saved.fields.roots[key],
                loop,
                originalLoop: oldLoop,
                storedRailControls: stations ?? null,
                storedRailBounds: railRecord?.bounds ?? null,
                finiteLoopCentroid: parentCentre,
                axis0: zero,
                namedMaterialSite: fallbackStation,
                namedFrame: named,
                namedAxisToFiniteLoopCentroid:
                  parentCentre === null
                    ? null
                    : V.sub(named.value.origin, parentCentre),
                axis0ToFiniteLoopCentroid:
                  parentCentre === null
                    ? null
                    : V.sub(zero.value.origin, parentCentre),
                columns,
                limits: [
                  "centroid is an observation, never a supplied skin-root datum",
                  "basis coefficients are a local chart decomposition, not exact whole-boundary transport",
                  "saved full physical source2 and normalized-cross ribbon2 retain distinct derivative units",
                ],
              });
            } catch (error: unknown) {
              failures.push({
                owner,
                detail: error instanceof Error ? error.message : String(error),
              });
            }
          }
        const receipt: Record<string, unknown> = {
          id,
          fields: saved.fields,
          fieldsHash: saved.fieldsHash,
          sourceHashes: completed.provenance.diagnostic.sourceHashes,
          originalInputs: {
            file: casePath,
            byteHash: Identity.byteHash(caseBytes),
          },
          baseline: {
            file: path.join(path.dirname(input), "f1.json"),
            byteHash: Identity.byteHash(baselineBytes),
          },
          rows,
          failures,
          extraParentSourcePrepared: parent !== null,
          parentSource: {
            name: assembly.body.trunk.name,
            grid: "immutable original constructor grid",
            stations: [parentPart.stations[0], parentPart.stations.at(-1)],
            samples: parentPart.samples,
            pole: parentPart.pole ?? null,
            diagnostics: parentRaw.diagnostics,
          },
          physical2ResidualUnits: {
            p: "mm",
            u: "mm/mm",
            v: "mm/rad",
            uu: "mm/mm^2",
            uv: "mm/(mm*rad)",
            vv: "mm/rad^2",
          },
          milliseconds: performance.now() - began,
          units:
            "parent chart coefficients: station mm/world mm, phase rad/world mm, normal unit/unit; axis first/second differentiate material station mm; cross ribbons remain normalized and are not axis derivatives",
        };
        await fs.writeFile(
          path.join(output, id + ".json"),
          JSON.stringify(receipt),
          { flag: "wx" },
        );
        summary.push({
          id,
          roots: rows.length,
          failures,
          extraParentSourcePrepared: parent !== null,
          milliseconds: receipt.milliseconds,
        });
      } catch (error: unknown) {
        summary.push({
          id,
          unavailable: error instanceof Error ? error.message : String(error),
        });
      }
      process.stdout.write(JSON.stringify(summary.at(-1)) + "\n");
    }
    await fs.writeFile(
      path.join(output, "root-frames.json"),
      JSON.stringify({
        input: { file: input, byteHash: Identity.byteHash(bytes) },
        sourceHashes: completed.provenance.diagnostic.sourceHashes,
        producer: {
          file: "test/src/reference-conics/FamilyConicNativeRootFrames.ts",
          byteHash: Identity.byteHash(
            await fs.readFile(
              path.join(
                root,
                "test/src/reference-conics/FamilyConicNativeRootFrames.ts",
              ),
            ),
          ),
        },
        bundle: {
          file: process.argv[1],
          byteHash: Identity.byteHash(await fs.readFile(process.argv[1]!)),
        },
        calibration: prepared.calibration,
        completeBones: bones.size,
        cases: summary,
        totalMs: performance.now() - started,
        acceptance:
          "none; local frame/whole-loop linearization observations only",
      }),
      { flag: "wx" },
    );
  }
}
void FamilyConicNativeRootFrames.main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
