import type { IHumanSourceUpstreamLockSource } from "./IHumanSourceUpstreamLockSource.ts";

/**
 * `upstream-lock.json`: the pinned upstream of every source generation.
 *
 * @author Samchon
 */
export interface IHumanSourceUpstreamLock {
  schema: string;
  sources: IHumanSourceUpstreamLockSource[];
}
