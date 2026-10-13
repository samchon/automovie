import type { IAutoMovieInstructionMarkdownSource } from "./IAutoMovieInstructionMarkdownSource";
import { normalizeSourcePath } from "./normalizeSourcePath";
import { resolveInstructionRoute } from "./resolveInstructionRoute";
import { InstructionMarkdown } from "./InstructionMarkdown";

/**
 * Resolve one instruction link against a complete synthetic publication.
 *
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-topic-document-discovery Refuses links whose advertised instruction target or heading cannot be discovered.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Enforces one project-root boundary over both installed routers and runtime diagnostic references.
 */
export const validateAutoMovieInstructionLink = (
  sources: readonly IAutoMovieInstructionMarkdownSource[],
  sourcePath: string,
  destination: string,
): void => {
  const files = new Map(
    sources.map((source) => [normalizeSourcePath(source.path), source.content]),
  );
  const source = normalizeSourcePath(sourcePath);
  if (!files.has(source))
    throw new Error(`${source}: instruction route source is not published.`);
  const link = resolveInstructionRoute(source, destination);
  if (link === null) return;
  const { resolved, anchor } = link;
  const target = files.get(resolved);
  const directory = [...files.keys()].some((candidate) =>
    candidate.startsWith(`${resolved.replace(/\/$/u, "")}/`),
  );
  if (target === undefined && !directory)
    throw new Error(
      `${source}: instruction route targets missing target ${destination}.`,
    );
  if (anchor !== undefined && anchor !== "") {
    if (target === undefined)
      throw new Error(
        `${source}: instruction anchor targets a directory: ${destination}.`,
      );
    if (!InstructionMarkdown.anchors(target).has(anchor))
      throw new Error(
        `${source}: instruction route targets missing anchor ${destination}.`,
      );
  }
};
