import type { IScaffoldPosixConstants } from "./IScaffoldPosixConstants";


/** Generic Linux UAPI open flag: https://github.com/torvalds/linux/blob/master/include/uapi/asm-generic/fcntl.h. */
const LINUX_O_CLOEXEC: number = 1 << 19;


/** Darwin open flag: https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/fcntl.h. */
const DARWIN_O_CLOEXEC: number = 0x01000000;


/**
 * Resolve the running POSIX system's open flags before binding libc.
 * Native constants take precedence; missing required flags refuse rather than becoming zero. Linux and Android use the generic Linux close-on-exec bit and Darwin uses its XNU bit when Node omits it. Other systems without that native bit refuse.
 *
 * @evidence contracts/common.md#principled-implementation Supplied native bits retain their ABI meaning; missing close-on-exec uses Linux UAPI's 1<<19 for Linux/Android or Apple XNU's 0x01000000 for Darwin, while an unknown ABI refuses. Both primary headers are linked beside their constants.
 * @evidence contracts/common.md#clear-and-simple-design Flag resolution is pure and separate from libc loading so platform admission finishes before a library or descriptor is acquired.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The platform branch names supported native ABI differences, with no substituted filesystem or test-only path.
 * @evidence contracts/common.md#meaningful-documentation The comment states input precedence, unsupported-platform refusal and that all required native bits must exist.
 * @evidence contracts/performance.md#efficient-algorithms Seven constant-key reads and one platform choice take fixed time and return one seven-field record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This resolver performs fixed scalar work once during lazy libc initialization; it coordinates no repeated request.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pure flag resolution acquires no library, descriptor or asynchronous task and retains no input object.
 */
export function resolveScaffoldPosixConstants(
  platform: NodeJS.Platform,
  constants: Readonly<Partial<IScaffoldPosixConstants>>,
): IScaffoldPosixConstants {
  const read: (name: keyof IScaffoldPosixConstants) => number = (
    name: keyof IScaffoldPosixConstants,
  ): number => {
    const value: number | undefined = constants[name];
    if (value === undefined)
      throw new Error(`supported POSIX runtime omitted ${name}`);
    return value;
  };
  const closeOnExec: number | undefined =
    constants.O_CLOEXEC ??
    (platform === "darwin"
      ? DARWIN_O_CLOEXEC
      : platform === "linux" || platform === "android"
        ? LINUX_O_CLOEXEC
        : undefined);
  if (closeOnExec === undefined)
    throw new Error("supported POSIX runtime omitted O_CLOEXEC");
  return {
    O_CLOEXEC: closeOnExec,
    O_CREAT: read("O_CREAT"),
    O_DIRECTORY: read("O_DIRECTORY"),
    O_EXCL: read("O_EXCL"),
    O_NOFOLLOW: read("O_NOFOLLOW"),
    O_RDONLY: read("O_RDONLY"),
    O_RDWR: read("O_RDWR"),
  };
}
