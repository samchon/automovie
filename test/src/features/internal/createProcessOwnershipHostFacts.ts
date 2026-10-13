/**
 * Typed discovery facts and requested effects for process-admission unit cases.
 * This host records the controller's requests; it implements no operating-system
 * process, filesystem, native handle or ChildProcess method.
 */
export function createProcessOwnershipHostFacts(windows: boolean) {
  const facts = {
    identities: new Map<number, string | null>(),
    snapshot: [] as Array<{ pid: number; parentPid: number; createdAt: string }>,
    readError: null as Error | null,
    snapshotError: null as Error | null,
    stopError: null as Error | null,
    signalError: null as Error | null,
    calls: [] as Array<
      | { kind: "read"; pid: number }
      | { kind: "snapshot" }
      | { kind: "windows-stop"; targets: Array<{ pid: number; createdAt: string }> }
      | { kind: "signal"; pid: number }
    >,
  };
  const host = {
    windows,
    readIdentity: (pid: number) => {
      facts.calls.push({ kind: "read", pid });
      if (facts.readError !== null) throw facts.readError;
      return facts.identities.get(pid) ?? null;
    },
    snapshot: () => {
      facts.calls.push({ kind: "snapshot" });
      if (facts.snapshotError !== null) throw facts.snapshotError;
      return facts.snapshot;
    },
    terminateWindows: (targets: ReadonlyArray<{ pid: number; createdAt: string }>) => {
      facts.calls.push({ kind: "windows-stop", targets: structuredClone([...targets]) });
      if (facts.stopError !== null) throw facts.stopError;
    },
    signal: (pid: number) => {
      facts.calls.push({ kind: "signal", pid });
      if (facts.signalError !== null) throw facts.signalError;
    },
  };
  return { facts, host };
}
