import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import zlib from "node:zlib";

import { AutoMovieCurveMath64 as M } from "../../../engine/src/geometry/curve/AutoMovieCurveMath64";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type ObjectValue = { [key: string]: Json };

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
    throw new Error("Expected handoff, frozen manifest, subject, output.json.gz, source commit and source script");
  const [handoffPath, frozenPath, subject, outputPath, sourceCommit, sourceScript]: string[] = args;
  if (!/^[0-9a-f]{40}$/.test(sourceCommit!))
    throw new Error("A committed generating source identity is required");
  if (fs.existsSync(outputPath!) || fs.existsSync(outputPath! + ".receipt.json"))
    throw new Error("Preserve prior publication");
  const hash: (bytes: crypto.BinaryLike) => string = (
    bytes: crypto.BinaryLike,
  ): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const MiB = 1024 * 1024;
  const limits = {
    originalCurveBytes: 160 * MiB, continuationBytes: 16 * MiB,
    publicationBytes: 16 * MiB, publicationLogicalBytes: 80 * MiB,
    recordBytes: 4 * MiB, outputLogicalBytes: 512 * MiB,
    outputGzipBytes: 128 * MiB, receiptBytes: 32 * 1024,
    diskFloorBytes: 3 * 1024 * MiB,
    maximumRssKiB: 4 * 1024 * 1024,
  };
  const initialSpace = fs.statfsSync(path.dirname(outputPath!));
  if (initialSpace.bavail * initialSpace.bsize <
      limits.diskFloorBytes + limits.outputGzipBytes + limits.receiptBytes)
    throw new Error("Initial publication budget must retain the free-space floor");
  const readRecord = (record: ObjectValue, maximum: number): ObjectValue => {
    if (!record || typeof record.path !== "string" ||
        typeof record.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(record.sha256) ||
        typeof record.bytes !== "number" || !Number.isSafeInteger(record.bytes) ||
        record.bytes <= 0 || record.bytes > maximum ||
        fs.statSync(record.path).size !== record.bytes)
      throw new Error("Bounded artifact path, exact bytes and SHA-256 required");
    const bytes = fs.readFileSync(record.path);
    if (hash(bytes) !== record.sha256) throw new Error("Artifact identity mismatch");
    let logical = bytes;
    if (record.codec !== undefined) {
      if (record.codec !== "gzip" || typeof record.logicalBytes !== "number" ||
          !Number.isSafeInteger(record.logicalBytes) ||
          record.logicalBytes <= 0 || record.logicalBytes > limits.publicationLogicalBytes ||
          typeof record.logicalSha256 !== "string")
        throw new Error("Bounded gzip publication identity required");
      logical = zlib.gunzipSync(bytes, { maxOutputLength: limits.publicationLogicalBytes });
      if (logical.length !== record.logicalBytes || hash(logical) !== record.logicalSha256)
        throw new Error("Logical publication identity mismatch");
    }
    return JSON.parse(logical.toString()) as ObjectValue;
  };
  if (fs.statSync(handoffPath!).size > limits.recordBytes ||
      fs.statSync(frozenPath!).size > limits.recordBytes)
    throw new Error("Research manifest exceeds its admitted byte budget");
  const handoffBytes: Buffer = fs.readFileSync(handoffPath!);
  const handoff: ObjectValue = JSON.parse(handoffBytes.toString()) as ObjectValue;
  if (handoff.schema !== "actual-whole-coefficient-construction-handoff-v1" ||
      typeof handoff.sourceCommit !== "string" || !/^[0-9a-f]{40}$/.test(handoff.sourceCommit) ||
      !Array.isArray(handoff.subjects))
    throw new Error("Versioned whole coefficient handoff required");
  const rows: ObjectValue[] = handoff.subjects as ObjectValue[];
  const selected: ObjectValue[] = rows.filter(
    (row: ObjectValue): boolean => row.subject === subject,
  );
  if (selected.length !== 1) throw new Error("Unique saved subject required");
  const summaryRecord: ObjectValue = selected[0]!.summary as ObjectValue;
  const summary = readRecord(summaryRecord, limits.recordBytes);
  if (summary.schema !== "whole-shared-ordinary-event-reconstruction-v1" ||
      summary.subject !== subject || summary.sourceCommit !== handoff.sourceCommit)
    throw new Error("Summary subject, schema and consuming epoch must agree");
  const curveRecord: ObjectValue = summary.originalCurve as ObjectValue;
  const bundle = readRecord(curveRecord, limits.originalCurveBytes);
  if (bundle.schema !== "automovie-recovery-curves-v1")
    throw new Error("Versioned cubic observation bundle required");
  const continuationRecord = summary.originalContinuation as ObjectValue;
  const continuation = readRecord(continuationRecord, limits.continuationBytes);
  const publicationRecord = selected[0]!.analyticPublication as ObjectValue;
  const publication = readRecord(publicationRecord, limits.publicationBytes);
  const selectionRecord = selected[0]!.selection as ObjectValue;
  const selection = readRecord(selectionRecord, limits.recordBytes);
  const continuationProvenance = continuation.provenance as ObjectValue;
  if (continuation.schema !== "automovie-recovery-open-continuation-v1" ||
      continuationProvenance?.curveBundleSha256 !== curveRecord.sha256 ||
      publication.schema !== "automovie-recovery-analytic-publication-v1" ||
      publication.curveBundleSha256 !== curveRecord.sha256 ||
      publication.continuationSha256 !== continuationRecord.sha256 ||
      publication.sourceCommit !== selected[0]!.coefficientSourceCommit ||
      selection.sourceCommit !== publication.sourceCommit ||
      summary.coefficientSourceCommit !== publication.sourceCommit)
    throw new Error("Original observations, continuation and consumed coefficient epochs disagree");
  const overrides = publication.curveOverrides as ObjectValue[];
  const overrideNames = selected[0]!.curveOverrideNames as string[];
  if (!Array.isArray(overrides) || !Array.isArray(overrideNames) ||
      overrides.length !== overrideNames.length ||
      new Set(overrideNames).size !== overrideNames.length ||
      selection.selectedCurveOverrides !== overrides.length ||
      overrides.some((row, i) => (row.curve as ObjectValue)?.name !== overrideNames[i]))
    throw new Error("Consumed override inventory differs from the handoff");
  const domains = publication.analyticDomains as ObjectValue[];
  const recipes = selected[0]!.recipes as ObjectValue[];
  if (!Array.isArray(domains) || !Array.isArray(recipes) || recipes.length !== domains.length ||
      recipes.some((recipe, i) => recipe.domainId !== domains[i]!.id ||
        recipe.jsonPointer !== `/analyticDomains/${i}/geometry` ||
        recipe.recipeSha256 !== hash(JSON.stringify(domains[i]!.geometry))))
    throw new Error("Consumed analytic recipe coefficients differ from the handoff");
  const frozenBytes: Buffer = fs.readFileSync(frozenPath!);
  const frozen: ObjectValue = JSON.parse(frozenBytes.toString()) as ObjectValue;
  if (!Array.isArray(frozen.subjects))
    throw new Error("Frozen subject inventory required");
  const inputs: ObjectValue[] = (frozen.subjects as ObjectValue[]).filter(
    (row: ObjectValue): boolean => row.id === subject,
  );
  if (inputs.length !== 1) throw new Error("Unique frozen subject required");
  const sourceInput: ObjectValue = inputs[0]!.algorithm_mesh_input as ObjectValue;
  const frame: ObjectValue = inputs[0]!.frame as ObjectValue;
  const format: ObjectValue = frozen.algorithm_mesh_input_format as ObjectValue;
  const registration: ObjectValue = bundle.registration as ObjectValue;
  if (!sourceInput || typeof sourceInput.path !== "string" ||
      typeof sourceInput.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(sourceInput.sha256) ||
      !frame || frame.unit !== "mm" || frame.axes !== "+X subject-left; +Y up; +Z front" ||
      frame.origin !== "native root unchanged" || frame.pose !== "native neutral A pose" ||
      frame.post_scale !== 1 || frame.floor_shift_mm !== 0 ||
      !format || typeof format.frame !== "string" ||
      !registration || registration.units !== "mm" ||
      registration.frame !== "+X subject-left, +Y up, +Z front, native root origin, mm" ||
      registration.pose !== "native-A")
    throw new Error("Explicit frozen and observed millimetre frames and poses required");
  const provenance: ObjectValue = bundle.provenance as ObjectValue;
  const sources: ObjectValue[] = provenance.sources as ObjectValue[];
  if (!Array.isArray(sources) || sources.length !== 1 ||
      sources[0]!.sha256 !== sourceInput.sha256 ||
      JSON.stringify(continuationProvenance.registration) !== JSON.stringify(registration) ||
      JSON.stringify(continuationProvenance.sources) !== JSON.stringify(sources))
    throw new Error("Curves do not name this frozen source hash");

  let curves: number = 0;
  let spans: number = 0;
  const parameterUnits: Record<string, { curves: number; spans: number; minimumWidth: number; maximumWidth: number }> = {};
  let maximumControlResidualMm: number = 0;
  let sampleMaximumResidualMm: number = 0;
  let horizontalSpans: number = 0;
  const samples: number[] = [0, 0.125, 0.375, 0.625, 0.875, 1];
  const visit: (value: Json) => Json = (value: Json): Json => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      for (let i: number = 0; i < value.length; ++i) value[i] = visit(value[i]!);
      return value;
    }
    if (typeof value.type === "string" && "spans" in value) {
      if (value.type !== "cubicBezier")
        throw new Error("No higher-degree or rational reduction is supported");
      if (typeof value.name !== "string" || typeof value.closed !== "boolean" ||
          value.unit !== "mm" || !["mm", "turn", "normalized"].includes(value.phaseUnit as string))
        throw new Error("Declared spatial and independent parameter units required");
      const controls: M.Span[] = value.spans as M.Span[];
      const widths: number[] = value.phaseIntervals as number[];
      if (!Array.isArray(controls) || !Array.isArray(widths) ||
          controls.length === 0 || controls.length !== widths.length)
        throw new Error("Each native span requires its own parameter width");
      const unit = value.phaseUnit as string;
      const unitCounts = parameterUnits[unit] ??= { curves: 0, spans: 0, minimumWidth: Infinity, maximumWidth: 0 };
      ++unitCounts.curves;
      const knots = value.canonicalKnots as number[] | undefined;
      if (knots !== undefined && (!Array.isArray(knots) ||
          knots.length !== widths.length + 1 || knots.some((x) => !Number.isFinite(x))))
        throw new Error("Saved canonical knots must cover every native span");
      let parameter = knots?.[0] ?? 0;
      const converted: Json[] = controls.map((net: M.Span, i: number): Json => {
        const width: number = widths[i]!;
        const jets: ReturnType<typeof M.toHermite> = M.toHermite(net, width);
        const restored: M.Span = M.hermite(jets.start, jets.end, jets.startDerivative, jets.endDerivative, width);
        for (let j: number = 0; j < 4; ++j)
          maximumControlResidualMm = Math.max(maximumControlResidualMm,
            Math.hypot(...restored[j]!.map((x: number, k: number): number => x - net[j]![k]!)));
        for (const t of samples) {
          const bernstein: number[] = [(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3];
          const hermite: number[] = [2*t**3-3*t*t+1, -2*t**3+3*t*t, t**3-2*t*t+t, t**3-t*t];
          const error: number[] = [0,1,2].map((k: number): number => {
            const b: number = bernstein.reduce((sum: number, weight: number, j: number): number => sum + weight*net[j]![k]!, 0);
            const h: number = hermite[0]!*jets.start[k]! + hermite[1]!*jets.end[k]! + width*(hermite[2]!*jets.startDerivative[k]! + hermite[3]!*jets.endDerivative[k]!);
            return b-h;
          });
          sampleMaximumResidualMm = Math.max(sampleMaximumResidualMm, Math.hypot(...error));
        }
        if (!Number.isFinite(maximumControlResidualMm + sampleMaximumResidualMm))
          throw new Error("Unresolved numerical equivalence");
        const startParameter: number = parameter;
        parameter += width;
        if (!Number.isFinite(parameter) || parameter <= startParameter)
          throw new Error("Native cumulative parameter interval is unresolved");
        if (knots && (knots[i + 1]! <= knots[i]! ||
            Math.abs(knots[i + 1]! - parameter) >
              64 * Number.EPSILON * Math.max(1, Math.abs(parameter), Math.abs(knots[i + 1]!))))
          throw new Error("Canonical knots and original phase widths disagree");
        unitCounts.minimumWidth = Math.min(unitCounts.minimumWidth, width);
        unitCounts.maximumWidth = Math.max(unitCounts.maximumWidth, width);
        ++unitCounts.spans;
        horizontalSpans += net.every((p: M.V): boolean => p[1] === net[0][1]) ? 1 : 0;
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
  const originalObservationCounts = { curves, spans };
  const convertedPublication = visit(publication);
  const consumedOverrideCounts = { curves: curves - originalObservationCounts.curves, spans: spans - originalObservationCounts.spans };
  if (consumedOverrideCounts.curves !== overrides.length ||
      recipes.some((recipe, i) => recipe.recipeSha256 !== hash(JSON.stringify(domains[i]!.geometry))))
    throw new Error("Curve conversion must retain every override and unchanged bicubic recipe");
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
      "../../../engine/src/geometry/curve/AutoMovieCurveMath64",
      "../../../engine/src/geometry/curve/AutoMoviePchip64",
    ].map((specifier) => {
      const loaded = require.resolve(specifier);
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
    relationshipInputs: { continuation: continuationRecord, publication: publicationRecord, selection: selectionRecord },
    sourceHandoffSha256: hash(handoffBytes),
    frozenManifestSha256: hash(frozenBytes),
    originalSchema: "automovie-recovery-curves-v1",
    originalPublicationSchema: "automovie-recovery-analytic-publication-v1",
    conversion: {
      method: "Endpoint derivatives 3*(B1-B0)/h and 3*(B3-B2)/h; no refit",
      intervalMeaning: "Original phaseIntervals; never world-Y differences or unit tangents",
      direction: "Original increasing phase order, closure and orientation retained; no reversal",
      parameterOrigin: "Saved canonicalKnots[0] when present; otherwise the original bundle's zero-based span accumulation",
      arithmetic: "Binary64 fixed quotient orders; no arbitrary-precision or bitwise round-trip claim",
      supported: "Only exactly four finite controls with positive finite parameter width",
      curves, spans, parameterUnits, originalObservationCounts, consumedOverrideCounts, horizontalSpans,
      maximumControlResidualMm, sampleMaximumResidualMm,
      sampleFractions: samples,
      residualMeaning: "Observed representation arithmetic only; no fit or full-surface bound",
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
    throw new Error("Hermite logical publication exceeds its explicit byte budget");
  const compressed: Buffer = zlib.gzipSync(logical, { level: 6 });
  if (compressed.length > limits.outputGzipBytes)
    throw new Error("Hermite gzip publication exceeds its explicit byte budget");
  const receipt: ObjectValue = {
    schema: "automovie-reference-hermite-research-receipt-v2",
    outputPath: outputPath!,
    sha256: hash(compressed), bytes: compressed.length,
    logicalSha256: hash(logical), logicalBytes: logical.length,
    generatingSourceCommit: sourceCommit!,
    subject: subject!, conversion: result.conversion!,
    maximumRssKiB: process.resourceUsage().maxRSS,
    resourceLimits: limits,
  };
  const receiptBytes = Buffer.from(JSON.stringify(receipt, null, 2) + "\n");
  const space = fs.statfsSync(path.dirname(outputPath!));
  if (receiptBytes.length > limits.receiptBytes ||
      process.resourceUsage().maxRSS > limits.maximumRssKiB ||
      space.bavail * space.bsize - compressed.length - receiptBytes.length < limits.diskFloorBytes)
    throw new Error("Publication must retain the free-space floor and receipt budget");
  fs.writeFileSync(outputPath!, compressed, { flag: "wx" });
  fs.writeFileSync(outputPath! + ".receipt.json", receiptBytes, { flag: "wx" });
  console.log(JSON.stringify(receipt));
}

convertReferenceCurvesToHermite();
