/**
 * Select discovered test basenames with the repository runner's substring options.
 * Repeated --include and --exclude groups accept space-separated terms or one
 * equals-form term. Every term must match; invalid or empty selections throw.
 * This pure step receives filenames and imports no test module.
 */
export function selectTestFiles(
  argv: readonly string[],
  names: readonly string[],
): Set<string> {
  const selection: { include: string[]; exclude: string[] } = {
    include: [],
    exclude: [],
  };
  let group: "include" | "exclude" | undefined;
  let count: number = 0;

  /** Refuse an option occurrence that collected no terms. */
  function finishGroup(): void {
    if (group !== undefined && count === 0)
      throw new Error(`--${group} requires at least one nonblank term.`);
  }

  /** Preserve each supplied substring after checking the option grammar. */
  function append(key: "include" | "exclude", value: string): void {
    if (value.trim().length === 0 || value.startsWith("-"))
      throw new Error(
        `--${key} requires a nonblank term, not ${JSON.stringify(value)}.`,
      );
    selection[key].push(value);
  }

  for (const argument of argv) {
    if (argument.startsWith("-")) {
      finishGroup();
      const option: RegExpExecArray | null =
        /^--(include|exclude)(?:=([\s\S]*))?$/u.exec(argument);
      if (option === null)
        throw new Error(`Unexpected argument ${JSON.stringify(argument)}.`);
      const key: "include" | "exclude" = option[1] as "include" | "exclude";
      if (option[2] !== undefined) {
        append(key, option[2]);
        group = undefined;
      } else {
        group = key;
        count = 0;
      }
    } else {
      if (group === undefined)
        throw new Error(`Unexpected argument ${JSON.stringify(argument)}.`);
      append(group, argument);
      ++count;
    }
  }
  finishGroup();

  for (const key of ["include", "exclude"] as const)
    for (const term of selection[key])
      if (!names.some((name: string): boolean => name.includes(term)))
        throw new Error(
          `--${key} term ${JSON.stringify(term)} matched no test.`,
        );

  const selected: Set<string> = new Set(
    names.filter(
      (name: string): boolean =>
        (selection.include.length === 0 ||
          selection.include.some((term: string): boolean =>
            name.includes(term),
          )) &&
        selection.exclude.every(
          (term: string): boolean => !name.includes(term),
        ),
    ),
  );
  if (selected.size === 0)
    throw new Error("The test selection matched nothing.");
  return selected;
}
