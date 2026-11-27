import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { getUp } from "../../floor/internal/getUp";
import { lieDown } from "../../floor/internal/lieDown";
import { clinch } from "./clinch";
import { grappleSumo } from "./grappleSumo";

/**
 * Floor support keys and hand regions for preplanned grappling performances.
 * The phase shares, turns and body angles are provisional staging values. The
 * IJF atlas identifies the judo silhouettes, and UWW's rules distinguish the
 * freestyle and Greco-Roman contact vocabularies. The phase separation follows
 * Imamura et al. (2006, PMID 24357984) and Yamashita et al. (2020, PMC7739678).
 * The studies do not supply these choreography values.
 */
export namespace grappleStances {
  /**
   * Illustrative poses separate moving silhouettes within the same rules
   * family.
   */
  const rows: Readonly<
    Record<Exclude<IAutoMovieMotionHumanGrapple.Kind, grappleSumo.Kind>, IRow>
  > = {
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
      receiver: {
        turn: -34,
        pitch: -12,
        roll: 10,
        twist: 16,
        depth: 19,
        armSpread: 28,
      },
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

  /** Shared shoulder-exchange entry and release beat, as a share of the take. */
  export const SHOULDER_ENTRY: number = 0.34;

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
    const armSpread: number = 12 + (entry.armSpread ?? 0) * share;
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
        leftUpperArm: [16 * share, armSpread, 0],
        rightUpperArm: [16 * share, armSpread, 0],
        leftLowerArm: [35 * share, 0, 0],
        rightLowerArm: [35 * share, 0, 0],
      },
    };
  }

  /** Read the default duration for a scene, in seconds. */
  export function seconds(kind: IAutoMovieMotionHumanGrapple.Kind): number {
    return grappleSumo.is(kind)
      ? grappleSumo.seconds(kind)
      : rows[kind].seconds;
  }

  /** Resolve visible reach sites relative to the partner. */
  export function regions(
    kind: IAutoMovieMotionHumanGrapple.Kind,
    side: AutoMovieHumanSide,
  ): Readonly<Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>>> {
    if (grappleSumo.is(kind)) return grappleSumo.regions(kind);
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
   * @param p The scene.
   * @param duration The scene's seconds.
   * @param body The performer's body.
   * @param partner The partner's body, which a sumo tachiai's contact gap
   *   reads.
   * @param pitch A sumo tachiai's trunk pitch, degrees, as the support fit
   *   takes it (`grappleSumo.keys`); the charge pose's own when absent.
   * @returns The timed support keys.
   */
  export function keys(
    p: IAutoMovieMotionHumanGrapple.IParams,
    duration: number,
    body: IAutoMovieMotionHumanBody,
    partner: IAutoMovieMotionHumanBody,
    pitch?: number,
  ): readonly IAutoMovieMotionHumanSupport.IStance[] {
    if (grappleSumo.is(p.kind))
      return grappleSumo.keys(
        { ...p, kind: p.kind },
        duration,
        body,
        partner,
        pitch,
      );
    if (p.kind === "seoiNage" && p.outcome !== "denied")
      return shoulderKeys(p.role, p.side ?? "right", duration);
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
    return timed(stances, shares, duration);
  }

  /** Prepare the shared planted turn and the receiver's cleared mat poses. */
  function shoulderKeys(
    role: IAutoMovieMotionHumanGrapple.Role,
    lead: AutoMovieHumanSide,
    duration: number,
  ): readonly IAutoMovieMotionHumanSupport.IStance[] {
    const receiver: boolean = role === "receiver";
    const direction: number = lead === "right" ? 1 : -1;
    const turn: number = direction * (receiver ? 1 : 24);
    const entry: IEntry = {
      ...rows.seoiNage[role],
      depth: receiver ? 20 : 28,
      pitch: receiver ? 8 : 22,
    };
    const ready: IAutoMovieMotionHumanSupport.IStance = {
      event: "ready",
      contacts: feet(),
      prefer: stance(entry, direction, receiver ? 0.18 : 0.2),
    };
    const loaded: IAutoMovieMotionHumanSupport.IStance = {
      event: "entry",
      contacts: feet(),
      prefer: stance(entry, direction, receiver ? 0.78 : 1),
      turn,
    };
    if (!receiver)
      return timed(
        [
          ready,
          loaded,
          {
            ...loaded,
            event: "transfer",
            prefer: stance(entry, direction, 0.7),
          },
          {
            ...loaded,
            event: "supportRegained",
            prefer: stance(entry, direction, 0.15),
            turn: turn * 0.3,
          },
          { ...ready, event: "recovered", prefer: getUp.POSES.stood },
        ],
        [0.12, SHOULDER_ENTRY, 0.61, 0.79, 1],
        duration,
      );

    // The arms clear the floor during the roll, so they cannot lift the pelvis.
    const seated: IAutoMovieMotionHumanLieDown.IPose = {
      ...lieDown.POSES.sit,
      joints: {
        ...lieDown.POSES.sit.joints,
        leftUpperArm: [25, 20, 0],
        rightUpperArm: [25, 20, 0],
        leftLowerArm: [55, 0, 0],
        rightLowerArm: [55, 0, 0],
      },
    };
    const settled: IAutoMovieMotionHumanSupport.IStance = {
      event: "settled",
      contacts: [{ part: "back", kind: "bear" }],
      prefer: {
        ...lieDown.POSES.supine,
        joints: {
          ...lieDown.POSES.supine.joints,
          leftUpperLeg: [10, 8, 0],
          rightUpperLeg: [10, 8, 0],
          leftLowerLeg: [10, 0, 0],
          rightLowerLeg: [10, 0, 0],
        },
      },
      turn,
    };
    return timed(
      [
        ready,
        loaded,
        {
          event: "matTransfer",
          contacts: [{ part: "seat", kind: "bear" }, ...feet()],
          prefer: seated,
          turn,
        },
        settled,
        { ...settled, event: "recoveredOnMat" },
      ],
      [0.12, SHOULDER_ENTRY, 0.56, 0.79, 1],
      duration,
    );
  }

  /** Convert cumulative phase shares to the support owner's durations. */
  function timed(
    stances: readonly IAutoMovieMotionHumanSupport.IStance[],
    at: readonly number[],
    duration: number,
  ): readonly IAutoMovieMotionHumanSupport.IStance[] {
    return stances.map(
      (
        key: IAutoMovieMotionHumanSupport.IStance,
        index: number,
      ): IAutoMovieMotionHumanSupport.IStance => ({
        ...key,
        seconds: duration * (at[index]! - (at[index - 1] ?? 0)),
      }),
    );
  }

  /** Whether the receiver finishes on the back, or the actors separate standing. */
  type Finish = "back" | "hold" | "reset";

  /**
   * Visible character of one actor's entry, by pelvis and trunk angles in
   * degrees.
   */
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
    /** Additional outward arm angle for free hands during the staged pose. */
    armSpread?: number;
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
    grip: RowGrip;
  }
}

/** The alternatives of `RowGrip`'s site. */
type RowGrip = "collarSleeve" | "oneLeg" | "bothLegs" | "shoulders" | "mat";
