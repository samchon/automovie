/**
 * Input of {@link publishNativeScaffoldFile}: one new file created relative to a held parent directory handle.
 *
 * The adapter opens `parentPath` once without following a final link, proves that the opened handle reports `expectedParentIdentity`, and creates `childName` relative to that handle. The path is never used again, so a parent renamed or replaced after the check cannot redirect the create.
 *
 * @evidence contracts/common.md#principled-implementation The request carries an identity next to the path because a path names whatever is there now, while the device-and-inode identity names the directory that was captured; the adapter's handle-relative create relies on that difference.
 * @evidence contracts/common.md#clear-and-simple-design Four fields are exactly what the native create needs: the bytes, the one segment to create, the path to open, and the identity that authorizes it; ownership checks against the scaffold root stay with `writeScaffoldFile`, which builds the request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape has no retry path, fallback path, or cleanup flag, so an adapter has no field through which to reopen a child by an absolute pathname.
 * @evidence contracts/common.md#meaningful-documentation The comment states the open, prove, and create order and why the path is used once; each member states its constraint and what violating it causes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A request record chooses no algorithm; the adapter's cost belongs to `publishNativeScaffoldFile`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A request describes one exclusive create, which is an effect and is never shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The request references the caller's byte array without copying it and holds no handle; it lives for one adapter call.
 * @author Samchon
 */
export interface IScaffoldParentPublicationRequest {
  /**
   * Exact content of the new file. The adapter writes and reads it back through the created handle, reading this array in place without a copy.
   */
  bytes: Uint8Array;


  /**
   * One path segment to create: not empty, `.`, or `..`, and free of `/`, `\`, and NUL. Anything else is refused before any native call.
   */
  childName: string;


  /**
   * `<device>:<inode>` identity, as formatted by `scaffoldPhysicalIdentity`, that the opened parent must report. A mismatch is refused as `parent-changed` and nothing is created.
   */
  expectedParentIdentity: string;


  /** Absolute path used only to open the parent handle. */
  parentPath: string;
}
