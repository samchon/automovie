import fs from "node:fs";
import crypto from "node:crypto";
import zlib from "node:zlib";

import { AutoMovieCurveMath64 as M } from "../../../engine/src/geometry/curve/AutoMovieCurveMath64";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type ObjectValue = { [key: string]: Json };

/**
 * Convert one hash-bound saved specimen without fitting or reading source geometry.
 * This private research representation preserves every noncurve field, including
 * incidence, events, gaps, orientation and unsupported domains. It is not admitted
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
  const handoffBytes: Buffer = fs.readFileSync(handoffPath!);
  const handoff: ObjectValue = JSON.parse(handoffBytes.toString()) as ObjectValue;
  if (handoff.schema !== "actual-whole-coefficient-construction-handoff-v1" ||
      !Array.isArray(handoff.subjects))
    throw new Error("Versioned whole coefficient handoff required");
  const rows: ObjectValue[] = handoff.subjects as ObjectValue[];
  const selected: ObjectValue[] = rows.filter(
    (row: ObjectValue): boolean => row.subject === subject,
  );
  if (selected.length !== 1) throw new Error("Unique saved subject required");
  const summaryRecord: ObjectValue = selected[0]!.summary as ObjectValue;
  const summaryBytes: Buffer = fs.readFileSync(summaryRecord.path as string);
  if (hash(summaryBytes) !== summaryRecord.sha256)
    throw new Error("Saved summary identity mismatch");
  const summary: ObjectValue = JSON.parse(summaryBytes.toString()) as ObjectValue;
  const curveRecord: ObjectValue = summary.originalCurve as ObjectValue;
  const curveBytes: Buffer = fs.readFileSync(curveRecord.path as string);
  if (hash(curveBytes) !== curveRecord.sha256)
    throw new Error("Saved curve identity mismatch");
  const bundle: ObjectValue = JSON.parse(curveBytes.toString()) as ObjectValue;
  if (bundle.schema !== "automovie-recovery-curves-v1")
    throw new Error("Versioned cubic observation bundle required");
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
      sources[0]!.sha256 !== sourceInput.sha256)
    throw new Error("Curves do not name this frozen source hash");

  let curves: number = 0;
  let spans: number = 0;
  let minimumWidth: number = Infinity;
  let maximumWidth: number = 0;
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
      let parameter: number = 0;
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
        minimumWidth = Math.min(minimumWidth, width);
        maximumWidth = Math.max(maximumWidth, width);
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
  if (curves === 0) throw new Error("No supported observed curves found");
  bundle.schema = "automovie-reference-hermite-bundle-v1";
  const result: ObjectValue = {
    schema: "automovie-reference-hermite-research-v1",
    createdAt: new Date().toISOString(),
    generatingSourceCommit: sourceCommit!,
    sourceScriptSha256: hash(fs.readFileSync(sourceScript!)),
    loadedScriptSha256: hash(fs.readFileSync(__filename)),
    sourceScript: sourceScript!,
    loadedScript: __filename,
    subject: subject!,
    input: sourceInput,
    frame,
    algorithmMeshInputFormat: format,
    observationRegistration: registration,
    sourceBundle: curveRecord,
    sourceHandoffSha256: hash(handoffBytes),
    frozenManifestSha256: hash(frozenBytes),
    originalSchema: "automovie-recovery-curves-v1",
    conversion: {
      method: "Endpoint derivatives 3*(B1-B0)/h and 3*(B3-B2)/h; no refit",
      intervalMeaning: "Original phaseIntervals; never world-Y differences or unit tangents",
      direction: "Original increasing phase order, closure and orientation retained; no reversal",
      parameterOrigin: 0,
      arithmetic: "Binary64 fixed quotient orders; no arbitrary-precision or bitwise round-trip claim",
      supported: "Only exactly four finite controls with positive finite parameter width",
      curves, spans, minimumWidth, maximumWidth, horizontalSpans,
      maximumControlResidualMm, sampleMaximumResidualMm,
      sampleFractions: samples,
      residualMeaning: "Observed representation arithmetic only; no fit or full-surface bound",
    },
    limitations: [
      "Specimen observations, not anatomical equations or Human controls",
      "Every noncurve field, unsupported region and relationship is retained",
      "Changing representation does not repair recovery bands or omitted geometry",
      "Closure, incidence and continuity declarations are preserved rather than certified",
      "No source geometry or normal is read; input mesh hash is a provenance identity",
    ],
    bundle: converted,
  };
  const logical: Buffer = Buffer.from(JSON.stringify(result) + "\n");
  const compressed: Buffer = zlib.gzipSync(logical, { level: 6 });
  fs.writeFileSync(outputPath!, compressed, { flag: "wx" });
  const receipt: ObjectValue = {
    schema: "automovie-reference-hermite-research-receipt-v1",
    outputPath: outputPath!,
    sha256: hash(compressed), bytes: compressed.length,
    logicalSha256: hash(logical), logicalBytes: logical.length,
    generatingSourceCommit: sourceCommit!,
    subject: subject!, conversion: result.conversion!,
    maximumRssKiB: process.resourceUsage().maxRSS,
  };
  fs.writeFileSync(outputPath! + ".receipt.json", JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify(receipt));
}

convertReferenceCurvesToHermite();
