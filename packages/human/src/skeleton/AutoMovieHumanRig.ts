import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMeshSkin,
  IAutoMovieModelPart,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The engine rig of a generated Human, and its skin binding.
 *
 * The Human skeleton has joints the humanoid vocabulary lacks: the scapula, the
 * atlas, the subtalar and midfoot joints and each toe. Each folds into the
 * nearest named bone that carries it, so the rig stays the shared vocabulary
 * while the clinical skeleton keeps its own joints.
 *
 * A vertex's weights are a function of its place alone. Parts are tessellated
 * apart and their seams hold copies of one physical point, so a binding read
 * from a part or a chain would give those copies different weights and open
 * the seam under any pose. Here equal places get equal weights.
 *
 * Skin passes down the skeleton as a tree of cuts. A joint holds a plane, and a
 * point's share in the child rises over that plane on a compact ramp as wide as
 * the skin is deep at the joint, so a hinge bends where the joint is and over a
 * length that follows the limb. Comparing capsules along a limb cannot do this:
 * their different radii carry the parent's shell past the joint, and the gap
 * between two capsules grows with the square of the distance from the joint, so
 * the skin stands still at an even share and then turns at once.
 *
 * Capsules still decide what lies beside what: an arm against the trunk, a
 * finger against its neighbour, the head against the neck. A leg's share falls
 * to nothing at the midline, so the two sides meet without a cut.
 */
export namespace AutoMovieHumanRig {
  /** A prepared rig. */
  export interface IRig {
    /** The rig the model carries. */
    skeleton: IAutoMovieSkeleton;

    /**
     * Bind a mesh's vertices.
     *
     * @param positions Vertices in metres, grouped in threes.
     * @param bone Bind every vertex to this bone alone, for a rigid part.
     * @returns Four influences per vertex.
     */
    bind(
      positions: readonly number[],
      bone?: AutoMovieHumanoidBone,
    ): IAutoMovieMeshSkin;
  }

  /** One bone's transform in its parent's frame, metres. */
  export interface ILocal {
    /** Offset from the parent. */
    translation: [number, number, number];

    /** Rotation from the parent, `[x, y, z, w]`. */
    rotation: [number, number, number, number];
  }

  /**
   * Prepare the rig of one body.
   *
   * @param calibration The body.
   * @param scale Metres per calibration millimetre.
   * @returns The rig and its binder.
   */
  export function prepare(
    calibration: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): IRig {
    const joints: AutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    const bones: AutoMovieHumanoidBone[] = [
      ...new Set(joints.map((j): AutoMovieHumanoidBone => named(j.bone))),
    ];
    const place = new Map<AutoMovieHumanoidBone, Vector>();
    const parentOf = new Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>();
    for (const j of joints) {
      const bone: AutoMovieHumanoidBone = named(j.bone);
      if (place.has(bone)) continue;
      place.set(bone, Math3D.times(j.position, scale));
      parentOf.set(bone, j.parent === null ? null : named(j.parent));
    }
    const byBone = new Map<string, AutoMovieHumanJointCentres.IJoint>(
      joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): [string, AutoMovieHumanJointCentres.IJoint] => [
          j.bone,
          j,
        ],
      ),
    );
    const skeleton: IAutoMovieSkeleton = {
      id: "automovie-human",
      bones: bones.map((bone: AutoMovieHumanoidBone): IAutoMovieBone => {
        const parent: AutoMovieHumanoidBone | null = parentOf.get(bone)!;
        const at: Vector = place.get(bone)!;
        const base: Vector = parent === null ? [0, 0, 0] : place.get(parent)!;
        const own: AutoMovieHumanJointCentres.IJoint = byBone.get(joint(bone))!;
        const axes: Math3D.IAxes = Math3D.boneAxes(
          own.bone,
          Math3D.unit(Math3D.sub(own.toward, own.position)),
          byBone,
        );
        return {
          bone,
          parent,
          axes: {
            flexion: vector(axes.flexion),
            abduction: vector(axes.abduction),
            twist: vector(axes.twist),
            twistPlacement: placement(bone),
          },
          rest: {
            translation: {
              x: at[0] - base[0],
              y: at[1] - base[1],
              z: at[2] - base[2],
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          constraint: null,
        };
      }),
    };
    const index = new Map<AutoMovieHumanoidBone, number>(
      bones.map((b: AutoMovieHumanoidBone, i: number): [AutoMovieHumanoidBone, number] => [b, i]),
    );
    const tree: ITree = grow(joints, calibration, scale, index);
    return {
      skeleton,
      bind: (
        positions: readonly number[],
        bone?: AutoMovieHumanoidBone,
      ): IAutoMovieMeshSkin => {
        const count: number = positions.length / 3;
        const boneIndices: number[] = new Array<number>(4 * count).fill(0);
        const weights: number[] = new Array<number>(4 * count).fill(0);
        for (let v: number = 0; v < count; v++) {
          if (bone !== undefined) {
            boneIndices[4 * v] = index.get(bone)!;
            weights[4 * v] = 1;
            continue;
          }
          const top: [number, number][] = influences(
            [positions[3 * v]!, positions[3 * v + 1]!, positions[3 * v + 2]!],
            tree,
            bones.length,
          );
          top.forEach(([b, w]: [number, number], i: number): void => {
            boneIndices[4 * v + i] = b;
            weights[4 * v + i] = w;
          });
        }
        return { joints: bones, boneIndices, weights };
      },
    };
  }

  /**
   * Give every part a skin. Construction curves take the same place-based
   * binding, so they stay on the skin they generate under any pose, and rigid
   * features ride one bone.
   *
   * @param parts The model's parts, in metres.
   * @param rig The body's rig.
   * @returns The parts bound to the rig.
   */
  export function dress(
    parts: readonly IAutoMovieModelPart[],
    rig: IRig,
  ): IAutoMovieModelPart[] {
    return parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (part.geometry.type !== "mesh") return part;
      const mesh = part.geometry.mesh;
      return {
        ...part,
        geometry: {
          ...part.geometry,
          mesh: {
            ...mesh,
            skin: {
              ...rig.bind(mesh.positions, rigid(part.id)),
              method: BLEND,
            },
          },
        },
      };
    });
  }

  /**
   * An evaluated Human pose as each rig bone's transform in its parent's frame.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns Per bone, the local transform to apply.
   */
  export function locals(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): Map<AutoMovieHumanoidBone, ILocal> {
    const placed = new Map<string, AutoMovieHumanSkeleton.IPlacement>(
      pose.posed.map((p): [string, AutoMovieHumanSkeleton.IPlacement] => [p.bone, p]),
    );
    const out = new Map<AutoMovieHumanoidBone, ILocal>();
    for (const bone of rest.bones) {
      // A pose evaluated for another body or skeleton lacks a rig bone's
      // joint; refusing it here keeps a foreign pose from placing any bone.
      const own: AutoMovieHumanSkeleton.IPlacement | undefined = placed.get(
        joint(bone.bone),
      );
      const parent: AutoMovieHumanSkeleton.IPlacement | undefined =
        bone.parent === null ? undefined : placed.get(joint(bone.parent));
      if (own === undefined || (bone.parent !== null && parent === undefined))
        throw new Error(
          `Evaluated Human pose lacks the joint of rig bone ${bone.bone}`,
        );
      if (parent === undefined) {
        out.set(bone.bone, { translation: own.position, rotation: own.rotation });
        continue;
      }
      const inverse: Math3D.Quaternion = [
        -parent.rotation[0],
        -parent.rotation[1],
        -parent.rotation[2],
        parent.rotation[3],
      ];
      out.set(bone.bone, {
        translation: Math3D.rotate(inverse, Math3D.sub(own.position, parent.position)),
        rotation: Math3D.multiply(inverse, own.rotation),
      });
    }
    return out;
  }

  /**
   * The rig at its bind, the posture the skin was generated in, as local
   * transforms. This is not neutral, which is a pose of the bind.
   *
   * @param rest The rig.
   * @returns Per bone, the local transform that leaves the skin as generated.
   */
  export function bindLocals(
    rest: IAutoMovieSkeleton,
  ): Map<AutoMovieHumanoidBone, ILocal> {
    return new Map(
      rest.bones.map((bone: IAutoMovieBone): [AutoMovieHumanoidBone, ILocal] => {
        const t = bone.rest.translation;
        return [
          bone.bone,
          { translation: [t.x, t.y, t.z], rotation: [0, 0, 0, 1] },
        ];
      }),
    );
  }

  /**
   * An evaluated Human pose as the engine's clinical pose of this rig.
   *
   * The rig's rest is the bind, its rotations are identity and its bones declare
   * the Human's own axes and composition, so each local rotation from the bind
   * splits exactly into the three angles the engine composes back. These are
   * the rig's angles from the bind: neutral is itself a turn of them, so they
   * read the clinical field only where a bone's achieved offset is zero. Only
   * translation has no channel: a jaw's
   * protrusion and a shoulder girdle's slide are lost, and the bones they move
   * are listed so a caller can refuse them.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns The engine pose, and the bones whose translation it cannot carry.
   */
  export function enginePose(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): IEnginePose {
    const local: Map<AutoMovieHumanoidBone, ILocal> = locals(rest, pose);
    const joints: IAutoMovieJointPose[] = [];
    const translated: AutoMovieHumanoidBone[] = [];
    let root: Vector = [0, 0, 0];
    for (const bone of rest.bones) {
      const own: ILocal = local.get(bone.bone)!;
      const t = bone.rest.translation;
      const shift: Vector = [
        own.translation[0] - t.x,
        own.translation[1] - t.y,
        own.translation[2] - t.z,
      ];
      if (bone.parent === null) root = shift;
      else if (Math.hypot(...shift) > TRANSLATED) translated.push(bone.bone);
      joints.push({ bone: bone.bone, ...angles(own.rotation, bone.axes!) });
    }
    return {
      pose: {
        skeleton: rest.id,
        root: {
          translation: { x: root[0], y: root[1], z: root[2] },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        joints,
      },
      translated,
    };
  }

  /** An engine pose with what it could not carry. */
  export interface IEnginePose {
    /** The clinical pose. */
    pose: IAutoMoviePose;

    /** Bones that moved along their parent, which the engine's rig cannot do. */
    translated: AutoMovieHumanoidBone[];
  }
}

type Vector = [number, number, number];

/** A tuple as an interface vector. */
function vector(v: readonly number[]): { x: number; y: number; z: number } {
  return { x: v[0]!, y: v[1]!, z: v[2]! };
}

/** Where a bone's twist sits: the forearm's is distal, as the skeleton composes it. */
function placement(bone: AutoMovieHumanoidBone): "distal" | "proximal" {
  return bone.endsWith("LowerArm") ? "distal" : "proximal";
}

/** A local rotation as the three clinical angles of its axes, degrees. */
function angles(
  q: readonly [number, number, number, number],
  axes: IAutoMovieJointAxes,
): Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist"> {
  const tuple = (v: { x: number; y: number; z: number }): Vector => [v.x, v.y, v.z];
  const distal: boolean = axes.twistPlacement === "distal";
  const f: Vector = tuple(axes.flexion);
  const a: Vector = tuple(axes.abduction);
  const t: Vector = tuple(axes.twist);

  // The composition is first * second * third about these axes. A left-handed
  // triple turns its last axis over, and that angle's sign with it.
  const first: Vector = distal ? a : t;
  const second: Vector = distal ? f : a;
  const third: Vector = distal ? t : f;
  const crossed: Vector = cross(first, second);
  const hand: number = dot(crossed, third) < 0 ? -1 : 1;
  const k: Vector = Math3D.times(third, hand);
  const m = (u: Vector, v: Vector): number =>
    dot(u, Math3D.rotate([q[0], q[1], q[2], q[3]], v));
  const beta: number = Math.asin(Math.max(-1, Math.min(1, m(first, k))));
  const alpha: number = Math.atan2(-m(second, k), m(k, k));
  const gamma: number = Math.atan2(-m(first, second), m(first, first));
  const degrees = (r: number): number => (r * 180) / Math.PI;
  const out: [number, number, number] = [
    degrees(alpha),
    degrees(beta),
    hand * degrees(gamma),
  ];
  return distal
    ? { abduction: out[0], flexion: out[1], twist: out[2] }
    : { twist: out[0], abduction: out[1], flexion: out[2] };
}

function cross(a: Vector, b: Vector): Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** One bone's piece of the binding tree. */
interface ILimb {
  /** The rig bone's slot. */
  slot: number;

  /** Start of the bone's capsule, metres. */
  from: Vector;

  /** End of the bone's capsule, metres. */
  to: Vector;

  /** Capsule radius at the start, metres. */
  near: number;

  /** Capsule radius at the end, metres. */
  far: number;

  /** The cuts that hand skin down from the parent; a point must pass them all. */
  planes: IPlane[];

  /** The jaw's cut along the lips' contact line, or null for any other limb. */
  lips: ILips | null;

  /** Width of the fall to nothing at the midline, metres; zero for no fall. */
  midline: number;

  /** Past this plane a limb has left the midline and the fall no longer applies. */
  clear: IPlane | null;

  /** Side of the body: left 1, right -1, midline 0. */
  side: number;

  /** Limbs that hold skin beside this one, compared by capsule. */
  rivals: ILimb[];

  /** The capsules that answer for this limb in that comparison. */
  own: ILimb[];

  /** Half of a capsule comparison's ramp, metres. */
  contest: number;

  /** Limbs the skin passes on to. */
  kids: ILimb[];
}

/** A plane across a joint: a point's share climbs from behind it to before it. */
interface IPlane {
  /** Point on the plane, metres. */
  at: Vector;

  /** Unit normal toward the child. */
  normal: Vector;

  /** Half of the ramp's width, metres. */
  half: number;
}

/** The lips' contact line the jaw's skin is cut along, metres. */
interface ILips {
  /** Contact line's height at shares 0, 1/16 .. 1 of the half width. */
  contact: number[];

  /** Half width, midline to cheilion. */
  width: number;

  /** Height away from the contact line over which a crossing share fades, over the cheek. */
  wide: number;
}

/** The binding tree of one body. */
interface ITree {
  /** The trunk's first limb. */
  root: ILimb;

  /** The chest bone's slot, where an arm's cut leaves its skin. */
  chest: number;

  /** Each arm: its limb and the trunk-side limbs it is compared against. */
  arms: IArm[];
}

/** An arm, whose skin beside the trunk is decided by capsule. */
interface IArm {
  /** The girdle limb that starts it. */
  limb: ILimb;

  /** Every limb of this arm. */
  own: ILimb[];

  /** Half of the comparison's ramp, metres. */
  contest: number;
}

/**
 * Grow the binding tree from the joints.
 *
 * Skin depth at a joint is the distance to the nearest skin. It is measured, so
 * a ramp follows the limb that is there rather than a radius read elsewhere.
 */
function grow(
  joints: readonly AutoMovieHumanJointCentres.IJoint[],
  calibration: IAutoMovieHumanBodyCalibration,
  scale: number,
  index: ReadonlyMap<AutoMovieHumanoidBone, number>,
): ITree {
  const skin: Float64Array = sampleSkin(calibration, scale);
  const byBone = new Map<string, AutoMovieHumanJointCentres.IJoint>(
    joints.map(
      (j: AutoMovieHumanJointCentres.IJoint): [string, AutoMovieHumanJointCentres.IJoint] => [
        j.bone,
        j,
      ],
    ),
  );
  const at = (bone: string): Vector =>
    Math3D.times(byBone.get(bone)!.position, scale);
  const limbs = new Map<string, ILimb>();
  const directions = new Map<string, Vector>();

  for (const j of joints) {
    if (FOLDED.test(j.bone)) continue;
    const from: Vector = Math3D.times(j.position, scale);
    const to: Vector =
      j.bone === "neck"
        ? at("head")
        : Math3D.times(j.tip ?? j.toward, scale);
    // A limb's girth stands for its flesh, but the chest narrows into the neck,
    // so its end takes the skin's depth there; and the clavicle has no flesh
    // of its own, so the girdle's capsule starts as a line and swells to the
    // arm's girth at the shoulder.
    // The thumb's metacarpal carries the thenar eminence, not a digit's girth:
    // a digit's girth there left 7-fold stretches across the thenar at neutral.
    const radius: number = /ThumbMetacarpal$/.test(j.bone)
      ? depth(Math3D.times(Math3D.add(from, to), 0.5), skin)
      : Math.max(j.radius, MINIMUM_RADIUS) * scale;
    const far: number =
      j.bone === "chest" ? Math.min(radius, depth(to, skin)) : radius;
    const near: number = /Shoulder$/.test(j.bone)
      ? MINIMUM_RADIUS * scale
      : radius;
    const limb: ILimb = {
      slot: index.get(named(j.bone))!,
      from,
      to,
      near,
      far,
      planes: [],
      lips: null,
      midline: 0,
      clear: null,
      side: j.bone.startsWith("left") ? 1 : j.bone.startsWith("right") ? -1 : 0,
      rivals: [],
      own: [],
      contest: 0,
      kids: [],
    };
    limbs.set(j.bone, limb);
    directions.set(j.bone, Math3D.unit(Math3D.sub(to, from)));

    // A folded joint's children hang from the limb that carries it.
    let parent: string | null = j.parent;
    while (parent !== null && FOLDED.test(parent))
      parent = byBone.get(parent)!.parent;
    if (parent === null) continue;
    const above: ILimb = limbs.get(parent)!;
    const d: Vector = directions.get(j.bone)!;
    const e: Vector = directions.get(parent)!;

    // A limb that leaves its parent sideways keeps the parent's plane: the foot
    // would otherwise cut the heel off along its own length. The girdle has no
    // line to continue, so its plane is square to itself.
    const along: number = Math.max(0, dot(d, e));
    const reach: number = Math.max(
      depth(from, skin),
      SHALLOWEST * Math.min(above.near, radius),
    );
    const normal: Vector = /UpperLeg$/.test(j.bone)
      ? Math3D.unit(
          Math3D.add(
            Math3D.add(d, Math3D.times(FORWARD, HIP_FORWARD)),
            Math3D.times(LEFT, limb.side * HIP_LATERAL),
          ),
        )
      : /Shoulder$/.test(j.bone)
        ? d
        : Math3D.unit(Math3D.add(e, Math3D.times(d, along)));
    if (j.bone !== "head" && j.bone !== "jaw")
      limb.planes = [
        /UpperArm$/.test(j.bone)
          ? {
              at: Math3D.sub(from, Math3D.times(normal, DELTOID * reach)),
              normal,
              half: SHOULDER_CUT * reach,
            }
          : { at: from, normal, half: CUT * reach },
      ];
    if (/UpperLeg$/.test(j.bone)) {
      limb.midline = MIDLINE * reach;
      limb.clear = {
        at: Math3D.add(from, Math3D.times(d, CROTCH * reach)),
        normal: d,
        half: CROTCH_RAMP * reach,
      };
    }

    // Within one bone there is nothing to cut: the toes are one channel.
    if (above.slot !== limb.slot) above.kids.push(limb);
  }

  // Siblings that share a parent's plane are told apart by capsule, and a limb
  // that leaves the parent sideways is told from the parent too.
  const family = (limb: ILimb): ILimb[] => [limb, ...limb.kids.flatMap(family)];
  for (const j of joints) {
    if (!/(Thumb|Index|Middle|Ring|Little)(Metacarpal|Proximal)$/.test(j.bone))
      continue;
    const limb: ILimb | undefined = limbs.get(j.bone);
    if (limb === undefined) continue;
    const hand: ILimb = limbs.get(j.bone.replace(/(Thumb|Index|Middle|Ring|Little).*$/, "Hand"))!;
    if (!hand.kids.includes(limb)) continue;
    limb.rivals = [
      ...hand.kids.filter((k: ILimb): boolean => k !== limb).flatMap(family),
      ...(j.bone.includes("Thumb") ? [hand] : []),
    ];
    limb.own = family(limb);
    limb.contest = FINGER_CONTEST * limb.near;
  }

  // The head is a ball from the chin to the crown. A capsule from the skull's
  // base would reach down the neck and leave the chin to it.
  const head: ILimb = limbs.get("head")!;
  const jaw: ILimb = limbs.get("jaw")!;
  const chin: Vector = jaw.to;
  const crown: Vector = head.to;
  head.from = Math3D.times(Math3D.add(chin, crown), 0.5);
  head.to = head.from;
  head.near = Math.hypot(...Math3D.sub(crown, chin)) / 2;
  head.far = head.near;
  head.rivals = [limbs.get("neck")!];
  head.own = [head];
  const neck: ILimb = limbs.get("neck")!;
  head.contest = depth(
    Math3D.times(Math3D.add(neck.from, neck.to), 0.5),
    skin,
  );

  const hinge: Vector = jaw.from;
  const span: number = Math.hypot(...Math3D.sub(chin, hinge));
  const eye: Vector = at("leftEye");
  const mouth: number = eye[1] - MOUTH * (crown[1] - eye[1]);

  // With a mouth the jaw takes the skin below the lips' contact line, and
  // across the opening along it the upper lip stays on the head while the
  // lower goes with the jaw: over the middle half of the mouth the hand-over is
  // narrower than the opening, so neither lip pulls the other, and toward the
  // cheilia it widens over the cheek, so the opening narrows to its corners
  // and the cheek's whole skin takes the stretch.
  // A mouth whose skin is not open keeps the level cut: a hand-over narrower
  // than the opening across whole skin would tear it.
  const lips: ILips | null =
    calibration.mouth === undefined ||
    !calibration.apertures.some((a): boolean => a.name === "mouth")
      ? null
      : {
          contact: calibration.mouth.contact.map((y: number): number => y * scale),
          width: calibration.mouth.width * scale,
          // Past the cheilia the cheek's skin between the maxilla and the
          // mandible's body takes the jaw's turn: half the stomion's height over
          // the menton. The jaw's own ramp, a 7 mm half, stretched the skin
          // round the commissure more than three times under a 20 mm opening on
          // every person.
          wide:
            ((calibration.mouth.stomion - calibration.mouth.menton) / 2) * scale,
        };
  jaw.lips = lips;
  jaw.planes = [
    ...(lips === null
      ? [
          {
            at: [hinge[0], mouth, 0] as Vector,
            normal: [0, -1, 0] as Vector,
            half: JAW_RAMP * span,
          },
        ]
      : []),
    {
      at: Math3D.add(hinge, Math3D.times(FORWARD, JAW_BACK * span)),
      normal: FORWARD,
      half: JAW_RAMP * span,
    },
  ];

  const arm = (side: "left" | "right"): IArm => {
    const limb: ILimb = limbs.get(`${side}Shoulder`)!;
    limbs.get("chest")!.kids = limbs
      .get("chest")!
      .kids.filter((k: ILimb): boolean => k !== limb);
    return {
      limb,
      own: family(limb),
      contest: ARM_CONTEST * depth(at(`${side}UpperArm`), skin),
    };
  };
  const arms: IArm[] = [arm("left"), arm("right")];
  const armed = new Set<ILimb>(arms.flatMap((a: IArm): ILimb[] => a.own));
  const trunk: ILimb[] = [...limbs].flatMap(
    ([bone, limb]: [string, ILimb]): ILimb[] =>
      armed.has(limb) || /Toe\d|Hallux/.test(bone) ? [] : [limb],
  );
  for (const a of arms) a.limb.rivals = trunk;
  return {
    root: limbs.get("hips")!,
    chest: limbs.get("chest")!.slot,
    arms,
  };
}

/** Skin of every chain as loose points in metres, three numbers each. */
function sampleSkin(
  calibration: IAutoMovieHumanBodyCalibration,
  scale: number,
): Float64Array {
  const points: number[] = [];
  for (const chain of calibration.chains)
    for (const layer of chain.layers)
      for (const p of AutoMovieHumanLoftChain.ring(chain, layer.y, SKIN_PHASES))
        points.push(p[0] * scale, p[1] * scale, p[2] * scale);
  return Float64Array.from(points);
}

/** Distance from a point to the nearest skin sample. */
function depth(p: Vector, skin: Float64Array): number {
  let best: number = Infinity;
  for (let i: number = 0; i < skin.length; i += 3) {
    const x: number = skin[i]! - p[0];
    const y: number = skin[i + 1]! - p[1];
    const z: number = skin[i + 2]! - p[2];
    const d: number = x * x + y * y + z * z;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/** The rig bone a Human joint folds into. */
function named(joint: string): AutoMovieHumanoidBone {
  if (joint === "atlas") return "neck";
  const side: "left" | "right" = joint.startsWith("left") ? "left" : "right";
  if (joint.endsWith("Scapula")) return `${side}Shoulder`;
  if (joint.endsWith("Subtalar") || joint.endsWith("Midfoot"))
    return `${side}Foot`;
  if (/Hallux|Toe\d/.test(joint)) return `${side}Toes`;
  return joint as AutoMovieHumanoidBone;
}

/** The Human joint that places a rig bone: the toes hang off the great toe's. */
function joint(bone: AutoMovieHumanoidBone): string {
  return bone.endsWith("Toes") ? bone.replace("Toes", "HalluxProximal") : bone;
}

/** The bone a rigid part rides, if it is one. */
function rigid(id: string): AutoMovieHumanoidBone | undefined {
  if (id.startsWith("human.eye.left")) return "leftEye";
  if (id.startsWith("human.eye.right")) return "rightEye";
  if (/^human\.(hair|brow|lash|eyebrow|eyelash)/.test(id)) return "head";
  // The upper teeth stand in the skull; the lower and the tongue on the
  // mandible, whose turn the tongue's own controls already allow for.
  if (/^human\.mouth\.(teeth|gum)\.upper$/.test(id)) return "head";
  if (/^human\.mouth\.((teeth|gum)\.lower|tongue)$/.test(id)) return "jaw";
  return undefined;
}

/** The strongest four influences on a point, normalized. */
function influences(
  p: Vector,
  tree: ITree,
  count: number,
): [number, number][] {
  const pulls: Float64Array = new Float64Array(count);

  // An arm takes what lies nearer its own capsules than the trunk's. Behind its
  // first cut that skin rests on the chest.
  let trunk: number = 1;
  for (const arm of tree.arms) {
    const mine: number = nearest(p, arm.own);
    const theirs: number = nearest(p, arm.limb.rivals);
    const taken: number = ramp((theirs - mine) / arm.contest);
    if (taken <= 0) continue;
    trunk -= taken;
    const onward: number = taken * cutShare(arm.limb, p);
    pulls[tree.chest]! += taken - onward;
    if (onward > 0) spread(arm.limb, onward, p, pulls);
  }
  if (trunk > 0) spread(tree.root, trunk, p, pulls);

  // The strongest four bones, the first met leading on a tie.
  const top: [number, number][] = [];
  pulls.forEach((w: number, slot: number): void => {
    if (w <= 0) return;
    let at: number = top.length;
    while (at > 0 && w > top[at - 1]![1]) at--;
    if (at === 4) return;
    top.splice(at, 0, [slot, w]);
    if (top.length > 4) top.pop();
  });
  const total: number = top.reduce(
    (a: number, e: [number, number]): number => a + e[1],
    0,
  );

  // A thousandth of a bone's pull is below what a skin can show, and every
  // weight is carried as text to the page, so the strongest takes the remainder
  // of the rounding and the rest stay short.
  const rounded: [number, number][] = top
    .slice(1)
    .map(([b, w]: [number, number]): [number, number] => [
      b,
      Math.round((w / total) * STEPS) / STEPS,
    ]);
  const rest: number = rounded.reduce(
    (a: number, e: [number, number]): number => a + e[1],
    0,
  );
  return [
    [top[0]![0], Math.round((1 - rest) * STEPS) / STEPS],
    ...rounded,
  ];
}

/** Hand a limb's mass down its tree. */
function spread(
  limb: ILimb,
  mass: number,
  p: Vector,
  pulls: Float64Array,
): void {
  const shares: number[] = limb.kids.map((k: ILimb): number => share(k, p));
  const total: number = shares.reduce((a: number, b: number): number => a + b, 0);
  const each: number = mass / Math.max(1, total);
  let left: number = mass;
  limb.kids.forEach((kid: ILimb, i: number): void => {
    const given: number = each * shares[i]!;
    if (given <= 0) return;
    left -= given;
    spread(kid, given, p, pulls);
  });
  pulls[limb.slot]! += left;
}

/** A limb's share of what its parent holds at a point. */
function share(limb: ILimb, p: Vector): number {
  let out: number = cutShare(limb, p);
  if (out > 0 && limb.midline > 0) {
    // Below the crotch the two legs are apart and the far side has no skin.
    if (limb.side * p[2] <= 0) return 0;
    const inside: number = 1 - rise((limb.side * p[2]) / limb.midline);
    const past: number = ramp(
      dot(Math3D.sub(p, limb.clear!.at), limb.clear!.normal) / limb.clear!.half,
    );
    out *= 1 - inside * (1 - past);
  }
  if (out > 0 && limb.rivals.length !== 0)
    out *= ramp(
      (nearest(p, limb.rivals) - nearest(p, limb.own)) / limb.contest,
    );
  return out;
}

/** A limb's share over its own planes alone, and the jaw's under the lips. */
function cutShare(limb: ILimb, p: Vector): number {
  let out: number = 1;
  for (const plane of limb.planes)
    out *= ramp(dot(Math3D.sub(p, plane.at), plane.normal) / plane.half);
  if (limb.lips !== null && out > 0) out *= below(limb.lips, p);
  return out;
}

/**
 * The jaw's share of a point by its side of the lips' contact line.
 *
 * The skin is open along that line between the cheilia, so the share may
 * jump across it there and nowhere else. Over the middle half of the mouth a
 * point above the line is the head's and one below the jaw's whole. Toward
 * the cheilia a share of up to half crosses the line, fading over the cheek's
 * height away from it, so at a cheilion both sides hold half and the whole
 * skin past it is continuous with a level tangent: the opening narrows to its
 * corners as a parted mouth's does. A hand-over centred on the line itself,
 * narrow within the slit and widening past it, put the whole jaw's turn
 * across a few millimetres of skin round each commissure, which stretched
 * more than three times under a 20 mm opening on every person.
 */
function below(lips: ILips, p: Vector): number {
  const u: number = Math.abs(p[2]) / lips.width;
  const k: number = Math.min(1, u) * (lips.contact.length - 1);
  const i: number = Math.min(lips.contact.length - 2, Math.floor(k));
  const f: number = k - i;
  const contact: number = lips.contact[i]! * (1 - f) + lips.contact[i + 1]! * f;
  const v: number = p[1] - contact;
  const crossing: number =
    0.5 *
    rise((u - CORNER_FROM) / (CORNER_TO - CORNER_FROM)) *
    (1 - rise(Math.abs(v) / lips.wide));
  return v >= 0 ? crossing : 1 - crossing;
}

/** Smallest height of a point over a set of capsules. */
function nearest(p: Vector, limbs: readonly ILimb[]): number {
  let best: number = Infinity;
  for (const limb of limbs) best = Math.min(best, height(p, limb));
  return best;
}

/** A point's height over a limb's capsule, negative inside it. */
function height(p: Vector, limb: ILimb): number {
  const d: Vector = Math3D.sub(limb.to, limb.from);
  const e: Vector = Math3D.sub(p, limb.from);
  const length: number = dot(d, d);
  const f: number =
    length === 0 ? 0 : Math.max(0, Math.min(1, dot(e, d) / length));
  return (
    Math.hypot(e[0] - f * d[0], e[1] - f * d[1], e[2] - f * d[2]) -
    (limb.near + (limb.far - limb.near) * f * f * f)
  );
}

/** A quintic step from 0 at -1 to 1 at 1, flat to the second derivative at both. */
function ramp(x: number): number {
  return rise((x + 1) / 2);
}

/** A quintic step from 0 at 0 to 1 at 1, flat to the second derivative at both. */
function rise(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * x * (x * (6 * x - 15) + 10);
}

/** Shift along a parent below which a bone has not moved, metres. */
const TRANSLATED: number = 1e-6;

/**
 * How the skin blends its bones. A linear blend thinned the bent thigh and the
 * elbow's inside on the same pose; this keeps their volume, at the price of a
 * slight corner outside a deep bend.
 */
const BLEND = "dual-quaternion" as const;

/** Steps of a weight. */
const STEPS: number = 1000;

/** Smallest limb radius a capsule is measured in, mm. */
const MINIMUM_RADIUS: number = 4;

/** Joints that carry no skin of their own: their rig bones ride the next. */
const FOLDED: RegExp = /(Scapula|Subtalar|Midfoot|Eye)$|^atlas$/;

/** Half of a joint's cut, in skin depths at the joint. */
const CUT: number = 1.5;

/** How far medial of the shoulder's centre the arm starts, so the deltoid rides it. */
const DELTOID: number = 0.6;

/** Half of the shoulder's cut, in skin depths: it turns further than any hinge. */
const SHOULDER_CUT: number = 2;

/**
 * Least skin depth at a joint, in the radius of the thinner limb there. Rings
 * that end inside the skin, as a thumb's first one does, read as skin.
 */
const SHALLOWEST: number = 0.6;

/** Half of an arm's comparison with the trunk, in skin depths at the shoulder. */
const ARM_CONTEST: number = 0.6;

/** Half of a digit's comparison with its neighbours, in the digit's radii. */
const FINGER_CONTEST: number = 0.8;

/** A leg's fall to nothing at the midline, in skin depths at the hip. */
const MIDLINE: number = 0.6;

/** Lean of the hip's plane toward the front: the crease runs high there and low behind. */
const HIP_FORWARD: number = 0.35;

/** Lean of the hip's plane outward: the crease runs from the iliac spine to the pubis. */
const HIP_LATERAL: number = 0.7;

/**
 * The lips' height below the eyes, as a share of the eyes' height below the
 * crown. The share holds from 1450 to 2000 mm of stature, where a share of the
 * stature does not: a head does not grow with the body.
 */
const MOUTH: number = 0.735;

/**
 * Share of the mouth's half width where the lips' narrow hand-over starts to
 * widen: the opening of a parted mouth narrows toward its corners, where the
 * lips meet.
 */
const CORNER_FROM: number = 0.5;

/** Share of the mouth's half width where it has widened to the jaw's ramp: the cheilion. */
const CORNER_TO: number = 1;

/** Half of the jaw's cut, as a share of the distance from hinge to chin. */
const JAW_RAMP: number = 0.07;

/** How far forward of its hinge the jaw starts, as a share of the same distance. */
const JAW_BACK: number = 0.15;

/** Where a thigh has left the crotch, in skin depths at the hip below the hip. */
const CROTCH: number = 1.7;

/** Half of that release, in skin depths at the hip. */
const CROTCH_RAMP: number = 0.6;

/** Phases sampling a section when measuring skin depth. */
const SKIN_PHASES: number[] = Array.from(
  { length: 12 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 12,
);

/** Forward in the registered frame. */
const FORWARD: Vector = [1, 0, 0];

/** The figure's left in the registered frame. */
const LEFT: Vector = [0, 0, 1];
