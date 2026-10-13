import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { stepHumanBodyArmsDown } from "./stepHumanBodyArmsDown";

/**
 * Synchronously consume the current body's stepped lateral arms-down search.
 *
 * stepHumanBodyArmsDown owns the actual skin partition, whole-degree candidate builds, per-pair crossing-count reference and final cross-arm check. Its lateral plane-zero/axial-zero goals use neutral elevations as the search endpoint; the reference need not equal a basis's complete native neutral pose. The result is a sampled geometric preset rather than a physiological resting-force solve or certification of a clear continuous path.
 *
 * Returned document rows replace each lower-arm row with flexion zero and unspecified abduction/twist, and replace both TT goals; other rows and document fields remain unchanged. Builder/combined-count failures propagate without clamping. This convenience consumes all generator steps synchronously, so responsive hosts retain the stepped entry and hand back their thread between builds. Equal reference counts do not prove that crossing witnesses stayed unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The existing stepped owner evaluates actual candidate skin and reference crossing counts, and this wrapper consumes it to its final ordinary pose/shoulder document result.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous convenience shares all search semantics with the worker's cancellable stepped path without duplicating contact or pose logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Builder failures and increased combined counts propagate; sampled count acceptance cannot certify clinical rest, witness identity or continuous collision-free motion.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies preset/reference conventions, replaced rows, unchanged other fields and synchronous versus host-stepped execution.
 * @evidence contracts/performance.md#efficient-algorithms Wrapper work is constant per yielded step, while the shared owner pays each actual body build, partition and relevant mesh crossing queries.
 * @evidence contracts/performance.md#reuse-equivalent-work The same generator owns both synchronous and responsive operations, retaining its basis partition and reference state instead of recreating them per step.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The generator expires after synchronous completion or thrown failure; document rows escape without retaining candidate geometry, timers or external tasks.
 */
export function solveHumanBodyArmsDown(
  basis: IAutoMovieHumanBodyBasis,
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild,
  document: IAutoMovieHumanBodyBasisDocument,
): Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders"> {
  const steps: ReturnType<typeof stepHumanBodyArmsDown> = stepHumanBodyArmsDown(basis, build, document);
  for (;;) {
    const next: ReturnType<typeof steps.next> = steps.next();
    if (next.done === true) return next.value;
  }
}
