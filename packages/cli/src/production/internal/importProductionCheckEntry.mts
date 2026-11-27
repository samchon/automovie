/*
 * Import through Node's native module loader.
 */
export async function importProductionCheckEntry(
  url: string,
): Promise<unknown> {
  return import(url);
}
