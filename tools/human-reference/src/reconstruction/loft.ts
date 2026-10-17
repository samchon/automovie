import { IAutoMovieContourLoft64 } from "../../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import { IAutoMovieCurve64 } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { tessellateAutoMovieContourLoft64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourLoft64.ts";
import type { IAutoMovieModel } from "../../../../packages/interface/src/model/IAutoMovieModel.ts";
import { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";

interface Span {
  p0: IAutoMovieCurve64.Vector;
  p1: IAutoMovieCurve64.Vector;
  p2: IAutoMovieCurve64.Vector;
  p3: IAutoMovieCurve64.Vector;
  t0: number;
  t1: number;
}
interface Loop {
  winding: 1 | -1;
  segments: Span[];
  fitPolicy?: string;
}
interface Event {
  y: number;
  y0: number;
  y1: number;
  point: IAutoMovieCurve64.Vector;
  below: { loop: number }[];
  above: { loop: number }[];
  lowerLinkComponents: number;
  upperLinkComponents: number;
  manifoldLink: boolean;
  equalHeightNeighbour: boolean;
}
interface Document {
  gate: string;
  units: string;
  frame: string;
  pose: string;
  source: { file: string; sha256: string };
  slices: { y: number; loops: Loop[] }[];
  events: Event[];
}

/**
 * Converts saved curve controls and event relationships into engine input, then publishes its typed model.
 * Geometry evaluation, correspondence, topology and normal generation belong to the engine operator.
 * The only geometric input key is fittedSections; original meshes and sampled normals are not read.
 * Dense fitted section replay remains a diagnostic, not a compact anatomical parameter family.
 *
 * @evidence contracts/common.md#principled-implementation Saved cubic controls and declared contour incidence pass through the repository engine tessellator to a new typed model.
 * @evidence contracts/common.md#clear-and-simple-design The adapter performs manifest admission, contract conversion and immutable artifact publication; the engine owns geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the fittedSections input is read, with no source vertices, topology or normal-field fallback.
 * @evidence contracts/common.md#meaningful-documentation Separates dense diagnostic replay, engine ownership and the unsupported compact-family claim.
 * @evidence contracts/performance.md#efficient-algorithms Contract conversion visits each saved span once; correspondence and tessellation complexity belong to the engine operator.
 * @evidence contracts/performance.md#reuse-equivalent-work The single generated result supplies both the model and actual construction records without a second surface evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Arrays remain local to this one invocation and immutable publication opens no retained runtime handle.
 */
export function loft(manifestPath: string, outputDir: string): void {
  const manifest: ReferenceManifest = readManifest(manifestPath);
  const document: Document = readInput<Document>(manifest, "fittedSections");
  if (
    document.gate !== manifest.gate ||
    document.units !== manifest.units ||
    document.frame !== manifest.frame ||
    document.pose !== manifest.pose
  )
    throw new Error(
      "Fitted curve identity does not match the declared input frame",
    );
  const sourceCommit: unknown = manifest.metadata?.sourceCommit;
  if (typeof sourceCommit !== "string" || !/^[a-f0-9]{40}$/.test(sourceCommit))
    throw new Error("A committed generating source snapshot is required");
  const input: IAutoMovieContourLoft64 = {
    chordToleranceMm: 0.05,
    sections: document.slices.map(
      (
        slice: Document["slices"][number],
        si: number,
      ): IAutoMovieContourLoft64.ISection => ({
        coordinateMm: slice.y,
        loops: slice.loops.map(
          (
            loop: Loop,
            li: number,
          ): IAutoMovieContourLoft64.ISection["loops"][number] => ({
            winding: loop.winding,
            curve: {
              type: "cubicBezier",
              name: `section.${si}.loop.${li}`,
              closed: true,
              unit: "mm",
              phaseUnit: "normalized",
              phaseIntervals: loop.segments.map(
                (span: Span): number => span.t1 - span.t0,
              ),
              spans: loop.segments.map(
                (span: Span): IAutoMovieCurve64.Span => [
                  span.p0,
                  span.p1,
                  span.p2,
                  span.p3,
                ],
              ),
            },
          }),
        ),
      }),
    ),
    events: document.events.map(
      (event: Event, i: number): IAutoMovieContourLoft64.IEvent => ({
        name: `critical.${i}`,
        coordinateMm: event.y,
        beforeMm: event.y0,
        afterMm: event.y1,
        before: event.below.map(
          (incident: { loop: number }): number => incident.loop,
        ),
        after: event.above.map(
          (incident: { loop: number }): number => incident.loop,
        ),
        kind:
          event.lowerLinkComponents === 0
            ? "minimum"
            : event.upperLinkComponents === 0
              ? "maximum"
              : "saddle",
        regular: event.manifoldLink && !event.equalHeightNeighbour,
        terminal:
          event.lowerLinkComponents === 0 || event.upperLinkComponents === 0
            ? event.point
            : null,
      }),
    ),
  };
  const generated: IAutoMovieContourLoft64.IResult =
    tessellateAutoMovieContourLoft64(input);
  const model: IAutoMovieModel = {
    id: `curve-reconstruction-${manifest.gate}`,
    name: null,
    origin: "generated",
    parts: [
      {
        id: "curve-loft",
        name: null,
        geometry: { type: "mesh", mesh: generated.mesh },
        material: null,
        attachedBone: null,
        transform: null,
      },
    ],
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  const inputSpans: number = document.slices.reduce(
    (sum: number, slice: Document["slices"][number]): number =>
      sum +
      slice.loops.reduce(
        (n: number, loop: Loop): number => n + loop.segments.length,
        0,
      ),
    0,
  );
  const artifact: { path: string; sha256: string } = writeArtifact(
    outputDir,
    "model.json",
    {
      schema: "human-reference-engine-model-v1",
      model,
      construction: { units: "m", lines: generated.construction },
      counts: {
        vertices: generated.mesh.positions.length / 3,
        triangles: generated.mesh.indices!.length / 3,
        inputSections: input.sections.length,
        inputCubicSpans: inputSpans,
        inputControlScalars: inputSpans * 12,
      },
      provenance: {
        inputKeys: ["fittedSections"],
        inputHashes: { fittedSections: manifest.files.fittedSections.sha256 },
        sourceCommit,
        manifest: { file: manifestPath, sha256: sha256(manifestPath) },
        observationSource: document.source,
        engineOperators: [
          "tessellateAutoMovieContourLoft64",
          "planAutoMovieContourWalks64",
          "tessellateAutoMovieContourStrip64",
          "AutoMovieContourLoftCurves64.tessellate",
          "AutoMovieBernsteinSubdivision64.split",
        ],
        frame: manifest.frame,
        inputUnits: "mm",
        outputUnits: "m",
        pose: manifest.pose,
        generatedAt: new Date().toISOString(),
      },
      unresolved: generated.unresolved,
      limits: [
        "Dense section fitting re-encodes many source edges and is a diagnostic baseline, not a compact shared anatomical equation.",
        "Unconsumed semantic regional curve families and unsupported parameter variation remain explicit work.",
        "Curve chord error and curve-fit certificates are not full-surface error bounds or visual acceptance.",
        "Every output position, face and normal is generated by the engine; no source mesh fallback or shading field is consumed.",
      ],
    },
  );
  console.log(
    JSON.stringify({
      gate: manifest.gate,
      artifact,
      vertices: generated.mesh.positions.length / 3,
      triangles: generated.mesh.indices!.length / 3,
      unresolved: generated.unresolved.length,
    }),
  );
}
