import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar.js";
import { scanHumanViewerPacketIdentities } from "./scanHumanViewerPacketIdentities.js";

/**
 * Read the packet's opening `id` and its face/body opening basis ids. The shared structural scanner detects some malformed packets and missing identities; it does not validate full JSON grammar or numerical semantics. The Person owner admits the complete packet when the worker builds it, and that refusal reaches the render.
 *
 * @evidence contracts/common.md#principled-implementation The structural byte scanner reads the packet id and the face/body opening ids; complete JSON grammar and Person semantics remain with the construction owner.
 * @evidence contracts/common.md#clear-and-simple-design A small required-member check converts the scanner's generic identities into the existing person-sidecar result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or empty member identities refuse; the partial scanner is not claimed to certify the complete large packet.
 * @evidence contracts/common.md#meaningful-documentation The comment names required identities, the downstream Person admission and detected structural rather than exhaustive JSON refusal.
 * @evidence contracts/performance.md#efficient-algorithms The shared scanner traverses packet bytes without allocating the full numerical object tree; this wrapper adds two map lookups and three strings.
 * @evidence contracts/performance.md#reuse-equivalent-work Sidecar facts own digest/stamp reuse; this reader evaluates the supplied inflated bytes and maintains no separate memo.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the input buffer; temporary scanner strings/maps become unreachable after the small identity result is returned.
 */
export function readHumanViewerPersonSidecar(
  text: Buffer,
): IHumanViewerPersonSidecar {
  const scanned: ReturnType<typeof scanHumanViewerPacketIdentities> = scanHumanViewerPacketIdentities(text);
  const identity: (member: string) => string = (member: string): string => {
    const value: string | undefined = scanned.members[member];
    if (value === undefined || value === "")
      throw new Error(
        `A person packet needs a ${member} basis that opens with its id`,
      );
    return value;
  };
  return { id: scanned.id, face: identity("face"), body: identity("body") };
}
