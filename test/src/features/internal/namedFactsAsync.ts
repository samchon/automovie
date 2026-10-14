/** Await authored named facts serially and stop at the first false result, retaining its name. */
export async function namedFactsAsync(
  entries: ReadonlyArray<readonly [string, () => Promise<boolean>]>,
): Promise<Record<string, boolean>> {
  const output: Record<string, boolean> = {};
  for (const [name, evaluate] of entries) {
    output[name] = await evaluate();
    if (output[name] === false) break;
  }
  return output;
}
