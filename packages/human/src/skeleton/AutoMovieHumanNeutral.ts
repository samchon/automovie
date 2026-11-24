import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanChainRings,
  IAutoMovieHumanJointCentres,
  IAutoMovieHumanNeutral,
  IAutoMovieHumanNeutralBody,
  IAutoMovieHumanNeutralForearm,
  IAutoMovieHumanNeutralHip,
  IAutoMovieHumanNeutralShoulder,
} from "@automovie/interface";

import { AutoMovieHumanNeutralAnkle } from "./AutoMovieHumanNeutralAnkle";
import { AutoMovieHumanNeutralForearm } from "./AutoMovieHumanNeutralForearm";
import { AutoMovieHumanNeutralHip } from "./AutoMovieHumanNeutralHip";
import { AutoMovieHumanNeutralKnuckle } from "./AutoMovieHumanNeutralKnuckle";
import { AutoMovieHumanNeutralShoulder } from "./AutoMovieHumanNeutralShoulder";
import { AutoMovieHumanNeutralThumbCmc } from "./AutoMovieHumanNeutralThumbCmc";
import { AutoMovieHumanNeutralTurn } from "./AutoMovieHumanNeutralTurn";
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
 * child; a hinge whose neutral is straight on its parent (Neutral-0: extension
 * is the zero of flexion) is `AutoMovieHumanNeutralTurn.straighten` of its bone
 * along the limb's line:
 *
 * - Arm: {@link AutoMovieHumanNeutralShoulder} (resting at the side),
 *   the elbow straight (the forearm on the arm's line),
 *   {@link AutoMovieHumanNeutralForearm} (thumbs forward) and the wrist straight
 *   (the hand on the forearm's line, before the forearm's twist).
 * - Thumb: {@link AutoMovieHumanNeutralThumbCmc} (toward the index
 *   metacarpal, clear of the hand), and its two hinges straight on
 *   the line it lies along.
 * - Fingers: {@link AutoMovieHumanNeutralKnuckle},
 *   its two interphalangeal hinges straight, the finger straight on the hand, parted by the
 *   least spread at which neighbours do not cross.
 * - Leg: {@link AutoMovieHumanNeutralHip} (the least abduction at which the
 *   thighs do not cross), the knee straight (the shank plumb under
 *   the knee) and
 *   {@link AutoMovieHumanNeutralAnkle} (the sole level, the foot straight ahead).
 * - Spine, neck, head, jaw, eyes, girdle: as they stand. A standing column is
 *   its own neutral, and the head is built in the Frankfort plane, so no
 *   reference says otherwise.
 *
 * The rig's rest stays the bind, since a skin has one rest frame: neutral is a
 * pose of the rig, and every clinical pose is a further pose of neutral.
 */
export namespace AutoMovieHumanNeutral {
  /** The chains of skin the neutral reads, so a caller samples no more. */
  export const READS: RegExp =
    /^(trunk|(leg|arm)\.(left|right)|hand\.(left|right)\.1|thumb\.(left|right)|finger\.(left|right)\.\w+)$/;

  /**
   * The chains of {@link READS} whose stations are heights (the level trunk):
   * the body lane's limbs and digits carry stations along their own axes, so
   * the neutral's reads at heights take only these, and the limb and digit
   * clearances fall back to their bind directions as for an absent chain.
   */
  export const LEVEL: RegExp = /^trunk$/;

  /** Share of the forearm's twist the wrist carries. */
  export const WRIST_TWIST: number = AutoMovieHumanNeutralForearm.WRIST_TWIST;

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
    joints: readonly IAutoMovieHumanJointCentres.IJoint[],
  ): IAutoMovieHumanNeutral.IFrame[] {
    const byBone: Map<string, IAutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: IAutoMovieHumanJointCentres.IJoint,
        ): [string, IAutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    return joints.map(
      (
        j: IAutoMovieHumanJointCentres.IJoint,
      ): IAutoMovieHumanNeutral.IFrame => {
        const d: AutoMovieVector3Tuple = Math3D.unit(
          Math3D.sub(j.toward, j.position),
        );
        return {
          bone: j.bone,
          parent: j.parent,
          centre: j.position,
          end: j.tip ?? j.toward,
          axes: Math3D.boneAxes(j.bone, d, byBone),
        };
      },
    );
  }

  /**
   * Derive neutral from the supplied rings and bind skeleton for this call.
   *
   * @param _calibration The body those source inputs describe.
   * @param source Its rings and bind skeleton, read once in this call.
   * @returns The neutral skeleton and its absolute turns.
   */
  export function of(
    _calibration: IAutoMovieHumanBodyCalibration,
    source: IAutoMovieHumanNeutral.OfSource,
  ): IAutoMovieHumanNeutral.IOutput {
    const { rings, joints }: IAutoMovieHumanNeutral.ISource = source();
    return derive(rings, joints);
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
    joints: readonly IAutoMovieHumanJointCentres.IJoint[],
  ): IAutoMovieHumanNeutral.IOutput {
    const body: IAutoMovieHumanNeutralBody =
      AutoMovieHumanNeutralTurn.body(joints);

    // Each joint's piece names the turn of the bone it owns, parent first.
    const named: Map<string, AutoMovieQuaternionTuple> = new Map();
    const resting: Map<string, number> = new Map();
    const forearms: Map<string, number> = new Map();
    for (const side of ["left", "right"] as const) {
      const shoulder: IAutoMovieHumanNeutralShoulder.IOutput =
        AutoMovieHumanNeutralShoulder.derive(body, rings, side);
      const straight: AutoMovieQuaternionTuple =
        AutoMovieHumanNeutralTurn.straighten(
          body,
          `${side}LowerArm`,
          shoulder.turn,
          shoulder.down,
        );
      const bent: AutoMovieQuaternionTuple =
        AutoMovieHumanNeutralTurn.straighten(
          body,
          `${side}Hand`,
          straight,
          shoulder.down,
        );
      const forearm: IAutoMovieHumanNeutralForearm.IOutput =
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
      const line: AutoMovieVector3Tuple = AutoMovieHumanNeutralThumbCmc.line(
        body,
        rings,
        side,
        forearm.hand,
      );
      const cmc: AutoMovieQuaternionTuple =
        AutoMovieHumanNeutralThumbCmc.derive(body, side, forearm.hand, line);
      const mcp: AutoMovieQuaternionTuple =
        AutoMovieHumanNeutralTurn.straighten(
          body,
          `${side}ThumbProximal`,
          cmc,
          line,
        );
      named.set(`${side}ThumbMetacarpal`, cmc);
      named.set(`${side}ThumbProximal`, mcp);
      named.set(
        `${side}ThumbDistal`,
        AutoMovieHumanNeutralTurn.straighten(
          body,
          `${side}ThumbDistal`,
          mcp,
          line,
        ),
      );

      // Each finger lies along the hand, the neighbours parted by the least
      // spread at which their skins do not cross.
      const lines: Map<string, AutoMovieVector3Tuple> =
        AutoMovieHumanNeutralKnuckle.lines(
          body,
          rings,
          side,
          forearm.hand,
          shoulder.down,
        );
      for (const finger of AutoMovieHumanNeutralKnuckle.FINGERS) {
        const along: AutoMovieVector3Tuple = lines.get(finger)!;
        const proximal: AutoMovieQuaternionTuple =
          AutoMovieHumanNeutralKnuckle.derive(
            body,
            side,
            finger,
            forearm.hand,
            along,
          );
        const middle: AutoMovieQuaternionTuple =
          AutoMovieHumanNeutralTurn.straighten(
            body,
            `${side}${finger}Intermediate`,
            proximal,
            along,
          );
        named.set(`${side}${finger}Proximal`, proximal);
        named.set(`${side}${finger}Intermediate`, middle);
        named.set(
          `${side}${finger}Distal`,
          AutoMovieHumanNeutralTurn.straighten(
            body,
            `${side}${finger}Distal`,
            middle,
            along,
          ),
        );
      }

      // The leg hangs at the least abduction at which the thighs do not
      // cross, by the shortest turn, keeping its forward knee.
      const hip: IAutoMovieHumanNeutralHip.IOutput =
        AutoMovieHumanNeutralHip.derive(body, rings, side);
      const thigh: AutoMovieQuaternionTuple = hip.turn;
      resting.set(`${side}UpperLeg`, hip.resting);
      named.set(`${side}UpperLeg`, thigh);
      named.set(
        `${side}LowerLeg`,
        AutoMovieHumanNeutralTurn.straighten(
          body,
          `${side}LowerLeg`,
          thigh,
          AutoMovieHumanNeutralTurn.DOWN,
        ),
      );
      named.set(`${side}Foot`, AutoMovieHumanNeutralAnkle.derive(body, side));
    }

    // Everything else rides its parent.
    const turns: Map<string, AutoMovieQuaternionTuple> = new Map();
    const places: Map<string, AutoMovieVector3Tuple> = new Map();
    for (const j of joints) {
      const parent: string | null = j.parent;
      const above: AutoMovieQuaternionTuple =
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
        (
          j: IAutoMovieHumanJointCentres.IJoint,
        ): IAutoMovieHumanJointCentres.IJoint => {
          const at: AutoMovieVector3Tuple = Math3D.add(places.get(j.bone)!, [
            0,
            fall,
            0,
          ]);
          const turn: AutoMovieQuaternionTuple = turns.get(j.bone)!;
          const moved: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
            p: AutoMovieVector3Tuple,
          ): AutoMovieVector3Tuple =>
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
