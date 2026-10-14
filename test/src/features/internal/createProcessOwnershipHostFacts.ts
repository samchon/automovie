import type { IProcessOwnershipHost } from "../../../../packages/viewer/src/process/internal/IProcessOwnershipHost";

/** Values arranged by existing portable admission tests, without native effects. */
type ProcessHostFacts = {
  identities: Map<number, string | null>;
  snapshot: Array<{ pid: number; parentPid: number; createdAt: string }>;
  readError: Error | null;
  snapshotError: Error | null;
  stopError: Error | null;
  signalError: Error | null;
  calls: Array<
    | { kind: "read"; pid: number }
    | { kind: "snapshot" }
    | {
        kind: "windows-stop";
        targets: Array<{ pid: number; createdAt: string }>;
      }
    | { kind: "signal"; pid: number }
  >;
};

/**
 * Typed discovery facts and requested effects for process-admission unit cases.
 * This host records the controller's requests; it implements no operating-system
 * process, filesystem, native handle or ChildProcess method.
 */
export function createProcessOwnershipHostFacts(windows: boolean): {
  facts: ProcessHostFacts;
  host: IProcessOwnershipHost;
} {
  const facts: ProcessHostFacts = {
    identities: new Map<number, string | null>(),
    snapshot: [] as Array<{
      pid: number;
      parentPid: number;
      createdAt: string;
    }>,
    readError: null as Error | null,
    snapshotError: null as Error | null,
    stopError: null as Error | null,
    signalError: null as Error | null,
    calls: [] as Array<
      | { kind: "read"; pid: number }
      | { kind: "snapshot" }
      | {
          kind: "windows-stop";
          targets: Array<{ pid: number; createdAt: string }>;
        }
      | { kind: "signal"; pid: number }
    >,
  };
  const host: IProcessOwnershipHost = {
    windows,
    readIdentity: (pid: number): string | null => {
      facts.calls.push({ kind: "read", pid });
      if (facts.readError !== null) throw facts.readError;
      return facts.identities.get(pid) ?? null;
    },
    snapshot: (): Array<{
      pid: number;
      parentPid: number;
      createdAt: string;
    }> => {
      facts.calls.push({ kind: "snapshot" });
      if (facts.snapshotError !== null) throw facts.snapshotError;
      return facts.snapshot;
    },
    terminateWindows: (
      targets: ReadonlyArray<{ pid: number; createdAt: string }>,
    ): void => {
      facts.calls.push({
        kind: "windows-stop",
        targets: structuredClone([...targets]),
      });
      if (facts.stopError !== null) throw facts.stopError;
    },
    signal: (pid: number): void => {
      facts.calls.push({ kind: "signal", pid });
      if (facts.signalError !== null) throw facts.signalError;
    },
  };
  return { facts, host };
}
