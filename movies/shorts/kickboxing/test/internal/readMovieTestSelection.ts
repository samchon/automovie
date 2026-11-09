/** Parse test selection by filename, so every rule is decided before a module is imported and an unselected module costs nothing; only `--exclude` also drops exported functions by name. Repeated includes form a union, exclusions take precedence, and invalid options fail before discovery. */
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
  const includes: string[] = [
    ...values["--include"],
    ...values["--include-file"],
  ];
  /** Every include and exclusion is a filename rule, decided before import. */
  function acceptFile(file: string): boolean {
    return (
      (!includes.length || matches(file, includes)) &&
      !matches(file, [...values["--exclude-file"], ...values["--exclude"]])
    );
  }
  return {
    acceptFile,
    acceptCase: (file: string, name: string): boolean =>
      acceptFile(file) && !matches(name, values["--exclude"]),
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
