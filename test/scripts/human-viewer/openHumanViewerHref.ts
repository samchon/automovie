
import type { HumanViewerAddress } from "./HumanViewerAddress";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { humanViewerChoices } from "./humanViewerChoices";

/**
 * The link that opens a document in the navigable viewer, the request that
 * renders it and the sheet of its eight views. All carry the one address
 * encoding, so the page the owner clicks and the picture a script asks for
 * describe the same frame. `fields` overrides the defaults of a fresh
 * address, and the thumbnail is the same frame as a small clay square.
 */
export function openHumanViewerHref(
  doc: string,
  fields: Partial<HumanViewerAddress> = {},
): { view: string; render: string; thumbnail: string; sheet: string } {
  const address = {
    ...parseHumanViewerAddress(new URLSearchParams({ doc }).toString()),
    ...fields,
  };
  const encoded = serializeHumanViewerAddress(address);
  const thumbnail = serializeHumanViewerAddress({ ...address, pass: "clay", size: 160 });
  return {
    view: "/view#" + encoded,
    render: "/render?" + encoded,
    thumbnail: "/render?" + thumbnail,
    sheet: "/sheet?" + encoded + "&axes=" + encodeURIComponent("view:" + humanViewerChoices.views.join(",")),
  };
}
