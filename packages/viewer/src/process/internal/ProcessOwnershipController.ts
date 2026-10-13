import type { IProcessChildObservation } from "./IProcessChildObservation.js";
import type { IProcessOwnershipHost } from "./IProcessOwnershipHost.js";
import { requireProcessId } from "./requireProcessId.ts";
import { selectProcessOwnershipTree } from "./selectProcessOwnershipTree.ts";

/**
 * Own capture authority and explicit stop admission for one host. The host
 * supplies actual OS facts/effects; this controller owns the mutable child
 * capture map, original child lifecycle checks and identity decisions. The
 * public ProcessOwnership facade composes it with the Node host. Typed host
 * results can exercise these decisions without simulating a kernel, replacing
 * a ChildProcess method or introducing a special public test mode.
 */
export class ProcessOwnershipController {
  private readonly children = new WeakMap<IProcessChildObservation, string>();
  private readonly host: IProcessOwnershipHost;

  /**
   * Production composition supplies the native effect host. The controller
   * retains this port for its lifetime and never replaces operating-system
   * globals or methods on its observed child objects.
   */
  public constructor(host: IProcessOwnershipHost) {
    this.host = host;
  }

  /**
   * Capture once per original child object. Absence or failure cannot invent a
   * creation identity, and later discovery cannot replace an existing stamp.
   */
  public own(child: IProcessChildObservation): void {
    if (this.children.has(child) || child.pid === undefined) return;
    const createdAt = this.read(child.pid);
    if (createdAt !== null) this.children.set(child, createdAt);
  }

  /**
   * An actual observed exit needs no signal. A live child without capture
   * authority refuses before discovery, while a captured child delegates its
   * recorded stamp to the platform identity admission.
   */
  public stopChild(child: IProcessChildObservation): void {
    if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined)
      return;
    const createdAt = this.children.get(child);
    if (createdAt === undefined)
      throw new Error("The child has no captured process creation identity");
    this.stop(child.pid, createdAt);
  }

  /**
   * Refuse a malformed selector before discovery. The host's actual stamp,
   * absent null or original operational failure remains the result.
   */
  public read(pid: number): string | null {
    requireProcessId(pid);
    return this.host.readIdentity(pid);
  }

  /**
   * Admit a Windows handle set or one POSIX signal from current creation facts.
   * No age or probe result is an input. Native host failures propagate, and a
   * POSIX check/signal remains separate effects with its documented native race.
   */
  public stop(pid: number, createdAt: string): void {
    requireProcessId(pid);
    if (!createdAt) throw new Error("A process creation identity is required");
    if (this.host.windows) {
      const snapshot = this.host.snapshot();
      if (!snapshot.some((entry) => entry.pid === pid)) return;
      this.host.terminateWindows(selectProcessOwnershipTree(snapshot, { pid, createdAt }));
      return;
    }
    const current = this.read(pid);
    if (current === null) return;
    if (current !== createdAt)
      throw new Error("The owned process has exited or its PID was reused");
    this.host.signal(pid);
  }
}
