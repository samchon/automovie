import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createAutoMovieReferenceProvider } from "./createAutoMovieReferenceProvider";
import { createAutoMovieReferenceReader } from "./createAutoMovieReferenceReader";
import { autoMovieReferenceSchemas } from "./referenceRequest";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";

const descriptions = {
  get_index_of_layer:
    "List a bounded page of current authored Markdown file and H2/H3/H4 indices. Start here when only the layer is known. Continuation is tied to file revisions; this is not a review or atomic repository snapshot.",
  get_index_of_file:
    "Read the compact current index for an exact docs/<authored-layer>/<file>.md path. No source body or per-comment range arrays. Draft headings without explicit anchors remain unaddressable.",
  read_section_without_annotations:
    "Read an exact file#anchor from its current source. Returns H2/H3/H4 heading metadata and its original subtree body with HTML annotations removed. Preserve expectedDigest from navigation; detail opts into original source ranges. Use canonical raw source for editing and evidence audits.",
  read_file_without_annotations:
    "Read an exact authored Markdown file with only HTML annotations removed. Use this when necessary context spans sections. No summary, heading rebase, source writes, graph lint or runtime actions. Exceeding the result budget is an explicit refusal.",
};

/** Register exactly four read-only tools on an injected SDK server. */
export function registerAutoMovieReferenceTools(
  server: Pick<McpServer, "registerTool">,
  reader: IAutoMovieReferenceReader,
): void {
  const provider = createAutoMovieReferenceProvider(reader);
  for (const operation of Object.keys(
    autoMovieReferenceSchemas,
  ) as (keyof typeof autoMovieReferenceSchemas)[]) {
    server.registerTool(
      operation,
      {
        description: descriptions[operation],
        inputSchema: autoMovieReferenceSchemas[operation],
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: Record<string, unknown>) => {
        const result = await provider({ ...input, operation });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          isError: !result.ok,
        };
      },
    );
  }
}

/**
 * Construct the installed package's reference-only server over its bound reader.
 */
export function createAutoMovieMcpServer(
  reader: IAutoMovieReferenceReader,
  version: string,
  factory: (identity: {
    /** Reference-only server identity announced to the client. */
    name: string;
    /** Installed package version, not a document or production revision. */
    version: string;
  }) => McpServer = (identity) => new McpServer(identity),
): McpServer {
  const server = factory({ name: "automovie-reference", version });
  registerAutoMovieReferenceTools(server, reader);
  return server;
}

/**
 * Startup dependencies separated from the server's reference dispatch.
 * @author Samchon
 */
export interface IAutoMovieMcpStartupRuntime {
  /** Bind the startup root once; tool requests never supply a replacement root. */
  reader(root: string): Promise<IAutoMovieReferenceReader>;
  /** Register only reference tools using the bound reader and installed package version. */
  server(reader: IAutoMovieReferenceReader, version: string): McpServer;
  /** Supply the stdio connection without opening a network listener. */
  transport(): StdioServerTransport;
}

/** Start a stdio-only MCP server bound to one absolute production root. */
export async function startAutoMovieMcpServer(
  root: string,
  version: string,
  runtime: IAutoMovieMcpStartupRuntime = {
    reader: createAutoMovieReferenceReader,
    server: createAutoMovieMcpServer,
    transport: () => new StdioServerTransport(),
  },
): Promise<McpServer> {
  const server = runtime.server(await runtime.reader(root), version);
  await server.connect(runtime.transport());
  return server;
}
