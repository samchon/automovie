import type { IHumanViewerAdmissionBridge } from "./IHumanViewerAdmissionBridge";
import type { IHumanViewerAdmissionWindow } from "./IHumanViewerAdmissionWindow";
import { readHumanViewerFrameToken } from "./readHumanViewerFrameToken";
import { humanViewerProtocol } from "./humanViewerProtocol";

/**
 * The host page's admission bridge over its viewer frames. The frames are
 * given newest first (the preparing candidate, then the committed one), and
 * the first whose module has loaded judges the document: the candidate runs
 * the newest source, which is the source an admission key names. With no
 * loaded frame the bridge answers unavailable instead of failing, and the
 * frame that loads later announces itself so the server asks again.
 *
 * @evidence contracts/common.md#principled-implementation The newest loaded source judges, and an absent frame is reported as unavailable rather than as a verdict.
 * @evidence contracts/common.md#clear-and-simple-design One bridge owns the choice of frame; the frames own the owners' admissions.
 * @evidence contracts/common.md#meaningful-documentation States the frame order, the reason for it and the unavailable answer.
 */
export function createHumanViewerHostAdmission(
  frames: () => readonly (HTMLIFrameElement | undefined)[],
): IHumanViewerAdmissionBridge {
  return {
    protocol: humanViewerProtocol,
    admit: async (domain, text, basis) => {
      for (const frame of frames()) {
        const child = frame?.contentWindow as (Window & IHumanViewerAdmissionWindow) | null | undefined;
        if (child?.__humanViewerProtocol !== humanViewerProtocol) continue;
        const admit = (frame?.contentWindow as (Window & IHumanViewerAdmissionWindow) | null | undefined)
          ?.__humanViewerAdmit;
        if (admit !== undefined) {
          const token = readHumanViewerFrameToken(frame!.contentWindow!.location.search);
          const reason = await admit(domain, text, basis);
          if (reason !== null && typeof reason !== "string")
            throw new Error("The frame returned an incompatible admission envelope");
          return { available: true, reason,
            token };
        }
      }
      return { available: false, reason: null, token: null };
    },
  };
}
