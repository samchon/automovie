import { edgesOf } from "./edgesOf";
import type { Glazing } from "./Glazing";

/** Member centres: the two jambs stand 0.02m outside the effective span. */
export const centresOf = (w: Glazing): number[] => edgesOf(w).map((u, i, all) => i === 0 ? u - 0.02 : i === all.length - 1 ? u + 0.02 : u);
