/**
 * Admit the thin client's command and query tokens without invoking a server.
 * Display admission remains with the shared address parser on the server.
 * Output is an optional caller-selected local PNG; lifecycle commands accept
 * no display fields. Unknown switches and incomplete output arguments refuse.
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
  const command = args[0];
  if (
    ![
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
  const fields = new URLSearchParams();
  let output: string | null = null;
  for (let index = 1; index < args.length; ++index) {
    const token = args[index];
    if (token === "--output") {
      const value = args[++index];
      if (
        output !== null ||
        value === undefined ||
        value.trim() === "" ||
        value.startsWith("--")
      )
        throw new Error("--output requires one local file");
      output = value;
    } else {
      const separator = token.indexOf("=");
      if (separator <= 0 || token.startsWith("--"))
        throw new Error("Display fields use key=value");
      const key = token.slice(0, separator);
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
