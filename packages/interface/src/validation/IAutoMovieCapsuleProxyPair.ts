import type { IAutoMovieCapsuleProxy } from "./IAutoMovieCapsuleProxy";

/** Declare one capsule pair to include in a self-intersection check. */
export interface IAutoMovieCapsuleProxyPair {
  /** First capsule in the pair. */
  first: IAutoMovieCapsuleProxy;

  /** Second capsule in the pair. */
  second: IAutoMovieCapsuleProxy;
}
