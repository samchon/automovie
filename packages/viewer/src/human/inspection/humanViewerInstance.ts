import type { IHumanViewerInstance } from "./IHumanViewerInstance.js";

/** The port a viewer uses when `HUMAN_VIEWER_PORT` is unset. */
const DEFAULT_PORT: number = 5175;

/**
 * Resolve which resident viewer a process serves or talks to, from the `HUMAN_VIEWER_PORT` environment value. Unset or empty selects the default port 5175 and keeps its historical files `server.json` and `source-status.json`, the output log `server.log` and the folder `thumbnails`; any other port gets `server-<port>.json`, `source-status-<port>.json`, `server-<port>.log` and `thumbnails-<port>`, so a second session's viewer never overwrites or claims the first one's ownership record. The server, the `human-shot` client, the plain-Node control script and the capture drivers all read the same variable, and a server started by `human-shot` inherits it. A value that is not an unprivileged integer port is refused with the reason. The module has no runtime imports and uses only syntax Node strips, so the control script can load it without the project type check.
 *
 * @evidence contracts/common.md#principled-implementation One environment value selects a validated unprivileged integer port and its corresponding origin, record, status, log and thumbnail names.
 * @evidence contracts/common.md#clear-and-simple-design Default/explicit-default share historical naming while another port receives one complete per-port instance record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nondecimal, fractional, privileged or out-of-range ports refuse rather than silently falling back or claiming another port's process record.
 * @evidence contracts/common.md#meaningful-documentation Documentation states environment inheritance, default port/history naming, per-port isolation and plain-Node compatibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One short numeric configuration parse and fixed record projection choose no server or network algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Explicit default port and unset input share the same canonical naming policy through the same default branch, without sharing distinct server ownership.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Instance resolution only returns strings/numbers and acquires no listener, process record file or thumbnail directory.
 */
export function humanViewerInstance(
  value: string | undefined,
): IHumanViewerInstance {
  if (value === undefined || value === "")
    return {
      port: DEFAULT_PORT,
      origin: `http://127.0.0.1:${DEFAULT_PORT}`,
      record: "server.json",
      sourceStatus: "source-status.json",
      log: "server.log",
      thumbnails: "thumbnails",
    };
  const port: number = /^[0-9]+$/.test(value) ? Number(value) : Number.NaN;
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error(
      `HUMAN_VIEWER_PORT must be an integer from 1024 to 65535, not ${JSON.stringify(value)}`,
    );
  if (port === DEFAULT_PORT) return humanViewerInstance(undefined);
  return {
    port,
    origin: `http://127.0.0.1:${port}`,
    record: `server-${port}.json`,
    sourceStatus: `source-status-${port}.json`,
    log: `server-${port}.log`,
    thumbnails: `thumbnails-${port}`,
  };
}
