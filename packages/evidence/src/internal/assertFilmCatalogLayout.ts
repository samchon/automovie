import fs from "node:fs";
import path from "node:path";

import { hasMatchingFile } from "./hasMatchingFile";

/**
 * Check the catalog inputs when a production submits a programmed film or
 * scene to composition Evidence. A starter or an isolated catalog can be
 * developed before any film exists. The director verifies registration,
 * playback and the scope of each case at the handoff.
 *
 * @param location Absolute production directory.
 * @throws Error listing every missing catalog input.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Production films and scenes trigger the same layout that the scaffold specifies. A catalog case, the catalog film and its acceptance record serve different consumers and are checked together.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A source glob determines applicability, followed by one check for each fixed input and one for the case population.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The generated starter, film registry, catalog and declaration files supply no production performance. File presence establishes only layout, and the director still has to replay the actual cases.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two scoped source searches and two fixed file probes run during configuration, outside film evaluation.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each configuration observes current files, including newly added cases.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The synchronous filesystem calls retain no handles or state.
 * @evidence contracts/development/common.md#meaningful-documentation Names the submission that opens the check, the starter exception, the failure and the judgment retained by the director.
 */
export function assertFilmCatalogLayout(location: string): void {
  const scenes: string = "src/composition/scenes";
  const films: string = "src/composition/films";
  const catalog: string = `${films}/catalog.ts`;
  const cases: string = `${scenes}/catalog/**/*.ts`;
  const declarations: string = "**/*.d.ts";
  if (
    !hasMatchingFile(
      location,
      [`${scenes}/**/*.ts`, `${films}/**/*.ts`],
      [
        `${scenes}/catalog/**`,
        catalog,
        `${films}/index.ts`,
        `${films}/starter.ts`,
        declarations,
      ],
    )
  )
    return;

  const missing: string[] = [catalog, "docs/acceptance/catalog.md"].filter(
    (file: string): boolean =>
      !fs
        .statSync(path.join(location, file), { throwIfNoEntry: false })
        ?.isFile(),
  );
  if (!hasMatchingFile(location, cases, [declarations])) missing.push(cases);
  if (missing.length)
    throw new Error(
      `Film composition requires its review catalog. Missing: ${missing.join(", ")}`,
    );
}
