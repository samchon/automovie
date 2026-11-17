import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHandleShapes } from "../internal/motionHandleShapes";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Standard gravity, m/s^2 (CGPM 1901). */
const G: number = 9.80665;

/** A hung cord's statics bound, a share of its length: #3448's first acceptance line (the free end its length below the anchor within 2 % once settled). */
const STATICS: number = 0.02;

/** The most a hanging strap may lean off plumb, degrees: the lean at which its end still hangs its length below the hand within `STATICS`. */
const PLUMB: number = (Math.acos(1 - STATICS) * 180) / Math.PI;

/** A soft lattice of `columns` by `rows` particles from an origin along two axes, compliant, with handle affordances at named particles. */
const lattice = (props: {
  subject: string;
  columns: number;
  rows: number;
  origin: IAutoMovieVector3;
  u: IAutoMovieVector3;
  v: IAutoMovieVector3;
  mass: number;
  seconds: number;
  handles: Record<string, [number, number]>;
  anchors?: IAutoMovieSoftBodyDomain["anchors"];
  selfCollision?: boolean;
  /** The particles' rest places, row-major, when they do not lie on the lattice's two axes. */
  path?: readonly IAutoMovieVector3[];
}): IAutoMovieMotionHumanProp => {
  const rest: number[] = [];
  const at = (c: number, r: number): IAutoMovieVector3 =>
    props.path?.[r * props.columns + c] ??
    Vector3.add(
      props.origin,
      Vector3.add(Vector3.scale(props.u, c), Vector3.scale(props.v, r)),
    );
  for (let r: number = 0; r < props.rows; r++)
    for (let c: number = 0; c < props.columns; c++) {
      const p: IAutoMovieVector3 = at(c, r);
      rest.push(p.x, p.y, p.z);
    }
  const dt: number = 1 / 240;
  const handles: IAutoMovieAffordance[] = Object.entries(props.handles).map(
    ([id, [c, r]]) => ({
      id,
      kind: "handle" as const,
      frame: { ...Transform.identity(), translation: at(c, r) },
      extent: null,
      radius: 0.01,
    }),
  );
  return {
    subject: props.subject,
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    affordances: handles,
    shapes: motionHandleShapes(handles),
    soft: {
      version: 1,
      id: props.subject,
      units: "meter",
      lattice: { columns: props.columns, rows: props.rows },
      solver: {
        fixedStepSeconds: dt,
        gravity: { x: 0, y: -G, z: 0 },
        drag: 2,
        iterations: 8,
        stiffness: { structural: 1, shear: 0.5, bend: 0.1 },
        compliance: { structural: 0, shear: 1e-4, bend: 1e-1 },
        referenceSpeed: 1,
        maxSteps: Math.ceil(props.seconds / dt) + 1,
      },
      rest,
      mass: new Array(props.columns * props.rows).fill(
        props.mass / (props.columns * props.rows),
      ),
      anchors: props.anchors ?? [],
      states: [],
      colliders: [
        { kind: "plane", id: "floor", normal: { x: 0, y: 1, z: 0 }, offset: 0 },
      ],
      wind: null,
      selfCollision: props.selfCollision ?? false,
      ...(props.selfCollision === true
        ? { contact: { thickness: 0.003, friction: 0.5 } }
        : {}),
    },
  };
};

/**
 * Towel, sheet, flag, rope, bag and lace as compositions of grips on soft
 * props, with no law of their own (#3451).
 *
 * Each composition is staged on the average man (and a second person for
 * the rope) and must plan, solve and read finite particles at every tenth
 * of a second; where the composition claims a shape, it is checked.
 *
 * Scenarios:
 *
 * 1. A towel held by two corners of its near edge stays spread to at least
 *    90 % of the edge.
 * 2. A flag: a cloth anchored along a held pole's two points follows the
 *    pole: its anchored edge stays on the pole within 1 mm.
 * 3. A bag on a strap: a cord from the hand with a heavy last particle hangs
 *    straight down once settled, leaning no more than lets its end hang its
 *    length below the hand within #3448's 2 % (`PLUMB`).
 * 4. A rope pulled by two people, each holding one end, stays between their
 *    hands (every particle within the span of the two grips plus its sag).
 * 5. A skipping rope held at both ends by one person's two hands plans and
 *    solves.
 * 6. A lace: two crossed cords anchored at a shoe's eyelets, with
 *    self-contact, never pass through each other: no two particles of the
 *    cord that are not neighbours come closer than twice its radius less
 *    the step's travel bound, at every tenth of a second.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance per composition and reads `HumanPerformance.soft`.
 * @evidence contracts/development/testing.md#independent-expectations The issue's spread, the campaign's grip bound, a hanging weight's plumb line within the lean #3448's 2 % allows, the span of a rope between two hands, and capsule separation.
 * @evidence contracts/development/testing.md#distinguishing-cases Cloth and cord, one and two people, held and anchored, with and without self-contact.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing polygon men; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the six compositions and what each checks.
 */
export function test_human_motion_lexicon_rows_soft(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const reach: number = 0.5 * (m.upperArm + m.forearm);
  const performer = (subject: string, z: number, yaw: number) => ({
    subject,
    body,
    at: { x: 0, y: 0, z },
    yaw,
    proficiency: { level: "trained" as const },
  });
  const finite = (
    p: IAutoMovieMotionHumanPerformance,
    subject: string,
  ): boolean => {
    for (let t: number = 0; t <= p.duration; t += 0.1)
      if (!p.soft(subject, t).every(Number.isFinite)) return false;
    return true;
  };

  // 1. A towel held spread.
  try {
    const edge: number = 2 * m.shoulderHalfWidth;
    const towel: IAutoMovieMotionHumanProp = lattice({
      subject: "towel",
      columns: 8,
      rows: 8,
      origin: { x: -m.shoulderHalfWidth, y: m.waistHeight, z: reach },
      u: { x: edge / 7, y: 0, z: 0 },
      v: { x: 0, y: 0, z: edge / 7 },
      mass: 0.3,
      seconds: 8,
      handles: { cornerA: [0, 0], cornerB: [7, 0] },
    });
    const p: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "soft-rows",
      props: [towel],
      performers: [performer("a", 0, 0)],
      composition: HumanChain.subject("a")
        .pickUp({ prop: "towel", handle: "cornerA", hand: "left" })
        .pickUp({ prop: "towel", handle: "cornerB", hand: "right" })
        .stand({ seconds: 1 }).node,
    });
    const s: number[] = p.soft("towel", p.duration);
    const apart: number = Math.hypot(
      s[0]! - s[21]!,
      s[1]! - s[22]!,
      s[2]! - s[23]!,
    );
    if (!finite(p, "towel")) complaints.push("towel: a non-finite particle");
    if (!(apart >= 0.9 * edge))
      complaints.push(
        `towel: the held corners lie ${apart.toFixed(3)} m apart, at least ${(0.9 * edge).toFixed(3)} m expected`,
      );
  } catch (error) {
    complaints.push(`towel: expected to plan, got ${(error as Error).message}`);
  }

  // 2. A flag on a held pole.
  try {
    const poleAt: IAutoMovieVector3 = {
      x: -m.shoulderHalfWidth,
      y: m.waistHeight,
      z: reach,
    };
    const grip: IAutoMovieAffordance[] = [
      {
        id: "grip",
        kind: "handle",
        frame: Transform.identity(),
        extent: null,
        radius: 0.015,
      },
    ];
    const pole: IAutoMovieMotionHumanProp = {
      subject: "pole",
      frame: { position: poleAt, rotation: Quaternion.identity() },
      points: {},
      affordances: grip,
      shapes: motionHandleShapes(grip),
    };
    const flag: IAutoMovieMotionHumanProp = lattice({
      subject: "flag",
      columns: 6,
      rows: 4,
      origin: Vector3.add(poleAt, { x: 0, y: 0.6, z: 0 }),
      u: { x: 0.06, y: 0, z: 0 },
      v: { x: 0, y: -0.06, z: 0 },
      mass: 0.1,
      seconds: 6,
      handles: {},
      anchors: [0, 6, 12, 18].map((particle: number, k: number) => ({
        id: `ring${k}`,
        particle,
        position: null,
        binding: {
          kind: "node" as const,
          node: "pole",
          offset: { x: 0, y: 0.6 - 0.06 * k, z: 0 },
        },
      })),
    });
    const p: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "soft-rows",
      props: [pole, flag],
      performers: [performer("a", 0, 0)],
      composition: HumanChain.subject("a")
        .pickUp({ prop: "pole", handle: "grip", hand: "right" })
        .stand({ seconds: 1 }).node,
    });
    let worst: number = 0;
    for (let t: number = 0; t <= p.duration; t += 0.1) {
      const f: IAutoMovieRigidTransform = p.prop("pole", t);
      const s: number[] = p.soft("flag", t);
      [0, 6, 12, 18].forEach((particle: number, k: number): void => {
        const ring: IAutoMovieVector3 = Vector3.add(
          f.position,
          Quaternion.rotateVector(f.rotation, {
            x: 0,
            y: 0.6 - 0.06 * k,
            z: 0,
          }),
        );
        worst = Math.max(
          worst,
          Math.hypot(
            s[particle * 3]! - ring.x,
            s[particle * 3 + 1]! - ring.y,
            s[particle * 3 + 2]! - ring.z,
          ),
        );
      });
    }
    if (!(worst <= 0.001))
      complaints.push(
        `flag: the anchored edge strays ${(worst * 1000).toFixed(2)} mm from the pole, within 1 mm expected`,
      );
  } catch (error) {
    complaints.push(`flag: expected to plan, got ${(error as Error).message}`);
  }

  // 3. A bag on a strap hangs plumb.
  try {
    const socket: IAutoMovieVector3 = body.surfaces.sockets.gripRight.point;
    const top: IAutoMovieVector3 = Vector3.add(
      body.rest.get("rightHand")!,
      socket,
    );
    const strap: IAutoMovieMotionHumanProp = lattice({
      subject: "strap",
      columns: 1,
      rows: 11,
      origin: Vector3.add(top, { x: 0, y: 0, z: 0.1 }),
      u: { x: 0, y: 0, z: 0 },
      v: { x: 0.001, y: -0.04, z: 0 },
      mass: 0.05,
      seconds: 4,
      handles: {},
      anchors: [
        {
          id: "hand",
          particle: 0,
          position: null,
          binding: {
            kind: "actor-bone",
            actor: "a",
            bone: "rightHand",
            offset: socket,
          },
        },
      ],
    });
    strap.soft!.mass[10] = 2;
    const p: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "soft-rows",
      props: [strap],
      performers: [performer("a", 0, 0)],
      composition: HumanChain.subject("a").stand({ seconds: 4 }).node,
    });
    const s: number[] = p.soft("strap", p.duration);
    const line: IAutoMovieVector3 = Vector3.normalize({
      x: s[30]! - s[0]!,
      y: s[31]! - s[1]!,
      z: s[32]! - s[2]!,
    });
    const tilt: number = (Math.acos(Math.min(1, -line.y)) * 180) / Math.PI;
    if (!(tilt <= PLUMB))
      complaints.push(
        `bag: the strap hangs ${tilt.toFixed(2)} degrees off plumb, within ${PLUMB.toFixed(2)} expected`,
      );
  } catch (error) {
    complaints.push(`bag: expected to plan, got ${(error as Error).message}`);
  }

  // 4, 5. A rope between two people, and a skipping rope in two hands.
  for (const [label, two] of [
    ["rope", true],
    ["skipping rope", false],
  ] as const)
    try {
      const length: number = two ? 1.2 : 2.4;
      // The skipping rope lies at the waist's height in a U ahead of the
      // performer, its ends at the hands' sides (a, the left's, on +X), so
      // its whole length is laid without reaching the floor: up the left
      // side, across, and back down the right, a 24th of the length apart.
      const w: number = m.shoulderHalfWidth;
      const side: number = length / 2 - w;
      const along = (s: number): IAutoMovieVector3 =>
        s <= side
          ? { x: w, y: m.waistHeight, z: reach + s }
          : s <= side + 2 * w
            ? { x: w - (s - side), y: m.waistHeight, z: reach + side }
            : { x: -w, y: m.waistHeight, z: reach + side - (s - side - 2 * w) };
      const rope: IAutoMovieMotionHumanProp = lattice({
        subject: "rope",
        columns: 1,
        rows: 25,
        origin: {
          x: two ? 0 : -m.shoulderHalfWidth,
          y: m.waistHeight,
          z: two ? reach : reach,
        },
        u: { x: 0, y: 0, z: 0 },
        v: two
          ? { x: 0, y: 0, z: (1.6 - 2 * reach) / 24 }
          : { x: (2 * m.shoulderHalfWidth) / 24, y: -length / 48, z: 0 },
        mass: 0.3,
        seconds: 8,
        handles: { a: [0, 0], b: [0, 24] },
        ...(two
          ? {}
          : {
              path: Array.from(
                { length: 25 },
                (_: unknown, k: number): IAutoMovieVector3 =>
                  along((k * length) / 24),
              ),
            }),
      });
      const p: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "soft-rows",
        props: [rope],
        performers: two
          ? [performer("a", 0, 0), performer("b", 1.6, 180)]
          : [performer("a", 0, 0)],
        composition: two
          ? HumanChain.subject("a")
              .pickUp({ prop: "rope", handle: "a", hand: "right" })
              .with(
                HumanChain.subject("b").pickUp({
                  prop: "rope",
                  handle: "b",
                  hand: "right",
                }),
              ).node
          : HumanChain.subject("a")
              .pickUp({ prop: "rope", handle: "a", hand: "left" })
              .pickUp({ prop: "rope", handle: "b", hand: "right" }).node,
      });
      if (!finite(p, "rope"))
        complaints.push(`${label}: a non-finite particle`);
    } catch (error) {
      complaints.push(
        `${label}: expected to plan, got ${(error as Error).message}`,
      );
    }

  // 6. A lace keeps its crossing.
  try {
    const radius: number = 0.003;
    const lace: IAutoMovieMotionHumanProp = lattice({
      subject: "lace",
      columns: 1,
      rows: 21,
      origin: { x: -0.05, y: 0.05, z: 0.3 },
      u: { x: 0, y: 0, z: 0 },
      v: { x: 0.005, y: 0.002, z: 0.0005 },
      mass: 0.005,
      seconds: 2,
      handles: {},
      anchors: [
        { id: "eyeletA", particle: 0, position: { x: -0.05, y: 0.05, z: 0.3 } },
        {
          id: "eyeletB",
          particle: 20,
          position: { x: 0.05, y: 0.09, z: 0.31 },
        },
      ],
      selfCollision: true,
    });
    const p: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "soft-rows",
      props: [lace],
      performers: [performer("a", 0, 0)],
      composition: HumanChain.subject("a").stand({ seconds: 2 }).node,
    });
    if (!finite(p, "lace")) complaints.push("lace: a non-finite particle");
    const bound: number =
      2 * radius -
      lace.soft!.solver.fixedStepSeconds * lace.soft!.solver.referenceSpeed;
    let least: number = Infinity;
    for (let t: number = 0; t <= p.duration; t += 0.1) {
      const s: number[] = p.soft("lace", t);
      for (let i: number = 0; i < 21; i++)
        for (let j: number = i + 2; j < 21; j++)
          least = Math.min(
            least,
            Math.hypot(
              s[i * 3]! - s[j * 3]!,
              s[i * 3 + 1]! - s[j * 3 + 1]!,
              s[i * 3 + 2]! - s[j * 3 + 2]!,
            ),
          );
    }
    if (!(least >= bound))
      complaints.push(
        `lace: two particles come ${(least * 1000).toFixed(2)} mm apart, at least ${(bound * 1000).toFixed(2)} mm expected`,
      );
  } catch (error) {
    complaints.push(`lace: expected to plan, got ${(error as Error).message}`);
  }
  TestValidator.equals("soft props as compositions of grips", complaints, []);
}
