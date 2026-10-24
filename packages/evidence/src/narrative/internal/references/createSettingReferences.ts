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
 *
 * @evidence contracts/common.md#principled-implementation The promoted body settings directory is enumerated under readSettingsFiles layout validation, yielding one H2 reference per actual canon file; outline navigation is excluded from canon inheritance.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem layout discovery stays in readSettingsFiles while this helper adds layer-qualified native-reference addresses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both flat legacy canon and numbered subject folders are real supported layouts; symbolic or invalid classified entries fail in the shared enumerator rather than being silently substituted.
 * @evidence contracts/common.md#meaningful-documentation The prose states per-file settings targets, two layouts and the outline exclusion; the default pass uses promoted draft addressing.
 * @evidence contracts/performance.md#efficient-algorithms For e directory entries and f canon files, enumeration and sorting dominate O(e log e) comparisons with O(e + f) path storage; two mapping passes allocate one reference per file without reading document contents.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared enumerator and address builder own reusable layout/address rules, but filesystem enumeration repeats each build because installed canon membership may change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned f references belong to the config owner; directory arrays and path lists are transient, and synchronous enumeration leaves no owned descriptor or background task.
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
