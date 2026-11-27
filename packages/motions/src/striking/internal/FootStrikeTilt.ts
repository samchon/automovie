import { DEFAULT_HUMANOID_ROM, Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import type { CloseStrikeLegs } from "./CloseStrikeLegs";
import { FootStrikeForms } from "./FootStrikeForms";
import { KickForm } from "./KickForm";

/*
 * Read the tilt a leg from a hip to an ankle needs.
 * Parameter side: The kicking side.
 * Parameter yaw: The pelvis's heading at the contact, degrees.
 * Parameter hip: The kicking hip at the contact, world metres.
 * Parameter ankle: The ankle's contact place, world metres.
 * Parameter thigh: The thigh's length, metres: with the shank's, the knee's bend at
 * the contact raises the thigh above the hip-to-ankle line (`over`), which
 * the hip must lift.
 * Parameter shank: The shank's length, metres.
 * Returns: The tilt about a world axis through the support hip, or none when
 * the hip's range reaches the leg.
 */
export function FootStrikeTilt(
  side: AutoMovieHumanSide,
  yaw: number,
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  thigh: number,
  shank: number,
): CloseStrikeLegs.ITilt | undefined {
  const excess: IExcess | undefined = over(side, yaw, hip, ankle, thigh, shank);
  if (excess === undefined || !(excess.degrees > 0)) return undefined;

  // A positive turn about the horizontal axis across the leg carries the
  // body's up away from the leg.
  return {
    axis: Vector3.normalize(Vector3.cross(excess.across, FootStrikeForms.UP)),
    degrees: Math.min(KickForm.LEAN_MOST, excess.degrees),
  };
}

/*
 * How far a foot strike tilts the body away from its leg so the hip can lift
 * the leg to the contact.
 *
 * The hip's reach at an azimuth about the pelvis is read as the ellipse of its
 * range table (`DEFAULT_HUMANOID_ROM`): flexion `F` forward, abduction `A` to
 * the side, `1 / r² = cos²ψ / F² + sin²ψ / A²`, against the thigh's elevation:
 * the hip-to-ankle line's, raised by the knee's bend over that line's length
 * (the law of cosines). The abduction ceiling is the one the flexion the leg
 * asks admits (`abductionRange`: 45° straight to 60° flexed 90°, AAOS 1965). A
 * leg at elevation `ε` from straight down past the comfortable share of that
 * reach, `KickForm.RANGE_SHARE · r(ψ)`, tilts the whole body away from it about
 * the support hip by the excess, at most `KickForm.LEAN_MOST`, so the leg ends
 * inside the range rather than on its edge; a kicker's pelvis tilts 6° to 17°
 * at its peak from a body-level to a face-level roundhouse kick (Kim, Kim, Lee,
 * Han and Kwon 2010), and the trunk leans past it.
 */
export namespace FootStrikeTilt {
  /*
   * How far a leg's line passes the hip's range, and its level direction.
   */
  export interface IExcess {
    /*
     * The elevation beyond the range's share, degrees; negative within it.
     */
    degrees: number;

    /*
     * The leg line's elevation from straight down, degrees.
     */
    elevation: number;

    /*
     * The leg's level unit direction.
     */
    across: IAutoMovieVector3;
  }

  /*
   * How far a kicking leg, reaching from the hip to an ankle, rises past the
   * hip's range: the leg line's elevation plus the thigh's rise above it for a
   * bent knee, against the share of the elliptical reach between the hip's
   * flexion and its abduction at that azimuth (`DEFAULT_HUMANOID_ROM`).
   * Parameter side: The kicking side.
   * Parameter yaw: The kicker's heading, degrees.
   * Parameter hip: The hip, world metres.
   * Parameter ankle: The ankle, world metres.
   * Parameter thigh: The thigh, metres.
   * Parameter shank: The shank, metres.
   * Parameter share: The share of the range allowed.
   * Returns: The excess, or `undefined` for a leg straight up or down.
   */
  export function excess(
    side: AutoMovieHumanSide,
    yaw: number,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    thigh: number,
    shank: number,
    share?: number,
  ): IExcess | undefined {
    return over(side, yaw, hip, ankle, thigh, shank, share);
  }

  /*
   * A chamber's ankle place brought inside the hip's range: the ankle a chamber
   * folds to sits off its hip at an elevation whose thigh, raised above the
   * hip-to-ankle line by the folded knee, may ask the hip past the comfortable
   * share of its reach (`over`), more than the body's tilt at the chamber
   * relieves; it is then turned down about the hip, on the horizontal axis
   * across the leg, by that remaining excess, its distance from the hip and so
   * the knee's fold kept, so the chamber holds the knee where the hip can lift
   * it and the extension opens the knee from there.
   * Parameter side: The kicking side.
   * Parameter yaw: The pelvis's heading, degrees.
   * Parameter hip: The kicking hip, world metres.
   * Parameter folded: The chamber's ankle place, world metres.
   * Parameter thigh: The thigh's length, metres.
   * Parameter shank: The shank's length, metres.
   * Parameter tilted: How far the body is tilted away from the leg at the chamber,
   * degrees.
   * Parameter share: The share of the hip's reach the thigh is kept within: the
   * kick's comfortable share (`KickForm.RANGE_SHARE`) for a chamber, the
   * whole range for a goal on the way.
   * Returns: The ankle place, the one given when the hip reaches it.
   */
  export function chambered(
    side: AutoMovieHumanSide,
    yaw: number,
    hip: IAutoMovieVector3,
    folded: IAutoMovieVector3,
    thigh: number,
    shank: number,
    tilted: number,
    share: number = KickForm.RANGE_SHARE,
  ): IAutoMovieVector3 {
    const excess: IExcess | undefined = over(
      side,
      yaw,
      hip,
      folded,
      thigh,
      shank,
      share,
    );
    if (excess === undefined) return folded;
    const turn: number = Math.min(excess.elevation, excess.degrees - tilted);
    if (!(turn > 0)) return folded;
    return Vector3.add(
      hip,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle(
          Vector3.normalize(Vector3.cross(FootStrikeForms.UP, excess.across)),
          turn,
        ),
        Vector3.subtract(folded, hip),
      ),
    );
  }

  /*
   * The shank's direction of a leg from a hip to an ankle whose knee bends
   * toward a hint: the knee on the circle the thigh's and the shank's lengths
   * leave about the hip-to-ankle line (the law of cosines), in the plane of the
   * line and the hint; the line itself where the leg is straight or the hint
   * lies on the line.
   * Parameter hip: The hip, world metres.
   * Parameter ankle: The ankle, world metres.
   * Parameter hint: The knee's hint, world metres.
   * Parameter thigh: The thigh's length, metres.
   * Parameter length: The shank's length, metres.
   * Returns: The unit direction from the knee to the ankle.
   */
  export function shank(
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    hint: IAutoMovieVector3,
    thigh: number,
    length: number,
  ): IAutoMovieVector3 {
    const chord: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Vector3.length(chord);
    const u: IAutoMovieVector3 = Vector3.normalize(chord);
    if (!(d < thigh + length) || d <= 1e-9) return u;
    const off: IAutoMovieVector3 = Vector3.subtract(hint, hip);
    const across: IAutoMovieVector3 = Vector3.subtract(
      off,
      Vector3.scale(u, Vector3.dot(off, u)),
    );
    if (Vector3.length(across) < 1e-9) return u;
    const w: IAutoMovieVector3 = Vector3.normalize(across);
    const alpha: number = Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          (thigh * thigh + d * d - length * length) / (2 * thigh * d),
        ),
      ),
    );
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(u, thigh * Math.cos(alpha)),
        Vector3.scale(w, thigh * Math.sin(alpha)),
      ),
    );
    return Vector3.normalize(Vector3.subtract(ankle, knee));
  }

  /*
   * The knee's hint for a leg from a hip to an ankle, its turn about the leg
   * kept inside the hip's twist range.
   *
   * The thigh carried from straight down to the leg by the shortest swing
   * carries the pelvis's forward to the knee's untwisted direction; the asked
   * hint's direction about the leg is its twist from that. A twist past the
   * comfortable share of the hip's twist range (`KickForm.RANGE_SHARE`) is
   * turned back to it, the hint kept at its distance from the leg's middle.
   * Parameter side: The kicking side.
   * Parameter pelvis: The pelvis's world rotation at the contact.
   * Parameter hip: The kicking hip, world metres.
   * Parameter ankle: The ankle's contact place, world metres.
   * Parameter asked: The law's knee hint, world metres.
   * Returns: The hint, the asked one when its twist is within the range.
   */
  export function knee(
    side: AutoMovieHumanSide,
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    asked: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const twist: IAutoMovieAngleRange | null | undefined =
      DEFAULT_HUMANOID_ROM[`${side}UpperLeg`]?.twist;
    if (twist === null || twist === undefined) return asked;
    const leg: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankle, hip),
    );
    const middle: IAutoMovieVector3 = Vector3.lerp(hip, ankle, 0.5);
    const across = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(leg, Vector3.dot(v, leg)));
    const offset: IAutoMovieVector3 = across(Vector3.subtract(asked, middle));
    if (Vector3.length(offset) < 1e-9) return asked;
    const down: IAutoMovieVector3 = Quaternion.rotateVector(pelvis, {
      x: 0,
      y: -1,
      z: 0,
    });
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(pelvis, {
      x: 0,
      y: 0,
      z: 1,
    });
    const axis: IAutoMovieVector3 = Vector3.cross(down, leg);
    const swing: IAutoMovieQuaternion =
      Vector3.length(axis) < 1e-9
        ? Quaternion.identity()
        : Quaternion.fromAxisAngle(
            axis,
            (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(down, leg)))) *
              180) /
              Math.PI,
          );
    const rest: IAutoMovieVector3 = across(
      Quaternion.rotateVector(swing, forward),
    );
    if (Vector3.length(rest) < 1e-9) return asked;
    const from: IAutoMovieVector3 = Vector3.normalize(rest);
    const to: IAutoMovieVector3 = Vector3.normalize(offset);
    const turned: number =
      (Math.atan2(
        Vector3.dot(Vector3.cross(from, to), leg),
        Vector3.dot(from, to),
      ) *
        180) /
      Math.PI;
    const limit: number =
      KickForm.RANGE_SHARE * Math.min(Math.abs(twist.min), Math.abs(twist.max));
    if (Math.abs(turned) <= limit) return asked;
    return Vector3.add(
      middle,
      Vector3.scale(
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(leg, Math.sign(turned) * limit),
          from,
        ),
        Vector3.length(offset),
      ),
    );
  }
}

/*
 * The thigh's excess over the comfortable share of the hip's range for a leg
 * from a hip to an ankle: the hip-to-ankle line's elevation from straight down
 * plus the thigh's rise above that line, which the knee's bend over the line's
 * length gives by the law of cosines (the knee bends up toward its hint),
 * against `KickForm.RANGE_SHARE` of the range ellipse's reach at the leg's
 * azimuth.
 */
function over(
  side: AutoMovieHumanSide,
  yaw: number,
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  thigh: number,
  shank: number,
  share: number = KickForm.RANGE_SHARE,
): IExcess | undefined {
  const constraint: IAutoMovieJointConstraint | undefined =
    DEFAULT_HUMANOID_ROM[`${side}UpperLeg`];
  if (
    constraint === undefined ||
    constraint.flexion === null ||
    constraint.abduction === null
  )
    throw new Error(
      `The range-of-motion table gives ${side}UpperLeg no flexion or abduction`,
    );
  const chord: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
  const d: number = Vector3.length(chord);
  const leg: IAutoMovieVector3 = Vector3.normalize(chord);
  const flat: IAutoMovieVector3 = { x: leg.x, y: 0, z: leg.z };
  if (Vector3.length(flat) < 1e-9) return undefined;
  const across: IAutoMovieVector3 = Vector3.normalize(flat);
  const line: number =
    (Math.acos(Math.max(-1, Math.min(1, -leg.y))) * 180) / Math.PI;
  // The thigh's rise above the hip-to-ankle line at this chord's length.
  const rise: number =
    d >= thigh + shank || d <= 1e-9
      ? 0
      : (Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              (thigh * thigh + d * d - shank * shank) / (2 * thigh * d),
            ),
          ),
        ) *
          180) /
        Math.PI;
  const elevation: number = line + rise;

  // The leg's azimuth about the pelvis's heading, positive outward.
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: 0, y: 0, z: 1 },
  );
  const left: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(FootStrikeForms.UP, forward),
  );
  const outward: IAutoMovieVector3 = Vector3.scale(
    left,
    side === "left" ? 1 : -1,
  );
  const azimuth: number = Math.atan2(
    Vector3.dot(across, outward),
    Vector3.dot(across, forward),
  );

  // The range ellipse's reach at that azimuth, its abduction ceiling the
  // one the leg's flexion admits.
  const F: number = constraint.flexion.max;
  const flexed: IAutoMovieAngleRange | null = AutoMovieEngineKinematics.abductionRange(
    constraint,
    Math.max(0, elevation * Math.cos(azimuth)),
  );
  const A: number = azimuth >= 0 ? flexed!.max : -constraint.abduction.min;
  const reach: number =
    1 /
    Math.sqrt(
      Math.cos(azimuth) ** 2 / (F * F) + Math.sin(azimuth) ** 2 / (A * A),
    );
  // The leg is brought inside the range by the share a kick treats as its
  // comfortable range (`KickForm.RANGE_SHARE`), not onto its edge, where
  // the fit pins the hip and the knee cannot open into the contact.
  return {
    degrees: elevation - share * reach,
    elevation: line,
    across,
  };
}

/*
 * How far a leg's thigh lies past the comfortable share of the hip's reach at
 * its azimuth, and the leg's horizontal direction and chord elevation.
 */
interface IExcess {
  /*
   * Degrees past the comfortable reach; negative inside it.
   */
  degrees: number;
  /*
   * The hip-to-ankle line's elevation from straight down, degrees.
   */
  elevation: number;
  /*
   * The leg's horizontal direction, a unit vector.
   */
  across: IAutoMovieVector3;
}
