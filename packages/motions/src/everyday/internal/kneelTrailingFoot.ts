import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { kneelKeys } from "./kneelKeys";

/*
 * A planted foot left behind its hip as the other knee comes down ahead of it,
 * as a lunge's trailing foot: kept flat while its ankle stays within its
 * dorsiflexion range, otherwise up on its toes by the least heel rise that
 * brings the ankle back to that range, the toes' joint kept on its floor point
 * and the toes extending by the rise up to their range. The ankle's flexion is
 * read on the knee the two-bone leg puts between the hip and the ankle, bent
 * toward the body's forward, the leg's pole.
 * Parameter body: The body.
 * Parameter side: The leg.
 * Parameter hip: The leg's hip joint in the key, world metres.
 * Parameter foot: The planted foot.
 * Parameter forward: The body's forward, the direction the knee bends toward.
 * Returns: The foot, flat or on its toes.
 */
export function kneelTrailingFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  hip: IAutoMovieVector3,
  foot: kneelKeys.IFoot,
  forward: IAutoMovieVector3,
): kneelKeys.IFoot {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const range: number =
    AutoMovieMotionHumanRange.limit(`${side}Foot`, "flexion") ?? 20;
  const extension: number =
    AutoMovieMotionHumanRange.limit(`${side}Toes`, "flexion") ?? 60;
  const toe: number = AutoMovieEngineVector3.length(
    AutoMovieEngineVector3.subtract(
      HumanFoot.offset(body, side, "toe"),
      HumanFoot.offset(body, side, "mtp"),
    ),
  );
  const raised: (rise: number) => kneelKeys.IFoot = (
    rise: number,
  ): kneelKeys.IFoot => ({
    ...foot,
    at: {
      ...foot.at,
      y:
        foot.at.y +
        toe * Math.sin((Math.max(0, rise - extension) * Math.PI) / 180),
    },
    pitch: -rise,
    toes: Math.min(extension, rise),
  });
  // The ankle's dorsiflexion at a heel rise: the shank, from the ankle to
  // the knee, leaning forward over the foot's up axis.
  const flexion: (rise: number) => number = (rise: number): number => {
    const placed: kneelKeys.IFoot = raised(rise);
    const pose: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
      body,
      side,
      "mtp",
      placed.at,
      placed.heading,
      placed.pitch,
    );
    const reach: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(pose.ankle, hip);
    const d: number = Math.max(1e-9, AutoMovieEngineVector3.length(reach));
    const u: IAutoMovieVector3 = AutoMovieEngineVector3.scale(reach, 1 / d);
    const pole: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      forward,
      AutoMovieEngineVector3.scale(u, AutoMovieEngineVector3.dot(forward, u)),
    );
    const a: number = Math.min(
      m.thigh,
      (m.thigh * m.thigh - m.shank * m.shank + d * d) / (2 * d),
    );
    const knee: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      hip,
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.scale(u, a),
        AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.normalize(pole),
          Math.sqrt(Math.max(0, m.thigh * m.thigh - a * a)),
        ),
      ),
    );
    const shank: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(knee, pose.ankle);
    const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(pose.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const ahead: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(pose.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (
      (Math.atan2(AutoMovieEngineVector3.dot(shank, ahead), AutoMovieEngineVector3.dot(shank, up)) * 180) /
      Math.PI
    );
  };
  if (flexion(-foot.pitch) <= range) return foot;
  let lo: number = -foot.pitch;
  let hi: number = 90;
  for (let i: number = 0; i < HALVINGS; i++) {
    const mid: number = (lo + hi) / 2;
    if (flexion(mid) > range) lo = mid;
    else hi = mid;
  }
  return raised(hi);
}

/*
 * Halvings of the heel's rise, from a right angle to below a thousandth of a
 * degree.
 */
const HALVINGS: number = 17;
