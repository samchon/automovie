import { createAutoMovieMcpServer } from "../../../../packages/mcp/src/createAutoMovieMcpServer";
import { createAutoMovieReferenceProvider } from "../../../../packages/mcp/src/createAutoMovieReferenceProvider";
import { startAutoMovieMcpServer } from "../../../../packages/mcp/src/startAutoMovieMcpServer";
import type { IAutoMovieReferenceReader } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceReader";
import { TestValidator } from "@nestia/e2e";

type Registration = {
  config: {
    inputSchema: { safeParse(input: unknown): { success: boolean } };
    annotations?: {
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
  };
  handler: (
    input: Record<string, unknown>,
  ) => Promise<{ content: { text: string }[]; isError: boolean }>;
};

/**
 * Each registered tool consumes the same provider input and result as local JSON.
 *
 * Scenarios:
 * 1. Registration exposes exactly four read-only operations with no runtime action.
 * 2. A section success and a stale-digest failure retain the provider's exact envelope.
 *    The injected registration sink does not test the SDK's protocol implementation.
 * 3. A failed connection requests cleanup and preserves its original failure identity.
 * 4. Failed cleanup exposes both failures instead of claiming successful release.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual server construction, tool registration and startup dispatch run through injected capabilities; assertions pin all four request schemas, result transport markers, transfer on success and cleanup on connection failure.
 * @evidence contracts/testing.md#independent-expectations The four supported operation names and read-only hints are literal contract values. Failure objects and close counts are authored before startup, so omitted cleanup or replacing the original rejection fails independently; provider equality is supplementary transport parity rather than an independent parser oracle.
 * @evidence contracts/testing.md#distinguishing-cases Each tool admits valid arguments and refuses a request-time root; successful connection transfers without closing, stale reads set isError, failed connection closes once, and failed close preserves both error identities. This unit verifies requested cleanup, not native descriptor release or the SDK protocol itself.
 * @evidence contracts/testing.md#execution-ownership The discoverable asynchronous unit owns every assertion and injects registration, connection and close capabilities without starting stdio, a process, a browser or a network host.
 */
export async function test_reference_mcp_registration(): Promise<void> {
  const registrations: Map<string, Registration> = new Map<string, Registration>();
  const reader: IAutoMovieReferenceReader = {
    read: async (): Promise<Uint8Array> => Buffer.from("## A {#a}\nbody"),
    list: async (): Promise<readonly string[]> => [],
  };
  let connected: unknown = undefined;
  let connectionFailure: Error | undefined = undefined;
  let cleanupFailure: Error | undefined = undefined;
  let closes: number = 0;
  const sink: {
    registerTool(name: string, config: unknown, handler: unknown): Record<string, never>;
    connect(transport: unknown): Promise<void>;
    close(): Promise<void>;
  } = {
    registerTool(name: string, config: unknown, handler: unknown): Record<string, never> {
      registrations.set(name, { config, handler } as Registration);
      return {};
    },
    connect: async (transport: unknown): Promise<void> => {
      connected = transport;
      if (connectionFailure !== undefined) throw connectionFailure;
    },
    close: async (): Promise<void> => {
      ++closes;
      if (cleanupFailure !== undefined) throw cleanupFailure;
    },
  };
  const server: ReturnType<typeof createAutoMovieMcpServer> = createAutoMovieMcpServer(
    reader,
    "test-version",
    (identity: { name: string; version: string }): ReturnType<typeof createAutoMovieMcpServer> => {
      TestValidator.equals("explicit server identity", identity, {
        name: "automovie-reference",
        version: "test-version",
      });
      return sink as unknown as ReturnType<typeof createAutoMovieMcpServer>;
    },
  );
  const transport: ReturnType<NonNullable<Parameters<typeof startAutoMovieMcpServer>[2]>["transport"]> = {} as ReturnType<
    NonNullable<Parameters<typeof startAutoMovieMcpServer>[2]>["transport"]
  >;
  const started: ReturnType<typeof createAutoMovieMcpServer> = await startAutoMovieMcpServer("bound-root", "test-version", {
    reader: async (root: string): Promise<IAutoMovieReferenceReader> => {
      TestValidator.equals("single startup root", root, "bound-root");
      return reader;
    },
    server: (input: IAutoMovieReferenceReader, version: string): ReturnType<typeof createAutoMovieMcpServer> => {
      TestValidator.predicate("same bound reader", input === reader);
      TestValidator.equals("same installed version", version, "test-version");
      return server;
    },
    transport: (): typeof transport => transport,
  });
  TestValidator.predicate("same startup server", started === server);
  TestValidator.predicate(
    "chosen stdio transport connected",
    connected === transport,
  );
  TestValidator.equals("successful connection transfers without closing", closes, 0);
  TestValidator.equals(
    "only reference operations",
    [...registrations.keys()],
    [
      "get_index_of_layer",
      "get_index_of_file",
      "read_file_without_annotations",
      "read_section_without_annotations",
    ],
  );
  for (const item of registrations.values())
    TestValidator.equals("read-only annotation", item.config.annotations, {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  const inputs: Record<string, Record<string, unknown>> = {
    get_index_of_layer: { layer: "settings" },
    get_index_of_file: { file: "docs/settings/a.md" },
    read_file_without_annotations: { file: "docs/settings/a.md" },
    read_section_without_annotations: { location: "docs/settings/a.md#a" },
  };
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider(reader);
  for (const [operation, input] of Object.entries(inputs)) {
    TestValidator.equals(
      "tool schema keeps valid input",
      registrations.get(operation)!.config.inputSchema.safeParse(input).success,
      true,
    );
    TestValidator.equals(
      "tool schema refuses request-time roots",
      registrations.get(operation)!.config.inputSchema.safeParse({
        ...input,
        root: "other-production",
      }).success,
      false,
    );
    const result: Awaited<ReturnType<Registration["handler"]>> = await registrations.get(operation)!.handler(input);
    TestValidator.equals(
      `same ${operation} result`,
      result.content[0].text,
      JSON.stringify(await provider({ ...input, operation })),
    );
    TestValidator.equals("success transport marker", result.isError, false);
  }
  const stale: Awaited<ReturnType<Registration["handler"]>> = await registrations
    .get("read_file_without_annotations")!
    .handler({ file: "docs/settings/a.md", expectedDigest: "0".repeat(64) });
  TestValidator.equals("failure transport marker", stale.isError, true);
  TestValidator.equals(
    "same failure code",
    JSON.parse(stale.content[0].text).error.code,
    "STALE_REFERENCE",
  );
  connectionFailure = new Error("connection refused");
  const closeFailure: Error = new Error("cleanup refused");
  for (const cleanup of [undefined, closeFailure]) {
    cleanupFailure = cleanup;
    const beforeCloses: number = closes;
    let rejection: unknown = undefined;
    try {
      await startAutoMovieMcpServer("bound-root", "test-version", {
        reader: async (): Promise<IAutoMovieReferenceReader> => reader,
        server: (): typeof server => server,
        transport: (): typeof transport => transport,
      });
    } catch (error) {
      rejection = error;
    }
    TestValidator.equals("failed connection requests one close", closes, beforeCloses + 1);
    if (cleanup === undefined)
      TestValidator.predicate("original connection failure propagates", rejection === connectionFailure);
    else {
      TestValidator.predicate("failed cleanup exposes an aggregate", rejection instanceof AggregateError);
      if (!(rejection instanceof AggregateError)) throw new Error("Expected both startup failures.");
      TestValidator.predicate("aggregate preserves connection cause", rejection.cause === connectionFailure && rejection.errors[0] === connectionFailure);
      TestValidator.predicate("aggregate preserves cleanup cause", rejection.errors.length === 2 && rejection.errors[1] === closeFailure);
    }
  }
}
