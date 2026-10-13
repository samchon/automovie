import fs from "node:fs";
import path from "node:path";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieEvidenceMarkdownHeading } from "./IAutoMovieEvidenceMarkdownHeading";
import { DOCS } from "./DOCS";
import { markdownHeadings } from "./markdownHeadings";
import { narrativeH1 } from "./narrativeH1";
import { posix } from "./posix";
import { walkProjectFiles } from "./walkProjectFiles";

const NUMBERED_NARRATIVE_NAME: RegExp = /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Treatments are flat numbered files; construction and final deliveries use numbered groups with one index and numbered units.
 *
 * @evidence contracts/common.md#principled-implementation Treatments are flat numbered files; construction and final deliveries use numbered groups with one index and numbered units.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem topology admission is distinct from narrative anchor identity and canonical TOC generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident group indexes are required and empty groups are rejected; the supported filename grammar is a project contract.
 * @evidence contracts/common.md#meaningful-documentation The validator reports project-relative invalid paths and checks index heading structure, not the freshness of generated links.
 * @evidence contracts/performance.md#efficient-algorithms Walking scales with entries; filtering the full resident list per group currently adds O(groups times files) work before title parsing.
 * @evidence contracts/performance.md#reuse-equivalent-work Each layer's resident list is reused across group checks, but separate narrative layers are walked independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Resident arrays and group sets are call-local and unbounded by a fixed file cap; synchronous reads close all owned handles.
 */
export function validateNarrativePopulationTopology(graph: IAutoMovieEvidenceConfigProps): void {
  const treatmentRoot: string = path.join(graph.location, DOCS, "treatments");
  const invalidTreatments: string[] = walkProjectFiles(
    graph,
    treatmentRoot,
    ".md",
  ).filter((file: string): boolean => {
    const relative: string = posix(path.relative(treatmentRoot, file));
    return (
      relative.includes("/") ||
      !NUMBERED_NARRATIVE_NAME.test(relative.slice(0, -3))
    );
  });
  if (invalidTreatments.length !== 0)
    throw new Error(
      `Treatments are flat numbered event files and may have no group, index, or nested host; received ${invalidTreatments.map((file: string): string => posix(path.relative(graph.location, file))).join(", ")}.`,
    );

  for (const [layer, directory] of [
    ["scripts", path.join(graph.location, DOCS, "scripts")],
    ["screenplays", path.join(graph.location, DOCS, "screenplays")],
    [
      "final/screenplays",
      path.join(graph.location, DOCS, "final", "screenplays"),
    ],
  ] as const) {
    const residents: string[] = walkProjectFiles(graph, directory, ".md");
    const invalid: string[] = residents.filter((file: string): boolean => {
      const parts: string[] = posix(path.relative(directory, file)).split("/");
      return (
        parts.length !== 2 ||
        !NUMBERED_NARRATIVE_NAME.test(parts[0]!) ||
        (parts[1] !== "index.md" &&
          !NUMBERED_NARRATIVE_NAME.test(parts[1]!.slice(0, -3)))
      );
    });
    if (invalid.length !== 0)
      throw new Error(
        `${layer} use numbered delivery-group directories containing only index.md and numbered unit files; received ${invalid.map((file: string): string => posix(path.relative(graph.location, file))).join(", ")}.`,
      );
    const groups: Set<string> = new Set(
      residents.map(
        (file: string): string => posix(path.relative(directory, file)).split("/")[0]!,
      ),
    );
    for (const group of groups) {
      const index: string = path.join(directory, group, "index.md");
      if (!fs.existsSync(index))
        throw new Error(
          `${layer}/${group} is a resident delivery group without index.md.`,
        );
      const numberedUnits: string[] = residents.filter((file: string): boolean => {
        const parts: string[] = posix(path.relative(directory, file)).split("/");
        return (
          parts[0] === group &&
          parts[1] !== "index.md" &&
          NUMBERED_NARRATIVE_NAME.test(parts[1]!.slice(0, -3))
        );
      });
      if (numberedUnits.length === 0)
        throw new Error(
          `${layer}/${group} is a delivery group without a numbered unit file.`,
        );
      const headings: IAutoMovieEvidenceMarkdownHeading[] = markdownHeadings(index);
      narrativeH1(index);
      if (headings.some((heading: IAutoMovieEvidenceMarkdownHeading): boolean => heading.depth !== 1))
        throw new Error(
          `${posix(path.relative(graph.location, index))} is a delivery index and may contain only its H1 title and generated unit links.`,
        );
    }
  }
}
