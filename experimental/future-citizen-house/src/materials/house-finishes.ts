/** Building finish decisions from docs/materials/002-006. Geometry and part
 * identities stay with their existing space and model owners. */
import type { IAutoMovieMaterial } from "@automovie/interface";
import { materialFinish, metricBinding } from "./001-binding-and-scale";

import { exteriorSolidsTextured, exteriorSolidsSolid } from "./002-exterior-solids";
import { woodTextured } from "./004-wood";
import { softFinishesTextured } from "./005-soft-finishes";
import { wetAndJoineryTextured, wetAndJoinerySolid } from "./006-wet-and-joinery";

const textured = { ...exteriorSolidsTextured, ...woodTextured, ...softFinishesTextured, ...wetAndJoineryTextured } as const;

const solid = { ...exteriorSolidsSolid, ...wetAndJoinerySolid } as const;

type WoodFinish = "oak-floor" | "oak-joinery" | "oak-furniture" | "oak-stair";
export type HouseFinish = keyof typeof textured | keyof typeof solid | `wood-end/${WoodFinish}`;

export function isHouseFinish(id: string): id is HouseFinish {
  return id in textured || id in solid || /^wood-end\/oak-(floor|joinery|furniture|stair)$/.test(id);
}

export function houseTextureTile(id: string): { u: number; v: number } | null {
  if (!(id in textured)) return null;
  const [, , , u, v] = textured[id as keyof typeof textured];
  return { u, v };
}

/** A role-specific native finish; no image or geometry is fabricated here. */
export function houseFinish(role: HouseFinish): IAutoMovieMaterial {
  if (role.startsWith("wood-end/")) {
    const [color, roughness] = textured[role.slice("wood-end/".length) as WoodFinish];
    return materialFinish(role, color, roughness);
  }
  if (role in textured) {
    const [color, roughness, asset, u, v] = textured[role as keyof typeof textured];
    return materialFinish(role, color, roughness, { baseColorTexture: metricBinding(asset, u, v) });
  }
  const [color, roughness, metallic, clearcoat] = solid[role as keyof typeof solid];
  return materialFinish(role, color, roughness, { metallic, clearcoat });
}

/** Resolve only explicitly authored building roles. Other names retain their
 * existing source material and cannot be silently renamed as a new finish. */
export function houseFinishRole(host: string, current: string): HouseFinish | null {
  if (current === "stone") {
    if (/^(ground-foundation|upper-slab|roof-weather|canopy-support-.*-pedestal)/.test(host)) return null;
    return "limestone-honed";
  }
  if (current === "cassette") return "cassette-coated";
  if (current === "seal") return "cassette-seal";
  if (current === "plaster") return /^(kitchen-overhead|flex-murphy-frame-closed-panel)/.test(host) ? "joinery-light" : "plaster-paint";
  if (current === "felt") return host.startsWith("flex-workroom-lining-") ? "felt-panel" : null;
  if (current === "tile") return /basin-bowl/.test(host) ? "sanitary-ceramic" : "wet-tile";
  if (current === "oak") {
    if (host.includes("floor-boards")) return "oak-floor";
    if (/^(stair-.*-(tread|riser)|stair-half-landing)/.test(host)) return "oak-stair";
    if (/(jamb|head|threshold|leaf|cabinet|shelf|wardrobe|pantry|books|vanity|murphy-frame)/.test(host) ||
      /^(entry-shoe-bench|common-media|kitchen-sorting|powder-cleaning|powder-basin|primary-nightstand|bath-towels)/.test(host)) return "oak-joinery";
    return "oak-furniture";
  }
  if (current === "white") {
    if (/(kitchen-island-counter|kitchen-wall-bank-worktop)/.test(host)) return "worktop-stone";
    if (/(toilet-(pedestal|bowl|cistern)|basin-rim|shower-tray)/.test(host)) return "sanitary-ceramic";
    if (host.includes("pillow")) return "textile-white";
    return null;
  }
  if (current === "green") {
    if (/^(kitchen-island|kitchen-wall-bank)-/.test(host)) return "joinery-green";
    if (/(cushion|chair-(seat|back)|pillow|duvet)/.test(host)) return "textile-green";
    return null;
  }
  if (current === "blue") return "textile-blue";
  if (current === "linen") return host.startsWith("upper-linen-stack") ? null : "textile-linen";
  if (current === "shade") return "screen-fabric";
  if (current === "metal") {
    if (host.includes("-spandrel-") || host.includes("-louvre-")) return null;
    return /(-glazing-|-(handle|baluster|handrail)|^landing-|^front-entry-)/.test(host) ? "frame-coated" : null;
  }
  if (current === "steel") return /^stair-.*-stringer/.test(host) || /(kitchen-island-sink|-(tap|faucet|drain|flush|shower-riser|shower-head))/.test(host) ? "steel-satin" : null;
  return null;
}
