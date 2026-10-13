import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";
import { registerAutoMovieReferenceTools } from "./registerAutoMovieReferenceTools";


/**
 * Construct the installed package's reference-only server over its bound reader.
 *
 *
 * @evidence contracts/common.md#principled-implementation The SDK server factory receives the installed version and one bound reader, then registers only the four reference operations.
 * @evidence contracts/common.md#clear-and-simple-design Construction owns server identity while registration owns dispatch; injected factories preserve the same SDK-shaped boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No compile, graph review or authoring tool is registered, and no root can be changed by a request.
 * @evidence contracts/common.md#meaningful-documentation The public signature identifies the reader, installed version and factory; factory or registration exceptions propagate.
 * @evidence contracts/performance.md#efficient-algorithms One server and four registrations are constructed; document parsing occurs only when a registered tool is invoked.
 * @evidence contracts/performance.md#reuse-equivalent-work The server shares one bound reader across tools without caching current source revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned SDK server and its eventual connection teardown; construction opens no transport.
 */
export function createAutoMovieMcpServer(
  reader: IAutoMovieReferenceReader,
  version: string,
  factory: (identity: {

    /** Reference-only server identity announced to the client. */
    name: string;

    /** Installed package version, not a document or production revision. */
    version: string;
  }) => McpServer = (identity: {name:string;version:string}) : McpServer => new McpServer(identity),
): McpServer {
  const server: McpServer = factory({ name: "automovie-reference", version });
  registerAutoMovieReferenceTools(server, reader);
  return server;
}
