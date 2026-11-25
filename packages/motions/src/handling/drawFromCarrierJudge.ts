import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanPrehension,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { drawFromCarrierPulling } from "./drawFromCarrierPulling";

/**
 * Judge a draw's fitted hands against their planned wrists: at each of `JUDGED`
 *
 * - 1 even samples of the draw the plan's posture is resolved, and the drawing
 *   hand (and the pulling hand, when one pulls) must lie within `GRIP` of its
 *   planned wrist.
 *
 * @param context The draw's context.
 * @param plan The draw's plan.
 * @param bone The drawing hand's bone.
 * @param transport The drawing wrist's transport.
 * @param pulled The other hand's pull, when it pulls.
 * @param retreat The pulling wrist's transport, when it pulls.
 * @param prop The drawn object.
 * @param aperture The carrier's aperture the draw leaves by.
 * @throws {HumanRefusal} On `from.aperture` when a hand leaves its grip by more
 *   than `GRIP`.
 */
export function drawFromCarrierJudge(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
  plan: IAutoMovieMotionHumanActionPlan,
  bone: AutoMovieHumanoidBone,
  transport: IAutoMovieMotionHumanPrehension.ITransport,
  pulled: drawFromCarrierPulling.IPulled | null,
  retreat: IAutoMovieMotionHumanPrehension.ITransport | null,
  prop: string,
  aperture: string,
): void {
  const duration: number = transport.duration;
  for (let k: number = 0; k <= drawFromCarrierJudge.JUDGED; ++k) {
    const t: number = (duration * k) / drawFromCarrierJudge.JUDGED;
    const pose: IAutoMoviePose = resolveHumanPosture(
      context.body,
      plan.posture(t),
      context.entry.pose,
    );
    const hands: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      pose,
      undefined,
      new Set<AutoMovieHumanoidBone>(
        pulled === null ? [bone] : [bone, `${pulled.side}Hand`],
      ),
    );
    const off: number = Math.max(
      Vector3.distance(hands.get(bone)!.worldPosition, transport.wrist(t)),
      pulled === null || retreat === null
        ? 0
        : Vector3.distance(
            hands.get(`${pulled.side}Hand`)!.worldPosition,
            retreat.wrist(t),
          ),
    );
    if (off > drawFromCarrierJudge.GRIP)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "from.aperture",
        value: aperture,
        feasible: {
          kind: "range",
          unit: "m",
          minimum: 0,
          maximum: drawFromCarrierJudge.GRIP,
        },
        reason: `the drawing hand leaves ${prop}'s grip by ${off.toFixed(3)} m at ${(k / drawFromCarrierJudge.JUDGED).toFixed(2)} of the draw`,
        fix: "wear the carrier where the drawing arm can follow its line",
      });
  }
}

/** The bounds of `drawFromCarrierJudge`. */
export namespace drawFromCarrierJudge {
  /** The draw's samples the fitted hand is judged at, beyond the start. */
  export const JUDGED: number = 8;

  /**
   * How far the fitted hand may leave its planned place on the guided grip,
   * metres: half of the 2 cm a scabbard is made wider than its blade (Wulflund,
   * https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html),
   * the play the grip has before it would bind the blade.
   */
  export const GRIP: number = 0.01;
}
