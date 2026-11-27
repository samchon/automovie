import type { IEvidenceReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import { readSettingsFiles } from "../readSettingsFiles";
import { BODY_ROOT } from "../utilities/BODY_ROOT";
import { referenceLocation } from "../utilities/referenceLocation";

/*
 * Creates one H2 reference per canon file of settings, in any supported layout,
 * or of a short's brief. The outline is not canon and is never an inherited
 * settings dependency.
 */
export function createSettingReferences(
  location: string,
  canon: "settings" | "brief" = "settings",
): IEvidenceReference[] {
  const settingsRoot: string = path.join(
    location,
    ...BODY_ROOT.split("/"),
    canon,
  );
  if (!fs.existsSync(settingsRoot)) return [];

  return readSettingsFiles(settingsRoot)
    .map((file: string): string => `${canon}/${file}`)
    .map(
      (
        file: string,
      ): { symbol: "h2"; root: string; files: string[]; type: "markdown" } =>
        ({
          type: "markdown",
          ...referenceLocation([file]),
          symbol: "h2",
        }) satisfies IEvidenceReference,
    );
}
