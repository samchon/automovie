import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { readReferenceHermiteInputs } from "./readReferenceHermiteInputs.cjs";

import { AutoMovieCurveMath64 as M } from "../../../packages/engine/src/geometry/curve/AutoMovieCurveMath64";

/** JSON values retained without geometry reconstruction or field coercion. */
type Json = null | boolean | number | string | Json[] | ObjectValue;
/** A parsed record whose named fields are admitted before use. */
interface ObjectValue {
  [key: string]: Json;
}

/** Curve and span inventory at a conversion boundary. */
interface CurveCounts extends ObjectValue {
  curves: number;
  spans: number;
}

/** Counts and native-width extrema for one declared parameter unit. */
interface ParameterCounts extends ObjectValue {
  curves: number;
  spans: number;
  minimumWidth: number;
  maximumWidth: number;
}

/** Explicit input, publication and process budgets for one serial conversion. */
interface ResourceLimits extends ObjectValue {
  originalCurveBytes: number;
  continuationBytes: number;
  publicationBytes: number;
  publicationLogicalBytes: number;
  recordBytes: number;
  outputLogicalBytes: number;
  outputGzipBytes: number;
  receiptBytes: number;
  diskFloorBytes: number;
  maximumRssKiB: number;
}

/**
 * Convert one hash-bound saved specimen without fitting or reading source geometry.
 * This private research representation retains the original observations and the
 * consumed continuation, overrides, selection and analytic coefficient graph.
 * Bicubic surface coefficients remain unchanged. It is not admitted
 * by the recovery reconstruction API and is not a Human parameter document.
 */
export function convertReferenceCurvesToHermite(): void {
  const args: string[] = process.argv.slice(2);
  if (args.length !== 6)
    throw new Error(
      "Expected handoff, frozen manifest, subject, output.json.gz, source commit and source script",
    );
  const [
    handoffPath,
    frozenPath,
    subject,
    outputPath,
    sourceCommit,
    sourceScript,
  ]: string[] = args;
  if (!/^[0-9a-f]{40}$/.test(sourceCommit!))
    throw new Error("A committed generating source identity is required");
  if (
    fs.existsSync(outputPath!) ||
    fs.existsSync(outputPath! + ".receipt.json")
  )
    throw new Error("Preserve prior publication");
  const hash: (bytes: crypto.BinaryLike) => string = (
    bytes: crypto.BinaryLike,
  ): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const MiB: number = 1024 * 1024;
  const limits: ResourceLimits = {
    originalCurveBytes: 160 * MiB,
    continuationBytes: 16 * MiB,
    publicationBytes: 16 * MiB,
    publicationLogicalBytes: 80 * MiB,
    recordBytes: 4 * MiB,
    outputLogicalBytes: 512 * MiB,
    outputGzipBytes: 128 * MiB,
    receiptBytes: 32 * 1024,
    diskFloorBytes: (3 * 1024 + 100) * MiB,
    maximumRssKiB: 4 * 1024 * 1024,
  };
  const initialSpace: fs.StatsFs = fs.statfsSync(path.dirname(outputPath!));
  if (
    initialSpace.bavail * initialSpace.bsize <
    limits.diskFloorBytes + limits.outputGzipBytes + limits.receiptBytes
  )
    throw new Error(
      "Initial publication budget must retain the free-space floor",
    );
  const {
    handoffBytes,
    handoff,
    summaryRecord,
    summary,
    curveRecord,
    bundle,
    continuationRecord,
    continuation,
    publicationRecord,
    publication,
    selectionRecord,
    selection,
    selected,
    overrides,
    domains,
    recipes,
    frozenBytes,
    sourceInput,
    frame,
    format,
    registration,
  }: ReturnType<typeof readReferenceHermiteInputs> = readReferenceHermiteInputs(
    handoffPath!,
    frozenPath!,
    subject!,
    limits,
  );

  let curves: number = 0;
  let spans: number = 0;
  const parameterUnits: Record<string, ParameterCounts> = {};
  let maximumControlResidualMm: number = 0;
  let sampleMaximumResidualMm: number = 0;
  let horizontalSpans: number = 0;
  const samples: number[] = [0, 0.125, 0.375, 0.625, 0.875, 1];
  const visit: (value: Json) => Json = (value: Json): Json => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      for (let i: number = 0; i < value.length; ++i)
        value[i] = visit(value[i]!);
      return value;
    }
    if (typeof value.type === "string" && "spans" in value) {
      if (value.type !== "cubicBezier")
        throw new Error("No higher-degree or rational reduction is supported");
      if (
        typeof value.name !== "string" ||
        typeof value.closed !== "boolean" ||
        value.unit !== "mm" ||
        !["mm", "turn", "normalized"].includes(value.phaseUnit as string)
      )
        throw new Error(
          "Declared spatial and independent parameter units required",
        );
      const controls: M.Span[] = value.spans as M.Span[];
      const widths: number[] = value.phaseIntervals as number[];
      if (
        !Array.isArray(controls) ||
        !Array.isArray(widths) ||
        controls.length === 0 ||
        controls.length !== widths.length
      )
        throw new Error("Each native span requires its own parameter width");
      const unit: string = value.phaseUnit as string;
      const unitCounts: ParameterCounts = (parameterUnits[unit] ??= {
        curves: 0,
        spans: 0,
        minimumWidth: Infinity,
        maximumWidth: 0,
      });
      ++unitCounts.curves;
      const knots: number[] | undefined = value.canonicalKnots as
        | number[]
        | undefined;
      if (
        knots !== undefined &&
        (!Array.isArray(knots) ||
          knots.length !== widths.length + 1 ||
          knots.some((x: number): boolean => !Number.isFinite(x)))
      )
        throw new Error("Saved canonical knots must cover every native span");
      let parameter: number = knots?.[0] ?? 0;
      const converted: Json[] = controls.map((net: M.Span, i: number): Json => {
        const width: number = widths[i]!;
        const jets: ReturnType<typeof M.toHermite> = M.toHermite(net, width);
        const restored: M.Span = M.hermite(
          jets.start,
          jets.end,
          jets.startDerivative,
          jets.endDerivative,
          width,
        );
        for (let j: number = 0; j < 4; ++j)
          maximumControlResidualMm = Math.max(
            maximumControlResidualMm,
            Math.hypot(
              ...restored[j]!.map(
                (x: number, k: number): number => x - net[j]![k]!,
              ),
            ),
          );
        for (const t of samples) {
          const bernstein: number[] = [
            (1 - t) ** 3,
            3 * (1 - t) ** 2 * t,
            3 * (1 - t) * t * t,
            t ** 3,
          ];
          const hermite: number[] = [
            2 * t ** 3 - 3 * t * t + 1,
            -2 * t ** 3 + 3 * t * t,
            t ** 3 - 2 * t * t + t,
            t ** 3 - t * t,
          ];
          const error: number[] = [0, 1, 2].map((k: number): number => {
            const b: number = bernstein.reduce(
              (sum: number, weight: number, j: number): number =>
                sum + weight * net[j]![k]!,
              0,
            );
            const h: number =
              hermite[0]! * jets.start[k]! +
              hermite[1]! * jets.end[k]! +
              width *
                (hermite[2]! * jets.startDerivative[k]! +
                  hermite[3]! * jets.endDerivative[k]!);
            return b - h;
          });
          sampleMaximumResidualMm = Math.max(
            sampleMaximumResidualMm,
            Math.hypot(...error),
          );
        }
        if (
          !Number.isFinite(maximumControlResidualMm + sampleMaximumResidualMm)
        )
          throw new Error("Unresolved numerical equivalence");
        const startParameter: number = parameter;
        parameter += width;
        if (!Number.isFinite(parameter) || parameter <= startParameter)
          throw new Error("Native cumulative parameter interval is unresolved");
        if (
          knots &&
          (knots[i + 1]! <= knots[i]! ||
            Math.abs(knots[i + 1]! - parameter) >
              64 *
                Number.EPSILON *
                Math.max(1, Math.abs(parameter), Math.abs(knots[i + 1]!)))
        )
          throw new Error("Canonical knots and original phase widths disagree");
        unitCounts.minimumWidth = Math.min(unitCounts.minimumWidth, width);
        unitCounts.maximumWidth = Math.max(unitCounts.maximumWidth, width);
        ++unitCounts.spans;
        horizontalSpans += net.every((p: M.V): boolean => p[1] === net[0][1])
          ? 1
          : 0;
        ++spans;
        return { startParameter, endParameter: parameter, width, ...jets };
      });
      ++curves;
      return {
        ...value,
        type: "cubicHermite",
        degree: 3,
        sourceCubicSha256: hash(JSON.stringify(value)),
        derivativeUnit: `mm/${value.phaseUnit as string}`,
        spans: converted,
      };
    }
    for (const key of Object.keys(value)) value[key] = visit(value[key]!);
    return value;
  };
  const converted: Json = visit(bundle);
  const originalObservationCounts: CurveCounts = { curves, spans };
  const convertedPublication: Json = visit(publication);
  const consumedOverrideCounts: CurveCounts = {
    curves: curves - originalObservationCounts.curves,
    spans: spans - originalObservationCounts.spans,
  };
  if (
    consumedOverrideCounts.curves !== overrides.length ||
    recipes.some(
      (recipe: ObjectValue, i: number): boolean =>
        recipe.recipeSha256 !== hash(JSON.stringify(domains[i]!.geometry)),
    )
  )
    throw new Error(
      "Curve conversion must retain every override and unchanged bicubic recipe",
    );
  if (curves === 0) throw new Error("No supported observed curves found");
  bundle.schema = "automovie-reference-hermite-bundle-v1";
  publication.schema = "automovie-reference-hermite-analytic-publication-v1";
  const result: ObjectValue = {
    schema: "automovie-reference-hermite-research-v2",
    createdAt: new Date().toISOString(),
    generatingSourceCommit: sourceCommit!,
    sourceScriptSha256: hash(fs.readFileSync(sourceScript!)),
    loadedScriptSha256: hash(fs.readFileSync(__filename)),
    sourceScript: sourceScript!,
    loadedScript: __filename,
    loadedDependencies: [
      "./readReferenceHermiteInputs.cjs",
      "../../../packages/engine/src/geometry/curve/AutoMovieCurveMath64",
      "../../../packages/engine/src/geometry/curve/AutoMoviePchip64",
    ].map((specifier: string): ObjectValue => {
      const loaded: string = require.resolve(specifier);
      return { path: loaded, sha256: hash(fs.readFileSync(loaded)) };
    }),
    subject: subject!,
    input: sourceInput,
    frame,
    algorithmMeshInputFormat: format,
    observationRegistration: registration,
    sourceBundle: curveRecord,
    sourceSummary: summaryRecord,
    consumingSummary: summary,
    consumingSourceCommit: handoff.sourceCommit!,
    coefficientSourceCommit: publication.sourceCommit!,
    relationshipInputs: {
      continuation: continuationRecord,
      publication: publicationRecord,
      selection: selectionRecord,
    },
    sourceHandoffSha256: hash(handoffBytes),
    frozenManifestSha256: hash(frozenBytes),
    originalSchema: "automovie-recovery-curves-v1",
    originalPublicationSchema: "automovie-recovery-analytic-publication-v1",
    conversion: {
      method: "Endpoint derivatives 3*(B1-B0)/h and 3*(B3-B2)/h; no refit",
      intervalMeaning:
        "Original phaseIntervals; never world-Y differences or unit tangents",
      direction:
        "Original increasing phase order, closure and orientation retained; no reversal",
      parameterOrigin:
        "Saved canonicalKnots[0] when present; otherwise the original bundle's zero-based span accumulation",
      arithmetic:
        "Binary64 fixed quotient orders; no arbitrary-precision or bitwise round-trip claim",
      supported:
        "Only exactly four finite controls with positive finite parameter width",
      curves,
      spans,
      parameterUnits,
      originalObservationCounts,
      consumedOverrideCounts,
      horizontalSpans,
      maximumControlResidualMm,
      sampleMaximumResidualMm,
      sampleFractions: samples,
      residualMeaning:
        "Observed representation arithmetic only; no fit or full-surface bound",
    },
    limitations: [
      "Specimen observations, not anatomical equations or Human controls",
      "Original bundle fields and consumed continuation, selection, overrides and analytic recipes are retained",
      "Only cubic curves change representation; bicubic surface coefficient nets remain unchanged",
      "Changing representation does not repair recovery bands or omitted geometry",
      "Closure, incidence and continuity declarations are preserved rather than certified",
      "No source geometry or normal is read; input mesh hash is a provenance identity",
    ],
    bundle: converted,
    continuation,
    publication: convertedPublication,
    selection,
    handoffSubject: selected[0]!,
    resourceLimits: limits,
  };
  const logical: Buffer = Buffer.from(JSON.stringify(result) + "\n");
  if (logical.length > limits.outputLogicalBytes)
    throw new Error(
      "Hermite logical publication exceeds its explicit byte budget",
    );
  const compressed: Buffer = zlib.gzipSync(logical, { level: 6 });
  if (compressed.length > limits.outputGzipBytes)
    throw new Error(
      "Hermite gzip publication exceeds its explicit byte budget",
    );
  const receipt: ObjectValue = {
    schema: "automovie-reference-hermite-research-receipt-v2",
    outputPath: outputPath!,
    sha256: hash(compressed),
    bytes: compressed.length,
    logicalSha256: hash(logical),
    logicalBytes: logical.length,
    generatingSourceCommit: sourceCommit!,
    subject: subject!,
    conversion: result.conversion!,
    maximumRssKiB: process.resourceUsage().maxRSS,
    resourceLimits: limits,
  };
  const receiptBytes: Buffer = Buffer.from(
    JSON.stringify(receipt, null, 2) + "\n",
  );
  const space: fs.StatsFs = fs.statfsSync(path.dirname(outputPath!));
  if (
    receiptBytes.length > limits.receiptBytes ||
    process.resourceUsage().maxRSS > limits.maximumRssKiB ||
    space.bavail * space.bsize - compressed.length - receiptBytes.length <
      limits.diskFloorBytes
  )
    throw new Error(
      "Publication must retain the free-space floor and receipt budget",
    );
  fs.writeFileSync(outputPath!, compressed, { flag: "wx" });
  fs.writeFileSync(outputPath! + ".receipt.json", receiptBytes, { flag: "wx" });
  console.log(JSON.stringify(receipt));
}

convertReferenceCurvesToHermite();
