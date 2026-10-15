import type { Observation } from "../house/Observation";

/** Keep the actual five reference poses and their specific material questions.
 * A failed pose remains a failed question rather than an alternate camera. */

export function materialFrameQuestions(stations: readonly Observation[]) {
  const questions: Record<string, string> = {
    "01-exterior": "stone panels and floor joints, the same finish on front and right, frames, cassettes, seals, glass, and PV",
    "02-section-axonometric": "in the inspection section, distinguishing floor, bedding, and wet faces and part boundaries",
    "03-common-room": "oak floor, dining table, textiles, green cabinets, worktop, metal, and clear glass",
    "04-flex-room": "felt, desk, textiles, folding front, horizontal shelf grain, back, handles, and lower frosted glass",
    "05-upper-private-floor": "door and jamb vertical grain, floor, glass reflection, upper frames, and lower frosted glass",
  };
  return Object.entries(questions).map(([id, question]) => ({
    id, question, station: stations.find(s => s.space === "references" && s.id === id) ?? null,
  }));
}
