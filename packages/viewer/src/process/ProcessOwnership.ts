import type { ChildProcess } from "node:child_process";

import { createNodeProcessOwnershipHost } from "./internal/createNodeProcessOwnershipHost.ts";
import { ProcessOwnershipController } from "./internal/ProcessOwnershipController.ts";
import { selectProcessOwnershipTree } from "./internal/selectProcessOwnershipTree.ts";

/**
 * Process identity and explicit termination for session-owned services. A PID
 * alone is not an identity: a persisted record must also retain its operating
 * system creation stamp. Windows ancestry is admitted only when every child
 * was created after its currently identified parent. Each selected process is
 * reopened and checked through a retained handle before any termination, so
 * neither stale parent IDs nor PID reuse can extend the termination boundary.
 *
 * Windows stamps have the microsecond precision exposed by Win32_Process;
 * Linux stamps join the kernel boot ID and boot-relative start ticks, so a
 * record cannot adopt the same PID after a reboot. Other POSIX platforms
 * expose the creation date through ps. POSIX signalling retains the operating
 * system's PID-based race and does not recursively terminate descendants.
 *
 * @evidence contracts/common.md#principled-implementation Windows creation stamps and retained process handles establish the selected operating-system identities before termination.
 * @evidence contracts/common.md#clear-and-simple-design The stable static facade composes one capture/admission controller with the actual Node effect host; native effects and pure result interpretation retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No process is selected by executable name and no recursive operating-system kill extends the admitted set.
 * @evidence contracts/common.md#meaningful-documentation States identity precision, ancestry rules, failure effects and the POSIX signalling limitation.
 */
export class ProcessOwnership {
  private static readonly controller = new ProcessOwnershipController(createNodeProcessOwnershipHost());

  /**
   * Retain a freshly spawned child's identity without mutating its handle.
   * An already exited or unidentifiable child receives no stop authority.
   *
   * @evidence contracts/common.md#principled-implementation The child handle and its observed OS creation stamp jointly retain the spawned process identity for later termination admission.
   * @evidence contracts/common.md#clear-and-simple-design One WeakMap records identities while the ChildProcess object retains its original lifecycle observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace child methods, infer ownership from executable names or synthesize a creation stamp for an absent process.
   * @evidence contracts/common.md#meaningful-documentation States capture timing, unchanged handle ownership and the absence of authority when identity cannot be established.
   */
  public static own(child: ChildProcess): void {
    ProcessOwnership.controller.own(child);
  }

  /**
   * Stop a captured child only while its original child handle remains live.
   * A live child without a captured creation stamp refuses; an ended child
   * requires no termination through an integer PID that may have been reused.
   *
   * @evidence contracts/common.md#principled-implementation Original exit/signal observations and the captured OS creation stamp determine whether the same spawned child can still be stopped.
   * @evidence contracts/common.md#clear-and-simple-design One child-handle adapter delegates platform termination to stop while sharing the capture map created by own.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses missing capture authority and never expands termination by executable name, elapsed time or blind descendant traversal.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes an ended child from a live but unstamped child and states the latter's explicit refusal.
   */
  public static stopChild(child: ChildProcess): void {
    ProcessOwnership.controller.stopChild(child);
  }

  /**
   * Read a living PID's creation identity; an absent process has no identity.
   * Windows uses the process creation stamp, Linux joins boot identity and
   * process start ticks, and other POSIX systems supply their ps creation date.
   * Operational failures propagate rather than inventing an identity.
   *
   * @evidence contracts/common.md#principled-implementation Native OS creation information distinguishes the current PID allocation, including Linux reboot identity and Windows microsecond precision.
   * @evidence contracts/common.md#clear-and-simple-design One platform boundary supplies the opaque creation identity to both owned-child capture and persisted process records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses native process APIs, procfs or ps without process-name matching, guessed age or private launcher state as a substitute identity.
   * @evidence contracts/common.md#meaningful-documentation States platform representations, absent-process null and propagation of operational discovery failures.
   */
  public static read(pid: number): string | null {
    return ProcessOwnership.controller.read(pid);
  }

  /**
   * Admit a creation-ordered process tree from an immutable OS snapshot. The
   * returned parent-first order prevents a stopped parent from spawning more
   * children while its existing descendants are being stopped. Ambiguous or
   * missing root identities refuse the whole operation.
   *
   * @evidence contracts/common.md#principled-implementation A unique PID/creation snapshot and strictly later child creation admit only descendants of the same currently identified parent allocation.
   * @evidence contracts/common.md#clear-and-simple-design One parent-first traversal owns ancestry admission independently of native handle opening or termination.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects ambiguous snapshots and reused roots instead of adopting stale parent IDs or invoking a shell's unchecked recursive process kill.
   * @evidence contracts/common.md#meaningful-documentation Defines immutable snapshot ownership, creation-order ancestry and refusal before any process is terminated.
   */
  public static tree(
    snapshot: ReadonlyArray<{ pid: number; parentPid: number; createdAt: string }>,
    root: { pid: number; createdAt: string },
  ): Array<{ pid: number; createdAt: string }> {
    return selectProcessOwnershipTree(snapshot, root);
  }

  /**
   * Stop only the recorded identity. Windows first pins and checks the complete
   * admitted set, then terminates those handles without /T. Identity or access
   * failures occur before the first termination and leave the ownership record
   * for the caller to retain. A process that already exited requires no action.
   * POSIX checks creation immediately before SIGTERM; the native PID-based
   * check/signal race remains and no descendants are recursively stopped there.
   *
   * @evidence contracts/common.md#principled-implementation Windows pins and verifies all admitted process handles before termination; POSIX verifies the current creation identity before its explicit signal, with its documented native race.
   * @evidence contracts/common.md#clear-and-simple-design Shared identity discovery and tree admission select the termination boundary before each platform performs its native operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects absent creation authority and PID reuse, uses individual retained Windows handles without taskkill tree expansion, and never selects unrelated processes by name.
   * @evidence contracts/common.md#meaningful-documentation States pre-termination identity/access refusal, absent-process behavior and the POSIX signalling limitation without claiming atomicity.
   */
  public static stop(pid: number, createdAt: string): void {
    ProcessOwnership.controller.stop(pid, createdAt);
  }
}
