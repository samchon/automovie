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

  /** Bind diagnostic identity to the actual command without retaining its input. */
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

  /** Observe this Node owner at its actual call boundary; closed IPC drops diagnostics. */
  public node(phase: string): void {
    this.send(phase, null);
  }

  /** Preserve bounded browser console bytes, including its own optional JS heap observation. */
  public browser(text: string): void {
    if (
      text.startsWith("human-native-phase ") &&
      Buffer.byteLength(text) <= 2048
    )
      this.send("browser-console", text);
  }

  /** Preserve actual document/history event identity without treating a URL label as a model owner. */
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
