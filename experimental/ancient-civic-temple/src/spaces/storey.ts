/**
 * Ground-storey Y datums and shared structural reserves (m).
 * Consumes docs/spaces/storey.md#ground-storey; rooms own their physical floors.
 * Registers no space above low ceilings and renders no cap on the open yard.
 * @evidence spaces/storey.md One value object holds the ground-storey ID, finished floor, courtyard, road and service contact heights, structural thickness and boarding ceiling height.
 * @evidence spaces/storey.md#ground-storey Transfers the design values unchanged: finished floor Y=0, courtyard -0.12, road -0.24, structure 0.18, low ceiling 3.10, reserve 0.10 and beam depth 0.18.
 * @evidence spaces/storey.md#threshold-support Gives threshold floors the room floor's finished height and structural thickness, so thresholds reserved inside wall thickness use the same levels.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds only heights and reserves; room-owned functions make the floor and ceiling solids.
 * @evidence principles/core/source-units.md#source-substantive-completion The as const values give every room, wall and connector the same storey datums.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers the single storey, finish and reserve values of storey.md unchanged; the floor ledger (closed floors model, volume 66.849m³) and threshold connectors were established from these values.
 */
export const templeLevels = {
  storey: "temple-ground",
  building: "temple",
  floor: 0,
  courtyard: -0.12,
  publicRoad: -0.24,
  serviceApproach: 0,
  slabThickness: 0.18,
  lowCeiling: 3.1,
  ceilingBoardReserve: 0.1,
  exposedBeamDepth: 0.18,
} as const;

/**
 * Takes the minimum exterior wall contact height read from the site ground
 * (docs/spaces/site.md#site-grade) and implements docs/spaces/storey.md#wall-ground-contact.
 * Invents no exterior ground and refuses non-finite values.
 * The caller also derives the adjacent minimum finish from actual floors or steps.
 * Returns the shared exterior wall bottom (m), without proving ground contact.
 * @evidence spaces/storey.md Implements the formula deriving the common exterior wall bottom from the actual minimum ground contact and adjacent minimum finish.
 * @evidence spaces/storey.md#wall-ground-contact Returns the lower of the two minima minus the 0.18m structural thickness as the common exterior wall bottom.
 * @evidence principles/core/source-units.md#source-scope-preservation Creates no exterior ground here; receives only values the caller reads from site ground and actual floors.
 * @evidence principles/core/source-units.md#source-substantive-completion Refuses either non-finite input; otherwise returns one bottom height (m), without claiming a ground-contact verification result.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the storey.md#wall-ground-contact formula unchanged; current inputs produce bottom -0.42m, extending wall solids and plinths below ground.
 */
export const templeWallBottom = (
  outsideContactMinimum: number,
  adjacentFloorMinimum: number,
): number => {
  if (!Number.isFinite(outsideContactMinimum) ||
      !Number.isFinite(adjacentFloorMinimum)) {
    throw new Error("temple/storey: finite minimum heights of the actual ground and adjacent floor are required.");
  }
  return Math.min(outsideContactMinimum, adjacentFloorMinimum) -
    templeLevels.slabThickness;
};
