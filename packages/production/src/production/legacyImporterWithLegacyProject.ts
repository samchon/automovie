import os from "node:os";
import path from "node:path";
import { AutoMovieProject } from "../project/AutoMovieProject";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { legacyImporterLegacySnapshot } from "./legacyImporterLegacySnapshot";
import { legacyImporterRemoveLegacyImportTemporary } from "./legacyImporterRemoveLegacyImportTemporary";

/**
 * Validate or inspect a captured legacy project in a new OS temporary directory populated from captured nonnull bytes, so the v1 store cannot initialize the user's source tree. Remove the clone on success or failure.
 *
 * @evidence contracts/common.md#principled-implementation Copies captured bytes and opens AutoMovieProject only on the temporary root, isolating legacy initialization effects from the resident project.
 * @evidence contracts/common.md#clear-and-simple-design One scoped clone surrounds the supplied planning task, while cleanup error composition is delegated to the temporary-directory owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing captured assets are not fabricated, and no validation task is run directly on the user's resident root; cleanup failure remains visible.
 * @evidence contracts/common.md#meaningful-documentation Documents temporary-root execution, captured-byte population and success/failure cleanup with preserved earlier causes.
 * @evidence contracts/performance.md#efficient-algorithms Copies B bytes across F captured files and directories before v1 open/task work, with snapshot-sized disk storage and caller task-dependent computation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses one captured snapshot for this clone, but each call creates a separate directory because initialization and callback effects cannot be shared by equal results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns its temporary directory and removes it before return; failure also attempts removal, and native cleanup failure may retain a clone while throwing its cause.
 */
export const legacyImporterWithLegacyProject: <T>(snapshot: legacyImporterLegacySnapshot, task: (project: AutoMovieProject) => T) => T = <T>(
  snapshot: legacyImporterLegacySnapshot,
  task: (project: AutoMovieProject) => T,
): T => {
  const temporary: string = fileSystem.mkdtempSync(
    path.join(os.tmpdir(), "automovie-legacy-import-"),
  );
  let result: T;
  try {
    for (const [relative, bytes] of snapshot.files)
      if (bytes !== null) {
        const file: string = path.join(temporary, ...relative.split("/"));
        fileSystem.mkdirSync(path.dirname(file), { recursive: true });
        fileSystem.writeFileSync(file, bytes);
      }
    result = task(AutoMovieProject.open(temporary));
  } catch (error) {
    legacyImporterRemoveLegacyImportTemporary(
      temporary,
      { error },
      "legacy planning snapshot",
    );
    throw error;
  }
  legacyImporterRemoveLegacyImportTemporary(temporary, undefined, "legacy planning snapshot");
  return result;
};
