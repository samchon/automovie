import type { IProductionTopologyDocument } from "./IProductionTopologyDocument";

/** Checks matching paths, visible titles, anchors, and heading order in one partition. */
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
