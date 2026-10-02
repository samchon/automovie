import { TestValidator } from "@nestia/e2e";

import { readBodyPoseCensusArguments } from "../../../scripts/body-basis/readBodyPoseCensusArguments";
import { resolveBodyPoseCensusInput } from "../../../scripts/body-basis/resolveBodyPoseCensusInput";
import { throwsError } from "../internal/predicates";

/**
 * A selected sidecar travels independently of census population names and never
 * silently falls back after a malformed option.
 *
 * Scenarios:
 * 1. Existing positional calls retain their shipped basis and populations.
 * 2. --basis in either position selects the same explicit input without mutation.
 * 3. Duplicate/unknown/missing/empty options and missing/excess labels are refused.
 */
export const test_human_body_pose_census_sidecar_arguments = (): void => {
  TestValidator.equals("the established population call is preserved", readBodyPoseCensusArguments(["sample", "neutral", "hips-90"]), {
    label: "sample", basis: undefined, shapes: "neutral", poses: "hips-90",
  });
  const argv = ["--basis", "private/candidate.gz", "sample", "heavy,male", "arms-forward-150"];
  const before = argv.slice();
  const expected = { label: "sample", basis: "private/candidate.gz", shapes: "heavy,male", poses: "arms-forward-150" };
  TestValidator.equals("the selected input is independent of option order", readBodyPoseCensusArguments(argv), expected);
  TestValidator.equals("a trailing option selects the same sidecar", readBodyPoseCensusArguments([...argv.slice(2), ...argv.slice(0, 2)]), expected);
  TestValidator.equals("the caller retains its argument array", argv, before);
  TestValidator.equals("omitted populations remain omitted", readBodyPoseCensusArguments(["sample"]).shapes, undefined);
  const resolved: string[] = [];
  const authority = {
    shipped: "directory-anchored-input",
    resolveExplicit: (value: string) => { resolved.push(value); return "caller-input:" + value; },
  };
  TestValidator.equals("omission retains the directory anchor", resolveBodyPoseCensusInput({ ...authority, selected: readBodyPoseCensusArguments(["sample"]).basis }), authority.shipped);
  TestValidator.equals("omission does not consult caller CWD", resolved, []);
  TestValidator.equals("explicit selection uses caller authority", resolveBodyPoseCensusInput({ ...authority, selected: argv[1] }), "caller-input:" + argv[1]);
  TestValidator.equals("even an explicit default spelling remains explicit", resolveBodyPoseCensusInput({ ...authority, selected: authority.shipped }), "caller-input:" + authority.shipped);
  TestValidator.equals("only explicit inputs are resolved", resolved, [argv[1], authority.shipped]);
  for (const invalid of [
    [], [""], ["one", "two", "three", "four"], ["sample", "--unknown"],
    ["sample", "--basis"], ["sample", "--basis", ""], ["sample", "--basis", "--other"],
    [...argv, "--basis", "other.gz"],
  ]) TestValidator.predicate("a malformed selection is refused", throwsError(() => readBodyPoseCensusArguments(invalid)));
};
