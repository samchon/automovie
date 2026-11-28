import { AutoMovieEngineKinematics, AutoMovieEngineHumanoidJointAxes, AutoMovieEngineHumanoidRestFrame, AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieHumanBindBone,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanBonePlacement,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanCanonicalSolids,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSkeleton,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanCanonicalBind } from "./AutoMovieHumanCanonicalBind";
import { AutoMovieHumanCanonicalProfile as Profile } from "./AutoMovieHumanCanonicalProfile";
import type { AutoMovieHumanJointStrength } from "./internal/AutoMovieHumanJointStrength";

/**
 * Prepare and pose the stock polygon body on the canonical VRM T-pose rig. The rig
 * is right-handed with +Y up, +Z forward, and +X toward the body's left. The draw
 * data uses Human's registered axes (+X forward, +Y up, +Z left). The two frames
 * are related by swapping X and Z.
 */
export namespace AutoMovieHumanCanonicalBody {

  /**
   * Prepare the stock skeleton, joint map and contact profile once for a
   * performer. Preparation scales the Human bind to metres, reflects it and
   * straightens the arms, fingers and legs into the canonical T-pose. The feet
   * keep their bind orientation. The lowest foot joint or tip sphere touches Y =
   * 0, and each measured heel plane follows the final ankle translation.
   *
   * Each humanoid joint has identity rest rotation. Extra Human joints follow
   * their rig carriers, and the hallux root sets the toes pivot. The stock profile
   * reads the same joint centres, girth radii and heel planes as the drawing.
   * The ear ray starts at the measured upper ear station relative to the head.
   * Girth radii use the resolved circumferences divided by 2π, with the stock jaw,
   * eye and digit radii supplied by their respective model conventions.
   *
   * @param params Human measurements and shape parameters used by the stock bind
   * and girth laws.
   * @param options Required positive body mass in kilograms and the
   * skeleton/profile id.
   * @returns A canonical T-pose body in metres, reusable for placement, drawing
   * and contact.
   */
  export function prepare(
    params: IAutoMovieHumanParameters,
    options: IAutoMovieHumanCanonicalBody.IPrepareOptions,
  ): IAutoMovieHumanCanonicalBody.IBody {
    const anatomy: AutoMovieHumanCanonicalBind.IOutput =
      AutoMovieHumanCanonicalBind.of(params);
    const measures: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(params);
    const scale: number = measures.stature / anatomy.stature / 1000;
    const girth = (millimetres: number): number =>
      millimetres / 1000 / (2 * Math.PI);
    const headRadius: number = girth(params.head.circumference);
    const radius = (bone: string): number => {
      const part: string = bone.replace(/^(left|right)/u, "");
      if (bone === "hips") return girth(measures.hipCircumference);
      if (bone === "spine") return girth(measures.waistCircumference);
      if (bone === "chest") return girth(measures.chestCircumference);
      if (bone === "neck" || bone === "atlas")
        return girth(measures.neckCircumference);
      if (bone === "head") return headRadius;
      if (bone === "jaw") return 0.12 * headRadius;
      if (part === "Eye") return 0.012;
      if (part === "Shoulder" || part === "Scapula" || part === "UpperArm")
        return girth(measures.axillaryArmCircumference);
      if (part === "LowerArm") return girth(measures.forearmCircumference);
      if (part === "Hand") return girth(measures.handCircumference);
      if (part === "UpperLeg") return girth(measures.thighCircumference);
      if (part === "LowerLeg") return girth(measures.calfCircumference);
      if (part === "Foot" || part === "Subtalar")
        return girth(measures.ankleCircumference);
      if (part === "Midfoot")
        return 0.8 * girth(measures.ballOfFootCircumference);
      if (part.startsWith("Hallux")) return girth(0.04 * measures.stature);
      return girth(0.03 * measures.stature);
    };
    const body: IAutoMovieHumanCanonicalBody.IBody = canonical(
      anatomy.bones.map((b): IBind => ({
        bone: b.bone,
        parent: b.parent,
        position: AutoMovieEngineVector3.scale(vector(b.position), scale),
        tip: b.tip === null ? null : AutoMovieEngineVector3.scale(vector(b.tip), scale),
        radius: radius(b.bone),
        ...(b.bone === "leftFoot" || b.bone === "rightFoot"
          ? {
              heel: AutoMovieEngineVector3.scale(
                vector(anatomy.heels[b.bone === "leftFoot" ? "left" : "right"]),
                scale,
              ),
            }
          : {}),
      })),
      {
        ...options,
        person: {
          male: AutoMovieHumanBodyAnatomy.sexOf(params) === AutoMovieHumanSex.Male,
          height: measures.stature / 1000,
          mass: options.mass,
        },
      },
    );
    const [forward, up] = anatomy.earRayOffset;
    body.profile.earRayOrigin = { x: 0, y: up * scale, z: forward * scale };
    return body;
  }

  /**
   * Place the original Human joints under a canonical rig pose. Each joint's rest
   * offset follows the world rotation and translation of its carrier. Placements
   * use canonical world axes and metres.
   *
   * @param body The canonical body returned by prepare.
   * @param pose The pose of that body's skeleton in the canonical clinical axes.
   * @returns Current joint centres and carrier rotations in body.joints order.
   */
  export function place(body: IAutoMovieHumanCanonicalBody.IBody, pose: IAutoMoviePose): IAutoMovieHumanCanonicalBody.IPlacement[] {
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      new Map(
        AutoMovieEngineKinematics.resolvePose(
          pose,
          body.skeleton,
          AutoMovieEngineHumanoidJointAxes,
          AutoMovieEngineHumanoidRestFrame,
        ).map(
          (
            r: IAutoMovieResolvedBone,
          ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
        ),
      );
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
    for (const bone of body.skeleton.bones)
      rest.set(
        bone.bone,
        AutoMovieEngineVector3.add(
          bone.parent === null
            ? AutoMovieEngineVector3.create(0, 0, 0)
            : rest.get(bone.parent)!,
          bone.rest.translation,
        ),
      );
    return body.joints.map((joint: IAutoMovieHumanCanonicalBody.IJoint): IAutoMovieHumanCanonicalBody.IPlacement => {
      const r: IAutoMovieResolvedBone = resolved.get(joint.carrier)!;
      return {
        bone: joint.bone,
        position: AutoMovieEngineVector3.add(
          r.worldPosition,
          AutoMovieEngineQuaternion.rotateVector(
            r.worldRotation,
            AutoMovieEngineVector3.subtract(vector(joint.position), rest.get(joint.carrier)!),
          ),
        ),
        rotation: r.worldRotation,
      };
    });
  }

  /**
   * Read rest bones and current placements in Human's registered frame, in metres.
   * The rest data always describe the canonical T-pose expressed in that frame. An
   * omitted pose yields the rest centres with identity placement rotations. With a
   * pose, the output rotates and places each rig-carried joint before converting
   * its world transform to the display frame.
   *
   * Render the records under REFLECTION to put them in the canonical scene.
   * Three.js reverses face winding for that reflected world matrix.
   *
   * @param body The canonical body returned by prepare.
   * @param pose A pose of the body's canonical skeleton, or omit it for the
   * T-pose.
   * @returns Rest bones with their radii, tips and any stock heel planes, plus the
   * current placements.
   */
  export function display(
    body: IAutoMovieHumanCanonicalBody.IBody,
    pose?: IAutoMoviePose,
  ): Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed"> {
    const flip = (p: readonly number[]): [number, number, number] => [
      p[2]!,
      p[1]!,
      p[0]!,
    ];
    const bones: IAutoMovieHumanBindBone[] = body.joints.map(
      (j: IAutoMovieHumanCanonicalBody.IJoint): IAutoMovieHumanBindBone => ({
        bone: j.bone,
        parent: j.parent,
        position: flip(j.position),
        tip: j.tip === null ? null : flip(j.tip),
        radius: j.radius,
        ...(j.heel === undefined ? {} : { heel: flip(j.heel) }),
      }),
    );
    const posed: IAutoMovieHumanBonePlacement[] =
      pose === undefined
        ? bones.map(
            (
              b: IAutoMovieHumanBindBone,
            ): IAutoMovieHumanBonePlacement => ({
              bone: b.bone,
              position: [...b.position],
              rotation: [0, 0, 0, 1],
            }),
          )
        : place(body, pose).map(
            (p: IAutoMovieHumanCanonicalBody.IPlacement): IAutoMovieHumanBonePlacement => {
              const q: IAutoMovieQuaternion = reflectRotation(p.rotation);
              return {
                bone: p.bone,
                position: flip([p.position.x, p.position.y, p.position.z]),
                rotation: [q.x, q.y, q.z, q.w],
              };
            },
          );
    return { bones, posed };
  }

  /**
   * Column-major 4 × 4 reflection that maps (x, y, z) to (z, y, x). Apply it to
   * the parent of a display result to move the Human-frame drawing into the
   * canonical scene.
   */
  export const REFLECTION: readonly number[] = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  ];
}

/*
 * One bind joint in Human's frame, metres.
 */
interface IBind {
  bone: string;
  parent: string | null;
  position: IAutoMovieVector3;
  tip: IAutoMovieVector3 | null;
  radius: number;
  heel?: IAutoMovieVector3;
}

/*
 * Reflect bind joints into the canonical frame, straighten them into the T-pose, floor them and build the rig and profile.
 */
function canonical(
  bind: readonly IBind[],
  options: { mass: number; id: string; person: AutoMovieHumanJointStrength.IPerson },
): IAutoMovieHumanCanonicalBody.IBody {
  const children: Map<string, string[]> = new Map();
  for (const bone of bind)
    if (bone.parent !== null)
      children.set(bone.parent, [
        ...(children.get(bone.parent) ?? []),
        bone.bone,
      ]);
  const position: Map<string, IAutoMovieVector3> = new Map();
  const tip: Map<string, IAutoMovieVector3 | null> = new Map();
  const turnOf: Map<string, IAutoMovieQuaternion> = new Map();
  for (const bone of bind) {
    position.set(bone.bone, reflect(bone.position));
    tip.set(bone.bone, bone.tip === null ? null : reflect(bone.tip));
    turnOf.set(bone.bone, AutoMovieEngineQuaternion.identity());
  }
  const descendants = (root: string): string[] => [
    root,
    ...(children.get(root) ?? []).flatMap(descendants),
  ];
  const turn = (
    bones: readonly string[],
    rotation: IAutoMovieQuaternion,
    pivot: IAutoMovieVector3,
  ): void => {
    const move = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(
        pivot,
        AutoMovieEngineQuaternion.rotateVector(rotation, AutoMovieEngineVector3.subtract(p, pivot)),
      );
    for (const bone of bones) {
      position.set(bone, move(position.get(bone)!));
      const end: IAutoMovieVector3 | null = tip.get(bone)!;
      tip.set(bone, end === null ? null : move(end));
      turnOf.set(bone, AutoMovieEngineQuaternion.multiply(rotation, turnOf.get(bone)!));
    }
  };
  const align = (
    side: string,
    from: string,
    to: string,
    direction: IAutoMovieVector3,
  ): void => {
    const pivot: IAutoMovieVector3 = position.get(`${side}${from}`)!;
    turn(
      descendants(`${side}${from}`),
      AutoMovieEngineMath.rotationBetween(
        AutoMovieEngineVector3.subtract(position.get(`${side}${to}`)!, pivot),
        direction,
      ),
      pivot,
    );
  };
  const straighten = (
    chain: readonly string[],
    direction: IAutoMovieVector3,
  ): void => {
    chain.forEach((bone: string, i: number): void => {
      const pivot: IAutoMovieVector3 = position.get(bone)!;
      const end: IAutoMovieVector3 | null =
        i + 1 < chain.length ? position.get(chain[i + 1]!)! : tip.get(bone)!;
      if (end === null) return;
      turn(
        descendants(bone),
        AutoMovieEngineMath.rotationBetween(AutoMovieEngineVector3.subtract(end, pivot), direction),
        pivot,
      );
    });
  };
  const down: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, -1, 0);
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const lateral: IAutoMovieVector3 = AutoMovieEngineVector3.create(sign, 0, 0);
    align(side, "UpperArm", "LowerArm", lateral);
    align(side, "LowerArm", "Hand", lateral);
    align(side, "Hand", "MiddleProximal", lateral);

    // Pronate about the now-lateral forearm until the volar normal,
    // sign * (along x (index - little)), faces -Y.
    const hand: IAutoMovieVector3 = position.get(`${side}Hand`)!;
    const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(position.get(`${side}MiddleProximal`)!, hand),
    );
    const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      position.get(`${side}IndexProximal`)!,
      position.get(`${side}LittleProximal`)!,
    );
    const volar: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(along, across), sign),
    );
    const angle: number =
      (Math.atan2(
        AutoMovieEngineVector3.dot(AutoMovieEngineVector3.cross(volar, down), lateral),
        AutoMovieEngineVector3.dot(volar, down),
      ) *
        180) /
      Math.PI;
    turn(
      descendants(`${side}LowerArm`),
      AutoMovieEngineQuaternion.fromAxisAngle(lateral, angle),
      position.get(`${side}LowerArm`)!,
    );

    // Straight digits: the bind holds a relaxed hand, and a clinical zero is
    // the extended one (Neutral-0), so each finger lies in the palm's plane
    // along its own knuckle line and the thumb's two hinges continue its
    // metacarpal.
    for (const finger of ["Index", "Middle", "Ring", "Little"] as const) {
      const line: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        position.get(`${side}${finger}Intermediate`)!,
        position.get(`${side}${finger}Proximal`)!,
      );
      straighten(
        [
          `${side}${finger}Proximal`,
          `${side}${finger}Intermediate`,
          `${side}${finger}Distal`,
        ],
        AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.create(line.x, 0, line.z)),
      );
    }
    straighten(
      [`${side}ThumbProximal`, `${side}ThumbDistal`],
      AutoMovieEngineVector3.normalize(
        AutoMovieEngineVector3.subtract(
          position.get(`${side}ThumbProximal`)!,
          position.get(`${side}ThumbMetacarpal`)!,
        ),
      ),
    );

    // Straight legs; each foot turns back to its bind orientation.
    align(side, "UpperLeg", "LowerLeg", down);
    align(side, "LowerLeg", "Foot", down);
    turn(
      descendants(`${side}Foot`),
      AutoMovieEngineQuaternion.inverse(turnOf.get(`${side}Foot`)!),
      position.get(`${side}Foot`)!,
    );
  }

  // Floor: the lowest foot joint sphere touches Y = 0.
  let floor: number = Infinity;
  for (const bone of bind)
    if (/(Foot|Subtalar|Midfoot|Hallux|Toe\d)/.test(bone.bone))
      for (const p of [position.get(bone.bone)!, tip.get(bone.bone)!])
        if (p !== null) floor = Math.min(floor, p.y - bone.radius);
  const lift = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.x,
    y: p.y - floor,
    z: p.z,
  });
  for (const bone of bind) {
    position.set(bone.bone, lift(position.get(bone.bone)!));
    const end: IAutoMovieVector3 | null = tip.get(bone.bone)!;
    tip.set(bone.bone, end === null ? null : lift(end));
  }

  // Canonical preparation restores each foot's original orientation. Its
  // longitudinal plane therefore follows just the ankle's final translation.
  const heels: Map<string, IAutoMovieVector3> = new Map();
  for (const bone of bind)
    if (bone.heel !== undefined)
      heels.set(
        bone.bone,
        AutoMovieEngineVector3.add(
          position.get(bone.bone)!,
          reflect(AutoMovieEngineVector3.subtract(bone.heel, bone.position)),
        ),
      );

  const carrier: Map<string, AutoMovieHumanoidBone> = new Map();
  for (const bone of bind) {
    const toe: string | null = toeSide(bone.bone);
    carrier.set(
      bone.bone,
      toe !== null
        ? (`${toe}Toes` as AutoMovieHumanoidBone)
        : HUMANOID.has(bone.bone)
          ? (bone.bone as AutoMovieHumanoidBone)
          : carrier.get(bone.parent!)!,
    );
  }
  const bones: IAutoMovieBone[] = [];
  const placed: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  const add = (
    bone: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    at: IAutoMovieVector3,
  ): void => {
    placed.set(bone, at);
    bones.push({
      bone,
      parent,
      rest: {
        translation: AutoMovieEngineVector3.subtract(
          at,
          parent === null ? AutoMovieEngineVector3.create(0, 0, 0) : placed.get(parent)!,
        ),
        rotation: AutoMovieEngineQuaternion.identity(),
        scale: AutoMovieEngineVector3.create(1, 1, 1),
      },
      constraint: null,
    });
  };
  for (const bone of bind) {
    const toe: string | null = toeSide(bone.bone);
    if (toe !== null && bone.bone === `${toe}HalluxProximal`)
      add(
        `${toe}Toes` as AutoMovieHumanoidBone,
        `${toe}Foot` as AutoMovieHumanoidBone,
        position.get(bone.bone)!,
      );
    if (HUMANOID.has(bone.bone))
      add(
        bone.bone as AutoMovieHumanoidBone,
        bone.parent === null ? null : carrier.get(bone.parent)!,
        position.get(bone.bone)!,
      );
  }
  return {
    skeleton: { id: options.id, bones },
    profile: Profile.build(
      new Map(
        bind.map((bone: IBind): [string, IAutoMovieHumanCanonicalSolids.IJoint] => {
          const heel: IAutoMovieVector3 | undefined = heels.get(bone.bone);
          return [
            bone.bone,
            {
              parent: bone.parent,
              carrier: carrier.get(bone.bone)!,
              position: position.get(bone.bone)!,
              tip: tip.get(bone.bone)!,
              radius: bone.radius,
              ...(heel === undefined ? {} : { heel }),
            },
          ];
        }),
      ),
      options.mass,
      options.id,
      options.person,
    ),
    joints: bind.map((bone: IBind): IAutoMovieHumanCanonicalBody.IJoint => {
      const p: IAutoMovieVector3 = position.get(bone.bone)!;
      const end: IAutoMovieVector3 | null = tip.get(bone.bone)!;
      const heel: IAutoMovieVector3 | undefined = heels.get(bone.bone);
      return {
        bone: bone.bone,
        parent: bone.parent,
        carrier: carrier.get(bone.bone)!,
        position: [p.x, p.y, p.z],
        tip: end === null ? null : [end.x, end.y, end.z],
        radius: bone.radius,
        ...(heel === undefined ? {} : { heel: [heel.x, heel.y, heel.z] }),
      };
    }),
  };
}

/*
 * The reflection `(x, y, z) -> (z, y, x)` from Human's frame to the canonical one.
 */
function reflect(v: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: v.z, y: v.y, z: v.x };
}

/*
 * A rotation conjugated by the reflection: its axis reflects and its sense reverses.
 */
function reflectRotation(q: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: -q.z, y: -q.y, z: -q.x, w: q.w };
}

/*
 * Every humanoid bone id, telling Human's own joints apart.
 */
const HUMANOID: ReadonlySet<string> = new Set<string>([
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "jaw",
  ...(["left", "right"] as const).flatMap((s: string): string[] =>
    [
      "Shoulder",
      "UpperArm",
      "LowerArm",
      "Hand",
      "UpperLeg",
      "LowerLeg",
      "Foot",
      "Toes",
      "ThumbMetacarpal",
      "ThumbProximal",
      "ThumbDistal",
      ...["Index", "Middle", "Ring", "Little"].flatMap((d: string): string[] =>
        ["Proximal", "Intermediate", "Distal"].map(
          (k: string): string => `${d}${k}`,
        ),
      ),
    ].map((b: string): string => `${s}${b}`),
  ),
]);

/*
 * The side of a toe joint, or null for any other joint.
 */
function toeSide(bone: string): string | null {
  const m: RegExpExecArray | null = /^(left|right)(Hallux|Toe\d)/.exec(bone);
  return m === null ? null : m[1]!;
}

/*
 * A tuple as a vector.
 */
function vector(p: readonly number[]): IAutoMovieVector3 {
  return { x: p[0]!, y: p[1]!, z: p[2]! };
}
