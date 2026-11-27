import { AutoMovieEngineKinematics, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanGuard, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanStrikingStance, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { StrikingBody } from "./StrikingBody";
import { StrikingGuardBones } from "./StrikingGuardBones";
import { StrikingStance } from "./StrikingStance";

/**
 * Place the fighting guard's two glove goals on the current trunk: both at
 * their ear's height the same short distance ahead of their jaw, the rear glove
 * outside its ear and the lead glove before its own shoulder (`StrikingStance`
 * gives the sources).
 *
 * @param body The unchanged canonical body.
 * @param posture The current base carrying the guard.
 * @param stance The leading side.
 * @param drop Each glove's downward displacement, metres.
 * @param posed Optional trunk frames already read from this exact body/posture.
 * @param resolution Optional exact FK reader borrowed only by this synchronous
 *   evaluation.
 * @param style The authored sporting guard. When absent, use the original open
 *   guard.
 * @param leadBlend From the named lead (zero) to the other lead (one).
 * @returns The two actual world-metre glove goals.
 */
export function StrikingGuard(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">,
  drop: Partial<Record<AutoMovieHumanSide, number>>,
  posed?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  style?: IAutoMovieMotionHumanGuard.Style,
  leadBlend: number = 0,
): Pick<IAutoMovieMotionHumanPosture["limbs"], StrikingGuardResult> {
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    posed ??
    StrikingBody.trunk(body, posture, resolution, StrikingGuardBones(body));
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const faceFrame: IAutoMovieHumanoidSurfaces.IFrame = StrikingBody.frame(
    body,
    "face",
  );
  const forward: IAutoMovieVector3 = horizontal(
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaceNormal(
      faceFrame,
      bones.get(faceFrame.bone)!,
    ),
  );
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const out: Pick<IAutoMovieMotionHumanPosture["limbs"], StrikingGuardOut> = {};
  for (const side of ["left", "right"] as const) {
    const lead: boolean = side === stance.lead;
    const jaw: ReturnType<typeof StrikingBody.region> = StrikingBody.region(
      body,
      bones,
      side === "left" ? "jawLeft" : "jawRight",
    );
    const outward: IAutoMovieVector3 = horizontal(jaw.normal);
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;

    // The guard of a striker who faces kicks as well as punches: the rear
    // hand "as if holding a phone to your ear and then pushed forward just in
    // front of your face", the front hand "at the same height" before its
    // own shoulder (the boxing and MMA guard; the Muay Thai guard's arms
    // "projected out further" with "nearly vertical forearms"). Both fists
    // stand at their ear's height, the same short distance ahead of their
    // jaw: the rear one a fist's half width outside its ear, the lead one
    // before its own shoulder joint. The resting arms do not close the ribs:
    // a body kick is answered by dropping the elbow to the raised knee, an
    // action (`defend`), not a posture.
    //
    // Each place answers a measured line of the staged scenes on the average
    // man (two equal guards, 0.99 m apart for a punch, 0.83 m for a kick):
    // - a jab runs down the line at the face's height, so each glove stands
    //   0.06 m or more beside it (0.12 m here);
    // - a rear straight runs from the rear glove to the face and passes the
    //   other's lead glove where the line is 0.11 m from the head's centre
    //   line: a lead glove a fist's half width outside its ear stood 0.029 m
    //   from that line and stopped the fist; before its shoulder it stands
    //   0.06 m outside it;
    // - a round kick's shin arrives at the flank between 1.09 and 1.25 m, so
    //   the elbows hang above it only under ear-high fists: under chin-high
    //   ones they stood at 1.14 to 1.17 m and stopped every staged kick;
    // - neither glove is carried beyond `near`, or the two guards stand
    //   inside each other at the kick's range.
    const ear: IAutoMovieVector3 = StrikingBody.region(
      body,
      bones,
      side === "left" ? "earLeft" : "earRight",
    ).point;
    const sag: IAutoMovieVector3 = StrikingGuard.fist({
      jaw: jaw.point,
      outward,
      ear,
      shoulder,
      forward,
      forearmRadius: m.forearmRadius,
      forearm: m.forearm,
      leading: lead ? 1 - leadBlend : leadBlend,
      boxing: style === "boxing",
      drop: drop[side] ?? 0,
    });
    const bend: IAutoMovieVector3 = Vector3.add(
      shoulder,
      Vector3.add(
        Vector3.scale(up, -0.8 * m.upperArm),
        Vector3.scale(forward, 0.5 * m.upperArm),
      ),
    );
    out[side === "left" ? "leftArm" : "rightArm"] = StrikingStance.glove(
      body,
      side,
      sag,
      bend,
    );
  }
  return out;
}

/** Where a striking guard holds its fists. */
export namespace StrikingGuard {
  /** What a fist's place in the guard is read from. */
  export interface IFist {
    /** The jaw's point on this side, world metres. */
    jaw: IAutoMovieVector3;

    /** The jaw's horizontal outward, unit. */
    outward: IAutoMovieVector3;

    /** The ear's point on this side, world metres. */
    ear: IAutoMovieVector3;

    /** The shoulder, world metres. */
    shoulder: IAutoMovieVector3;

    /** The face's horizontal forward, unit. */
    forward: IAutoMovieVector3;

    /** The forearm's radius, metres. */
    forearmRadius: number;

    /** The forearm, metres. */
    forearm: number;

    /** How far this is the leading hand, 0 (rear) to 1 (lead). */
    leading: number;

    /** Whether the guard is a boxing guard. */
    boxing: boolean;

    /** How far the fist drops, metres. */
    drop: number;
  }

  /**
   * A guarding fist: a forearm's girth and a quarter forearm ahead of the jaw;
   * a rear hand at ear height a forearm radius outside the ear, a lead hand in
   * front of the shoulder, blended between; a boxing guard between jaw and ear
   * height, half a radius nearer, hugging the ear more the more it leads; then
   * dropped.
   *
   * @param at The face, the shoulder, the arm and the guard.
   * @returns The fist, world metres.
   */
  export function fist(at: IFist): IAutoMovieVector3 {
    const near: number = 2 * at.forearmRadius + 0.25 * at.forearm;
    const outsideEar: number =
      at.boxing || at.leading < 1
        ? Math.max(0, Vector3.dot(Vector3.subtract(at.ear, at.jaw), at.outward))
        : 0;
    const inFrontOfShoulder: number =
      !at.boxing && at.leading > 0
        ? Vector3.dot(Vector3.subtract(at.shoulder, at.jaw), at.outward)
        : 0;
    const beside: number = at.boxing
      ? outsideEar + at.forearmRadius * (0.5 - at.leading)
      : inFrontOfShoulder * at.leading +
        (outsideEar + at.forearmRadius) * (1 - at.leading);
    const fistAt: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        {
          ...at.jaw,
          y: at.boxing ? 0.5 * (at.ear.y + at.jaw.y) : at.ear.y,
        },
        Vector3.scale(at.outward, beside),
      ),
      Vector3.scale(
        at.forward,
        at.boxing ? near - 0.5 * at.forearmRadius : near,
      ),
    );
    return { ...fistAt, y: fistAt.y - at.drop };
  }
}

/**
 * The existing horizontal-normal convention, with +Z when horizontal length is
 * at most 1e-9.
 */
function horizontal(v: IAutoMovieVector3): IAutoMovieVector3 {
  const h: IAutoMovieVector3 = { x: v.x, y: 0, z: v.z };
  return Vector3.length(h) > 1e-9 ? Vector3.normalize(h) : { x: 0, y: 0, z: 1 };
}

/** The alternatives of `StrikingGuardOut`'s site. */
type StrikingGuardOut = "leftArm" | "rightArm";
/** The alternatives of `StrikingGuardResult`'s site. */
type StrikingGuardResult = "leftArm" | "rightArm";
