/** Send bounded actual worker observations through the existing memory IPC channel.
 * Bootstrap has no model identity; execute binds the actual command's three digests.
 * Browser console bytes remain separate from this process's observed RSS.
 *
 * @evidence contracts/common.md#principled-implementation Uses process.pid, UTC and process.memoryUsage at each actual owner boundary and forwards only the fixed native-phase console prefix with current command digests.
 * @evidence contracts/common.md#clear-and-simple-design Separates diagnostic binding and packet limits from the Chrome lifecycle, keeping its worker entry below 500 lines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bootstrap identities are null; Node RSS is never reported as browser memory, and diagnostics cannot substitute a generated result.
 * @evidence contracts/common.md#meaningful-documentation States realm, identity, packet/population limits and best-effort loss on disconnected or failed IPC.
 * @evidence contracts/performance.md#efficient-algorithms Each boundary reads fixed process counters and serializes at most four KiB; no model traversal, source hashing or buffer dump occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work One logger rebinds to each serial execute command; events are observations and are not deduplicated as equivalent work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains three digest strings and a counter; at most 64 packets per bootstrap or command and two KiB of raw browser text per packet escape, with no task or resource acquisition.
 */
export class HumanImageProcessTrace {
  private context: Record<string, string | null> = {
    source: null,
    key: null,
    inputSha256: null,
  };
  private count: number = 0;

  /** Bind diagnostic identity to the actual command without retaining its input.
   *
   * @evidence contracts/common.md#principled-implementation Admits only lowercase SHA-256 strings for the three actual command identities and resets the packet counter.
   * @evidence contracts/common.md#clear-and-simple-design Binding copies identity fields while send owns packet construction and IPC limits.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or malformed identity remains null rather than a guessed digest.
   * @evidence contracts/common.md#meaningful-documentation Documents command identity borrowing without retaining its potentially large input.
   * @evidence contracts/performance.md#efficient-algorithms Examines three bounded strings without hashing or traversing the command payload.
   * @evidence contracts/performance.md#reuse-equivalent-work Rebinds the same logger for each serialized command; a new binding resets its observation allowance.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Replaces three strings and one counter; no command object or native handle is retained.
   */
  public bind(command: Record<string, unknown>): void {
    for (const name of ["source", "key", "inputSha256"]) {
      const value: unknown = command[name];
      this.context[name] =
        typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
          ? value
          : null;
    }
    this.count = 0;
  }

  /** Observe this Node owner at its actual call boundary; closed IPC drops diagnostics.
   *
   * @evidence contracts/common.md#principled-implementation Delegates the supplied phase to send, which reads actual UTC, PID and Node RSS at this boundary.
   * @evidence contracts/common.md#clear-and-simple-design One forwarding method leaves packet admission and IPC failure handling with send.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Node RSS is not browser memory and a dropped diagnostic does not alter generation.
   * @evidence contracts/common.md#meaningful-documentation States the observed realm and loss when IPC is closed.
   * @evidence contracts/performance.md#efficient-algorithms Uses fixed process counters and a packet bounded to four KiB; no model traversal occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the current command binding; distinct boundary observations are not cached as equivalent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Shares send's 64-packet allowance and acquires no handle or retained observation array.
   */
  public node(phase: string): void {
    this.send(phase, null);
  }

  /** Preserve bounded browser console bytes, including its own optional JS heap observation.
   *
   * @evidence contracts/common.md#principled-implementation Accepts only the native-phase prefix and at most 2048 UTF-8 bytes before forwarding raw browser text.
   * @evidence contracts/common.md#clear-and-simple-design Prefix and byte admission stay at the browser-console boundary; send owns the packet.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Raw optional JS-heap text is neither parsed as RSS nor substituted for process counters.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes original browser console bytes from Node observations.
   * @evidence contracts/performance.md#efficient-algorithms Checks prefix and text byte length, then performs the existing bounded packet serialization.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the active command identity and common send path without retaining console history.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Oversized or unrelated text is dropped; accepted text shares the 64-packet and four-KiB packet limits.
   */
  public browser(text: string): void {
    if (
      text.startsWith("human-native-phase ") &&
      Buffer.byteLength(text) <= 2048
    )
      this.send("browser-console", text);
  }

  /** Preserve actual document/history event identity without treating a URL label as a model owner.
   *
   * @evidence contracts/common.md#principled-implementation Forwards observed frame/loader identities and a URL truncated to 512 characters under the actual phase.
   * @evidence contracts/common.md#clear-and-simple-design Document facts occupy their own packet field beside command and process identities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null observations remain null and a URL is never interpreted as model ownership.
   * @evidence contracts/common.md#meaningful-documentation States event provenance and the distinction between document labels and model identity.
   * @evidence contracts/performance.md#efficient-algorithms Copies bounded URL text and delegates to the same bounded serialization; no document traversal occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the command binding and sender, while preserving each admitted event as an observation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary event record shares the packet allowance; this method registers no listener or retained history.
   */
  public document(
    phase: string,
    frameId: string | null,
    loaderId: string | null,
    url: string | null,
  ): void {
    this.send(phase, null, {
      frameId,
      loaderId,
      url: url?.slice(0, 512) ?? null,
    });
  }

  /** Best-effort diagnostics do not change generation or shutdown when IPC closes concurrently. */
  private send(
    phase: string,
    browserConsole: string | null,
    document: {
      frameId: string | null;
      loaderId: string | null;
      url: string | null;
    } | null = null,
  ): void {
    if (
      !process.connected ||
      this.count >= 64 ||
      !/^[a-z][a-z0-9.-]{0,63}$/.test(phase)
    )
      return;
    ++this.count;
    const packet: Record<string, unknown> = {
      kind: "memory",
      phase,
      sequence: this.count,
      utc: new Date().toISOString(),
      workerPid: process.pid,
      ...this.context,
      nodeRssBytes: process.memoryUsage().rss,
      browserConsole,
      browserMetricScope:
        "Only the raw browser console's observed JS heap; not process RSS",
      document,
    };
    if (Buffer.byteLength(JSON.stringify(packet)) > 4096) return;
    try {
      process.send?.(packet, (_error: Error | null): void => undefined);
    } catch {
      /* Diagnostic loss during shutdown does not alter its owner. */
    }
  }
}
