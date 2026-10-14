import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Encode every meaningful display field in a transport-independent query. Hash navigation and HTTP rendering consume identical bytes. No filesystem path or reference image enters the address, making bookmarks shareable without sharing the local reference configuration.
 *
 * @evidence contracts/common.md#principled-implementation Serializes the observation protocol's display fields with URLSearchParams, using established optional-field defaults and preserving explicit construction, mask and framing selections.
 * @evidence contracts/common.md#clear-and-simple-design One transport serializer is shared by hash navigation and HTTP requests while local reference configuration remains outside the numerical address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filesystem path or synthetic display identity is inserted; omitting default optional values follows the existing parser contract.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains transport-independent fields and the exclusion of local reference configuration from shareable bookmarks.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar fields and joins of parts/hide/framing arrays cost their total encoded text bytes, with one query string result.
 * @evidence contracts/performance.md#reuse-equivalent-work Serialization is pure for the supplied selection but stores no completed query; cache authority still requires source/document identity beyond equal address bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary query parameters become unreachable after string conversion and no canvas, URL listener or transport handle is acquired.
 */
export function serializeHumanViewerAddress(
  address: Omit<HumanViewerAddress, "light" | "landmarks" | "calibrate"> &
    Partial<Pick<HumanViewerAddress, "light" | "landmarks" | "calibrate">>,
): string {
  const fields: URLSearchParams = new URLSearchParams({
    doc: address.doc,
    view: address.view,
    pass: address.pass,
    ao: address.ao ? "on" : "off",
    shadows: address.shadows ? "on" : "off",
    size: String(address.size),
    opacity: String(address.opacity),
  });
  if (address.parts.length !== 0) fields.set("parts", address.parts.join(","));
  if (address.operation === "construct") fields.set("operation", "construct");
  if (address.hide.length !== 0) fields.set("hide", address.hide.join(","));
  if (address.zoom !== 1) fields.set("zoom", String(address.zoom));
  if (address.pitch !== 0) fields.set("pitch", String(address.pitch));
  if (address.look !== null) fields.set("look", address.look.join(","));
  if (address.frame !== null) fields.set("frame", address.frame.join(","));
  if (address.ref !== null) fields.set("ref", address.ref);
  if (address.landmarks === true) fields.set("landmarks", "on");
  if (address.calibrate === true) fields.set("calibrate", "on");
  const light: HumanViewerAddress["light"] = address.light ?? null;
  if (light !== null)
    fields.set("light", [light.name, ...light.direction].join(","));
  return fields.toString();
}
