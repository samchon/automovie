import { HumanViewerMixedCompileError } from "./HumanViewerMixedCompileError";
import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority";

/**
 * Refuse a page that mixed browser compiles or received a checked Node realm
 * from a different current source revision. The Node realm reports its actual
 * public loader, owning project and source bytes instead of copying a browser
 * compilation stamp. Such a candidate is refused with
 * `HumanViewerMixedCompileError`, and the host starts a fresh candidate at
 * once, whose modules all come from the newest compile.
 *
 * @evidence contracts/common.md#principled-implementation One browser compile and the actual checked Node receipt must refer to the same selected source revision before publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Detects the mix from the served modules themselves instead of from timing.
 * @evidence contracts/common.md#meaningful-documentation States why a mix arises and what happens to the refused candidate.
 */
export function assertHumanViewerSingleCompile(
  page: readonly string[],
  worker: IHumanViewerNodeAuthority,
  revision: string,
): void {
  if (new Set(page).size > 1 || worker.revision !== revision ||
      worker.loader !== "ttsc/register" || Object.keys(worker.inputs).length === 0)
    throw new HumanViewerMixedCompileError(
      "The source generation was replaced during display: the page ran compiles " +
        page.join(", ") +
        " and the Node realm reports source " + worker.revision,
    );
}
