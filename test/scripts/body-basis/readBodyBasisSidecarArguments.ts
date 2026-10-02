/**
 * Read the explicit recipe used by the shoulder sidecar command. The expected
 * SHA is the complete loaded JSON fingerprint, not gzip bytes. Ramp defaults
 * retain the existing authored convention and its owner admits their domain.
 * Argument order is irrelevant and the input array is read only.
 *
 * @evidence contracts/common.md#principled-implementation Explicit input/output/revision/digest prevents historical commands from silently replacing the shared basis.
 * @evidence contracts/common.md#clear-and-simple-design One flag/value scan owns duplicates, missing values and required fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown flags and positional legacy commands receive no fallback interpretation.
 * @evidence contracts/common.md#meaningful-documentation States the real consumer, payload identity and delegated ramp admission.
 */
export function readBodyBasisSidecarArguments(argv: readonly string[]) {
  const allowed = new Set(["--basis", "--out", "--id", "--expected-sha", "--receipt", "--onset", "--full"]);
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i], value = argv[i + 1];
    if (!allowed.has(flag) || values.has(flag))
      throw new Error("Unknown or duplicate sidecar flag: " + flag);
    if (value === undefined || value.length === 0 || value.startsWith("--"))
      throw new Error("Missing sidecar value for " + flag);
    values.set(flag, value);
  }
  const required = (flag: string): string => {
    const value = values.get(flag);
    if (value === undefined) throw new Error("Give explicit " + flag + " for a sidecar recipe.");
    return value;
  };
  const output = required("--out");
  return {
    basis: required("--basis"), output, revision: required("--id"),
    expectedSha256: required("--expected-sha"),
    receipt: values.get("--receipt") ?? output + ".girdle-receipt.json",
    onsetDegrees: Number(values.get("--onset") ?? "70"),
    fullDegrees: Number(values.get("--full") ?? "110"),
  };
}
