import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { getUp } from "../floor/getUp";
import { lieDown } from "../floor/lieDown";
import { clinch } from "./clinch";

/**
 * Floor support keys and hand regions for preplanned grappling performances.
 * The phase shares, turns and body angles are provisional staging values.
 * The IJF atlas identifies the judo silhouettes, and UWW's rules distinguish
 * the freestyle and Greco-Roman contact vocabularies. The phase separation
 * follows Imamura et al. (2006, PMID 24357984) and Yamashita et al. (2020,
 * PMC7739678). The studies do not supply these choreography values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the row's meaning, references and the provenance of the numeric values.
 * @evidence contracts/development/design.md#principled-representation One support schedule supplies changes of bearing, with authored class-specific preferences and the partner regions kept separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law reads a scene's duration and region goals, then the support keys for the selected role and branch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses canonical contact parts and floor posture shapes with authored variation; never grants a sport score from joint angles.
 */
export namespace grappleStances {
  /** Whether the receiver finishes on the back, or the actors separate standing. */
  type Finish = "back" | "hold" | "reset";

  /** Visible character of one actor's entry, by pelvis and trunk angles in degrees. */
  interface IEntry {
    /** Pelvis turn toward the actor's lead side. */
    turn: number;
    /** Trunk forward inclination at the entry. */
    pitch: number;
    /** Trunk tilt toward the actor's lead side. */
    roll: number;
    /** Trunk twist relative to the pelvis. */
    twist: number;
    /** Hip and knee flexion of the entry. */
    depth: number;
  }

  /** Paired preferences and contact family for a staged scene. */
  interface IRow {
    /** Default scene length in seconds. */
    seconds: number;
    /** Initiating actor's entry. */
    initiator: IEntry;
    /** Receiving actor's response. */
    receiver: IEntry;
    /** The shared transition to the final supports. */
    finish: Finish;
    /** Initiator's right-lead grip family. */
    grip: "collarSleeve" | "oneLeg" | "bothLegs" | "shoulders" | "mat";
  }

  /** Illustrative poses separate moving silhouettes within the same rules family. */
  const rows: Readonly<Record<IAutoMovieMotionHumanGrapple.Kind, IRow>> = {
    seoiNage: {
      seconds: 3.5,
      initiator: { turn: 80, pitch: 25, roll: 0, twist: -15, depth: 34 },
      receiver: { turn: -16, pitch: 20, roll: -6, twist: 10, depth: 24 },
      finish: "back",
      grip: "collarSleeve",
    },
    oGoshi: {
      seconds: 3.8,
      initiator: { turn: 97, pitch: 15, roll: 12, twist: -16, depth: 30 },
      receiver: { turn: -24, pitch: 12, roll: 13, twist: 14, depth: 20 },
      finish: "back",
      grip: "collarSleeve",
    },
    oSotoGari: {
      seconds: 3.4,
      initiator: { turn: 27, pitch: 12, roll: -8, twist: 10, depth: 21 },
      receiver: { turn: -17, pitch: -22, roll: 7, twist: 8, depth: 24 },
      finish: "back",
      grip: "collarSleeve",
    },
    deAshiHarai: {
      seconds: 3,
      initiator: { turn: 39, pitch: 7, roll: -5, twist: -9, depth: 14 },
      receiver: { turn: -41, pitch: -11, roll: -16, twist: 15, depth: 18 },
      finish: "back",
      grip: "collarSleeve",
    },
    singleLeg: {
      seconds: 3.8,

      // The lowered stage picture brings the working shoulder toward the
      // partner's thigh before the grip closes.
      initiator: { turn: 23, pitch: 45, roll: 15, twist: 10, depth: 56 },
      receiver: { turn: -33, pitch: 12, roll: -14, twist: 9, depth: 35 },
      finish: "back",
      grip: "oneLeg",
    },
    doubleLeg: {
      seconds: 3.6,
      initiator: { turn: 9, pitch: 45, roll: 0, twist: 1, depth: 58 },
      receiver: { turn: -10, pitch: -12, roll: 0, twist: 0, depth: 40 },
      finish: "back",
      grip: "bothLegs",
    },
    grecoRoman: {
      seconds: 3.8,
      initiator: { turn: 54, pitch: 10, roll: 7, twist: -24, depth: 22 },
      receiver: { turn: -34, pitch: -12, roll: 10, twist: 16, depth: 19 },
      finish: "back",
      grip: "shoulders",
    },
    judoHold: {
      seconds: 5,
      initiator: { turn: 24, pitch: 19, roll: 12, twist: -10, depth: 46 },
      receiver: { turn: -32, pitch: -8, roll: -12, twist: 16, depth: 45 },
      finish: "hold",
      grip: "mat",
    },
    wrestlingFall: {
      seconds: 5,
      initiator: { turn: 38, pitch: 29, roll: -8, twist: -14, depth: 48 },
      receiver: { turn: -42, pitch: 4, roll: 8, twist: 18, depth: 49 },
      finish: "hold",
      grip: "mat",
    },
    guardPass: {
      seconds: 6,
      initiator: { turn: 47, pitch: 28, roll: 8, twist: -12, depth: 50 },
      receiver: { turn: -22, pitch: 12, roll: -17, twist: 12, depth: 47 },
      finish: "hold",
      grip: "mat",
    },
    mmaReset: {
      seconds: 4.2,
      initiator: { turn: 19, pitch: 18, roll: 2, twist: -10, depth: 34 },
      receiver: { turn: -21, pitch: 16, roll: -5, twist: 12, depth: 31 },
      finish: "reset",
      grip: "shoulders",
    },
  };

  /** Unscaled shares at which the paired floor keys arrive. */
  const shares: readonly [number, number, number, number, number] = [
    0.18, 0.38, 0.61, 0.78, 1,
  ];

  /** Both feet bearing, with one optionally set down anew by the support law. */
  function feet(
    step?: AutoMovieHumanSide,
  ): readonly IAutoMovieMotionHumanSupport.IContact[] {
    return ["left", "right"].map(
      (side: string): IAutoMovieMotionHumanSupport.IContact => ({
        part: side === "left" ? "leftFoot" : "rightFoot",
        kind: "bear",
        ...(side === step ? { step: true } : {}),
      }),
    );
  }

  /** Switch an authored lead side. */
  function other(side: AutoMovieHumanSide): AutoMovieHumanSide {
    return side === "left" ? "right" : "left";
  }

  /** Standing stance which lets the pelvis and trunk turn separately. */
  function stance(
    entry: IEntry,
    direction: number,
    share: number,
  ): IAutoMovieMotionHumanLieDown.IPose {
    const depth: number = entry.depth * share;
    return {
      pitch: entry.pitch * share,
      roll: direction * entry.roll * share,
      joints: {
        spine: [0, 0, direction * entry.twist * share * 0.4],
        chest: [0, 0, direction * entry.twist * share * 0.6],
        leftUpperLeg: [depth, 7, 0],
        rightUpperLeg: [depth, 7, 0],
        leftLowerLeg: [depth, 0, 0],
        rightLowerLeg: [depth, 0, 0],
        leftUpperArm: [16 * share, 12, 0],
        rightUpperArm: [16 * share, 12, 0],
        leftLowerArm: [35 * share, 0, 0],
        rightLowerArm: [35 * share, 0, 0],
      },
    };
  }

  /**
   * Read the default duration for a scene, in seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains what the numeric row means and its units.
   * @evidence contracts/development/implementation.md#principled-implementation One lookup by the requested kind.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the only scalar from that row used to set the clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses each authored kind's own duration.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant table lookup.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No intermediate computation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure numeric lookup.
   */
  export function seconds(kind: IAutoMovieMotionHumanGrapple.Kind): number {
    return rows[kind].seconds;
  }

  /**
   * Resolve visible reach sites relative to the partner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each returned key is the acting hand and its value is the partner's region.
   * @evidence contracts/development/implementation.md#principled-implementation The clinch owner supplies collar and sleeve. Other rows map the same mirrored hand keys to their sport's named regions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the scene's grip family, then the sites that the selected lead uses.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg grip uses a leg region; the Greco-Roman shoulder grip has no leg target.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant lookups.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses clinch regions for the collar-and-sleeve family.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns at most two region strings.
   */
  export function regions(
    kind: IAutoMovieMotionHumanGrapple.Kind,
    side: AutoMovieHumanSide,
  ): Readonly<Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>>> {
    const opposite: AutoMovieHumanSide = other(side);
    const grip: IRow["grip"] = rows[kind].grip;
    switch (grip) {
      case "collarSleeve": {
        const paired: ReturnType<typeof clinch.regions> = clinch.regions(
          "collarSleeve",
          side,
        );
        return { left: paired.left.region, right: paired.right.region };
      }
      case "oneLeg":
        return {
          [side]: side === "right" ? "thighFrontLeft" : "thighFrontRight",
        };
      case "bothLegs":
        return { left: "thighFrontRight", right: "thighFrontLeft" };
      case "shoulders":
        return { left: "shoulderRight", right: "shoulderLeft" };
      case "mat":
        return {
          [opposite]: opposite === "right" ? "shoulderLeft" : "shoulderRight",
        };
    }
  }

  /**
   * Author the support keys over the two actors' shared scene duration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns five ordered stances. The role, outcome and lead choose separate paths using the same phase shares.
   * @evidence contracts/development/implementation.md#principled-implementation The authored lead steps at entry; transfer and recovery either retain standing support or add floor contacts, with seat support before the receiver reaches the back.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects the stance family and creates the common entry, transfer, settle and release keys.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Floor fitting belongs to support. An interrupted scene has no fall or award event.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five keys per role, independent of duration or the number of playback queries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Floor shapes and standing recovery reuse lieDown and getUp.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No history is retained.
   */
  export function keys(
    p: IAutoMovieMotionHumanGrapple.IParams,
    duration: number,
  ): readonly IAutoMovieMotionHumanSupport.IStance[] {
    const row: IRow = rows[p.kind];
    const lead: AutoMovieHumanSide = p.side ?? "right";
    const receiver: boolean = p.role === "receiver";
    const step: AutoMovieHumanSide = receiver ? other(lead) : lead;
    const direction: number = lead === "right" ? 1 : -1;
    const entry: IEntry = row[p.role];
    const turn: number = direction * entry.turn;
    const complete: boolean = p.outcome !== "denied";
    const down: boolean = complete && receiver && row.finish !== "reset";
    const kneeling: boolean = complete && !receiver && row.finish === "hold";
    const result: IAutoMovieMotionHumanGrapple.Kind = p.kind;
    const floorPose: IAutoMovieMotionHumanLieDown.IPose =
      result === "guardPass"
        ? {
            ...lieDown.POSES.supine,
            joints: {
              ...lieDown.POSES.supine.joints,
              leftUpperLeg: [32, 8, 0],
              rightUpperLeg: [32, 8, 0],
              leftLowerLeg: [24, 0, 0],
              rightLowerLeg: [24, 0, 0],
            },
          }
        : lieDown.POSES.supine;
    const low: readonly IAutoMovieMotionHumanSupport.IContact[] = [
      { part: "leftKnee", kind: "bear" },
      { part: "rightKnee", kind: "bear" },
    ];
    const sitting: readonly IAutoMovieMotionHumanSupport.IContact[] = [
      { part: "seat", kind: "bear" },
      ...feet(),
    ];
    const back: readonly IAutoMovieMotionHumanSupport.IContact[] = [
      { part: "back", kind: "bear" },
    ];

    const stances: readonly IAutoMovieMotionHumanSupport.IStance[] = [
      {
        event: "ready",
        contacts: feet(),
        prefer: stance(entry, direction, 0.3),
      },
      {
        event: "entry",
        contacts: feet(step),
        prefer: stance(entry, direction, 1),
        turn,
      },
      down
        ? {
            event: "matTransfer",
            contacts: sitting,
            prefer: lieDown.POSES.sit,
            turn,
          }
        : {
            event: complete ? "transfer" : "interrupted",
            contacts: feet(other(step)),
            prefer: stance(entry, direction, 0.7),
            turn: turn * 0.6,
          },
      down
        ? { event: "settled", contacts: back, prefer: floorPose, turn }
        : kneeling
          ? {
              event: "settled",
              contacts: low,
              prefer: lieDown.POSES.kneel,
              turn: turn * 0.6,
            }
          : {
              event: "supportRegained",
              contacts: feet(step),
              prefer: stance(entry, direction, 0.12),
            },
      down || kneeling
        ? {
            event: "recoveredOnMat",
            contacts: down ? back : low,
            prefer: down ? floorPose : lieDown.POSES.kneel,
            turn: down ? turn : turn * 0.6,
          }
        : {
            event:
              result === "mmaReset" && complete ? "separated" : "recovered",
            contacts: feet(other(step)),
            prefer: getUp.POSES.stood,
          },
    ];
    return stances.map(
      (
        key: IAutoMovieMotionHumanSupport.IStance,
        index: number,
      ): IAutoMovieMotionHumanSupport.IStance => ({
        ...key,
        seconds: duration * (shares[index]! - (shares[index - 1] ?? 0)),
      }),
    );
  }
}
