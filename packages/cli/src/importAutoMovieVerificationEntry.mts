export async function importAutoMovieVerificationEntry(
  url: string,
): Promise<unknown> {
  return import(url);
}
