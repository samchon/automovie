import { TestValidator } from "@nestia/e2e";

import {
  faceSmileOrbital,
  faceSmileRecouple,
} from "../../../scripts/face-review/faceSmileOrbital";
import { nclose } from "../internal/predicates";

/**
 * The smile's coupled units held to the smile the face finally shows.
 * Scenarios:
 * 1. A smile yielded from 0.6 to 0.2 on the left takes its raiser down to
 *    the raiser `faceSmileOrbital` gives at 0.2, and its retraction down to
 *    0.2; the right side, whose raiser and retraction already sit below
 *    their couplings, keeps them; nothing else changes and the input is
 *    left as it was.
 * 2. Without rates the raisers stay (none was set by the norm) while the
 *    retractions still follow their smiles; a face without a smile takes
 *    every retraction to rest, and a unit the expression lacks stays
 *    absent.
 */
export const test_subject_face_smile_recouple = (): void => {
  const rates = {
    labial: { left: 0.00758, right: 0.00758 },
    fissure: { left: -0.00023, right: -0.00023 },
    raiser: { left: -0.00107, right: -0.00107 },
    maximum: 1,
  };
  const at = (left: number, right: number) =>
    faceSmileOrbital({ ...rates, smile: { left, right } });
  const expression = {
    mouthSmileLeft: 0.2,
    mouthSmileRight: 0.6,
    cheekSquintLeft: at(0.6, 0.6).left,
    cheekSquintRight: at(0.6, 0.3).right,
    mouthSmileRetractLeft: 0.6,
    mouthSmileRetractRight: 0.3,
    jawOpen: 0.4,
  };
  const before = JSON.stringify(expression);
  const out = faceSmileRecouple({ expression, rates });
  TestValidator.predicate(
    "yielded smile",
    nclose(out.cheekSquintLeft!, at(0.2, 0).left, 1e-12) &&
      out.mouthSmileRetractLeft === 0.2 &&
      out.cheekSquintRight === expression.cheekSquintRight &&
      out.mouthSmileRetractRight === 0.3 &&
      out.jawOpen === 0.4 &&
      out.mouthSmileLeft === 0.2 &&
      JSON.stringify(expression) === before,
  );
  const unrated = faceSmileRecouple({ expression, rates: null });
  const still = faceSmileRecouple({
    expression: { mouthSmileRetractLeft: 0.5, cheekSquintLeft: 0.4 },
    rates,
  });
  TestValidator.predicate(
    "without rates or smile",
    unrated.cheekSquintLeft === expression.cheekSquintLeft &&
      unrated.mouthSmileRetractLeft === 0.2 &&
      still.mouthSmileRetractLeft === 0 &&
      still.cheekSquintLeft === 0 &&
      !("mouthSmileRetractRight" in still) &&
      !("cheekSquintRight" in still),
  );
};
