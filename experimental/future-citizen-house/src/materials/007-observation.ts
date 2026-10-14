import type { State } from "../house/assembly";
import type { Observation } from "../house/observations";

/** All declared static combinations; private/night equality is an observation,
 * not permission to omit either state's actual producer result. */
export const materialStates: readonly State[] = [
  {privacy:"day",flex:"work"},{privacy:"day",flex:"guest"},
  {privacy:"private",flex:"work"},{privacy:"private",flex:"guest"},
  {privacy:"night",flex:"work"},{privacy:"night",flex:"guest"},
];

/** Keep the actual five reference poses and their specific material questions.
 * A failed pose remains a failed question rather than an alternate camera. */
export function materialFrameQuestions(stations: readonly Observation[]) {
  const questions: Record<string,string> = {
    "01-exterior":"stone panels and floor joints, the same finish on front and right, frames, cassettes, seals, glass, and PV",
    "02-section-axonometric":"in the inspection section, distinguishing floor, bedding, and wet faces and part boundaries",
    "03-common-room":"oak floor, dining table, textiles, green cabinets, worktop, metal, and clear glass",
    "04-flex-room":"felt, desk, textiles, folding front, horizontal shelf grain, back, handles, and lower frosted glass",
    "05-upper-private-floor":"door and jamb vertical grain, floor, glass reflection, upper frames, and lower frosted glass",
  };
  return Object.entries(questions).map(([id,question])=>({
    id,question,station:stations.find(s=>s.space==="references"&&s.id===id)??null,
  }));
}
