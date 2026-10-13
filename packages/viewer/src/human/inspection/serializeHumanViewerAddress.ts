import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Encode every meaningful display field in a transport-independent query.
 * Hash navigation and HTTP rendering consume identical bytes. No filesystem
 * path or reference image enters the address, making bookmarks shareable
 * without sharing the local reference configuration.
 */
export function serializeHumanViewerAddress(
  address: Omit<HumanViewerAddress, "light" | "landmarks" | "calibrate"> &
    Partial<Pick<HumanViewerAddress, "light" | "landmarks" | "calibrate">>,
): string {
  const fields = new URLSearchParams({
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
  const light = address.light ?? null;
  if (light !== null)
    fields.set("light", [light.name, ...light.direction].join(","));
  return fields.toString();
}
