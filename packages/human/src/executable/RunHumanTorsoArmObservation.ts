import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanTorsoArmObservation } from "../inspection/HumanTorsoArmObservation";
import { HumanTorsoObservation } from "../inspection/HumanTorsoObservation";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster } from "./NodeCanvasRaster";

/** Selected actual S00/arm originals go unchanged to the existing Node rasterizer and serial PNG writer. */
export async function RunHumanTorsoArmObservation(
  argv: readonly string[],
): Promise<void> {
  const requested: string | undefined = argv[1];
  if (
    argv.length !== 2 ||
    argv[0] !== "--out" ||
    requested === undefined ||
    !requested.trim() ||
    requested.startsWith("-")
  )
    throw new Error(
      "Original arm observation requires exactly --out <new modeler-owned directory>",
    );
  const out: string = HumanNodePaths.resolve(requested);
  const owned: string =
    HumanNodePaths.resolve("packages/human/.shots/human_sections_xhigh") +
    path.sep;
  if (!out.startsWith(owned))
    throw new Error(
      "Original arm observation output leaves its owner directory",
    );
  await fs.mkdir(out);
  const files: readonly string[] = [
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoArmSource.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoArmPort.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoSource.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoPlan.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoField.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoCollar.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoWall.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoRegion.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoMeasurements.ts",
    "packages/human/src/generation/AutoMovieHumanNeckFamily.ts",
    "packages/human/src/generation/AutoMovieHumanNeckSupport.ts",
    "packages/human/src/generation/head/AutoMovieHumanHeadNeckLayout.ts",
    "packages/human/src/generation/head/AutoMovieHumanHeadNeckCurves.ts",
    "packages/human/src/generation/head/AutoMovieHumanHeadNeckBase.ts",
    "packages/human/src/generation/AutoMovieHumanShoulderJoint.ts",
    "packages/human/src/generation/AutoMovieHumanBodyLaw.ts",
    "packages/human/src/generation/AutoMovieHumanBodyAnatomy.ts",
    "packages/human/src/generation/AutoMovieHumanTrunkShapes.ts",
    "packages/human/src/generation/AutoMovieHumanTrunkGuides.ts",
    "packages/human/src/generation/AutoMovieHumanTrunkRows.ts",
    "packages/human/src/generation/AutoMovieHumanArmPrior.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmBones.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmInterim.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmWalk.ts",
    "packages/human/src/generation/arm/AutoMovieHumanArmBreadth.ts",
    "packages/human/src/generation/hand/AutoMovieHumanHandBones.ts",
    "packages/human/src/inspection/HumanTorsoArmObservation.ts",
    "packages/human/src/inspection/HumanTorsoObservation.ts",
    "packages/human/src/inspection/NodeCanvasCamera.ts",
    "packages/human/src/inspection/HumanInspectionReferenceMesh.ts",
    "packages/human/src/executable/HumanNodeInput.ts",
    "packages/human/src/executable/NodeCanvasRaster.ts",
    "packages/human/src/executable/RunHumanTorsoArmObservation.ts",
    "packages/engine/src/geometry/construction/AutoMovieNativeCoordinate.ts",
    "packages/engine/src/geometry/construction/AutoMovieViewSection.ts",
    "packages/engine/src/geometry/construction/AutoMovieViewSectionConic.ts",
    "packages/engine/src/geometry/construction/AutoMovieConstructionProfile.ts",
    "packages/engine/src/geometry/construction/AutoMovieLoftWorldJet.ts",
    "packages/playground/src/human-parameters/f1.ts",
  ];
  const before: Record<string, string> = await hashes(files);
  const frames: N.Frame[] = [];
  const report: Record<string, unknown> = {
    started: new Date().toISOString(),
    person: "f1",
    status: "preparing-original",
    sourceBefore: before,
    sourceIdentityLimit:
      "Selected source bytes only; not every transformed dependency.",
    raw: "not-requested",
    finalRealization: "not-run",
    frames,
  };

  /** Preserve actual failures and completed PNG identities before returning or throwing. */
  const save: () => Promise<void> = async (): Promise<void> => {
    await fs.writeFile(
      path.join(out, "manifest.json"),
      JSON.stringify(report, null, 2),
    );
  };
  await save();
  try {
    const started: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> =
      await HumanNodeInput.of();
    report.input = {
      parameters: person.parameters,
      runtimeSha256: hash(JSON.stringify(person.parameters)),
    };
    const original: HumanTorsoObservation.IOutput =
      HumanTorsoObservation.create(person.parameters);
    const observed: HumanTorsoArmObservation.IOutput =
      HumanTorsoArmObservation.create(person.parameters, original);
    report.original = original.provenance;
    report.neighbours = observed.provenance;
    report.originalDiagnostics = observed.diagnostics;
    report.inputAndOriginalMilliseconds = performance.now() - started;
    report.portReadings = observed.ports.map(
      (
        port: HumanTorsoArmObservation.IOutput["ports"][number],
      ): Record<string, unknown> => {
        const start: ReturnType<typeof port.chart> = port.chart(0);
        const end: ReturnType<typeof port.chart> = port.chart(port.period);
        const boundary: {
          clock: number;
          chart: readonly [number, number];
          key: string;
          role: string;
          unqualifiedBinary64Interior: boolean[];
        }[] = [];
        let worldMismatch: number = 0;
        let aliasPointMiss: number = 0;
        let aliasChartJetMiss: number = 0;
        let aliasKeyMismatch: number = 0;
        for (let index: number = 0; index <= 256; index++) {
          const clock: number = (port.period * index) / 256;
          const address: ReturnType<typeof port.chart> = port.chart(clock);
          const authority: ReturnType<typeof port.resolve> = port.resolve(
            port.boundary(clock),
          );
          const value: readonly [number, number, number] = authority.point;
          const source: [number, number] = port.parent.point(
            address.p[0],
            address.p[1],
          );
          worldMismatch = Math.max(
            worldMismatch,
            Math.hypot(
              value[0] - source[0],
              value[1] - address.p[0],
              value[2] - source[1],
            ),
          );
          for (const alias of [-1, 0, 1]) {
            const read: ReturnType<typeof port.resolve> = port.resolve(
              port.boundary(clock, alias, alias),
            );
            aliasPointMiss = Math.max(
              aliasPointMiss,
              ...read.point.map((point: number, at: number): number =>
                Math.abs(point - authority.point[at]!),
              ),
            );
            for (const order of ["p", "t", "tt"] as const)
              aliasChartJetMiss = Math.max(
                aliasChartJetMiss,
                ...read.chart[order].map((point: number, at: number): number =>
                  Math.abs(point - authority.chart[order][at]!),
                ),
              );
            if (read.key !== authority.key) aliasKeyMismatch++;
          }
          boundary.push({
            clock,
            chart: address.p,
            key: authority.key,
            role: authority.role,
            unqualifiedBinary64Interior: [-1, 0, 1].map(
              (alias: number): boolean => {
                const middle: number =
                  (port.bounds.station[0] + port.bounds.station[1]) / 2;
                const height: number =
                  (port.bounds.station[1] - port.bounds.station[0]) / 2;
                const centre: number =
                  (port.bounds.phase[0] + port.bounds.phase[1]) / 2;
                const width: number =
                  (port.bounds.phase[1] - port.bounds.phase[0]) / 2;
                const t: number =
                  (((address.p[1] + alias * port.period) % port.period) +
                    port.period) %
                  port.period;
                return (
                  ((address.p[0] - middle) / height) ** 2 +
                    ((t - centre) / width) ** 2 <
                  1
                );
              },
            ),
          });
        }
        const aliases: unknown[] = [-port.period, 2 * port.period].map(
          (clock: number): unknown => {
            try {
              return { clock, value: port.chart(clock) };
            } catch (error: unknown) {
              return {
                clock,
                unavailable:
                  error instanceof Error ? error.message : String(error),
              };
            }
          },
        );
        return {
          id: port.id,
          orientation: port.orientation,
          period: port.period,
          bounds: port.bounds,
          endpointPositionMiss: Math.hypot(
            ...start.p.map(
              (value: number, at: number): number => value - end.p[at]!,
            ),
          ),
          endpointFirstMiss: Math.hypot(
            ...start.t.map(
              (value: number, at: number): number => value - end.t[at]!,
            ),
          ),
          endpointSecondMiss: Math.hypot(
            ...start.tt.map(
              (value: number, at: number): number => value - end.tt[at]!,
            ),
          ),
          worldMismatch,
          aliasPointMiss,
          aliasChartJetMiss,
          aliasKeyMismatch,
          arbitraryCoordinateClassification: port.chartClassification,
          rawDiagnosticLimit:
            "Binary64 ellipse diagnostic reconstructed from published bounds; not a trim predicate or a bitwise replay of the withdrawn classifier.",
          boundary,
          portClockAliases: aliases,
          scope:
            "Known boundary owner/principal clock and integer aliases preserve shared IDs/points/chart2. Bare binary64 ellipse values remain diagnostic only; arbitrary-coordinate trim classification/world2 are not supplied or passed.",
        };
      },
    );
    if (
      observed.selections.length !== 6 ||
      observed.selections.some(
        (selection: HumanTorsoObservation.ISelection): boolean =>
          selection.curves.length === 0 || selection.cameras.length !== 4,
      )
    )
      throw new Error(
        "Actual parent/child/neighbour original selections are incomplete",
      );
    const referenceFile: string = HumanNodePaths.resolve(
      "test/.shots/f1/reference-model.json",
    );
    const bytes: Buffer = await fs.readFile(referenceFile);
    const model: IAutoMovieModel = JSON.parse(bytes.toString("utf8"));
    const reference: ReturnType<typeof HumanInspectionReferenceMesh> =
      HumanInspectionReferenceMesh(model);
    const meshes: N.Mesh[] = reference.parts.map(
      (part: IAutoMovieModelPart): N.Mesh => {
        if (
          part.geometry.type !== "mesh" ||
          part.geometry.mesh.indices === null
        )
          throw new Error(
            "Original neighbour reference is not its actual indexed mesh",
          );
        return {
          id: part.id,
          positions: part.geometry.mesh.positions,
          indices: part.geometry.mesh.indices,
          colour: [0.55, 0.55, 0.55],
        };
      },
    );
    report.reference = {
      file: referenceFile,
      sha256: hash(bytes),
      regions: reference.regions,
      policy:
        "Whole unchanged native gray reference; no source-ID crop, recentering or fit.",
    };
    report.renderer = NodeCanvasRaster.initialize();
    report.status = "drawing-original";
    await save();
    for (const selection of observed.selections)
      for (const camera of selection.cameras) {
        const rendered: ReturnType<typeof NodeCanvasRaster.render> =
          NodeCanvasRaster.render(
            camera,
            meshes,
            selection.curves,
            "xray",
            selection.id,
          );
        const file: string =
          [
            String(frames.length).padStart(4, "0"),
            selection.id.replaceAll(/[^\w.-]/g, "_"),
            camera.name,
          ].join(".") + ".png";
        const writing: number = performance.now();
        await fs.writeFile(path.join(out, file), rendered.png);
        frames.push({
          file,
          sha256: hash(rendered.png),
          camera,
          stage: "original-neighbours-and-authored-port-candidates",
          scope: selection.id,
          curves: selection.curves.map((curve: N.Curve): string => curve.id),
          meshes: meshes.map((mesh: N.Mesh): string => mesh.id),
          lineMode: "xray",
          xrayOverrides: [],
          milliseconds: {
            ...rendered.milliseconds,
            write: performance.now() - writing,
          },
          pixels: rendered.pixels,
        });
        await save();
      }
    report.status =
      observed.diagnostics.length === 0
        ? "captured-not-accepted"
        : "captured-with-original-failures";
    if (observed.diagnostics.length !== 0) process.exitCode = 1;
  } catch (error: unknown) {
    report.status = "failed";
    report.error =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.exitCode = 1;
  } finally {
    const after: Record<string, string> = await hashes(files);
    const changed: string[] = files.filter(
      (file: string): boolean => before[file] !== after[file],
    );
    report.sourceAfter = after;
    report.sourceChanged = changed;
    if (changed.length !== 0) {
      report.status = "partial-with-source-changes";
      process.exitCode = 1;
    }
    report.completed = new Date().toISOString();
    await save();
    process.stdout.write(
      JSON.stringify({
        out,
        frames: frames.length,
        status: report.status,
        sourceChanged: changed,
      }) + "\n",
    );
  }
}

/** Exact selected-source byte identities without changing a loaded module. */
async function hashes(
  files: readonly string[],
): Promise<Record<string, string>> {
  const values: Record<string, string> = {};
  for (const file of files)
    values[file] = hash(await fs.readFile(HumanNodePaths.resolve(file)));
  return values;
}

/** PNG, input and selected-source identity have no anatomical acceptance meaning. */
function hash(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

if (require.main === module)
  RunHumanTorsoArmObservation(process.argv.slice(2)).catch(
    (error: unknown): void => {
      process.stderr.write(
        (error instanceof Error
          ? (error.stack ?? error.message)
          : String(error)) + "\n",
      );
      process.exitCode = 1;
    },
  );
