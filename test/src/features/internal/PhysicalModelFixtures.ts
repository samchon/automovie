import type {
  IAutoMovieModel,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { createAutoMovieStickman } from "./createAutoMovieStickman";
import { derivePhysicalProfile } from "../../../../packages/engine/src/physics/derivePhysicalProfile";
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
    const profile: P = derivePhysicalProfile(model, {
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
  /** Four two-link legs and feet permit a genuine recovery step; primitive masses total eight kilograms. */
  export function quadrupod(): P {
    const component: (
      bone: string,
      dimensions: [number, number, number],
      position: P.ITransform["position"],
      density: number,
    ) => P.ISegment = (
      bone: string,
      dimensions: [number, number, number],
      position: IAutoMovieVector3,
      density: number,
    ): P.ISegment => {
      const model: IAutoMovieModel = makeProp([
        primitivePart(bone, {
          type: "box",
          width: dimensions[0],
          height: dimensions[1],
          depth: dimensions[2],
        }),
      ]);
      const profile: P = derivePhysicalProfile(model, {
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
        neutral: { position, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      };
    };
    const root: P.ISegment = component(
      "body",
      [0.7, 0.2, 0.6],
      { x: 0, y: 1.05, z: 0 },
      4 / (0.7 * 0.2 * 0.6),
    );
    const supports: P.ISegment[] = Array.from(
      { length: 4 },
      (_: unknown, index: number): P.ISegment[] => {
        const x: number = index < 2 ? 0.35 : -0.35;
        const z: number = index % 2 === 0 ? 0.3 : -0.3;
        return [
          component(
            `upper-${index}`,
            [0.1, 0.45, 0.1],
            { x, y: 0.775, z },
            0.4 / (0.1 * 0.45 * 0.1),
          ),
          component(
            `lower-${index}`,
            [0.1, 0.45, 0.1],
            { x, y: 0.325, z },
            0.4 / (0.1 * 0.45 * 0.1),
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
    const segments: P.ISegment[] = [root, ...supports];
    const joints: P.IJoint[] = supports.map(
      (segment: (typeof supports)[number]): P.IJoint => {
        const index: string = segment.bone.split("-")[1]!;
        const parent: P.ISegment = segments.find(
          (candidate: (typeof segments)[number]): boolean =>
            candidate.bone ===
            (segment.bone.startsWith("upper")
              ? "body"
              : segment.bone.startsWith("lower")
                ? `upper-${index}`
                : `lower-${index}`),
        )!;
        const height: number = segment.bone.startsWith("upper")
          ? 1
          : segment.bone.startsWith("lower")
            ? 0.55
            : 0.1;
        return {
          id: segment.bone,
          parent: parent.bone,
          child: segment.bone,
          parentFrame: {
            position: {
              x: segment.neutral.position.x - parent.neutral.position.x,
              y: height - parent.neutral.position.y,
              z: segment.neutral.position.z - parent.neutral.position.z,
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
          childFrame: {
            position: { x: 0, y: height - segment.neutral.position.y, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
          axes: (["x", "z"] as const).map(
            (axis: "x" | "z"): P.IAxis => ({
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
      centerOfMass: { x: 0, y: 0.75, z: 0 },
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
