/*
 * Import through Node's native module loader.
 */
export async function importAutoMovieProductionCheckEntry(
  url: string,
): Promise<unknown> {
  return import(url);
}
