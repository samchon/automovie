import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HUMAN_STICKMAN_POSES } from "../../../../packages/human/dev/src/human-stickman/HUMAN_STICKMAN_POSES";
import { HumanPeople } from "../internal/HumanPeople";

type V3 = [number, number, number];

/** Metres of an edge a pose may not stretch past this many times its rest length. */
const STRETCH: number = 4;

/** Share of its rest area a limb's ring may fall to under a pose. */
const THIN: number = 0.6;

/** How far from its joint a hinge's even share may lie, in the limb's radii there. */
const OFF_CENTRE: number = 0.35;

/** Least length of a hinge's blend, from a tenth to nine tenths, in the same radii. */
const BLEND_LEAST: number = 0.5;

/** Weight a side's bones may keep on the midline, where the two sides meet. */
const MIDLINE: number = 0.01;

/** Weight a skin point may keep on an eye, which turns inside the skin. */
const ON_EYE: number = 0;

/** Share of a limb's triangles a pose may turn over beyond those already so at rest. */
const INVERTED: number = 0.05;

/** World transform of each rig bone under a pose, or at the bind for none. */
function worlds(
  rig: AutoMovieHumanRig.IRig,
  output?: AutoMovieHumanSkeleton.IOutput,
): Map<string, { from: V3; to: V3; q: number[] }> {
  const rest = new Map<string, V3>();
  for (const bone of rig.skeleton.bones) {
    const base: V3 = bone.parent === null ? [0, 0, 0] : rest.get(bone.parent)!;
    const t = bone.rest.translation;
    rest.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
  }
  const local =
    output === undefined
      ? AutoMovieHumanRig.bindLocals(rig.skeleton)
      : AutoMovieHumanRig.locals(rig.skeleton, output);
  const out = new Map<string, { from: V3; to: V3; q: number[] }>();
  for (const bone of rig.skeleton.bones) {
    const own = local.get(bone.bone)!;
    const parent = bone.parent === null ? null : out.get(bone.parent)!;
    const q: number[] = parent === null ? own.rotation : multiply(parent.q, own.rotation);
    const to: V3 = parent === null ? own.translation : add(parent.to, rotate(parent.q, own.translation));
    out.set(bone.bone, { from: rest.get(bone.bone)!, to, q });
  }
  return out;
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function multiply(p: number[], q: number[]): number[] {
  return [
    p[3]! * q[0]! + p[0]! * q[3]! + p[1]! * q[2]! - p[2]! * q[1]!,
    p[3]! * q[1]! - p[0]! * q[2]! + p[1]! * q[3]! + p[2]! * q[0]!,
    p[3]! * q[2]! + p[0]! * q[1]! - p[1]! * q[0]! + p[2]! * q[3]!,
    p[3]! * q[3]! - p[0]! * q[0]! - p[1]! * q[1]! - p[2]! * q[2]!,
  ];
}

function rotate(q: number[], v: V3): V3 {
  const r: number[] = multiply(multiply(q, [v[0], v[1], v[2], 0]), [-q[0]!, -q[1]!, -q[2]!, q[3]!]);
  return [r[0]!, r[1]!, r[2]!];
}

/** A vertex under linear blend skinning. */
function posed(
  p: V3,
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): V3 {
  let out: V3 = [0, 0, 0];
  for (let i: number = 0; i < 4; i++) {
    const w: number = skin.weights[4 * v + i]!;
    if (w === 0) continue;
    const b = world.get(skin.joints[skin.boneIndices[4 * v + i]!]!)!;
    const moved: V3 = add(b.to, rotate(b.q, [p[0] - b.from[0], p[1] - b.from[1], p[2] - b.from[2]]));
    out = add(out, [moved[0] * w, moved[1] * w, moved[2] * w]);
  }
  return out;
}

/** A vertex under dual-quaternion blending, as the model draws it. */
function blended(
  p: V3,
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): V3 {
  const real: number[] = [0, 0, 0, 0];
  const dual: number[] = [0, 0, 0, 0];
  let first: number[] | null = null;
  for (let i: number = 0; i < 4; i++) {
    const w: number = skin.weights[4 * v + i]!;
    if (w === 0) continue;
    const b = world.get(skin.joints[skin.boneIndices[4 * v + i]!]!)!;
    const turned: V3 = rotate(b.q, b.from);
    const t: V3 = [b.to[0] - turned[0], b.to[1] - turned[1], b.to[2] - turned[2]];
    first ??= b.q;
    const dot: number = b.q.reduce((s: number, c: number, k: number): number => s + c * first![k]!, 0);
    const s: number = dot < 0 ? -w : w;
    const d: number[] = multiply([t[0], t[1], t[2], 0], b.q).map((c: number): number => c / 2);
    for (let k: number = 0; k < 4; k++) {
      real[k]! += s * b.q[k]!;
      dual[k]! += s * d[k]!;
    }
  }
  const length: number = Math.hypot(...real);
  const q: number[] = real.map((c: number): number => c / length);
  const e: number[] = dual.map((c: number): number => c / length);
  const t: number[] = multiply(e, [-q[0]!, -q[1]!, -q[2]!, q[3]!]);
  return add(rotate(q, p), [2 * t[0]!, 2 * t[1]!, 2 * t[2]!]);
}

/**
 * Area a closed ring spans, the length of its area vector. A limb flattened to
 * a ribbon keeps its perimeter and loses this.
 */
function spanned(ring: readonly V3[]): number {
  const n: V3 = [0, 0, 0];
  ring.forEach((p: V3, i: number): void => {
    const q: V3 = ring[(i + 1) % ring.length]!;
    n[0] += p[1] * q[2] - p[2] * q[1];
    n[1] += p[2] * q[0] - p[0] * q[2];
    n[2] += p[0] * q[1] - p[1] * q[0];
  });
  return Math.hypot(...n) / 2;
}

/** A limb's bound ring at rest, read under every pose. */
interface ILimbRing {
  chain: string;
  station: number;
  rest: V3[];
  skin: ReturnType<AutoMovieHumanRig.IRig["bind"]>;
  area: number;
}

/** Every limb's rings, bound once. */
function limbRings(
  body: IAutoMovieHumanBodyCalibration,
  scale: number,
  rig: AutoMovieHumanRig.IRig,
): ILimbRing[] {
  const phases: number[] = Array.from(
    { length: 64 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 64,
  );
  return body.chains
    .filter((chain): boolean => /^(arm|leg)\./.test(chain.name))
    .flatMap((chain): ILimbRing[] =>
      // The end layers are the hand's and the trunk's rings, not a limb's.
      chain.layers.slice(1, -1).map((layer): ILimbRing => {
        const rest: V3[] = AutoMovieHumanLoftChain.ring(chain, layer.y, phases).map(
          (p: V3): V3 => [p[0] * scale, p[1] * scale, p[2] * scale],
        );
        return {
          chain: chain.name,
          station: layer.y,
          rest,
          skin: rig.bind(rest.flat()),
          area: spanned(rest),
        };
      }),
    );
}

/** Every limb ring keeps its girth under a pose, listing those that do not. */
function auditGirths(
  name: string,
  rings: readonly ILimbRing[],
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
  label: string,
): string[] {
  const worst = new Map<string, { ratio: number; at: number }>();
  for (const ring of rings) {
    const moved: V3[] = ring.rest.map(
      (p: V3, v: number): V3 => blended(p, ring.skin, v, world),
    );
    const ratio: number = spanned(moved) / ring.area;
    if (ratio < (worst.get(ring.chain)?.ratio ?? Infinity))
      worst.set(ring.chain, { ratio, at: ring.station });
  }
  return [...worst]
    .filter(([, w]): boolean => w.ratio < THIN)
    .map(
      ([chain, w]): string =>
        `${name} ${label} ${chain} thins to ${w.ratio.toFixed(2)} at ${w.at.toFixed(0)}`,
    );
}

/** Share of a set of bones in a skin point. */
function shareOf(
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  bones: readonly string[],
): number {
  let out: number = 0;
  for (let i: number = 0; i < 4; i++)
    if (bones.includes(skin.joints[skin.boneIndices[4 * v + i]!]!))
      out += skin.weights[4 * v + i]!;
  return out;
}

/** One hinge: the chain it lies on and the bones either side of it. */
const HINGES: readonly [chain: string, joint: string, near: string[], far: string[]][] = [
  ["arm.left", "leftLowerArm", ["leftUpperArm"], ["leftLowerArm", "leftHand"]],
  ["arm.right", "rightLowerArm", ["rightUpperArm"], ["rightLowerArm", "rightHand"]],
  ["leg.left", "leftLowerLeg", ["leftUpperLeg"], ["leftLowerLeg"]],
  ["leg.right", "rightLowerLeg", ["rightUpperLeg"], ["rightLowerLeg"]],
];

/**
 * A hinge's skin turns where its joint is, over a length the limb can show. A
 * blend that lies off the joint leaves one bone's shell standing past it as a
 * cuff, and one with no length is a hard cut.
 */
function auditHinges(
  name: string,
  body: IAutoMovieHumanBodyCalibration,
  scale: number,
  rig: AutoMovieHumanRig.IRig,
  joints: ReadonlyMap<string, V3>,
): string[] {
  const out: string[] = [];
  const phases: number[] = Array.from(
    { length: 24 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 24,
  );
  for (const [chainName, joint, near, far] of HINGES) {
    const chain = body.chains.find((c): boolean => c.name === chainName)!;
    const low: number = chain.layers[0]!.y;
    const high: number = chain.layers[chain.layers.length - 1]!.y;
    const stops: { at: V3; share: number; radius: number }[] = [];
    for (let k: number = 0; k <= 96; k++) {
      const s: number = low + ((high - low) * k) / 96;
      const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, s, phases).map(
        (p: V3): V3 => [p[0] * scale, p[1] * scale, p[2] * scale],
      );
      const skin = rig.bind(ring.flat());
      const middle: V3 = ring
        .reduce((a: V3, p: V3): V3 => add(a, p), [0, 0, 0])
        .map((c: number): number => c / ring.length) as V3;
      let share: number = 0;
      let radius: number = 0;
      ring.forEach((p: V3, v: number): void => {
        const a: number = shareOf(skin, v, far);
        const b: number = shareOf(skin, v, near);
        share += a + b === 0 ? 0 : a / (a + b);
        radius += Math.hypot(p[0] - middle[0], p[1] - middle[1], p[2] - middle[2]);
      });
      stops.push({ at: middle, share: share / ring.length, radius: radius / ring.length });
    }

    // The limb's axis runs up the chain, so each share crosses once near the joint.
    const centre: V3 = joints.get(joint)!;
    const close: number = stops.reduce(
      (best: number, s, i: number): number =>
        Math.hypot(s.at[0] - centre[0], s.at[1] - centre[1], s.at[2] - centre[2]) <
        Math.hypot(stops[best]!.at[0] - centre[0], stops[best]!.at[1] - centre[1], stops[best]!.at[2] - centre[2])
          ? i
          : best,
      0,
    );
    const crossing = (level: number): V3 | null => {
      for (let span: number = 0; span < stops.length; span++)
        for (const i of [close + span, close - span - 1]) {
          const a = stops[i];
          const b = stops[i + 1];
          if (a === undefined || b === undefined) continue;
          if ((a.share - level) * (b.share - level) > 0) continue;
          const t: number = (level - a.share) / (b.share - a.share || 1);
          return [0, 1, 2].map((c: number): number => a.at[c]! + (b.at[c]! - a.at[c]!) * t) as V3;
        }
      return null;
    };
    const even: V3 | null = crossing(0.5);
    const radius: number = stops[close]!.radius;
    if (even === null) {
      out.push(`${name} ${joint} has no even share on ${chainName}`);
      continue;
    }
    const off: number = Math.hypot(even[0] - centre[0], even[1] - centre[1], even[2] - centre[2]);
    if (off > OFF_CENTRE * radius)
      out.push(`${name} ${joint} blends ${(off * 1000).toFixed(1)} mm off its joint, radius ${(radius * 1000).toFixed(1)} mm`);
    const from: V3 | null = crossing(0.9);
    const to: V3 | null = crossing(0.1);
    const length: number =
      from === null || to === null
        ? 0
        : Math.hypot(from[0] - to[0], from[1] - to[1], from[2] - to[2]);
    if (length < BLEND_LEAST * radius)
      out.push(`${name} ${joint} blends over ${(length * 1000).toFixed(1)} mm only`);
  }
  return out;
}

/**
 * Each part of the skin rides the bone that carries it: the face and the ears
 * the head, the middle of the neck the neck, the heel the foot, and nothing an
 * eye.
 */
function auditOwners(
  name: string,
  body: IAutoMovieHumanBodyCalibration,
  scale: number,
  rig: AutoMovieHumanRig.IRig,
  joints: ReadonlyMap<string, V3>,
): string[] {
  const out: string[] = [];
  const phases: number[] = Array.from(
    { length: 48 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 48,
  );
  const bindRing = (chain: (typeof body.chains)[number], s: number) => {
    const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, s, phases).map(
      (p: V3): V3 => [p[0] * scale, p[1] * scale, p[2] * scale],
    );
    return { ring, skin: rig.bind(ring.flat()) };
  };
  for (const chain of body.chains.filter((c): boolean => c.name.startsWith("head")))
    for (const layer of chain.layers) {
      const { ring, skin } = bindRing(chain, layer.y);
      ring.forEach((p: V3, v: number): void => {
        const on: number = shareOf(skin, v, ["leftEye", "rightEye"]);
        if (on > ON_EYE) out.push(`${name} ${chain.name} skin keeps ${on.toFixed(3)} on an eye at ${p[1].toFixed(3)}`);
      });
    }

  // The face above the mouth: a chain point at the eyes' height, in front of the hinge.
  const eye: V3 = joints.get("leftEye")!;
  const middle = body.chains.find((c): boolean => c.name === "head.middle")!;
  const crown: V3 = joints.get("head")!;
  const brow = bindRing(middle, middle.layers[middle.layers.length - 1]!.y);
  brow.ring.forEach((p: V3, v: number): void => {
    if (p[0] <= crown[0]) return;
    const on: number = shareOf(brow.skin, v, ["head"]);
    if (on < 0.99) out.push(`${name} the face at ${(p[1] - eye[1]).toFixed(3)} from the eyes keeps ${on.toFixed(3)} on the head`);
  });

  // The neck, a third of the way from its base to the skull, clear of the chest.
  const base: V3 = joints.get("neck")!;
  const height: number = (base[1] + (crown[1] - base[1]) / 3) / scale;
  const lower = body.chains.find((c): boolean => c.name === "head.lower")!;
  const neck = bindRing(lower, Math.min(height, lower.layers[lower.layers.length - 1]!.y));
  let owned: number = 0;
  neck.ring.forEach((_: V3, v: number): void => {
    owned += shareOf(neck.skin, v, ["neck"]) / neck.ring.length;
  });
  if (owned < 0.5) out.push(`${name} the neck's middle keeps ${owned.toFixed(3)} on the neck`);

  // The heel, the rearmost point of each foot, rides the foot.
  for (const side of ["left", "right"]) {
    const chain = body.chains.find((c): boolean => c.name === `foot.${side}`)!;
    let heel: V3 | null = null;
    for (const layer of chain.layers)
      for (const p of AutoMovieHumanLoftChain.ring(chain, layer.y, phases))
        if (heel === null || p[0] * scale < heel[0]) heel = [p[0] * scale, p[1] * scale, p[2] * scale];
    const skin = rig.bind(heel!);
    const on: number = shareOf(skin, 0, [`${side}Foot`, `${side}Toes`]);
    if (on < 0.5) out.push(`${name} the ${side} heel keeps ${on.toFixed(3)} on its foot`);
  }
  return out;
}

/** Triangles a pose turns over, by the bone that holds them, past those so at rest. */
function auditInversions(
  name: string,
  label: string,
  pieces: readonly { name: string; positions: number[]; indices: number[]; normals: number[] }[],
  scale: number,
  rig: AutoMovieHumanRig.IRig,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): string[] {
  const zones = new Map<string, [number, number]>();
  for (const piece of pieces) {
    const metres: number[] = piece.positions.map((c: number): number => c * scale);
    const skin = rig.bind(metres);
    const count: number = metres.length / 3;
    const moved: V3[] = [];
    for (let v: number = 0; v < count; v++)
      moved.push(blended([metres[3 * v]!, metres[3 * v + 1]!, metres[3 * v + 2]!], skin, v, world));
    const normal = (points: (i: number) => V3, a: number, b: number, c: number): V3 => {
      const p: V3 = points(a);
      const q: V3 = points(b);
      const r: V3 = points(c);
      const u: V3 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const e: V3 = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      return [u[1] * e[2] - u[2] * e[1], u[2] * e[0] - u[0] * e[2], u[0] * e[1] - u[1] * e[0]];
    };
    const rest = (i: number): V3 => [metres[3 * i]!, metres[3 * i + 1]!, metres[3 * i + 2]!];
    for (let t: number = 0; t + 2 < piece.indices.length; t += 3) {
      const [a, b, c] = [piece.indices[t]!, piece.indices[t + 1]!, piece.indices[t + 2]!];
      let top: number = 0;
      for (let i: number = 1; i < 4; i++)
        if (skin.weights[4 * a + i]! > skin.weights[4 * a + top]!) top = i;
      const bone: string = skin.joints[skin.boneIndices[4 * a + top]!]!;
      const now: V3 = normal((i: number): V3 => moved[i]!, a, b, c);
      const before: V3 = normal(rest, a, b, c);

      // The rest normal carried by the blend of this triangle's first vertex.
      const turned: V3 = rotate(blendedTurn(skin, a, world), before);
      const zone: [number, number] = zones.get(bone) ?? [0, 0];
      zone[0]++;
      if (now[0] * turned[0] + now[1] * turned[1] + now[2] * turned[2] < 0) zone[1]++;
      zones.set(bone, zone);
    }
  }
  return [...zones]
    .filter(([, [all, over]]): boolean => all > 200 && over / all > INVERTED)
    .map(([bone, [all, over]]): string => `${name} ${label} ${bone} turns over ${over} of ${all} triangles`);
}

/** The blended rotation at a skin point. */
function blendedTurn(
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): number[] {
  const real: number[] = [0, 0, 0, 0];
  let first: number[] | null = null;
  for (let i: number = 0; i < 4; i++) {
    const w: number = skin.weights[4 * v + i]!;
    if (w === 0) continue;
    const q: number[] = world.get(skin.joints[skin.boneIndices[4 * v + i]!]!)!.q;
    first ??= q;
    const dot: number = q.reduce((s: number, c: number, k: number): number => s + c * first![k]!, 0);
    for (let k: number = 0; k < 4; k++) real[k]! += (dot < 0 ? -w : w) * q[k]!;
  }
  const length: number = Math.hypot(...real);
  return real.map((c: number): number => c / length);
}

/**
 * Every skin vertex binds to the rig, and a pose moves the prepared skin.
 *
 * @evidence contracts/testing.md#behavioral-verification Binds the generated skin of two people, evaluates a bent elbow and knee through the public skeleton, and moves each vertex by the mesh's own weights. It catches a weight that does not sum to one, a seam whose copies disagree, a rest pose that moves anything, a limb that fails to follow its bone, and a side that pulls the other.
 * @evidence contracts/testing.md#independent-expectations The binding's contract and rigid-body kinematics supply every expectation: weights sum to one, equal places move equally, identity pose moves nothing, and a bent arm leaves the other leg still. The stretch bound is a coarse limit, so it catches a torn skin and says nothing of a joint's form.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts rest against a bent left elbow and right knee, on a slender and a broad person, and reads every limb ring's girth and every region's turned-over triangles, digits included, at neutral, under the step-and-reach pose and under the range-limit pose, by the blend the model draws. The bind moves nothing; from neutral, skin on the bent limbs must move, skin on the far limbs must not, a limb must not thin, and the midline must keep nothing on a side's bones. Across every person it reads where each elbow and knee turns and over what length, and which bone holds the face, neck and heel. Skin-to-skin contact and penetration are not read here.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_skin_binding`, reading the people `HumanPeople` generates once per run and lofting their skin in process, with no renderer, browser or GPU.
 */
export const test_human_skin_binding = (): void => {
  const problems: string[] = [];
  for (const name of HumanPeople.names()) {
    const { body, scale, rig, evaluate } = HumanPeople.rigged(name);
    const at = new Map<string, V3>(
      evaluate({}).bones.map((b): [string, V3] => [b.bone, b.position]),
    );
    problems.push(
      ...auditHinges(name, body, scale, rig, at),
      ...auditOwners(name, body, scale, rig, at),
    );
  }
  for (const name of ["f1", "m2"]) {
    const { body, scale, rig, evaluate } = HumanPeople.rigged(name);
    const surface = AutoMovieHumanBodySurface.generate(body, []);
    const pieces = AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals);
    const rings: ILimbRing[] = limbRings(body, scale, rig);
    const bind = worlds(rig);
    const neutral = worlds(rig, evaluate({}));
    const bent: IAutoMovieHumanPose = {
      arms: { left: { elbow: { flexion: 90 } } },
      legs: { right: { knee: { flexion: 90 } } },
    } as IAutoMovieHumanPose;
    const moved = worlds(rig, evaluate(bent));
    const copies = new Map<string, string>();
    let idle: number = 0;
    let hand: number = 0;
    let farLeg: number = 0;
    let torn: number = 0;
    for (const piece of pieces) {
      const metres: number[] = piece.positions.map((v: number): number => v * scale);
      const skin = rig.bind(metres);
      const count: number = metres.length / 3;
      const out: V3[] = [];
      for (let v: number = 0; v < count; v++) {
        const total: number =
          skin.weights[4 * v]! + skin.weights[4 * v + 1]! + skin.weights[4 * v + 2]! + skin.weights[4 * v + 3]!;
        if (!(Math.abs(total - 1) < 1e-6)) problems.push(`${name} ${piece.name} weights sum to ${total}`);
        const p: V3 = [metres[3 * v]!, metres[3 * v + 1]!, metres[3 * v + 2]!];
        const key: string = p.map((c: number): string => c.toFixed(7)).join();
        const bound: string = [0, 1, 2, 3]
          .map((i: number): string => `${skin.joints[skin.boneIndices[4 * v + i]!]}:${skin.weights[4 * v + i]!.toFixed(6)}`)
          .join();
        const seen: string | undefined = copies.get(key);
        if (seen !== undefined && seen !== bound) problems.push(`${name} seam copies differ at ${key}`);
        copies.set(key, bound);
        if (Math.abs(p[2]) < 5e-4)
          for (let i: number = 0; i < 4; i++) {
            const bone: string = skin.joints[skin.boneIndices[4 * v + i]!]!;
            const w: number = skin.weights[4 * v + i]!;
            if (/^(left|right)/.test(bone) && w > MIDLINE)
              problems.push(`${name} the midline keeps ${w.toFixed(3)} on ${bone} at ${p[1].toFixed(3)}`);
          }
        const still: V3 = posed(p, skin, v, bind);
        idle = Math.max(idle, Math.hypot(still[0] - p[0], still[1] - p[1], still[2] - p[2]));
        const q: V3 = posed(p, skin, v, moved);
        out.push(q);
        const from: V3 = posed(p, skin, v, neutral);
        const by: number = Math.hypot(q[0] - from[0], q[1] - from[1], q[2] - from[2]);
        if (/^(hand|finger|thumb)\.left/.test(piece.name)) hand = Math.max(hand, by);
        if (/^(foot|toe|forefoot)\.left/.test(piece.name)) farLeg = Math.max(farLeg, by);
      }
      for (let i: number = 0; i + 1 < piece.indices.length; i += 3)
        for (const [a, b] of [[piece.indices[i]!, piece.indices[i + 1]!]] as [number, number][]) {
          const was: number = Math.hypot(metres[3 * a]! - metres[3 * b]!, metres[3 * a + 1]! - metres[3 * b + 1]!, metres[3 * a + 2]! - metres[3 * b + 2]!);
          const now: number = Math.hypot(out[a]![0] - out[b]![0], out[a]![1] - out[b]![1], out[a]![2] - out[b]![2]);
          if (was > 1e-4 && now / was > STRETCH) torn++;
        }
    }
    if (idle > 1e-6) problems.push(`${name} the bind moves the skin by ${idle} m`);
    if (hand < 0.1) problems.push(`${name} the bent arm's hand moved only ${hand} m`);
    if (farLeg > 1e-3) problems.push(`${name} the other leg's foot moved ${farLeg} m`);
    if (torn > 0) problems.push(`${name} ${torn} edges stretched past ${STRETCH} times`);
    for (const label of ["neutral", "demo", "limit"]) {
      const world = worlds(rig, evaluate(HUMAN_STICKMAN_POSES[label]!));
      problems.push(
        ...auditGirths(name, rings, world, label),
        ...auditInversions(name, label, pieces, scale, rig, world),
      );
    }
  }
  if (problems.length === 0) return;

  // A broken binding repeats one defect at every vertex, so each place and
  // kind reads as one line with its count, and none is left out.
  const kinds = new Map<string, [string, number]>();
  for (const problem of problems) {
    const key: string = problem.replace(/-?\d+\.\d+(,-?\d+\.\d+)*/g, "#");
    const found: [string, number] | undefined = kinds.get(key);
    if (found === undefined) kinds.set(key, [problem, 1]);
    else found[1]++;
  }
  throw new Error(
    `${problems.length} binding problems:\n${[...kinds.values()]
      .map(([first, count]: [string, number]): string =>
        count === 1 ? first : `${first} (${count} alike)`,
      )
      .join("\n")}`,
  );
};
