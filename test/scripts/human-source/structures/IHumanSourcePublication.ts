import type { IHumanSourceSampleFile } from "./IHumanSourceSampleFile.ts";

/** One immutable candidate's output and publication-state owner.
 * Pending or refused files retain diagnostic bytes without normal admission.
 * @author Samchon
 */
export interface IHumanSourcePublication {
  /** Write a previously absent direct child; names cannot escape the directory. */
  write(name: string, bytes: string | Uint8Array): void;
  /** Owned digest records of every successful output write, including receipts. */
  files(): Record<string, IHumanSourceSampleFile>;
  /** Reobserve every output and atomically commit its explicit qualification. */
  complete(
    generation: string,
    completeGeneration: boolean,
    inspectionOnly: boolean,
    verifyInputs: () => void,
  ): void;
  /** Retain all candidate bytes and atomically record the actual refusal. */
  refuse(error: unknown): void;
}
