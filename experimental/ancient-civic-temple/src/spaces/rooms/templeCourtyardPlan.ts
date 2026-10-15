import { templePlan as p } from "../templePlan";

export const templeCourtyardPlan = {
  west: p.westCourt, east: p.eastCourt, north: p.courtBack, south: p.courtFront,
} as const;
