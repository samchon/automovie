import type {
  IAutoMovieResolveHumanoidRingModules,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * The rigid ring modules of a humanoid body, each a short stack of eight-sided
 * sections around one joint's segment, from the rest skeleton alone: joint
 * positions, tips and girth radii.
 *
 * This is the one statement of the body's simple solid form. The polygon
 * drawing lofts a mesh through each module's rings and the physical profile
 * takes the convex hull of the same ring points as that segment's collider, so
 * what is seen and what collides cannot drift apart.
 *
 * The skeleton is in the Human frame at rest: +X forward, +Y up, +Z left,
 * metres. The trunk's modules share their boundary rings (pelvis floor, hip,
 * waist, chest, shoulder, neck base), widened to the hip and shoulder joint
 * spans; the neck runs from the neck joint to the head joint; the head widens
 * to its girth and closes on a pole at its tip; a palm runs from the wrist
 * toward the mean of the four finger roots as far as the farthest of them, so
 * no knuckle is bare beyond it; a foot is two modules through the subtalar and
 * midfoot joints to the toe roots; every other segment is three round rings
 * from its joint to its end, narrowing to the next segment or bevelled at a
 * leaf. Shoulder, scapula, foot, eye, jaw and atlas joints drive others and
 * carry no module.
 * Parameter bones: The rest joints, parent before child, in the Human frame.
 * Returns: The modules in drawing order: hips, spine, head, chest, neck, each
 * side's hand and two foot modules, then every remaining segment in joint
 * order.
 * When a joint a module is built from is missing.
 */
export function resolveHumanoidRingModules(
  bones: readonly IAutoMovieResolveHumanoidRingModules.IBone[],
): IAutoMovieResolveHumanoidRingModules.IModule[] {
  const byName: Map<string, IAutoMovieResolveHumanoidRingModules.IBone> =
    new Map();
  const children: Map<string, IAutoMovieResolveHumanoidRingModules.IBone[]> =
    new Map();
  for (const bone of bones) {
    byName.set(bone.bone, bone);
    if (bone.parent !== null)
      children.set(bone.parent, [...(children.get(bone.parent) ?? []), bone]);
  }
  const boneAt = (name: string): IAutoMovieResolveHumanoidRingModules.IBone => {
    const bone: IAutoMovieResolveHumanoidRingModules.IBone | undefined =
      byName.get(name);
    if (bone === undefined)
      throw new Error(`Missing ring module skeleton bone: ${name}`);
    return bone;
  };
  const at = (
    bone: IAutoMovieResolveHumanoidRingModules.IBone,
  ): IAutoMovieVector3 => vector(bone.position);
  const average = (
    list: readonly IAutoMovieResolveHumanoidRingModules.IBone[],
  ): IAutoMovieVector3 => {
    if (list.length === 0)
      throw new Error("A ring module requires joint endpoints");
    let centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const bone of list) centre = AutoMovieEngineVector3.add(centre, at(bone));
    return AutoMovieEngineVector3.scale(centre, 1 / list.length);
  };
  const modules: IAutoMovieResolveHumanoidRingModules.IModule[] = [];
  const drawn: Set<string> = new Set();
  const add = (
    bone: IAutoMovieResolveHumanoidRingModules.IBone,
    sections: ISection[],
    axis: IAutoMovieVector3,
    breadth: IAutoMovieVector3 | null,
    pole: IAutoMovieVector3 | null,
  ): void => {
    // The section frame: the axis as normal, the first in-plane axis across
    // the breadth axis (forward when none is given), the second along it.
    const normal: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      axis,
      1 / AutoMovieEngineVector3.length(axis),
    );
    let u: IAutoMovieVector3 =
      breadth === null ? { x: 1, y: 0, z: 0 } : AutoMovieEngineVector3.cross(breadth, normal);
    u = AutoMovieEngineVector3.subtract(u, AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(u, normal)));
    if (AutoMovieEngineVector3.dot(u, u) < Number.EPSILON)
      u = AutoMovieEngineVector3.subtract(
        { x: 0, y: 1, z: 0 },
        AutoMovieEngineVector3.scale(normal, normal.y),
      );
    u = AutoMovieEngineVector3.scale(u, 1 / AutoMovieEngineVector3.length(u));
    const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(normal, u);
    const v: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      cross,
      1 / AutoMovieEngineVector3.length(cross),
    );
    modules.push({
      bone: bone.bone,
      axis,
      breadth,
      pole,
      rings: sections.map(
        (ring: ISection): IAutoMovieResolveHumanoidRingModules.IRing => ({
          ...ring,
          points: Array.from(
            { length: SIDES },
            (_: unknown, index: number): IAutoMovieVector3 => {
              const angle: number = (2 * Math.PI * index) / SIDES;
              return AutoMovieEngineVector3.add(
                ring.centre,
                AutoMovieEngineVector3.add(
                  AutoMovieEngineVector3.scale(u, Math.cos(angle) * ring.depth),
                  AutoMovieEngineVector3.scale(v, Math.sin(angle) * ring.breadth),
                ),
              );
            },
          ),
        }),
      ),
    });
    drawn.add(bone.bone);
  };

  // Shared horizontal boundaries keep the rest torso's adjoining modules
  // aligned.
  const hips: IAutoMovieResolveHumanoidRingModules.IBone = boneAt("hips");
  const spine: IAutoMovieResolveHumanoidRingModules.IBone = boneAt("spine");
  const chest: IAutoMovieResolveHumanoidRingModules.IBone = boneAt("chest");
  const neck: IAutoMovieResolveHumanoidRingModules.IBone = boneAt("neck");
  const head: IAutoMovieResolveHumanoidRingModules.IBone = boneAt("head");
  const span = (left: string, right: string, floor: number): number =>
    Math.max(
      floor,
      Math.abs(boneAt(left).position[2] - boneAt(right).position[2]) / 2 +
        Math.max(boneAt(left).radius, boneAt(right).radius),
    );
  const hipBreadth: number = span("leftUpperLeg", "rightUpperLeg", hips.radius);
  const shoulderBreadth: number = span(
    "leftUpperArm",
    "rightUpperArm",
    chest.radius,
  );
  const shoulderCentre: IAutoMovieVector3 = average([
    boneAt("leftUpperArm"),
    boneAt("rightUpperArm"),
  ]);
  const hipRing: ISection = section(at(hips), hips.radius, hipBreadth);
  // A trunk is wider than deep: the waist and chest keep their girth radius
  // as depth and widen to the anthropometric share of the shoulder breadth,
  // so the torso does not pinch between the hips and the shoulders.
  const lumbarRing: ISection = section(
    at(spine),
    spine.radius,
    Math.max(spine.radius, WAIST_SHARE * shoulderBreadth),
  );
  const chestRing: ISection = section(
    at(chest),
    chest.radius,
    Math.max(chest.radius, CHEST_SHARE * shoulderBreadth),
  );
  const pelvisBottom: IAutoMovieVector3 = at(hips);
  pelvisBottom.y -= Math.min(
    boneAt("leftUpperLeg").radius,
    boneAt("rightUpperLeg").radius,
  );
  add(
    hips,
    [section(pelvisBottom, hips.radius, hipBreadth), hipRing, lumbarRing],
    UP,
    null,
    null,
  );
  add(spine, [lumbarRing, chestRing], UP, null, null);

  // The neck and head stay on their own rigid pivots. The lower head ring
  // reaches the existing chin landmark and overlaps the neck behind the pivot.
  const crown: IAutoMovieVector3 =
    head.tip !== null
      ? vector(head.tip)
      : AutoMovieEngineVector3.add(at(head), { x: 0, y: 2 * head.radius, z: 0 });
  const neckTop: number = neck.radius * 0.92;
  const neckRings: ISection[] = [
    section(at(neck), neck.radius, neck.radius),
    section(at(head), neckTop, neckTop),
  ];
  const headCentre: IAutoMovieVector3 = at(head);
  const jawTip: readonly [number, number, number] | null | undefined = byName.get("jaw")?.tip;
  const behind: number = headCentre.x - neckTop;
  let headAxis: IAutoMovieVector3 = UP;
  let jawRing: ISection = neckRings[1]!;
  const crownRingCentre: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
    headCentre,
    crown,
    0.75,
  );
  if (
    jawTip !== null && jawTip !== undefined &&
    Number.isFinite(jawTip[0]) &&
    Number.isFinite(jawTip[1]) &&
    jawTip[0] > headCentre.x &&
    jawTip[1] < headCentre.y
  ) {
    const backY: number = headCentre.y - neckTop * NECK_PITCH_TANGENT;
    const slope: number = (jawTip[1] - backY) / (jawTip[0] - behind);
    const frameScale: number = Math.hypot(1, slope);
    headAxis = { x: -slope, y: 1, z: 0 };
    jawRing = {
      centre: {
        x: (behind + jawTip[0]) / 2,
        y: (backY + jawTip[1]) / 2,
        z: headCentre.z,
      },
      depth: ((jawTip[0] - behind) / 2) * frameScale,
      breadth: neckTop,
    };
    // Keep the existing crown as the highest vertex after pitching the rings.
    crownRingCentre.y = Math.min(
      crownRingCentre.y,
      crown.y -
        ((head.radius * 0.85 ** 2) / 0.8) * (Math.abs(slope) / frameScale),
    );
  }
  add(
    head,
    [
      jawRing,
      section(
        AutoMovieEngineVector3.lerp(headCentre, crown, 0.35),
        head.radius,
        head.radius * 0.92,
      ),
      section(
        crownRingCentre,
        head.radius * 0.85,
        head.radius * 0.8,
      ),
    ],
    headAxis,
    null,
    crown,
  );
  add(
    chest,
    [
      chestRing,
      section(shoulderCentre, chest.radius, shoulderBreadth),
      neckRings[0]!,
    ],
    UP,
    null,
    null,
  );
  add(neck, neckRings, UP, null, null);

  const footAxes: Map<string, IAutoMovieVector3> = new Map();
  for (const side of ["left", "right"] as const) {
    const hand: IAutoMovieResolveHumanoidRingModules.IBone = boneAt(
      `${side}Hand`,
    );
    const roots: IAutoMovieResolveHumanoidRingModules.IBone[] = [
      "Index",
      "Middle",
      "Ring",
      "Little",
    ].map(
      (digit: string): IAutoMovieResolveHumanoidRingModules.IBone =>
        boneAt(`${side}${digit}Proximal`),
    );
    // The palm's axis aims at the mean of the finger roots and its end
    // section sits at the farthest root along that axis, so every finger
    // starts on or inside the palm and no knuckle is left bare beyond it.
    const mean: IAutoMovieVector3 = average(roots);
    const toward: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(mean, at(hand));
    const reach: number = AutoMovieEngineVector3.length(toward);
    if (!(reach > 0))
      throw new Error(`The palm of ${hand.bone} has no length to its fingers`);
    const farthest: number = Math.max(
      ...roots.map(
        (root: IAutoMovieResolveHumanoidRingModules.IBone): number =>
          AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(at(root), at(hand)), toward) / reach,
      ),
    );
    const knuckles: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      at(hand),
      AutoMovieEngineVector3.scale(toward, farthest / reach),
    );
    const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      at(roots[0]!),
      at(roots[3]!),
    );
    const width: number =
      AutoMovieEngineVector3.length(across) / 2 + Math.max(roots[0]!.radius, roots[3]!.radius);
    const wrist: number = Math.min(
      hand.radius,
      boneAt(`${side}LowerArm`).radius,
    );
    add(
      hand,
      [
        section(at(hand), wrist, wrist),
        section(knuckles, hand.radius, Math.max(width, hand.radius)),
      ],
      AutoMovieEngineVector3.subtract(knuckles, at(hand)),
      across,
      null,
    );

    const subtalar: IAutoMovieResolveHumanoidRingModules.IBone = boneAt(
      `${side}Subtalar`,
    );
    const midfoot: IAutoMovieResolveHumanoidRingModules.IBone = boneAt(
      `${side}Midfoot`,
    );
    const toes: IAutoMovieResolveHumanoidRingModules.IBone[] =
      children.get(midfoot.bone) ?? [];
    const toeCentre: IAutoMovieVector3 = average(toes);
    const foot: IAutoMovieResolveHumanoidRingModules.IBone | undefined = byName.get(`${side}Foot`);
    const tip: readonly [number, number, number] | null | undefined = byName.get(`${side}HalluxDistal`)?.tip;
    const heel: IAutoMovieVector3 = at(subtalar);
    let lateral: IAutoMovieVector3 = LEFT;
    let footAxis: IAutoMovieVector3 | undefined;
    if (foot?.heel !== undefined && tip !== null && tip !== undefined) {
      const rear: IAutoMovieVector3 = vector(foot.heel);
      const axis: IAutoMovieVector3 = { x: tip[0] - rear.x, y: 0, z: tip[2] - rear.z };
      const length: number = AutoMovieEngineVector3.length(axis);
      if (!(length > 0 && Number.isFinite(length)))
        throw new Error(`Invalid polygon foot outline: ${foot.bone}`);
      footAxis = AutoMovieEngineVector3.scale(axis, 1 / length);
      footAxes.set(side, footAxis);
      lateral = AutoMovieEngineVector3.cross(footAxis, UP);
      const retreat: number = AutoMovieEngineVector3.dot(
        AutoMovieEngineVector3.subtract(rear, heel),
        footAxis,
      );
      heel.x += footAxis.x * retreat;
      heel.z += footAxis.z * retreat;
    }
    const footWidth: number = Math.max(
      subtalar.radius,
      ...toes.map(
        (toe: IAutoMovieResolveHumanoidRingModules.IBone): number =>
          Math.abs(
            AutoMovieEngineVector3.dot(
              AutoMovieEngineVector3.subtract(at(toe), toeCentre),
              lateral,
            ),
          ) + toe.radius,
      ),
    );
    add(
      subtalar,
      [
        section(heel, subtalar.radius, subtalar.radius),
        section(at(midfoot), midfoot.radius, footWidth),
      ],
      footAxis ?? AutoMovieEngineVector3.subtract(at(midfoot), at(subtalar)),
      lateral,
      null,
    );
    add(
      midfoot,
      [
        section(at(midfoot), midfoot.radius, footWidth),
        section(toeCentre, midfoot.radius, footWidth),
      ],
      footAxis ?? AutoMovieEngineVector3.subtract(toeCentre, at(midfoot)),
      lateral,
      null,
    );
  }

  // Each remaining segment once. Scapula and foot joints are coincident
  // driving pivots whose descendants carry the form.
  for (const bone of bones) {
    if (
      drawn.has(bone.bone) ||
      /(?:Shoulder|Scapula|Foot|Eye)$/.test(bone.bone) ||
      bone.bone === "jaw" ||
      bone.bone === "atlas"
    )
      continue;
    const next: IAutoMovieResolveHumanoidRingModules.IBone | undefined = (
      children.get(bone.bone) ?? []
    ).find(
      (child: IAutoMovieResolveHumanoidRingModules.IBone): boolean =>
        child.bone !== "jaw" && !child.bone.endsWith("Eye"),
    );
    const end: readonly [number, number, number] | undefined =
      bone.tip ?? next?.position;
    if (end === undefined) continue;
    const start: IAutoMovieVector3 = at(bone);
    const finish: IAutoMovieVector3 = vector(end);
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(finish, start);
    if (!(AutoMovieEngineVector3.dot(axis, axis) > 0)) continue;
    const distal: number =
      bone.tip === null
        ? Math.min(bone.radius, next?.radius ?? bone.radius)
        : bone.radius * TIP_BEVEL;
    const toe: RegExpExecArray | null = /^(left|right)(?:Hallux|Toe[2-5])/.exec(bone.bone);
    const outlineAxis: IAutoMovieVector3 | undefined =
      toe === null ? undefined : footAxes.get(toe[1]!);
    add(
      bone,
      [
        { centre: start, depth: bone.radius, breadth: bone.radius },
        {
          centre: AutoMovieEngineVector3.lerp(start, finish, 0.5),
          depth: bone.radius,
          breadth: bone.radius,
        },
        { centre: finish, depth: distal, breadth: distal },
      ],
      outlineAxis ?? axis,
      outlineAxis === undefined ? null : AutoMovieEngineVector3.cross(outlineAxis, UP),
      null,
    );
  }
  return modules;
}

/*
 * A section before its points: centre and the two half dimensions.
 */
type ISection = Omit<IAutoMovieResolveHumanoidRingModules.IRing, "points">;

/*
 * A position tuple as a vector.
 */
const vector = (
  tuple: readonly [number, number, number],
): IAutoMovieVector3 => ({
  x: tuple[0],
  y: tuple[1],
  z: tuple[2],
});

/*
 * A section that keeps its girth circle's area pi r² when its lateral half
 * width becomes `breadth`: depth = r²/breadth.
 */
const section = (
  centre: IAutoMovieVector3,
  radius: number,
  breadth: number,
): ISection => ({ centre, depth: (radius * radius) / breadth, breadth });

/*
 * Points per ring: the body's one level of detail, independent of its
 * dimensions.
 */
const SIDES: number = 8;

/*
 * Waist breadth over shoulder breadth (convention: adult waist breadth about
 * three quarters of biacromial).
 */
const WAIST_SHARE: number = 0.75;

/*
 * Chest breadth over shoulder breadth (convention: adult chest breadth about
 * 0.85 of biacromial).
 */
const CHEST_SHARE: number = 0.85;

/*
 * A leaf segment's end ring over its girth radius, the display convention for a
 * bevelled tip.
 */
const TIP_BEVEL: number = 0.5;

/* Rear overlap for the stock junction's qualified 25° pitch witness. */
const NECK_PITCH_TANGENT: number = Math.tan((25 * Math.PI) / 180);

/*
 * The upward axis of the Human frame.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * The lateral axis of the Human frame, shared by both sides.
 */
const LEFT: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
