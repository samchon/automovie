import type { IAutoMovieMaterial } from "@automovie/interface";
import { materialFinish } from "./001-binding-and-scale";
import { houseFinish, type HouseFinish } from "./house-finishes";

type Role = HouseFinish | "prop-rubber" | "prop-fabric" | "prop-ceramic" | "prop-container-glass" | "prop-steel" | "prop-appliance" | "prop-plastic" | "prop-cap" | "prop-paper" | "prop-diffuser" | "prop-exterior-plastic" | "prop-mirror" | "retained/metal" | "retained/white" | "retained/glass" | "retained/soil" | "retained/bark" | "retained/leaf" | "retained/glow" | "retained/felt" | "retained/linen" | "retained/oak" | "retained/green" | "retained/blue" | "retained/sanitary-seat";

const solids: Record<string, [string, number, number, number?, number?, number?, number?]> = {
  "prop-rubber": ["#343735", .90, 0],
  "prop-ceramic": ["#e7e6df", .26, 0, .10],
  "prop-container-glass": ["#cbd7d2", .12, 0, 0, .68, .003, 1.5],
  "prop-steel": ["#a9b0ad", .32, .78],
  "prop-appliance": ["#c8cbc7", .38, .18],
  "prop-plastic": ["#d6d5ce", .48, 0],
  "prop-cap": ["#59655d", .55, 0],
  "prop-paper": ["#e4e2db", .92, 0],
  "prop-diffuser": ["#e7e6df", .65, 0, 0, .25],
  "prop-exterior-plastic": ["#51564e", .70, 0],
  "prop-mirror": ["#cbd7d2", .06, .85],
  "retained/metal": ["#293332", .38, 0],
  "retained/white": ["#eeeae0", .76, 0],
  "retained/glass": ["#d2e2dc", .09, 0, 0, .68],
  "retained/soil": ["#3c4132", .98, 0],
  "retained/bark": ["#665c47", .92, 0],
  "retained/leaf": ["#527644", .92, 0],
  "retained/glow": ["#fff0cc", .76, 0],
  "retained/felt": ["#a09a8d", .96, 0],
  "retained/linen": ["#c8c3b6", .92, 0],
  "retained/oak": ["#a78965", .55, 0],
  "retained/green": ["#69755b", .76, 0],
  "retained/blue": ["#657682", .94, 0],
  "retained/sanitary-seat": ["#e7e6df", .30, 0],
};

function finish(role: Role): IAutoMovieMaterial {
  if (role in solids) {
    const [color, roughness, metallic, clearcoat = 0, transmission = 0, thickness = 0, ior = 1.5] = solids[role];
    return materialFinish(role, color, roughness, { metallic, clearcoat, transmission, thickness, ior });
  }
  return houseFinish(role as HouseFinish);
}

function textile(variant: string): Role {
  if (variant === "default" || variant === "linen") return "textile-linen";
  if (variant === "green") return "textile-green";
  if (variant === "blue") return "textile-blue";
  if (variant === "white") return "textile-white";
  throw new Error(`unknown textile material variant ${variant}`);
}

/** The reviewed model part is the binding address; geometry and member placement
 * remain with modelSources and instanceSources respectively. */
export function modelMaterialFor(anchor: string, state: string, part: string, variant = "default"): IAutoMovieMaterial {
  let role: Role | null = null;
  const starts = (prefix: string) => part.startsWith(prefix);
  const inState = (values: string[]) => values.includes(state);
  switch (anchor) {
    case "living-sofa":
      role = /^(frame|leg-|back-frame|chaise-frame|chaise-front-leg)/.test(part) ? "oak-furniture" : textile(variant);
      break;
    case "dining-table": case "coffee-table": role = "oak-furniture"; break;
    case "dining-chair": role = part === "seat-pad" ? textile(variant) : "oak-furniture"; break;
    case "island-stool": role = "retained/metal"; break;
    case "work-desk": role = /^(telescopic-|collar|aux-hinge)/.test(part) ? "retained/metal" : "oak-furniture"; break;
    case "desk-chair": role = part === "upholstery" ? textile(variant) : /leg-/.test(part) ? "retained/metal" : "retained/white"; break;
    case "work-equipment": role = starts("keys-") ? "retained/white" : "retained/metal"; break;
    case "accent-chair": role = /^(frame|leg-)/.test(part) ? "oak-furniture" : textile(variant); break;
    case "cabinet-and-shelf":
      role = /^(hinge-|handle-|runner-|rod$)/.test(part) ? "retained/metal" : state.startsWith("island-base/") || state.startsWith("kitchen-base/") ? "joinery-green" : state.startsWith("wall/") ? "joinery-light" : "oak-joinery";
      break;
    case "entry-bench": role = textile(variant); break;
    case "entry-charging-shelf": role = starts("bracket") ? "retained/metal" : "oak-joinery"; break;
    case "fixed-bed":
      role = /^(mattress|duvet|pillow)/.test(part) ? part.startsWith("pillow") ? "textile-white" : textile(variant) : "oak-furniture";
      break;
    case "murphy-bed":
      role = /^(mattress|duvet|pillow)/.test(part) ? part === "pillow" ? "textile-white" : textile(variant) : /^(hinge|pull)/.test(part) ? "retained/metal" : "oak-joinery";
      break;
    case "basin": role = /^(rim|bowl)/.test(part) ? "sanitary-ceramic" : starts("tap") ? "steel-satin" : part === "mirror-glass" ? "prop-mirror" : "frame-coated"; break;
    case "toilet": role = part === "seat" || part === "lid" ? "retained/sanitary-seat" : part === "flush" ? "steel-satin" : "sanitary-ceramic"; break;
    case "shower": role = part === "tray" ? "sanitary-ceramic" : part === "screen" ? "retained/glass" : "steel-satin"; break;
    case "bathtub": role = "sanitary-ceramic"; break;
    case "kitchen-island": role = part === "counter" ? "worktop-stone" : "steel-satin"; break;
    case "cooking-appliances":
      role = state === "wall-worktop" ? "worktop-stone" : part === "window" ? "prop-container-glass" : /^(zone-|controls|knob|handle)/.test(part) ? "prop-steel" : "retained/metal";
      break;
    case "refrigerator": role = starts("handle") ? "frame-coated" : "prop-appliance"; break;
    case "laundry-appliances": role = part === "window" ? "retained/glass" : /^(drum|controls|hinge)/.test(part) ? "retained/metal" : "retained/white"; break;
    case "rear-counter-sink": role = starts("tap") ? "frame-coated" : "prop-steel"; break;
    case "potted-plant": role = part === "pot" ? "retained/metal" : part === "soil" ? "retained/soil" : part === "stem" ? "retained/oak" : starts("branch") ? "retained/bark" : "retained/leaf"; break;
    case "books": role = "prop-paper"; break;
    case "folded-towels": role = "retained/linen"; break;
    case "storage-basket": role = "retained/felt"; break;
    case "entry-charger": role = "retained/metal"; break;
    case "rugs": role = textile(variant); break;
    case "wall-art": role = part === "cover" ? "prop-container-glass" : part === "back" || part === "frame" ? "oak-furniture" : "prop-paper"; break;
    case "tabletop-props": role = state === "tray" ? "oak-furniture" : "prop-ceramic"; break;
    case "living-display": role = "retained/metal"; break;
    case "ceiling-surface-light": case "dining-pendant": role = part === "diffuser" ? "retained/glow" : "retained/metal"; break;
    case "portable-lamps": role = part === "globe" ? "retained/glow" : part === "diffuser" ? "prop-diffuser" : state === "bedside-globe" ? "retained/metal" : "frame-coated"; break;
    case "household-textiles": role = state === "outdoor-mat" ? "prop-rubber" : textile(variant); break;
    case "personal-articles": role = inState(["hanger", "umbrella-stand"]) ? "frame-coated" : "prop-fabric"; break;
    case "dining-wares": role = inState(["plate", "flower-vase"]) ? "prop-ceramic" : state === "water-bottle" ? "prop-container-glass" : "prop-steel"; break;
    case "kitchen-smallwares": role = inState(["cutting-board", "knife-block"]) ? "oak-furniture" : state === "utensil-crock" ? "prop-ceramic" : state === "glass-jar" ? "prop-container-glass" : inState(["toaster", "coffee-brewer"]) ? "prop-appliance" : "prop-steel"; break;
    case "bath-accessories": role = state === "tissue-holder" ? "frame-coated" : inState(["tissue-roll", "tissue-pack"]) ? "prop-paper" : "prop-plastic"; break;
    case "household-boxes": role = state === "parcel-locker" ? "frame-coated" : "prop-paper"; break;
    case "household-tools": role = "prop-appliance"; break;
    case "exterior-furnishings": role = state === "outdoor-waste-bin" ? "prop-exterior-plastic" : "frame-coated"; break;
    case "wall-accessories": role = state === "entry-mirror" && part === "front" ? "prop-mirror" : state === "wall-sconce" && part === "diffuser" ? "prop-diffuser" : "frame-coated"; break;
    case "desk-controls": role = "prop-appliance"; break;
    case "under-cabinet-light": role = part === "diffuser" ? "prop-diffuser" : "frame-coated"; break;
    case "kitchen-extractor": role = "frame-coated"; break;
  }
  if (!role) throw new Error(`material binding absent: ${anchor}/${state}/${part}`);
  if (role === "prop-fabric") return materialFinish(role, "#6b735c", .88, { baseColorTexture: houseFinish("textile-green").baseColorTexture });
  return finish(role);
}
