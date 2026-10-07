import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Absolute path to the bundled scaffold assets, resolved relative to this module
 * so it works both from `src` (ttsx, in development) and the published `lib`
 * (the `scaffold/` folder ships alongside).
 *
 * `moduleDirectory` defaults to this module's own, which is the only value any
 * caller passes. It is a parameter so that the missing-assets refusal is an
 * ordinary case over an ordinary input rather than a branch reachable only by
 * moving the shipped directory out from under a running test. A guard whose
 * failure sentence has never been produced is a guard nobody has read.
 *
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes the capability-oriented scaffold as the input to deterministic scaffold rendering.
 */
export const scaffoldAssetDirectory = (
  moduleDirectory: string = __dirname,
): string => {
  const directory = path.resolve(moduleDirectory, "..", "scaffold");
  if (!fs.existsSync(directory))
    throw new Error(`scaffold assets are missing: ${directory}`);
  return directory;
};
