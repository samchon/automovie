import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { getUp } from "../floor/getUp";
import { lieDown } from "../floor/lieDown";

/**
 * The sumo bouts of the grapple law: both wrestlers crouch at the shikiri
 * lines with their fists down, charge at the tachiai into contact, and the
 * initiator either drives the receiver back out of the ring with palms on
 * the chest (oshi-dashi) or hands on the belt (yori-kiri), or throws him
 * with an overarm belt grip (uwate-nage) onto the clay.
 *
 * The staging is from the shikiri lines: the lines lie 70 cm apart and the
 * ring is 4.55 m across (the Japan Sumo Association's introduction and the
 * dohyō's description, from a search), each wrestler's root a foot's
 * length behind his line. The drive steps the pair back through `DRIVE`,
 * enough to carry the receiver's back foot past the straw from the centre.
 * The belt grip holds the mawashi where it wraps the hips (the partner's
 * hip regions). The crouch, charge and drive shares and depths are
 * provisional staging values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three bouts, the staged geometry and its sources, the belt's regions and what is provisional.
 * @evidence contracts/development/design.md#principled-representation One support schedule per role over shikiri, tachiai, drive and finish keys, the scene kind choosing the grip and finish.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grapple law reads the kinds, durations, regions, grip window and keys.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The floor fit stays the support law's; the push-out is authored, never decided by force.
 */
export namespace grappleSumo {
  /** The sumo scenes. */
  export type Kind = Extract<
    IAutoMovieMotionHumanGrapple.Kind,
    "oshiDashi" | "yoriKiri" | "uwateNage"
  >;

  /** A role's parameters in a sumo scene. */
  export interface IParams extends IAutoMovieMotionHumanGrapple.IParams {
    /** The sumo scene. */
    kind: Kind;
  }

  /** The grapple law's grip window as shares of the scene. */
  export interface IWindow {
    /** When the hands leave the clay. */
    reach: number;

    /** The tachiai: when the hands meet the partner. */
    take: number;

    /** When the hands let go. */
    release: number;

    /** When the hands are back at the sides. */
    rest: number;
  }

  /** The shikiri lines' separation, metres. */
  export const LINES: number = 0.7;

  /** The ring's diameter, metres. */
  export const RING: number = 4.55;

  /** How far the drive carries the pair, metres: past the ring's radius. */
  export const DRIVE: number = 2.1;

  /** One drive step, metres. */
  export const STEP: number = 0.35;

  /** Each scene's default length, seconds (provisional). */
  const SECONDS: Readonly<Record<Kind, number>> = {
    oshiDashi: 4.5,
    yoriKiri: 5,
    uwateNage: 4,
  };

  /** The two roots' gap at contact as a share of stature: arms' length for a push, chest to chest for a belt grip. */
  const CLOSE: Readonly<Record<Kind, number>> = {
    oshiDashi: 0.3,
    yoriKiri: 0.22,
    uwateNage: 0.22,
  };

  /** The shares at which the shikiri, tachiai and drive end. */
  const SHIKIRI: number = 0.22;

  /** The tachiai's share. */
  const TACHIAI: number = 0.32;

  /** The share at which the drive or throw ends. */
  const FINISH: number = 0.82;

  /**
   * Whether a grapple kind is a sumo bout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the narrowed kinds.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One membership test.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work None.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function is(kind: IAutoMovieMotionHumanGrapple.Kind): kind is Kind {
    return kind === "oshiDashi" || kind === "yoriKiri" || kind === "uwateNage";
  }

  /**
   * A scene's default length, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A lookup.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A lookup.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work None.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function seconds(kind: Kind): number {
    return SECONDS[kind];
  }

  /**
   * The partner's regions each of the initiator's hands takes: the chest
   * for a push, the belt at the hips for a belt grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each grip's regions.
   * @evidence contracts/development/implementation.md#principled-implementation The partner faces the initiator, so the left hand meets the partner's right side.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work None.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function regions(
    kind: Kind,
  ): Readonly<Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>>> {
    return kind === "oshiDashi"
      ? { left: "chestRight", right: "chestLeft" }
      : { left: "hipRight", right: "hipLeft" };
  }

  /**
   * The grip window: the hands leave the clay after the shikiri, meet the
   * partner at the tachiai and let go as the drive or throw ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each share.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Constant shares.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work None.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function window(): IWindow {
    return {
      reach: SHIKIRI,
      take: TACHIAI,
      release: FINISH - 0.04,
      rest: 0.92,
    };
  }

  /**
   * One role's support keys: the shikiri crouch on both feet and fists, the
   * tachiai's step into contact, the drive's alternating steps or the
   * throw's fall, and the finish.
   *
   * @param p The scene.
   * @param duration The scene's seconds.
   * @param stature The performer's stature, metres.
   * @returns The timed support keys.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the keys in order.
   * @evidence contracts/development/implementation.md#principled-implementation Foot and fist targets in the performer's own frame; the receiver's drive mirrors the initiator's, both stepping the same distance on the same keys.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shikiri, tachiai, then the drive or the throw, then the finish.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step count follows the drive's length; the floor fit stays the support law's.
   * @evidence contracts/development/implementation.md#efficient-algorithms A key per drive step, independent of the playback rate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the floor poses of lieDown and getUp.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh keys.
   */
  export function keys(
    p: grappleSumo.IParams,
    duration: number,
    stature: number,
  ): readonly IAutoMovieMotionHumanSupport.IStance[] {
    const receiver: boolean = p.role === "receiver";
    const complete: boolean = p.outcome !== "denied";
    const foot: number = 0.15 * stature;
    const width: number = 0.14 * stature;
    // The charge closes the gap from the lines to contact, half each.
    const start: number = LINES + 2 * foot;
    const charge: number = Math.max(0, (start - CLOSE[p.kind] * stature) / 2);
    const at = (
      side: AutoMovieHumanSide,
      z: number,
      step: boolean = true,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: side === "left" ? "leftFoot" : "rightFoot",
      kind: "bear",
      ...(step
        ? {
            step: true,
            target: {
              kind: "point",
              at: { x: side === "left" ? width : -width, y: 0, z },
              frame: "performer",
            },
          }
        : {}),
    });
    const fists: readonly IAutoMovieMotionHumanSupport.IContact[] = (
      ["left", "right"] as const
    ).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanSupport.IContact => ({
        part: side === "left" ? "leftHand" : "rightHand",
        kind: "bear",
        target: {
          kind: "point",
          at: {
            x: side === "left" ? 0.5 * width : -0.5 * width,
            y: 0,
            z: foot,
          },
          frame: "performer",
        },
      }),
    );
    const keys: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        event: "shikiri",
        contacts: [at("left", 0, false), at("right", 0, false), ...fists],
        prefer: CROUCH,
      },
      {
        event: "tachiai",
        contacts: [at("left", charge), at("right", charge, false)],
        prefer: CHARGE,
      },
    ];
    const shares: number[] = [SHIKIRI, TACHIAI];

    if (p.kind === "uwateNage" && complete) {
      keys.push(
        receiver
          ? {
              event: "matTransfer",
              contacts: [{ part: "seat", kind: "bear" }],
              prefer: lieDown.POSES.sit,
              turn: 60,
            }
          : {
              event: "transfer",
              contacts: [at("right", charge), at("left", charge, false)],
              prefer: CHARGE,
              turn: -60,
            },
        receiver
          ? {
              event: "thrown",
              contacts: [{ part: "back", kind: "bear" }],
              prefer: lieDown.POSES.supine,
              turn: 90,
            }
          : {
              event: "thrown",
              contacts: [at("left", charge, false), at("right", charge, false)],
              prefer: CHARGE,
              turn: -60,
            },
      );
      shares.push(0.6, FINISH);
    } else {
      // The drive: alternate steps, the receiver back, the initiator after.
      const count: number = complete ? Math.ceil(DRIVE / STEP) : 1;
      const travel: number = complete ? DRIVE : 0;
      for (let k: number = 1; k <= count; ++k) {
        const z: number = charge + ((receiver ? -1 : 1) * (travel * k)) / count;
        const side: AutoMovieHumanSide =
          (k % 2 === 1) === receiver ? "right" : "left";
        keys.push({
          event: k === count ? (complete ? "pushedOut" : "held") : `drive.${k}`,
          contacts: [
            at(side, z),
            at(side === "left" ? "right" : "left", z, false),
          ],
          prefer: CHARGE,
        });
        shares.push(TACHIAI + ((FINISH - TACHIAI) * k) / count);
      }
    }
    const thrown: boolean = p.kind === "uwateNage" && complete && receiver;
    keys.push(
      thrown
        ? {
            event: "recoveredOnMat",
            contacts: [{ part: "back", kind: "bear" }],
            prefer: lieDown.POSES.supine,
            turn: 90,
          }
        : {
            event: "recovered",
            contacts: [
              { part: "leftFoot", kind: "bear" },
              { part: "rightFoot", kind: "bear" },
            ],
            prefer: getUp.POSES.stood,
          },
    );
    shares.push(1);
    return keys.map(
      (
        key: IAutoMovieMotionHumanSupport.IStance,
        index: number,
      ): IAutoMovieMotionHumanSupport.IStance => ({
        ...key,
        seconds: duration * (shares[index]! - (shares[index - 1] ?? 0)),
      }),
    );
  }

  /** The shikiri crouch: hips low and wide, the trunk forward over the fists. */
  const CROUCH: IAutoMovieMotionHumanLieDown.IPose = {
    pitch: 50,
    roll: 0,
    joints: {
      leftUpperLeg: [100, 25, 0],
      rightUpperLeg: [100, 25, 0],
      leftLowerLeg: [115, 0, 0],
      rightLowerLeg: [115, 0, 0],
      leftUpperArm: [35, 8, 0],
      rightUpperArm: [35, 8, 0],
      leftLowerArm: [10, 0, 0],
      rightLowerArm: [10, 0, 0],
    },
  };

  /** The charge and drive: low hips, the trunk driving forward. */
  const CHARGE: IAutoMovieMotionHumanLieDown.IPose = {
    pitch: 35,
    roll: 0,
    joints: {
      leftUpperLeg: [55, 15, 0],
      rightUpperLeg: [55, 15, 0],
      leftLowerLeg: [60, 0, 0],
      rightLowerLeg: [60, 0, 0],
    },
  };
}
