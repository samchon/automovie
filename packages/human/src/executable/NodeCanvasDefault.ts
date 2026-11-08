import type { IAutoMovieModelPart } from "@automovie/interface";

import { HUMAN_INSPECTION_PARTS } from "../inspection/HUMAN_INSPECTION_PARTS";
import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import type { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanInspectionReferencePieces } from "../inspection/HumanInspectionReferencePieces";
import { HumanInspectionSourceParts } from "../inspection/HumanInspectionSourceParts";
import type { IHumanInspectionDocument } from "../inspection/IHumanInspectionDocument";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanNodeInput } from "./HumanNodeInput";

/** Existing default source/selected-raw camera batch; caller retains packet I/O and native renderer ownership. */
export async function NodeCanvasDefault(
  session: NodeCanvasTypes.Session,
  epochBefore: Record<string, string>,
): Promise<"complete" | "partial"> {
  const {
    referenceModel,
    referenceMeshes,
    details,
    capture,
    save,
  }: NodeCanvasTypes.Session = session;
  let completion: "complete" | "partial" = "complete";

  const epoch: Record<string, string> = epochBefore;
  const person: IHumanInspectionPerson = await HumanNodeInput.of();
  const patterns: string[] = [
    "trunk",
    "breast.*",
    "gluteal.*",
    "leg.*",
    "arm.*",
    "foot.*",
    "thumb.*",
    "finger.*",
    "toe.*",
    "head.mass",
  ];
  const sourceStarted: number = performance.now();
  const built: HumanInspectionParts.IOutput = HUMAN_INSPECTION_PARTS.get(
    "f1",
    person.parameters,
    patterns,
  );
  const sourceGenerated: number = performance.now();
  const drawn: ReturnType<typeof HumanInspectionCurves.of> =
    HumanInspectionCurves.of(built, patterns);
  const sourceDisplayed: number = performance.now();
  details.input = {
    typedPath: "packages/playground/src/human-parameters/f1.ts",
    runtimeParametersSha256: R.hash(JSON.stringify(person.parameters)),
    parameters: person.parameters,
  };
  details.observation = built.observation;
  details.records = built.sourceRecords;
  details.diagnostics = built.diagnostics;
  details.displayDiagnostics = drawn.diagnostics;
  details.topSources = drawn.topSources;
  details.sourceFailures = (drawn.sourceFailures ?? []).map(
    (failure: HumanInspectionCurves.ISourceFailure): unknown => ({
      part: failure.part,
      phase: failure.phase,
      error: R.message(failure.error),
    }),
  );
  details.sourceCounts = {
    unavailableParts: built.observation.unavailableParts.length,
    displayDiagnostics: drawn.diagnostics.length,
    sourceFailures: drawn.sourceFailures?.length ?? 0,
  };
  if (
    built.observation.unavailableParts.length !== 0 ||
    drawn.diagnostics.length !== 0 ||
    (drawn.sourceFailures?.length ?? 0) !== 0
  )
    completion = "partial";
  details.milliseconds = {
    generation: sourceGenerated - sourceStarted,
    originalCurveDisplay: sourceDisplayed - sourceGenerated,
    acquisition: built.sourceAcquisition,
  };
  details.before = epoch;
  process.stdout.write(
    JSON.stringify({
      event: "actual-source-ready",
      utc: new Date().toISOString(),
      parts: built.parts.length,
      curves: drawn.curves.length,
      milliseconds: details.milliseconds,
    }) + "\n",
  );
  await save();

  const referenceCrops: Record<string, unknown> = {};
  details.referenceCrops = referenceCrops;
  /** Reuses the viewer's exact source-bound reference crop; excluded boundary triangles get no caps. */
  const crop: (scope: string, names: string[]) => NodeCanvasTypes.Mesh[] = (
    scope: string,
    names: string[],
  ): NodeCanvasTypes.Mesh[] => {
    const selected: ReturnType<typeof HumanInspectionReferenceMesh> =
      HumanInspectionReferenceMesh(
        referenceModel,
        HumanInspectionReferencePieces(names, drawn.curves),
      );
    referenceCrops[scope] = {
      names,
      method: selected.crop,
      regions: selected.regions,
    };
    return selected.parts.map(
      (part: IAutoMovieModelPart): NodeCanvasTypes.Mesh => {
        if (
          part.geometry.type !== "mesh" ||
          part.geometry.mesh.indices === null
        )
          throw new Error("Reference crop lost its static mesh");
        return {
          id: part.id,
          positions: part.geometry.mesh.positions,
          indices: part.geometry.mesh.indices,
          colour: [0.46, 0.51, 0.57],
        };
      },
    );
  };

  const groups: { name: string; names: string[] }[] = [
    {
      name: "whole-scoped",
      names: built.parts.map(
        (part: HumanInspectionParts.IPart): string => part.name,
      ),
    },
    { name: "toe-left-1", names: ["toe.left.1"] },
    {
      name: "foot-toe-neighbours",
      names: ["foot.left", "toe.left.1", "toe.left.2"],
    },
  ];
  for (const group of groups) {
    const curves: NodeCanvasTypes.Curve[] = drawn.curves.filter(
      (curve: IHumanInspectionDocument.ICurve): boolean =>
        group.names.some((name: string): boolean =>
          curve.id.startsWith(HumanInspectionCurves.PREFIX + name + "/"),
        ),
    );
    if (curves.length === 0)
      throw new Error("Empty original group " + group.name);
    const points: NodeCanvasTypes.Point[] = curves.flatMap(
      (curve: NodeCanvasTypes.Curve): NodeCanvasTypes.Point[] => [
        ...curve.points,
      ],
    );
    const underlay: NodeCanvasTypes.Mesh[] =
      group.name === "whole-scoped"
        ? referenceMeshes
        : crop(group.name, group.names);
    for (const name of NodeCanvasCamera.names())
      await capture(
        group.name,
        "original-2d-xray",
        NodeCanvasCamera.fit(name, points),
        underlay,
        curves,
        "xray",
      );
  }
  const toe: NodeCanvasTypes.Curve[] = drawn.curves.filter(
    (curve: IHumanInspectionDocument.ICurve): boolean =>
      curve.id.startsWith(HumanInspectionCurves.PREFIX + "toe.left.1/"),
  );
  const toePoints: NodeCanvasTypes.Point[] = toe.flatMap(
    (curve: NodeCanvasTypes.Curve): NodeCanvasTypes.Point[] => [
      ...curve.points,
    ],
  );
  const toeReference: NodeCanvasTypes.Mesh[] = crop("toe-left-1", [
    "toe.left.1",
  ]);
  for (const curve of toe)
    await capture(
      "toe-one-" + curve.id.split("/").at(-1)!,
      "original-individual",
      NodeCanvasCamera.fit("high-oblique", toePoints),
      toeReference,
      [curve],
      "xray",
    );
  const neighbourNames: string[] = ["foot.left", "toe.left.1", "toe.left.2"];
  const neighbourCurves: NodeCanvasTypes.Curve[] = drawn.curves.filter(
    (curve: IHumanInspectionDocument.ICurve): boolean =>
      neighbourNames.some((part: string): boolean =>
        curve.id.startsWith(HumanInspectionCurves.PREFIX + part + "/"),
      ),
  );
  const neighbourPoints: NodeCanvasTypes.Point[] = neighbourCurves.flatMap(
    (curve: NodeCanvasTypes.Curve): NodeCanvasTypes.Point[] => [
      ...curve.points,
    ],
  );
  const neighbourReference: NodeCanvasTypes.Mesh[] = crop(
    "foot-toe-neighbours",
    neighbourNames,
  );
  for (const name of ["front", "left", "top"])
    await capture(
      "foot-toe-neighbours",
      "original-depth",
      NodeCanvasCamera.fit(name, neighbourPoints),
      neighbourReference,
      neighbourCurves,
      "depth",
    );

  const rawStarted: number = performance.now();
  const document: IHumanInspectionDocument = HumanInspectionSourceParts.build(
    person,
    "foot.left,toe.left.1,toe.left.2",
  );
  const rawBuilt: number = performance.now();
  const rawMeshes: NodeCanvasTypes.Mesh[] = document.parts.map(
    (part: IHumanInspectionDocument.IPart): NodeCanvasTypes.Mesh => {
      if (part.space !== "body-mm")
        throw new Error(
          "Node raw adapter requires already placed body-mm parts",
        );
      return {
        id: part.id,
        positions: part.points.flatMap(
          (point: IHumanInspectionDocument.Point): number[] =>
            point.map((value: number): number => value / 1000),
        ),
        indices: part.indices,
        colour: [0.61, 0.43, 0.29],
      };
    },
  );
  const rawCurves: NodeCanvasTypes.Curve[] = document.parts.flatMap(
    (part: IHumanInspectionDocument.IPart): NodeCanvasTypes.Curve[] =>
      part.curves.map(
        (curve: IHumanInspectionDocument.ICurve): NodeCanvasTypes.Curve => ({
          ...curve,
          colour: "a52863",
          points: curve.points.map(
            (point: IHumanInspectionDocument.Point): NodeCanvasTypes.Point => [
              point[0] / 1000,
              point[1] / 1000,
              point[2] / 1000,
            ],
          ),
        }),
      ),
  );
  const rawIssues: string[] = R.rawIssues(document);
  if (rawIssues.length !== 0) completion = "partial";
  details.raw = {
    issues: rawIssues,
    provenance: document.provenance,
    producerMilliseconds: rawBuilt - rawStarted,
    adaptationMilliseconds: performance.now() - rawBuilt,
    meshes: rawMeshes.length,
    curves: rawCurves.length,
  };
  for (const name of NodeCanvasCamera.names()) {
    const camera: NodeCanvasTypes.Camera = NodeCanvasCamera.fit(
      name,
      neighbourPoints,
    );
    await capture(
      "foot-toe-neighbours",
      "generated-loft-curves",
      camera,
      neighbourReference,
      rawCurves,
      "xray",
    );
    await capture(
      "foot-toe-neighbours",
      "raw-prejoin-overlay",
      camera,
      [...neighbourReference, ...rawMeshes],
      rawCurves,
      "depth",
    );
    await capture(
      "foot-toe-neighbours",
      "raw-prejoin-clay",
      camera,
      rawMeshes,
      [],
      "depth",
    );
  }
  const after: Record<string, string> = R.sources();
  details.changedDuringRun = [
    ...new Set([...Object.keys(epoch), ...Object.keys(after)]),
  ].filter((file: string): boolean => after[file] !== epoch[file]);
  details.sourceBoundary =
    "Before/after tracked disk hashes; concurrent saves are listed. They do not independently seal ttsx's consumed transformed module graph.";
  details.after = after;

  return completion;
}
