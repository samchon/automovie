/**
 * Admit the thin client's command and query tokens without invoking a server. Display admission remains with the shared address parser on the server. Output is an optional caller-selected local PNG; lifecycle commands accept no display fields. Unknown switches and incomplete output arguments refuse.
 *
 * @evidence contracts/common.md#principled-implementation Recognized commands, unique key=value tokens and one complete output argument form the thin client request without invoking a server.
 * @evidence contracts/common.md#clear-and-simple-design One token loop builds query fields while lifecycle/output rules remain explicit after command classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown switches, duplicate fields and inappropriate output usage refuse; server display admission is not claimed here.
 * @evidence contracts/common.md#meaningful-documentation The comment separates thin command parsing, server display validation and caller-selected local PNG output.
 * @evidence contracts/performance.md#efficient-algorithms The scan is linear in argument text with query membership checks for repeated keys.
 * @evidence contracts/performance.md#reuse-equivalent-work Each command line is parsed independently without reusing another invocation's display selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only command/query/output strings remain and no file, socket or process resource is acquired.
 */
export function parseHumanShotRequest(args: readonly string[]): {
  command:
    | "ensure"
    | "status"
    | "stop"
    | "watch"
    | "render"
    | "sheet"
    | "compare"
    | "warm";
  query: string;
  output: string | null;
} {
  const command: string | undefined = args[0];
  if (
    command === undefined || ![
      "ensure",
      "status",
      "stop",
      "watch",
      "render",
      "sheet",
      "compare",
      "warm",
    ].includes(command)
  )
    throw new Error(
      "Give ensure, status, stop, watch, render, sheet, compare or warm",
    );
  const fields: URLSearchParams = new URLSearchParams();
  let output: string | null = null;
  for (let index: number = 1; index < args.length; ++index) {
    const token: string = args[index];
    if (token === "--output") {
      const value: string | undefined = args[++index];
      if (
        output !== null ||
        value === undefined ||
        value.trim() === "" ||
        value.startsWith("--")
      )
        throw new Error("--output requires one local file");
      output = value;
    } else {
      const separator: number = token.indexOf("=");
      if (separator <= 0 || token.startsWith("--"))
        throw new Error("Display fields use key=value");
      const key: string = token.slice(0, separator);
      if (fields.has(key)) throw new Error("Repeated display field: " + key);
      fields.set(key, token.slice(separator + 1));
    }
  }
  if (
    ["ensure", "status", "stop", "watch", "warm"].includes(command) &&
    output !== null
  )
    throw new Error("This command returns JSON, not a PNG file");
  if (
    ["ensure", "status", "stop", "watch"].includes(command) &&
    fields.size !== 0
  )
    throw new Error("Lifecycle commands take no display fields");
  return {
    command: command as ReturnType<typeof parseHumanShotRequest>["command"],
    query: fields.toString(),
    output,
  };
}
