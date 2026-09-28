/**
 * Roof-off inspection removes the whole covering assembly, including its
 * independent tile and timber prototypes. The client calls this predicate on
 * the actual emitted model identity; it leaves beauty views and wall/column
 * geometry unchanged. Prefixes are the model families authored by the space,
 * cladding and entablature producers, rather than camera-specific exceptions.
 */
/** @param {string} model @returns {boolean} */
export const isTempleRoofCovering = (model) => model === "model.ceilings" ||
  ["model.roof", "tile.", "rafter.", "truss.", "joist."].some((prefix) => model.startsWith(prefix));
