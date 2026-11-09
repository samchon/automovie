/**
 * Native open flags needed for held-parent POSIX scaffold publication. Values are the running system's ABI bits, not normalized platform-independent flags.
 *
 * @evidence contracts/development/design.md#principled-representation Named integer flags preserve the native open and openat ABI; the resolver supplies only a documented close-on-exec value absent from Node's constants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record contains precisely the seven flags the parent and child open operations combine.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Flags belong to actual operating-system contracts and select no fixture or consumer-specific pathname.
 * @evidence contracts/development/common.md#meaningful-documentation Members state the native open effect of each bit and the declaration distinguishes ABI values from portable normalized flags.
 */
export interface IScaffoldPosixConstants {
  /** Close the descriptor when a new program image is executed. */
  O_CLOEXEC: number;

  /** Create the child when its directory slot is absent. */
  O_CREAT: number;

  /** Require the parent descriptor to name a directory. */
  O_DIRECTORY: number;

  /** Refuse a child slot that already exists alongside O_CREAT. */
  O_EXCL: number;

  /** Refuse a symbolic link at the final opened component. */
  O_NOFOLLOW: number;

  /** Open the parent or verification child for reading only. */
  O_RDONLY: number;

  /** Open the newly created child for writing and readback. */
  O_RDWR: number;
}
