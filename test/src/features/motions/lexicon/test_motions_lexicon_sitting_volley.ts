import { humanSittingVolleyPhases } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `HumanSittingVolley` law's phases (`humanSittingVolleyPhases`): the palm
 * reaches its plant by 0.25 of the shift, the seat scoots on it to 0.55, the
 * forearms form the receive platform by 0.8 and ease off by the end (World
 * ParaVolley Rule 9.4.1: the pelvis stays on the court).
 *
 * Scenarios:
 *
 * 1. At the plant the palm reaches fully and the seat has not moved; halfway from
 *    the plant to the release the seat has scooted half way.
 * 2. At the release the seat has scooted all the way and the palm still reaches;
 *    at the receive the platform is formed and the palm has lifted.
 * 3. At the end the platform has eased off.
 */
export function test_motions_lexicon_sitting_volley(): void {
  const plant: humanSittingVolleyPhases.IPhases =
    humanSittingVolleyPhases(0.25);
  const receive: humanSittingVolleyPhases.IPhases =
    humanSittingVolleyPhases(0.8);
  TestValidator.predicate(
    "the shift's phases",
    plant.reaching === 1 &&
      plant.moving === 0 &&
      nclose(humanSittingVolleyPhases(0.4).moving, 0.5, 1e-12) &&
      humanSittingVolleyPhases(0.55).moving === 1 &&
      humanSittingVolleyPhases(0.55).reaching === 1 &&
      receive.platform === 1 &&
      receive.reaching === 0 &&
      humanSittingVolleyPhases(1).platform === 0,
  );
}
