import { BODY_ROOT } from "./BODY_ROOT";

/*
 * Gives reference targets an explicit address in the graph's global space.
 *
 * Every inherited reference selects the body, where each layer's authored text
 * lives.
 *
 * File references use package-relative addresses. A claim that selects file
 * hosts and a claim that selects section hosts read the same documents, and the
 * engine offers every annotation in a claim's files to every reference of that
 * claim. A file address that is also an ancestor address of a section reference
 * would reach that reference as an aggregate target and be refused for lacking
 * a section host. A distinct address space keeps each annotation with the
 * reference it answers.
 */
export function referenceLocation(
  files: string[],
  symbol: "file" | "h2" = "h2",
): {
  root: string;
  files: string[];
} {
  if (symbol === "file")
    return {
      root: ".",
      files: files.map((file: string): string => `${BODY_ROOT}/${file}`),
    };
  return { root: BODY_ROOT, files };
}
