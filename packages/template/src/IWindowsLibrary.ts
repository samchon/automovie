import { type LibraryHandle, type TypeObject } from "koffi";

import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type IWindowsFileInformation } from "./IWindowsFileInformation";

/**
 * The kernel32 and ntdll entry points the Windows adapter needs.
 *
 * @evidence contracts/common.md#principled-implementation Koffi-bound Win32 and NT call signatures retain raw HANDLEs, UTF-16 names, byte counts and explicit error results.
 * @evidence contracts/common.md#clear-and-simple-design One lazy binding set supplies both parent-relative opening and child I/O without mixing native HANDLEs with CRT descriptor tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface declares actual native entry points; it introduces no monkey patch, fixture path or emulated host.
 * @evidence contracts/common.md#meaningful-documentation Members state handle and structure roles, byte positioning, native status meanings and immediate last-error observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The Windows native binding contract declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Windows native binding contract type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Windows native binding contract schema acquires no runtime handles, bytes or tasks.
 */
export interface IWindowsLibrary {
  /**
   * Close a native HANDLE; false leaves the Win32 error available through getLastError.
   *
   * @evidence contracts/common.md#principled-implementation Close a native HANDLE; false leaves the Win32 error available through getLastError.
   * @evidence contracts/common.md#clear-and-simple-design Parent and child adapters share the raw CloseHandle result and convert a false result with immediate getLastError, leaving release order to publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Windows handle release declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose names the HANDLE being closed and identifies false as native failure whose error must be read through getLastError; false does not prove release.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The Windows handle release signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Windows handle release interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Windows handle release declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  closeHandle(handle: unknown): boolean;

  /**
   * Call CreateFileW with UTF-16 pathname, explicit access, sharing, disposition and flags; return its raw HANDLE for validity checking.
   *
   * @evidence contracts/common.md#principled-implementation Call CreateFileW with UTF-16 pathname, explicit access, sharing, disposition and flags; return its raw HANDLE for validity checking.
   * @evidence contracts/common.md#clear-and-simple-design openWindowsParent chooses access, sharing and no-follow flags; this binding carries those choices to CreateFileW and returns the raw HANDLE for invalid-value qualification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The UTF-16 parent handle opening declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose states UTF-16 pathname encoding and explicit native access, sharing, disposition and flag inputs, and that the returned raw HANDLE still needs validity checking.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The UTF-16 parent handle opening signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The UTF-16 parent handle opening interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The UTF-16 parent handle opening declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  createFile(
    pathname: string,
    access: number,
    share: number,
    security: unknown,
    disposition: number,
    flags: number,
    template: unknown,
  ): unknown;

  /**
   * Flush an opened child's native buffers; false reports Win32 failure.
   *
   * @evidence contracts/common.md#principled-implementation Flush an opened child's native buffers; false reports Win32 failure.
   * @evidence contracts/common.md#clear-and-simple-design windowsChild supplies its held writer HANDLE and converts the Win32 boolean to the common sync operation's thrown failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Win32 buffer flush declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose names opened-child buffer flushing and distinguishes false as a Win32 failure rather than completed synchronization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The Win32 buffer flush signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Win32 buffer flush interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Win32 buffer flush declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  flushFileBuffers(handle: unknown): boolean;

  /**
   * Read the calling thread's most recent Win32 error immediately after a failed native call.
   *
   * @evidence contracts/common.md#principled-implementation Read the calling thread's most recent Win32 error immediately after a failed native call.
   * @evidence contracts/common.md#clear-and-simple-design Adapters read this numeric error immediately after the failed call, then nativeError adds operation context without a second native lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The thread-local native error reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose identifies calling-thread provenance and the required immediate read after native failure, so an unrelated later call cannot replace the diagnostic.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The thread-local native error reading signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The thread-local native error reading interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The thread-local native error reading declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  getLastError(): number;

  /** Koffi's process-width opaque HANDLE type used for calls and invalid-handle detection. */
  handleType: TypeObject;

  /**
   * Read one held child's unsigned size, link count, attributes, identity and last-write generation; native inspection failure throws.
   *
   * @evidence contracts/common.md#principled-implementation Read one held child's unsigned size, link count, attributes, identity and last-write generation; native inspection failure throws.
   * @evidence contracts/common.md#clear-and-simple-design loadWindowsLibrary lowers BY_HANDLE_FILE_INFORMATION once into the fields windowsChild consumes for qualification and generation comparison.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Windows child information reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose lists held-child size, links, attributes, identity and last-write facts and says failed inspection throws; IWindowsFileInformation defines exact byte size and raw FILETIME units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The Windows child information reading signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Windows child information reading interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Windows child information reading declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  inspectFile(handle: unknown): IWindowsFileInformation;

  /**
   * Read directory qualification and physical identity through the held parent HANDLE.
   *
   * @evidence contracts/common.md#principled-implementation Read directory qualification and physical identity through the held parent HANDLE.
   * @evidence contracts/common.md#clear-and-simple-design The loader returns only the directory predicate and device-and-index identity consumed by openBoundParent before child creation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Windows parent generation reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose gives held-parent HANDLE provenance and distinguishes directory qualification from the physical identity compared with the earlier capture.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The Windows parent generation reading signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Windows parent generation reading interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Windows parent generation reading declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  inspectParent(handle: unknown): IBoundParentStatus;

  /** Bound NT entry point used for parent-relative create and resident reopen with explicit NTSTATUS handling. */
  ntCreateFile: ReturnType<LibraryHandle["func"]>;

  /** Koffi structure layout carrying the held RootDirectory and UTF-16 ObjectName for NtCreateFile. */
  objectAttributesType: TypeObject;

  /**
   * Read at most `length` bytes into `target` from the HANDLE's current byte position; return the confirmed count, including zero at end of file, or `null` on Win32 failure. The caller supplies a buffer slice of that length.
   *
   * @evidence contracts/common.md#principled-implementation Read at most length bytes into target from the handle's current position; return the confirmed count or null on Win32 failure.
   * @evidence contracts/common.md#clear-and-simple-design The loader lowers ReadFile's output count and boolean to number-or-null; windowsChild owns seeking and selecting the target buffer slice.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Win32 read transfer declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose states byte length, current handle position, caller-owned slice bounds, short and zero reads, and null for native failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The Win32 read transfer signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Win32 read transfer interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Win32 read transfer declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  readFile(handle: unknown, target: Buffer, length: number): number | null;

  /**
   * Set a handle's absolute byte position with SetFilePointerEx; return false on Win32 failure.
   *
   * @evidence contracts/common.md#principled-implementation Set a handle's absolute byte position with SetFilePointerEx; return false on Win32 failure.
   * @evidence contracts/common.md#clear-and-simple-design The loader fixes FILE_BEGIN and converts the safe integer position to int64_t; windowsChild owns seeking before each read or write.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The absolute native byte positioning declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose states an absolute byte position, names SetFilePointerEx and identifies false as failed positioning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The absolute native byte positioning signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The absolute native byte positioning interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The absolute native byte positioning declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  setFilePointer(handle: unknown, position: number): boolean;

  /**
   * Write at most `length` bytes from `source` at the HANDLE's current byte position; return the confirmed count or `null` on Win32 failure. The caller supplies a source slice of that length.
   *
   * @evidence contracts/common.md#principled-implementation Write at most length bytes from source at the handle's current position; return the confirmed count or null on Win32 failure.
   * @evidence contracts/common.md#clear-and-simple-design The loader lowers WriteFile's output count and boolean to number-or-null; windowsChild owns seeking and selecting the source slice while publication accumulates confirmed progress.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Win32 write transfer declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose states byte length, current handle position, caller-owned slice bounds, confirmed short-write counts and null for native failure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The Win32 write transfer signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Win32 write transfer interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Win32 write transfer declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  writeFile(handle: unknown, source: Buffer, length: number): number | null;
}
