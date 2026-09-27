/** Exactness follows the authored member's building role, including fixed
 * fittings and exterior cladding filed alongside furniture. */
const fixedMembers = new Map([
  ["10-kitchen-dining.md", new Set(["kitchen-base-run", "kitchen-wall-cabinet"])],
  ["11-living.md", new Set(["fireplace-insert-mantel"])],
  ["12-service-rooms.md", new Set(["laundry-upper-storage", "pantry-l-shelf"])],
  ["13-bedrooms.md", new Set(["sliding-closet", "wardrobe-hanging", "wardrobe-shelves"])],
  ["14-bathrooms.md", new Set(["vanity-basin", "sliding-shower-booth", "bathtub"])],
  ["15-outdoor.md", new Set(["lap-siding-board", "exterior-corner-trim", "asphalt-shingle-strip", "eave-gutter-downspout"])],
]);
const approximateContents = new Map([
  ["sliding-closet", new Set(["clothes"])],
  ["wardrobe-hanging", new Set(["clothes"])],
  ["wardrobe-shelves", new Set(["folded", "shoe-box", "basket"])],
  ["vanity-basin", new Set(["accessory"])],
]);
/** @param {{file:string; anchor?:string; id?:string; candidate:boolean}} row */
const isBuildingFaceMissing = (row) =>
  !row.candidate && (/^0[1-6]-/.test(row.file) ||
    (row.anchor !== undefined && fixedMembers.get(row.file)?.has(row.anchor) === true &&
      (row.id === undefined || !approximateContents.get(row.anchor)?.has(row.id))));

module.exports = { isBuildingFaceMissing };
