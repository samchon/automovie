/**
 * Admit the command line of a basis revision entry: the study directory to
 * read, the new basis revision id and an output directory that must not exist.
 *
 * An existing output refuses because a revision is written once, and writing
 * into a used directory would mix two runs' files under one receipt. Nothing is
 * created here. `exists` is `fs.existsSync` in a script.
 */
export function parseFaceBasisRevisionArguments(
  args: readonly string[],
  exists: (file: string) => boolean,
): { studyDirectory: string; revision: string; output: string } {
  const [studyDirectory, revision, output] = args;
  if (
    studyDirectory === undefined ||
    revision === undefined ||
    output === undefined ||
    exists(output)
  )
    throw new Error(
      "Supply the study directory, the new revision and a new output directory.",
    );
  return { studyDirectory, revision, output };
}
