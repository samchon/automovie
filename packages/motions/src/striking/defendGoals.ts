import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDefend,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingStance } from "./StrikingStance";

/** The alternatives of `AtArmResult`'s site. */
type AtArmResult = "leftArm" | "rightArm";

/**
 * Where a defence brings its arms and its checking leg: goals on the defender's
 * own body, read from the posture the body holds at that instant and from the
 * line the defender saw the weapon come in on.
 *
 * - `cover`: the glove on the incoming line just in front of the region, where
 *   the weapon will pass, not merely on the region's own normal, the elbow
 *   low.
 * - `parry`: the glove opposite the weapon's side on the line 0.6 forearm lengths
 *   ahead of the region, half a fist across it.
 * - `elbowBlock`: the glove two forearm radii off the jaw on the attacked side,
 *   the elbow over the struck region.
 * - `highBlock`: the glove two forearm radii off the temple and 0.3 forearm
 *   lengths above it, the elbow out along the temple's normal.
 * - `check`: the knee up, back toward the kick and out, the shin hanging under
 *   it, the foot dorsiflexed.
 * - `slip`, `roll`, `sway`: no limb goal, the gloves keep their guard.
 *
 * The shares of segment lengths are provisional readings of the coaching
 * descriptions the defence law cites.
 */
export namespace defendGoals {
  /** What the defender saw of the strike at its read second. */
  export interface ISight {
    /** The unit world direction from the weapon to the struck region. */
    incoming: IAutoMovieVector3;

    /** The unit horizontal world direction across the incoming line. */
    across: IAutoMovieVector3;

    /** The sign along `across` that leads outside the weapon: +1 or -1. */
    outside: number;

    /** The defender's side the struck region lies on. */
    attackedSide: AutoMovieHumanSide;
  }

  /** The inputs of one instant's goals. */
  export interface IProps {
    /** The defender's body. */
    body: IAutoMovieMotionHumanBody;

    /** The defender's posture at the instant, before its limb goals. */
    posture: IAutoMovieMotionHumanPosture;

    /** The defence. */
    kind: IAutoMovieMotionHumanDefend.IParams["kind"];

    /** The struck region. */
    region: AutoMovieHumanoidRegion;

    /** The strike's own point within the region, when it declares one. */
    aimed: IAutoMovieMotionHumanActionPlan["aimed"];

    /** What the defender saw. */
    sight: ISight;

    /**
     * This exact body's posture's trunk bones, borrowed within the current
     * synchronous evaluation when already resolved.
     */
    bones?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * This exact body's fixed region/tangent frame, when already prepared by
     * the defence's geometry.
     */
    frame?: ReturnType<typeof StrikingBody.frame>;
  }

  /**
   * The limb goals of a defence at full movement.
   *
   * @param props The instant's inputs.
   * @returns The goals of the limbs the defence moves; the others keep theirs.
   */
  export function at(
    props: IProps,
  ): Partial<IAutoMovieMotionHumanPosture["limbs"]> {
    if (props.kind === "slip" || props.kind === "roll" || props.kind === "sway")
      return {};
    const { body, sight } = props;
    const { incoming, across, outside, attackedSide } = sight;
    const m = body.measure;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const fist: number = StrikingQuality.fist(m.hand);
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      props.bones ?? StrikingBody.trunk(body, props.posture);
    let centre: IAutoMovieVector3 | undefined;
    const regionPoint: () => IAutoMovieVector3 = (): IAutoMovieVector3 => {
      if (centre !== undefined) return centre;
      if (props.frame === undefined) {
        const frame: IAutoMovieHumanoidSurfaces.IFrame = StrikingBody.frame(
          body,
          props.region,
          props.aimed,
        );
        centre = resolveAutoMovieHumanoidSurfaces.point(
          frame,
          bones.get(frame.bone)!,
        );
      } else
        centre = resolveAutoMovieHumanoidSurfaces.point(
          props.frame,
          bones.get(props.frame.bone)!,
        );
      return centre;
    };
    let placed: ReturnType<typeof StrikingBody.region> | undefined;
    const region: () => ReturnType<typeof StrikingBody.region> = (): ReturnType<
      typeof StrikingBody.region
    > =>
      (placed ??=
        props.frame === undefined
          ? StrikingBody.region(body, bones, props.region, props.aimed)
          : resolveAutoMovieHumanoidSurfaces.place(
              props.frame,
              bones.get(props.frame.bone)!,
            ));
    const glove = (
      side: AutoMovieHumanSide,
      at: IAutoMovieVector3,
      elbow: IAutoMovieVector3,
    ): IAutoMovieHumanLimbGoal => StrikingStance.glove(body, side, at, elbow);
    const shoulder = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      bones.get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition;
    const toward: IAutoMovieVector3 = Vector3.normalize({
      x: -incoming.x,
      y: 0,
      z: -incoming.z,
    });
    const low = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      Vector3.add(
        shoulder(side),
        Vector3.add(
          Vector3.scale(up, -0.8 * m.upperArm),
          Vector3.scale(toward, 0.5 * m.upperArm),
        ),
      );
    const out: Partial<IAutoMovieMotionHumanPosture["limbs"]> = {};
    const arm = (side: AutoMovieHumanSide): AtArmResult =>
      side === "left" ? "leftArm" : "rightArm";
    const cover = (side: AutoMovieHumanSide): void => {
      // The glove on the incoming line just in front of the region, where
      // the weapon will pass, not merely on the region's own normal.
      const at: IAutoMovieVector3 = Vector3.subtract(
        regionPoint(),
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
        const side: AutoMovieHumanSide = outside > 0 ? "left" : "right";
        const meet: IAutoMovieVector3 = Vector3.add(
          Vector3.subtract(
            regionPoint(),
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
            region().point,
            Vector3.scale(region().normal, 0.5 * m.upperArm),
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
    }
    return out;
  }
}
