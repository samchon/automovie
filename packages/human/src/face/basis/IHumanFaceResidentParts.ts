import type { IHumanFaceResidentPart } from "./IHumanFaceResidentPart";
import type { IHumanFaceResidentSourceRegion } from "./IHumanFaceResidentSourceRegion";

/**
 * Native face parts and the exact source tables used to gather them.
 * The hair owner also receives the unchanged evaluated source surfaces.
 *
 * @evidence contracts/common.md#principled-implementation One retained native gather returns model parts and the exact evaluated/source-index populations used to produce them, including actual UV splits and generated replacement removal.
 * @evidence contracts/common.md#clear-and-simple-design Part output, shared evaluated surfaces and source-region correspondence remain separate for hair and downstream Person attachment consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Compact retained regions cannot inherit old render numbering; source tables come from the same canonical gather rather than coordinate welding.
 * @evidence contracts/common.md#meaningful-documentation Members identify owned native parts, unchanged evaluated surfaces and actual emitted source correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no gather; its producer owns incidence/buffer work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; hair consumes these exact evaluated surfaces.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no external resource; model/source table ownership stays with the current construction.
 *
 * @author Samchon
 */
export interface IHumanFaceResidentParts {
  /** Owned native model parts; generated assemblies are composed afterward. */
  parts: IHumanFaceResidentPart[];

  /** Exact evaluated source surfaces retained for the existing hair generator. */
  evaluated: ReadonlyMap<string, readonly number[]>;

  /** Actual source correspondence of every emitted native region. */
  sourceRegions: readonly IHumanFaceResidentSourceRegion[];
}
