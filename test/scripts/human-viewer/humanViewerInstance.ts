import type { IHumanViewerInstance } from "./IHumanViewerInstance";

/** The port a viewer uses when `HUMAN_VIEWER_PORT` is unset. */
const DEFAULT_PORT = 5175;

/**
 * Resolve which resident viewer a process serves or talks to, from the
 * `HUMAN_VIEWER_PORT` environment value. Unset or empty selects the default
 * port 5175 and keeps its historical files `server.json` and
 * `source-status.json`, the output log `server.log` and the folder
 * `thumbnails`; any other port gets `server-<port>.json`,
 * `source-status-<port>.json`, `server-<port>.log` and `thumbnails-<port>`, so a second session's viewer never overwrites
 * or claims the first one's ownership record. The server, the `human-shot`
 * client, the plain-Node control script and the capture drivers all read the
 * same variable, and a server started by `human-shot` inherits it. A value
 * that is not an unprivileged integer port is refused with the reason.
 * The module has no runtime imports and uses only syntax Node strips, so the
 * control script can load it without the project type check.
 *
 * @evidence contracts/common.md#principled-implementation One environment value selects the port and every per-process file together, so ownership records cannot cross between viewers.
 * @evidence contracts/common.md#clear-and-simple-design One pure function serves server, clients and control script.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a malformed port instead of falling back silently to the default.
 * @evidence contracts/common.md#meaningful-documentation States the default, the per-port file names and why the module is import-free.
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
  const port = /^[0-9]+$/.test(value) ? Number(value) : Number.NaN;
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
