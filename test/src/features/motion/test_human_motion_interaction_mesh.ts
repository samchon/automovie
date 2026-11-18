import { Vector3, tetrahedralizeAutoMovieDelaunay } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHoldMesh,
  IAutoMovieMotionHumanInteractionMesh,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHoldMesh,
  HumanInteractionMesh,
  HumanPerformance,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Four corner indices from the public mesh. */
type Tetrahedron = IAutoMovieTetrahedralizeDelaunay.IMesh["tetrahedra"][number];

/** The slot of one participant in the pair. */
type PairSide = 0 | 1;

/** A test reference pair with the index of each participant's joint. */
interface IPair {
  points: IAutoMovieVector3[];
  bones: IAutoMovieMotionHumanInteractionMesh.IBone[];
  index: (body: PairSide, bone: AutoMovieHumanoidBone) => number;
}

/** The point and radius given by intersecting the three bisector planes. */
interface ISphere {
  centre: IAutoMovieVector3;
  radius: number;
}

/** A flat tetrahedron has no unique circumsphere. */
type Sphere = ISphere | null;

/**
 * The interaction mesh (#3438, Ho, Komura and Tai 2010) adapts a
 * two-person key pose to another pair of bodies: the mesh over both bodies'
 * joints is a Delaunay tetrahedralization, a pose adapted to its own bodies
 * is itself, and a pose adapted to other bodies keeps their bone lengths,
 * their contacts and every relation the mesh records (no tetrahedron turned
 * inside out), the same every time.
 *
 * The key pose is two bodies at their rest pose facing each other a foot
 * apart, the first's left wrist paired with the second's right wrist (the
 * hold's contact): the shape of a two-person hold with every joint in it,
 * built from the bodies alone. Bounds: a contact and a bone length within
 * 10 mm (#3349's contact bound), the identity within 1e-6 m (#3438), an
 * empty circumsphere within the points' extent times 1e-9 (round-off).
 *
 * Scenarios:
 * 1. The mesh of the reference pair (m-average, f-average), on the joggled
 *    points it is built on (Qhull's joggle, each within its bound): every
 *    tetrahedron is positively oriented, no point lies inside any
 *    tetrahedron's circumsphere beyond 1e-9 of the extent, and building it
 *    twice gives the same mesh.
 * 2. Identity: the reference adapted to its own bone lengths, with no
 *    contact, is itself within 1e-6 m.
 * 3. For the pairs (f-small, m-large) and (m-large, f-small): every bone
 *    keeps the target body's length within 10 mm, the paired wrists meet
 *    within 10 mm, and no tetrahedron of the mesh is inverted on the
 *    adapted points (a tetrahedron flat on the reference points, oriented
 *    only by the joggle, records no side and is not counted).
 * 4. Determinism: the same pair adapted twice gives the same points, bit
 *    for bit.
 * 5. Fewer than four points, and a bone of no length, are refused.
 * 6. The hold adapted through `HumanHoldMesh` from two standing bodies'
 *    displayed bones to (f-small, m-large): the paired wrists keep their
 *    key offset within 10 mm, every bone of each target body keeps its
 *    length within 10 mm, and each body has its four limb goals.
 * 7. A headlock (the plum clinch's hold on the neck, the stage fight's
 *    headlock row) at its key pose on the reference pair, adapted to
 *    (f-small, m-large) and (m-large, f-small): each hand keeps its key
 *    offset from the held neck within 10 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the mesh and adapts real polygon men's joints through the engine's mesh and the motions package's public adaptation; a non-Delaunay or inverted mesh, a moved identity, a stretched bone, an open contact, a lost key offset or a non-deterministic result fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations A determinant of the corner differences gives orientation without asking the tetrahedralizer, and bisector-plane intersection gives the Delaunay oracle. Bone lengths come from the target bodies' rest joints.
 * @evidence contracts/development/testing.md#distinguishing-cases The reference pair, both orders of a pair of opposite builds, the identity, the hold through the motions' owner and two refusals.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and solves in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the key pose, the bounds with their sources and the 7 scenarios.
 */
export function test_human_motion_interaction_mesh(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const BOUND: number = 0.01;

  // Two bodies' joints facing each other a foot apart, the second turned
  // half round, and the bones of each body by its parents.
  const pair = (
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): IPair => {
    const points: IAutoMovieVector3[] = [];
    const indices: Map<string, number> = new Map();
    const gap: number = a.measure.footLength;
    [a, b].forEach((body: IAutoMovieMotionHumanBody, k: number): void => {
      for (const [bone, p] of body.rest) {
        indices.set(`${k}:${bone}`, points.length);
        points.push(k === 0 ? { ...p } : { x: -p.x, y: p.y, z: gap - p.z });
      }
    });
    const bones: IAutoMovieMotionHumanInteractionMesh.IBone[] = [];
    [a, b].forEach((body: IAutoMovieMotionHumanBody, k: number): void => {
      for (const bone of body.skeleton.bones)
        if (bone.parent !== null) {
          const from: number | undefined = indices.get(`${k}:${bone.bone}`);
          const to: number | undefined = indices.get(`${k}:${bone.parent}`);
          if (from === undefined || to === undefined) continue;
          bones.push({
            from,
            to,
            length: Vector3.length(
              Vector3.subtract(
                body.rest.get(bone.bone)!,
                body.rest.get(bone.parent)!,
              ),
            ),
          });
        }
    });
    return {
      points,
      bones,
      index: (body: PairSide, bone: AutoMovieHumanoidBone): number =>
        indices.get(`${body}:${bone}`)!,
    };
  };

  // 1. The mesh.
  const reference: IPair = pair(
    motionHumanBody("m-average"),
    motionHumanBody("f-average"),
  );
  const mesh: IAutoMovieTetrahedralizeDelaunay.IMesh =
    tetrahedralizeAutoMovieDelaunay(reference.points);
  const extent: number = Math.max(
    ...reference.points.map((p: IAutoMovieVector3): number =>
      Vector3.length(p),
    ),
  );
  all.check(
    `the reference mesh has tetrahedra, read ${mesh.tetrahedra.length}`,
    mesh.tetrahedra.length > 0,
  );
  // The mesh is Delaunay on the joggled points it was built on: every
  // tetrahedron positively oriented, and no other point inside its
  // circumsphere by more than the round-off of the extent (1e-9 of it).
  const points: readonly IAutoMovieVector3[] = mesh.points;
  all.check(
    `the joggled points move by at most the joggle, ${tetrahedralizeAutoMovieDelaunay.JOGGLE} epsilons of the largest coordinate`,
    points.every(
      (p: IAutoMovieVector3, i: number): boolean =>
        Math.max(
          Math.abs(p.x - reference.points[i]!.x),
          Math.abs(p.y - reference.points[i]!.y),
          Math.abs(p.z - reference.points[i]!.z),
        ) <=
        tetrahedralizeAutoMovieDelaunay.JOGGLE * Number.EPSILON * extent,
    ),
  );
  for (const t of mesh.tetrahedra) {
    const v: number = orientedVolume(points, t);
    all.check(
      `tetrahedron ${t.join(",")} has volume ${v}, positive expected`,
      v > 0,
    );
    const sphere: Sphere = circumsphere(points, t);
    if (sphere === null) continue;
    for (let i: number = 0; i < points.length; i++) {
      if (t.includes(i)) continue;
      const depth: number =
        sphere.radius -
        Vector3.length(Vector3.subtract(points[i]!, sphere.centre));
      all.check(
        `point ${i} lies ${depth.toExponential(2)} m inside the circumsphere of tetrahedron ${t.join(",")}, none past ${(extent * 1e-9).toExponential(2)} m expected`,
        depth <= extent * 1e-9,
      );
    }
  }
  all.check(
    "the mesh built twice is the same",
    JSON.stringify(tetrahedralizeAutoMovieDelaunay(reference.points)) ===
      JSON.stringify(mesh),
  );

  // 2. Identity.
  const same: IAutoMovieMotionHumanInteractionMesh.IResult =
    HumanInteractionMesh.adapt({
      reference: reference.points,
      bones: reference.bones,
      contacts: [],
      mesh,
    });
  const moved: number = Math.max(
    ...same.points.map((p: IAutoMovieVector3, i: number): number =>
      Vector3.length(Vector3.subtract(p, reference.points[i]!)),
    ),
  );
  all.check(
    `the reference adapted to itself moves ${moved.toExponential(2)} m, 1e-6 at most expected`,
    moved <= 1e-6,
  );

  // 3 and 4. Other pairs.
  for (const names of [
    ["f-small", "m-large"],
    ["m-large", "f-small"],
  ] as const) {
    const cell: string = `${names[0]} with ${names[1]}`;
    const target: IPair = pair(motionHumanBody(names[0]), motionHumanBody(names[1]));
    const contact: IAutoMovieMotionHumanInteractionMesh.IContact = {
      a: reference.index(0, "leftHand"),
      b: reference.index(1, "rightHand"),
    };
    const adapt = (): IAutoMovieMotionHumanInteractionMesh.IResult =>
      HumanInteractionMesh.adapt({
        reference: reference.points,
        // Both pairs list their joints in the rig's one order, so the
        // target's bone indices name the reference's points.
        bones: target.bones,
        contacts: [contact],
        mesh,
      });
    const adapted: IAutoMovieMotionHumanInteractionMesh.IResult = adapt();
    let stretched: number = 0;
    for (const b of target.bones)
      stretched = Math.max(
        stretched,
        Math.abs(
          Vector3.length(
            Vector3.subtract(adapted.points[b.from]!, adapted.points[b.to]!),
          ) - b.length,
        ),
      );
    all.check(
      `${cell}: a bone's length is off by up to ${(stretched * 1000).toFixed(2)} mm, ${BOUND * 1000} mm at most expected`,
      stretched <= BOUND,
    );
    const open: number = Vector3.length(
      Vector3.subtract(adapted.points[contact.a]!, adapted.points[contact.b]!),
    );
    all.check(
      `${cell}: the paired wrists are ${(open * 1000).toFixed(2)} mm apart, ${BOUND * 1000} mm at most expected`,
      open <= BOUND,
    );
    // A tetrahedron flat on the reference points (coplanar joints, oriented
    // only by the joggle) records no side; every other must keep its sign.
    // The joggle moves each corner by at most `δ` per axis, so each edge by
    // `2 √3 δ`, and the triple product of three edges no longer than twice
    // the extent by at most `3 (2 √3 δ)(2 extent)²`.
    const joggle: number =
      tetrahedralizeAutoMovieDelaunay.JOGGLE * Number.EPSILON * extent;
    const flat: number = 3 * (2 * Math.sqrt(3) * joggle) * (2 * extent) ** 2;
    const inverted: number = mesh.tetrahedra.filter((t: Tetrahedron): boolean => {
      const original: number = orientedVolume(reference.points, t);
      return Math.abs(original) > flat &&
        Math.sign(orientedVolume(adapted.points, t)) !== Math.sign(original);
    }).length;
    all.check(
      `${cell}: ${inverted} tetrahedra are inverted on the adapted points, none expected`,
      inverted === 0,
    );
    all.check(
      `${cell}: adapted twice, the points are the same bit for bit`,
      JSON.stringify(adapt().points) === JSON.stringify(adapted.points),
    );
  }

  // 6. The hold adapted through the motions' owner: two standing bodies'
  // displayed bones as the key, the wrists paired.
  const keyBodies: readonly [
    IAutoMovieMotionHumanBody,
    IAutoMovieMotionHumanBody,
  ] = [motionHumanBody("m-average"), motionHumanBody("f-average")];
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "hold-mesh",
    performers: keyBodies.map((body: IAutoMovieMotionHumanBody, k: number) => ({
      subject: k === 0 ? "a" : "b",
      body,
      at: { x: 0, y: 0, z: k === 0 ? 0 : keyBodies[0].measure.footLength },
      yaw: k === 0 ? 0 : 180,
      proficiency: { level: "trained" as const },
    })),
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.2 })
      .with(HumanChain.subject("b").stand({ seconds: 0.2 })).node,
  });
  const targets: readonly [
    IAutoMovieMotionHumanBody,
    IAutoMovieMotionHumanBody,
  ] = [motionHumanBody("f-small"), motionHumanBody("m-large")];
  const keys: [
    IAutoMovieMotionHumanHoldMesh.IKey,
    IAutoMovieMotionHumanHoldMesh.IKey,
  ] = [
    { body: keyBodies[0], bones: film.bones("a", 0.1) },
    { body: keyBodies[1], bones: film.bones("b", 0.1) },
  ];
  const held: [
    IAutoMovieMotionHumanHoldMesh.IAdapted,
    IAutoMovieMotionHumanHoldMesh.IAdapted,
  ] = HumanHoldMesh.adapt(keys, targets, [{ a: "leftHand", b: "rightHand" }]);
  const offset: IAutoMovieVector3 = Vector3.subtract(
    keys[0].bones.get("leftHand")!.worldPosition,
    keys[1].bones.get("rightHand")!.worldPosition,
  );
  const kept: number = Vector3.length(
    Vector3.subtract(
      Vector3.subtract(
        held[0].joints.get("leftHand")!,
        held[1].joints.get("rightHand")!,
      ),
      offset,
    ),
  );
  all.check(
    `the hold adapted to (f-small, m-large) keeps the wrists' key offset within ${(kept * 1000).toFixed(2)} mm, ${BOUND * 1000} mm at most expected`,
    kept <= BOUND,
  );
  held.forEach(
    (adapted: IAutoMovieMotionHumanHoldMesh.IAdapted, k: number): void => {
      for (const bone of targets[k]!.skeleton.bones) {
        if (bone.parent === null) continue;
        const a: IAutoMovieVector3 | undefined = adapted.joints.get(bone.bone);
        const b: IAutoMovieVector3 | undefined = adapted.joints.get(
          bone.parent,
        );
        if (a === undefined || b === undefined) continue;
        const off: number = Math.abs(
          Vector3.length(Vector3.subtract(a, b)) -
            Vector3.length(
              Vector3.subtract(
                targets[k]!.rest.get(bone.bone)!,
                targets[k]!.rest.get(bone.parent)!,
              ),
            ),
        );
        all.check(
          `the hold's body ${k} bone ${bone.parent}-${bone.bone} is off its length by ${(off * 1000).toFixed(2)} mm, ${BOUND * 1000} mm at most expected`,
          off <= BOUND,
        );
      }
      all.check(
        `the hold's body ${k} has its four limb goals, read ${Object.keys(adapted.limbs).join(", ")}`,
        Object.keys(adapted.limbs).length === 4,
      );
    },
  );

  // 7. A headlock (the plum clinch's hold on the neck, `HumanStageFight`'s
  // headlock row) adapted from its key pose on the reference pair.
  const lock: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "hold-mesh",
    performers: keyBodies.map((body: IAutoMovieMotionHumanBody, k: number) => ({
      subject: k === 0 ? "a" : "b",
      body,
      at: { x: 0, y: 0, z: k === 0 ? 0 : keyBodies[0].measure.footLength * 2 },
      yaw: k === 0 ? 0 : 180,
      proficiency: { level: "trained" as const },
    })),
    composition: HumanChain.subject("b")
      .stand({ seconds: 3 })
      .with(
        HumanChain.subject("a").act("clinch", {
          partner: "b",
          grip: "plum",
          hold: 2,
        } as never),
      ).node,
  });
  const segment = lock.segments("a")[0]!;
  const holding: number =
    segment.start +
    segment.plan.duration *
      (segment.plan.events.find((e) => e.name === "stroke")?.share ?? 0.5);
  const lockKeys: [
    IAutoMovieMotionHumanHoldMesh.IKey,
    IAutoMovieMotionHumanHoldMesh.IKey,
  ] = [
    { body: keyBodies[0], bones: lock.bones("a", holding) },
    { body: keyBodies[1], bones: lock.bones("b", holding) },
  ];
  const lockContacts: IAutoMovieMotionHumanHoldMesh.IContact[] = [
    { a: "leftHand", b: "neck" },
    { a: "rightHand", b: "neck" },
  ];
  for (const order of [
    ["f-small", "m-large"],
    ["m-large", "f-small"],
  ] as const) {
    const bodiesOf: readonly [
      IAutoMovieMotionHumanBody,
      IAutoMovieMotionHumanBody,
    ] = [motionHumanBody(order[0]), motionHumanBody(order[1])];
    const locked: [
      IAutoMovieMotionHumanHoldMesh.IAdapted,
      IAutoMovieMotionHumanHoldMesh.IAdapted,
    ] = HumanHoldMesh.adapt(lockKeys, bodiesOf, lockContacts);
    for (const c of lockContacts) {
      const offset: IAutoMovieVector3 = Vector3.subtract(
        lockKeys[0].bones.get(c.a)!.worldPosition,
        lockKeys[1].bones.get(c.b)!.worldPosition,
      );
      const off: number = Vector3.length(
        Vector3.subtract(
          Vector3.subtract(
            locked[0].joints.get(c.a)!,
            locked[1].joints.get(c.b)!,
          ),
          offset,
        ),
      );
      all.check(
        `the headlock adapted to (${order[0]}, ${order[1]}): the ${c.a} keeps its key offset from the ${c.b} within ${(off * 1000).toFixed(2)} mm, ${BOUND * 1000} mm at most expected`,
        off <= BOUND,
      );
    }
  }
  // 5. Refusals.
  all.refuses("fewer than four points", () =>
    HumanInteractionMesh.adapt({
      reference: reference.points.slice(0, 3),
      bones: [],
      contacts: [],
    }),
  );
  all.refuses("a bone of no length", () =>
    HumanInteractionMesh.adapt({
      reference: reference.points,
      bones: [{ from: 0, to: 1, length: 0 }],
      contacts: [],
    }),
  );
  all.assert("the interaction mesh keeps a hold's relations on any pair");
}

/** Intersect the three perpendicular bisectors in coordinates relative to a corner. */
function circumsphere(
  points: readonly IAutoMovieVector3[],
  t: Tetrahedron,
): Sphere {
  const a: IAutoMovieVector3 = points[t[0]]!;
  const u: IAutoMovieVector3 = Vector3.subtract(points[t[1]]!, a);
  const v: IAutoMovieVector3 = Vector3.subtract(points[t[2]]!, a);
  const w: IAutoMovieVector3 = Vector3.subtract(points[t[3]]!, a);
  const d: number = determinant(u, v, w);
  if (d === 0) return null;
  // The translated centre c satisfies 2 u·c = u·u and the two analogues.
  const offset: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(
      Vector3.add(
        Vector3.scale(Vector3.cross(v, w), Vector3.dot(u, u)),
        Vector3.scale(Vector3.cross(w, u), Vector3.dot(v, v)),
      ),
      Vector3.scale(Vector3.cross(u, v), Vector3.dot(w, w)),
    ),
    1 / (2 * d),
  );
  return { centre: Vector3.add(a, offset), radius: Vector3.length(offset) };
}

/** Six times signed volume as the determinant of three corner differences. */
function orientedVolume(
  points: readonly IAutoMovieVector3[],
  t: Tetrahedron,
): number {
  const a: IAutoMovieVector3 = points[t[0]]!;
  return determinant(
    Vector3.subtract(points[t[1]]!, a),
    Vector3.subtract(points[t[2]]!, a),
    Vector3.subtract(points[t[3]]!, a),
  );
}

/** Expand along the first row without invoking the geometric solver. */
function determinant(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): number {
  return a.x * (b.y * c.z - b.z * c.y) -
    a.y * (b.x * c.z - b.z * c.x) +
    a.z * (b.x * c.y - b.y * c.x);
}
