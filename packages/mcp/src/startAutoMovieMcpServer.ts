import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAutoMovieReferenceReader } from "./createAutoMovieReferenceReader";
import type { IAutoMovieMcpStartupRuntime } from "./IAutoMovieMcpStartupRuntime";
import { createAutoMovieMcpServer } from "./createAutoMovieMcpServer";


/** Start a stdio-only MCP server bound to one absolute production root.
 *
 * A connected server transfers to the caller, which owns shutdown. If transport acquisition or connection rejects, startup awaits server.close before rethrowing the original failure. If that close also rejects, AggregateError retains both failures and the original connection failure as cause; cleanup failure does not prove physical release.
 *
 * @evidence contracts/common.md#principled-implementation Startup binds the root, constructs the server and awaits its stdio connection in order. The SDK takes transport ownership before awaiting start, so a rejected connection requires an awaited server.close before ownership can be abandoned; a double failure retains both causes rather than replacing the connection error.
 * @evidence contracts/common.md#clear-and-simple-design Three startup effects are explicit runtime capabilities, separate from tool request dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The default transport opens stdio without a network listener; failures cannot become a fake connected server, and a rejected close is exposed rather than counted as successful release.
 * @evidence contracts/common.md#meaningful-documentation The root and installed version define launch identity; the comment states successful ownership transfer, awaited failure cleanup and the original-versus-aggregate rejection forms.
 * @evidence contracts/performance.md#efficient-algorithms One reader binding, server construction and connection occur; root ancestry checks dominate startup filesystem work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the bound reader is shared by later tool calls; connection effects are never memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One constructed server owns its acquired transport until successful caller transfer or the awaited close attempt after acquisition/connection failure; a rejected close leaves physical release unproven and exposes both failures. The successful server retains reader callbacks for its caller-owned lifetime, and startup retains no result cache or background task of its own.
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
  try {
    await server.connect(runtime.transport());
  } catch (error) {
    try {
      await server.close();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "MCP startup failed and connection cleanup failed.",
        { cause: error },
      );
    }
    throw error;
  }
  return server;
}
