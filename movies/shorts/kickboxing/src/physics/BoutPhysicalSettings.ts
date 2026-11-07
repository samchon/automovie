/** Numerical contact/target tolerances shared by this production's producer and native integration. */
export namespace BoutPhysicalSettings {
  /** Physical cache samples per film second. */ export const rate: number = 120;
  /** Shared scene floor and its finite native/query domain, metres. */ export const floor: number = 0;
  /** The dynamics producer and geometric observer use this same box. */ export const floorBounds: {
    min: { x: number; z: number };
    max: { x: number; z: number };
    thickness: number;
  } = {
    min: { x: -10, z: -10 },
    max: { x: 10, z: 10 },
    thickness: 1,
  };
  /** Native allowed linear contact error, metres. */ export const contactTolerance: number = 0.0001;
  /** Target fitting resolves one quarter of the native contact slop, metres. */ export const targetTolerance: number =
    contactTolerance / 4;
  /** Existing delivered-motion angular limit error allowance, radians. */ export const jointTolerance: number = 0.01;
  /** Existing delivered-motion floor penetration allowance, metres, after material compression. */ export const floorTolerance: number = 0.015;
  /** Maximum coupled geometric updates per cached interval. */ export const targetIterations: number = 24;
  /** A motor target just inside the declared contact slop establishes actual support instead of hovering within its fit tolerance. */ export const supportPlane: number =
    floor - contactTolerance;
}
