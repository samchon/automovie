import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingStance } from "./StrikingStance";
import type { defend } from "./defend";

/**
 * Where a defence brings its arms and its checking leg: goals on the
 * defender's own body, read from the posture the body holds at that instant
 * and from the line the defender saw the weapon come in on.
 *
 * - `cover`: the glove on the incoming line just in front of the region,
 *   where the weapon will pass, not merely on the region's own normal, the
 *   elbow low.
 * - `parry`: the glove opposite the weapon's side on the line 0.6 forearm
 *   lengths ahead of the region, half a fist across it.
 * - `elbowBlock`: the glove two forearm radii off the jaw on the attacked
 *   side, the elbow over the struck region.
 * - `highBlock`: the glove two forearm radii off the temple and 0.3 forearm
 *   lengths above it, the elbow out along the temple's normal.
 * - `check`: the knee up, back toward the kick and out, the shin hanging
 *   under it, the foot dorsiflexed.
 * - `slip`, `roll`, `sway`: no limb goal, the gloves keep their guard.
 *
 * The shares of segment lengths are provisional readings of the coaching
 * descriptions the defence law cites.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's goal and that the segment shares are provisional.
 * @evidence contracts/development/design.md#principled-representation Limb goals as world points in metres and world rotations, read from the trunk's own forward kinematics at the given posture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sight record, the inputs and the one function the defence's geometry reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture's goal type, the defence's kind union and the body's surface regions.
 */
export namespace defendGoals {
  /**
   * What the defender saw of the strike at its read second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
   * @evidence contracts/development/design.md#principled-representation World unit vectors, a sign and a closed side union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four values the goals and the evasions read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the vector type.
   */
  export interface ISight {
    /** The unit world direction from the weapon to the struck region. */
    incoming: IAutoMovieVector3;

    /** The unit horizontal world direction across the incoming line. */
    across: IAutoMovieVector3;

    /** The sign along `across` that leads outside the weapon: +1 or -1. */
    outside: number;

    /** The defender's side the struck region lies on. */
    attackedSide: "left" | "right";
  }

  /**
   * The inputs of one instant's goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   * @evidence contracts/development/design.md#principled-representation The body, its posture at the instant, the defence's kind, the struck region with the strike's own point in it, and the sight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the goals read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the body, posture, kind, region and plan types.
   */
  export interface IProps {
    /** The defender's body. */
    body: IHumanBody;

    /** The defender's posture at the instant, before its limb goals. */
    posture: IHumanPosture;

    /** The defence. */
    kind: defend.IParams["kind"];

    /** The struck region. */
    region: AutoMovieHumanoidRegion;

    /** The strike's own point within the region, when it declares one. */
    aimed: IHumanActionPlan["aimed"];

    /** What the defender saw. */
    sight: ISight;
  }

  /**
   * The limb goals of a defence at full movement.
   *
   * @param props The instant's inputs.
   * @returns The goals of the limbs the defence moves; the others keep theirs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result; the namespace states each kind's goal.
   * @evidence contracts/development/implementation.md#principled-implementation Each goal is placed on the defender's own posed trunk and the seen incoming line, so it follows the body's evasion and the strike's aim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared points first, then one exhaustive switch over the kinds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The segment shares are documented provisional values; no body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk forward-kinematics pass and constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of the instant's posture, which changes each instant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record and retains nothing.
   */
  export function at(props: IProps): Partial<IHumanPosture["limbs"]> {
    const { body, sight } = props;
    const { incoming, across, outside, attackedSide } = sight;
    const m = body.measure;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const fist: number = StrikingQuality.fist(m.hand);
    const bones = StrikingBody.trunk(body, props.posture);
    const region = StrikingBody.region(body, bones, props.region, props.aimed);
    const glove = (
      side: "left" | "right",
      at: IAutoMovieVector3,
      elbow: IAutoMovieVector3,
    ): IHumanPosture.IGoal => StrikingStance.glove(body, side, at, elbow);
    const shoulder = (side: "left" | "right"): IAutoMovieVector3 =>
      bones.get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition;
    const toward: IAutoMovieVector3 = Vector3.normalize({
      x: -incoming.x,
      y: 0,
      z: -incoming.z,
    });
    const low = (side: "left" | "right"): IAutoMovieVector3 =>
      Vector3.add(
        shoulder(side),
        Vector3.add(
          Vector3.scale(up, -0.8 * m.upperArm),
          Vector3.scale(toward, 0.5 * m.upperArm),
        ),
      );
    const out: Partial<IHumanPosture["limbs"]> = {};
    const arm = (side: "left" | "right"): "leftArm" | "rightArm" =>
      side === "left" ? "leftArm" : "rightArm";
    const cover = (side: "left" | "right"): void => {
      // The glove on the incoming line just in front of the region, where
      // the weapon will pass, not merely on the region's own normal.
      const at: IAutoMovieVector3 = Vector3.subtract(
        region.point,
        Vector3.scale(incoming, m.forearmRadius + 2 * fist),
      );
      out[arm(side)] = glove(side, at, low(side));
    };
    switch (props.kind) {
      case "cover":
        if (/Left$|Right$/.test(props.region)) cover(attackedSide);
        else {
          cover("left");
          cover("right");
        }
        break;
      case "parry": {
        const side: "left" | "right" = outside > 0 ? "left" : "right";
        const meet: IAutoMovieVector3 = Vector3.add(
          Vector3.subtract(
            region.point,
            Vector3.scale(incoming, 0.6 * m.forearm),
          ),
          Vector3.scale(across, -outside * 0.5 * fist),
        );
        out[arm(side)] = glove(side, meet, low(side));
        break;
      }
      case "elbowBlock": {
        const jaw = StrikingBody.region(
          body,
          bones,
          attackedSide === "left" ? "jawLeft" : "jawRight",
        );
        const at: IAutoMovieVector3 = Vector3.add(
          jaw.point,
          Vector3.scale(jaw.normal, 2 * m.forearmRadius),
        );
        out[arm(attackedSide)] = glove(
          attackedSide,
          at,
          Vector3.add(
            region.point,
            Vector3.scale(region.normal, 0.5 * m.upperArm),
          ),
        );
        break;
      }
      case "highBlock": {
        const temple = StrikingBody.region(
          body,
          bones,
          attackedSide === "left" ? "templeLeft" : "templeRight",
        );
        const at: IAutoMovieVector3 = Vector3.add(
          Vector3.add(
            temple.point,
            Vector3.scale(temple.normal, 2 * m.forearmRadius),
          ),
          Vector3.scale(up, 0.3 * m.forearm),
        );
        const elbow: IAutoMovieVector3 = Vector3.add(
          shoulder(attackedSide),
          Vector3.add(
            Vector3.scale(temple.normal, m.upperArm),
            Vector3.scale(Vector3.scale(incoming, -1), 0.3 * m.upperArm),
          ),
        );
        out[arm(attackedSide)] = glove(attackedSide, at, elbow);
        break;
      }
      case "check": {
        const hip: IAutoMovieVector3 = bones.get(
          `${attackedSide}UpperLeg` as AutoMovieHumanoidBone,
        )!.worldPosition;
        const forward: IAutoMovieVector3 = Vector3.normalize({
          x: -incoming.x,
          y: 0,
          z: -incoming.z,
        });
        const sideways: IAutoMovieVector3 = Vector3.scale(across, outside);
        const knee: IAutoMovieVector3 = Vector3.add(
          hip,
          Vector3.scale(
            Vector3.normalize(
              Vector3.add(
                Vector3.add(
                  Vector3.scale(forward, -0.55),
                  Vector3.scale(up, 0.7),
                ),
                Vector3.scale(sideways, -0.35),
              ),
            ),
            m.thigh,
          ),
        );
        const ankle: IAutoMovieVector3 = Vector3.add(
          knee,
          Vector3.scale(
            Vector3.normalize(
              Vector3.add(
                Vector3.scale(up, -0.9),
                Vector3.scale(forward, -0.2),
              ),
            ),
            m.shank,
          ),
        );
        const rotation: IAutoMovieQuaternion = StrikingBody.foot(
          Vector3.normalize(
            Vector3.add(Vector3.scale(forward, -0.6), Vector3.scale(up, 0.8)),
          ),
          forward,
        );
        out[attackedSide === "left" ? "leftLeg" : "rightLeg"] = {
          point: ankle,
          bend: Vector3.add(knee, Vector3.scale(forward, -0.2)),
          rotation,
        };
        break;
      }
      case "slip":
      case "roll":
      case "sway":
        // Evasions move the whole body; the gloves keep their guard.
        break;
    }
    return out;
  }
}
