import { Finish } from "./Finish";

/** Private part table consumed by the public templeModelFinish classifier. */
const objectFinishes: Readonly<
  Record<string, Readonly<Record<string, Finish>>>
> = {
  "fixture.altar": {
    step: "limestone",
    top: "limestone",
    support: "limestone",
  },
  "fixture.niche": {
    plinth: "limestone",
    body: "limestone",
    "recess-frame": "limestone",
    recess: "limestone",
    cap: "limestone",
  },
  "fixture.lampstand": {
    foot: "dark-metal",
    stem: "dark-metal",
    knop: "dark-metal",
    dish: "dark-metal",
  },
  "fixture.offering-table": { top: "limestone", trestle: "limestone" },
  "fixture.display-shelf.offering": { side: "dark-wood", board: "dark-wood" },
  "fixture.display-shelf.administration": {
    side: "dark-wood",
    board: "dark-wood",
  },
  "fixture.desk.writing": {
    top: "dark-wood",
    leg: "dark-wood",
    stretcher: "dark-wood",
  },
  "fixture.desk.reading": {
    top: "dark-wood",
    leg: "dark-wood",
    stretcher: "dark-wood",
  },
  "fixture.stool": {
    seat: "dark-wood",
    leg: "dark-wood",
    stretcher: "dark-wood",
  },
  "fixture.scroll-shelf": {
    frame: "dark-wood",
    board: "dark-wood",
    divider: "dark-wood",
  },
  "fixture.chest": {
    body: "dark-wood",
    lid: "dark-wood",
    hasp: "dark-metal",
    strap: "dark-metal",
  },
  "ware.storage-jar": { body: "terracotta", handle: "terracotta" },
  "ware.carry-jar": { body: "terracotta", handle: "terracotta" },
  "ware.small-vessel": { body: "terracotta", handle: "terracotta" },
  "ware.offering-bowl": { bowl: "dark-metal" },
  "ware.basket": { wall: "wicker", rim: "wicker", floor: "wicker" },
  "ware.scroll.rolled": { sheet: "parchment", tie: "rope-fibre" },
  "ware.scroll.bundle": {
    "sheet-1": "parchment",
    "sheet-2": "parchment",
    "sheet-3": "parchment",
    tie: "rope-fibre",
  },
  "ware.scroll.open": { sheet: "parchment" },
  "portable.bench.standard": { seat: "limestone", pier: "limestone" },
  "portable.bench.short": { seat: "limestone", pier: "limestone" },
  "portable.lamp": {
    foot: "dark-metal",
    stem: "dark-metal",
    dish: "dark-metal",
  },
  "portable.jar-rack": {
    top: "dark-wood",
    leg: "dark-wood",
    well: "dark-wood",
  },
  "portable.carrying-yoke": { beam: "dark-wood", hook: "dark-metal" },
  "portable.handcart": {
    deck: "dark-wood",
    handle: "dark-wood",
    support: "dark-wood",
    axle: "dark-wood",
    wheel: "dark-wood",
  },
  "portable.bucket": { body: "terracotta", handle: "terracotta" },
  "portable.planter": { pot: "terracotta", soil: "soil" },
  "portable.votive-plaque": { base: "limestone", slab: "limestone" },
  "portable.offering-tray": { floor: "dark-metal", rim: "dark-metal" },
  "portable.textile.standard": { cloth: "linen" },
  "portable.textile.small": { cloth: "linen" },
  "portable.stylus": { shaft: "dark-metal", tip: "dark-metal" },
  "portable.writing-tablet": {
    frame: "dark-wood",
    "writing-face": "parchment",
  },
  "portable.rope-coil": { rope: "rope-fibre", tie: "rope-fibre" },
  "ritual.censer": {
    foot: "dark-metal",
    stem: "dark-metal",
    cup: "dark-metal",
    ash: "soil",
    incense: "soil",
  },
  "ritual.floor-cushion": { base: "linen", pad: "linen", fold: "linen" },
  "ritual.jar-stand": {
    foot: "limestone",
    post: "limestone",
    ring: "limestone",
  },
};
/**
 * Explicit object IDs and parts require own table keys. Building and landscape prefix branches consume the source owners' admitted family IDs/parts; this classifier does not independently enumerate or validate every member of those families.
 *
 */
export const templeModelFinish: (id: string, part: string) => Finish = (id: string, part: string): Finish => {
  if (Object.hasOwn(objectFinishes, id)) {
    const parts: Readonly<Record<string, Finish>> = objectFinishes[id]!;
    if (!Object.hasOwn(parts, part))
      throw new Error(`${id}/${part}: no object part finish`);
    return parts[part]!;
  }
  if (id.startsWith("landscape.neighbor-house."))
    return part === "roof"
      ? "roof-terracotta"
      : part === "plinth"
        ? "limestone"
        : "plaster";
  if (id === "landscape.cypress" || id === "landscape.broad-tree")
    return part === "crown" ? "foliage" : "dark-wood";
  if (id === "landscape.grass-tuft") return "foliage";
  if (id.startsWith("column.") ||
    id.startsWith("frame.") ||
    id === "entablature.porch")
    return "limestone";
  if (id.startsWith("beam.") ||
    id.startsWith("rafter.") ||
    id.startsWith("truss.") ||
    id.startsWith("joist."))
    return "dark-wood";
  if (id.startsWith("tile.")) return "roof-terracotta";
  if (id.startsWith("door."))
    return ["plate", "pin", "ring", "hinge", "strap"].includes(part)
      ? "dark-metal"
      : "dark-wood";
  if (id === "fixture.fountain" || id === "fountain")
    return ["water", "ripple", "jet"].includes(part) ? "water" : "limestone";
  throw new Error(`${id}/${part}: no model finish`);
};
