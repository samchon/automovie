import type { IHumanViewerAdmissionBridge } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionBridge";
import type { IHumanViewerAdmissionWindow } from "@automovie/viewer/human/inspection/IHumanViewerAdmissionWindow";
import { humanViewerProtocol } from "@automovie/viewer/human/inspection/humanViewerProtocol";
import { readHumanViewerFrameToken } from "@automovie/viewer/human/inspection/readHumanViewerFrameToken";

/**
 * The host page's admission bridge over its viewer frames. The frames are given newest first (the preparing candidate, then the committed one), and the newest present frame owns document admission: a preparing candidate must not fall back to the older displayed frame's numerical source. With no loaded current frame the bridge answers unavailable instead of failing, and the frame that loads later announces itself so the server asks again. Frames are the host's same-origin product iframes. A protocol mismatch or absent bridge in the newest present frame returns unavailable; the token is read from that frame and a malformed refusal envelope throws.
 *
 * @evidence contracts/common.md#principled-implementation Newest-present-frame authority prevents a preparing candidate from admitting against older displayed source, with protocol equality and frame token binding the local admission bridge.
 * @evidence contracts/common.md#clear-and-simple-design The host bridge forwards document admission to the current iframe while numerical schema validation remains with its domain owner and server retry remains with the catalogue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or incompatible newest bridges do not fall back to a healthy-looking older source, and malformed refusal envelopes remain explicit errors.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies newest-first order, same-origin product-frame premise, unavailable readiness, protocol and token checks and envelope failure.
 * @evidence contracts/performance.md#efficient-algorithms The bridge skips absent entries until the first present iframe and performs constant protocol/token work plus text forwarding; host normally supplies candidate then active, while numerical document admission dominates inside that selected frame.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each request observes newest frame authority and shares no admission result based solely on equal text or an older source revision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The bridge borrows frame enumeration and retains no iframe or request collection; frame and pending admission lifetime belong to the host and numerical bridge.
 */
export function createHumanViewerHostAdmission(
  frames: () => readonly (HTMLIFrameElement | undefined)[],
): IHumanViewerAdmissionBridge {
  return {
    protocol: humanViewerProtocol,
    admit: async (
      domain: Parameters<IHumanViewerAdmissionBridge["admit"]>[0],
      text: string,
      basis: string,
    ): ReturnType<IHumanViewerAdmissionBridge["admit"]> => {
      for (const frame of frames()) {
        if (frame === undefined) continue;
        const child: (Window & IHumanViewerAdmissionWindow) | null | undefined =
          frame?.contentWindow as
            | (Window & IHumanViewerAdmissionWindow)
            | null
            | undefined;
        if (child?.__humanViewerProtocol !== humanViewerProtocol)
          return { available: false, reason: null, token: null };
        const admit: IHumanViewerAdmissionWindow["__humanViewerAdmit"] = (
          frame?.contentWindow as
            | (Window & IHumanViewerAdmissionWindow)
            | null
            | undefined
        )?.__humanViewerAdmit;
        if (admit !== undefined) {
          const token: string | null = readHumanViewerFrameToken(
            frame!.contentWindow!.location.search,
          );
          const reason: Awaited<
            ReturnType<
              NonNullable<IHumanViewerAdmissionWindow["__humanViewerAdmit"]>
            >
          > = await admit(domain, text, basis);
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
