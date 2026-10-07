/**
 * Select one census input without changing the established positional population.
 * The real census command uses the returned basis for every identity snapshot.
 * Omitted --basis stays absent so the command can retain its directory-anchored
 * shipped input; an explicit sidecar is read only. No publication is admitted.
 *
 * @evidence contracts/common.md#principled-implementation One selected input path is retained independently of label/shape/pose population choices.
 * @evidence contracts/common.md#clear-and-simple-design One scan separates the single valued option from up to three positional arguments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown, duplicate and valueless options receive no silent fallback.
 * @evidence contracts/common.md#meaningful-documentation Names the real command, snapshot consistency and unchanged population semantics.
 */
export function readBodyPoseCensusArguments(argv: readonly string[]) {
  const positional: string[] = [];
  let basis: string | undefined;
  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i];
    if (arg === "--basis") {
      if (basis !== undefined)
        throw new Error("Give the census basis only once.");
      const value = argv[++i];
      if (value === undefined || value.length === 0 || value.startsWith("--"))
        throw new Error("Give --basis <input.gz> for the census.");
      basis = value;
    } else {
      if (arg.startsWith("--"))
        throw new Error("Unknown census option: " + arg);
      positional.push(arg);
    }
  }
  const label = positional[0];
  if (label === undefined || label.length === 0 || positional.length > 3)
    throw new Error(
      "Give a census label and optional shape and pose populations.",
    );
  return {
    label,
    basis,
    shapes: positional[1],
    poses: positional[2],
  };
}
