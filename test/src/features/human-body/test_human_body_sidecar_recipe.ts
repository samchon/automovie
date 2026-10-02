import { TestValidator } from "@nestia/e2e";

import { assertBodyBasisSidecarPaths } from "../../../scripts/body-basis/assertBodyBasisSidecarPaths";
import { readBodyBasisSidecarArguments } from "../../../scripts/body-basis/readBodyBasisSidecarArguments";
import { nclose, throwsError } from "../internal/predicates";

/**
 * An explicit recipe and distinct private artifact identities precede sidecar
 * writes. Canonical location tokens exercise policy without filesystem mocks.
 *
 * Scenarios:
 * 1. Explicit input/output/id/digest admits defaults or explicit ramp/receipt.
 * 2. Legacy, unknown, duplicate, empty and missing recipe values are refused.
 * 3. Either artifact outside the private namespace, the namespace itself or
 *    an alias of source/published/other artifact is refused.
 */
export const test_human_body_sidecar_recipe = (): void => {
  const argv = ["--basis", "original.gz", "--out", "private/candidate.gz", "--id", "candidate/1", "--expected-sha", "payload"];
  const before = argv.slice();
  const recipe = readBodyBasisSidecarArguments(argv);
  const { onsetDegrees, fullDegrees, ...binding } = recipe;
  TestValidator.equals("the explicit recipe retains its input", binding, {
    basis: "original.gz", output: "private/candidate.gz", revision: "candidate/1", expectedSha256: "payload",
    receipt: "private/candidate.gz.girdle-receipt.json",
  });
  TestValidator.predicate("authored ramp defaults are retained", nclose(onsetDegrees, 70, 1e-12) && nclose(fullDegrees, 110, 1e-12));
  const explicit = readBodyBasisSidecarArguments([...argv, "--receipt", "private/receipt.json", "--onset", "0", "--full", "180"]);
  TestValidator.equals("the explicit receipt is retained", explicit.receipt, "private/receipt.json");
  TestValidator.predicate("explicit ramp endpoints are retained", nclose(explicit.onsetDegrees, 0, 1e-12) && nclose(explicit.fullDegrees, 180, 1e-12));
  TestValidator.equals("the argument array is caller-owned", argv, before);
  for (const invalid of [
    ["legacy-revision"], [...argv, "--unknown", "x"], [...argv, "--out", "again"],
    [...argv, "--receipt"], [...argv, "--receipt", ""], [...argv, "--receipt", "--onset"],
  ]) TestValidator.predicate("an invalid recipe is refused", throwsError(() => readBodyBasisSidecarArguments(invalid)));
  for (const flag of ["--basis", "--out", "--id", "--expected-sha"]) {
    const at = argv.indexOf(flag);
    const missing = [...argv.slice(0, at), ...argv.slice(at + 2)];
    TestValidator.predicate("each required field is necessary", throwsError(() => readBodyBasisSidecarArguments(missing), "Give explicit " + flag));
  }
  const paths = { source: "private/source.gz", published: "private/published.gz", output: "private/candidate.gz", receipt: "private/receipt.json", root: "private/" };
  assertBodyBasisSidecarPaths(paths);
  for (const invalid of [
    { ...paths, root: "" }, { ...paths, output: "public/candidate.gz" }, { ...paths, receipt: "public/receipt.json" },
    { ...paths, output: paths.root }, { ...paths, receipt: paths.root },
    { ...paths, output: paths.source }, { ...paths, output: paths.published },
    { ...paths, receipt: paths.source }, { ...paths, receipt: paths.published }, { ...paths, receipt: paths.output },
  ]) TestValidator.predicate("an alias or nonprivate output is refused", throwsError(() => assertBodyBasisSidecarPaths(invalid)));
};
