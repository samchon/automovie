/**
 * docs/models/fixtures.md의 고정 집기. 분수 수반: 로컬 원점은 수반 중심의 중정 바닥 완성면.
 * 받침단 지름 2.30m·높이 0.08m, 테두리 벽 바깥 지름 2.00m·두께 0.18m·높이 0.52m(윗면 바깥
 * 모서리 0.02m 모따기), 안쪽 바닥 0.12m, 물면 0.44m(안쪽 지름 1.64m), 노즐 받침 반지름 0.08m,
 * 물줄기 원뿔대(0.025→0.012m) 물면 위 0.65m. 원형 부재 48분할. 한계: 물면의 파문 고리는 만들지 않는다.
 */
import { revolveAutoMovieProfile } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { frustum, model, part } from "./mesh-kit";

export const fountainModel = (): IAutoMovieModel => model("model.fountain", "fountain", [
  part("surface.fountain.step", frustum(1.15, 1.15, 0, 0.08, 48)),
  part("surface.fountain.rim", revolveAutoMovieProfile({
    profile: [{ x: 1.0, y: 0.08 }, { x: 1.0, y: 0.5 }, { x: 0.98, y: 0.52 }, { x: 0.82, y: 0.52 }, { x: 0.82, y: 0.08 }, { x: 1.0, y: 0.08 }],
    segments: 48,
  })),
  part("surface.fountain.basin-inner", frustum(0.82, 0.82, 0.08, 0.12, 48)),
  part("surface.fountain.water", frustum(0.82, 0.82, 0.43, 0.44, 48)),
  part("surface.fountain.nozzle", frustum(0.08, 0.08, 0.12, 0.49, 24)),
  part("surface.fountain.jet", frustum(0.025, 0.012, 0.44, 1.09, 24)),
]);
