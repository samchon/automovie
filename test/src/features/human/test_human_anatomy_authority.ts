import { f1 } from "../../../../packages/playground/src/human-parameters/f1";
import { HumanAnatomyAuthority as A } from "../internal/HumanAnatomyAuthority";

/**
 * Passing model measurements cannot replace unavailable clinical evidence.
 *
 * @evidence contracts/testing.md#behavioral-verification A finite model goal passes, the same expected clinical goal without landmark evidence fails, and their combined acceptance remains red. Availability and finite-value gates cannot be bypassed independently.
 * @evidence contracts/testing.md#independent-expectations A prescribed 200 mm goal has unchanged 196..204 mm bounds. Required arm rows preserve the existing f1 input literal and 4 mm engineering limit; no generated dimension is an expectation.
 * @evidence contracts/testing.md#distinguishing-cases Exercises measured and unavailable states with finite and non-finite values, all three evidence authorities, and both sides' four required arm measurements with explicit reasons.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test selected by --include human_anatomy_authority. It loads only the f1 parameter literal and authority helper, without generating a person or starting a host.
 */
export function test_human_anatomy_authority(): void {
  const model: A.IRow = { person: "fixture", site: "model tape", value: 200, low: 196, high: 204, unit: "mm", authority: "model-identity", status: "measured" };
  const clinical: A.IRow = A.unavailable("fixture", "clinical tape", 200, 4, "The required anatomical landmark has not been established.");
  check("model result green", A.passes(model));
  check("missing clinical result red", !A.passes(clinical));
  check("model success cannot satisfy the combined acceptance", ![model, clinical].every(A.passes));
  check("available independently measured clinical result can pass", A.passes({ ...clinical, value: 200, status: "measured", reason: undefined }));
  check("unavailable flag cannot pass with an injected finite number", !A.passes({ ...clinical, value: 200 }));
  check("non-finite value cannot pass with a measured flag", !A.passes({ ...clinical, status: "measured" }));
  const observed: A.IRow = A.finish([{ person: "fixture", site: "physical containment", value: 0, low: 0, high: 0, unit: "mm" }])[0]!;
  check("shape acceptance has an explicit distinct authority", observed.authority === "observed-anatomy" && A.passes(observed));
  const missing: A.IRow = A.finish([{ ...observed, value: NaN, status: undefined, reason: undefined }])[0]!;
  check("missing raw observation retains an explicit reason and failure", missing.status === "unavailable" && (missing.reason?.length ?? 0) > 0 && !A.passes(missing));
  const arm: A.IRow[] = A.requirements("arm", "fixture", f1);
  check("both sides retain four clinical tape requirements", arm.length === 8);
  check("all unestablished requirements fail with reasons", arm.every((row: A.IRow): boolean => !A.passes(row) && row.authority === "clinical-identity" && row.status === "unavailable" && (row.reason?.length ?? 0) > 0));
  check("original biceps input and error remain unchanged", arm[0]!.low === f1.body.controls.bicep.value! - 4 && arm[0]!.high === f1.body.controls.bicep.value! + 4);
  console.log(JSON.stringify({ status: "PASS", peopleGenerated: 0, modelPass: A.passes(model), clinicalPass: A.passes(clinical), retainedClinicalArmRows: arm.length, observedAuthority: observed.authority }, null, 2));
}

/** Assertion of observable authority-gate behavior. */
function check(label: string, result: boolean): void {
  if (!result) throw new Error(label);
}

