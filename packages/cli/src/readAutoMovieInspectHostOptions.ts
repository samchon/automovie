import { AUTOMOVIE_INSPECT_OPTIONS } from "./AUTOMOVIE_INSPECT_OPTIONS";

/** Highest TCP port. */
const PORTS: number = 65_535;

/**
 * Split the options of `automovie inspect` into the command's own, `AUTOMOVIE_INSPECT_OPTIONS`, and the request the page opens on, which `parseAutoMovieCapturePlanRequest` reads.
 *
 * | Option | Meaning | Absent |
 * | --- | --- | --- |
 * | `--module <file>` | The subject module whose `subjects` the inspector page offers | Required |
 * | `--port <n>` | The port the page is served on, 1 to 65535 | A free port |
 * | `--props <file>` | A JSON file whose value the module's `subjects` is called with, for a module whose subjects are built from data a host computes, such as a motion case | `null` |
 *
 * Every other option is left for the request reader, which refuses one it does not know. It throws for a missing `--module`, an empty value of any of its options, and a port that is not a whole number from 1 to 65535.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates the command's options with their meaning and absent value, says where the rest go, and states every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The command's keys are removed before the request is read, as the capture command does, so the address and the command line share one grammar and a command key cannot be mistaken for a request key.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass that takes the command's keys out, then the checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No module is guessed from the folder: the page shows what the command names.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the options.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per command.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh map and keeps nothing.
 */
export function readAutoMovieInspectHostOptions(
  values: ReadonlyMap<string, string>,
): {
  /** Subject module path, relative to the production or absolute. */
  module: string;

  /** The port to serve on, or null for a free one. */
  port: number | null;

  /** Path of the props JSON file, relative to the production or absolute, or null for none. */
  props: string | null;

  /** The request's own options, for the request reader. */
  request: Map<string, string>;
} {
  const request: Map<string, string> = new Map(values);
  const taken: Map<string, string> = new Map();
  for (const key of AUTOMOVIE_INSPECT_OPTIONS) {
    const value: string | undefined = request.get(key);
    request.delete(key);
    if (value === undefined) continue;
    if (value.trim() === "")
      throw new Error(`Inspect option --${key} needs a value`);
    taken.set(key, value);
  }

  const module: string | undefined = taken.get("module");
  if (module === undefined)
    throw new Error("Inspect needs --module <subject module>, the module whose subjects the page offers");
  const text: string | undefined = taken.get("port");
  const port: number | null = text === undefined ? null : Number(text);
  if (port !== null && !(Number.isSafeInteger(port) && port >= 1 && port <= PORTS))
    throw new Error(`Inspect --port "${text}" is not a whole number from 1 to ${PORTS}`);
  return { module, port, props: taken.get("props") ?? null, request };
}
