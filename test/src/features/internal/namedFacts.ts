/** Evaluate authored named facts lazily in order and stop at the first false result, retaining its name. Guarding facts and one-shot operations are not repeated. */
export function namedFacts(
  entries: ReadonlyArray<readonly [string, () => boolean]>,
): Record<string, boolean> {
  const output: Record<string, boolean> = {};
  for (const [name, evaluate] of entries) {
    output[name] = evaluate();
    if (output[name] === false) break;
  }
  return output;
}
