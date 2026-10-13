import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createAutoMovieReferenceProvider } from "./createAutoMovieReferenceProvider";
import { autoMovieReferenceSchemas } from "./referenceRequest";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";


const descriptions: Record<keyof typeof autoMovieReferenceSchemas,string> = {
  get_index_of_layer:
    "List a bounded page of current authored Markdown file and H2/H3/H4 indices. Start here when only the layer is known. Continuation is tied to file revisions; this is not a review or atomic repository snapshot.",
  get_index_of_file:
    "Read the compact current index for an exact docs/<authored-layer>/<file>.md path. No source body or per-comment range arrays. Draft headings without explicit anchors remain unaddressable.",
  read_section_without_annotations:
    "Read an exact file#anchor from its current source. Returns H2/H3/H4 heading metadata and its original subtree body with HTML annotations removed. Preserve expectedDigest from navigation; detail opts into original source ranges. Use canonical raw source for editing and evidence audits.",
  read_file_without_annotations:
    "Read an exact authored Markdown file with only HTML annotations removed. Use this when necessary context spans sections. No summary, heading rebase, source writes, graph lint or runtime actions. Exceeding the result budget is an explicit refusal.",
};


/** Register exactly four read-only tools on an injected SDK server.
 *
 * @evidence contracts/common.md#principled-implementation Each documented schema and description is paired by its operation key; the SDK callback delegates to the same stateless provider used by the local command.
 * @evidence contracts/common.md#clear-and-simple-design The four tools use one provider and one sanitized success or refusal envelope, keeping transport serialization outside source policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read-only annotations describe actual dispatch, which exposes no write, compile, review or runtime mutation operation.
 * @evidence contracts/common.md#meaningful-documentation Tool descriptions identify navigation, exact anchored reads, revision checks and budget refusal; false results set the SDK isError flag.
 * @evidence contracts/performance.md#efficient-algorithms Registration traverses four keys; each invocation adds one JSON serialization to the provider's parsing and bounded-response costs.
 * @evidence contracts/performance.md#reuse-equivalent-work All tools share one provider capability, while every request rereads source bytes instead of reusing an unproven revision.
 * @evidence contracts/performance.md#bound-retention-and-release-resources SDK callbacks retain the reader for the server's lifetime; each result string and source snapshot is request-local.
 */
export function registerAutoMovieReferenceTools(
  server: Pick<McpServer, "registerTool">,
  reader: IAutoMovieReferenceReader,
): void {
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider(reader);
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
      async (input: Record<string, unknown>) : Promise<{content:{type:"text";text:string}[];isError:boolean}> => {
        const result: Awaited<ReturnType<typeof provider>> = await provider({ ...input, operation });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          isError: !result.ok,
        };
      },
    );
  }
}
