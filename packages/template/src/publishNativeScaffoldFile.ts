import { type IBoundParent } from "./IBoundParent";
import { ScaffoldParentChangedError } from "./ScaffoldParentChangedError";
import { type ICreateResult } from "./ICreateResult";
import { type IBoundChild } from "./IBoundChild";
import { type IBoundChildStatus } from "./IBoundChildStatus";
import { openWindowsParent } from "./openWindowsParent";
import { openPosixParent } from "./openPosixParent";
import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type IScaffoldParentPublicationRequest } from "./IScaffoldParentPublicationRequest";
import { combineScaffoldFailures } from "./combineScaffoldFailures";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";


/**
 * Create one new scaffold file relative to a held parent directory handle and
 * report the effect.
 *
 * POSIX opens the parent with `open(O_DIRECTORY | O_NOFOLLOW)` and creates the
 * child with `openat(O_CREAT | O_EXCL | O_NOFOLLOW)`. Windows opens the parent
 * with `CreateFileW` without following a reparse point and creates the child
 * with `NtCreateFile(FILE_CREATE)` using `OBJECT_ATTRIBUTES.RootDirectory`.
 * The parent must report `expectedParentIdentity` before the create. The new
 * file is written, flushed, read back, and checked to be one ordinary
 * single-link file of the exact size, then reopened relative to the same held
 * parent, before and after its own handle closes, to prove the name still
 * holds that file.
 *
 * The function returns rather than throws. `refused` means no slot was
 * created: the request was malformed, the parent could not be opened or
 * changed, or the create failed or met an existing entry
 * (`target-competitor`). `partial` means a slot exists that did not pass
 * every check, with the bytes written so far; the adapter never deletes it and
 * never retries through an absolute child path. `completed` carries the captured parent's identity.
 *
 * @param request Parent path, its expected identity, the child segment, and
 *   the bytes.
 * @returns The frozen outcome.
 *
 * @evidence contracts/common.md#principled-implementation The method is the documented handle-relative create of each platform, `openat` with `O_EXCL | O_NOFOLLOW` and `NtCreateFile` with a root directory handle and `FILE_CREATE`, both of which fail rather than follow an existing entry or a link; its premises are that the parent handle is held for the whole call and that required native flags are resolved before opening. `resolveScaffoldPosixConstants` supplies the documented Linux/Android and Darwin close-on-exec bits when Node omits them and refuses unknown missing ABI values.
 * @evidence contracts/common.md#clear-and-simple-design The publication sequence is shared through internal IBoundParent and IBoundChild contracts; POSIX and Windows own their native opening and transfer, and Koffi bindings initialize lazily on first use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every failure after the create becomes `partial` with the byte count instead of a cleanup or a pathname retry, and no foreign method or global is replaced; Win32 and NT values are named constants from the Windows SDK headers.
 * @evidence contracts/common.md#meaningful-documentation The comment states both platform methods, the identity precondition, each verification step, and the meaning of each outcome, including that a partial slot is left in place.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in the file size: one write pass, one flush, one readback pass into a buffer of the same size, and a constant number of handle opens and status reads; the request bytes are viewed, not copied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call is an exclusive create whose effect must not be shared; only the loaded Koffi library bindings are kept, and they are stateless function handles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function owns at most three native handles, the parent, the created child, and one resident reopen; each receives a close attempt on success and on every failure path before return, and a failed close is reported with the earlier failure rather than claiming release; the readback buffer is released with the call, and the module keeps only one lazily loaded binding set per platform.
 */
export const publishNativeScaffoldFile: (request: IScaffoldParentPublicationRequest) => ScaffoldFilePublicationOutcome = (
  request: IScaffoldParentPublicationRequest,
): ScaffoldFilePublicationOutcome => {
  if (
    request.childName.length === 0 ||
    request.childName === "." ||
    request.childName === ".." ||
    request.childName.includes("\0") ||
    request.childName.includes("/") ||
    request.childName.includes("\\") ||
    request.expectedParentIdentity.length === 0
  )
    return Object.freeze({
      error: new Error("invalid native scaffold publication request"),
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  let parent: IBoundParent;
  try {
    parent = openBoundParent(request);
  } catch (error) {
    return Object.freeze({
      error,
      reason:
        error instanceof ScaffoldParentChangedError
          ? ("parent-changed" as const)
          : ("create-failed" as const),
      status: "refused" as const,
    });
  }

  let creation: ICreateResult;
  try {
    creation = parent.createExclusive(request.childName);
  } catch (error) {
    return Object.freeze({
      error: closeAfterFailure(parent, error),
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  }
  if (creation.status === "refused")
    return Object.freeze({
      ...creation,
      error: closeAfterFailure(parent, creation.error),
    });
  if (creation.status === "partial")
    return Object.freeze({
      bytesWritten: 0,
      error: closeAfterFailure(parent, creation.error),
      parentIdentity: request.expectedParentIdentity,
      status: "partial" as const,
    });

  const source: Buffer = Buffer.from(
    request.bytes.buffer,
    request.bytes.byteOffset,
    request.bytes.byteLength,
  );
  const child: IBoundChild = creation.child;
  let bytesWritten: number = 0;
  let failure: unknown = undefined;
  let completedVersion: string | undefined;
  try {
    assertOrdinarySingleLink(child.status(), request.childName);
    while (bytesWritten < source.length) {
      const written: number = child.write(
        source,
        bytesWritten,
        source.length - bytesWritten,
        bytesWritten,
      );
      if (written === 0)
        throw new Error(
          `scaffold file stopped while written: ${request.childName}`,
        );
      bytesWritten += written;
    }
    child.sync();
    const completed: IBoundChildStatus = child.status();
    assertOrdinarySingleLink(completed, request.childName);
    if (completed.size !== BigInt(source.length))
      throw new Error(`scaffold file changed final size: ${request.childName}`);
    assertChildBytes(child, request.childName, source);
    completedVersion = completed.version;
    assertBoundResident(parent, request.childName, completedVersion);
  } catch (error) {
    failure = error;
  }

  try {
    child.close();
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "created scaffold descriptor close",
    );
  }
  if (failure === undefined)
    try {
      assertBoundResident(parent, request.childName, completedVersion!);
    } catch (residentError) {
      failure = residentError;
    }
  try {
    parent.close();
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "scaffold parent close",
    );
  }

  return failure === undefined
    ? Object.freeze({
        parentIdentity: request.expectedParentIdentity,
        status: "completed" as const,
      })
    : Object.freeze({
        bytesWritten,
        error: failure,
        parentIdentity: request.expectedParentIdentity,
        status: "partial" as const,
      });
};


/** Close the parent after `failure`, keeping both errors if the close fails. */
const closeAfterFailure: (parent: IBoundParent, failure: unknown) => unknown = (parent: IBoundParent, failure: unknown): unknown => {
  try {
    parent.close();
    return failure;
  } catch (closeError) {
    return combineScaffoldFailures(failure, closeError, "scaffold parent close");
  }
};

const openBoundParent: (request: IScaffoldParentPublicationRequest) => IBoundParent = (
  request: IScaffoldParentPublicationRequest,
): IBoundParent => {
  const parent: IBoundParent =
    process.platform === "win32"
      ? openWindowsParent(request.parentPath)
      : openPosixParent(request.parentPath);
  try {
    const status: IBoundParentStatus = parent.inspect();
    if (
      status.directory === false ||
      status.identity !== request.expectedParentIdentity
    )
      throw new ScaffoldParentChangedError(
        `scaffold parent changed before native create: ${request.parentPath}`,
      );
    return parent;
  } catch (error) {
    try {
      parent.close();
    } catch (closeError) {
      if (error instanceof ScaffoldParentChangedError)
        throw new ScaffoldParentChangedError(error.message, {
          cause: combineScaffoldFailures(
            error,
            closeError,
            "changed scaffold parent close",
          ),
        });
      throw combineScaffoldFailures(error, closeError, "scaffold parent close");
    }
    throw error;
  }
};


/**
 * Reopen `childName` relative to the held parent and require the same
 * ordinary single-link file generation, attempting to close the reopened
 * handle on every outcome and preserving close failures.
 */
const assertBoundResident: (parent: IBoundParent, childName: string, expectedVersion: string) => void = (
  parent: IBoundParent,
  childName: string,
  expectedVersion: string,
): void => {
  const resident: IBoundChild = parent.openResident(childName);
  let failure: unknown = undefined;
  try {
    const status: IBoundChildStatus = resident.status();
    assertOrdinarySingleLink(status, childName);
    if (status.version !== expectedVersion)
      throw new Error(
        `scaffold resident changed descriptor generation: ${childName}`,
      );
  } catch (error) {
    failure = error;
  }
  try {
    resident.close();
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "resident scaffold descriptor close",
    );
  }
  if (failure !== undefined) throw nativeFailure(failure);
};


/** Read the whole file back through `child` and require `bytes` exactly. */
const assertChildBytes: (child: IBoundChild, childName: string, bytes: Buffer) => void = (
  child: IBoundChild,
  childName: string,
  bytes: Buffer,
): void => {
  const readback: Buffer = Buffer.alloc(bytes.length);
  let offset: number = 0;
  while (offset < readback.length) {
    const read: number = child.read(
      readback,
      offset,
      readback.length - offset,
      offset,
    );
    if (read === 0)
      throw new Error(`scaffold file stopped during readback: ${childName}`);
    offset += read;
  }
  if (readback.equals(bytes) === false)
    throw new Error(`scaffold file changed during readback: ${childName}`);
};

const assertOrdinarySingleLink: (status: IBoundChildStatus, childName: string) => void = (
  status: IBoundChildStatus,
  childName: string,
): void => {
  if (status.link || status.regular === false || status.links !== 1n)
    throw new Error(
      `scaffold file is not one ordinary single-link file: ${childName}`,
    );
};

const nativeFailure: (failure: unknown) => Error = (failure: unknown): Error =>
  failure instanceof Error
    ? failure
    : new Error("Native scaffold publication failed.", { cause: failure });
