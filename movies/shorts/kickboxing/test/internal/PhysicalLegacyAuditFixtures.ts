import {
  type AutoMoviePhysicsCache as Cache,
  type preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionGeometry as G,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

/** Adapt literal old audit inputs, without importing production code or inventing a simulated person's mass measurements. */
export namespace PhysicalLegacyAuditFixtures {
  /** Original world point tuple, metres. */
  export type Point = [number, number, number];
  /** Original requested endpoint. */
  export interface IGoal {
    /** Literal requested world endpoint, metres. */
    point: Point;
  }
  /** Captured complete displayed state used by the original auditor. */
  export interface IState {
    /** Displayed floor-corrected body origin. */
    root: { position: Point };
    /** Literal pre-floor-lift goals. */
    request: {
      root: { position: Point };
      legs?: Partial<Record<"left" | "right", IGoal>>;
      arms?: Partial<Record<"left" | "right", IGoal>>;
    };
    /** Authored support phase and facing declaration. */
    frame: { turn: number; legs: Record<"left" | "right", { kind: string }> };
    /** Displayed FK joint centres. */
    joints: [string, Point][];
    /** Original joint-sphere floor proxy radii, metres. */
    radii: [string, number][];
  }
  /** Recorded inputs and independently captured original maxima. */
  export interface IRecord {
    /** Original scalar maxima, metres/m/s/degrees as labelled. */
    audit: Record<string, { value: number | null }>;
    /** Full 2 Hz original displayed states. */
    frames: { seconds: number; bodies: Record<string, IState> }[];
    /** Literal intervals during which original limb overlaps are allowed. */
    overlapWindows: [number, number][];
  }
  /** Convert recorded metre coordinates at the generic consumer boundary. */
  export function vector(point: readonly number[]): IAutoMovieVector3 {
    return {
      x: point[0]!,
      y: point[1]!,
      z: point[2]!,
    };
  }

  /** Reproduce only the original joint-sphere floor witnesses; these are audit proxies, not an anthropometric provider. */
  export function geometry(state: IState): G {
    const radii: Map<string, number> = new Map(state.radii);
    const segments: G["segments"] = state.joints.map(
      ([bone]: (typeof state.joints)[number]): G["segments"][number] => {
        const radius: number = Math.min(radii.get(bone) ?? 0, 0.08);
        if (!(radius > 0))
          throw new Error(
            `Recorded floor proxy has no positive radius: ${bone}`,
          );
        return {
          bone,
          shapes: [
            {
              id: "recorded-floor-witness",
              kind: "sphere",
              radius,
              material: "proxy",
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: Quaternion.identity(),
              },
            },
          ],
        };
      },
    );
    return {
      segments,
      joints: [],
      materials: [{ id: "proxy", compliance: 0 }],
      witnesses: ["@actor-origin"],
    };
  }

  /** Supply actual displayed positions plus the explicitly recorded actor-origin measurement witness. */
  export function frame(row: IRecord["frames"][number]): Cache.IFrame {
    return {
      seconds: row.seconds,
      bodies: Object.fromEntries(
        Object.entries(row.bodies).map(
          ([id, body]: [string, IState]): [
            string,
            Record<string, Cache.ISegment>,
          ] => [
            id,
            Object.fromEntries(
              [
                ...body.joints,
                ["@actor-origin", body.root.position] as [string, Point],
              ].map(
                ([bone, point]: [string, Point]): [string, Cache.ISegment] => [
                  bone,
                  {
                    position: vector(point),
                    rotation: Quaternion.identity(),
                    velocity: { x: 0, y: 0, z: 0 },
                    angularVelocity: { x: 0, y: 0, z: 0 },
                  },
                ],
              ),
            ),
          ],
        ),
      ),
    };
  }

  /** Original capsule definitions measured from each recorded displayed FK, queried by the shared exact convex kernel. */
  export function capsules(
    id: string,
    state: IState,
  ): { collider: Geometry.ICollider; trunk: boolean }[] {
    const joints: Map<string, Point> = new Map(state.joints);
    const at: (bone: string) => IAutoMovieVector3 = (
      bone: string,
    ): IAutoMovieVector3 => vector(joints.get(bone)!);
    const definitions: {
      bone: string;
      from: IAutoMovieVector3;
      to: IAutoMovieVector3;
      radius: number;
      trunk: boolean;
    }[] = [
      {
        bone: "pelvis-chest",
        from: at("hips"),
        to: at("chest"),
        radius: 0.14,
        trunk: true,
      },
      {
        bone: "chest-neck",
        from: at("chest"),
        to: at("neck"),
        radius: 0.13,
        trunk: true,
      },
      {
        bone: "head",
        from: at("head"),
        to: Vector3.add(at("head"), { x: 0, y: 0.1, z: 0 }),
        radius: 0.1,
        trunk: true,
      },
    ];
    for (const side of ["left", "right"] as const) {
      const hand: IAutoMovieVector3 = at(`${side}Hand`);
      const glove: IAutoMovieVector3 = Vector3.add(
        hand,
        Vector3.scale(
          Vector3.normalize(Vector3.subtract(hand, at(`${side}LowerArm`))),
          0.065,
        ),
      );
      definitions.push(
        {
          bone: `${side}-upper-arm`,
          from: at(`${side}UpperArm`),
          to: at(`${side}LowerArm`),
          radius: 0.05,
          trunk: false,
        },
        {
          bone: `${side}-forearm`,
          from: at(`${side}LowerArm`),
          to: hand,
          radius: 0.045,
          trunk: false,
        },
        {
          bone: `${side}-glove`,
          from: glove,
          to: glove,
          radius: 0.095,
          trunk: false,
        },
        {
          bone: `${side}-thigh`,
          from: at(`${side}UpperLeg`),
          to: at(`${side}LowerLeg`),
          radius: 0.075,
          trunk: false,
        },
        {
          bone: `${side}-shin`,
          from: at(`${side}LowerLeg`),
          to: at(`${side}Foot`),
          radius: 0.05,
          trunk: false,
        },
      );
    }
    return definitions.map(
      (
        definition: (typeof definitions)[number],
      ): { collider: Geometry.ICollider; trunk: boolean } => {
        const delta: IAutoMovieVector3 = Vector3.subtract(
          definition.to,
          definition.from,
        );
        const length: number = Vector3.length(delta);
        const direction: IAutoMovieVector3 =
          length > 0 ? Vector3.scale(delta, 1 / length) : { x: 0, y: 1, z: 0 };
        const rotation: P.ITransform["rotation"] =
          direction.y < -1 + 1e-10
            ? { x: 1, y: 0, z: 0, w: 0 }
            : Quaternion.normalize({
                x: direction.z,
                y: 0,
                z: -direction.x,
                w: 1 + direction.y,
              });
        return {
          trunk: definition.trunk,
          collider: {
            body: id,
            bone: definition.bone,
            pose: {
              position: Vector3.scale(
                Vector3.add(definition.from, definition.to),
                0.5,
              ),
              rotation,
            },
            shape: {
              id: "recorded-overlap-witness",
              kind: "capsule" as const,
              material: "proxy",
              radius: definition.radius,
              halfLength: length / 2,
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: Quaternion.identity(),
              },
            },
          },
        };
      },
    );
  }
}
