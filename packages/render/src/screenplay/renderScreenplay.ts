import {
  IAutoMovieDialogueLine,
  IAutoMovieScript,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { screenplaySceneSlug } from "./screenplaySceneSlug";

/**
 * Serialize a validated script into plain screenplay text with one terminal
 * newline. A script with no beats throws before serialization.
 *
 * A tree supplies the intent header and is walked depth-first in declared
 * child order. Script commit must already have validated its single intent,
 * acyclicity and one-to-one beat join. A treeless script uses the flat logline,
 * theme and ordered beat summaries.
 *
 * Tree output uses `ACT, <purpose>`, uppercase scene slugs, bracketed group
 * rationale, `BEAT, <name>` and stage direction. Dialogue speakers use sixteen
 * spaces of indentation and text uses eight, with `[t=<seconds>s]` for an
 * anchored line. A shot caption writes `[Shot: <caption>]`. Supplied text is
 * preserved; the serializer does not strip whitespace inside authored fields.
 *
 * @evidence contracts/common.md#principled-implementation A validated script tree is walked depth-first in declared child order; treeless scripts use flat beat order, and the tree intent supplies the header. Tree admission and cycle checks belong to script commit, not this serializer.
 * @evidence contracts/common.md#clear-and-simple-design Tree and flat serialization remain private branches of one screenplay renderer, while scene slug spelling is shared with caption labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty beat populations refuse instead of emitting an empty screenplay; no authored node id or dialogue text selects a special serialization path.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies tree ownership, fallback behavior, indentation, anchored seconds and terminal newline; author-supplied text is emitted without semantic rewriting.
 * @evidence contracts/performance.md#efficient-algorithms For N tree nodes, B beats and L output characters, beat and child maps plus traversal cost O(N+B+L) with O(N+B+L) retained construction data; recursion uses the tree depth.
 * @evidence contracts/performance.md#reuse-equivalent-work One child index and one beat-name index serve the complete document walk; no header, beat or scene is re-indexed for each descendant.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, line arrays and recursion state are local to the serialization, and only the resulting screenplay string escapes with no file or renderer handle.
 */
export const renderScreenplay: (script: IAutoMovieScript) => string = (
  script: IAutoMovieScript,
): string => {
  if (script.beats.length === 0)
    throw new Error("script has no beats: there is no screenplay to render");

  const tree: IAutoMovieScriptNode[] | null = script.tree ?? null;
  if (tree === null) return renderFlat(script);
  return renderTree(script, tree);
};

const renderFlat: (script: IAutoMovieScript) => string = (
  script: IAutoMovieScript,
): string => {
  const lines: string[] = [
    `LOGLINE: ${script.logline}`,
    `THEME: ${script.theme}`,
  ];
  for (const beat of script.beats) {
    lines.push("", `BEAT, ${beat.name}`, beat.summary);
  }
  return `${lines.join("\n")}\n`;
};

const renderTree: (
  script: IAutoMovieScript,
  tree: IAutoMovieScriptNode[],
) => string = (
  script: IAutoMovieScript,
  tree: IAutoMovieScriptNode[],
): string => {
  const beatNames: Map<string, string> = new Map(
    script.beats.map(
      (beat: IAutoMovieScript["beats"][number]): [string, string] => [
        beat.id,
        beat.name,
      ],
    ),
  );
  const children: Map<string | null, IAutoMovieScriptNode[]> = new Map();
  for (const node of tree) {
    const list: IAutoMovieScriptNode[] = children.get(node.parent) ?? [];
    list.push(node);
    children.set(node.parent, list);
  }

  const lines: string[] = [];
  const walk: (node: IAutoMovieScriptNode) => void = (
    node: IAutoMovieScriptNode,
  ): void => {
    switch (node.kind) {
      case "intent":
        lines.push(
          `LOGLINE: ${node.payload.logline}`,
          `THEME: ${node.payload.theme}`,
        );
        break;
      case "act":
        lines.push("", `ACT, ${node.payload.purpose}`);
        break;
      case "scene": {
        const slug: string = screenplaySceneSlug(node.payload);
        lines.push("", slug);
        if (node.payload.description !== null)
          lines.push(node.payload.description);
        break;
      }
      case "group":
        lines.push("", `[${node.payload.rationale}]`);
        break;
      case "beat": {
        const name: string =
          beatNames.get(node.payload.beat) ?? node.payload.beat;
        lines.push("", `BEAT, ${name}`, node.payload.direction);
        for (const line of node.payload.dialogue)
          lines.push(...dialogueLines(line));
        if (node.payload.caption !== null)
          lines.push(`[Shot: ${node.payload.caption}]`);
        break;
      }
    }
    for (const child of children.get(node.id) ?? []) walk(child);
  };

  for (const root of children.get(null) ?? []) walk(root);
  return `${lines.join("\n")}\n`;
};

const dialogueLines: (line: IAutoMovieDialogueLine) => string[] = (
  line: IAutoMovieDialogueLine,
): string[] => {
  const anchor: string = line.anchor === null ? "" : `[t=${line.anchor}s] `;
  return [
    `${" ".repeat(16)}${line.speaker.toUpperCase()}`,
    `${" ".repeat(8)}${anchor}${line.text}`,
  ];
};
