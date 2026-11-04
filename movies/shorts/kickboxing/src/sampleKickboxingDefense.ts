import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";

import type { KickboxingMotion } from "./KickboxingMotion";

/**
 * Reusable guard, parry/catch preparation, own-side evasion, check and recoil.
 *
 * @evidence contracts/common.md#implementation-and-ownership Receiver side/direction, base posture and clip weight are caller parameters. Defense requests never inspect an attacker's identity or move its root. Hand-surface parry/catch endpoints are fitted later against the actual bound actors.
 * @evidence contracts/common.md#authoring-interface Clinical degrees and local metre requests remain candidates. Check unloads the named leg; recoil uses its separately post-impact clip, and recovery returns the supplied guard as weight reaches zero.
 */
export function sampleKickboxingDefense(
  base: IAutoMovieHumanPose,
  request: KickboxingMotion.Request,
  weight: number,
): KickboxingMotion.Body {
  const result: KickboxingMotion.Body = {
    pose: structuredClone(base),
    drop: 0,
    shift: [0, 0],
    pivot: 0,
  };
  if (weight <= 0) return result;
  const shaped: IAutoMovieHumanPose = structuredClone(base);
  const sign: number = request.defenseSide === "left" ? 1 : -1;
  if (request.defense === "slip" || request.defense === "weave") {
    shaped.spine = {
      thoracic: {
        ...base.spine?.thoracic,
        flexion: request.defense === "weave" ? 15 : 8,
        lateralFlexion: sign * 15,
        rotation: sign * -10,
      },
      lumbar: { flexion: 8, lateralFlexion: sign * 10 },
    };
    shaped.neck = { ...shaped.neck, cervical: { flexion: -5 } };
    result.drop = (request.defense === "weave" ? 0.13 : 0.045) * weight;
    result.shift[0] = -(request.defense === "weave" ? 0.07 : 0.025) * weight;
  }
  if (request.defense === "recoil") {
    shaped.spine = {
      thoracic: { flexion: 20, rotation: sign * -8 },
      lumbar: { flexion: 12 },
    };
    result.drop = 0.055 * weight;
    result.shift[0] = -0.035 * weight;
  }
  if (request.defense === "check") {
    result.freeLeg = request.defenseSide;
    result.shift = [-0.06 * weight, -sign * 0.13 * weight];
    shaped.legs ??= { left: {}, right: {} };
    shaped.legs[request.defenseSide] = {
      hip: { flexion: 95, abduction: 32, rotation: 30 },
      knee: { flexion: 112 },
      ankle: { dorsiflexion: 13 },
    };
  }
  if (request.defense === "elbow" || request.defense === "forearm") {
    shaped.arms ??= { left: {}, right: {} };
    shaped.arms[request.defenseSide] = {
      ...base.arms?.[request.defenseSide],
      shoulder: { flexion: 10, abduction: 4, rotation: -15 },
      elbow: { flexion: 108 },
      forearm: { pronation: 30 },
    };
  }
  if (request.defense === "cover") {
    shaped.arms ??= { left: {}, right: {} };
    for (const side of ["left", "right"] as const)
      shaped.arms[side] = {
        ...base.arms?.[side],
        shoulder: { flexion: 65, abduction: 4, rotation: -20 },
        elbow: { flexion: 140 },
        forearm: { pronation: 25 },
      };
  }
  result.pose = AutoMovieHumanRigControls.blend(base, shaped, weight);
  return result;
}
