import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { humanViewerChoices } from "./humanViewerChoices.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

/**
 * The link that opens a document in the navigable viewer, the request that renders it and the sheet of its eight views. They share one address encoding for the supplied document and observation settings. `fields` overrides a fresh parsed address. The thumbnail explicitly changes pass and extent to a 160-pixel clay square; the sheet explicitly enumerates the supported views. The caller supplies document identity; this function starts no generation and supplies no example parameters or runtime provenance.
 *
 * @evidence contracts/common.md#principled-implementation A fresh parsed address plus supplied overrides feeds the canonical serializer for viewer, render, thumbnail and ordered-view sheet routes.
 * @evidence contracts/common.md#clear-and-simple-design One address representation serves four URLs with explicit clay and 160-pixel thumbnail overrides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper supplies no example identity or runtime proof; downstream address and output admission remain required.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies shared observation fields, supplied document authority and deliberate thumbnail/sheet differences.
 * @evidence contracts/performance.md#efficient-algorithms A fixed set of projections scans encoded field text and the fixed supported-view list without rendering pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work Every URL form shares the canonical serializer, without treating a URL as proof of completed display.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned route strings retain no page, image, viewport or generation resource.
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
  const address: HumanViewerAddress = {
    ...parseHumanViewerAddress(new URLSearchParams({ doc }).toString()),
    ...fields,
  };
  const encoded: string = serializeHumanViewerAddress(address);
  const thumbnail: string = serializeHumanViewerAddress({
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
