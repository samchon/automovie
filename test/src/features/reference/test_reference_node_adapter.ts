import {
  type IAutoMovieReferenceIdentity,
  createAutoMovieReferenceFileSystem,
} from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import { constants, type BigIntStats } from "node:fs";

type NativeStatObservation = Pick<BigIntStats,
  "isSymbolicLink" | "isDirectory" | "isFile" | "dev" | "ino" |
  "nlink" | "size" | "mtimeNs" | "ctimeNs"
>;
type NativeReadHandle = {
  stat: () => Promise<NativeStatObservation>;
  read: (buffer: Buffer, offset: number, length: number, position: number) => Promise<{ bytesRead: number; buffer: Buffer }>;
  close: () => Promise<void>;
};
type NativeObservations = {
  lstat: () => Promise<NativeStatObservation>;
  realpath: (location: string) => Promise<string>;
  readdir: () => Promise<string[]>;
  open: (location: string, openingFlags: number) => Promise<NativeReadHandle>;
};

/**
 * The Node primitive adapter performs read-only bounded I/O through injected calls.
 *
 * Scenarios:
 * 1. Each native entry kind maps to the expected physical identity.
 * 2. Partial reads, EOF and exact overflow consume only the configured buffer.
 * 3. The adapter preserves native failures and closes through the supplied handle.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the actual Node adapter over injected primitive observations, checking four entry kinds, forwarded path/list values, absence of write/create/truncate flags, bigint size, one-byte short-read assembly, maximum-plus-one overflow detection, empty EOF, one close and original lstat failure identity.
 * @evidence contracts/testing.md#independent-expectations Literal abc/abcd/empty buffers define expected byte populations independently of adapter output; native fs write/create/truncate bit constants define forbidden flags. Explicit size three and close count one detect wrong forwarding, while the partial native-port assertions supply only capabilities the adapter reads and do not prove a real OS descriptor.
 * @evidence contracts/testing.md#distinguishing-cases Keeps file/directory/link/other observations, partial nonempty reads, bounded overflow, empty EOF and a thrown native lstat Error. Higher-level reader tests own identity admission, read/close failure classification and Windows corroboration; this case does not independently assert O_NOFOLLOW or every metadata field.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_node_adapter owns three portable groups using supplied native calls and a resident Buffer. The actual adapter constructs no default filesystem host here; no OS path, process, server, browser or renderer opens, and close verifies a requested capability call rather than physical release.
 */
export async function test_reference_node_adapter(): Promise<void> {
  let kind: IAutoMovieReferenceIdentity["kind"] = "file";
  let content: Buffer = Buffer.from("abc");
  let closed: number = 0;
  let flags: number = -1;
  const stats: () => NativeStatObservation = (): NativeStatObservation => ({
    isSymbolicLink: (): boolean => kind === "link",
    isDirectory: (): boolean => kind === "directory",
    isFile: (): boolean => kind === "file",
    dev: 1n,
    ino: 2n,
    nlink: 1n,
    size: BigInt(content.length),
    mtimeNs: 0n,
    ctimeNs: 0n,
  });
  const native: NativeObservations = {
    lstat: async (): Promise<NativeStatObservation> => stats(),
    realpath: async (location: string): Promise<string> => location,
    readdir: async (): Promise<string[]> => ["a.md"],
    open: async (_location: string, openingFlags: number): Promise<NativeReadHandle> => {
      flags = openingFlags;
      return {
        stat: async (): Promise<NativeStatObservation> => stats(),
        read: async (
          buffer: Buffer,
          offset: number,
          length: number,
          position: number,
        ): Promise<{ bytesRead: number; buffer: Buffer }> => {
          const count: number = Math.min(1, length, content.length - position);
          if (count > 0)
            content.copy(buffer, offset, position, position + count);
          return { bytesRead: count, buffer };
        },
        close: async (): Promise<void> => {
          ++closed;
        },
      };
    },
  };
  const io: ReturnType<typeof createAutoMovieReferenceFileSystem> = createAutoMovieReferenceFileSystem(
    native as unknown as Parameters<
      typeof createAutoMovieReferenceFileSystem
    >[0],
  );
  for (kind of ["file", "directory", "link", "other"] as const)
    TestValidator.equals("native kind", (await io.lstat("ignored")).kind, kind);
  kind = "file";
  TestValidator.equals(
    "native realpath",
    await io.realpath("identity"),
    "identity",
  );
  TestValidator.equals("native directory entries", await io.list("identity"), [
    "a.md",
  ]);
  const handle: Awaited<ReturnType<typeof io.open>> = await io.open("ignored");
  TestValidator.predicate(
    "read-only flags",
    (flags &
      (constants.O_WRONLY |
        constants.O_RDWR |
        constants.O_CREAT |
        constants.O_TRUNC)) ===
      0,
  );
  TestValidator.equals("handle metadata", (await handle.stat()).size, 3n);
  TestValidator.equals(
    "partial reads assembled",
    await handle.read(4),
    Buffer.from("abc"),
  );
  content = Buffer.from("abcdef");
  TestValidator.equals(
    "one overflow byte only",
    await handle.read(3),
    Buffer.from("abcd"),
  );
  content = Buffer.alloc(0);
  TestValidator.equals("empty EOF", await handle.read(3), Buffer.alloc(0));
  await handle.close();
  TestValidator.equals("native close", closed, 1);
  const failure: Error = new Error("native read denied");
  const failing: ReturnType<typeof createAutoMovieReferenceFileSystem> = createAutoMovieReferenceFileSystem({
    ...native,
    lstat: async (): Promise<NativeStatObservation> => {
      throw failure;
    },
  } as unknown as Parameters<typeof createAutoMovieReferenceFileSystem>[0]);
  let caught: unknown;
  try {
    await failing.lstat("ignored");
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "native failure is left for reader classification",
    caught === failure,
  );
}
