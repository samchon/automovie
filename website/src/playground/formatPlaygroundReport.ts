import type { IPlaygroundVerdicts } from "./structures/IPlaygroundVerdicts";

/**
 * The address that opens a prefilled issue about a performance that looks
 * wrong.
 *
 * The page is static and writes nothing itself, so the report is an issue
 * the reader files: its body carries the page's address, which reproduces
 * the composition, the package versions and the verdict report when one was
 * read. The reader adds what looked wrong.
 *
 * @param props The page's address, the package versions and the verdict report, null when none was read.
 * @returns The address of GitHub's new-issue form, prefilled.
 */
export function formatPlaygroundReport(props: {
  /** The page's whole address. */
  address: string;

  /** The packages behind the page with their versions. */
  packages: Readonly<Record<string, string>>;

  /** The verdict report, or null when none was read. */
  verdicts: IPlaygroundVerdicts | null;
}): string {
  const body: string = [
    "## What looks wrong",
    "",
    "<!-- Describe what you saw and at which second. -->",
    "",
    "## Composition",
    "",
    props.address,
    "",
    "## Packages",
    "",
    ...Object.entries(props.packages).map(
      ([name, version]: [string, string]): string => `- ${name} ${version}`,
    ),
    "",
    "## Verdicts",
    "",
    props.verdicts === null ? "Not read." : props.verdicts.text,
  ].join("\n");
  const query: URLSearchParams = new URLSearchParams({
    title: "playground: a composition looks wrong",
    body,
  });
  return `https://github.com/samchon/automovie/issues/new?${query.toString()}`;
}
