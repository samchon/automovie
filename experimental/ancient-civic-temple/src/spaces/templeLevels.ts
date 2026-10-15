/**
 * Storey and building identities with the temple's vertical datums in metres: floor, courtyard,
 * road and approach levels, slab thickness, low ceiling, ceiling board reserve and beam depth.
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
