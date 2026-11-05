import type { IAutoMovieHumanPose } from "@automovie/human";

import type { BodyRig } from "../rig/BodyRig";
import type { Foot } from "../rig/Foot";
import { Vec3 } from "../rig/Vec3";
import type { BoutScript } from "./BoutScript";

/**
 * One performer's authored body for a single frame, before limb goals are solved.
 *
 * Trunk, neck and girdle channels are additive fields so stance, attacks and
 * reactions can each add their share. Evasive displacement (slips and weaves)
 * is kept apart in `evade`, so an attacker can aim at where the head was
 * rather than where the slip moved it.
 *
 * @evidence contracts/common.md#implementation-and-ownership A plain mutable record owned by one frame evaluation; `request` converts it into the root placement and clinical pose BodyRig consumes. Hands and feet carry intents that the bout resolver turns into world goals.
 * @evidence contracts/common.md#authoring-interface Angles in degrees except heading/turn (radians); distances in metres; `shift` is [forward, left] in the heading frame.
 */
export namespace FighterBody {
  /**
   * Anatomical side.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed anatomical side shared by intents.
   * @evidence contracts/common.md#authoring-interface The performer's own left or right.
   */
  export type Side = "left" | "right";

  /**
   * Hand intent, resolved into a world glove goal by the bout.
   *
   * @evidence contracts/common.md#implementation-and-ownership Discriminated intents resolved into glove goals by Resolve; `pose` keeps the authored arm channels.
   * @evidence contracts/common.md#authoring-interface Points are world metres; amounts are blend weights in [0, 1] from the guard.
   */
  export type Hand =
    | { kind: "guard"; tight: number; reach?: number }
    | { kind: "catch"; side: Side; amount: number; low: number }
    | { kind: "attack"; action: BoutScript.Action; extension: number }
    | { kind: "parry"; action: BoutScript.Action; amount: number }
    | { kind: "swing"; amount: number }
    | { kind: "blend"; from: Hand; to: Hand; weight: number }
    | {
        kind: "point";
        point: Vec3.Value;
        elbow?: Vec3.Value;
        weight?: number;
        amount?: number;
      }
    | { kind: "pose" };

  /**
   * Foot intent, resolved into ankle goals by the bout.
   *
   * @evidence contracts/common.md#implementation-and-ownership Discriminated intents resolved into ankle and knee goals by Resolve; reserved legs carry the placements they leave and land on.
   * @evidence contracts/common.md#authoring-interface Placements are Foot.Placement; points are world metres.
   */
  export type Leg =
    | { kind: "place"; placement: Foot.Placement }
    | {
        kind: "kick";
        action: BoutScript.Action;
        from: Foot.Placement;
        to: Foot.Placement;
      }
    | {
        kind: "check";
        from: Foot.Placement;
        to: Foot.Placement;
        amount: number;
        progress: number;
      }
    | { kind: "point"; ankle: Vec3.Value; knee?: Vec3.Value }
    | { kind: "pose" };

  /**
   * Additive body fields for one frame.
   *
   * @evidence contracts/common.md#implementation-and-ownership Mutable per-frame record owned by one evaluation; contributions add into its fields.
   * @evidence contracts/common.md#authoring-interface Degrees for joints, radians for heading and turn, metres for drop, shift and lift.
   */
  export interface Frame {
    /** Film second this frame describes. */ time: number;
    /** Stance origin, world X/Z metres. */ origin: [number, number];
    /** Stance heading, radians. */ heading: number;
    /** Body yaw relative to the heading, radians (orthodox guard ≈ 0.55). */ turn: number;
    /** Lowering of the body origin, metres. */ drop: number;
    /** Body origin offset [forward, left] in the heading frame, metres. */ shift: [
      number,
      number,
    ];
    /** Pelvis tilt/obliquity/rotation, degrees. */ pelvis: {
      tilt: number;
      obliquity: number;
      rotation: number;
    };
    /** Thoracic flexion/lateral/rotation, degrees. */ thoracic: {
      flexion: number;
      lateral: number;
      rotation: number;
    };
    /** Lumbar flexion/lateral, degrees. */ lumbar: {
      flexion: number;
      lateral: number;
    };
    /** Cervical flexion/lateral/rotation, degrees. */ cervical: {
      flexion: number;
      lateral: number;
      rotation: number;
    };
    /** Head nod and turn on the atlas, degrees. */ atlas: {
      flexion: number;
      rotation: number;
    };
    /** Jaw opening, millimetres. */ jaw: number;
    /** Pain wince in [0, 1]: eyes squeezed shut and brows lowered. */ wince: number;
    /** Shoulder girdle protraction/elevation per side, degrees. */ girdle: Record<
      Side,
      { protraction: number; elevation: number }
    >;
    /** Evasive components: lateral lean (deg, + left), forward duck (deg), extra drop (m), lateral shift (m, + left). */
    evade: { lateral: number; flexion: number; drop: number; shift: number };
    /** Extra whole-body rotation after the yaw (knockdown), quaternion. */ roll: readonly [
      number,
      number,
      number,
      number,
    ];
    /** Extra world offset of the body origin (knockdown), metres. */ lift: Vec3.Value;
    /** Hand intents. */ hands: Record<Side, Hand>;
    /** Foot intents. */ legs: Record<Side, Leg>;
    /** Authored arm channels used when a hand is in `pose` mode, or as solver priors. */ arms: Record<
      Side,
      NonNullable<IAutoMovieHumanPose["arms"]>["left"]
    >;
    /** Authored leg channel priors and `pose` mode values. */ legPose: Record<
      Side,
      NonNullable<IAutoMovieHumanPose["legs"]>["left"]
    >;
  }

  /**
   * Root placement of a frame, with or without evasive displacement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Heading-frame shift plus evasive shift, minus drop, plus lift; yaw quaternion times the extra roll.
   * @evidence contracts/common.md#authoring-interface `nominal` omits evasive displacement so attackers can aim at the head's original line.
   */
  export function placement(
    frame: Frame,
    nominal: boolean = false,
  ): BodyRig.Placement {
    const evade: number = nominal ? 0 : 1;
    const [forward, left] = frame.shift;
    const offset: Vec3.Value = Vec3.rotateY(
      [forward, 0, left + frame.evade.shift * evade],
      frame.heading,
    );
    const yaw: number = frame.heading + frame.turn;
    const q: readonly [number, number, number, number] = [
      0,
      Math.sin(yaw / 2),
      0,
      Math.cos(yaw / 2),
    ];
    return {
      position: Vec3.add(
        [
          frame.origin[0] + offset[0],
          -(frame.drop + frame.evade.drop * evade),
          frame.origin[1] + offset[2],
        ],
        frame.lift,
      ),
      rotation: multiply(q, frame.roll),
    };
  }

  /**
   * Clinical pose of a frame, with or without evasive displacement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Maps additive fields onto clinical channels, clamped to the Human ranges, splitting evasive lean between thoracic, lumbar and cervical; hands default to a closed fist.
   * @evidence contracts/common.md#authoring-interface Returns a fresh complete pose; `nominal` omits evasive lean.
   */
  export function pose(
    frame: Frame,
    nominal: boolean = false,
  ): IAutoMovieHumanPose {
    const e: number = nominal ? 0 : 1;
    const fist = {
      thumb: { mcpFlexion: 40, ipFlexion: 45, cmcFlexion: 10 },
      index: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 55 },
      middle: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 55 },
      ring: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 55 },
      little: { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 55 },
    };
    const arm = (side: Side) => ({
      ...structuredClone(frame.arms[side]),
      shoulderGirdle: {
        protraction: clamp(frame.girdle[side].protraction, -15, 15),
        elevation: clamp(frame.girdle[side].elevation, -10, 45),
        ...(frame.arms[side]?.shoulderGirdle?.upwardRotation !== undefined
          ? { upwardRotation: frame.arms[side]!.shoulderGirdle!.upwardRotation }
          : {}),
      },
      hand: frame.arms[side]?.hand ?? fist,
    });
    return {
      pelvis: {
        tilt: clamp(frame.pelvis.tilt, -90, 90),
        obliquity: clamp(frame.pelvis.obliquity, -90, 90),
        rotation: clamp(frame.pelvis.rotation, -180, 180),
      },
      spine: {
        thoracic: {
          flexion: clamp(
            frame.thoracic.flexion + frame.evade.flexion * 0.55 * e,
            -10,
            30,
          ),
          lateralFlexion: clamp(
            frame.thoracic.lateral + frame.evade.lateral * 0.5 * e,
            -15,
            15,
          ),
          rotation: clamp(frame.thoracic.rotation, -40, 40),
        },
        lumbar: {
          flexion: clamp(
            frame.lumbar.flexion + frame.evade.flexion * 0.45 * e,
            -15,
            50,
          ),
          lateralFlexion: clamp(
            frame.lumbar.lateral + frame.evade.lateral * 0.5 * e,
            -20,
            20,
          ),
        },
      },
      neck: {
        cervical: {
          flexion: clamp(frame.cervical.flexion, -30, 35),
          lateralFlexion: clamp(
            frame.cervical.lateral - frame.evade.lateral * 0.3 * e,
            -40,
            40,
          ),
          rotation: clamp(frame.cervical.rotation, -20, 20),
        },
        atlantoOccipital: { flexion: clamp(frame.atlas.flexion, -15, 10) },
        atlantoAxial: { rotation: clamp(frame.atlas.rotation, -40, 40) },
      },
      head: { jaw: { opening: clamp(frame.jaw, 0, 52) } },
      arms: { left: arm("left"), right: arm("right") },
      legs: {
        left: structuredClone(frame.legPose.left) ?? {},
        right: structuredClone(frame.legPose.right) ?? {},
      },
    } as IAutoMovieHumanPose;
  }

  /**
   * Give a hand to a new intent, cutting off whatever it was doing.
   *
   * @evidence contracts/common.md#implementation-and-ownership The guard is every intent's baseline, so taking over from the guard is immediate; taking over from another active intent (a retracting punch, a parry, a catch) cross-fades from that intent's resolved goal by `ownership`, so an interrupted action hands its limb on without a jump.
   * @evidence contracts/common.md#authoring-interface `ownership` in [0, 1] is how much the new intent owns the hand this frame; callers ramp it over the first ~0.1 s of their window.
   */
  export function assign(
    frame: Frame,
    side: Side,
    hand: Hand,
    ownership: number,
  ): void {
    const current: Hand = frame.hands[side];
    frame.hands[side] =
      current.kind === "guard" || current.kind === "pose" || ownership >= 1
        ? hand
        : {
            kind: "blend",
            from: current,
            to: hand,
            weight: Math.max(0, ownership),
          };
  }

  /** Identity quaternion. */
  export const IDENTITY: readonly [number, number, number, number] = [
    0, 0, 0, 1,
  ];
}

/** Clamp to a closed range. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Hamilton product a * b. */
function multiply(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
): [number, number, number, number] {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}
