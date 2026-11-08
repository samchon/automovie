/** Parse explicit module selection independently from the existing filename-or-function selection. Import filtering never guesses which functions an unimported module might export. Repeated includes form a union, exclusions take precedence, and invalid options fail before discovery. */
export function readMovieTestSelection(
  args: readonly string[],
): readMovieTestSelection.ISelection {
  const values: Record<
    "--include" | "--exclude" | "--include-file" | "--exclude-file",
    string[]
  > = {
    "--include": [],
    "--exclude": [],
    "--include-file": [],
    "--exclude-file": [],
  };
  for (let index: number = 0; index < args.length; index++) {
    const option: string = args[index]!;
    if (option === "--") continue;
    if (!Object.hasOwn(values, option))
      throw new Error(`Unknown test option ${option}`);
    const value: string | undefined = args[++index];
    if (!value?.trim() || value.startsWith("--"))
      throw new Error(`${option} requires a nonempty substring`);
    values[option as keyof typeof values].push(value.replaceAll("\\", "/"));
  }
  /** Portable filename paths and ordinary function identifiers share substring matching. */
  function matches(value: string, needles: readonly string[]): boolean {
    return needles.some((needle: string): boolean =>
      value.replaceAll("\\", "/").includes(needle),
    );
  }
  /** Only explicit file rules and filename exclusions can eliminate a module before import. */
  function acceptFile(file: string): boolean {
    return (
      (!values["--include-file"].length ||
        matches(file, values["--include-file"])) &&
      !matches(file, [...values["--exclude-file"], ...values["--exclude"]])
    );
  }
  return {
    acceptFile,
    acceptCase: (file: string, name: string): boolean =>
      acceptFile(file) &&
      (!values["--include"].length ||
        matches(file, values["--include"]) ||
        matches(name, values["--include"])) &&
      !matches(name, values["--exclude"]),
  };
}

/** Pure selection capabilities borrowed by the one actual test driver. */
export namespace readMovieTestSelection {
  /** Explicit file admission and preserved filename-or-function case semantics. */
  export interface ISelection {
    /** Whether the driver may import this discovered relative path. */
    acceptFile: (file: string) => boolean;
    /** Whether an actual exported function from that module is selected. */
    acceptCase: (file: string, name: string) => boolean;
  }
}
