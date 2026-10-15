import type { Glazing } from "./Glazing";

/** Priority splits first, then equal bays of at most 1.25m per span. */

export function edgesOf(w: Glazing): number[] {
  const segments = [w.a, ...(w.breaks ?? []), w.b];
  const edges = [w.a];
  for (let i = 0; i < segments.length - 1; i++) {
    const count = Math.ceil((segments[i + 1] - segments[i]) / 1.25);
    for (let j = 1; j <= count; j++) edges.push(segments[i] + (segments[i + 1] - segments[i]) * j / count);
  }
  return edges;
}
