import type { IAutoMovieGeneratedFile, IAutoMovieMaterializedFile } from "@automovie/interface";
import { AutoMovieGeneratedFileMissingError } from "./AutoMovieGeneratedFileMissingError";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { digestAutoMovieBytes } from "./contentIdentity";

/**
 * Compare intended generated identities with currently readable stored bytes.
 *
 * Created, unchanged and updated describe the proposed publication. They do not certify that a write completed. Only the project's typed missing-file observation permits created; every other thrown value propagates unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Current bytes are SHA-256 hashed and compared with the intended digest; a dedicated missing-file observation selects creation, exact equality selects unchanged and other admitted bytes select update.
 * @evidence contracts/common.md#clear-and-simple-design This comparison owns intended status only; project reads own path safety and publication owns eventual physical writes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary Error messages and non-Error thrown values cannot masquerade as absence, and a pre-publication comparison is not reported as write success.
 * @evidence contracts/common.md#meaningful-documentation States intended-publication meaning, byte comparison and narrow absence/error policy.
 * @evidence contracts/performance.md#efficient-algorithms For F files and B total readable bytes, one ordered scan reads/hashes O(B) bytes and allocates O(F) result records; each read buffer is local to its hash and files are not reread here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every comparison needs current stored bytes and no earlier storage answer is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Results retain generated metadata and source-target references but no file bytes; project readers own handle cleanup and any failure aborts the local map without publishing.
 */
export function statusesOf(
  project: Pick<AutoMovieProductionProject, "readGeneratedFile">,
  files: readonly IAutoMovieGeneratedFile[],
): IAutoMovieMaterializedFile[] {
  return files.map((file: IAutoMovieGeneratedFile): IAutoMovieMaterializedFile => {
    let before: string | null = null;
    try {
      before = digestAutoMovieBytes(project.readGeneratedFile(file.path));
    } catch (error) {
      if (!(error instanceof AutoMovieGeneratedFileMissingError)) throw error;
    }
    return {
      ...file,
      status: before === null ? "created" : before === file.digest ? "unchanged" : "updated",
    };
  });
}
