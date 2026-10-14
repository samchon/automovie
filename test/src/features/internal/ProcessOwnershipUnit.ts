import type { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
import type { ChildProcess, SpawnSyncReturns } from "node:child_process";
import path from "node:path";

import type { createProcessOwnershipHostFacts } from "./createProcessOwnershipHostFacts";
import { loadSourceModule } from "./loadSourceModule";

type ChildObservation = Pick<ChildProcess, "pid" | "exitCode" | "signalCode">;
type Controller = Pick<typeof ProcessOwnership, "read" | "stop"> & {
  own(child: ChildObservation): void;
  stopChild(child: ChildObservation): void;
};
type TransportResult = Pick<
  SpawnSyncReturns<string>,
  "error" | "status" | "stdout" | "stderr"
>;
const directory: string = path.resolve(
  __dirname,
  "../../../../packages/viewer/src/process/internal",
);

/**
 * Typed access to the production facade's private process owners through the
 * runner's existing source-module hook. Public discovery/stop signatures and
 * native child/result field types define this bridge; no handwritten transpiler,
 * package export, fake ChildProcess method or OS effect is installed.
 * The ordinary test project remains the execution owner of these scenarios.
 */
export const ProcessOwnershipUnit: {
  Controller: new (
    host: ReturnType<typeof createProcessOwnershipHostFacts>["host"],
  ) => Controller;
  windowsResult: (result: TransportResult) => unknown;
  posixIdentity: (result: TransportResult) => string | null;
  linuxIdentity: (boot: string, stat: string) => string;
  readFailure: (error: unknown) => null;
} = {
  Controller: loadSourceModule<{
    ProcessOwnershipController: new (
      host: ReturnType<typeof createProcessOwnershipHostFacts>["host"],
    ) => Controller;
  }>(path.join(directory, "ProcessOwnershipController.ts"))
    .ProcessOwnershipController,
  windowsResult: loadSourceModule<{
    decodeWindowsProcessResult(result: TransportResult): unknown;
  }>(path.join(directory, "decodeWindowsProcessResult.ts"))
    .decodeWindowsProcessResult,
  posixIdentity: loadSourceModule<{
    decodePosixProcessIdentity(result: TransportResult): string | null;
  }>(path.join(directory, "decodePosixProcessIdentity.ts"))
    .decodePosixProcessIdentity,
  linuxIdentity: loadSourceModule<{
    decodeLinuxProcessIdentity(boot: string, stat: string): string;
  }>(path.join(directory, "decodeLinuxProcessIdentity.ts"))
    .decodeLinuxProcessIdentity,
  readFailure: loadSourceModule<{
    resolveProcessIdentityReadError(error: unknown): null;
  }>(path.join(directory, "resolveProcessIdentityReadError.ts"))
    .resolveProcessIdentityReadError,
};
