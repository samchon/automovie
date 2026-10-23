import type { IEvidenceReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredPass } from "../../AuthoredPass";
import { readSettingsFiles } from "../readSettingsFiles";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { referenceLocation } from "../utilities/referenceLocation";

/**
 * Creates one H2 reference per canon file in either supported settings layout.
 * The outline is not canon and is never an inherited settings dependency.
 */
export function createSettingReferences(
  location: string,
  pass: AuthoredPass = "draft",
): IEvidenceReference[] {
  const settingsRoot: string = path.join(
    location,
    PACKAGE_DOCS_ROOT,
    "body",
    "settings",
  );
  if (!fs.existsSync(settingsRoot)) return [];

  return readSettingsFiles(settingsRoot)
    .map((file: string): string => `settings/${file}`)
    .map(
      (
        file: string,
      ): { symbol: "h2"; root: string; files: string[]; type: "markdown" } =>
        ({
          type: "markdown",
          ...referenceLocation([file], pass),
          symbol: "h2",
        }) satisfies IEvidenceReference,
    );
}
