import type { ProcessOwnership } from "@automovie/viewer/process/ProcessOwnership";
import { ProcessOwnershipController } from "@automovie/viewer/process/internal/ProcessOwnershipController";
import { decodeLinuxProcessIdentity } from "@automovie/viewer/process/internal/decodeLinuxProcessIdentity";
import { decodePosixProcessIdentity } from "@automovie/viewer/process/internal/decodePosixProcessIdentity";
import { decodeWindowsProcessResult } from "@automovie/viewer/process/internal/decodeWindowsProcessResult";
import { resolveProcessIdentityReadError } from "@automovie/viewer/process/internal/resolveProcessIdentityReadError";
import type { ChildProcess, SpawnSyncReturns } from "node:child_process";

import type { createProcessOwnershipHostFacts } from "./createProcessOwnershipHostFacts";

type ChildObservation = Pick<ChildProcess, "pid" | "exitCode" | "signalCode">;
type Controller = Pick<typeof ProcessOwnership, "read" | "stop"> & {
  own(child: ChildObservation): void;
  stopChild(child: ChildObservation): void;
};
type TransportResult = Pick<
  SpawnSyncReturns<string>,
  "error" | "status" | "stdout" | "stderr"
>;

/**
 * Typed access to the production facade's process ownership diagnostics through
 * supported package subpaths. Public discovery/stop signatures and native
 * child/result field types define the bridge without a source loader.
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
  Controller: ProcessOwnershipController,
  windowsResult: decodeWindowsProcessResult,
  posixIdentity: decodePosixProcessIdentity,
  linuxIdentity: decodeLinuxProcessIdentity,
  readFailure: resolveProcessIdentityReadError,
};
