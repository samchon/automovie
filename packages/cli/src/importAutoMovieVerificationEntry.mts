/** Import through Node's native module loader. */
export async function importAutoMovieVerificationEntry(
  url: string,
): Promise<unknown> {
  return import(url);
}
