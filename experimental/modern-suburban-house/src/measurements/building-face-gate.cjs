/** Keep the exact building member population separate from approximate
 * furniture and props when gating missing measured face sentences. */
/** @param {{file:string; candidate:boolean}} row */
const isBuildingFaceMissing = (row) =>
  !row.candidate && /^0[1-6]-/.test(row.file);

module.exports = { isBuildingFaceMissing };
