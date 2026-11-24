import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { getUp } from "../floor/getUp";
import { lieDown } from "../floor/lieDown";
import { grappleFront } from "./grappleFront";

/** The alternatives of `Kind2`'s site. */
type Kind2 = "oshiDashi" | "yoriKiri" | "uwateNage";

/**
 * The sumo bouts of the grapple law: both wrestlers crouch at the shikiri lines
 * with their fists down, charge at the tachiai into contact, and the initiator
 * either drives the receiver back out of the ring with the hands pushing up at
 * the sides of the chest (oshi-dashi) or hands on the belt (yori-kiri), or
 * throws him with an overarm belt grip (uwate-nage) onto the clay.
 *
 * The staging is from the shikiri lines: the lines lie 70 cm apart and the ring
 * is 4.55 m across (the Japan Sumo Association's introduction and the dohyō's
 * description, from a search), each wrestler's root a foot's length behind his
 * line. The drive steps the pair back through `DRIVE`, enough to carry the
 * receiver's back foot past the straw from the centre. The belt grip holds the
 * mawashi where it wraps the hips (the partner's hip regions). The crouch,
 * charge and drive shares and depths are provisional staging values.
 */
export namespace grappleSumo {
  /** The sumo scenes. */
  export type Kind = Extract<IAutoMovieMotionHumanGrapple.Kind, Kind2>;

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

  /** The shares at which the shikiri, tachiai and drive end. */
  const SHIKIRI: number = 0.22;

  /** The tachiai's share. */
  const TACHIAI: number = 0.32;

  /** The share at which the drive or throw ends. */
  const FINISH: number = 0.82;

  /** Whether a grapple kind is a sumo bout. */
  export function is(kind: IAutoMovieMotionHumanGrapple.Kind): kind is Kind {
    return kind === "oshiDashi" || kind === "yoriKiri" || kind === "uwateNage";
  }

  /** A scene's default length, seconds. */
  export function seconds(kind: Kind): number {
    return SECONDS[kind];
  }

  /**
   * The partner's regions each of the initiator's hands takes: the sides of the
   * chest for a push, the belt at the hips for a belt grip. A push is the hazu
   * grip, the thumb and index spread in a V that pushes up under the armpit
   * (hazu-oshi, the Japan Sumo Association's glossary), the hands on the
   * chest's two sides; two palms on the chest regions beside the sternum lay a
   * palm's breadth apart, 74 mm on the small body, and the two hands met.
   */
  export function regions(
    kind: Kind,
  ): Readonly<Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>>> {
    return kind === "oshiDashi"
      ? { left: "ribsRight", right: "ribsLeft" }
      : { left: "hipRight", right: "hipLeft" };
  }

  /**
   * The grip window: the hands leave the clay after the shikiri, meet the
   * partner at the tachiai and let go as the drive or throw ends.
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
   * tachiai's two steps into contact, the drive's alternating steps or the
   * throw's fall, and the finish.
   *
   * The tachiai brings the pair to the trunks' contact: each wrestler's chest
   * stands ahead of his hips by his trunk's lean at the charge's pitch and half
   * his chest's depth, and the two chests meet. The heads pass on one side,
   * each wrestler stepping to his own left by his head's radius, so two leaning
   * heads do not meet head on (the belt clinch's head beside the other's, as
   * the staged judo pair's marks are staggered): head on, the heads overlapped
   * 59 mm while the belt still lay 16 mm beyond the arm.
   *
   * @param p The scene.
   * @param duration The scene's seconds.
   * @param body The performer's body.
   * @param partner The partner's body.
   * @param pitch The trunk's pitch at the tachiai, degrees: the charge pose's
   *   own when absent, the pitch the support fit takes at the tachiai on a
   *   second reading (`grapple.plan`).
   * @returns The timed support keys.
   */
  export function keys(
    p: grappleSumo.IParams,
    duration: number,
    body: IAutoMovieMotionHumanBody,
    partner: IAutoMovieMotionHumanBody,
    pitch: number = CHARGE.pitch,
  ): readonly IAutoMovieMotionHumanSupport.IStance[] {
    const stature: number = body.measure.stature;
    const receiver: boolean = p.role === "receiver";
    const complete: boolean = p.outcome !== "denied";
    const foot: number = 0.15 * stature;
    const width: number = 0.14 * stature;
    // The charge closes the gap from the lines, each root a foot's length
    // behind its line, to the trunks' contact, half each.
    const start: number = LINES + 0.15 * (stature + partner.measure.stature);
    const charge: number = Math.max(
      0,
      (start -
        grappleFront.chest(body, pitch) -
        grappleFront.chest(partner, pitch)) /
        2,
    );
    // The heads pass on the wrestler's own left.
    const aside: number = body.measure.headRadius;
    // A foot's target is its ball, which lies ahead of the ankle the root
    // stands over.
    const ball: number =
      body.rest.get("leftToes")!.z - body.rest.get("leftFoot")!.z;
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
              at: {
                x: (side === "left" ? width : -width) + aside,
                y: 0,
                z: z + ball,
              },
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
    // The charge is two steps, the lead foot then the trail foot, a foot's
    // length apart about the charge: the root stands over its feet, so a lead
    // step alone, the trail foot left on the line, carried the root half the
    // charge and left the pair a third of a metre short of contact. A key's
    // stepping feet leave the floor together (`supportStep`), so each foot
    // steps on a key of its own. A foot that has stepped is restated on its
    // place in every later key: a contact keeps its place only when it is the
    // same contact as the stance before's (`supportContact`), and a foot
    // left to bear without its place was set down again by the fit, the lead
    // foot drawn 0.15 m back under the body at the tachiai.
    const placed: Map<AutoMovieHumanSide, number> = new Map();
    const stepTo = (
      side: AutoMovieHumanSide,
      z: number,
    ): IAutoMovieMotionHumanSupport.IContact => {
      placed.set(side, z);
      return at(side, z);
    };
    const planted = (
      side: AutoMovieHumanSide,
      z: number,
    ): IAutoMovieMotionHumanSupport.IContact => {
      const kept: number | undefined = placed.get(side);
      return kept === undefined ? at(side, z, false) : at(side, kept);
    };
    const keys: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        event: "shikiri",
        contacts: [at("left", 0, false), at("right", 0, false), ...fists],
        prefer: CROUCH,
      },
      {
        event: "charge",
        contacts: [stepTo("left", charge + foot / 2), planted("right", 0)],
        prefer: CHARGE,
      },
      {
        event: "tachiai",
        contacts: [planted("left", charge), stepTo("right", charge - foot / 2)],
        prefer: CHARGE,
      },
    ];
    const shares: number[] = [SHIKIRI, (SHIKIRI + TACHIAI) / 2, TACHIAI];

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
              contacts: [stepTo("right", charge), planted("left", charge)],
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
              contacts: [planted("left", charge), planted("right", charge)],
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
            stepTo(side, z),
            planted(side === "left" ? "right" : "left", z),
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
