/**
 * Shared plan inputs for the temple. All values are in m; +X is east and +Z is front.
 * Implements the sole dimension basis
 * Rooms, walls and roofs consume these values; this owner generates no surfaces or members.
 * A datum change requires every dependent space and junction to be checked again.
 */
export const templePlan = {
  westOuter: -10.5, eastOuter: 10.5,
  westInner: -9.9, eastInner: 9.9,
  westRoom: -5.9, eastRoom: 5.9,
  westRing: -5.6, eastRing: 5.6,
  westCourt: -3.5, eastCourt: 3.5,
  westPorch: -1.8, eastPorch: 1.8,
  westPorchInner: -1.65, eastPorchInner: 1.65,
  westPorchOuter: -1.95, eastPorchOuter: 1.95,
  northOuter: -10.25, northInner: -9.65,
  sanctuaryFront: -4.15, northRing: -3.85,
  yardFront: -2.45, storageBack: -2.15,
  courtBack: -1.75, storageFront: 1.55,
  recordsBack: 1.85, recordsFront: 5.6,
  officeBack: 5.9, courtFront: 6.1,
  entranceBack: 8.05, entranceFront: 8.35,
  southInner: 9.65, southOuter: 10.25,
  tolerance: 0.001,
} as const;

