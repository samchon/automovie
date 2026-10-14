import { stringify } from "devalue";
import { type ChildProcess, fork } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { HumanViewerNodeSourceChangedError } from "./HumanViewerNodeSourceChangedError.js";
import type { ICreateHumanViewerNodeServiceProps } from "./ICreateHumanViewerNodeServiceProps.js";
import type { IHumanViewerNodeInitialization } from "./IHumanViewerNodeInitialization.js";
import type { IHumanViewerNumericalFailure } from "./IHumanViewerNumericalFailure.js";
import type { IHumanViewerNumericalReady } from "./IHumanViewerNumericalReady.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand.js";

/**
 * Own isolated, checked Node processes for resident-page transports. Models and their complete admission cross the existing product boundary; source bytes and revision must still match when a realm becomes ready. Closing the event stream requests termination, including during synchronous work; a refused request retains the original ChildProcess and failed completion without claiming exit. The child owns its checked loader and dependency emit. Host-only Node startup options and a ttsx runtime manifest must not select the host's previously compiled dependencies in a later numerical generation. A changed source ends its stream with the original measured refusal before releasing the owned process; a concurrent post carries the same identity. Closing remains registered until actual process close, so host shutdown also waits for a session whose event stream already requested retirement.
 *
 * @evidence contracts/common.md#principled-implementation Each event stream owns a forked checked Node realm, pins source/input witnesses at startup and refuses commands when current source no longer matches.
 * @evidence contracts/common.md#clear-and-simple-design Session maps hold process, revision, witness and readiness while a retirement map explicitly preserves each original ChildProcess with its in-progress or failed completion for host shutdown.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Host NODE_OPTIONS/runtime manifests are removed from child startup, original source-change errors reach stream and post, and map withdrawal is not treated as actual child exit.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies checked child ownership, independent child compilation and actual-close settlement across event and server lifetimes.
 * @evidence contracts/performance.md#efficient-algorithms Session lookup is expected constant time; witness comparison serializes checked inputs per authority check, and shutdown traverses currently live and retiring sessions once.
 * @evidence contracts/performance.md#reuse-equivalent-work Each session has its own checked source realm; repeated close shares that session's completion rather than killing twice, and a changed witness never authorizes reuse of old readiness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stream close requests child termination and host shutdown waits for live plus already-retiring children; failed retirement retains its original child reference and completion, and session count, witness size and collected stderr have no independent cap in this adapter.
 */
export function createHumanViewerNodeService(
  props: ICreateHumanViewerNodeServiceProps,
): {
  open: (response: ServerResponse) => void;
  post: (
    id: string,
    message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand,
  ) => void;
  close: (id: string) => Promise<void>;
  shutdown: () => Promise<void>;
} {
  const sessions: Map<string, ChildProcess> = new Map();
  const revisions: Map<string, string> = new Map();
  const witnesses: Map<string, Record<string, string>> = new Map();
  const ready: Set<string> = new Set();
  const failures: Map<string, (error: Error) => void> = new Map();
  const retiring: Map<
    string,
    { worker: ChildProcess | undefined; completion: Promise<void> }
  > = new Map();
  const closedWorkers: WeakSet<ChildProcess> = new WeakSet();
  const entry: string = path.join(props.directory, "numerical-worker.ts");
  const require: ReturnType<typeof createRequire> = createRequire(entry);
  const close: (id: string) => Promise<void> = (id: string): Promise<void> => {
    const existing:
      | { worker: ChildProcess | undefined; completion: Promise<void> }
      | undefined = retiring.get(id);
    if (existing !== undefined) return existing.completion;
    const worker: ChildProcess | undefined = sessions.get(id);
    sessions.delete(id);
    revisions.delete(id);
    witnesses.delete(id);
    ready.delete(id);
    failures.delete(id);
    const completion: Promise<void> = Promise.resolve()
      .then(async (): Promise<void> => {
        if (worker !== undefined && !closedWorkers.has(worker))
          await new Promise<undefined>(
            (
              resolve: (value: undefined) => void,
              reject: (error: unknown) => void,
            ): void => {
              let settled: boolean = false;
              function withdraw(): void {
                worker!.off("close", closed);
                worker!.off("error", failed);
              }
              function closed(): void {
                if (settled) return;
                settled = true;
                withdraw();
                resolve(undefined);
              }
              function failed(error: unknown): void {
                if (settled) return;
                settled = true;
                withdraw();
                reject(error);
              }
              worker.once("close", closed);
              worker.once("error", failed);
              try {
                if (
                  worker.pid !== undefined &&
                  worker.exitCode === null &&
                  worker.signalCode === null &&
                  !worker.kill()
                )
                  failed(
                    new Error(
                      "The owned numerical process refused termination.",
                    ),
                  );
              } catch (error) {
                failed(error);
              }
            },
          );
      })
      .then((): void => {
        retiring.delete(id);
      });
    retiring.set(id, { worker, completion });
    return completion;
  };
  return {
    /** Open one long-lived response; its close is the numerical realm's lifetime. */
    open: (response: ServerResponse): void => {
      const id: string = randomUUID();
      const revision: string = props.revision();
      const inputs: Record<string, string> = props.inputs();
      const environment: NodeJS.ProcessEnv = Object.fromEntries(
        Object.entries(process.env).filter(
          ([name]: [string, string | undefined]): boolean =>
            !["NODE_OPTIONS", "TTSX_RUNTIME_MANIFEST"].includes(
              name.toUpperCase(),
            ),
        ),
      );
      const worker: ChildProcess = fork(entry, [], {
        env: environment,
        execArgv: ["--require", require.resolve("ttsc/register")],
        serialization: "advanced",
        stdio: ["ignore", "inherit", "pipe", "ipc"],
      });
      worker.once("close", (): void => {
        closedWorkers.add(worker);
      });
      sessions.set(id, worker);
      revisions.set(id, revision);
      witnesses.set(id, inputs);
      try {
        let stderr: string = "";
        worker.stderr!.setEncoding("utf8");
        worker.stderr!.on("data", (chunk: string): void => {
          stderr += chunk;
          process.stderr.write(chunk);
        });
        response.setHeader("Content-Type", "application/x-ndjson");
        response.setHeader("Cache-Control", "no-store");
        response.write(stringify({ type: "opened", session: id }) + "\n");
        response.once("close", (): void => {
          void close(id).catch((error: unknown): void => {
            console.error(error);
          });
        });
        const fail: (error: Error) => void = (error: Error): void => {
          console.error(
            "HUMAN_NUMERICAL_FAILURE " + (error.stack ?? error.message),
          );
          let sourceChanged: boolean =
            error instanceof HumanViewerNodeSourceChangedError;
          try {
            sourceChanged =
              sourceChanged ||
              props.revision() !== revision ||
              JSON.stringify(props.inputs()) !== JSON.stringify(inputs);
          } catch (witnessError) {
            // An unreadable current witness cannot authorize a fresh candidate.
            console.error(
              "HUMAN_SOURCE_WITNESS_FAILURE " + String(witnessError),
            );
          }
          const failure: IHumanViewerNumericalFailure = {
            type: "failure",
            error: error.message,
            stack: error.stack,
            sourceChanged,
          };
          try {
            if (!response.destroyed) response.end(stringify(failure) + "\n");
          } catch (transportError) {
            console.error(transportError);
          } finally {
            void close(id).catch((cause: unknown): void => {
              console.error(cause);
            });
          }
        };
        failures.set(id, fail);
        worker.on("message", (message: unknown): void => {
          if (!sessions.has(id) || response.destroyed) return;
          try {
            if (message === "initialize") {
              const initialization: IHumanViewerNodeInitialization = {
                type: "initialize",
                input: { origin: props.origin, revision, entry, inputs },
              };
              worker.send(initialization, (error: Error | null): void => {
                if (error !== null) fail(error);
              });
              return;
            }
            if (
              typeof message === "object" &&
              message !== null &&
              "type" in message &&
              message.type === "ready"
            ) {
              const receipt: IHumanViewerNumericalReady =
                message as IHumanViewerNumericalReady;
              if (
                props.revision() !== revision ||
                JSON.stringify(props.inputs()) !==
                  JSON.stringify(receipt.authority.inputs)
              )
                throw new Error(
                  "Node numerical source changed during startup.",
                );
              ready.add(id);
            }
            response.write(stringify(message) + "\n");
          } catch (cause) {
            fail(cause instanceof Error ? cause : new Error(String(cause)));
          }
        });
        worker.once("error", fail);
        worker.once(
          "close",
          (code: number | null, signal: NodeJS.Signals | null): void => {
            if (sessions.has(id)) {
              const error: Error = new Error(
                stderr.trim() ||
                  `The Node numerical process exited with code ${code} signal ${signal}.`,
              );
              if (stderr !== "") error.stack = stderr;
              fail(error);
            }
            sessions.delete(id);
            revisions.delete(id);
            witnesses.delete(id);
            ready.delete(id);
            if (!response.destroyed && !response.writableEnded) response.end();
          },
        );
      } catch (error) {
        void close(id).catch((retirementError: unknown): void => {
          console.error(retirementError);
        });
        throw error;
      }
    },

    /** Forward an original typed request only to its current source realm. */
    post: (
      id: string,
      message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand,
    ): void => {
      const worker: ChildProcess | undefined = sessions.get(id);
      if (worker === undefined)
        throw new Error("The Node numerical session was retired.");
      if (!ready.has(id))
        throw new Error(
          "The checked Node numerical realm is not ready for product commands.",
        );
      if (
        revisions.get(id) !== props.revision() ||
        JSON.stringify(witnesses.get(id)) !== JSON.stringify(props.inputs())
      ) {
        const error: HumanViewerNodeSourceChangedError =
          new HumanViewerNodeSourceChangedError(
            "The Node numerical source or configuration was replaced.",
          );
        failures.get(id)!(error);
        throw error;
      }
      worker.send(message);
    },

    /** Retire only the caller's owned session; other viewer ports are untouched. */
    close,

    /** Release realms of this source wave; later source generations may open new sessions. */
    shutdown: (): Promise<void> => {
      return createAutoMovieResourceRetirement([
        ...[...sessions.keys()].map(
          (id: string): (() => Promise<void>) =>
            (): Promise<void> =>
              close(id),
        ),
        ...[...retiring.values()].map(
          (record: {
            worker: ChildProcess | undefined;
            completion: Promise<void>;
          }): (() => Promise<void>) =>
            (): Promise<void> =>
              record.completion,
        ),
      ])();
    },
  };
}
