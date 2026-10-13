import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { humanViewerChoices } from "./humanViewerChoices.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

/**
 * The link that opens a document in the navigable viewer, the request that
 * renders it and the sheet of its eight views. They share one address encoding
 * for the supplied document and observation settings. `fields` overrides a
 * fresh parsed address. The thumbnail explicitly changes pass and extent to
 * a 160-pixel clay square; the sheet explicitly enumerates the supported views.
 * The caller supplies document identity; this function starts no generation
 * and supplies no example parameters or runtime provenance.
 */
export function openHumanViewerHref(
  doc: string,
  fields: Partial<HumanViewerAddress> = {},
): {
  /**
   * Interactive document/view address carried in the page fragment.
   */
  view: string;

  /**
   * Capture request using the same encoded document and observation fields.
   */
  render: string;

  /**
   * Small clay observation; generation and actual output admission remain downstream.
   */
  thumbnail: string;

  /**
   * Sheet request with the declared ordered view axis appended to the address.
   */
  sheet: string;
} {
  const address = {
    ...parseHumanViewerAddress(new URLSearchParams({ doc }).toString()),
    ...fields,
  };
  const encoded = serializeHumanViewerAddress(address);
  const thumbnail = serializeHumanViewerAddress({
    ...address,
    pass: "clay",
    size: 160,
  });
  return {
    view: "/view#" + encoded,
    render: "/render?" + encoded,
    thumbnail: "/render?" + thumbnail,
    sheet:
      "/sheet?" +
      encoded +
      "&axes=" +
      encodeURIComponent("view:" + humanViewerChoices.views.join(",")),
  };
}
