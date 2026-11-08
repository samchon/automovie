import type { IAutoMovieModelPart } from "@automovie/interface";

import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import type { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanInspectionReferencePieces } from "../inspection/HumanInspectionReferencePieces";
import type { IHumanInspectionDocument } from "../inspection/IHumanInspectionDocument";
import { HumanTorsoObservation } from "../inspection/HumanTorsoObservation";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import type { NodeCanvasInventoryTypes as T } from "./NodeCanvasInventoryTypes";

/** Existing inventory display adapters, with source numbers and topology unchanged. */
export namespace NodeCanvasSourceDisplay {
  /** Capture one actual S00 guide before any native-bank body/head request; the returned immutable candidate supplies the subsequent full packet unchanged. */
  export async function first(
    session: N.Session,
    person: IHumanInspectionPerson,
    shareOriginals: boolean = false,
  ): Promise<HumanTorsoObservation.IOutput> {
    const parameters: IAutoMovieHumanParameters = person.parameters;
    session.details.firstOriginal = { status: "preparing-candidate", producer: "HumanTorsoObservation.create -> Source.create -> common original controls -> Profile Point0", coupledClosure: "unrequested", raw: "not-requested", finalSkin: "not-run" };
    await session.save();
    process.stdout.write(JSON.stringify({ event: "first-original-source-start", utc: new Date().toISOString() }) + "\n");
    const requestStarted: number = performance.now();
    let shared: Parameters<typeof HumanTorsoObservation.create>[1] = undefined;
    let commonModuleImportMilliseconds: number | null = null;
    let commonPreparationMilliseconds: number | null = null;
    if (shareOriginals) {
      const imported: number = performance.now();
      const cache: typeof import("../inspection/HUMAN_INSPECTION_PARTS.js") = await import("../inspection/HUMAN_INSPECTION_PARTS.js");
      commonModuleImportMilliseconds = performance.now() - imported;
      const commonStarted: number = performance.now();
      shared = cache.HUMAN_INSPECTION_PARTS.neck(person.alias, parameters);
      commonPreparationMilliseconds = performance.now() - commonStarted;
    }
    const original: HumanTorsoObservation.IOutput = HumanTorsoObservation.create(parameters, shared);
    const request: Record<string, unknown> = {
      commonModuleImportMilliseconds, commonPreparationMilliseconds,
      originalRequestMilliseconds: performance.now() - requestStarted,
      boundary: "Whole request includes shared input/neck preparation and original display materialization; import and shared work are separate and no pure-constructor target is inferred",
      sharedOriginalOwner: shared !== undefined,
    };
    const id: string = "human.construction.profile.S00/guide.S00.outer.q1.start";
    const selection: HumanTorsoObservation.ISelection | undefined = original.selections.find(
      (value: HumanTorsoObservation.ISelection): boolean => value.id === id,
    );
    const camera: N.Camera | undefined = selection?.cameras.find(
      (value: N.Camera): boolean => value.name === "front",
    );
    if (selection === undefined || selection.curves.length !== 1 || camera === undefined)
      throw new Error("The actual first S00 guide or its front camera is unavailable");
    session.details.firstOriginal = { status: "prepared", id, request, provenance: original.provenance, diagnostics: original.diagnostics };
    await session.capture(id, "original-first", camera, session.referenceMeshes, selection.curves, "xray");
    session.details.firstOriginal = { status: "captured-unreviewed", id, request, provenance: original.provenance, diagnostics: original.diagnostics, sourceReuse: "The same original and display buffers continue into the full packet; capture is not anatomical acceptance" };
    await session.save();
    return original;
  }

  /** Actual authored control records and physical domains; sampled frames describe the owner's map without replacing its source function. */
  export function definitions(built: HumanInspectionParts.IOutput): Record<string, unknown>[] {
    return built.parts.map((part: HumanInspectionParts.IPart): Record<string, unknown> => {
      const original: HumanInspectionParts.IGuides["source"] | null = part.guides?.source ?? part.part;
      if (original === null) return { name: part.name, status: "unavailable original definition", completeFullness: "not requested by metadata" };
      return {
        name: part.name,
        domain: [original.stations[0], original.stations.at(-1)],
        stations: original.stations,
        units: "calibration mm; display metres = calibration mm * observation.scale / 1000",
        displayScale: built.scale / 1000,
        plane: "Original part.axis station frame: origin + front*u + side*v",
        frames: original.stations.map((station: number): Record<string, unknown> => ({ station, frame: original.axis.at(station) })),
        controls: { front: original.front, side: original.side, pole: original.pole },
        completeFullness: part.guides === undefined ? "original part; queried separately by requested top rings" : part.guides.fullSourceAttempt(),
        constructorCount: "unmeasured; signed outlines, control knots and evaluated rings are not independent constructors",
      };
    });
  }

  /** Select actual source neighbors in both sides' existing namespaces; names select display subdomains and never create missing geometry. */
  export function neighbours(
    originalOnly: boolean,
    names: readonly string[],
    observations: readonly HumanInspectionParts.IOutput[],
  ): { name: string; names: string[] }[] {
    const groups: { name: string; names: string[] }[] = [];
    if (originalOnly) {
      groups.push({ name: "torso-head-neck-originals", names: ["S00", "head.mass"] });
      for (const side of ["left", "right"])
        groups.push(
          { name: side + "-torso-arm-originals", names: ["S00", "arm." + side] },
          { name: side + "-torso-leg-foot-originals", names: ["S00", "leg." + side, "foot." + side] },
          { name: side + "-hand-digit-originals", names: names.filter((name: string): boolean => name === "arm." + side || name === "thumb." + side || name.startsWith("finger." + side + ".")) },
          { name: side + "-foot-toe-originals", names: names.filter((name: string): boolean => name === "foot." + side || name.startsWith("toe." + side + ".")) },
        );
    } else
      groups.push(
        { name: "foot-toe-neighbours", names: ["foot.left", "toe.left.1", "toe.left.2"] },
        { name: "left-arm-hand-neighbours", names: names.filter((name: string): boolean => name === "arm.left" || name === "thumb.left" || name.startsWith("finger.left.")) },
      );
    groups.push({
      name: "head-original-neighbours",
      names: observations.find((value: HumanInspectionParts.IOutput): boolean => value.observation.scope?.requested.includes("head.*") ?? false)?.parts.map((part: HumanInspectionParts.IPart): string => part.name) ?? [],
    });
    return groups;
  }

  /** Three raw stages use actual original or raw display points for framing, without fabricating controls. */
  export async function passes(
    session: N.Session,
    scope: string,
    raw: T.Raw,
    framePoints: N.Point[],
    reference: N.Mesh[],
    cameras: string[],
  ): Promise<void> {
    for (const name of cameras) {
      const camera: N.Camera = NodeCanvasCamera.fit(name, framePoints);
      await session.capture(
        scope,
        "generated-loft-curves",
        camera,
        reference,
        raw.curves,
        "xray",
      );
      await session.capture(
        scope,
        "raw-prejoin-overlay",
        camera,
        [...reference, ...raw.meshes],
        raw.curves,
        "depth",
      );
      await session.capture(
        scope,
        "raw-prejoin-clay",
        camera,
        raw.meshes,
        [],
        "depth",
      );
    }
  }

  /** Combines actual independent observations without reading deferred part/fullness getters. */
  export function combine(
    values: HumanInspectionParts.IOutput[],
  ): HumanInspectionParts.IOutput {
    const first: HumanInspectionParts.IOutput = values[0]!;
    if (
      values.some(
        (value: HumanInspectionParts.IOutput): boolean =>
          value.scale !== first.scale,
      )
    )
      throw new Error("Actual observation scales differ");
    return {
      parts: [
        ...new Map(
          values.flatMap(
            (
              value: HumanInspectionParts.IOutput,
            ): [string, HumanInspectionParts.IPart][] =>
              value.parts.map(
                (part: HumanInspectionParts.IPart): [string, typeof part] => [
                  part.name,
                  part,
                ],
              ),
          ),
        ).values(),
      ],
      scale: first.scale,
      repeats: {},
      diagnostics: {
        body: values.flatMap(
          (
            value: HumanInspectionParts.IOutput,
          ): typeof value.diagnostics.body => value.diagnostics.body,
        ),
        head: values.flatMap(
          (
            value: HumanInspectionParts.IOutput,
          ): typeof value.diagnostics.head => value.diagnostics.head,
        ),
      },
      sourceRecords: values.flatMap(
        (value: HumanInspectionParts.IOutput): typeof value.sourceRecords =>
          value.sourceRecords,
      ),
      observation: {
        stage: "scoped-source-definition",
        finalRealization: "not-run",
        treeParts: [],
        studies: values.flatMap(
          (value: HumanInspectionParts.IOutput): string[] =>
            value.observation.studies,
        ),
        definitionOnlyParts: [],
        unavailableParts: values.flatMap(
          (value: HumanInspectionParts.IOutput): string[] =>
            value.observation.unavailableParts,
        ),
      },
    };
  }

  /** Producer namespace membership is an exact source-name prefix, not reconstructed geometry. */
  export function owns(curve: N.Curve, names: readonly string[]): boolean {
    return names.some((name: string): boolean =>
      curve.id.startsWith(HumanInspectionCurves.PREFIX + name + "/"),
    );
  }

  /** Borrowed materialized points affect framing only. */
  export function points(curves: readonly N.Curve[]): N.Point[] {
    return curves.flatMap((curve: N.Curve): N.Point[] => [...curve.points]);
  }

  /** Uses the shared native reference crop without changing its positions or indices. */
  export function crop(
    session: N.Session,
    names: string[],
    curves: IHumanInspectionDocument.ICurve[],
  ): N.Mesh[] {
    return HumanInspectionReferenceMesh(
      session.referenceModel,
      HumanInspectionReferencePieces(names, curves),
    ).parts.map((part: IAutoMovieModelPart): N.Mesh => {
      if (part.geometry.type !== "mesh" || part.geometry.mesh.indices === null)
        throw new Error("Static native crop is unavailable");
      return {
        id: part.id,
        positions: part.geometry.mesh.positions,
        indices: part.geometry.mesh.indices,
        colour: [0.46, 0.51, 0.57],
      };
    });
  }

  /** Converts production body millimetres to display metres; source geometry and topology remain unchanged. */
  export function adapt(document: IHumanInspectionDocument): T.Raw {
    return {
      provenance: document.provenance,
      issues: R.rawIssues(document),
      meshes: document.parts.map(
        (part: IHumanInspectionDocument.IPart): N.Mesh => {
          if (part.space !== "body-mm")
            throw new Error(
              "Actual raw part is not placed in body millimetres",
            );
          return {
            id: part.id,
            positions: part.points.flatMap(
              (point: IHumanInspectionDocument.Point): number[] => [
                point[0] / 1000,
                point[1] / 1000,
                point[2] / 1000,
              ],
            ),
            indices: part.indices,
            colour: [0.61, 0.43, 0.29],
          };
        },
      ),
      curves: document.parts.flatMap(
        (part: IHumanInspectionDocument.IPart): N.Curve[] =>
          part.curves.map(
            (curve: IHumanInspectionDocument.ICurve): N.Curve => ({
              ...curve,
              colour: "a52863",
              points: curve.points.map(
                (point: IHumanInspectionDocument.Point): N.Point => [
                  point[0] / 1000,
                  point[1] / 1000,
                  point[2] / 1000,
                ],
              ),
            }),
          ),
      ),
    };
  }

  /** Retains isolated operand identities; this operation performs no final Boolean join. */
  export function merge(values: T.Raw[]): T.Raw {
    return {
      issues: values.flatMap((value: T.Raw): string[] => value.issues),
      meshes: values.flatMap((value: T.Raw): N.Mesh[] => value.meshes),
      curves: values.flatMap((value: T.Raw): N.Curve[] => value.curves),
      provenance: {
        stage: "prejoin-unconnected-operands",
        finalRealization: "not-run",
        producers: values.map(
          (value: T.Raw): Record<string, unknown> => value.provenance,
        ),
      },
    };
  }

  /** Durable descriptions retain original nested failures while the sampler keeps their actual unknown values. */
  export function sourceFailures(
    drawn: ReturnType<typeof HumanInspectionCurves.of>,
  ): Record<string, unknown>[] {
    return (drawn.sourceFailures ?? []).map(
      (
        failure: HumanInspectionCurves.ISourceFailure,
      ): Record<string, unknown> => ({
        part: failure.part,
        phase: failure.phase,
        error: R.message(failure.error),
      }),
    );
  }

  /** Parsed JSON is narrowed before inspecting receipt fields. */
  export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
