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
 */
export class ProcessOwnership {
  private static readonly controller = new ProcessOwnershipController(createNodeProcessOwnershipHost());

  /**
   * Retain a freshly spawned child's identity without mutating its handle.
   * An already exited or unidentifiable child receives no stop authority.
   */
  public static own(child: ChildProcess): void {
    ProcessOwnership.controller.own(child);
  }

  /**
   * Stop a captured child only while its original child handle remains live.
   * A live child without a captured creation stamp refuses; an ended child
   * requires no termination through an integer PID that may have been reused.
   */
  public static stopChild(child: ChildProcess): void {
    ProcessOwnership.controller.stopChild(child);
  }

  /**
   * Read a living PID's creation identity; an absent process has no identity.
   * Windows uses the process creation stamp, Linux joins boot identity and
   * process start ticks, and other POSIX systems supply their ps creation date.
   * Operational failures propagate rather than inventing an identity.
   */
  public static read(pid: number): string | null {
    return ProcessOwnership.controller.read(pid);
  }

  /**
   * Admit a creation-ordered process tree from an immutable OS snapshot. The
   * returned parent-first order prevents a stopped parent from spawning more
   * children while its existing descendants are being stopped. Ambiguous or
   * missing root identities refuse the whole operation.
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
   */
  public static stop(pid: number, createdAt: string): void {
    ProcessOwnership.controller.stop(pid, createdAt);
  }
}
