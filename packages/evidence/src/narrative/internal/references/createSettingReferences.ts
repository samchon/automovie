import type { IEvidenceReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredPass } from "../../AuthoredPass";
import { readSettingsFiles } from "../readSettingsFiles";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { referenceLocation } from "../utilities/referenceLocation";

/**
 * Creates one H2 reference per canon file of settings, in any supported layout, or of a short's brief.
 * The outline is not canon and is never an inherited settings dependency.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The promoted body settings or brief directory, chosen by `canon`, is enumerated under readSettingsFiles layout validation, yielding one H2 reference per actual canon file; outline navigation is excluded from canon inheritance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Filesystem layout discovery stays in readSettingsFiles while this helper adds layer-qualified native-reference addresses.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both flat legacy canon and numbered subject folders are real supported layouts; symbolic or invalid classified entries fail in the shared enumerator rather than being silently substituted.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states per-file settings targets, two layouts and the outline exclusion; the default pass uses promoted draft addressing.
 * @evidence contracts/development/implementation.md#efficient-algorithms For e directory entries and f canon files, enumeration and sorting dominate O(e log e) comparisons with O(e + f) path storage; two mapping passes allocate one reference per file without reading document contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared enumerator and address builder own reusable layout/address rules, but filesystem enumeration repeats each build because installed canon membership may change.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned f references belong to the config owner; directory arrays and path lists are transient, and synchronous enumeration leaves no owned descriptor or background task.
 */
export function createSettingReferences(
  location: string,
  pass: AuthoredPass = "draft",
  canon: "settings" | "brief" = "settings",
): IEvidenceReference[] {
  const settingsRoot: string = path.join(
    location,
    PACKAGE_DOCS_ROOT,
    "body",
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
          ...referenceLocation([file], pass),
          symbol: "h2",
        }) satisfies IEvidenceReference,
    );
}
