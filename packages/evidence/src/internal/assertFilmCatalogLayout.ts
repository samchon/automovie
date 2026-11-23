import fs from "node:fs";
import path from "node:path";

import { hasMatchingFile } from "./hasMatchingFile";

/**
 * Check the catalog inputs when a production submits a programmed film or scene
 * to composition Evidence. A starter or an isolated catalog can be developed
 * before any film exists. The director verifies registration, playback and the
 * scope of each case at the handoff.
 *
 * @param location Absolute production directory.
 * @throws Error listing every missing catalog input.
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
