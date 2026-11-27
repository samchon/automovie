import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";

/**
 * Two declared one-kilogram bodies with offset mass centres, joined at an
 * oblique fixed pivot: the parent translates and turns about X and Y, the child
 * turns about Z and X under it without commuting, and the child's surface is
 * bound to keep off the parent's, at 120 Hz over `duration` seconds.
 *
 * @param duration The film's length, seconds.
 * @returns The body, its handoff limits 1 mm and 1e-4 rad.
 */
export function physicalMovingPair(
  duration: number,
): IAutoMoviePhysicalSimulationInput.IBody {
  const prototype: IAutoMoviePhysicalSegment =
    PhysicalFixtures.sphere().segments[0]!;
  const segment = (
    bone: string,
    position: IAutoMovieRigidTransform["position"],
    centerOfMass: IAutoMovieRigidTransform["position"],
  ): IAutoMoviePhysicalSegment => {
    const out: IAutoMoviePhysicalSegment = {
      ...structuredClone(prototype),
      bone,
      neutral: { position, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      centerOfMass,
    };
    out.shapes[0]!.id = `${bone}-surface`;
    return out;
  };
  const profile: IAutoMoviePhysicalProfile = {
    id: "moving-pair",
    mass: 2,
    centerOfMass: { x: 0.1025, y: 1.82, z: 0.035 },
    provenance:
      "Two declared one-kilogram rigid bodies, sphere collision envelopes and offset mass centres, joined at an oblique fixed pivot.",
    segments: [
      segment("root", { x: 0, y: 2, z: 0 }, { x: -0.015, y: 0.01, z: 0.02 }),
      segment(
        "child",
        { x: 0.19, y: 1.65, z: 0.04 },
        { x: 0.03, y: -0.02, z: 0.01 },
      ),
    ],
    materials: PhysicalFixtures.sphere().materials,
    joints: [
      {
        id: "pivot",
        parent: "root",
        child: "child",
        parentFrame: {
          position: { x: 0.12, y: -0.2, z: 0.08 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: { x: -0.07, y: 0.15, z: 0.04 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        axes: (["x", "y", "z"] as const).map(
          (
            axis: IAutoMoviePhysicalJointAxis["axis"],
          ): IAutoMoviePhysicalJointAxis => ({
            axis,
            channel: `pivot.${axis}`,
            minimum: -Math.PI / 2,
            maximum: Math.PI / 2,
            stiffness: 30,
            damping: 4,
            maximumTorque: 100,
            passiveDamping: 0.1,
          }),
        ),
      },
    ],
  };
  const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "pair",
    profile,
    duration,
  );
  body.handoffLimits = {
    maximumLinearError: 0.001,
    maximumJointViolation: 0.0001,
  };
  body.selfAvoidance = { iterations: 1, tolerance: 0.0001 };
  for (const [step, target] of body.targets.entries()) {
    target.strength = 1;
    const seconds: number = step / 120;
    const root: IAutoMovieRigidTransform = {
      position: { x: 0.4 * seconds, y: 2 + 0.05 * seconds, z: 0.02 * seconds },
      rotation: AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 20 * seconds),
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30 * seconds),
      ),
    };
    const turned: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
      root.rotation,
      AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.fromAxisAngle(
          { x: 0, y: 0, z: 1 },
          12 * Math.sin(Math.PI * seconds),
        ),
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 8 * seconds),
      ),
    );
    target.segments.root = root;
    target.segments.child = {
      position: AutoMovieEngineVector3.subtract(
        AutoMovieEnginePhysics.physicalSupportPoint(root, profile.joints[0]!.parentFrame.position),
        AutoMovieEngineQuaternion.rotateVector(turned, profile.joints[0]!.childFrame.position),
      ),
      rotation: turned,
    };
    target.bindings = [
      {
        id: "bound-child",
        kind: "separate",
        chain: ["child"],
        source: { bone: "child", shape: "child-surface" },
        target: { body: body.id, bone: "root", shape: "root-surface" },
        weight: 1,
        compression: 0,
        iterations: 1,
        tolerance: 0.0001,
      },
    ];
  }
  return body;
}
