/** Import through Node's native loader from the CommonJS verification host. */
export async function importAutoMovieVerificationEntry(
  url: string,
): Promise<unknown> {
  return import(url);
}
