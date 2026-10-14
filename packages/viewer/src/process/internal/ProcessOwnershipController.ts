import type { IProcessChildObservation } from "./IProcessChildObservation.js";
import type { IProcessOwnershipHost } from "./IProcessOwnershipHost.js";
import { requireProcessId } from "./requireProcessId.ts";
import { selectProcessOwnershipTree } from "./selectProcessOwnershipTree.ts";

/**
 * Own capture authority and explicit stop admission for one host. The host supplies actual OS facts/effects; this controller owns the mutable child capture map, original child lifecycle checks and identity decisions. The public ProcessOwnership facade composes it with the Node host. Typed host results can exercise these decisions without simulating a kernel, replacing a ChildProcess method or introducing a special public test mode.
 *
 * @evidence contracts/common.md#principled-implementation Combines weak original-child capture with current native identity and creation-ordered Windows tree admission for explicit owned stop requests.
 * @evidence contracts/common.md#clear-and-simple-design Mutable capture state is separate from native effects and pure decoders/tree selection; the constructor borrows one fixed host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or observed-ended children acquire no stamp, same-pid replacement objects have no capture and supplied host facts are not independent native lifecycle proof.
 * @evidence contracts/common.md#meaningful-documentation Class/method prose distinguishes capture, discovery, caller ownership, platform admission and native race/precision limits.
 * @evidence contracts/performance.md#efficient-algorithms Weak lookups are expected constant work, native queries dominate capture/read and Windows stop uses snapshot/tree/handle processing with its declared process dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful original-object stamp is shared without recapture; every stop still checks current allocation and no cached discovery grants new permission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak child keys avoid a global strong child population, the host reference lasts with the controller and concrete host operations own/retire transient handles.
 */
export class ProcessOwnershipController {
  private readonly children: WeakMap<IProcessChildObservation, string> = new WeakMap();
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
   * Capture once per original child object. Absence or failure cannot invent a creation identity, and later discovery cannot replace an existing stamp.
   *
   * @evidence contracts/common.md#principled-implementation Checks original-object capture and missing/observed-ended lifecycle before reading and storing a non-null current birth stamp.
   * @evidence contracts/common.md#clear-and-simple-design One weak map owns successful capture; absent or failed discovery leaves the object unstamped for the caller to observe or retry capture.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A later successful discovery cannot replace an existing stamp, and this observed-property/native-query sequence is not an atomic birth receipt under all OS races.
   * @evidence contracts/common.md#meaningful-documentation Documentation identifies first successful stamp, no invented identity and refusal of ended original objects before host effects.
   * @evidence contracts/performance.md#efficient-algorithms Fixed weak/lifecycle checks precede at most one native discovery for an unstamped live child.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated capture of a stamped object shares its existing expected identity rather than querying a possibly reused pid again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a weak child key and stamp value are retained; actual child ownership stays with its caller and the native query's temporary resources stay with the host.
   */
  public own(child: IProcessChildObservation): void {
    if (this.children.has(child) || child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
    const createdAt: string | null = this.read(child.pid);
    if (createdAt !== null) this.children.set(child, createdAt);
  }

  /**
   * An actual observed exit needs no signal. A live child without capture authority refuses before discovery, while a captured child delegates its recorded stamp to the platform identity admission.
   *
   * @evidence contracts/common.md#principled-implementation Treats an observed exit or absent pid as ended, otherwise requires that exact object's captured stamp before requesting current platform stop admission.
   * @evidence contracts/common.md#clear-and-simple-design Original-child lifecycle selection is one method and recorded-identity native stop is delegated to the common stop path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Another object with the same pid cannot borrow authority and a live unstamped object refuses before any host discovery/signal.
   * @evidence contracts/common.md#meaningful-documentation The comment explains ended no-op, missing capture refusal and original recorded stamp use.
   * @evidence contracts/performance.md#efficient-algorithms Fixed lifecycle/map checks precede the native current-identity or Windows snapshot/tree costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The original captured stamp is reused only as expected identity; the current OS allocation must still match before effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The original observation is borrowed and no new strong child record or persistent process handle is added.
   */
  public stopChild(child: IProcessChildObservation): void {
    if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined)
      return;
    const createdAt: string | undefined = this.children.get(child);
    if (createdAt === undefined)
      throw new Error("The child has no captured process creation identity");
    this.stop(child.pid, createdAt);
  }

  /**
   * Refuse a malformed selector before discovery. The host's actual stamp, absent null or original operational failure remains the result.
   *
   * @evidence contracts/common.md#principled-implementation Validates a positive integral pid through the shared selector owner before invoking actual host birth discovery.
   * @evidence contracts/common.md#clear-and-simple-design Selector admission and host IO remain separate operations so malformed selectors cannot reach native effects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null absence and original host failure remain distinct, and returned discovery does not confer caller ownership.
   * @evidence contracts/common.md#meaningful-documentation Documentation identifies pre-discovery selector refusal and unchanged native result semantics.
   * @evidence contracts/performance.md#efficient-algorithms Pid validation is fixed work followed by the concrete platform's current identity query.
   * @evidence contracts/performance.md#reuse-equivalent-work No controller discovery memo substitutes an older birth for this read; weak capture storage is a separate expected-identity operation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The method retains no result or handle after return and the host owns temporary discovery transport resources.
   */
  public read(pid: number): string | null {
    requireProcessId(pid);
    return this.host.readIdentity(pid);
  }

  /**
   * Admit a Windows handle set or one POSIX signal from current creation facts. No age or probe result is an input. Native host failures propagate, and a POSIX check/signal remains separate effects with its documented native race.
   *
   * @evidence contracts/common.md#principled-implementation Requires admitted pid and nonempty expected identity, then checks a current Windows tree/complete handle set or current POSIX root identity before signalling.
   * @evidence contracts/common.md#clear-and-simple-design One platform branch joins shared selector/tree logic with supplied native effects without moving capture state into the host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent root needs no termination, a reused allocation refuses, no age/fixture branch grants authority and POSIX check/signal remains non-atomic.
   * @evidence contracts/common.md#meaningful-documentation The method documents creation-based admission, explicit caller ownership and different native stop guarantees.
   * @evidence contracts/performance.md#efficient-algorithms Windows work scales with snapshot/admitted target populations while POSIX uses one current discovery and one root signal.
   * @evidence contracts/performance.md#reuse-equivalent-work Fresh allocation facts govern each requested effect; no earlier successful stop or snapshot result is cached as authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The controller retains only temporary value records during stop; the host owns all pinned handles, disposal and native termination uncertainty.
   */
  public stop(pid: number, createdAt: string): void {
    requireProcessId(pid);
    if (!createdAt) throw new Error("A process creation identity is required");
    if (this.host.windows) {
      const snapshot: ReturnType<IProcessOwnershipHost["snapshot"]> = this.host.snapshot();
      if (!snapshot.some((entry: (typeof snapshot)[number]): boolean => entry.pid === pid)) return;
      this.host.terminateWindows(selectProcessOwnershipTree(snapshot, { pid, createdAt }));
      return;
    }
    const current: string | null = this.read(pid);
    if (current === null) return;
    if (current !== createdAt)
      throw new Error("The owned process has exited or its PID was reused");
    this.host.signal(pid);
  }
}
