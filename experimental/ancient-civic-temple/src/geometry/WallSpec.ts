import type { PlanPoint } from "./PlanPoint";
import { WallSegment } from "./WallSegment";
import { WallVoid } from "./WallVoid";


export interface WallSpec {
  /** Wall ID used in element and model identifiers. */
  id: string;
  /** Surface owner names for reveal, joint, bearing and footing. */
  owner: string;
  plan: PlanPoint[];
  axis: "x" | "z";
  bottom: number;
  segments: WallSegment[];
  voids: WallVoid[];
  ends?: { low?: string; high?: string; };
}
