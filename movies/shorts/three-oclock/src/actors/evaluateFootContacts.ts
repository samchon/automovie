import { departureWalkCycles } from "./departureWalkCycles";

/**
 * Assign actual flat, rolling and airborne contact roles to the authored feet.
 *
 * @evidence contracts/common.md#implementation-and-ownership Walking alternates an air foot and a planted shoe, permitting the rear stance to roll onto its actual toe late in transfer. Backward retreat first rolls the original right stance onto its heel; the newly rearward left landing supports on its forefoot while the hips remain forward, then both settle flat. The contact is selected from actual material points, not the backward label alone. Turns use a pivot. These roles select hard support versus soft air preferences; they do not claim fitted admission.
 * @evidence contracts/common.md#authoring-interface Actor identity and absolute seconds return each own-side shoe mode. Boundaries match the scene-owned rehearsal/arrival/exchange and independent later action plans. Before/after a transfer both feet settle. Actual full skin/shoe floor, stance and central swing clearance remain the public fitter/scene's measured duties.
 */
export function evaluateFootContacts(person: "carina" | "harry", time: number): { left: "flat" | "toe" | "heel" | "air"; right: "flat" | "toe" | "heel" | "air" } {
  type Modes = ReturnType<typeof evaluateFootContacts>;
  const flat: Modes = { left: "flat", right: "flat" };

  /** Give the landing foot support before the next foot leaves. */
  function walk(start: number, end: number, cycles: number = 1, backward: boolean = false): Modes | undefined {
    if (time <= start || time >= end) return undefined;
    const total: number = (time - start) / (end - start) * cycles;
    const phase: number = total - Math.floor(total);
    const roll: "toe" | "heel" = backward ? "heel" : "toe";
    if (phase < 0.5) return { left: phase === 0 ? "flat" : "air", right: phase >= 0.25 ? roll : "flat" };
    return { left: backward ? "toe" : phase >= 0.75 ? roll : "flat", right: phase === 0.5 ? roll : "air" };
  }
  if (person === "carina") {
    for (const [start, end] of [[0, 1.5], [4.45, 5.6], [6, 7.3], [11.5, 12.6], [13, 14.5]]) { const mode: Modes | undefined = walk(start!, end!); if (mode !== undefined) return mode; }
    for (const [start, end] of [[4.1, 4.45], [5.6, 6], [11.1, 11.5], [12.6, 13], [55.1, 55.75]]) if (time > start! && time < end!) return { left: "toe", right: "air" };
    if (time > 25.25 && time < 26.8) { const phase: number = (time - 25.25) / 1.55 * 6; return Math.floor(phase) % 2 === 0 ? { left: "toe", right: "air" } : { left: "air", right: "toe" }; }
    const departure: Modes | undefined = walk(55.75, 59.7, departureWalkCycles); if (departure !== undefined) return departure;
  } else {
    const arrival: Modes | undefined = walk(13.4, 18, 5); if (arrival !== undefined) return arrival;
    if (time > 18 && time < 19) { const phase: number = (time - 18) * 4; return Math.floor(phase) % 2 === 0 ? { left: "toe", right: "air" } : { left: "air", right: "toe" }; }
    const retreat: Modes | undefined = walk(46.2, 47.7, 1, true); if (retreat !== undefined) return retreat;
  }
  if (time > 38.2 && time < 38.6) return { left: "air", right: "flat" };
  if (time >= 38.6 && time < 39) return { left: "flat", right: "air" };
  return flat;
}
