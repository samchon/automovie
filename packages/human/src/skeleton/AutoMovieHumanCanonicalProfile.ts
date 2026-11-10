import {
  DEFAULT_HUMANOID_ROM,
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  rotationBetween,
  toRigAngle,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

/**
 * The contact and mass profile of a polygon man, built from the same joints
 * and girth radii its drawing is built from, at the canonical T-pose rest.
 *
 * Colliders follow the drawn primitives: each limb segment and each phalanx
 * is a capsule of its girth radius whose axis runs from its joint to its child
 * joint, so its caps are the drawn joint balls and every joint lies inside its
 * own segment's collider, while a capsule to a surface tip (a distal phalanx
 * to its fingertip, the head to its crown) ends with its cap on the tip, so
 * the stature and the fingertips are where they are drawn; the pelvis, abdomen
 * and thorax are boxes between their joints whose half breadths and half
 * depths are the drawing's elliptical sections scaled by `sqrt(pi / 4)` (a box
 * of the ellipse's area); the neck is a capsule to the head joint and the head
 * a capsule from the head joint to the crown; the palm is a box from the wrist
 * to the finger roots' balls, as broad as the finger roots; the rear foot is
 * the box of the ankle, subtalar and midfoot joints' spheres and the toe
 * roots' (the ball), standing on the floor, and the toes the box of the toe
 * joints' spheres to their tips, riding the toes bone so they bend at the
 * ball as the drawn toes do.
 *
 * Masses are Dempster's shares of body mass as tabulated by Winter
 * (Biomechanics and Motor Control of Human Movement, 4th ed., table 4.1):
 * hand 0.006, forearm 0.016, upper arm 0.028, thigh 0.100, leg 0.0465, foot
 * 0.0145, thorax 0.216, abdomen 0.139, pelvis 0.142 and head with neck 0.081,
 * the head taking de Leva's (1996) 0.0694 and the neck the rest; the hand's
 * share is split over the palm and the phalanges by collider volume, a
 * uniform density within the hand, and the foot's over the rear foot and
 * the toes by box volume. Each
 * segment's centre of mass is its collider's centre and its inertia the
 * collider's as a uniform solid, the way physics engines derive inertia from
 * shapes. Joints sit at each child joint with identity frames; every clinical
 * axis of `DEFAULT_HUMANOID_ROM` becomes a physical axis along its
 * `HUMANOID_JOINT_AXES` direction with limits read through
 * `HUMANOID_REST_FRAME`, so the physical zero is the T-pose. Drive gains are
 * placeholders kinematic motion never reads: 50 N m per downstream kilogram.
 */
export namespace AutoMovieHumanCanonicalProfile {
  /** One drawn joint: its canonical rest position, its girth radius and its carrier. */
  export interface IJoint {
    /** Rest joint centre, canonical metres. */
    position: IAutoMovieVector3;

    /** Rest tip of a leaf segment, canonical metres. */
    tip: IAutoMovieVector3 | null;

    /** Girth radius, metres. */
    radius: number;
  }

  /**
   * Build the profile.
   *
   * @param joints Every drawn Human joint by id.
   * @param mass Body mass, kilograms.
   * @param id Profile id.
   * @returns The profile on the rig's bones.
   */
  export function build(
    joints: ReadonlyMap<string, IJoint>,
    mass: number,
    id: string,
  ): P {
    const j = (name: string): IJoint => {
      const found: IJoint | undefined = joints.get(name);
      if (found === undefined)
        throw new Error(`The polygon profile needs the joint ${name}`);
      return found;
    };
    const k: number = Math.sqrt(Math.PI / 4);
    const identity: IAutoMovieQuaternion = Quaternion.identity();
    const segments: P.ISegment[] = [];
    const add = (
      bone: AutoMovieHumanoidBone,
      share: number,
      shape: P.IShape,
      inertia: IAutoMovieVector3,
      origin: IAutoMovieVector3 = j(bone).position,
    ): void => {
      const m: number = share * mass;
      segments.push({
        bone,
        neutral: { position: origin, rotation: identity },
        mass: m,
        centerOfMass: shape.transform.position,
        inertia: Vector3.scale(inertia, m),
        inertiaRotation: shape.transform.rotation,
        shapes: [shape],
      });
    };
    const box = (
      bone: AutoMovieHumanoidBone,
      share: number,
      min: IAutoMovieVector3,
      max: IAutoMovieVector3,
      origin: IAutoMovieVector3 = j(bone).position,
    ): void => {
      const half: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(max, min),
        0.5,
      );
      const centre: IAutoMovieVector3 = Vector3.subtract(
        Vector3.scale(Vector3.add(min, max), 0.5),
        origin,
      );
      add(
        bone,
        share,
        {
          id: "body",
          material: "skin",
          transform: { position: centre, rotation: identity },
          kind: "box",
          halfExtents: half,
        },
        {
          x: (half.y ** 2 + half.z ** 2) / 3,
          y: (half.x ** 2 + half.z ** 2) / 3,
          z: (half.x ** 2 + half.y ** 2) / 3,
        },
        origin,
      );
    };
    // A capsule between two joints ends in the joints' balls; one to a surface
    // tip (the crown, a fingertip) ends with its cap on the tip.
    const capsule = (
      bone: AutoMovieHumanoidBone,
      share: number,
      from: IAutoMovieVector3,
      end: IAutoMovieVector3,
      radius: number,
      tip: boolean = false,
    ): void => {
      const span: number = Vector3.length(Vector3.subtract(end, from));
      const inward: number = tip ? Math.min(radius, span) : 0;
      const to: IAutoMovieVector3 =
        span > 1e-9
          ? Vector3.subtract(
              end,
              Vector3.scale(Vector3.subtract(end, from), inward / span),
            )
          : end;
      const axis: IAutoMovieVector3 = Vector3.subtract(to, from);
      const length: number = Vector3.length(axis);
      const rotation: IAutoMovieQuaternion =
        length > 1e-9 ? rotationBetween({ x: 0, y: 1, z: 0 }, axis) : identity;
      const centre: IAutoMovieVector3 = Vector3.subtract(
        Vector3.scale(Vector3.add(from, to), 0.5),
        j(bone).position,
      );
      const half: number = length / 2;
      const full: number = 2 * half + 2 * radius;
      const axial: number = (radius * radius) / 2;
      const transverse: number = (3 * radius * radius + full * full) / 12;
      add(
        bone,
        share,
        {
          id: "body",
          material: "skin",
          transform: { position: centre, rotation },
          kind: "capsule",
          radius,
          halfLength: half,
        },
        { x: transverse, y: axial, z: transverse },
      );
    };
    const at = (name: string): IAutoMovieVector3 => j(name).position;
    const span = (a: string, b: string): number =>
      Math.abs(at(a).x - at(b).x) / 2;

    // Trunk boxes from the drawing's sections (half breadth, half depth = girth radius).
    const hips: IJoint = j("hips");
    const spine: IJoint = j("spine");
    const chest: IJoint = j("chest");
    const legRadius: number = Math.max(
      j("leftUpperLeg").radius,
      j("rightUpperLeg").radius,
    );
    const armRadius: number = Math.max(
      j("leftUpperArm").radius,
      j("rightUpperArm").radius,
    );
    const hipBreadth: number = Math.max(
      hips.radius,
      span("leftUpperLeg", "rightUpperLeg") + legRadius,
    );
    const shoulderBreadth: number = Math.max(
      chest.radius,
      span("leftUpperArm", "rightUpperArm") + armRadius,
    );
    const lumbar: number = Math.max(spine.radius, 0.75 * shoulderBreadth);
    const thorax: number = Math.max(chest.radius, 0.85 * shoulderBreadth);
    const trunk = (
      bone: AutoMovieHumanoidBone,
      share: number,
      bottom: number,
      top: number,
      breadth: number,
      depth: number,
      z: number,
    ): void =>
      box(
        bone,
        share,
        { x: -k * breadth, y: bottom, z: z - k * depth },
        { x: k * breadth, y: top, z: z + k * depth },
      );
    trunk(
      "hips",
      0.142,
      hips.position.y -
        Math.min(j("leftUpperLeg").radius, j("rightUpperLeg").radius),
      spine.position.y,
      hipBreadth,
      hips.radius,
      hips.position.z,
    );
    trunk(
      "spine",
      0.139,
      spine.position.y,
      chest.position.y,
      (lumbar + thorax) / 2,
      (spine.radius + chest.radius) / 2,
      spine.position.z,
    );
    trunk(
      "chest",
      0.216,
      chest.position.y,
      at("neck").y,
      (thorax + shoulderBreadth) / 2,
      chest.radius,
      chest.position.z,
    );
    capsule("neck", 0.081 - 0.0694, at("neck"), at("head"), j("neck").radius);
    const crown: IAutoMovieVector3 =
      j("head").tip ??
      Vector3.add(at("head"), { x: 0, y: 2 * j("head").radius, z: 0 });
    capsule(
      "head",
      0.0694,
      at("head"),
      crown,
      j("head").radius,
      j("head").tip !== null,
    );

    for (const side of ["left", "right"] as const) {
      const b = (name: string): AutoMovieHumanoidBone =>
        `${side}${name}` as AutoMovieHumanoidBone;
      capsule(
        b("UpperArm"),
        0.028,
        at(b("UpperArm")),
        at(b("LowerArm")),
        j(b("UpperArm")).radius,
      );
      capsule(
        b("LowerArm"),
        0.016,
        at(b("LowerArm")),
        at(b("Hand")),
        j(b("LowerArm")).radius,
      );
      const knuckles: IJoint[] = FINGERS.map(
        (d: string): IJoint => j(b(`${d}Proximal`)),
      );
      const across: number =
        Math.abs(at(b("IndexProximal")).z - at(b("LittleProximal")).z) / 2 +
        j(b("IndexProximal")).radius;
      const thick: number = k * j(b("Hand")).radius;
      const wrist: IAutoMovieVector3 = at(b("Hand"));
      const xs: number[] = [
        wrist.x,
        ...knuckles.flatMap((n: IJoint): number[] => [
          n.position.x - n.radius,
          n.position.x + n.radius,
        ]),
      ];
      const digits: {
        bone: AutoMovieHumanoidBone;
        from: IAutoMovieVector3;
        to: IAutoMovieVector3;
        radius: number;
        tip: boolean;
      }[] = DIGITS.flatMap((chain: readonly string[]) =>
        chain.map((name: string, i: number) => {
          const joint: IJoint = j(b(name));
          const next: string | undefined = chain[i + 1];
          return {
            bone: b(name),
            from: joint.position,
            to:
              next === undefined ? (joint.tip ?? joint.position) : at(b(next)),
            tip: next === undefined && joint.tip !== null,
            radius: joint.radius,
          };
        }),
      );
      // The hand's Dempster share split over its palm and phalanges by volume (uniform density).
      const palmHalf: IAutoMovieVector3 = {
        x: (Math.max(...xs) - Math.min(...xs)) / 2,
        y: thick,
        z: across,
      };
      const capsuleVolume = (r: number, length: number): number =>
        Math.PI * r * r * length + (4 / 3) * Math.PI * r ** 3;
      const volumes: number[] = digits.map((d): number =>
        capsuleVolume(d.radius, Vector3.length(Vector3.subtract(d.to, d.from))),
      );
      const palmVolume: number = 8 * palmHalf.x * palmHalf.y * palmHalf.z;
      const handVolume: number =
        palmVolume + volumes.reduce((s: number, v: number): number => s + v, 0);
      box(
        b("Hand"),
        (0.006 * palmVolume) / handVolume,
        { x: Math.min(...xs), y: wrist.y - thick, z: wrist.z - across },
        { x: Math.max(...xs), y: wrist.y + thick, z: wrist.z + across },
      );
      digits.forEach((d, i: number): void =>
        capsule(
          d.bone,
          (0.006 * volumes[i]!) / handVolume,
          d.from,
          d.to,
          d.radius,
          d.tip,
        ),
      );
      capsule(
        b("UpperLeg"),
        0.1,
        at(b("UpperLeg")),
        at(b("LowerLeg")),
        j(b("UpperLeg")).radius,
      );
      capsule(
        b("LowerLeg"),
        0.0465,
        at(b("LowerLeg")),
        at(b("Foot")),
        j(b("LowerLeg")).radius,
      );
      // The rear foot to the balls of the toes' roots, and the toes from their roots to their tips.
      const named = (pattern: RegExp): IJoint[] =>
        [...joints.entries()]
          .filter(
            ([name]): boolean => name.startsWith(side) && pattern.test(name),
          )
          .map(([, joint]): IJoint => joint);
      const roots: IJoint[] = named(/(HalluxProximal|Toe\dProximal)$/);
      const extent = (
        parts: IJoint[],
        floor: number,
        top: number,
        tips: boolean,
      ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
        const min: IAutoMovieVector3 = { x: Infinity, y: floor, z: Infinity };
        const max: IAutoMovieVector3 = { x: -Infinity, y: top, z: -Infinity };
        for (const joint of parts)
          for (const p of [
            joint.position,
            ...(tips && joint.tip !== null ? [joint.tip] : []),
          ]) {
            min.x = Math.min(min.x, p.x - joint.radius);
            min.z = Math.min(min.z, p.z - joint.radius);
            max.x = Math.max(max.x, p.x + joint.radius);
            max.z = Math.max(max.z, p.z + joint.radius);
          }
        return { min, max };
      };
      const toes: IJoint[] = named(/(Hallux|Toe\d)/);
      const rear = extent(
        [...named(/(Foot|Subtalar|Midfoot)$/), ...roots],
        0,
        at(b("Foot")).y,
        false,
      );
      const front = extent(
        toes,
        Math.min(
          ...toes.map(
            (t: IJoint): number =>
              Math.min(t.position.y, t.tip?.y ?? Infinity) - t.radius,
          ),
        ),
        Math.max(...toes.map((t: IJoint): number => t.position.y + t.radius)),
        true,
      );
      const volume = (e: {
        min: IAutoMovieVector3;
        max: IAutoMovieVector3;
      }): number =>
        (e.max.x - e.min.x) * (e.max.y - e.min.y) * (e.max.z - e.min.z);
      const share: number = volume(front) / (volume(front) + volume(rear));
      box(b("Foot"), 0.0145 * (1 - share), rear.min, rear.max);
      box(
        b("Toes"),
        0.0145 * share,
        front.min,
        front.max,
        at(b("HalluxProximal")),
      );
    }

    const parentOf: Partial<
      Record<AutoMovieHumanoidBone, AutoMovieHumanoidBone>
    > = {
      spine: "hips",
      chest: "spine",
      neck: "chest",
      head: "neck",
      leftUpperArm: "chest",
      rightUpperArm: "chest",
      leftLowerArm: "leftUpperArm",
      rightLowerArm: "rightUpperArm",
      leftHand: "leftLowerArm",
      rightHand: "rightLowerArm",
      leftUpperLeg: "hips",
      rightUpperLeg: "hips",
      leftLowerLeg: "leftUpperLeg",
      rightLowerLeg: "rightUpperLeg",
      leftFoot: "leftLowerLeg",
      rightFoot: "rightLowerLeg",
      leftToes: "leftFoot",
      rightToes: "rightFoot",
    };
    const hands: AutoMovieHumanoidBone[][] = [];
    for (const side of ["left", "right"] as const) {
      const b = (name: string): AutoMovieHumanoidBone =>
        `${side}${name}` as AutoMovieHumanoidBone;
      const hand: AutoMovieHumanoidBone[] = [b("Hand")];
      for (const chain of DIGITS)
        chain.forEach((name: string, i: number): void => {
          parentOf[b(name)] = i === 0 ? b("Hand") : b(chain[i - 1]!);
          hand.push(b(name));
        });
      hands.push(hand);
    }
    const children = (bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone[] =>
      (Object.keys(parentOf) as AutoMovieHumanoidBone[]).filter(
        (c: AutoMovieHumanoidBone): boolean => parentOf[c] === bone,
      );
    const downstream = (bone: AutoMovieHumanoidBone): number =>
      segments.find((s: P.ISegment): boolean => s.bone === bone)!.mass +
      children(bone).reduce(
        (sum: number, c: AutoMovieHumanoidBone): number => sum + downstream(c),
        0,
      );
    const origin = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      segments.find((s: P.ISegment): boolean => s.bone === bone)!.neutral
        .position;
    const links: P.IJoint[] = (
      Object.keys(parentOf) as AutoMovieHumanoidBone[]
    ).map((child: AutoMovieHumanoidBone): P.IJoint => {
      const parent: AutoMovieHumanoidBone = parentOf[child]!;
      return {
        id: child,
        parent,
        child,
        parentFrame: {
          position: Vector3.subtract(origin(child), origin(parent)),
          rotation: identity,
        },
        childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
        axes: axesOf(child, 50 * downstream(child)),
      };
    });
    const total: number = segments.reduce(
      (sum: number, s: P.ISegment): number => sum + s.mass,
      0,
    );
    return {
      id,
      mass: total,
      centerOfMass: segments.reduce(
        (sum: IAutoMovieVector3, s: P.ISegment): IAutoMovieVector3 =>
          Vector3.add(
            sum,
            Vector3.scale(
              Vector3.add(s.neutral.position, s.centerOfMass),
              s.mass / total,
            ),
          ),
        { x: 0, y: 0, z: 0 },
      ),
      segments,
      joints: links,
      collisionExclusions: [
        ...links.map(
          (jt: P.IJoint): { a: string; b: string; reason: string } => ({
            a: jt.parent,
            b: jt.child,
            reason: "adjacent polygon modules overlap at their shared joint",
          }),
        ),
        ...hands.flatMap((hand: AutoMovieHumanoidBone[]) =>
          hand.flatMap((a: AutoMovieHumanoidBone, i: number) =>
            hand
              .slice(i + 1)
              .filter(
                (c: AutoMovieHumanoidBone): boolean =>
                  parentOf[c] !== a && parentOf[a] !== c,
              )
              .map(
                (
                  c: AutoMovieHumanoidBone,
                ): { a: string; b: string; reason: string } => ({
                  a,
                  b: c,
                  reason:
                    "the palm and digits of one hand touch at rest; finger contact is the grasp's",
                }),
              ),
          ),
        ),
      ],
      materials: [
        {
          id: "skin",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      provenance:
        "Polygon-man contact profile: drawn primitives, Dempster segment masses (Winter table 4.1), uniform-solid collider inertia.",
    };
  }
}

/** The four fingers, by rig name. */
const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];

/** Every digit's phalanx chain from the hand outward, by rig name. */
const DIGITS: readonly (readonly string[])[] = [
  ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"],
  ...FINGERS.map((d: string): string[] => [
    `${d}Proximal`,
    `${d}Intermediate`,
    `${d}Distal`,
  ]),
];

/** The physical axes of one joint from its clinical ranges, read onto the T-pose rig. */
function axesOf(bone: AutoMovieHumanoidBone, torque: number): P.IAxis[] {
  const rom = DEFAULT_HUMANOID_ROM[bone];
  const axes: IAutoMovieJointAxes =
    HUMANOID_JOINT_AXES[bone] ?? DEFAULT_JOINT_AXES;
  const out: P.IAxis[] = [];
  for (const clinical of ["flexion", "abduction", "twist"] as const) {
    const range = rom?.[clinical];
    if (range === null || range === undefined) continue;
    const d: IAutoMovieVector3 = axes[clinical];
    const letter: "x" | "y" | "z" =
      Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z)
        ? "x"
        : Math.abs(d.y) >= Math.abs(d.z)
          ? "y"
          : "z";
    if (out.some((a: P.IAxis): boolean => a.axis === letter)) continue;
    const sign: number = Math.sign(d[letter]);
    const frame = HUMANOID_REST_FRAME[bone]?.[clinical];
    const physical = (c: number): number =>
      (sign * toRigAngle(c, frame)! * Math.PI) / 180;
    const ends: number[] = [physical(range.min), physical(range.max)].sort(
      (a: number, b: number): number => a - b,
    );
    out.push({
      axis: letter,
      minimum: Math.max(-Math.PI, ends[0]!),
      maximum: Math.min(Math.PI, ends[1]!),
      stiffness: torque,
      damping: torque / 10,
      maximumTorque: torque,
      channel: `${bone}.${clinical}`,
      coordinateSign: (sign * (frame?.sign ?? 1)) as 1 | -1,
    });
  }
  return out;
}
