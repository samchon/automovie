import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPoleVault,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkPoleFrame } from "../actions/walkPoleFrame";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanPostureRaw } from "../posture/HumanPostureRaw";
import type { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { poleVaultBend } from "./poleVaultBend";
import { poleVaultSwing } from "./poleVaultSwing";

/**
 * A vault's swing on its bending pole (`poleVault.plan`): Linthorne's flexible
 * pole (`poleVaultSwing`), the vaulter a point mass at the top hand's grip,
 * swung from the take-off's velocity on a pole as stiff as its rating, the
 * vaulter's own weight when none is given (NFHS Rule 7-5-3); the pole's
 * elastica on its hinged chain (`poleVaultBend`), bowed away from the vaulter;
 * and the body turned with the chord about the planted tip, its grip on the
 * shown chain's chord, the hands on the pole where the chain puts the held
 * link.
 *
 * @param prepared The vault's prepared values.
 * @returns The swing, the pole's bend and bow, and the swinging posture.
 */
export function poleVaultSwinging(
  prepared: poleVaultSwinging.IPrepared,
): poleVaultSwinging.ISwinging {
  const {
    body,
    p,
    held,
    pole,
    side,
    from,
    tipAt,
    gripAt,
    ahead,
    speed,
    takeoff,
    shoulders,
    readGrip,
  }: poleVaultSwinging.IPrepared = prepared;
  const reach0: IAutoMovieVector3 = Vector3.subtract(gripAt, tipAt);
  const radius0: poleVaultSwing.IPlane = {
    forward: Vector3.dot(reach0, ahead),
    up: reach0.y,
  };
  const swing: poleVaultSwing.ISwing = poleVaultSwing({
    radius: radius0,
    velocity: {
      forward: Vector3.dot(takeoff.velocity, ahead),
      up: takeoff.velocity.y,
    },
    mass: body.profile.mass,
    buckling: (p.rating ?? body.profile.mass) * poleVaultSwing.RATING,
    gravity: AutoMovieGravity.STANDARD,
    upright: 0,
    run: speed,
  });
  const bend: poleVaultBend.IBend = poleVaultBend(swing, held.affordances);
  const degrees: number = 180 / Math.PI;
  const chord0: number = Math.atan2(radius0.forward, radius0.up);
  // A direction in the vault's plane at an angle from upright toward the run.
  const towards: (angle: number) => IAutoMovieVector3 = (
    angle: number,
  ): IAutoMovieVector3 =>
    Vector3.add(Vector3.scale(ahead, Math.sin(angle)), {
      x: 0,
      y: Math.cos(angle),
      z: 0,
    });
  // A point turned about the planted tip in the vault's plane, toward the run.
  const about: (
    point: IAutoMovieVector3,
    angle: number,
  ) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
    angle: number,
  ): IAutoMovieVector3 => {
    const offset: IAutoMovieVector3 = Vector3.subtract(point, tipAt);
    const forth: number = Vector3.dot(offset, ahead);
    const aside: IAutoMovieVector3 = Vector3.subtract(
      offset,
      Vector3.add(Vector3.scale(ahead, forth), { x: 0, y: offset.y, z: 0 }),
    );
    return Vector3.add(
      Vector3.add(tipAt, aside),
      Vector3.add(
        Vector3.scale(
          ahead,
          forth * Math.cos(angle) + offset.y * Math.sin(angle),
        ),
        {
          x: 0,
          y: offset.y * Math.cos(angle) - forth * Math.sin(angle),
          z: 0,
        },
      ),
    );
  };
  // The pole bends away from the vaulter, toward the run's side of its
  // chord: its hinges turn the way that bows its `+Z` there, or the other
  // way when the hands hold it turned.
  const plantBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    readGrip(resolveHumanPosture(body, from));
  const bow: number =
    Vector3.dot(
      Quaternion.rotateVector(
        Quaternion.multiply(
          plantBones.get(side === "left" ? "leftHand" : "rightHand")!
            .worldRotation,
          held.frame.rotation,
        ),
        { x: 0, y: 0, z: 1 },
      ),
      towards(chord0 + Math.PI / 2),
    ) >= 0
      ? 1
      : -1;
  const turnFrom: ReturnType<typeof GymnasticsFlight.prepareTurned> =
    GymnasticsFlight.prepareTurned(from, tipAt);
  // The body turned with the chord about the planted tip, its grip on the
  // shown chain's chord, and the hands on the pole where the chain puts the
  // held link: the arms take that link's turn from the chord.
  const swinging: (t: number) => IAutoMovieMotionHumanPosture = (
    t: number,
  ): IAutoMovieMotionHumanPosture => {
    const at: poleVaultSwing.ISample = swing.at(t);
    const chord: number = Math.atan2(at.position.forward, at.position.up);
    const shown: poleVaultBend.IChain = bend.chain(t);
    const shift: IAutoMovieVector3 = Vector3.scale(
      towards(chord),
      shown.chord - swing.length,
    );
    const turned: IAutoMovieMotionHumanPosture = turnFrom(
      0,
      (chord - chord0) * degrees,
    );
    const base: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
      turned,
      Vector3.add(turned.root, shift),
    );
    return walkPoleFrame.write(
      base,
      walkPoleFrame.place(
        pole,
        Vector3.addScaled(tipAt, towards(chord), shown.chord),
        Vector3.scale(towards(chord + shown.top), -1),
        (hand: AutoMovieHumanSide): IAutoMovieVector3 =>
          Vector3.add(about(shoulders[hand]!, chord - chord0), shift),
      ),
      (hand: AutoMovieHumanSide): IAutoMovieVector3 =>
        AutoMovieMotionHumanBend.hang(body, base, hand),
    );
  };
  return { swing, bend, bow, swinging };
}

/** Companion types of {@link poleVaultSwinging}. */
export namespace poleVaultSwinging {
  /** What `poleVault.plan` prepared before its swing. */
  export interface IPrepared {
    /** The vaulter's body. */
    body: IAutoMovieMotionHumanBody;

    /** The vault's parameters. */
    p: IAutoMovieMotionHumanPoleVault.IParams;

    /** The pole as the top hand holds it. */
    held: IAutoMovieMotionHumanHeld.IHeld;

    /** The pole in the hands that hold it. */
    pole: walkPoleFrame.IPole;

    /** The top hand. */
    side: AutoMovieHumanSide;

    /** The plant's posture as solved. */
    from: IAutoMovieMotionHumanPosture;

    /** The planted end, world metres. */
    tipAt: IAutoMovieVector3;

    /** The top hand's grip at the plant, world metres. */
    gripAt: IAutoMovieVector3;

    /** The run's unit heading, world. */
    ahead: IAutoMovieVector3;

    /** The run's speed, m/s. */
    speed: number;

    /** The vault's take-off. */
    takeoff: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff;

    /** Each holding arm's shoulder at the take-off, world metres. */
    shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>;

    /** The reader of the top hand's grip bones. */
    readGrip: ReturnType<typeof poseBones.prepare>;
  }

  /** The swing, the pole's bend and bow, and the swinging posture. */
  export interface ISwinging {
    /** The point-mass swing on the flexible pole. */
    swing: poleVaultSwing.ISwing;

    /** The pole's elastica on its hinged chain. */
    bend: poleVaultBend.IBend;

    /** The way the pole's hinges turn, 1 or -1. */
    bow: number;

    /** The vaulter's posture at seconds since the take-off. */
    swinging: (t: number) => IAutoMovieMotionHumanPosture;
  }
}
