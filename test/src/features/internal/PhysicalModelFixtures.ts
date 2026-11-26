import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { createAutoMovieStickman } from "./createAutoMovieStickman";
import { makeProp } from "./makeProp";
import { material } from "./material";
import { primitivePart } from "./primitivePart";

/** Existing model consumer and a species-neutral four-support primitive assembly. */
export namespace PhysicalModelFixtures {
  /** The existing thirteen-part model, with all masses and joints derived by Engine. */
  export function stickman(): { model: IAutoMovieModel; profile: P } {
    const model: IAutoMovieModel = createAutoMovieStickman({
      id: "physical-stickman",
      height: 1.8,
      headRadius: 0.12,
      limbRadius: 0.04,
      material: material("solid"),
    });
    const profile: P = AutoMovieEnginePhysics.derivePhysicalProfile(model, {
      density: 1000,
      densities: {},
      material: "solid",
      materials: [
        {
          id: "solid",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      actuator: {
        frequency: 20,
        dampingRatio: 1,
        torquePerKg: 50,
        passiveRate: 5,
      },
      provenance:
        "Existing schematic stickman primitive parts, uniform declared density, canonical rig angular constraints; caller-declared passive joint friction.",
    });
    return { model, profile };
  }
  /**
   * The four-support primitive's stance knee flexion, radians: 45 degrees
   * keeps each two-link leg's Jacobian well conditioned (condition number
   * about 6 for equal links, against 9.4 at 30 degrees and a singular
   * straight leg, which cannot shift vertical load between its feet by joint
   * torque), as balancing legs stand with bent knees.
   */
  const KNEE: number = Math.PI / 4;

  /** Four two-link legs and feet permit a genuine recovery step; primitive masses total eight kilograms. */
  export function quadrupod(): P {
    const component: (
      bone: string,
      dimensions: [number, number, number],
      position: IAutoMovieRigidTransform["position"],
      density: number,
      rotation?: IAutoMovieRigidTransform["rotation"],
    ) => IAutoMoviePhysicalSegment = (
      bone: string,
      dimensions: [number, number, number],
      position: IAutoMovieVector3,
      density: number,
      rotation: IAutoMovieRigidTransform["rotation"] = {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      },
    ): IAutoMoviePhysicalSegment => {
      const model: IAutoMovieModel = makeProp([
        primitivePart(bone, {
          type: "box",
          width: dimensions[0],
          height: dimensions[1],
          depth: dimensions[2],
        }),
      ]);
      const profile: P = AutoMovieEnginePhysics.derivePhysicalProfile(model, {
        density,
        densities: {},
        material: "solid",
        materials: [
          {
            id: "solid",
            friction: 0.8,
            restitution: 0,
            compliance: 0,
            damping: 0,
          },
        ],
        joints: [],
        provenance: "Analytic uniform solid box with declared density.",
      });
      return {
        ...profile.segments[0]!,
        bone,
        neutral: { position, rotation },
      };
    };
    // Each leg bends its knee outward along z by KNEE, thigh and shank each
    // leaning half of it, so its ankle stays under its hip and the body
    // stands lower by the legs' shortening.
    const LINK: number = 0.45;
    const lean: number = KNEE / 2;
    const drop: number = 2 * LINK * (1 - Math.cos(lean));
    const turn = (angle: number): IAutoMovieRigidTransform["rotation"] => ({
      x: Math.sin(angle / 2),
      y: 0,
      z: 0,
      w: Math.cos(angle / 2),
    });
    const root: IAutoMoviePhysicalSegment = component(
      "body",
      [0.7, 0.2, 0.6],
      { x: 0, y: 1.05 - drop, z: 0 },
      4 / (0.7 * 0.2 * 0.6),
    );
    const anchors: Map<string, IAutoMovieVector3> = new Map();
    const supports: IAutoMoviePhysicalSegment[] = Array.from(
      { length: 4 },
      (_: unknown, index: number): IAutoMoviePhysicalSegment[] => {
        const x: number = index < 2 ? 0.35 : -0.35;
        const z: number = index % 2 === 0 ? 0.3 : -0.3;
        const side: number = Math.sign(z);
        const hip: IAutoMovieVector3 = { x, y: 1 - drop, z };
        const knee: IAutoMovieVector3 = {
          x,
          y: hip.y - LINK * Math.cos(lean),
          z: z + side * LINK * Math.sin(lean),
        };
        const ankle: IAutoMovieVector3 = { x, y: 0.1, z };
        anchors.set(`upper-${index}`, hip);
        anchors.set(`lower-${index}`, knee);
        anchors.set(`support-${index}`, ankle);
        return [
          component(
            `upper-${index}`,
            [0.1, LINK, 0.1],
            {
              x,
              y: (hip.y + knee.y) / 2,
              z: (hip.z + knee.z) / 2,
            },
            0.4 / (0.1 * LINK * 0.1),
            turn(-side * lean),
          ),
          component(
            `lower-${index}`,
            [0.1, LINK, 0.1],
            {
              x,
              y: (knee.y + ankle.y) / 2,
              z: (knee.z + ankle.z) / 2,
            },
            0.4 / (0.1 * LINK * 0.1),
            turn(side * lean),
          ),
          component(
            `support-${index}`,
            [0.24, 0.1, 0.2],
            { x, y: 0.05, z },
            0.2 / (0.24 * 0.1 * 0.2),
          ),
        ];
      },
    ).flat();
    const segments: IAutoMoviePhysicalSegment[] = [root, ...supports];
    // Each joint's frames meet at its anchor and agree with the world at the
    // neutral stance, so the bent stance is every joint's zero.
    const frame = (
      segment: IAutoMoviePhysicalSegment,
      anchor: IAutoMovieVector3,
    ): IAutoMovieRigidTransform => {
      const inverse: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
        segment.neutral.rotation,
      );
      return {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(anchor, segment.neutral.position),
        ),
        rotation: inverse,
      };
    };
    const joints: IAutoMoviePhysicalJoint[] = supports.map(
      (segment: (typeof supports)[number]): IAutoMoviePhysicalJoint => {
        const index: string = segment.bone.split("-")[1]!;
        const parent: IAutoMoviePhysicalSegment = segments.find(
          (candidate: (typeof segments)[number]): boolean =>
            candidate.bone ===
            (segment.bone.startsWith("upper")
              ? "body"
              : segment.bone.startsWith("lower")
                ? `upper-${index}`
                : `lower-${index}`),
        )!;
        const anchor: IAutoMovieVector3 = anchors.get(segment.bone)!;
        return {
          id: segment.bone,
          parent: parent.bone,
          child: segment.bone,
          parentFrame: frame(parent, anchor),
          childFrame: frame(segment, anchor),
          axes: (["x", "z"] as const).map(
            (axis: "x" | "z"): IAutoMoviePhysicalJointAxis => ({
              axis,
              minimum: -1.5,
              maximum: 1.5,
              stiffness: 100,
              damping: 10,
              maximumTorque: 100,
              channel: `${segment.bone}.${axis}`,
            }),
          ),
        };
      },
    );
    return {
      id: "four-support-rig",
      mass: 8,
      centerOfMass: {
        x: 0,
        y:
          segments.reduce(
            (sum: number, segment: IAutoMoviePhysicalSegment): number =>
              sum + segment.mass * segment.neutral.position.y,
            0,
          ) / 8,
        z: 0,
      },
      segments,
      joints,
      materials: [
        {
          id: "solid",
          friction: 0.8,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      provenance:
        "Four one-kilogram primitive upper/lower/foot chains and a four-kilogram primitive trunk; no species proportions or presets.",
    };
  }
}
