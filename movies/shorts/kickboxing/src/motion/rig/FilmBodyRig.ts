import { Quaternion, physicalShapeBounds } from "@automovie/engine";
import {
  AutoMovieHumanPhysicalFootPoints,
  type AutoMovieHumanSupportFrame,
  AutoMovieHumanRigControls as Controls,
  type IAutoMovieHumanParameters,
  type IAutoMovieHumanPose,
  AutoMovieHumanLimbIk as LimbIk,
  AutoMovieHumanPhysicalProfile as Provider,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { FilmVector as V } from "./FilmVector";
import { filmTrunkFromSegments } from "./filmTrunkFromSegments";

/** Film-space anatomical landmarks and equipment; clinical fitting and physical descriptions stay with Human. */
export class FilmBodyRig {
  /** The exact fixed body used by authoring and polygon display. */
  public readonly evaluate: Skeleton.PoseEvaluator;
  /** Neutral clinical geometry. */
  public readonly neutral: Skeleton.IOutput;
  /** Provider-owned SI description, including explicitly declared gloves. */
  public readonly profile: P;
  /** Complete declared sole population captured before scene-scoping collider identities. */
  public readonly solePoints: AutoMovieHumanSupportFrame.IPoint[];
  /** Actual left thigh/shank lengths used by authored support reach. */
  public readonly legLengths: readonly [number, number];
  /** Neutral shoulder-to-glove reach on each actual anatomical side, metres. */
  public readonly armReach: Record<Controls.Side, number>;
  /** Actual equipment centre beyond the wrist, shared by this film's symmetric gloves, metres. */
  public readonly handOffset: number;
  /** Neutral ankle-to-ball displacement, metres. */
  public readonly footVector: V.Value;
  /** Neutral ball-to-sole height derived from the actual physical foot boxes, metres. */
  public readonly ballHeight: number;
  /** Shared stateless clinical fitter. */
  private readonly fit: ReturnType<typeof LimbIk.prepare>;
  /** Compiled anatomical staging landmarks. */
  private readonly project: Skeleton.ProjectionEvaluator;
  public constructor(
    parameters: IAutoMovieHumanParameters,
    gloves: boolean = false,
    mass: number = 80,
  ) {
    const evaluate: Skeleton.PoseEvaluator = Skeleton.prepare(parameters);
    const reference: Skeleton.IOutput = evaluate({});
    const at: (bone: string) => Skeleton.IPlacement = (
      bone: string,
    ): Skeleton.IPlacement =>
      reference.posed.find(
        (placement: Skeleton.IPlacement): boolean => placement.bone === bone,
      )!;
    const equipment: Provider.IEquipment[] = gloves
      ? (["left", "right"] as const).map(
          (side: Controls.Side): Provider.IEquipment => {
            const hand: Skeleton.IPlacement = at(`${side}Hand`);
            const elbow: Skeleton.IPlacement = at(`${side}LowerArm`);
            const inverse: readonly [number, number, number, number] = [
              -hand.rotation[0],
              -hand.rotation[1],
              -hand.rotation[2],
              hand.rotation[3],
            ];
            const offset: V.Value = V.rotate(
              V.scale(V.normalize(V.sub(hand.position, elbow.position)), 0.065),
              inverse,
            );
            return {
              bone: `${side}Hand`,
              mass: 0.5,
              centerOfMass: V.vector(offset),
              inertia: { x: 0.001805, y: 0.001805, z: 0.001805 },
              shape: {
                id: `${side}-glove`,
                material: "glove",
                kind: "sphere",
                radius: 0.095,
                transform: {
                  position: V.vector(offset),
                  rotation: Quaternion.identity(),
                },
              },
            };
          },
        )
      : [];
    const prepared: ReturnType<typeof Provider.prepare> = Provider.prepare(
      parameters,
      {
        mass,
        frequency: 20,
        dampingRatio: 1,
        torquePerKg: 50,
        passiveRate: 5,
        equipment,
        skin: "skin",
        materials: [
          {
            id: "skin",
            friction: 0.7,
            restitution: 0,
            compliance: 0,
            damping: 0,
          },
          {
            id: "glove",
            friction: 0.4,
            restitution: 0,
            compliance: 0.0002,
            maximumCompression: 0.025,
            damping: 0.02,
          },
        ],
      },
      evaluate,
    );
    this.evaluate = prepared.evaluate;
    this.profile = prepared.profile;
    this.neutral = this.evaluate({});
    this.solePoints = AutoMovieHumanPhysicalFootPoints(this.profile);
    for (const segment of this.profile.segments)
      for (const shape of segment.shapes)
        shape.id = `${segment.bone}/${shape.id}`;
    this.fit = LimbIk.prepare(this.evaluate);
    this.legLengths = [
      V.distance(at("leftUpperLeg").position, at("leftLowerLeg").position),
      V.distance(at("leftLowerLeg").position, at("leftFoot").position),
    ];
    this.handOffset = equipment.length
      ? V.length(V.tuple(equipment[0]!.shape.transform.position))
      : 0;
    this.armReach = Object.fromEntries(
      (["left", "right"] as const).map(
        (side: Controls.Side): [Controls.Side, number] => [
          side,
          V.distance(
            at(`${side}UpperArm`).position,
            at(`${side}LowerArm`).position,
          ) +
            V.distance(
              at(`${side}LowerArm`).position,
              at(`${side}Hand`).position,
            ) +
            this.handOffset,
        ],
      ),
    ) as Record<Controls.Side, number>;
    this.footVector = V.sub(
      V.lerp(
        at("leftHalluxProximal").position,
        at("leftToe5Proximal").position,
        0.5,
      ),
      at("leftFoot").position,
    );
    this.ballHeight =
      (at("leftHalluxProximal").position[1] +
        at("leftToe5Proximal").position[1]) /
        2 -
      Math.min(
        ...this.profile.segments
          .filter((segment: P.ISegment): boolean =>
            ["leftFoot", "leftSubtalar", "leftMidfoot"].includes(segment.bone),
          )
          .flatMap((segment: P.ISegment): number[] =>
            segment.shapes.map(
              (shape: P.IShape): number =>
                physicalShapeBounds(segment.neutral, shape).min.y,
            ),
          ),
      );
    this.project = this.evaluate.project!(
      this.profile.segments.map((segment: P.ISegment): string => segment.bone),
    );
  }
  /** Delegate every limb solve; no numerical optimizer is implemented by the production. */
  public solve(request: FilmBodyRig.Request): FilmBodyRig.Result {
    /** Copy borrowed film tuples at the shared mutable-coordinate boundary. */
    const goals: (
      input: FilmBodyRig.Request["legs"],
    ) => LimbIk.IRequest["legs"] = (
      input: FilmBodyRig.Request["legs"],
    ): LimbIk.IRequest["legs"] =>
      input &&
      Object.fromEntries(
        Object.entries(input).map(
          ([side, goal]: [string, FilmBodyRig.Goal]): [
            string,
            LimbIk.IGoal,
          ] => [
            side,
            {
              point: [...goal.point],
              ...(goal.aim
                ? { aim: { ...goal.aim, point: [...goal.aim.point] } }
                : {}),
            },
          ],
        ),
      );
    return this.fit({
      ...request,
      root: {
        position: [...request.root.position],
        rotation: [...request.root.rotation],
      },
      legs: goals(request.legs),
      arms: goals(request.arms),
      handOffset: this.handOffset,
      limits: FilmBodyRig.limits,
    });
  }
  /** Resolve only this film's staging landmarks under its current authored actor frame. */
  public trunk(
    pose: IAutoMovieHumanPose,
    root: FilmBodyRig.Placement,
  ): FilmBodyRig.Trunk {
    const output: Skeleton.IProjection = this.project(pose);
    const at: (bone: string) => Skeleton.IPlacement = (
      bone: string,
    ): Skeleton.IPlacement =>
      output.posed.find(
        (placement: Skeleton.IPlacement): boolean => placement.bone === bone,
      )!;
    const world: (bone: string) => V.Value = (bone: string): V.Value =>
      V.add(root.position, V.rotate(at(bone).position, root.rotation));
    const segments: Record<string, P.ITransform> = Object.fromEntries(
      this.profile.segments.map(
        (segment: P.ISegment): [string, P.ITransform] => {
          const placement: Skeleton.IPlacement = at(segment.bone);
          const posedRotation: P.ITransform["rotation"] = Quaternion.multiply(
            {
              x: root.rotation[0],
              y: root.rotation[1],
              z: root.rotation[2],
              w: root.rotation[3],
            },
            {
              x: placement.rotation[0],
              y: placement.rotation[1],
              z: placement.rotation[2],
              w: placement.rotation[3],
            },
          );
          return [
            segment.bone,
            {
              position: V.vector(world(segment.bone)),
              rotation: posedRotation,
            },
          ];
        },
      ),
    );
    return filmTrunkFromSegments(segments, this.profile);
  }
}

/** Film-owned staging records; anatomical and numerical definitions are imported. */
export namespace FilmBodyRig {
  /** Actor's anatomical side. */ export type Side = Controls.Side;
  /** World root placement, metres and a unit quaternion. */ export interface Placement {
    /** Borrowed world metres. */
    position: V.Value; /** Borrowed unit rotation. */
    rotation: readonly [number, number, number, number];
  }
  /** World ankle/glove intent and optional anatomical aim. */ export interface Goal {
    /** Borrowed world target. */
    point: V.Value; /** Secondary anatomical witness. */
    aim?: {
      /** Witness kind. */ bone: "ball" | "knee" | "elbow";
      /** World metres. */ point: V.Value;
      /** Residual multiplier. */ weight: number;
    };
  }
  /** Shared fitting request with borrowed film-space coordinates. */ export interface Request extends Omit<
    LimbIk.IRequest,
    "root" | "legs" | "arms"
  > {
    /** Actor frame. */
    root: Placement; /** Ankle intentions. */
    legs?: Partial<Record<Side, Goal>>; /** Glove intentions. */
    arms?: Partial<Record<Side, Goal>>;
  }
  /** Actual fitted pose and final residual. */ export type Result = ReturnType<
    ReturnType<typeof LimbIk.prepare>
  >;
  /** Staging landmarks used by this bout's target resolver. */
  export interface Trunk {
    /** Skull base. */
    head: V.Value; /** Actual head collider envelope center used for protective guards. */
    headCenter: V.Value; /** Neck root. */
    neck: V.Value; /** Chest. */
    chest: V.Value; /** Pelvis. */
    hips: V.Value; /** Own shoulder centres. */
    shoulders: Record<Side, V.Value>; /** Own hip centres. */
    hipJoints: Record<Side, V.Value>; /** Chest world rotation. */
    chestRotation: readonly [number, number, number, number];
    /** Actual provider collider carriers under this same world root and clinical pose. */ segments: Readonly<
      Record<string, P.ITransform>
    >;
  }
  /** Authored comfort windows, narrower than Human ROM; these preserve the recorded bout's staging choices. */
  export const limits: NonNullable<LimbIk.IRequest["limits"]> =
    Object.fromEntries(
      (["left", "right"] as const).flatMap(
        (
          side: Side,
        ): [Controls.DegreeChannel, { minimum: number; maximum: number }][] =>
          (
            [
              ["legs", "hip.flexion", -17, 130],
              ["legs", "hip.abduction", -20, 40],
              ["legs", "hip.rotation", -45, 45],
              ["legs", "knee.flexion", 0, 139],
              ["legs", "ankle.dorsiflexion", -58, 13],
              ["arms", "shoulder.flexion", -60, 170],
              ["arms", "shoulder.abduction", -40, 180],
              ["arms", "shoulder.rotation", -70, 90],
              ["arms", "elbow.flexion", 0, 147],
            ] as const
          ).map(
            ([kind, joint, minimum, maximum]: readonly [
              "legs" | "arms",
              string,
              number,
              number,
            ]): [
              Controls.DegreeChannel,
              { minimum: number; maximum: number },
            ] => [
              Controls.channel(`${kind}.${side}.${joint}`),
              { minimum, maximum },
            ],
          ),
      ),
    );
}
