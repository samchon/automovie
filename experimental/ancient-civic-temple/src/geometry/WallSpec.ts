import type { PlanPoint } from "./PlanPoint";
import { WallSegment } from "./WallSegment";
import { WallVoid } from "./WallVoid";


/** One physical wall: its convex plan, segments along its length and the voids cut through it. */
export interface WallSpec {
  /** Wall ID used in element and model identifiers. */
  id: string;
  /** Surface owner names for reveal, joint, bearing and footing. */
  owner: string;
  /** Convex plan outline of the whole wall. */
  plan: PlanPoint[];
  /** World axis the wall's length runs along. */
  axis: "x" | "z";
  /** Common bottom height of the wall. */
  bottom: number;
  /** Contiguous intervals along the wall with their top and face owners. */
  segments: WallSegment[];
  /** Openings cut through the wall. */
  voids: WallVoid[];
  /** Surface owners of the wall's two end faces. */
  ends?: { low?: string; high?: string; };
}
