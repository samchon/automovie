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
    "01-exterior":"석재 패널·층간 이음, front/right 같은 마감, frame·cassette·seal·유리·PV",
    "02-section-axonometric":"검사 절개에서 바닥·침구·습식 면과 부품 경계 구분",
    "03-common-room":"oak floor·식탁·직물·초록 cabinet·worktop·금속·투명 유리",
    "04-flex-room":"felt·desk·직물·접이식 전면, 선반 가로결·back·손잡이, 하부 frosted",
    "05-upper-private-floor":"door/jamb 세로결·floor·유리 반사, 상층 frame·하부 frosted",
  };
  return Object.entries(questions).map(([id,question])=>({
    id,question,station:stations.find(s=>s.space==="references"&&s.id===id)??null,
  }));
}
