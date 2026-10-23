import type { IProductionTopologyDocument } from "./IProductionTopologyDocument";

/**
 * Checks matching paths, visible titles, anchors, and heading order in one partition.
 *
 * @evidence contracts/common.md#principled-implementation Layer-relative paths join parent and child documents, and ordered depth/title/anchor tuples must match exactly; missing parent paths and unexpected or changed child identities become issues.
 * @evidence contracts/common.md#clear-and-simple-design Map lookup handles matching identities and a child-path Set handles missing documents, keeping comparison separate from shape validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Indexes are excluded by default because frozen/working editions may omit them; callers explicitly include indexes for scripts-to-screenplay partition identity.
 * @evidence contracts/common.md#meaningful-documentation The comment names every identity component, and includeIndexes documents the optional index population through its default and filter.
 * @evidence contracts/performance.md#efficient-algorithms For p parent documents, c child documents and h compared headings, filtering/indexing and tuple serialization cost O(p + c + h) expected time and proportional transient storage; serialized text size also follows title/anchor lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured document records and heading identities are reused without reopening bytes; indexes are local to this comparison so mutable caller editions are never cached as equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Filtered arrays, Maps, Sets and tuple strings are call-local; only the issue list survives, bounded by child mismatches plus missing parent documents.
 */
export function compareTopologyIdentity(
  parent: IProductionTopologyDocument[],
  child: IProductionTopologyDocument[],
  label: string,
  includeIndexes: boolean = false,
): string[] {
  const issues: string[] = [];
  parent = parent.filter(
    (document: IProductionTopologyDocument): boolean =>
      includeIndexes || !document.relative.endsWith("/index.md"),
  );
  child = child.filter(
    (document: IProductionTopologyDocument): boolean =>
      includeIndexes || !document.relative.endsWith("/index.md"),
  );
  const expected: Map<string, IProductionTopologyDocument> = new Map(
    parent.map(
      (
        document: IProductionTopologyDocument,
      ): [string, IProductionTopologyDocument] => [document.relative, document],
    ),
  );
  const actual: Set<string> = new Set(
    child.map(
      (document: IProductionTopologyDocument): string => document.relative,
    ),
  );
  for (const document of child) {
    const original: IProductionTopologyDocument | undefined = expected.get(
      document.relative,
    );
    if (
      original === undefined ||
      JSON.stringify(
        original.headings.map(
          (
            heading: IProductionTopologyDocument["headings"][number],
          ): [number, string, string] => [
            heading.level,
            heading.title,
            heading.anchor,
          ],
        ),
      ) !==
        JSON.stringify(
          document.headings.map(
            (
              heading: IProductionTopologyDocument["headings"][number],
            ): [number, string, string] => [
              heading.level,
              heading.title,
              heading.anchor,
            ],
          ),
        )
    )
      issues.push(
        `${label}: identity differs at ${document.relative}; preserve relative paths, H1/H2 titles, anchors, and order.`,
      );
  }
  for (const document of parent)
    if (!actual.has(document.relative))
      issues.push(`${label}: identity is missing at ${document.relative}.`);
  return issues;
}
