import {
  AutoMovieEngineXpbdBody,
  AutoMovieEngineXpbdWorld,
  AutoMovieEngineQuaternion,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The solver's float32 rounding of a body's place, metres. */
const NATIVE: number = 1e-7;

/**
 * The residual motion of a settled body and a limit's overshoot, m/s and
 * radians: the compliant contacts and joints leave a creep under a thousandth.
 */
const AT_REST: number = 1e-3;

/**
 * How far a block on a slope steeper friction holds may creep in two seconds,
 * metres: under a tenth of a millimetre of compliant drift.
 */
const STATIC: number = 1e-4;

/**
 * The in-house extended position-based dynamics world (Mueller et al. 2020)
 * against closed forms.
 *
 * - A cube resting on the floor sinks to the allowed contact error plus g /
 *   omega^2, the steady state of a compliant contact whose compliance is the
 *   pair's inverse mass over the contact frequency squared, and stays still.
 * - A block on a 30 degree slope stays put when tan 30 < mu, and otherwise slides
 *   with the Coulomb acceleration g (sin 30 - mu cos 30).
 * - A ball dropped onto the floor with restitution 0.5 rebounds to a quarter of
 *   its drop height.
 * - A hinged rod falling under gravity stays inside its joint box, and a ball
 *   joint with a swing-twist limit stays inside its cone.
 * - Two runs of the same scene give identical snapshot bytes, and a run restored
 *   from a mid-run snapshot ends bit for bit where the uninterrupted run ends.
 */
export async function test_engine_physics_xpbd_world(): Promise<void> {
  const findings: string[] = [];
  const h: number = 1 / 1920;
  const g: number = 9.81;
  const frequency: number = 240;
  const omega: number = 2 * Math.PI * frequency;
  const allowed: number = 0.0001;

  // 1. Resting cube.
  {
    const world: AutoMovieEngineXpbdWorld = scene();
    const cube: AutoMovieEngineXpbdBody = block(
      world,
      0.1,
      { x: 0, y: 0.1, z: 0 },
      0.7,
    );
    run(world, 1920);
    const depth: number = -(cube.translation().y - 0.1);
    const expected: number = allowed + g / (omega * omega);
    if (!(Math.abs(depth - expected) < 0.25 * (g / (omega * omega)) + NATIVE))
      findings.push(`rest depth ${depth} m, expected ${expected} m`);
    if (
      !(Math.hypot(cube.linvel().x, cube.linvel().y, cube.linvel().z) < AT_REST)
    )
      findings.push(`resting cube moves at ${JSON.stringify(cube.linvel())}`);
  }

  // 2. Slope: static and sliding.
  for (const mu of [0.8, 0.3]) {
    const slope: number = Math.PI / 6;
    const world: AutoMovieEngineXpbdWorld = scene(slope, mu);
    const down: IAutoMovieVector3 = {
      x: Math.cos(slope),
      y: -Math.sin(slope),
      z: 0,
    };
    const normal: IAutoMovieVector3 = {
      x: Math.sin(slope),
      y: Math.cos(slope),
      z: 0,
    };
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      -30,
    );
    const piece: AutoMovieEngineXpbdBody = block(
      world,
      0.1,
      { x: normal.x * 0.1, y: normal.y * 0.1, z: 0 },
      mu,
      rotation,
    );
    run(world, 240);
    const start: number = along(piece.translation(), down);
    const v0: number = along(piece.linvel(), down);
    run(world, 480);
    const seconds: number = 480 * h;
    const travelled: number = along(piece.translation(), down) - start;
    if (mu > Math.tan(slope)) {
      if (!(Math.abs(travelled) < STATIC))
        findings.push(`static block slid ${travelled} m`);
    } else {
      const acceleration: number =
        (2 * (travelled - v0 * seconds)) / (seconds * seconds);
      const expected: number = g * (Math.sin(slope) - mu * Math.cos(slope));
      if (!(Math.abs(acceleration - expected) < 0.05 * expected))
        findings.push(
          `sliding acceleration ${acceleration}, expected ${expected}`,
        );
    }
  }

  // 3. Rebound.
  {
    const world: AutoMovieEngineXpbdWorld = scene();
    const ball: AutoMovieEngineXpbdBody = world.createBody(true, {
      position: { x: 0, y: 0.6, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    ball.setMass(1, origin(), { x: 0.004, y: 0.004, z: 0.004 }, identity());
    world.createCollider(ball, sphere(0.1), 0.5, 0.5, false);
    let apex: number = -Infinity;
    let bounced: boolean = false;
    for (let i: number = 0; i < 1920; i++) {
      world.step();
      if (ball.linvel().y > 0) bounced = true;
      if (bounced) apex = Math.max(apex, ball.translation().y - 0.1);
    }
    // The restitution coefficient averages the ball's 0.5 with the floor's 0.5.
    const expected: number = 0.25 * 0.5;
    if (!(Math.abs(apex - expected) < 0.1 * expected))
      findings.push(`rebound apex ${apex} m, expected ${expected} m`);
  }

  // 4. Joint limits.
  for (const limited of ["box", "cone"] as const) {
    const world: AutoMovieEngineXpbdWorld = scene();
    const anchor: AutoMovieEngineXpbdBody = world.createBody(false, {
      position: { x: 0, y: 2, z: 0 },
      rotation: identity(),
    });
    const rod: AutoMovieEngineXpbdBody = world.createBody(true, {
      position: { x: 0, y: 1.75, z: 0 },
      rotation: identity(),
    });
    rod.setMass(1, origin(), { x: 0.02, y: 0.001, z: 0.02 }, identity());
    rod.setLinvel({ x: 2, y: 0, z: 1 });
    const joint: IAutoMoviePhysicalJoint = {
      id: "hinge",
      parent: "anchor",
      child: "rod",
      parentFrame: { position: origin(), rotation: identity() },
      childFrame: { position: { x: 0, y: 0.25, z: 0 }, rotation: identity() },
      axes:
        limited === "box"
          ? [axis("z", -0.5, 0.5)]
          : [axis("x", -3, 3), axis("y", -3, 3), axis("z", -3, 3)],
      ...(limited === "cone"
        ? {
            swingTwist: {
              twistAxis: { x: 0, y: 1, z: 0 },
              swingAxis: { x: 1, y: 0, z: 0 },
              twist: { minimum: -0.2, maximum: 0.2 },
              swingU: { minimum: -0.4, maximum: 0.4 },
              swingV: { minimum: -0.3, maximum: 0.3 },
            },
          }
        : {}),
    };
    world.createJoint(joint, anchor, rod);
    let worst: number = 0;
    for (let i: number = 0; i < 1920; i++) {
      world.step();
      const q: IAutoMovieQuaternion = rod.rotation();
      if (limited === "box") {
        const angle: number = 2 * Math.atan(q.z / q.w);
        worst = Math.max(
          worst,
          Math.abs(angle) - 0.5,
          Math.abs(q.x),
          Math.abs(q.y),
        );
      } else {
        const s: number = q.w < 0 ? -1 : 1;
        const twist: number = 2 * Math.atan2(s * q.y, s * q.w);
        const swing: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
          q,
          AutoMovieEngineQuaternion.inverse({
            x: 0,
            y: Math.sin(twist / 2),
            z: 0,
            w: Math.cos(twist / 2),
          }),
        );
        const half: number = Math.acos(Math.min(1, Math.abs(swing.w)));
        const scale: number = half > 0 ? (2 * half) / Math.sin(half) : 2;
        const u: number = (swing.w < 0 ? -1 : 1) * swing.x * scale;
        const v: number = (swing.w < 0 ? -1 : 1) * swing.z * scale;
        worst = Math.max(
          worst,
          Math.abs(twist) - 0.2,
          Math.sqrt((u / 0.4) ** 2 + (v / 0.3) ** 2) - 1,
        );
      }
    }
    if (!(worst < AT_REST))
      findings.push(`${limited} limit exceeded by ${worst}`);
  }

  // 5. Determinism and snapshot continuation.
  {
    const play = (split?: number): Uint8Array => {
      let world: AutoMovieEngineXpbdWorld = scene();
      const cube: AutoMovieEngineXpbdBody = block(
        world,
        0.1,
        { x: 0, y: 0.4, z: 0 },
        0.7,
      );
      cube.setAngvel({ x: 3, y: 1, z: -2 });
      for (let i: number = 0; i < 960; i++) {
        if (i === split)
          world = AutoMovieEngineXpbdWorld.restoreSnapshot(world.takeSnapshot());
        world.step();
      }
      return world.takeSnapshot();
    };
    const first: Uint8Array = play();
    const second: Uint8Array = play();
    const resumed: Uint8Array = play(480);
    if (!equal(first, second)) findings.push("two runs differ");
    if (!equal(first, resumed)) findings.push("a restored run differs");
  }

  TestValidator.equals("the world matches its closed forms", findings, []);

  /**
   * A world with a kinematic floor box whose top face passes through the
   * origin, tilted about Z.
   */
  function scene(tilt: number = 0, friction: number = 0.7): AutoMovieEngineXpbdWorld {
    const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld({
      x: 0,
      y: -g,
      z: 0,
    });
    world.timestep = h;
    world.allowedError = allowed;
    world.contactFrequency = frequency;
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      (-tilt * 180) / Math.PI,
    );
    const floor: AutoMovieEngineXpbdBody = world.createBody(false, {
      position: AutoMovieEngineQuaternion.rotateVector(rotation, { x: 0, y: -0.5, z: 0 }),
      rotation,
    });
    world.createCollider(
      floor,
      box({ x: 20, y: 0.5, z: 20 }),
      friction,
      0.5,
      false,
    );
    return world;
  }

  /** A one-kilogram cube of half-extent `half`. */
  function block(
    world: AutoMovieEngineXpbdWorld,
    half: number,
    position: IAutoMovieVector3,
    friction: number,
    rotation: IAutoMovieQuaternion = identity(),
  ): AutoMovieEngineXpbdBody {
    const body: AutoMovieEngineXpbdBody = world.createBody(true, {
      position,
      rotation,
    });
    const moment: number = (2 * half) ** 2 / 6;
    body.setMass(1, origin(), { x: moment, y: moment, z: moment }, identity());
    world.createCollider(
      body,
      box({ x: half, y: half, z: half }),
      friction,
      0,
      false,
    );
    return body;
  }

  /** Step a world. */
  function run(world: AutoMovieEngineXpbdWorld, steps: number): void {
    for (let i: number = 0; i < steps; i++) world.step();
  }

  /** A component along a unit direction. */
  function along(v: IAutoMovieVector3, d: IAutoMovieVector3): number {
    return v.x * d.x + v.y * d.y + v.z * d.z;
  }

  /** A free angular axis. */
  function axis(
    name: "x" | "y" | "z",
    minimum: number,
    maximum: number,
  ): IAutoMoviePhysicalJoint["axes"][number] {
    return {
      axis: name,
      minimum,
      maximum,
      stiffness: 0,
      damping: 0,
      maximumTorque: 0,
      channel: name,
    };
  }

  /** A centred box shape. */
  function box(halfExtents: IAutoMovieVector3): IAutoMoviePhysicalShape {
    return {
      id: "box",
      material: "solid",
      kind: "box",
      halfExtents,
      transform: { position: origin(), rotation: identity() },
    };
  }

  /** A centred sphere shape. */
  function sphere(radius: number): IAutoMoviePhysicalShape {
    return {
      id: "ball",
      material: "solid",
      kind: "sphere",
      radius,
      transform: { position: origin(), rotation: identity() },
    };
  }

  /** The zero vector. */
  function origin(): IAutoMovieVector3 {
    return { x: 0, y: 0, z: 0 };
  }

  /** The identity rotation. */
  function identity(): IAutoMovieQuaternion {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  /** Byte equality. */
  function equal(a: Uint8Array, b: Uint8Array): boolean {
    return (
      a.length === b.length &&
      a.every((value: number, index: number): boolean => value === b[index])
    );
  }
}
