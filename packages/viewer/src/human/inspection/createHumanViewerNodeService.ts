import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fork, type ChildProcess } from "node:child_process";
import { stringify } from "devalue";

import type { ICreateHumanViewerNodeServiceProps } from "./ICreateHumanViewerNodeServiceProps.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand.js";
import type { IHumanViewerNumericalReady } from "./IHumanViewerNumericalReady.js";
import type { IHumanViewerNumericalFailure } from "./IHumanViewerNumericalFailure.js";
import type { IHumanViewerNodeInitialization } from "./IHumanViewerNodeInitialization.js";
import { HumanViewerNodeSourceChangedError } from "./HumanViewerNodeSourceChangedError.js";

/**
 * Own isolated, checked Node processes for resident-page transports.
 * Models and their complete admission cross the existing product boundary;
 * source bytes and revision must still match when a realm becomes ready.
 * Closing the event stream terminates its process, including synchronous work.
 * The child owns its checked loader and dependency emit. Host-only Node
 * startup options and a ttsx runtime manifest must not select the host's
 * previously compiled dependencies in a later numerical generation.
 * A changed source ends its stream with the original measured refusal before
 * releasing the owned process; a concurrent post carries the same identity.
 *
 * @evidence contracts/common.md#principled-implementation Public ttsc/register refuses a bad owning project; source witnesses and actual readiness establish the realm independently of browser stamps.
 * @evidence contracts/common.md#clear-and-simple-design One owned process per event session has its own public-loader cache identity and preserves runtime residency without blocking the HTTP/GPU host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Executes original product requests, with no preview reclassification or private loader mutation.
 * @evidence contracts/common.md#meaningful-documentation States checked loading, source identity and stream-owned cancellation.
 */
export function createHumanViewerNodeService(props: ICreateHumanViewerNodeServiceProps) {
  const sessions = new Map<string, ChildProcess>();
  const revisions = new Map<string, string>();
  const witnesses = new Map<string, Record<string, string>>();
  const ready = new Set<string>();
  const failures = new Map<string, (error: Error) => void>();
  const entry = path.join(props.directory, "numerical-worker.mts");
  const require = createRequire(entry);
  const close = async (id: string): Promise<void> => {
    const worker = sessions.get(id);
    sessions.delete(id);
    revisions.delete(id);
    witnesses.delete(id);
    ready.delete(id);
    failures.delete(id);
    if (worker !== undefined && worker.pid !== undefined && worker.exitCode === null && worker.signalCode === null)
      await new Promise<undefined>((resolve) => {
        worker.once("close", () => resolve(undefined));
        worker.kill();
      });
  };
  return {
    /** Open one long-lived response; its close is the numerical realm's lifetime. */
    open: (response: ServerResponse): void => {
      const id = randomUUID();
      const revision = props.revision();
      const inputs = props.inputs();
      const environment = Object.fromEntries(Object.entries(process.env).filter(
        ([name]) => !["NODE_OPTIONS", "TTSX_RUNTIME_MANIFEST"].includes(name.toUpperCase()),
      ));
      const worker = fork(entry, [], {
        env: environment,
        execArgv: ["--require", require.resolve("ttsc/register")],
        serialization: "advanced",
        stdio: ["ignore", "inherit", "pipe", "ipc"],
      });
      sessions.set(id, worker);
      revisions.set(id, revision);
      witnesses.set(id, inputs);
      let stderr = "";
      worker.stderr!.setEncoding("utf8");
      worker.stderr!.on("data", (chunk: string) => {
        stderr += chunk;
        process.stderr.write(chunk);
      });
      response.setHeader("Content-Type", "application/x-ndjson");
      response.setHeader("Cache-Control", "no-store");
      response.write(stringify({ type: "opened", session: id }) + "\n");
      response.once("close", () => { void close(id); });
      const fail = (error: Error): void => {
        console.error("HUMAN_NUMERICAL_FAILURE " + (error.stack ?? error.message));
        let sourceChanged = error instanceof HumanViewerNodeSourceChangedError;
        try {
          sourceChanged = sourceChanged || props.revision() !== revision ||
            JSON.stringify(props.inputs()) !== JSON.stringify(inputs);
        } catch (witnessError) {
          // An unreadable current witness cannot authorize a fresh candidate.
          console.error("HUMAN_SOURCE_WITNESS_FAILURE " + String(witnessError));
        }
        const failure: IHumanViewerNumericalFailure = {
          type: "failure", error: error.message, stack: error.stack,
          sourceChanged,
        };
        if (!response.destroyed) response.end(stringify(failure) + "\n");
        void close(id);
      };
      failures.set(id, fail);
      worker.on("message", (message: unknown) => {
        if (!sessions.has(id) || response.destroyed) return;
        if (message === "initialize") {
          const initialization: IHumanViewerNodeInitialization = {
            type: "initialize", input: { origin: props.origin, revision, entry, inputs },
          };
          worker.send(initialization, (error) => {
            if (error !== null) fail(error);
          });
          return;
        }
        try {
          if (typeof message === "object" && message !== null && "type" in message && message.type === "ready") {
            const receipt = message as IHumanViewerNumericalReady;
            if (props.revision() !== revision || JSON.stringify(props.inputs()) !== JSON.stringify(receipt.authority.inputs))
              throw new Error("Node numerical source changed during startup.");
            ready.add(id);
          }
          response.write(stringify(message) + "\n");
        } catch (cause) {
          fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
      });
      worker.once("error", fail);
      worker.once("close", (code, signal) => {
        if (sessions.has(id)) {
          const error = new Error(stderr.trim() || `The Node numerical process exited with code ${code} signal ${signal}.`);
          if (stderr !== "") error.stack = stderr;
          fail(error);
        }
        sessions.delete(id);
        revisions.delete(id);
        witnesses.delete(id);
        ready.delete(id);
        response.end();
      });
    },

    /** Forward an original typed request only to its current source realm. */
    post: (id: string, message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand): void => {
      const worker = sessions.get(id);
      if (worker === undefined) throw new Error("The Node numerical session was retired.");
      if (!ready.has(id)) throw new Error("The checked Node numerical realm is not ready for product commands.");
      if (revisions.get(id) !== props.revision() ||
          JSON.stringify(witnesses.get(id)) !== JSON.stringify(props.inputs())) {
        const error = new HumanViewerNodeSourceChangedError("The Node numerical source or configuration was replaced.");
        failures.get(id)!(error);
        throw error;
      }
      worker.send(message);
    },

    /** Retire only the caller's owned session; other viewer ports are untouched. */
    close,

    /** Release all realms when their host lifetime ends. */
    shutdown: async (): Promise<void> => {
      await Promise.all([...sessions.keys()].map(close));
    },
  };
}
