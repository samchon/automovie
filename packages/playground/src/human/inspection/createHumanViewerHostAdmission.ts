import type { IHumanViewerAdmissionBridge } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionBridge";
import type { IHumanViewerAdmissionWindow } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionWindow";
import { humanViewerProtocol } from "@automovie/viewer/human/inspection/humanViewerProtocol";
import { readHumanViewerFrameToken } from "@automovie/viewer/human/inspection/readHumanViewerFrameToken";

/**
 * The host page's admission bridge over its viewer frames. The frames are
 * given newest first (the preparing candidate, then the committed one), and
 * the newest present frame owns document admission: a preparing candidate
 * must not fall back to the older displayed frame's numerical source. With no
 * loaded current frame the bridge answers unavailable instead of failing, and the
 * frame that loads later announces itself so the server asks again.
 */
export function createHumanViewerHostAdmission(
  frames: () => readonly (HTMLIFrameElement | undefined)[],
): IHumanViewerAdmissionBridge {
  return {
    protocol: humanViewerProtocol,
    admit: async (domain, text, basis) => {
      for (const frame of frames()) {
        if (frame === undefined) continue;
        const child = frame?.contentWindow as
          | (Window & IHumanViewerAdmissionWindow)
          | null
          | undefined;
        if (child?.__humanViewerProtocol !== humanViewerProtocol)
          return { available: false, reason: null, token: null };
        const admit = (
          frame?.contentWindow as
            | (Window & IHumanViewerAdmissionWindow)
            | null
            | undefined
        )?.__humanViewerAdmit;
        if (admit !== undefined) {
          const token = readHumanViewerFrameToken(
            frame!.contentWindow!.location.search,
          );
          const reason = await admit(domain, text, basis);
          if (reason !== null && typeof reason !== "string")
            throw new Error(
              "The frame returned an incompatible admission envelope",
            );
          return { available: true, reason, token };
        }
        return { available: false, reason: null, token: null };
      }
      return { available: false, reason: null, token: null };
    },
  };
}
