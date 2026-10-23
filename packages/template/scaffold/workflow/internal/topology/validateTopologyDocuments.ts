import type { NarrativeLayer } from "../../NarrativeLayer";
import type { IProductionTopologyDocument } from "./IProductionTopologyDocument";
import { unsupportedNarrativeHeadings } from "./unsupportedNarrativeHeadings";

/** Validates flat events or a numbered scene partition using captured text only. */
export function validateTopologyDocuments(
  documents: IProductionTopologyDocument[],
  layer: NarrativeLayer,
  allowBrief: boolean,
  label: string,
  directories: string[],
  requireIndex: boolean,
): string[] {
  const issues: string[] = [];
  const grouped: Map<string, IProductionTopologyDocument[]> = new Map();
  const unitPattern: RegExp = /^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;
  for (const directory of directories) {
    if (
      layer === "treatments" ||
      !/^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(directory)
    )
      issues.push(
        `${label}: invalid narrative directory ${directory}; treatments are flat and scene parts have no nested directories.`,
      );
    else grouped.set(directory, []);
  }
  for (const document of documents) {
    const parts: string[] = document.relative.split("/");
    const valid: boolean =
      layer === "treatments"
        ? parts.length === 1 && unitPattern.test(parts[0])
        : parts.length === 2 &&
          /^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(parts[0]) &&
          (parts[1] === "index.md" || unitPattern.test(parts[1]));
    if (!valid) {
      issues.push(
        `${label}: invalid narrative path ${document.relative}; treatments are flat and scenes use numbered part directories.`,
      );
      continue;
    }
    const group: string = layer === "treatments" ? "" : parts[0];
    const members: IProductionTopologyDocument[] = grouped.get(group) ?? [];
    members.push(document);
    grouped.set(group, members);
    const headings: IProductionTopologyDocument["headings"] = document.headings;
    const index: boolean = parts.at(-1) === "index.md";
    const h1: IProductionTopologyDocument["headings"] = headings.filter(
      (heading: IProductionTopologyDocument["headings"][number]): boolean =>
        heading.level === 1,
    );
    const h2: IProductionTopologyDocument["headings"] = headings.filter(
      (heading: IProductionTopologyDocument["headings"][number]): boolean =>
        heading.level === 2,
    );
    if (
      h1.length !== 1 ||
      headings[0]?.level !== 1 ||
      (index ? h2.length !== 0 : h2.length === 0) ||
      headings.some(
        (heading: IProductionTopologyDocument["headings"][number]): boolean =>
          heading.level > 2,
      ) ||
      unsupportedNarrativeHeadings(document.source.content).length !== 0
    )
      issues.push(
        `${label}/${document.relative}: narrative topology requires one leading H1, H2 units, and no deeper headings; a part index contains only its H1 and links.`,
      );
    if (
      new Set(
        h2.map(
          (heading: IProductionTopologyDocument["headings"][number]): string =>
            heading.anchor,
        ),
      ).size !== h2.length
    )
      issues.push(
        `${label}/${document.relative}: H2 anchors must identify distinct units; visible titles may repeat.`,
      );
    if (h1[0] !== undefined) {
      const content: string = document.source.content;
      const end: number = content.indexOf("\n", h1[0].start);
      const before: string = content
        .slice(0, h1[0].start)
        .replace(/<!--[\s\S]*?-->/gu, "");
      const between: string =
        h2[0] === undefined
          ? ""
          : content
              .slice(end < 0 ? content.length : end + 1, h2[0].start)
              .replace(/<!--[\s\S]*?-->/gu, "");
      if (before.trim() !== "" || (!allowBrief && between.trim() !== ""))
        issues.push(
          `${label}/${document.relative}: narrative development belongs inside H2 units.`,
        );
    }
  }
  if (layer !== "treatments")
    issues.push(
      ...numbering(
        [...grouped.keys()].sort((left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
        label,
      ),
    );
  for (const [group, members] of grouped) {
    const episodes: IProductionTopologyDocument[] = members.filter(
      (document: IProductionTopologyDocument): boolean =>
        !document.relative.endsWith("/index.md"),
    );
    issues.push(
      ...numbering(
        episodes.map(
          (document: IProductionTopologyDocument): string =>
            document.relative.split("/").at(-1)!,
        ),
        `${label}/${group}`,
      ),
    );
    if (layer !== "treatments")
      issues.push(
        ...validateIndex(members, episodes, `${label}/${group}`, requireIndex),
      );
  }
  return issues;
}

/** Contiguous numbers detect missing, repeated, and orphaned partition entries. */
function numbering(names: string[], label: string): string[] {
  return names.some(
    (name: string, index: number): boolean =>
      Number(name.slice(0, 3)) !== index + 1,
  )
    ? [
        `${label}: narrative numbering must be contiguous from 001 without duplicate numbers.`,
      ]
    : [];
}

/** A part's H1 and complete ordered link list are its actual navigation contract. */
function validateIndex(
  members: IProductionTopologyDocument[],
  episodes: IProductionTopologyDocument[],
  label: string,
  required: boolean,
): string[] {
  const index: IProductionTopologyDocument | undefined = members.find(
    (document: IProductionTopologyDocument): boolean =>
      document.relative.endsWith("/index.md"),
  );
  if (episodes.length === 0 || (index === undefined && required))
    return [
      `${label}: a narrative part requires its index.md and at least one numbered scene.`,
    ];
  if (index === undefined) return [];
  const first: IProductionTopologyDocument["headings"][number] | undefined =
    index.headings[0];
  if (first === undefined) return [];
  const end: number = index.source.content.indexOf("\n", first.start);
  const lines: string[] = index.source.content
    .slice(end < 0 ? index.source.content.length : end + 1)
    .replace(/<!--[\s\S]*?-->/gu, "")
    .split(/\r?\n/u)
    .filter((line: string): boolean => line.trim() !== "");
  const actual: (readonly [string, string] | undefined)[] = lines.map(
    (line: string): readonly [string, string] | undefined => {
      const match: RegExpExecArray | null =
        /^\s*(?:[-*+]|[0-9]+[.)])\s+\[((?:\\.|[^\]])*)\]\(([^)\s]+)\)\s*$/u.exec(
          line,
        );
      return match === null
        ? undefined
        : [match[2], match[1].replace(/\\([\\[\]])/gu, "$1")];
    },
  );
  const expected: [string, string][] = episodes.map(
    (document: IProductionTopologyDocument): [string, string] => [
      document.relative.split("/").at(-1)!,
      document.headings.find(
        (heading: IProductionTopologyDocument["headings"][number]): boolean =>
          heading.level === 1,
      )?.title ?? "",
    ],
  );
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : [
        `${label}/index.md: its ordered scene links and titles must match every numbered scene exactly once.`,
      ];
}
