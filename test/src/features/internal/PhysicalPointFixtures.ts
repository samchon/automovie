import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";

/** Analytic one-axis articulation with two rigid branches sharing the moving carrier. */
export namespace PhysicalPointFixtures {
  /** Four unit-mass spheres: a fixed root, rotating carrier and two unit-offset branches. */
  export function profile(): P {
    const source: P = PhysicalFixtures.sphere(0.01);
    const segments: P.ISegment[] = [
      "root",
      "carrier",
      "source",
      "reference",
    ].map((bone: string): P.ISegment => {
      const segment: P.ISegment = structuredClone(source.segments[0]!);
      segment.bone = bone;
      if (bone === "source") segment.neutral.position.x = 1;
      if (bone === "reference") segment.neutral.position.y = 2;
      return segment;
    });
    const joint: (
      child: string,
      position: P.ITransform["position"],
      axes: P.IAxis[],
    ) => P.IJoint = (
      child: string,
      position: P.ITransform["position"],
      axes: P.IAxis[],
    ): P.IJoint => ({
      id: child,
      parent: child === "carrier" ? "root" : "carrier",
      child,
      parentFrame: { position, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      childFrame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      axes,
    });
    return {
      id: "shared-carrier",
      mass: 4,
      centerOfMass: { x: 0.25, y: 1.25, z: 0 },
      segments,
      materials: structuredClone(source.materials),
      joints: [
        joint("carrier", { x: 0, y: 0, z: 0 }, [
          {
            axis: "z",
            minimum: 0,
            maximum: Math.PI / 2,
            stiffness: 1,
            damping: 0.1,
            maximumTorque: 1,
            channel: "carrier.turn",
          },
        ]),
        joint("source", { x: 1, y: 0, z: 0 }, []),
        joint("reference", { x: 0, y: 1, z: 0 }, []),
      ],
      provenance:
        "Four independent unit-mass solid spheres with analytic sphere inertia, one bounded angular coordinate and two rigid unit offsets.",
    };
  }

  /** Equal-height projection requires the shared carrier to rotate exactly pi/4. */
  export function bound(): Bound {
    return {
      id: "relative-height",
      chain: ["carrier", "source"],
      source: { bone: "source", localPoint: { x: 0, y: 0, z: 0 } },
      reference: {
        body: "assembly",
        bone: "reference",
        localPoint: { x: 0, y: 0, z: 0 },
      },
      axis: { x: 0, y: 1, z: 0 },
      minimum: 0,
      maximum: 0,
      iterations: 32,
      tolerance: 1e-6,
    };
  }
}
