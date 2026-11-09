import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanInspectionReferencePlanes } from "../inspection/HumanInspectionReferencePlanes";
import { HumanTorsoAngleObservation } from "../inspection/HumanTorsoAngleObservation";
import { HumanTorsoCamera } from "../inspection/HumanTorsoCamera";
import { HumanTorsoLoftObservation } from "../inspection/HumanTorsoLoftObservation";
import { HumanTorsoObservation } from "../inspection/HumanTorsoObservation";
import { HumanTorsoPlanObservation } from "../inspection/HumanTorsoPlanObservation";
import { HumanTorsoStageObservation } from "../inspection/HumanTorsoStageObservation";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport } from "./HumanCurveCostReport";
import { HumanNodeArtifacts } from "./HumanNodeArtifacts";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster } from "./NodeCanvasRaster";
import { NodeCanvasReferenceBackground } from "./NodeCanvasReferenceBackground";

/**
 * Evaluate the modeler's actual S00 originals once and pass their exact buffers/cameras to the existing PNG renderer.
 *
 * This entry owns input loading and durable artifacts, not another geometry or renderer. Optional degree yaw/pitch, metre target and positive zoom choose one custom camera per valid selection; absent overrides retain the identical original cameras and buffers. No environment is changed. The reference remains its native static mesh; no old view-name crop is applied to new profile IDs. Runtime source failures, empty selections and partial output stay explicit.
 */
export async function RunHumanTorsoObservation(
  argv: readonly string[],
): Promise<void> {
  const options: HumanTorsoCamera.IArguments = HumanTorsoCamera.read(argv);
  const requested: string = options.out;
  const scope: HumanTorsoCamera.IArguments["scope"] = options.scope;
  const out: string = HumanNodePaths.resolve(requested);
  const owned: string =
    HumanNodePaths.resolve("packages/human/.shots/human_sections_xhigh") +
    path.sep;
  if (!out.startsWith(owned))
    throw new Error(
      "S00 output leaves the exact modeler-owned observation directory",
    );
  await fs.mkdir(out, { recursive: true });
  const files: string[] = [
    ...HumanTorsoObservation.sourceFiles,
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoField.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTorsoCollar.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTrunkSectionFamily.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTrunkViewPart.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTrunkAxis.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTrunkViews.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTrunkConnection.ts",
    "packages/human/src/generation/trunk/IAutoMovieHumanTrunkViews.ts",
    "packages/human/src/generation/trunk/AutoMovieHumanTrunkLaws.ts",
    "packages/human/src/generation/limb/AutoMovieHumanSiteViewPart.ts",
    "packages/human/src/executable/HumanCurveCostReport.ts",
    "packages/human/src/executable/HumanNodeInput.ts",
    ...[
      "HairColor",
      "HairCurl",
      "HairStyle",
      "Hairline",
      "LowerUnderwear",
      "Sex",
      "UpperUnderwear",
    ].map(
      (name: string): string =>
        "packages/human/src/typings/AutoMovieHuman" + name + ".ts",
    ),
    "packages/human/src/inspection/HumanTorsoObservation.ts",
    "packages/human/src/inspection/HumanTorsoAngleObservation.ts",
    ...HumanTorsoStageObservation.sourceFiles,
    "packages/human/src/inspection/HumanTorsoLoftObservation.ts",
    "packages/human/src/inspection/HumanInspectionReferencePlanes.ts",
    "packages/human/src/inspection/NodeCanvasCamera.ts",
    "packages/human/src/inspection/HumanTorsoCamera.ts",
    "packages/human/src/inspection/HumanTorsoPlanObservation.ts",
    "packages/human/src/executable/RunHumanTorsoObservation.ts",
    "packages/human/src/executable/HumanNodeArtifacts.ts",
    "packages/human/src/executable/NodeCanvasRaster.ts",
    "packages/human/src/executable/NodeCanvasReferenceBackground.ts",
    "packages/human/src/inspection/NodeCanvasTypes.ts",
    "packages/engine/src/geometry/construction/AutoMovieNativeCoordinate.ts",
    "packages/interface/src/construction/IAutoMovieConstructionProfile.ts",
    "packages/engine/src/geometry/construction/IAutoMovieConstructionProfileSource.ts",
    "packages/engine/src/geometry/construction/AutoMovieConstructionProfile.ts",
    "packages/engine/src/geometry/construction/AutoMovieConstructionProfilePhase.ts",
    "packages/engine/src/geometry/construction/AutoMovieLoftWorldJet.ts",
    "packages/engine/src/geometry/index.ts",
    "packages/engine/src/drawing/autoMovieDrawingCutEdges.ts",
    "packages/engine/src/drawing/autoMovieDrawingPlaneDistance.ts",
    "packages/engine/src/drawing/constants/AUTOMOVIE_DRAWING_EPSILON.ts",
    ...HumanTorsoLoftObservation.sourceFiles,
  ];
  files.push(
    ...Object.entries(HumanCurveCostReport.configs())
      .filter((entry: [string, string | null]): boolean => entry[1] !== null)
      .map((entry: [string, string | null]): string => entry[0]),
  );
  const inputDirectory: string = "packages/playground/src/human-parameters";
  files.push(
    ...(await fs.readdir(HumanNodePaths.resolve(inputDirectory)))
      .filter((file: string): boolean => file.endsWith(".ts"))
      .map((file: string): string => inputDirectory + "/" + file),
  );
  const before: Record<string, string> =
    await HumanNodeArtifacts.sources(files);
  const frames: N.Frame[] = [];
  const report: Record<string, unknown> = {
    started: new Date().toISOString(),
    person: "f1",
    status: "preparing-original",
    scope,
    arguments: [...argv],
    cameraArguments: options.camera,
    sourceBefore: before,
    sourceIdentityLimit:
      "Selected source bytes only; not every transformed dependency. First source preparation and deferred source evaluation remain included.",
    raw: "not-requested",
    finalRealization: "not-run",
    frames,
  };

  /** Durable progress contains original failures and completed exact PNG identities. */
  const save: () => Promise<void> = async (): Promise<void> => {
    await fs.writeFile(
      path.join(out, "manifest.json"),
      JSON.stringify(report, null, 2),
    );
  };
  await save();
  try {
    const started: number = performance.now();
    const inputStarted: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> =
      await HumanNodeInput.of();
    report.inputLoadMilliseconds = performance.now() - inputStarted;
    report.input = {
      parameters: person.parameters,
      runtimeSha256: HumanNodeArtifacts.hash(JSON.stringify(person.parameters)),
    };
    const stage: HumanTorsoStageObservation.IOutput | undefined =
      scope === "stages"
        ? HumanTorsoStageObservation.create(person.parameters)
        : undefined;
    const angles: HumanTorsoObservation.IOutput | undefined =
      stage?.angles ??
      (scope === "angles"
        ? HumanTorsoAngleObservation.create(person.parameters)
        : undefined);
    const rawOriginal: HumanTorsoObservation.IOutput["original"] | undefined =
      stage?.original;
    const observed: HumanTorsoPlanObservation.IOutput =
      stage !== undefined
        ? stage.observed
        : angles !== undefined
          ? angles
          : scope === "datums"
            ? HumanTorsoPlanObservation.create(person.parameters)
            : HumanTorsoObservation.create(person.parameters);
    report.original = observed.provenance;
    report.neighbours = stage?.neighbours ?? "not-requested";
    const originalDiagnostics: HumanTorsoObservation.IOutput["diagnostics"] =
      stage?.diagnostics ?? observed.diagnostics;
    report.originalDiagnostics = originalDiagnostics;
    if (scope === "stages") {
      report.closedSourcePreparation = stage!.constraintAttempt;
      if (rawOriginal === undefined)
        report.raw = {
          requested: true,
          status: "unavailable",
          publicRealization: "not-run",
          reason:
            "No complete original profile; only independent definitions are available",
        };
    }
    report.inputAndOriginalMilliseconds = performance.now() - started;
    const referenceFile: string = HumanNodePaths.resolve(
      "test/.shots/f1/reference-model.json",
    );
    const referenceBytes: Buffer = await fs.readFile(referenceFile);
    const model: IAutoMovieModel = JSON.parse(referenceBytes.toString("utf8"));
    const reference: ReturnType<typeof HumanInspectionReferenceMesh> =
      HumanInspectionReferenceMesh(model);
    const meshes: N.Mesh[] = reference.parts.map(
      (part: IAutoMovieModelPart): N.Mesh => {
        if (
          part.geometry.type !== "mesh" ||
          part.geometry.mesh.indices === null
        )
          throw new Error(
            "S00 reference is not the admitted native indexed mesh",
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
      sha256: HumanNodeArtifacts.hash(referenceBytes),
      regions: reference.regions,
      policy:
        "Whole original native buffers; no profile-id crop, cap, fit or recentering",
    };
    report.renderer = NodeCanvasRaster.initialize();
    const backgrounds: NodeCanvasReferenceBackground.IOwner =
      await NodeCanvasReferenceBackground.create(
        HumanNodeArtifacts.hash(referenceBytes),
        meshes,
      );
    report.referenceBackgroundPreparation = {
      identityMilliseconds: backgrounds.identityMilliseconds,
      boundary:
        "Reference/display/renderer identity; separate from input, source controls, constraints and public realization.",
    };
    const originalSelections: readonly HumanTorsoObservation.ISelection[] =
      scope === "stages"
        ? stage!.selections
        : scope === "all" || scope === "datums" || scope === "angles"
          ? observed.selections
          : observed.selections.filter(
              (selection: HumanTorsoObservation.ISelection): boolean =>
                selection.id === "S00.all-originals" ||
                selection.id === "S00.guides",
            );
    if (originalSelections.length === 0)
      throw new Error("S00 selected original observation is empty");
    const unavailable: string[] = originalSelections
      .filter(
        (selection: HumanTorsoObservation.ISelection): boolean =>
          selection.curves.length === 0 ||
          selection.cameras.length !==
            HumanTorsoCamera.expected(scope, selection.id),
      )
      .map(
        (selection: HumanTorsoObservation.ISelection): string => selection.id,
      );
    const cutStarted: number = performance.now();
    const planeSelections: HumanTorsoObservation.ISelection[] =
      scope === "angles" || scope === "stages"
        ? HumanInspectionReferencePlanes(meshes, originalSelections)
        : [];
    report.referencePlanes = {
      producer:
        "autoMovieDrawingCutEdges on unchanged native reference triangles",
      frame:
        "world metres; +X anterior/+Y superior/+Z left; source physical Y converted once",
      limits:
        "Unjoined straddling-triangle segments; native 1e-9 metre plane tolerance; coplanar/tangent triangles skipped; no smooth-loop or fitting claim",
      milliseconds: performance.now() - cutStarted,
      selections: planeSelections.map(
        (selection: HumanTorsoObservation.ISelection): unknown => ({
          id: selection.id,
          source: selection.curves.at(-1)!.id,
          yMetres: selection.curves.at(-1)!.points[0]![1],
          referenceSegments: selection.curves.length - 1,
          sourceColour: selection.curves.at(-1)!.colour,
          referenceColour: "525252",
        }),
      ),
    };
    const selections: readonly HumanTorsoObservation.ISelection[] = [
      ...originalSelections,
      ...planeSelections,
    ].map(
      (
        selection: HumanTorsoObservation.ISelection,
      ): HumanTorsoObservation.ISelection =>
        unavailable.includes(selection.id)
          ? selection
          : {
              ...selection,
              cameras: HumanTorsoCamera.select(
                selection.cameras,
                selection.curves,
                options.camera,
              ),
            },
    );
    report.unavailableSelections = unavailable;
    report.status = "drawing-original";
    report.selections = selections.map(
      (selection: HumanTorsoObservation.ISelection): unknown => ({
        id: selection.id,
        curves: selection.curves.map((curve: N.Curve): string => curve.id),
        cameras: selection.cameras,
      }),
    );
    await save();

    /** Existing serial PNG writer shared by actual original and official realized stages. */
    const capture: (
      id: string,
      stage: string,
      camera: N.Camera,
      selectedMeshes: readonly N.Mesh[],
      curves: readonly N.Curve[],
      lineMode: "xray" | "depth",
    ) => Promise<void> = async (
      id: string,
      stage: string,
      camera: N.Camera,
      selectedMeshes: readonly N.Mesh[],
      curves: readonly N.Curve[],
      lineMode: "xray" | "depth",
    ): Promise<void> => {
      const rendered: NodeCanvasReferenceBackground.IRender =
        await backgrounds.render(camera, selectedMeshes, curves, lineMode, id);
      const file: string =
        [
          String(frames.length).padStart(4, "0"),
          id.replaceAll(/[^\w.-]/g, "_"),
          camera.name,
        ].join(".") + ".png";
      frames.push(
        await HumanNodeArtifacts.frame(
          out,
          file,
          {
            camera,
            stage,
            scope: id,
            meshes: selectedMeshes,
            curves,
            lineMode,
          },
          rendered,
        ),
      );
      await save();
    };
    for (const selection of selections)
      for (const camera of selection.cameras) {
        if (unavailable.includes(selection.id)) continue;
        await capture(
          selection.id,
          selection.id.endsWith(".same-plane-reference")
            ? "actual-source-and-independent-native-reference-plane-cut"
            : scope === "datums"
              ? "authoring-datums-only"
              : stage?.constraintAttempt.status === "provided" ||
                  angles !== undefined
                ? "original-after-explicit-chest-and-front-course-closure"
                : scope === "stages"
                  ? "available-originals-with-separate-constraint-attempt"
                  : "original-composed-source-candidate",
          camera,
          selection.id.endsWith(".same-plane-reference") ? [] : meshes,
          selection.curves,
          "xray",
        );
      }
    let rawFailed: boolean = false;
    if (scope === "stages" && rawOriginal !== undefined) {
      report.raw = {
        requested: true,
        status: "preparing-official-single-profile",
        constraints: rawOriginal.plan.constraints,
      };
      await save();
      const raw: HumanTorsoLoftObservation.IOutput =
        HumanTorsoLoftObservation.create(rawOriginal);
      report.raw = { requested: true, status: raw.status, ...raw.facts };
      if (raw.buffers !== undefined)
        report.officialBuffers = await HumanNodeArtifacts.json(
          out,
          "official-buffers.json",
          raw.buffers,
        );
      rawFailed = raw.status !== "provided";
      await save();
      const whole: HumanTorsoObservation.ISelection | undefined =
        stage?.available?.selections.find(
          (selection: HumanTorsoObservation.ISelection): boolean =>
            selection.id === "S00.all-originals",
        );
      report.rawDisplay =
        whole === undefined
          ? {
              status: "unavailable",
              reason: "Actual raw display has no source camera extent",
            }
          : { status: "requested" };
      rawFailed ||= whole === undefined;
      const frameStart: number = frames.length;
      for (const camera of whole === undefined
        ? []
        : HumanTorsoCamera.select(
            HumanTorsoCamera.overview(whole).cameras,
            whole.curves,
            options.camera,
          )) {
        if (raw.curves.length !== 0)
          await capture(
            "S00.single-profile.loft-curves",
            "actual-retained-loft-curves-over-native-reference",
            camera,
            meshes,
            raw.curves,
            "xray",
          );
        if (raw.meshes.length !== 0) {
          await capture(
            "S00.single-profile.curves-clay",
            "actual-single-leaf-curves-and-official-tessellated-clay",
            camera,
            raw.meshes,
            raw.curves,
            "depth",
          );
          await capture(
            "S00.single-profile.clay",
            "actual-single-leaf-official-tessellated-clay-only",
            camera,
            raw.meshes,
            [],
            "depth",
          );
        }
      }
      if (whole !== undefined)
        report.rawDisplay = {
          status: frames.length > frameStart ? "captured" : "unavailable",
          frames: frames.length - frameStart,
        };
    }
    report.status =
      originalDiagnostics.length === 0 && unavailable.length === 0 && !rawFailed
        ? "captured-not-accepted"
        : "captured-with-original-failures";
    const archiveStarted: number = performance.now();
    await HumanNodeArtifacts.sources(files, path.join(out, "source"), before);
    report.sourceArchiveMilliseconds = performance.now() - archiveStarted;
    const after: Record<string, string> =
      await HumanNodeArtifacts.sources(files);
    report.sourceAfter = after;
    const changed: string[] = files.filter(
      (file: string): boolean => before[file] !== after[file],
    );
    report.sourceChanged = changed;
    if (changed.length !== 0) report.status = "captured-with-source-changes";
    report.completed = new Date().toISOString();
    await save();
    process.stdout.write(
      JSON.stringify({
        out,
        frames: frames.length,
        status: report.status,
        sourceChanged: report.sourceChanged,
      }) + "\n",
    );
    if (
      originalDiagnostics.length !== 0 ||
      rawFailed ||
      unavailable.length !== 0 ||
      changed.length !== 0
    )
      process.exitCode = 1;
  } catch (error: unknown) {
    report.status = "failed";
    report.error =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    const after: Record<string, string> =
      await HumanNodeArtifacts.sources(files);
    report.sourceAfter = after;
    report.sourceChanged = files.filter(
      (file: string): boolean => before[file] !== after[file],
    );
    report.completed = new Date().toISOString();
    await save();
    throw error;
  }
}

if (require.main === module)
  RunHumanTorsoObservation(process.argv.slice(2)).catch(
    (error: unknown): void => {
      process.stderr.write(
        (error instanceof Error
          ? (error.stack ?? error.message)
          : String(error)) + "\n",
      );
      process.exitCode = 1;
    },
  );
