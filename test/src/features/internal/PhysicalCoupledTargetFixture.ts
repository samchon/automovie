import type {
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePoses,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";

type Side = "left" | "right";
type Body = IAutoMoviePhysicalSimulationInput.IBody;
type Scene = IAutoMoviePhysicalSimulationInput.IInput;

type Hinge = {
  readonly id: Side;
  readonly length: number;
  readonly radius: number;
  readonly angle: number;
  readonly minimum: number;
  readonly maximum: number;
};

type Fixture = {
  readonly scene: Scene;
  readonly actual: Readonly<Record<string, IAutoMoviePoses>>;
  readonly left: Hinge;
  readonly right: Hinge;
  readonly minimumSignedGap: number;
};

/** Two individually dimensioned, opposed single-axis mechanisms. */
export namespace PhysicalCoupledTargetFixture {
  /** Positive extra gap shifts the right root and can make the fit impossible. */
  export function create(extraGap: number = 0): Fixture {
    const left: Hinge = {
      id: "left",
      length: 0.3,
      radius: 0.05,
      angle: 0.3,
      minimum: 0,
      maximum: 0.4,
    };
    const right: Hinge = {
      id: "right",
      length: 0.25,
      radius: 0.06,
      angle: -0.4,
      minimum: -0.5,
      maximum: 0,
    };
    const radii: number = left.radius + right.radius;
    const distance: number =
      radii +
      left.length * Math.sin(left.angle) -
      right.length * Math.sin(right.angle) +
      extraGap;
    const duration: number = 4 / 120;
    const bodies: Body[] = [
      mechanism(left, right, 0, -1, duration),
      mechanism(right, left, distance, 1, duration),
    ];
    const scene: Scene = PhysicalFixtures.input(bodies, duration);
    scene.checkpointEvery = 1;
    scene.substeps = 2;
    return {
      scene,
      actual: Object.fromEntries(
        bodies.map((body: Body): [string, IAutoMoviePoses] => [
          body.id,
          body.targets[0]!.segments,
        ]),
      ),
      left,
      right,
      minimumSignedGap:
        distance -
        left.length * Math.sin(left.maximum) +
        right.length * Math.sin(right.minimum) -
        radii,
    };
  }

  /** Place the independent first-frame seed before the grouped motion starts. */
  export function createAuthored(
    extraGap: number = 0,
    group: string = "fixture-grip",
  ): Fixture {
    const fixture: Fixture = create(extraGap);
    for (const body of fixture.scene.bodies) {
      delete body.targets[0]!.bindings;
      for (let step: number = 1; step < body.targets.length; step++)
        body.targets[step]!.coupledGroup = group;
    }
    return fixture;
  }

  /** Read world observations without the Engine's geometry or projection APIs. */
  export function inspect(
    fixture: Fixture,
    poses: Readonly<Record<string, IAutoMoviePoses>>,
  ): {
    signedGap: number;
    bodies: {
      id: Side;
      angle: number;
      anchorError: number;
      bindingError: IAutoMovieVector3;
    }[];
  } {
    const a: IAutoMovieRigidTransform = poses.left!.tip!;
    const b: IAutoMovieRigidTransform = poses.right!.tip!;
    return {
      signedGap:
        Math.hypot(
          b.position.x - a.position.x,
          b.position.y - a.position.y,
          b.position.z - a.position.z,
        ) -
        fixture.left.radius -
        fixture.right.radius,
      bodies: [
        observation(fixture.left, fixture.right, poses, -1),
        observation(fixture.right, fixture.left, poses, 1),
      ],
    };
  }
}

function mechanism(
  hinge: Hinge,
  peer: Hinge,
  rootX: number,
  receiverDirection: 1 | -1,
  duration: number,
): Body {
  const trunk: IAutoMoviePhysicalProfile = PhysicalFixtures.sphere(0.035);
  const end: IAutoMoviePhysicalProfile = PhysicalFixtures.sphere(hinge.radius);
  const rootY: number = 1 + hinge.length * Math.cos(hinge.angle);
  const root: IAutoMovieRigidTransform = transform(rootX, rootY);
  const tip: IAutoMovieRigidTransform = transform(rootX, rootY - hinge.length);
  const profile: IAutoMoviePhysicalProfile = {
    id: hinge.id + "-hinge",
    provenance: "Two analytic equal-mass spheres with a single pivot.",
    mass: 2,
    centerOfMass: { x: rootX, y: rootY - hinge.length / 2, z: 0 },
    materials: trunk.materials,
    segments: [
      {
        ...trunk.segments[0]!,
        neutral: root,
        shapes: [{ ...trunk.segments[0]!.shapes[0]!, id: "base" }],
      },
      { ...end.segments[0]!, bone: "tip", neutral: tip },
    ],
    joints: [
      {
        id: "pivot",
        parent: "root",
        child: "tip",
        parentFrame: transform(0, 0),
        childFrame: transform(0, hinge.length),
        axes: [
          {
            axis: "z",
            channel: "pivot.z",
            minimum: hinge.minimum,
            maximum: hinge.maximum,
            stiffness: 100,
            damping: 10,
            maximumTorque: 100,
          },
        ],
      },
    ],
  };
  const binding: IAutoMoviePhysicalContactBinding = {
    id: "meet-peer",
    kind: "contact",
    chain: ["tip"],
    source: { bone: "tip", shape: "surface" },
    target: {
      body: peer.id,
      bone: "tip",
      shape: "surface",
      normal: {
        x: receiverDirection * Math.cos(peer.angle),
        y: -receiverDirection * Math.sin(peer.angle),
        z: 0,
      },
    },
    weight: 1,
    compression: 0,
    iterations: 32,
    tolerance: 0.0001,
  };
  const body: Body = PhysicalFixtures.body(hinge.id, profile, duration);
  body.mode = { kind: "kinematic" };
  for (const target of body.targets) {
    target.strength = 1;
    target.bindings = [structuredClone(binding)];
  }
  return body;
}

function observation(
  hinge: Hinge,
  peer: Hinge,
  poses: Readonly<Record<string, IAutoMoviePoses>>,
  receiverDirection: 1 | -1,
): {
  id: Side;
  angle: number;
  anchorError: number;
  bindingError: IAutoMovieVector3;
} {
  const root: IAutoMovieRigidTransform = poses[hinge.id]!.root!;
  const source: IAutoMovieRigidTransform = poses[hinge.id]!.tip!;
  const target: IAutoMovieRigidTransform = poses[peer.id]!.tip!;
  const angle: number = rotation(source);
  const receiverAngle: number = rotation(target) - peer.angle;
  const dx: number =
    target.position.x +
    receiverDirection * peer.radius * Math.cos(receiverAngle) -
    source.position.x;
  const dy: number =
    target.position.y +
    receiverDirection * peer.radius * Math.sin(receiverAngle) -
    source.position.y;
  const dz: number = target.position.z - source.position.z;
  const distance: number = Math.hypot(dx, dy, dz);
  const scale: number = hinge.radius / distance - 1;
  return {
    id: hinge.id,
    angle,
    anchorError: Math.hypot(
      source.position.x - hinge.length * Math.sin(angle) - root.position.x,
      source.position.y + hinge.length * Math.cos(angle) - root.position.y,
      source.position.z - root.position.z,
    ),
    bindingError: { x: scale * dx, y: scale * dy, z: scale * dz },
  };
}

function rotation(pose: IAutoMovieRigidTransform): number {
  const q: IAutoMovieRigidTransform["rotation"] = pose.rotation;
  return 2 * Math.atan2(q.z * (q.w < 0 ? -1 : 1), Math.abs(q.w));
}

function transform(x: number, y: number): IAutoMovieRigidTransform {
  return {
    position: { x, y, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
}
