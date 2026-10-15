/**
 * Builds a planar convex wall host as a set of closed prisms of convex columns split by length interval,
 * roof piece and opening. The top is the real roof underside plane of the given composition unit (tier) or a
 * stated flat height (parapet or yard wall coping), and the bottom is the caller's common bottom. Columns in an
 * opening interval keep only the parts below the threshold and above the lintel (below and above the sill for
 * windows), giving a real void and reveal. A long face can be split by the adjacent roof line into interior,
 * contact and exterior bands. Interior contact faces at column boundaries hide inside the adjacent column (numeric limit 1e-9 m).
 */
import { type RoofPatch } from "./RoofPatch";

export type WallTop =
  | { kind: "roof"; tier: RoofPatch["tier"] }
  | {
    kind: "flat"; height: number; surface: string;
    /** Stone coping thickness (m). When present, the wall solid ends in a hidden bearing face at height-coping and wall-trim builds the coping. */
    coping?: number;
  };

