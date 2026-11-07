import { Quaternion, Vector3 } from "@automovie/engine";
import {
  AutoMovieHumanLimbIk,
  AutoMovieHumanPhysicalProfile,
  AutoMovieHumanSex,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IBoutPosture } from "../../../laws/kickboxing/IBoutPosture";
import type { IFighterMeasure } from "../../../laws/kickboxing/IFighterMeasure";

/**
 * The referee's body: his own Human skeleton at 178 cm and 76 kg with a
 * regular build and bare hands, the lengths his shapes scale from, and the
 * evaluation that turns his posture into a clinical pose and world segments.
 *
 * ```ts
 * const body = new RefereeBody();
 * body.place(posture, { origin, facing, feet });
 * ```
 *
 * @evidence docs/body/settings/cast/referee.md#build 178 cm, 76 kg, a regular athletic build on his own polygon figure.
 * @evidence docs/body/settings/cast/referee.md#no-props Bare hands, nothing carried.
 */
export class RefereeBody {
  /** Human's clinical evaluator of this body. */
  public readonly evaluate: AutoMovieHumanSkeleton.PoseEvaluator;

  /** His physical profile, for the review overlay. */
  public readonly profile: P;

  /** Lengths measured on the neutral body; no gloves. */
  public readonly measure: IFighterMeasure;

  /** Neutral clinical FK. */
  public readonly neutral: AutoMovieHumanSkeleton.IOutput;

  private readonly fit: ReturnType<typeof AutoMovieHumanLimbIk.prepare>;

  /** Body controls realizing his build: 178 cm, a regular rather than athletic trunk; head and face at the Human adult male defaults. */
  public static readonly PARAMETERS: IAutoMovieHumanParameters = {
    body: {
      anatomy: {
        sex: AutoMovieHumanSex.Male,
        stature: 1780,
        chestCircumference: 990,
        acrossBackShoulderWidth: 440,
        waistCircumference: 840,
        hipCircumference: 980,
        neckCircumference: 390,
        upperArmCircumference: 325,
        thighCircumference: 550,
      },
    },
    head: {
      length: 195,
      cephalicIndex: 78,
      circumference: 575,
      height: 230,
      faceHeight: 120,
      faceWidth: 145,
      mandibularWidth: 110,
      minimumFrontalWidth: 110,
      mouthOpening: 48,
      mandibularLaterotrusion: 10,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
          right: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
        },
        intercanthalWidth: 33,
        nose: { width: 36, height: 52, protrusion: 20 },
        mouth: { width: 50, upperVermilionHeight: 7, lowerVermilionHeight: 9 },
      },
      earPair: {
        left: { length: 66, breadth: 29, protrusion: 18 },
        right: { length: 66, breadth: 29, protrusion: 18 },
      },
    },
  };

  /** His mass, kilograms. */
  public static readonly MASS: number = 76;

  /** Build his body. */
  public constructor() {
    const prepared = AutoMovieHumanPhysicalProfile.prepare(RefereeBody.PARAMETERS, {
      mass: RefereeBody.MASS,
      // Required by the provider, unused by this kinematic performance.
      frequency: 20,
      dampingRatio: 1,
      torquePerKg: 50,
      equipment: [],
      skin: "skin",
      materials: [{ id: "skin", friction: 0.7, restitution: 0, compliance: 0, damping: 0 }],
    });
    this.evaluate = prepared.evaluate;
    this.profile = prepared.profile;
    this.neutral = this.evaluate({});
    this.fit = AutoMovieHumanLimbIk.prepare(this.evaluate);
    const at = (bone: string): IAutoMovieVector3 => {
      const p = this.neutral.posed.find((x) => x.bone === bone)!.position;
      return { x: p[0], y: p[1], z: p[2] };
    };
    const head: P.ISegment = this.profile.segments.find((s) => s.bone === "head")!;
    const shape: P.IShape = head.shapes[0]!;
    const centre: IAutoMovieVector3 = Vector3.add(head.neutral.position, Quaternion.rotateVector(head.neutral.rotation, shape.transform.position));
    const length = (a: string, b: string): number => Vector3.length(Vector3.subtract(at(a), at(b)));
    this.measure = Object.freeze({
      hip: at("leftUpperLeg").y,
      hipHalfWidth: Math.abs(at("leftUpperLeg").z),
      shoulder: at("leftUpperArm").y,
      shoulderHalfWidth: Math.abs(at("leftUpperArm").z),
      head: centre.y,
      headRadius: shape.kind === "sphere" || shape.kind === "capsule" ? shape.radius : 0,
      gloveRadius: 0,
      armReach: length("leftUpperArm", "leftLowerArm") + length("leftLowerArm", "leftHand"),
      thigh: length("leftUpperLeg", "leftLowerLeg"),
      shank: length("leftLowerLeg", "leftFoot"),
      ankle: at("leftFoot").y,
      foot: 0.15 * 1.78,
    });
  }

  /**
   * Fit a posture into a clinical pose and world segments.
   *
   * @param posture His posture.
   * @param frame The floor origin, facing and planted ankle points.
   * @returns The FK output, root and world segments.
   */
  public place(
    posture: IBoutPosture,
    frame: { origin: IAutoMovieVector3; facing: { x: number; z: number }; feet: Record<"left" | "right", IAutoMovieVector3> },
  ): { output: AutoMovieHumanSkeleton.IOutput; root: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }; segments: Record<string, P.ITransform> } {
    const heading: number = Math.atan2(-frame.facing.z, frame.facing.x);
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading + posture.yaw);
    const position: IAutoMovieVector3 = Vector3.add(frame.origin, { x: 0, y: -posture.drop, z: 0 });
    const world = (p: IAutoMovieVector3): [number, number, number] => {
      const w: IAutoMovieVector3 = Vector3.add(frame.origin, Quaternion.rotateVector(rotation, p));
      return [w.x, w.y, w.z];
    };
    const fitted = this.fit({
      pose: {
        spine: { thoracic: posture.thoracic, lumbar: posture.lumbar },
        neck: { cervical: posture.cervical },
        head: { jaw: { opening: Math.max(0, posture.jaw) } },
      },
      root: { position: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] },
      legs: {
        left: { point: [frame.feet.left.x, frame.feet.left.y, frame.feet.left.z] },
        right: { point: [frame.feet.right.x, frame.feet.right.y, frame.feet.right.z] },
      },
      arms: { left: { point: world(posture.hands.left.point) }, right: { point: world(posture.hands.right.point) } },
    });
    const segments: Record<string, P.ITransform> = {};
    const placements = new Map(fitted.output.posed.map((p) => [p.bone, p]));
    for (const segment of this.profile.segments) {
      const p = placements.get(segment.bone)!;
      segments[segment.bone] = {
        position: Vector3.add(position, Quaternion.rotateVector(rotation, { x: p.position[0], y: p.position[1], z: p.position[2] })),
        rotation: Quaternion.multiply(rotation, { x: p.rotation[0], y: p.rotation[1], z: p.rotation[2], w: p.rotation[3] }),
      };
    }
    return { output: fitted.output, root: { position, rotation }, segments };
  }
}
