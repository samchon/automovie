import type { IAutoMovieModelArchetype } from "@automovie/archetypes";
import {
  type AutoMovieDiagnosticCode,
  type IAutoMovieDiagnostic,
  type IAutoMovieModelRecipe,
} from "@automovie/interface";
import { AUTOMOVIE_DIAGNOSTIC_CODES } from "./AUTOMOVIE_DIAGNOSTIC_CODES";

const DIAGNOSTIC_CODES: ReadonlySet<string> = new Set(AUTOMOVIE_DIAGNOSTIC_CODES);

/**
 * Collect parameter refusals from the recipe's registered archetype contract.
 *
 * Required and supported keys are own data properties: inherited Object
 * members never supply a parameter or a schema rule. The archetype plans raw
 * input before kind and inclusive numeric-bound checks. An absent archetype
 * adds nothing because the graph gate already refuses its registration.
 *
 * @evidence contracts/common.md#principled-implementation Object.hasOwn matches a serialized parameter map's own-key semantics. The registered plan selects required and accepted keys; its schema owns value kinds and inclusive finite numeric bounds.
 * @evidence contracts/common.md#clear-and-simple-design One gate translates archetype facts to design diagnostics, leaving catalogue-specific discrimination in plan and preserving the caller's diagnostic collection and target path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototype names receive the same own-key rules as every other key, and unknown refusal codes are classified as model-parameter-invalid instead of widening the diagnostic union.
 * @evidence contracts/common.md#meaningful-documentation States raw-input planning, own-property ownership, bound inclusivity, absent-registration behavior, and the append-only diagnostic effect.
 * @evidence contracts/performance.md#efficient-algorithms With R required keys, A accepted keys, P present parameters and F plan refusals, the gate takes O(R+A+P+F) time plus the archetype plan and O(A+P) transient storage; the diagnostic population grows with findings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The graph validates each model once per observation; current parameter values and archetype plans decide the result, so no prior validation is reused here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns appended diagnostics; the plan, accepted-key set, and parameter entries are call-local. The module retains only the finite closed diagnostic-code set.
 */
export function validateModelParameters(
  diagnostics: IAutoMovieDiagnostic[],
  model: IAutoMovieModelRecipe,
  archetype: IAutoMovieModelArchetype | undefined,
  target: string,
  file: string,
): void {
  if (archetype === undefined) return;
  function invalid(code: AutoMovieDiagnosticCode, message: string): void {
    diagnostics.push({ code, category: "error", phase: "design", target, path: file, message });
  }
  const plan: ReturnType<IAutoMovieModelArchetype["plan"]> = archetype.plan(model.parameters);
  for (const key of plan.required)
    if (Object.hasOwn(model.parameters, key) === false)
      invalid("model-parameter-missing", `Required parameter "${key}" is missing for ${model.archetype}. Add it in the tracked model recipe record.`);
  for (const refusal of plan.refusals) {
    const registered: boolean = DIAGNOSTIC_CODES.has(refusal.code);
    invalid(
      registered ? refusal.code as AutoMovieDiagnosticCode : "model-parameter-invalid",
      registered ? refusal.message : `Archetype returned unregistered diagnostic code "${refusal.code}". Register a closed AutoMovie diagnostic identity or correct the archetype plan. ${refusal.message}`,
    );
  }
  const accepted: ReadonlySet<string> | null = plan.accepted === null ? null : new Set(plan.accepted);
  for (const [key, value] of Object.entries(model.parameters)) {
    const rule: IAutoMovieModelArchetype["parameters"][string] | undefined = Object.hasOwn(archetype.parameters, key)
      ? archetype.parameters[key] : undefined;
    if (rule === undefined || (accepted !== null && accepted.has(key) === false)) {
      invalid("model-parameter-unsupported", `Parameter "${key}" is unsupported for ${model.archetype}. Remove it from the tracked model recipe record.`);
      continue;
    }
    if (typeof value !== rule.kind) {
      invalid("model-parameter-invalid", `Parameter "${key}" must be ${rule.kind}. Fix it in the tracked model recipe record.`);
      continue;
    }
    if (rule.kind === "number" && (typeof value !== "number" || !Number.isFinite(value) ||
      (rule.minimum !== undefined && value < rule.minimum) ||
      (rule.maximum !== undefined && value > rule.maximum)))
      invalid("model-parameter-invalid", `Parameter "${key}" is outside its supported range. Fix it in the tracked model recipe record.`);
  }
}
