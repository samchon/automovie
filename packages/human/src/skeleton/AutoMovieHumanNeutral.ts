import { Singleton } from "tstl";

import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanNeutralAnkle } from "./AutoMovieHumanNeutralAnkle";
import { AutoMovieHumanNeutralElbow } from "./AutoMovieHumanNeutralElbow";
import { AutoMovieHumanNeutralFingerDip } from "./AutoMovieHumanNeutralFingerDip";
import { AutoMovieHumanNeutralFingerPip } from "./AutoMovieHumanNeutralFingerPip";
import { AutoMovieHumanNeutralForearm } from "./AutoMovieHumanNeutralForearm";
import { AutoMovieHumanNeutralHip } from "./AutoMovieHumanNeutralHip";
import { AutoMovieHumanNeutralKnee } from "./AutoMovieHumanNeutralKnee";
import { AutoMovieHumanNeutralKnuckle } from "./AutoMovieHumanNeutralKnuckle";
import { AutoMovieHumanNeutralShoulder } from "./AutoMovieHumanNeutralShoulder";
import { AutoMovieHumanNeutralThumbCmc } from "./AutoMovieHumanNeutralThumbCmc";
import { AutoMovieHumanNeutralThumbIp } from "./AutoMovieHumanNeutralThumbIp";
import { AutoMovieHumanNeutralThumbMcp } from "./AutoMovieHumanNeutralThumbMcp";
import { AutoMovieHumanNeutralTurn } from "./AutoMovieHumanNeutralTurn";
import { AutoMovieHumanNeutralWrist } from "./AutoMovieHumanNeutralWrist";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The anatomical neutral of a generated body, derived from its bind skeleton.
 *
 * Generation achieves a posture: an A-pose with relaxed hands. That posture is
 * an observation and the skin's bind, not a clinical zero. Neutral is the
 * standing body the clinical angles are measured from (the Neutral-0 position
 * of DGUV F 4030: upright, arms hanging, thumbs forward, feet parallel), reached
 * from the bind by one rotation per bone, and those rotations are the body's
 * achieved offset. A bone that no piece names rides its parent, so its offset
 * is zero. Each joint's rule is its own piece, composed here parent before
 * child:
 *
 * - Arm: {@link AutoMovieHumanNeutralShoulder} (resting at the side),
 *   {@link AutoMovieHumanNeutralElbow}, {@link AutoMovieHumanNeutralForearm}
 *   (thumbs forward) and {@link AutoMovieHumanNeutralWrist}.
 * - Thumb: {@link AutoMovieHumanNeutralThumbCmc} (toward the index
 *   metacarpal, clear of the hand), {@link AutoMovieHumanNeutralThumbMcp} and
 *   {@link AutoMovieHumanNeutralThumbIp}.
 * - Fingers: {@link AutoMovieHumanNeutralKnuckle},
 *   {@link AutoMovieHumanNeutralFingerPip} and
 *   {@link AutoMovieHumanNeutralFingerDip}, straight on the hand, parted by the
 *   least spread at which neighbours do not cross.
 * - Leg: {@link AutoMovieHumanNeutralHip} (the least abduction at which the
 *   thighs do not cross), {@link AutoMovieHumanNeutralKnee} and
 *   {@link AutoMovieHumanNeutralAnkle} (the sole level, the foot straight ahead).
 * - Spine, neck, head, jaw, eyes, girdle: as they stand. A standing column is
 *   its own neutral, and the head is built in the Frankfort plane, so no
 *   reference says otherwise.
 *
 * The rig's rest stays the bind, since a skin has one rest frame: neutral is a
 * pose of the rig, and every clinical pose is a further pose of neutral.
 */
export namespace AutoMovieHumanNeutral {
  /** A body's neutral. */
  export interface IOutput {
    /** The skeleton standing at neutral, in the bind's order, mm. */
    joints: AutoMovieHumanJointCentres.IJoint[];

    /** Each bone's world turn from bind to neutral: the achieved offset, inverted. */
    turns: Map<string, Math3D.Quaternion>;

    /** Each upper arm's and thigh's resting abduction from the plumb line, degrees, by bone. */
    resting: Map<string, number>;

    /** Each forearm's achieved pronation from thumbs forward, degrees. */
    forearms: Map<string, number>;
  }

  /** The chains of skin the neutral reads, so a caller samples no more. */
  export const READS: RegExp = /^(trunk|(leg|arm)\.(left|right)|hand\.(left|right)\.1|thumb\.(left|right)|finger\.(left|right)\.\w+)$/;

  /** Share of the forearm's twist the wrist carries. */
  export const WRIST_TWIST: number = AutoMovieHumanNeutralForearm.WRIST_TWIST;

  /** One bone's segment frame at neutral. */
  export interface IFrame {
    /** Bone id. */
    bone: string;

    /** Parent bone, or null for the root. */
    parent: string | null;

    /** Joint centre, mm. */
    centre: Math3D.Vector;

    /** End of the segment: the child's centre or the leaf's tip, mm. */
    end: Math3D.Vector;

    /** The bone's clinical axes; `twist` runs along the segment. */
    axes: Math3D.IAxes;
  }

  /**
   * Every bone's segment frame at neutral: the joint centres and clinical axes
   * the pose fields turn about, which a limb lofted in its own frame reads.
   *
   * The frames are a function of the generated skeleton alone, derived from
   * the same centres the rig binds to, so a body that changes its skeleton
   * changes its frames and nothing else is stored.
   *
   * @param joints The skeleton at neutral, from {@link derive}.
   * @returns One frame per bone, parent before child.
   */
  export function frames(
    joints: readonly AutoMovieHumanJointCentres.IJoint[],
  ): IFrame[] {
    const byBone: Map<string, AutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: AutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    return joints.map((j: AutoMovieHumanJointCentres.IJoint): IFrame => {
      const d: Math3D.Vector = Math3D.unit(Math3D.sub(j.toward, j.position));
      return {
        bone: j.bone,
        parent: j.parent,
        centre: j.position,
        end: j.tip ?? j.toward,
        axes: Math3D.boneAxes(j.bone, d, byBone),
      };
    });
  }

  /** What a body's neutral is derived from: its skin's rings and its bind skeleton. */
  export interface ISource {
    /** The skin as rings; at least the chains {@link READS} names. */
    rings: readonly IAutoMovieHumanChainRings[];

    /** The bind skeleton. */
    joints: readonly AutoMovieHumanJointCentres.IJoint[];
  }

  /**
   * Each calibration's neutral, derived once. The skeleton's pose evaluator
   * and the rig's binding both stand on the same body's neutral, and each
   * derived it again: the separating pieces scan the skin's rings, so the
   * second derivation repeated the whole scan for the same answer. The key
   * is the calibration object itself, so a body generated again is a new key
   * and an old body's entry goes with it.
   */
  const CACHE: WeakMap<IAutoMovieHumanBodyCalibration, Singleton<IOutput>> = new WeakMap();

  /**
   * One calibrated body's neutral, derived at its first request and shared by
   * every later one.
   *
   * The neutral reads only the chains {@link READS} names, by name, and the
   * bind skeleton, which is a function of the calibration alone, so every
   * caller's source gives the same neutral and the first one's is kept.
   *
   * @param calibration The body.
   * @param source Its rings and bind skeleton, read only on the first request.
   * @returns The neutral; callers read it and do not change it.
   */
  export function of(calibration: IAutoMovieHumanBodyCalibration, source: () => ISource): IOutput {
    let cached: Singleton<IOutput> | undefined = CACHE.get(calibration);
    if (cached === undefined) {
      cached = new Singleton((): IOutput => {
        const read: ISource = source();
        return derive(read.rings, read.joints);
      });
      CACHE.set(calibration, cached);
    }
    return cached.get();
  }

  /**
   * Derive one body's neutral.
   *
   * @param rings The body's skin as rings, which the resting limbs and digits must clear; the chains read are named by {@link READS}.
   * @param joints Its bind skeleton.
   * @returns The neutral skeleton and the turns that reach it.
   */
  export function derive(
    rings: readonly IAutoMovieHumanChainRings[],
    joints: readonly AutoMovieHumanJointCentres.IJoint[],
  ): IOutput {
    const body: IAutoMovieHumanNeutralBody = AutoMovieHumanNeutralTurn.body(joints);

    // Each joint's piece names the turn of the bone it owns, parent first.
    const named: Map<string, Math3D.Quaternion> = new Map();
    const resting: Map<string, number> = new Map();
    const forearms: Map<string, number> = new Map();
    for (const side of ["left", "right"] as const) {
      const shoulder: AutoMovieHumanNeutralShoulder.IOutput =
        AutoMovieHumanNeutralShoulder.derive(body, rings, side);
      const straight: Math3D.Quaternion = AutoMovieHumanNeutralElbow.derive(
        body,
        side,
        shoulder.turn,
        shoulder.down,
      );
      const bent: Math3D.Quaternion = AutoMovieHumanNeutralWrist.derive(
        body,
        side,
        straight,
        shoulder.down,
      );
      const forearm: AutoMovieHumanNeutralForearm.IOutput =
        AutoMovieHumanNeutralForearm.derive(
          body,
          side,
          straight,
          bent,
          shoulder.down,
        );
      resting.set(`${side}UpperArm`, shoulder.resting);
      forearms.set(`${side}LowerArm`, forearm.pronation);
      named.set(`${side}UpperArm`, shoulder.turn);
      named.set(`${side}LowerArm`, forearm.lower);
      named.set(`${side}Hand`, forearm.hand);

      // The thumb lies as near the index metacarpal's line as its skin stays
      // out of the hand's, each joint straight on the one before.
      const line: Math3D.Vector = AutoMovieHumanNeutralThumbCmc.line(
        body,
        rings,
        side,
        forearm.hand,
      );
      const cmc: Math3D.Quaternion = AutoMovieHumanNeutralThumbCmc.derive(
        body,
        side,
        forearm.hand,
        line,
      );
      const mcp: Math3D.Quaternion = AutoMovieHumanNeutralThumbMcp.derive(
        body,
        side,
        cmc,
        line,
      );
      named.set(`${side}ThumbMetacarpal`, cmc);
      named.set(`${side}ThumbProximal`, mcp);
      named.set(
        `${side}ThumbDistal`,
        AutoMovieHumanNeutralThumbIp.derive(body, side, mcp, line),
      );

      // Each finger lies along the hand, the neighbours parted by the least
      // spread at which their skins do not cross.
      const lines: Map<string, Math3D.Vector> = AutoMovieHumanNeutralKnuckle.lines(
        body,
        rings,
        side,
        forearm.hand,
        shoulder.down,
      );
      for (const finger of AutoMovieHumanNeutralKnuckle.FINGERS) {
        const along: Math3D.Vector = lines.get(finger)!;
        const proximal: Math3D.Quaternion = AutoMovieHumanNeutralKnuckle.derive(
          body,
          side,
          finger,
          forearm.hand,
          along,
        );
        const middle: Math3D.Quaternion = AutoMovieHumanNeutralFingerPip.derive(
          body,
          side,
          finger,
          proximal,
          along,
        );
        named.set(`${side}${finger}Proximal`, proximal);
        named.set(`${side}${finger}Intermediate`, middle);
        named.set(
          `${side}${finger}Distal`,
          AutoMovieHumanNeutralFingerDip.derive(
            body,
            side,
            finger,
            middle,
            along,
          ),
        );
      }

      // The leg hangs at the least abduction at which the thighs do not
      // cross, by the shortest turn, keeping its forward knee.
      const hip: AutoMovieHumanNeutralHip.IOutput = AutoMovieHumanNeutralHip.derive(body, rings, side);
      const thigh: Math3D.Quaternion = hip.turn;
      resting.set(`${side}UpperLeg`, hip.resting);
      named.set(`${side}UpperLeg`, thigh);
      named.set(
        `${side}LowerLeg`,
        AutoMovieHumanNeutralKnee.derive(body, side, thigh),
      );
      named.set(`${side}Foot`, AutoMovieHumanNeutralAnkle.derive(body, side));
    }

    // Everything else rides its parent.
    const turns: Map<string, Math3D.Quaternion> = new Map();
    const places: Map<string, Math3D.Vector> = new Map();
    for (const j of joints) {
      const parent: string | null = j.parent;
      const above: Math3D.Quaternion =
        parent === null ? [0, 0, 0, 1] : turns.get(parent)!;
      turns.set(j.bone, named.get(j.bone) ?? above);
      places.set(
        j.bone,
        parent === null
          ? j.position
          : Math3D.add(
              places.get(parent)!,
              Math3D.rotate(
                above,
                Math3D.sub(j.position, body.byBone.get(parent)!.position),
              ),
            ),
      );
    }

    // The straightened legs change the ankles' height, and the feet stay down.
    const ankles: [string, string] = ["leftFoot", "rightFoot"];
    const fall: number =
      ankles.reduce(
        (a: number, b: string): number =>
          a + body.byBone.get(b)!.position[1] - places.get(b)![1],
        0,
      ) / ankles.length;
    return {
      joints: joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): AutoMovieHumanJointCentres.IJoint => {
          const at: Math3D.Vector = Math3D.add(places.get(j.bone)!, [0, fall, 0]);
          const turn: Math3D.Quaternion = turns.get(j.bone)!;
          const moved: (p: Math3D.Vector) => Math3D.Vector = (
            p: Math3D.Vector,
          ): Math3D.Vector =>
            Math3D.add(at, Math3D.rotate(turn, Math3D.sub(p, j.position)));
          return {
            ...j,
            position: at,
            toward: moved(j.toward),
            tip: j.tip === null ? null : moved(j.tip),
          };
        },
      ),
      turns,
      resting,
      forearms,
    };
  }
}
