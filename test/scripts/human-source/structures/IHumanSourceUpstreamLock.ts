import type { IHumanSourceUpstreamLockSource } from "./IHumanSourceUpstreamLockSource.ts";

/**
 * `upstream-lock.json`: the pinned upstream of every source generation.
 *
 * A consumed source is acquired, verified and read by the skin sampler. A
 * source that is not consumed is pinned for the rights chain: its archive and
 * member digests and the license determination are recorded here before a
 * producer reads it, so the acquisition step verifies it when its archive is
 * present and skips it when absent. The lock's own digest enters every
 * generation identity, so a rights correction here requires a new
 * acquisition record and a new generation.
 *
 * @author Samchon
 */
export interface IHumanSourceUpstreamLock {
  schema: string;
  sources: IHumanSourceUpstreamLockSource[];
}
