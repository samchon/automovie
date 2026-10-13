import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAutoMovieReferenceReader } from "./createAutoMovieReferenceReader";
import type { IAutoMovieMcpStartupRuntime } from "./IAutoMovieMcpStartupRuntime";
import { createAutoMovieMcpServer } from "./createAutoMovieMcpServer";


/** Start a stdio-only MCP server bound to one absolute production root.
 *
 * @evidence contracts/common.md#principled-implementation Startup binds the absolute root through the reader, constructs the installed reference server and awaits its stdio connection in that order.
 * @evidence contracts/common.md#clear-and-simple-design Three startup effects are explicit runtime capabilities, separate from tool request dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The default transport opens stdio without a network listener; startup failures propagate rather than becoming a fake connected server.
 * @evidence contracts/common.md#meaningful-documentation The root and installed version define launch identity; the returned server transfers connection ownership to the caller.
 * @evidence contracts/performance.md#efficient-algorithms One reader binding, server construction and connection occur; root ancestry checks dominate startup filesystem work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the bound reader is shared by later tool calls; connection effects are never memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The connected SDK server escapes to its caller, which owns shutdown; this function does not close a successfully transferred connection.
 */
export async function startAutoMovieMcpServer(
  root: string,
  version: string,
  runtime: IAutoMovieMcpStartupRuntime = {
    reader: createAutoMovieReferenceReader,
    server: createAutoMovieMcpServer,
    transport: (): StdioServerTransport => new StdioServerTransport(),
  },
): Promise<McpServer> {
  const server: McpServer = runtime.server(await runtime.reader(root), version);
  await server.connect(runtime.transport());
  return server;
}
