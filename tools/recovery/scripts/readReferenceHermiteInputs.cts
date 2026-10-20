import crypto from "node:crypto";
import fs from "node:fs";
import zlib from "node:zlib";

/** Raw JSON preserved through input identity and relation validation. */
type Json = null | boolean | number | string | Json[] | ObjectValue;

/** A raw JSON object whose protocol fields are checked before consumption. */
interface ObjectValue {
  [key: string]: Json;
}

/** Byte budgets used while reading the saved research inputs. */
interface ReferenceHermiteInputLimits {
  originalCurveBytes: number;
  continuationBytes: number;
  publicationBytes: number;
  publicationLogicalBytes: number;
  recordBytes: number;
}

/** Identity-bound observations and their consumed relationship records. */
interface ReferenceHermiteInputs {
  handoffBytes: Buffer;
  handoff: ObjectValue;
  summaryRecord: ObjectValue;
  summary: ObjectValue;
  curveRecord: ObjectValue;
  bundle: ObjectValue;
  continuationRecord: ObjectValue;
  continuation: ObjectValue;
  publicationRecord: ObjectValue;
  publication: ObjectValue;
  selectionRecord: ObjectValue;
  selection: ObjectValue;
  selected: ObjectValue[];
  overrides: ObjectValue[];
  domains: ObjectValue[];
  recipes: ObjectValue[];
  frozenBytes: Buffer;
  sourceInput: ObjectValue;
  frame: ObjectValue;
  format: ObjectValue;
  registration: ObjectValue;
}

/** Read bounded artifacts and bind their identities, coefficients and frame. */
export function readReferenceHermiteInputs(
  handoffPath: string,
  frozenPath: string,
  subject: string,
  limits: ReferenceHermiteInputLimits,
): ReferenceHermiteInputs {
  const hash: (bytes: crypto.BinaryLike) => string = (
    bytes: crypto.BinaryLike,
  ): string => crypto.createHash("sha256").update(bytes).digest("hex");
  const readRecord: (record: ObjectValue, maximum: number) => ObjectValue = (
    record: ObjectValue,
    maximum: number,
  ): ObjectValue => {
    if (
      !record ||
      typeof record.path !== "string" ||
      typeof record.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(record.sha256) ||
      typeof record.bytes !== "number" ||
      !Number.isSafeInteger(record.bytes) ||
      record.bytes <= 0 ||
      record.bytes > maximum ||
      fs.statSync(record.path).size !== record.bytes
    )
      throw new Error(
        "Bounded artifact path, exact bytes and SHA-256 required",
      );
    const bytes: Buffer = fs.readFileSync(record.path);
    if (hash(bytes) !== record.sha256)
      throw new Error("Artifact identity mismatch");
    let logical: Buffer = bytes;
    if (record.codec !== undefined) {
      if (
        record.codec !== "gzip" ||
        typeof record.logicalBytes !== "number" ||
        !Number.isSafeInteger(record.logicalBytes) ||
        record.logicalBytes <= 0 ||
        record.logicalBytes > limits.publicationLogicalBytes ||
        typeof record.logicalSha256 !== "string"
      )
        throw new Error("Bounded gzip publication identity required");
      logical = zlib.gunzipSync(bytes, {
        maxOutputLength: limits.publicationLogicalBytes,
      });
      if (
        logical.length !== record.logicalBytes ||
        hash(logical) !== record.logicalSha256
      )
        throw new Error("Logical publication identity mismatch");
    }
    return JSON.parse(logical.toString()) as ObjectValue;
  };
  if (
    fs.statSync(handoffPath!).size > limits.recordBytes ||
    fs.statSync(frozenPath!).size > limits.recordBytes
  )
    throw new Error("Research manifest exceeds its admitted byte budget");
  const handoffBytes: Buffer = fs.readFileSync(handoffPath!);
  const handoff: ObjectValue = JSON.parse(
    handoffBytes.toString(),
  ) as ObjectValue;
  if (
    handoff.schema !== "actual-whole-coefficient-construction-handoff-v1" ||
    typeof handoff.sourceCommit !== "string" ||
    !/^[0-9a-f]{40}$/.test(handoff.sourceCommit) ||
    !Array.isArray(handoff.subjects)
  )
    throw new Error("Versioned whole coefficient handoff required");
  const rows: ObjectValue[] = handoff.subjects as ObjectValue[];
  const selected: ObjectValue[] = rows.filter(
    (row: ObjectValue): boolean => row.subject === subject,
  );
  if (selected.length !== 1) throw new Error("Unique saved subject required");
  const summaryRecord: ObjectValue = selected[0]!.summary as ObjectValue;
  const summary: ObjectValue = readRecord(summaryRecord, limits.recordBytes);
  if (
    summary.schema !== "whole-shared-ordinary-event-reconstruction-v1" ||
    summary.subject !== subject ||
    summary.sourceCommit !== handoff.sourceCommit
  )
    throw new Error("Summary subject, schema and consuming epoch must agree");
  const curveRecord: ObjectValue = summary.originalCurve as ObjectValue;
  const bundle: ObjectValue = readRecord(
    curveRecord,
    limits.originalCurveBytes,
  );
  if (bundle.schema !== "automovie-recovery-curves-v1")
    throw new Error("Versioned cubic observation bundle required");
  const continuationRecord: ObjectValue =
    summary.originalContinuation as ObjectValue;
  const continuation: ObjectValue = readRecord(
    continuationRecord,
    limits.continuationBytes,
  );
  const publicationRecord: ObjectValue = selected[0]!
    .analyticPublication as ObjectValue;
  const publication: ObjectValue = readRecord(
    publicationRecord,
    limits.publicationBytes,
  );
  const selectionRecord: ObjectValue = selected[0]!.selection as ObjectValue;
  const selection: ObjectValue = readRecord(
    selectionRecord,
    limits.recordBytes,
  );
  const continuationProvenance: ObjectValue =
    continuation.provenance as ObjectValue;
  if (
    continuation.schema !== "automovie-recovery-open-continuation-v1" ||
    continuationProvenance?.curveBundleSha256 !== curveRecord.sha256 ||
    publication.schema !== "automovie-recovery-analytic-publication-v1" ||
    publication.curveBundleSha256 !== curveRecord.sha256 ||
    publication.continuationSha256 !== continuationRecord.sha256 ||
    publication.sourceCommit !== selected[0]!.coefficientSourceCommit ||
    selection.sourceCommit !== publication.sourceCommit ||
    summary.coefficientSourceCommit !== publication.sourceCommit
  )
    throw new Error(
      "Original observations, continuation and consumed coefficient epochs disagree",
    );
  const overrides: ObjectValue[] = publication.curveOverrides as ObjectValue[];
  const overrideNames: string[] = selected[0]!.curveOverrideNames as string[];
  if (
    !Array.isArray(overrides) ||
    !Array.isArray(overrideNames) ||
    overrides.length !== overrideNames.length ||
    new Set(overrideNames).size !== overrideNames.length ||
    selection.selectedCurveOverrides !== overrides.length ||
    overrides.some(
      (row: ObjectValue, i: number): boolean =>
        (row.curve as ObjectValue)?.name !== overrideNames[i],
    )
  )
    throw new Error("Consumed override inventory differs from the handoff");
  const domains: ObjectValue[] = publication.analyticDomains as ObjectValue[];
  const recipes: ObjectValue[] = selected[0]!.recipes as ObjectValue[];
  if (
    !Array.isArray(domains) ||
    !Array.isArray(recipes) ||
    recipes.length !== domains.length ||
    recipes.some(
      (recipe: ObjectValue, i: number): boolean =>
        recipe.domainId !== domains[i]!.id ||
        recipe.jsonPointer !== `/analyticDomains/${i}/geometry` ||
        recipe.recipeSha256 !== hash(JSON.stringify(domains[i]!.geometry)),
    )
  )
    throw new Error(
      "Consumed analytic recipe coefficients differ from the handoff",
    );
  const frozenBytes: Buffer = fs.readFileSync(frozenPath!);
  const frozen: ObjectValue = JSON.parse(frozenBytes.toString()) as ObjectValue;
  if (!Array.isArray(frozen.subjects))
    throw new Error("Frozen subject inventory required");
  const inputs: ObjectValue[] = (frozen.subjects as ObjectValue[]).filter(
    (row: ObjectValue): boolean => row.id === subject,
  );
  if (inputs.length !== 1) throw new Error("Unique frozen subject required");
  const sourceInput: ObjectValue = inputs[0]!
    .algorithm_mesh_input as ObjectValue;
  const frame: ObjectValue = inputs[0]!.frame as ObjectValue;
  const format: ObjectValue = frozen.algorithm_mesh_input_format as ObjectValue;
  const registration: ObjectValue = bundle.registration as ObjectValue;
  if (
    !sourceInput ||
    typeof sourceInput.path !== "string" ||
    typeof sourceInput.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(sourceInput.sha256) ||
    !frame ||
    frame.unit !== "mm" ||
    frame.axes !== "+X subject-left; +Y up; +Z front" ||
    frame.origin !== "native root unchanged" ||
    frame.pose !== "native neutral A pose" ||
    frame.post_scale !== 1 ||
    frame.floor_shift_mm !== 0 ||
    !format ||
    typeof format.frame !== "string" ||
    !registration ||
    registration.units !== "mm" ||
    registration.frame !==
      "+X subject-left, +Y up, +Z front, native root origin, mm" ||
    registration.pose !== "native-A"
  )
    throw new Error(
      "Explicit frozen and observed millimetre frames and poses required",
    );
  const provenance: ObjectValue = bundle.provenance as ObjectValue;
  const sources: ObjectValue[] = provenance.sources as ObjectValue[];
  if (
    !Array.isArray(sources) ||
    sources.length !== 1 ||
    sources[0]!.sha256 !== sourceInput.sha256 ||
    JSON.stringify(continuationProvenance.registration) !==
      JSON.stringify(registration) ||
    JSON.stringify(continuationProvenance.sources) !== JSON.stringify(sources)
  )
    throw new Error("Curves do not name this frozen source hash");

  return {
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
  };
}
