import {
  Quaternion,
  Vector3,
  type resolveAutoMovieRelationalGoal,
} from "@automovie/engine";
import {
  AutoMovieHumanLimbIk,
  AutoMovieHumanPhysicalPose,
  AutoMovieHumanPhysicalProfile,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
  type resolveAutoMovieHumanCalibration,
} from "@automovie/human";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IBoutPosture } from "../../../laws/kickboxing/IBoutPosture";
import type { IFighterMeasure } from "../../../laws/kickboxing/IFighterMeasure";
import { FighterGloves } from "./FighterGloves";
import { FighterSurfaces } from "./FighterSurfaces";
import type { IFighterProfile } from "./IFighterProfile";

/**
 * A fighter's body: his Human skeleton and physical profile with gloves, the
 * lengths his shapes scale from, the named regions an opponent strikes and
 * the weapon surfaces he strikes with, and the one evaluation that turns a
 * posture into a fitted clinical pose and world segments. Built once from
 * the settings record; a second fighter with identical body controls shares
 * the prepared skeleton.
 *
 * ```ts
 * const body = new FighterBody(fighterA);
 * const placed = body.place(posture, { origin, facing, feet });
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#build The 180 cm, 80 kg build from the profile's body controls and mass.
 * @evidence docs/body/settings/cast/fighter-a.md#hands Gloves on the hands as one rigid sphere each.
 * @evidence docs/research/kickboxing/techniques.md#surfaces The struck regions and weapon surfaces of the surfaces table.
 */
export class FighterBody {
  /** Human's clinical evaluator of this body. */
  public readonly evaluate: AutoMovieHumanSkeleton.PoseEvaluator;

  /** The physical profile with gloves, whose colliders contacts are measured on. */
  public readonly profile: P;

  /** Lengths measured on the neutral body. */
  public readonly measure: IFighterMeasure;

  /** Struck regions by id, as segment-local surface points. */
  public readonly regions: Readonly<
    Record<string, resolveAutoMovieRelationalGoal.IRegion>
  >;

  /** Weapon surfaces by surface name and side, as segment-local points and outward directions. */
  public readonly weapons: Readonly<Record<string, FighterSurfaces.IWeapon>>;

  /** Neutral clinical FK, the reference for completing fitted segments. */
  public readonly neutral: AutoMovieHumanSkeleton.IOutput;

  /** The glove centre's distance beyond the wrist, metres. */
  public readonly handOffset: number;

  private readonly fit: ReturnType<typeof AutoMovieHumanLimbIk.prepare>;

  /**
   * Build a fighter's body.
   *
   * @param profile His settings record.
   * @param shared A body already prepared from identical body controls, whose skeleton is reused.
   * @param calibration Human's body calibration of these controls, read from the artifact store; calibrated here when absent.
   */
  public constructor(
    profile: IFighterProfile,
    shared?: FighterBody,
    calibration?: Awaited<ReturnType<typeof resolveAutoMovieHumanCalibration>>,
  ) {
    if (
      shared &&
      JSON.stringify(shared.controls) !== JSON.stringify(profile.parameters)
    )
      throw new Error("A shared fighter body needs identical body controls");
    this.controls = profile.parameters;
    const skeleton: AutoMovieHumanSkeleton.PoseEvaluator =
      shared?.evaluate ??
      AutoMovieHumanSkeleton.prepare(
        profile.parameters,
        calibration ? { calibration } : {},
      );
    const reference: AutoMovieHumanSkeleton.IOutput = skeleton({});
    const at = (bone: string): AutoMovieHumanSkeleton.IPlacement =>
      reference.posed.find(
        (p: AutoMovieHumanSkeleton.IPlacement): boolean => p.bone === bone,
      )!;
    const v = (p: readonly number[]): IAutoMovieVector3 => ({
      x: p[0]!,
      y: p[1]!,
      z: p[2]!,
    });
    const prepared = AutoMovieHumanPhysicalProfile.prepare(
      profile.parameters,
      {
        mass: profile.mass,
        // Controller gains are required by the provider and unused by this
        // kinematic performance: one natural frequency, critical damping.
        frequency: 20,
        dampingRatio: 1,
        torquePerKg: 50,
        equipment: FighterGloves.equipment(reference),
        skin: "skin",
        materials: [
          {
            id: "skin",
            friction: 0.7,
            restitution: 0,
            compliance: 0,
            damping: 0,
          },
          // The kinematic performance measures contact geometrically, so the
          // glove's padding is not simulated as compliance.
          {
            id: "glove",
            friction: 0.4,
            restitution: 0,
            compliance: 0,
            damping: 0,
          },
        ],
      },
      skeleton,
    );
    this.evaluate = prepared.evaluate;
    this.profile = prepared.profile;
    this.neutral = reference;
    this.fit = shared?.fit ?? AutoMovieHumanLimbIk.prepare(this.evaluate);
    this.handOffset = FighterBody.HAND_LENGTH;
    const segment = (bone: string): P.ISegment =>
      this.profile.segments.find((s: P.ISegment): boolean => s.bone === bone)!;
    const head: P.ISegment = segment("head");
    const headShape: P.IShape = head.shapes[0]!;
    const headCentre: IAutoMovieVector3 = Vector3.add(
      head.neutral.position,
      Quaternion.rotateVector(
        head.neutral.rotation,
        headShape.transform.position,
      ),
    );
    const shoulder: IAutoMovieVector3 = v(at("leftUpperArm").position);
    const wrist: IAutoMovieVector3 = v(at("leftHand").position);
    const elbow: IAutoMovieVector3 = v(at("leftLowerArm").position);
    const hip: IAutoMovieVector3 = v(at("leftUpperLeg").position);
    const knee: IAutoMovieVector3 = v(at("leftLowerLeg").position);
    const ankle: IAutoMovieVector3 = v(at("leftFoot").position);
    this.measure = Object.freeze({
      hip: hip.y,
      hipHalfWidth: Math.abs(hip.z),
      shoulder: shoulder.y,
      shoulderHalfWidth: Math.abs(shoulder.z),
      head: headCentre.y,
      headRadius: radius(headShape),
      gloveRadius: FighterBody.GLOVE_RADIUS,
      armReach:
        Vector3.length(Vector3.subtract(elbow, shoulder)) +
        Vector3.length(Vector3.subtract(wrist, elbow)) +
        FighterBody.HAND_LENGTH,
      thigh: Vector3.length(Vector3.subtract(knee, hip)),
      shank: Vector3.length(Vector3.subtract(ankle, knee)),
      ankle: ankle.y,
      foot:
        (FighterBody.FOOT_SHARE * profile.parameters.body.anatomy.stature!) /
        1000,
    });
    const surfaces = FighterSurfaces.derive(this.profile);
    this.regions = surfaces.regions;
    this.weapons = surfaces.weapons;
  }

  /** The body controls this body was built from. */
  public readonly controls: IFighterProfile["parameters"];

  /** Glove radius, metres. */
  public static readonly GLOVE_RADIUS: number = FighterGloves.RADIUS;

  /** Wrist to the glove centre, metres. */
  public static readonly HAND_LENGTH: number = FighterGloves.HAND_LENGTH;

  /** Foot length as a share of stature (anthropometric convention: about 15%). */
  public static readonly FOOT_SHARE: number = 0.15;

  /**
   * Fit a posture: limb goals by Human's limb fitting from the posture's
   * channels, then the clinical FK and its world segments.
   *
   * @param posture The posture in his root frame.
   * @param frame The floor origin, the facing direction on the floor and the planted ankle points in the world.
   * @returns The clinical pose, its FK output in the evaluator frame, the root placement and the world segments.
   */
  public place(
    posture: IBoutPosture,
    frame: {
      origin: IAutoMovieVector3;
      facing: { x: number; z: number };
      feet: Record<"left" | "right", IAutoMovieVector3>;
    },
  ): FighterBody.IPlaced {
    const root = FighterBody.root(posture, frame.origin, frame.facing);
    const world = (p: IAutoMovieVector3): [number, number, number] => {
      const w: IAutoMovieVector3 = Vector3.add(
        root.floor,
        Quaternion.rotateVector(root.rotation, p),
      );
      return [w.x, w.y, w.z];
    };
    const tuple = (p: IAutoMovieVector3): [number, number, number] => [
      p.x,
      p.y,
      p.z,
    ];
    const prior: IAutoMovieHumanPose = {
      pelvis: posture.pelvis,
      spine: { thoracic: posture.thoracic, lumbar: posture.lumbar },
      neck: { cervical: posture.cervical },
      head: { jaw: { opening: Math.max(0, posture.jaw) } },
    };
    const leg = (side: "left" | "right") => {
      const lifted = posture.feet[side];
      if (!lifted) return { point: tuple(frame.feet[side]) };
      return {
        point: world(lifted.point),
        ...(lifted.knee
          ? {
              aim: {
                bone: "knee" as const,
                point: world(lifted.knee),
                weight: 1,
              },
            }
          : {}),
      };
    };
    const arm = (side: "left" | "right") => {
      const hand = posture.hands[side];
      return {
        point: world(hand.point),
        ...(hand.elbow
          ? {
              aim: {
                bone: "elbow" as const,
                point: world(hand.elbow),
                weight: 0.5,
              },
            }
          : {}),
      };
    };
    const fitted = this.fit({
      pose: prior,
      root: {
        position: tuple(root.position),
        rotation: [
          root.rotation.x,
          root.rotation.y,
          root.rotation.z,
          root.rotation.w,
        ],
      },
      legs: { left: leg("left"), right: leg("right") },
      arms: { left: arm("left"), right: arm("right") },
      handOffset: this.handOffset,
    });
    return {
      pose: fitted.pose,
      output: fitted.output,
      root: { position: root.position, rotation: root.rotation },
      segments: this.segments(fitted.output, root),
      error: fitted.error,
    };
  }

  /**
   * World segments of an FK output under a root placement.
   *
   * @param output Clinical FK in the evaluator frame.
   * @param root The evaluator origin's world placement.
   * @returns World transforms of every physical segment.
   */
  public segments(
    output: AutoMovieHumanSkeleton.IOutput,
    root: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
  ): Record<string, P.ITransform> {
    const result: Record<string, P.ITransform> = {};
    const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
      output.posed.map((p) => [p.bone, p]),
    );
    for (const segment of this.profile.segments) {
      const placement: AutoMovieHumanSkeleton.IPlacement = placements.get(
        segment.bone,
      )!;
      result[segment.bone] = {
        position: Vector3.add(
          root.position,
          Quaternion.rotateVector(root.rotation, {
            x: placement.position[0],
            y: placement.position[1],
            z: placement.position[2],
          }),
        ),
        rotation: Quaternion.multiply(root.rotation, q(placement.rotation)),
      };
    }
    return result;
  }

  /**
   * Complete world segments into every display bone, carrying fingers, face and toes with their nearest segment.
   *
   * @param output The clinical FK the segments came from.
   * @param root Its root placement.
   * @param segments World segments, possibly refitted.
   * @returns World placements of every bone, as the polygon figure reads them with an identity root.
   */
  public complete(
    output: AutoMovieHumanSkeleton.IOutput,
    root: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
    segments: Readonly<Record<string, P.ITransform>>,
  ): AutoMovieHumanSkeleton.IPlacement[] {
    const reference = {
      bones: output.bones.map((b) => ({ bone: b.bone, parent: b.parent })),
      posed: output.posed.map((p) => {
        const position: IAutoMovieVector3 = Vector3.add(
          root.position,
          Quaternion.rotateVector(root.rotation, {
            x: p.position[0],
            y: p.position[1],
            z: p.position[2],
          }),
        );
        const rotation: IAutoMovieQuaternion = Quaternion.multiply(
          root.rotation,
          q(p.rotation),
        );
        return {
          bone: p.bone,
          position: [position.x, position.y, position.z] as [
            number,
            number,
            number,
          ],
          rotation: [rotation.x, rotation.y, rotation.z, rotation.w] as [
            number,
            number,
            number,
            number,
          ],
        };
      }),
    };
    const complete = AutoMovieHumanPhysicalPose.complete({
      reference,
      segments,
    });
    return output.posed.map((p) => {
      const t: P.ITransform = complete[p.bone]!;
      const r: IAutoMovieQuaternion = Quaternion.normalize(t.rotation);
      return {
        bone: p.bone,
        position: [t.position.x, t.position.y, t.position.z],
        rotation: [r.x, r.y, r.z, r.w],
      };
    });
  }
}

/** Companion types and the root law of {@link FighterBody}. */
export namespace FighterBody {
  /** A fitted posture. */
  export interface IPlaced {
    /** The clinical pose. */
    pose: IAutoMovieHumanPose;

    /** Its FK in the evaluator frame. */
    output: AutoMovieHumanSkeleton.IOutput;

    /** The evaluator origin's world placement. */
    root: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };

    /** World transforms of the physical segments. */
    segments: Record<string, P.ITransform>;

    /** Largest unreached limb goal, metres. */
    error: number;
  }

  /**
   * The root of a posture: the floor point under the shifted stance origin,
   * the rotation of facing plus yaw, pitch and roll, and the evaluator
   * origin lowered by the drop through that rotation.
   *
   * @param posture The posture.
   * @param origin The stance origin on the floor.
   * @param facing The facing direction on the floor.
   * @returns The floor point, rotation and evaluator-origin position.
   */
  export function root(
    posture: IBoutPosture,
    origin: IAutoMovieVector3,
    facing: { x: number; z: number },
  ): {
    floor: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    position: IAutoMovieVector3;
  } {
    const heading: number = Math.atan2(-facing.z, facing.x);
    // The engine's axis-angle takes degrees.
    const degrees = (radians: number): number => (radians * 180) / Math.PI;
    const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      degrees(heading),
    );
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(yaw, {
      x: 1,
      y: 0,
      z: 0,
    });
    const left: IAutoMovieVector3 = Quaternion.rotateVector(yaw, {
      x: 0,
      y: 0,
      z: 1,
    });
    const floor: IAutoMovieVector3 = Vector3.add(
      origin,
      Vector3.add(
        Vector3.scale(forward, posture.shift.forward),
        Vector3.scale(left, posture.shift.left),
      ),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          degrees(heading + posture.yaw),
        ),
        Quaternion.multiply(
          Quaternion.fromAxisAngle(
            { x: 0, y: 0, z: 1 },
            degrees(-posture.pitch),
          ),
          Quaternion.fromAxisAngle(
            { x: 1, y: 0, z: 0 },
            degrees(-posture.roll),
          ),
        ),
      ),
    );
    return {
      floor,
      rotation,
      position: Vector3.add(
        floor,
        Quaternion.rotateVector(rotation, { x: 0, y: -posture.drop, z: 0 }),
      ),
    };
  }
}

/** A tuple quaternion as a record. */
function q(r: readonly number[]): IAutoMovieQuaternion {
  return { x: r[0]!, y: r[1]!, z: r[2]!, w: r[3]! };
}

/** The radius of a round collider. */
function radius(shape: P.IShape): number {
  if (shape.kind === "sphere" || shape.kind === "capsule") return shape.radius;
  throw new Error("The head collider is not round");
}
