import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanBindingGeometry } from "./AutoMovieHumanBindingGeometry";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanWeightField as F } from "./AutoMovieHumanWeightField";

/** Prepare the immutable geometric influence field of one generated body. */
export namespace AutoMovieHumanSkinBinding {
  /** One body's anatomical partition, shared by values and spatial derivatives. */
  export function prepare(joints: readonly AutoMovieHumanJointCentres.IJoint[], calibration: IAutoMovieHumanBodyCalibration, scale: number, index: ReadonlyMap<AutoMovieHumanoidBone, number>): F.ITree {
    return grow(joints, calibration, scale, index);
  }
}

/** Model-space vector. */
type Vector = F.Vector;
/** Anatomical branch. */
type ILimb = F.ILimb;
/** Open-lip contact field. */
type ILips = F.ILips;
/** Arm partition. */
type IArm = F.IArm;
/** Complete influence tree. */
type ITree = F.ITree;

/** Joint-owned planes and capsules, measured from the generated skin. */
function grow(
  joints: readonly AutoMovieHumanJointCentres.IJoint[],
  calibration: IAutoMovieHumanBodyCalibration,
  scale: number,
  index: ReadonlyMap<AutoMovieHumanoidBone, number>,
): ITree {
  const skin: AutoMovieHumanBindingGeometry.IGeometry = AutoMovieHumanBindingGeometry.prepare(calibration, scale);
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
  const jointSupports: F.IJointSupport[] = [];
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
    const radius: number = /Scapula$/.test(j.bone) ? 0 : /ThumbMetacarpal$/.test(j.bone)
      ? skin.depth(Math3D.times(Math3D.add(from, to), 0.5))
      : Math.max(j.radius, MINIMUM_RADIUS) * scale;
    const far: number =
      j.bone === "chest" ? Math.min(radius, skin.depth(to)) : radius;
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
      skin.depth(from),
      SHALLOWEST * Math.min(above.near, radius),
    );
    const normal: Vector = /UpperLeg$/.test(j.bone)
      ? Math3D.unit(
          Math3D.add(
            d,
            Math3D.times(LEFT, limb.side * HIP_LATERAL),
          ),
        )
      : /Shoulder$/.test(j.bone)
        ? d
        : Math3D.unit(Math3D.add(e, Math3D.times(d, along)));
    const chain: string | undefined = chainOf(j.bone);
    const outer: number = chain === undefined ? reach : Math.max(reach, skin.outer(chain, from, normal));
    const available: number = Math.min(Math.hypot(...Math3D.sub(above.to, above.from)), Math.hypot(...Math3D.sub(to, from)));
    const range: number = AutoMovieHumanBindingGeometry.range(j.bone);
    const capacity: F.ISupport = F.support(outer, range, available, 1);
    if (range > 0 && available === 0 && j.bone !== "head" && j.bone !== "jaw" && !j.bone.endsWith("Scapula"))
      throw new Error(`The ${j.bone} joint has no transition support`);
    const half: number = range === 0 ? reach : capacity.half;
    if (range > 0 && j.bone !== "head" && j.bone !== "jaw" && !j.bone.endsWith("Scapula"))
      jointSupports.push({ joint: j.bone, ...capacity });
    if (j.bone !== "head" && j.bone !== "jaw" && !j.bone.endsWith("Scapula"))
      limb.planes = [
        /UpperArm$/.test(j.bone)
          ? {
              at: Math3D.sub(from, Math3D.times(normal, DELTOID * reach)),
              normal,
              half,
            }
          : { at: from, normal, half },
      ];
    if (/UpperLeg$/.test(j.bone)) {
      limb.midline = half;
      limb.clear = {
        at: Math3D.add(from, Math3D.times(d, CROTCH * reach)),
        normal: d,
        half,
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
  head.contest = skin.depth(Math3D.times(Math3D.add(neck.from, neck.to), 0.5));

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
    const carrier: number = limbs.get(`${side}Scapula`)!.slot;
    const capacity: F.ISupport = F.support(
      Math.max(skin.depth(at(`${side}UpperArm`)), skin.outer(`arm.${side}`, at(`${side}UpperArm`), directions.get(`${side}UpperArm`)!)),
      AutoMovieHumanBindingGeometry.range(`${side}UpperArm`),
      Math.hypot(...Math3D.sub(limbs.get(`${side}UpperArm`)!.to, at(`${side}UpperArm`))),
      1,
    );
    jointSupports.push({ joint: `${side}ArmChestContest`, ...capacity });
    return {
      limb,
      carrier,
      own: family(limb).filter((part: ILimb): boolean => part.slot !== carrier),
      contest: capacity.half,
    };
  };
  const arms: IArm[] = [arm("left"), arm("right")];
  const armed = new Set<ILimb>(arms.flatMap((a: IArm): ILimb[] => family(a.limb)));
  const trunk: ILimb[] = [...limbs].flatMap(
    ([bone, limb]: [string, ILimb]): ILimb[] =>
      armed.has(limb) || /Toe\d|Hallux/.test(bone) ? [] : [limb],
  );
  for (const a of arms) a.limb.rivals = trunk;
  return {
    root: limbs.get("hips")!,
    chest: limbs.get("chest")!.slot,
    arms,
    jointSupports,
  };
}

/** Smallest limb radius a capsule is measured in, mm. */
const MINIMUM_RADIUS: number = 4;

/** Joints that carry no skin of their own: their rig bones ride the next. */
const FOLDED: RegExp = /(Subtalar|Midfoot|Eye)$|^atlas$/;

/** How far medial of the shoulder's centre the arm starts, so the deltoid rides it. */
const DELTOID: number = 0.6;

/**
 * Least skin depth at a joint, in the radius of the thinner limb there. Rings
 * that end inside the skin, as a thumb's first one does, read as skin.
 */
const SHALLOWEST: number = 0.6;

/** Half of a digit's comparison with its neighbours, in the digit's radii. */
const FINGER_CONTEST: number = 0.8;

/** Lean of the hip's plane outward: the crease runs from the iliac spine to the pubis. */
const HIP_LATERAL: number = 0.7;

/**
 * The lips' height below the eyes, as a share of the eyes' height below the
 * crown. The share holds from 1450 to 2000 mm of stature, where a share of the
 * stature does not: a head does not grow with the body.
 */
const MOUTH: number = 0.735;

/** Half of the jaw's cut, as a share of the distance from hinge to chin. */
const JAW_RAMP: number = 0.07;

/** How far forward of its hinge the jaw starts, as a share of the same distance. */
const JAW_BACK: number = 0.15;

/** Where a thigh has left the crotch, in skin depths at the hip below the hip. */
const CROTCH: number = 1.7;


/** Bind-joint name folded into the engine's humanoid vocabulary. */
function named(joint: string): AutoMovieHumanoidBone {
  if (joint === "atlas") return "neck";
  const side: "left" | "right" = joint.startsWith("left") ? "left" : "right";
  if (joint.endsWith("Subtalar") || joint.endsWith("Midfoot"))
    return `${side}Foot`;
  if (/Hallux|Toe\d/.test(joint)) return `${side}Toes`;
  return joint as AutoMovieHumanoidBone;
}


/** Dot product in the registered frame. */
function dot(a: Vector, b: Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
/** Forward in the registered frame. */
const FORWARD: Vector = [1, 0, 0];
/** Anatomical left. */
const LEFT: Vector = [0, 0, 1];

/** Skin chain owned by an articulated limb's section. */
function chainOf(bone: string): string | undefined {
  const side: string = bone.startsWith("left") ? "left" : "right";
  if (/(Upper|Lower)Arm$/.test(bone)) return `arm.${side}`;
  if (/(Upper|Lower)Leg$/.test(bone)) return `leg.${side}`;
  if (bone.endsWith("Hand")) return `hand.${side}.1`;
  if (bone.includes("Thumb")) return `thumb.${side}`;
  for (const [part, key] of [["Index", "index"], ["Middle", "middle"], ["Ring", "ring"], ["Little", "little"]] as const)
    if (bone.includes(part)) return `finger.${side}.${key}`;
  return undefined;
}
