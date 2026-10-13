import fs from "node:fs";
import path from "node:path";

import { isAutoMovieEvidenceIdentityFile } from "./isAutoMovieEvidenceIdentityFile";

/**
 * Read the tracked package identity without inventing a missing description.
 *
 * The manifest sits at one fixed path and is read exactly once, so admission
 * asks only that the entry be a regular file that is not a symbolic link.
 *
 * The host boundary is a required argument rather than a default, because every
 * refusal and parse failure here is pure logic over one stat and one string. A
 * default would put the only unexercised lines of this module inside it, and
 * reaching them would require a generated installation to exist.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation One fixed package.json lstat must describe a regular nonsymlink file before supplied text is parsed; a nonempty name is required and description is trimmed or empty.
 * @evidence contracts/common.md#clear-and-simple-design Manifest identity uses a fixed-path admission judgment distinct from independently enumerated graph hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing descriptions are not invented and parse/stat failures propagate; the host port supplies observations without replacing native methods.
 * @evidence contracts/common.md#meaningful-documentation The public comment and required I/O port state fixed-path reads and refusal ownership; returned fields identify package name and optional description.
 * @evidence contracts/performance.md#efficient-algorithms One stat, one full read and O(M) JSON parse for M manifest characters occur, with no directory enumeration or declared manifest byte cap.
 * @evidence contracts/performance.md#reuse-equivalent-work The manifest is read once per call; no cache equates a quiet path with unchanged package identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The injected host owns filesystem resources; only two strings escape and the manifest object remains local.
 */
export const readAutoMovieProductionPackageIdentity: (root: string, io: {
    read: (file: string) => string;
    stat: (file: string) => Pick<fs.Stats, "isFile" | "isSymbolicLink">;
}) => {
    packageName: string;
    description: string;
} = (
  root: string,
  io: {
    read: (file: string) => string;
    stat: (file: string) => Pick<fs.Stats, "isFile" | "isSymbolicLink">;
  },
): { packageName: string; description: string } => {
  const location: string = path.join(root, "package.json");
  if (!isAutoMovieEvidenceIdentityFile(io.stat(location)))
    throw new Error(
      `${location}: package identity must be one regular, non-symlink file.`,
    );
  const manifest: { name?: unknown; description?: unknown; } = JSON.parse(io.read(location)) as {
    name?: unknown;
    description?: unknown;
  };
  if (typeof manifest.name !== "string" || manifest.name.trim() === "")
    throw new Error(`${root}: package.json declares no package name.`);
  return {
    packageName: manifest.name,
    description:
      typeof manifest.description === "string"
        ? manifest.description.trim()
        : "",
  };
};
