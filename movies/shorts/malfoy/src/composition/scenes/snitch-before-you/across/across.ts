import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * Scene 6, 35–43 s: Carina comes up on Harry's left, matches his line and
 * holds her bare rear section at his free hand ("Take the back, Potter.");
 * at 38.000 his left hand closes on it, his right lets go of his own broom,
 * he hauls himself over and sits astride behind her; the broom steadies and
 * climbs gently while his empty broom flies on. One unbroken alongside shot
 * on Carina's side from her arrival to the steady broom.
 *
 * Concretization: after the transfer the pair carries on along Carina's
 * matched line; the dip and shallow climb wait for the library's tandem
 * flight (R8), and the rear seat stays behind her only while both keep the
 * same line.
 *
 * @param stage The pitch stage.
 * @returns The scene, filling 35–43 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06 The scene.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06-b01 Alongside; the rear section offered; her line.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06-b02 The new grip at 38.000 before the old release.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06-b03 Astride behind her.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06-b04 Steady, a shallow climb.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes the offer, the transfer pinned at its anchor and the steady climb; the dip and the riderless broom wait for R8 and the broom prop.
 * @evidence contracts/development/composition.md#composition-only Chains library capabilities; the grip is pinned at its screenplay anchor; every place is the pitch's.
 * @evidence contracts/development/composition.md#living-scene Both riders act through the whole scene; the camera rides with them unbroken.
 */
export function across(stage: PitchStage): AutoMovieComposition {
  const { carina, harry, camera } = stage;
  return StageTime.scene(
    "s06",
    35,
    43,
    carina.offerRear(harry, { start: 35 }).say("Take the back, Potter.", { start: 37 }),
    harry.transfer(carina, { contact: 38, anchor: "s06-b02/grip" }),
    camera.alongside([carina, harry], { start: 35, side: "left", view: "front", distance: 5 }),
  );
}
