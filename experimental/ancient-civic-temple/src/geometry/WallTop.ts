import { type RoofPatch } from "./RoofPatch";

/** How a wall column ends at its top: under a roof unit's underside, or flat at a stated height with an optional coping. */
export type WallTop =
  | { kind: "roof"; tier: RoofPatch["tier"] }
  | {
    kind: "flat"; height: number; surface: string;
    /** Stone coping thickness (m). When present, the wall solid ends in a hidden bearing face at height-coping and copingCells builds the coping. */
    coping?: number;
  };

