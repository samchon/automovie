import {
  IAutoMovieDialogueLine,
  IAutoMovieScript,
  IAutoMovieScriptNode,
} from "@automovie/interface";

import { screenplaySceneSlug } from "./screenplaySceneSlug";

/**
 * Serialize an {@link IAutoMovieScript} into the deterministic, human-readable
 * plain-text screenplay: the artifact a person reviews and edits, exported
 * alongside the guide video (D009: dialogue TEXT is authoring data; audio is
 * diffusion's).
 *
 * **Convention** (plain text, fixed indents, no trailing whitespace):
 *
 * - Header: `LOGLINE: …` and `THEME: …`, from the intent root when a tree is
 *   present (the tree is the authored truth), else from the flat script.
 * - Act: a blank-line-separated `ACT, <purpose>` rule.
 * - Scene: the screenplay slug `INT. LOCATION - TIMEOFDAY` (location and time
 *   upper-cased), followed by the optional description line.
 * - Group: the rationale bracketed as `[<rationale>]`.
 * - Beat: the beat's flat name as `BEAT, <name>`, the stage direction prose, each
 *   dialogue line as a 16-space-indented `SPEAKER` line over an
 *   8-space-indented text line (prefixed `[t=…s]` when anchored), and the shot
 *   caption bracketed as `[Shot: …]`.
 *
 * **Tree vs flat.** With `script.tree` the document walks the refinement tree
 * depth-first, children in declaration order (the tree already validated on
 * commit: one intent root, acyclic, beats joined 1:1). Without a tree the
 * fallback renders the header plus each flat beat as `BEAT, <name>` over its
 * summary. Treeless scripts stay exportable. A script with no beats at all
 * throws: there is no screenplay to render, and serializing an empty shell
 * would hide the authoring gap.
 *
 * Same script → same bytes: iteration follows declaration order everywhere and
 * no timestamps or randomness enter the text.
 *
 * @author Samchon
 */
export const renderScreenplay = (script: IAutoMovieScript): string => {
  if (script.beats.length === 0)
    throw new Error("script has no beats: there is no screenplay to render");

  const tree = script.tree ?? null;
  if (tree === null) return renderFlat(script);
  return renderTree(script, tree);
};

const renderFlat = (script: IAutoMovieScript): string => {
  const lines: string[] = [
    `LOGLINE: ${script.logline}`,
    `THEME: ${script.theme}`,
  ];
  for (const beat of script.beats) {
    lines.push("", `BEAT, ${beat.name}`, beat.summary);
  }
  return `${lines.join("\n")}\n`;
};

const renderTree = (
  script: IAutoMovieScript,
  tree: IAutoMovieScriptNode[],
): string => {
  const beatNames = new Map(script.beats.map((beat) => [beat.id, beat.name]));
  const children = new Map<string | null, IAutoMovieScriptNode[]>();
  for (const node of tree) {
    const list = children.get(node.parent) ?? [];
    list.push(node);
    children.set(node.parent, list);
  }

  const lines: string[] = [];
  const walk = (node: IAutoMovieScriptNode): void => {
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
        const slug = screenplaySceneSlug(node.payload);
        lines.push("", slug);
        if (node.payload.description !== null)
          lines.push(node.payload.description);
        break;
      }
      case "group":
        lines.push("", `[${node.payload.rationale}]`);
        break;
      case "beat": {
        const name = beatNames.get(node.payload.beat) ?? node.payload.beat;
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

const dialogueLines = (line: IAutoMovieDialogueLine): string[] => {
  const anchor = line.anchor === null ? "" : `[t=${line.anchor}s] `;
  return [
    `${" ".repeat(16)}${line.speaker.toUpperCase()}`,
    `${" ".repeat(8)}${anchor}${line.text}`,
  ];
};
