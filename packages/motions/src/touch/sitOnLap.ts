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
import { admitLapSupport } from "./admitLapSupport";
import { requireOtherPerformer } from "./requireOtherPerformer";
import { StrikingBody } from "../striking/StrikingBody";

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
 */
function planSitOnLap(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSitOnLap>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanSitOnLap = context.params;
  requireOtherPerformer(
    context.subject,
    p.partner,
    "a performer sits on another performer's lap",
  );
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
  admitLapSupport(p.partner, hips.y - knees.y, partner.body.measure.thigh);
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
