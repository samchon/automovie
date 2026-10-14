import type { ChildProcess } from "node:child_process";

import { createNodeProcessOwnershipHost } from "./internal/createNodeProcessOwnershipHost.ts";
import { ProcessOwnershipController } from "./internal/ProcessOwnershipController.ts";
import { selectProcessOwnershipTree } from "./internal/selectProcessOwnershipTree.ts";

/**
 * Process identity and explicit termination for session-owned services. A PID alone is not an identity: a persisted record must also retain its operating system creation stamp. Windows ancestry is admitted only when every child was created after its currently identified parent. Each selected process is reopened and checked through a retained handle before any termination, so neither stale parent IDs nor PID reuse can extend the termination boundary.
 *
 * Windows stamps have the microsecond precision exposed by Win32_Process; Linux stamps join the kernel boot ID and boot-relative start ticks, so a record cannot adopt the same PID after a reboot. Other POSIX platforms expose the creation date through ps. POSIX signalling retains the operating system's PID-based race and does not recursively terminate descendants.
 *
 * @evidence contracts/common.md#principled-implementation Composes one native-host controller so pid plus observed creation identity admits explicit owned-service stop, with Windows creation-ordered snapshot/retained-handle checks and POSIX checked root signalling.
 * @evidence contracts/common.md#clear-and-simple-design The static facade exposes discovery/capture/tree/stop while mutable child state, platform IO and pure tree/decoder logic keep separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Discovery does not grant permission to stop another owner's process, snapshots are not namespace locks and capture/public completion do not independently certify every native lifecycle race.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies caller ownership, Windows microsecond stamp precision, Linux boot/start text, other POSIX date precision and the remaining PID check/signal race.
 * @evidence contracts/performance.md#efficient-algorithms Facade work delegates to its controller and native operations; Windows snapshot/tree/handle work scales with processes/admitted descendants and POSIX root discovery uses its platform transport.
 * @evidence contracts/performance.md#reuse-equivalent-work The one controller shares original-child capture records; stop still reads current identities and does not reuse stale pid-only discovery as permission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Static state contains a controller with weak child keys, not a strong OS-process registry; each native operation owns and retires its transient transport/handles and native stop uncertainty remains reported.
 */
export class ProcessOwnership {
  private static readonly controller: ProcessOwnershipController = new ProcessOwnershipController(createNodeProcessOwnershipHost());

  /**
   * Retain a freshly spawned child's identity without mutating its handle. An already exited or unidentifiable child receives no stop authority.
   *
   * @evidence contracts/common.md#principled-implementation Delegates capture for a freshly spawned original ChildProcess object, refusing missing/observed-ended children before asking native birth identity.
   * @evidence contracts/common.md#clear-and-simple-design Original object capture stays with the shared controller rather than exposing its weak identity map in the public facade.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Another object with the same pid does not inherit capture; a current pid birth query is not independently atomic proof of original-child origin under every native race.
   * @evidence contracts/common.md#meaningful-documentation The method documents original child ownership, ended/absent refusal and no invented creation stamp.
   * @evidence contracts/performance.md#efficient-algorithms Weak membership is expected constant work while first valid capture incurs native identity discovery; repeated successful capture avoids another query.
   * @evidence contracts/performance.md#reuse-equivalent-work The first successful stamp is kept for that exact original child object and never replaced by later discovery of the same pid.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Capture adds a weak child-to-stamp record without taking a new process handle or retaining the child globally; the actual caller owns its lifecycle.
   */
  public static own(child: ChildProcess): void {
    ProcessOwnership.controller.own(child);
  }

  /**
   * Stop a captured child only while its original child handle remains live. A live child without a captured creation stamp refuses; an ended child requires no termination through an integer PID that may have been reused.
   *
   * @evidence contracts/common.md#principled-implementation Requires the original captured child's live reported lifecycle and delegates its recorded creation stamp to current native stop admission.
   * @evidence contracts/common.md#clear-and-simple-design The facade preserves one child-handle lifetime selector while platform checking/signalling stay behind the controller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A live unstamped child refuses, an ended child requests no pid signal and captured identity does not authorize unrelated objects or processes.
   * @evidence contracts/common.md#meaningful-documentation Documentation identifies original object/lifecycle and missing-stamp failure before native discovery.
   * @evidence contracts/performance.md#efficient-algorithms Fixed child/map checks precede the platform's current identity and admitted-tree/native termination costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The same object's original capture is reused as expected identity, but the current OS allocation is still checked before each requested stop.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The method borrows its original child object and owns no new persistent handle; native operations retire their acquired handle set and failures do not certify exit.
   */
  public static stopChild(child: ChildProcess): void {
    ProcessOwnership.controller.stopChild(child);
  }

  /**
   * Read a living PID's creation identity; an absent process has no identity. Windows uses the process creation stamp, Linux joins boot identity and process start ticks, and other POSIX systems supply their ps creation date. Operational failures propagate rather than inventing an identity.
   *
   * @evidence contracts/common.md#principled-implementation Validates the pid selector and reads platform-native creation identity, preserving null absence and original operational failure.
   * @evidence contracts/common.md#clear-and-simple-design One facade method supplies discovery while pure decoders and platform effects retain their own owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A birth fact is not stop permission, and malformed selectors do not trigger process discovery.
   * @evidence contracts/common.md#meaningful-documentation The comment names platform identity forms, living-versus-absent result and failure propagation.
   * @evidence contracts/performance.md#efficient-algorithms Selector work is fixed; Linux file reads, other POSIX ps and Windows hidden process/handle query account for native discovery cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Every requested discovery reads current native facts and no pid-only cached birth substitutes for a new allocation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned identity text owns no process handle; native query file/subprocess/handle resources belong to their synchronous host operation.
   */
  public static read(pid: number): string | null {
    return ProcessOwnership.controller.read(pid);
  }

  /**
   * Admit a creation-ordered process tree from an immutable OS snapshot. Parent-first output orders later host requests; the snapshot cannot include children created after observation and is not a process-namespace lock. Ambiguous or missing root identities refuse the whole operation.
   *
   * @evidence contracts/common.md#principled-implementation Delegates immutable Windows pid/parent/birth observations to the pure tree owner, which requires strictly older current parent identity before admitting an edge.
   * @evidence contracts/common.md#clear-and-simple-design Pure ancestry selection stays separate from OS snapshot and termination effects, preserving parent-first output.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale parent pid alone cannot extend the stop set, and the snapshot does not certify children created after it.
   * @evidence contracts/common.md#meaningful-documentation Documentation states creation-ordered admission, missing/reused root refusal and parent-first purpose.
   * @evidence contracts/performance.md#efficient-algorithms The selector validates/indexes P snapshot records and interprets each decimal birth once, then visits admitted-parent child buckets, O(P+T) record work plus decimal parsing/comparison cost with O(P+T) references.
   * @evidence contracts/performance.md#reuse-equivalent-work One supplied immutable snapshot supports the call; no ancestry result is cached across later process allocations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned pid/stamp copies own no native handles and this pure facade call acquires or terminates no process.
   */
  public static tree(
    snapshot: ReadonlyArray<{ pid: number; parentPid: number; createdAt: string }>,
    root: { pid: number; createdAt: string },
  ): Array<{ pid: number; createdAt: string }> {
    return selectProcessOwnershipTree(snapshot, root);
  }

  /**
   * Stop only the recorded identity. Windows first pins and checks the complete admitted set, then terminates those handles without /T. Identity or access failures occur before the first termination and leave the ownership record for the caller to retain. A process that already exited requires no action. POSIX checks creation immediately before SIGTERM; the native PID-based check/signal race remains and no descendants are recursively stopped there.
   *
   * @evidence contracts/common.md#principled-implementation Requires explicit caller ownership and exact expected creation identity, then uses complete-set Windows handle checks before parent-first termination or a current checked POSIX root signal.
   * @evidence contracts/common.md#clear-and-simple-design The facade forwards an admitted selector while controller ancestry decisions and host effects own native operation details.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No age threshold, recursive taskkill expansion or pid-only match replaces identity; POSIX check/signal and precision limits are explicitly unresolved native boundaries.
   * @evidence contracts/common.md#meaningful-documentation Documentation describes pretermination checks, absent-root no-op, partial later failure, Windows set scope and POSIX root-only behavior.
   * @evidence contracts/performance.md#efficient-algorithms Windows discovery/tree selection and T native handle operations dominate; POSIX performs one identity query then one signal for the owned root.
   * @evidence contracts/performance.md#reuse-equivalent-work Each effect rechecks current allocation facts; a previous successful identity/stop observation cannot authorize a reused pid.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Windows host retains then disposes its finite admitted handle set even on failure; later termination refusal may leave a partially stopped set and no success is invented.
   */
  public static stop(pid: number, createdAt: string): void {
    ProcessOwnership.controller.stop(pid, createdAt);
  }
}
