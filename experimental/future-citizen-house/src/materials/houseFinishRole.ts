import { HouseFinishId } from "./HouseFinishId";

/** Resolve only explicitly authored building roles. Other names retain their
 * existing source material and cannot be silently renamed as a new finish. */

export function houseFinishRole(
  host: string,
  current: string
): HouseFinishId | null {
  if (current === "stone") {
    if (/^(ground-foundation|upper-slab|roof-weather|canopy-support-.*-pedestal)/.test(
      host
    ))
      return null;
    return "limestone-honed";
  }
  if (current === "cassette") return "cassette-coated";
  if (current === "seal") return "cassette-seal";
  if (current === "plaster")
    return /^(kitchen-overhead|flex-murphy-frame-closed-panel)/.test(host)
      ? "joinery-light"
      : "plaster-paint";
  if (current === "felt")
    return host.startsWith("flex-workroom-lining-") ? "felt-panel" : null;
  if (current === "tile")
    return /basin-bowl/.test(host) ? "sanitary-ceramic" : "wet-tile";
  if (current === "oak") {
    if (host.includes("floor-boards")) return "oak-floor";
    if (/^(stair-.*-(tread|riser)|stair-half-landing)/.test(host))
      return "oak-stair";
    if (/(jamb|head|threshold|leaf|cabinet|shelf|wardrobe|pantry|books|vanity|murphy-frame)/.test(
      host
    ) ||
      /^(entry-shoe-bench|common-media|kitchen-sorting|powder-cleaning|powder-basin|primary-nightstand|bath-towels)/.test(
        host
      ))
      return "oak-joinery";
    return "oak-furniture";
  }
  if (current === "white") {
    if (/(kitchen-island-counter|kitchen-wall-bank-worktop)/.test(host))
      return "worktop-stone";
    if (/(toilet-(pedestal|bowl|cistern)|basin-rim|shower-tray)/.test(host))
      return "sanitary-ceramic";
    if (host.includes("pillow")) return "textile-white";
    return null;
  }
  if (current === "green") {
    if (/^(kitchen-island|kitchen-wall-bank)-/.test(host))
      return "joinery-green";
    if (/(cushion|chair-(seat|back)|pillow|duvet)/.test(host))
      return "textile-green";
    return null;
  }
  if (current === "blue") return "textile-blue";
  if (current === "linen")
    return host.startsWith("upper-linen-stack") ? null : "textile-linen";
  if (current === "shade") return "screen-fabric";
  if (current === "metal") {
    if (host.includes("-spandrel-") || host.includes("-louvre-")) return null;
    return /(-glazing-|-(handle|baluster|handrail)|^landing-|^front-entry-)/.test(
      host
    )
      ? "frame-coated"
      : null;
  }
  if (current === "steel")
    return /^stair-.*-stringer/.test(host) ||
      /(kitchen-island-sink|-(tap|faucet|drain|flush|shower-riser|shower-head))/.test(
        host
      )
      ? "steel-satin"
      : null;
  return null;
}
