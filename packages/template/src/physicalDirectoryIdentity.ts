import * as fs from "node:fs";
import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";


/**
 * Derive a directory's physical identity from an opened descriptor.
 *
 * A path-based stat is not a reliable device source everywhere: Node on Windows can report device 0 for a directory reached by path while `fstat` on the opened directory reports the volume serial, which is also what the native parent handle reports at publication. The inode equality check pins the descriptor to the directory the caller just inspected.
 *
 * @evidence contracts/common.md#principled-implementation A directory opened for reading is fstat'ed and its inode is compared with the earlier lstat before device-and-inode formatting.
 * @evidence contracts/common.md#clear-and-simple-design Descriptor identity extraction has one owner shared by ordinary capture and new-empty-directory qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The opened descriptor supplies the actual Windows volume identity instead of trusting a pathname stat's possibly zero device number.
 * @evidence contracts/common.md#meaningful-documentation The comment states the descriptor-versus-path distinction and the inode pin that connects both observations.
 * @evidence contracts/performance.md#efficient-algorithms One open, one fstat and one close plus two bigint conversions are fixed per directory and independent of its entry count.
 * @evidence contracts/performance.md#reuse-equivalent-work A descriptor observation cannot be substituted by cached pathname identity when verifying a current capture.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One descriptor receives a close attempt in finally before return; successful return proves close completed, while a close error leaves release unproven and currently supersedes an earlier inspection error. No descriptor reference is cached.
 */
export const physicalDirectoryIdentity: (absolute: string, status: fs.BigIntStats) => string = (
  absolute: string,
  status: fs.BigIntStats,
): string => {
  const descriptor: number = fs.openSync(absolute, fs.constants.O_RDONLY);
  try {
    const opened: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
    if (opened.isDirectory() === false || opened.ino !== status.ino)
      throw new Error(
        `scaffold directory changed while its identity was captured: ${absolute}`,
      );
    return scaffoldPhysicalIdentity(opened);
  } finally {
    fs.closeSync(descriptor);
  }
};
