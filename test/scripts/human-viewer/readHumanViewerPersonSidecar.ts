import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar";
import { scanHumanViewerPacketIdentities } from "./scanHumanViewerPacketIdentities";

/**
 * Read a person candidate packet's identities: its own `id` and the ids its
 * `face` and `body` bases open with. The packet's other members (head skin,
 * band targets and whatever the generation type adds) are not the viewer's
 * to judge: the Person owner admits the whole packet when the worker builds
 * from it, and its refusal reaches the render. A malformed packet or a
 * missing identity refuses here with the reason.
 *
 * @evidence contracts/common.md#principled-implementation Requires exactly the identities the catalogue compares and keeps no copy of the generation schema.
 * @evidence contracts/common.md#clear-and-simple-design The shared structural scan reads; this function only states which members a person packet needs.
 * @evidence contracts/common.md#meaningful-documentation States what is required and who admits the rest.
 */
export function readHumanViewerPersonSidecar(
  text: Buffer,
): IHumanViewerPersonSidecar {
  const scanned = scanHumanViewerPacketIdentities(text);
  const identity = (member: string): string => {
    const value = scanned.members[member];
    if (value === undefined || value === "")
      throw new Error(
        `A person packet needs a ${member} basis that opens with its id`,
      );
    return value;
  };
  return { id: scanned.id, face: identity("face"), body: identity("body") };
}
