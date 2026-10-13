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
 *
 * @evidence contracts/common.md#principled-implementation The constructor retains one actual host for its lifetime; original child objects retain captured creation stamps, and current host facts admit an explicit stop of those same allocations.
 * @evidence contracts/common.md#clear-and-simple-design One lifetime host supplies discovery and termination effects while one capture map owns child authority and stop admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Composition accepts its own effect port without changing OS globals or observed child methods; age and executable names cannot grant stop authority.
 * @evidence contracts/common.md#meaningful-documentation States lifetime host composition, capture-key ownership, failure propagation and explicit identity admission before effects.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Keeps one session's lifetime host and captured original-child authority distinct from discovery and native termination effects.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The public facade supplies the actual Node host once; the retained controller uses it for creation discovery, ancestry admission and explicit termination.
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
   *
   * @evidence contracts/common.md#principled-implementation Captures the first actual host identity under the original child-object key.
   * @evidence contracts/common.md#clear-and-simple-design One WeakMap owns capture authority without mutating the child object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not synthesize absent identities or adopt a newer allocation during re-capture.
   * @evidence contracts/common.md#meaningful-documentation States one-time capture and absence/failure effects.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Retains the original spawned allocation instead of adopting a reused PID.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Stores actual host creation identity under the original child observation.
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
   *
   * @evidence contracts/common.md#principled-implementation Uses original exit/signal observations and captured birth identity before a stop request.
   * @evidence contracts/common.md#clear-and-simple-design Child-lifecycle admission delegates the shared platform decision to stop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never signals an ended child through a possibly reused integer PID or grants unstamped authority.
   * @evidence contracts/common.md#meaningful-documentation Defines ended, uncreated and unstamped live-child outcomes.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Leaves ended or unowned child observations outside termination effects.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Admits only an original live child with retained creation authority.
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
   *
   * @evidence contracts/common.md#principled-implementation Admits the positive safe-integer PID before consuming actual host discovery.
   * @evidence contracts/common.md#clear-and-simple-design Shared selector admission precedes the single discovery effect.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not turn discovery failure into a guessed identity.
   * @evidence contracts/common.md#meaningful-documentation States admission timing and unchanged host outcomes.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Supplies actual allocation observations only for admitted process selectors.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Owns selector admission before native creation discovery.
   */
  public read(pid: number): string | null {
    requireProcessId(pid);
    return this.host.readIdentity(pid);
  }

  /**
   * Admit a Windows handle set or one POSIX signal from current creation facts.
   * No age or probe result is an input. Native host failures propagate, and a
   * POSIX check/signal remains separate effects with its documented native race.
   *
   * @evidence contracts/common.md#principled-implementation Admits a complete creation-ordered Windows set or an exact current POSIX root stamp before requesting native effects.
   * @evidence contracts/common.md#clear-and-simple-design One stop decision consumes fresh observations and shares ancestry admission with the public tree API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Has no age, name or silence input and propagates identity or host failures without unchecked recursive termination.
   * @evidence contracts/common.md#meaningful-documentation States the host-effect order and retained POSIX check/signal race.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Refuses mismatched allocation authority before a platform termination request.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Owns creation admission while the native host owns actual handle or signal effects.
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
