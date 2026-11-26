/**
 * Decide whether a path pattern selects an object path.
 *
 * A path is the names from the scene down to an object, joined by `/`. A
 * pattern is read segment by segment: `*` stands for any run of characters
 * inside one name, and a segment that is exactly `**` stands for any number of
 * names, none included. Letter case counts.
 *
 * A pattern without `/` selects an object when any one name on its path
 * matches, so `head` finds the head wherever it sits in the hierarchy and takes
 * everything beneath it. A pattern with `/` is matched from the first name of
 * the path, and selects the object it reaches and everything beneath that
 * object.
 *
 * | Pattern      | Selects                                              |
 * | ------------ | ---------------------------------------------------- |
 * | `hero`       | Every object named `hero` and everything beneath one |
 * | `*arm*`      | Everything at or beneath a name containing `arm`     |
 * | `hero/torso` | `hero/torso` and everything beneath it               |
 * | `hero/*`     | Every object at or beneath a named child of `hero`   |
 * | `**`         | Every object, those with the empty path included     |
 *
 * An empty pattern throws.
 */
export function matchAutoMovieInspectionPath(
  path: string,
  pattern: string,
): boolean {
  if (pattern === "") throw new Error("An inspection pattern cannot be empty");
  const names: string[] = path === "" ? [] : path.split("/");
  const written: string[] = pattern.split("/");
  const segments: string[] =
    written.length === 1 ? ["**", written[0]!, "**"] : [...written, "**"];

  // One test per segment; `**` is handled by the table, not by a test.
  const tests: (RegExp | null)[] = segments.map(
    (segment: string): RegExp | null =>
      segment === "**"
        ? null
        : new RegExp(
            `^${segment
              .split("*")
              .map((literal: string): string =>
                literal.replace(/[.+?^${}()|[\]\\]/g, "\\$&"),
              )
              .join(".*")}$`,
          ),
  );

  // reach[i][j]: names from i on are matched by segments from j on.
  const reach: boolean[][] = Array.from(
    { length: names.length + 1 },
    (): boolean[] => new Array<boolean>(segments.length + 1).fill(false),
  );
  reach[names.length]![segments.length] = true;
  for (let i: number = names.length; i >= 0; i--)
    for (let j: number = segments.length - 1; j >= 0; j--) {
      const test: RegExp | null = tests[j]!;
      reach[i]![j] =
        test === null
          ? reach[i]![j + 1]! || (i < names.length && reach[i + 1]![j]!)
          : i < names.length && test.test(names[i]!) && reach[i + 1]![j + 1]!;
    }
  return reach[0]![0]!;
}
