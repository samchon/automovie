import type { IHumanSourceGenerationUpstream } from "./IHumanSourceGenerationUpstream.ts";

/**
 * One source of `upstream-lock.json`: its generation record plus acquisition detail.
 *
 * @author Samchon
 */
export interface IHumanSourceUpstreamLockSource extends IHumanSourceGenerationUpstream {
  archive: string;
  archiveBytes: number;
  contentFiles: number;
  entries?: string[];
}
