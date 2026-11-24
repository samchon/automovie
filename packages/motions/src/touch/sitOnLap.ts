import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieMotionHumanSitOnLap,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { sit } from "../everyday/sit";
import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * How far below the hips a seated partner's knees may lie, as a share of the
 * thigh: a thigh no steeper than 30 degrees from level (provisional).
 */
const LEVEL: number = 0.5;

/**
 * How far behind the seat's front edge the sit law rests the seat socket, short
 * of the sitter's thigh, metres: `IAutoMovieMotionHumanSeated`'s 0.05 m
 * clearance.
 */
const CLEARANCE: number = 0.05;

/**
 * Sit on a seated partner's lap. The lap is the seated partner's thighs where
 * they are at the start: its height is the top of the two thighs' middles
 * (`thighFrontLeft` and `thighFrontRight`), its heading the partner's hips to
 * knees. The sit law (`sit`) sits the body onto it as onto a seat facing that
 * heading, the seat's front edge set so the sitter's seat socket comes to rest
 * over the thighs' middles; a lap above the sitter's band is got onto as a high
 * seat, the feet hanging. The sit's seat window bears instead on the partner:
 * half on each thigh. A partner whose thighs are not near level is refused as
 * not seated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the lap is read, how the sit is reused, the windows and the refusal.
 */
function planSitOnLap(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSitOnLap>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanSitOnLap = context.params;
  if (p.partner === context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "partner",
      value: p.partner,
      reason: "a performer sits on another performer's lap",
      fix: "name another performer as the partner",
    });
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partner.bones(context.start);
  const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    bones.get(bone)!.worldPosition;
  const hips: IAutoMovieVector3 = Vector3.lerp(
    at("leftUpperLeg"),
    at("rightUpperLeg"),
    0.5,
  );
  const knees: IAutoMovieVector3 = Vector3.lerp(
    at("leftLowerLeg"),
    at("rightLowerLeg"),
    0.5,
  );
  if (hips.y - knees.y > LEVEL * partner.body.measure.thigh)
    throw new HumanRefusal({
      kind: "base",
      axis: "partner",
      value: p.partner,
      reason: `the partner's knees lie ${((hips.y - knees.y) * 1000).toFixed(0)} mm below the hips, so there is no lap`,
      fix: "seat the partner first",
    });
  const top: IAutoMovieVector3 = Vector3.lerp(
    StrikingBody.region(partner.body, bones, "thighFrontLeft").point,
    StrikingBody.region(partner.body, bones, "thighFrontRight").point,
    0.5,
  );
  const forward: IAutoMovieVector3 = Vector3.normalize({
    x: knees.x - hips.x,
    y: 0,
    z: knees.z - hips.z,
  });
  const thigh: number = context.body.measure.thigh;
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: Vector3.add(top, Vector3.scale(forward, thigh - CLEARANCE)),
    yaw: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
    depth: thigh + CLEARANCE,
  };
  const params: IAutoMovieMotionHumanSit.IParams = {
    seat,
    ...(p.hold === undefined ? {} : { hold: p.hold }),
    ...(p.manner === undefined ? {} : { manner: p.manner }),
  };
  const plan: IAutoMovieMotionHumanActionPlan = sit.plan({
    ...context,
    params,
  });
  return {
    ...plan,
    contacts: plan.contacts.flatMap(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow[] =>
        window.part !== "seat"
          ? [window]
          : (["thighFrontLeft", "thighFrontRight"] as const).map(
              (
                region: AutoMovieHumanoidRegion,
              ): IAutoMovieMotionHumanContactWindow => ({
                ...window,
                ...(window.load === undefined ? {} : { load: window.load / 2 }),
                support: { kind: "person", subject: p.partner, region },
              }),
            ),
    ),
  };
}

/**
 * Sit on a seated partner's lap. The lap is the seated partner's thighs where
 * they are at the start: its height is the top of the two thighs' middles
 * (`thighFrontLeft` and `thighFrontRight`), its heading the partner's hips to
 * knees. The sit law (`sit`) sits the body onto it as onto a seat facing that
 * heading, the seat's front edge set so the sitter's seat socket comes to rest
 * over the thighs' middles; a lap above the sitter's band is got onto as a high
 * seat, the feet hanging. The sit's seat window bears instead on the partner:
 * half on each thigh. A partner whose thighs are not near level is refused as
 * not seated.
 */
export const sitOnLap: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSitOnLap> =
  {
    name: "sitOnLap",
    interrupts: sit.interrupts,
    plan: planSitOnLap,
  };
