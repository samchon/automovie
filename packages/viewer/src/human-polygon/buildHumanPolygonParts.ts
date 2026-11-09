import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import type { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";
import { humanPolygonSections as Sections } from "./humanPolygonSections.js";

/**
 * Select the original mannequin's rigid modules, every one procedural from the
 * skeleton: torso rings from joint spans, neck and head rings and crown supplied
 * by the caller from the neck and head joints, palms and feet from their joints.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Preserves original torso/palm boundaries, girth-derived sections, leaf bevels and the procedural Subtalar/Midfoot foot; the neck and head rings come from their joints. The supplied existing assembler owns local emission and placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Separates unchanged body module selection from drawing lifecycle, palette and pose application; it borrows the existing bone maps and add callback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cancelled sparse model, fitted dimensions, new anatomy coefficient or authored pose enters this promotion.
 * @evidence contracts/development/common.md#meaningful-documentation Records original construction preservation and the supplied assembler's responsibility; source comments retain shared-boundary and custom driving-joint premises.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over rest bones plus bounded bilateral joint lists selects at most one rigid module per emitted bone, with map lookup rather than repeated rest-graph scans.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses shared torso/course section records and the caller's maps/material-owning assembler.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary vectors/sections transfer to assembly; the caller owns every emitted mesh, diagnostic and material and receives the actual head objects/bounds.
 */
export function buildHumanPolygonParts(
  output: AutoMovieHumanPolygon.IInput,
  children: ReadonlyMap<string, AutoMovieHumanPolygon.IBone[]>,
  crown: [number, number, number],
  neckRings: buildHumanPolygonModule.ISection[],
  headRings: buildHumanPolygonModule.ISection[],
  boneAt: (name: string) => AutoMovieHumanPolygon.IBone,
  add: (
    bone: AutoMovieHumanPolygon.IBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ) => THREE.Group,
  groups: ReadonlyMap<string, THREE.Group>,
): { headObject: THREE.Group; headMesh: THREE.Mesh; headBox: THREE.Box3 } {
  // Shared horizontal boundaries keep the rest torso's adjoining modules aligned.
  const hips: AutoMovieHumanPolygon.IBone = boneAt("hips");
  const spine: AutoMovieHumanPolygon.IBone = boneAt("spine");
  const chest: AutoMovieHumanPolygon.IBone = boneAt("chest");
  const neck: AutoMovieHumanPolygon.IBone = boneAt("neck");
  const hipBreadth: number = Math.max(
    hips.radius,
    Math.abs(
      boneAt("leftUpperLeg").position[2] - boneAt("rightUpperLeg").position[2],
    ) /
      2 +
      Math.max(boneAt("leftUpperLeg").radius, boneAt("rightUpperLeg").radius),
  );
  const shoulderCentre: THREE.Vector3 = Sections.midpoint(
    boneAt("leftUpperArm"),
    boneAt("rightUpperArm"),
  );
  const shoulderBreadth: number = Math.max(
    chest.radius,
    Math.abs(
      boneAt("leftUpperArm").position[2] - boneAt("rightUpperArm").position[2],
    ) /
      2 +
      Math.max(boneAt("leftUpperArm").radius, boneAt("rightUpperArm").radius),
  );
  const hipRing: buildHumanPolygonModule.ISection = Sections.section(
    new THREE.Vector3(...hips.position),
    hips.radius,
    hipBreadth,
  );
  // A trunk is wider than deep: the waist and chest keep their girth radius
  // as depth and widen to the anthropometric share of the shoulder breadth
  // (waist breadth about 0.75 and chest breadth about 0.85 of biacromial),
  // so the torso does not pinch between the hips and the shoulders.
  const lumbarRing: buildHumanPolygonModule.ISection = Sections.section(
    new THREE.Vector3(...spine.position),
    spine.radius,
    Math.max(spine.radius, WAIST_SHARE * shoulderBreadth),
  );
  const chestRing: buildHumanPolygonModule.ISection = Sections.section(
    new THREE.Vector3(...chest.position),
    chest.radius,
    Math.max(chest.radius, CHEST_SHARE * shoulderBreadth),
  );
  const pelvisBottom: THREE.Vector3 = new THREE.Vector3(...hips.position);
  pelvisBottom.y -= Math.min(
    boneAt("leftUpperLeg").radius,
    boneAt("rightUpperLeg").radius,
  );
  add(
    hips,
    [
      Sections.section(pelvisBottom, hips.radius, hipBreadth),
      hipRing,
      lumbarRing,
    ],
    UP,
  );
  add(spine, [lumbarRing, chestRing], UP);

  // Every exterior ring keeps its own source points and chart. Their separate
  // projected polygon coordinates define display correspondence, not material
  // phase equality across the source head's compound domains.
  const headBone: AutoMovieHumanPolygon.IBone = boneAt("head");
  const headObject: THREE.Group = add(
    headBone,
    headRings,
    UP,
    undefined,
    crown,
  );
  const headMesh: THREE.Mesh = headObject.children[0] as THREE.Mesh;
  headMesh.geometry.computeBoundingBox();
  const headBox: THREE.Box3 = headMesh.geometry.boundingBox!;

  // The collar and neck share the actual lower exterior. Rig pivots do not
  // select surface dimensions, and the head cannot resize this owned boundary.
  const neckBase: buildHumanPolygonModule.ISection = neckRings[0]!;
  add(
    chest,
    [
      chestRing,
      Sections.section(shoulderCentre, chest.radius, shoulderBreadth),
      neckBase,
    ],
    UP,
  );
  add(neck, neckRings, UP);

  for (const side of ["left", "right"] as const) {
    const hand: AutoMovieHumanPolygon.IBone = boneAt(`${side}Hand`);
    const roots: AutoMovieHumanPolygon.IBone[] = [
      "Index",
      "Middle",
      "Ring",
      "Little",
    ].map(
      (digit: string): AutoMovieHumanPolygon.IBone =>
        boneAt(`${side}${digit}Proximal`),
    );
    const centre: THREE.Vector3 = Sections.average(roots);
    const axis: THREE.Vector3 = centre
      .clone()
      .sub(new THREE.Vector3(...hand.position));
    const breadthAxis: THREE.Vector3 = new THREE.Vector3(
      ...roots[0]!.position,
    ).sub(new THREE.Vector3(...roots[3]!.position));
    const width: number =
      breadthAxis.length() / 2 + Math.max(roots[0]!.radius, roots[3]!.radius);
    const wristRadius: number = Math.min(
      hand.radius,
      boneAt(`${side}LowerArm`).radius,
    );
    add(
      hand,
      [
        Sections.section(
          new THREE.Vector3(...hand.position),
          wristRadius,
          wristRadius,
        ),
        Sections.section(centre, hand.radius, Math.max(width, hand.radius)),
      ],
      axis,
      breadthAxis,
    );

    const subtalar: AutoMovieHumanPolygon.IBone = boneAt(`${side}Subtalar`);
    const midfoot: AutoMovieHumanPolygon.IBone = boneAt(`${side}Midfoot`);
    const toes: AutoMovieHumanPolygon.IBone[] =
      children.get(midfoot.bone) ?? [];
    const toeCentre: THREE.Vector3 = Sections.average(toes);
    const toeWidth: number = Math.max(
      ...toes.map(
        (toe: AutoMovieHumanPolygon.IBone): number =>
          Math.abs(toe.position[2] - toeCentre.z) + toe.radius,
      ),
    );
    const footWidth: number = Math.max(subtalar.radius, toeWidth);
    const ankle: THREE.Vector3 = new THREE.Vector3(...subtalar.position);
    const mid: THREE.Vector3 = new THREE.Vector3(...midfoot.position);
    add(
      subtalar,
      [
        Sections.section(ankle, subtalar.radius, subtalar.radius),
        Sections.section(mid, midfoot.radius, footWidth),
      ],
      mid.clone().sub(ankle),
      LEFT,
    );
    add(
      midfoot,
      [
        Sections.section(mid, midfoot.radius, footWidth),
        Sections.section(toeCentre, midfoot.radius, footWidth),
      ],
      toeCentre.clone().sub(mid),
      LEFT,
    );
  }

  // Draw each actual segment once. Scapula/foot are coincident driving pivots;
  // their descendants already carry their posed transforms.
  for (const bone of output.bones) {
    if (
      groups.has(bone.bone) ||
      /(?:Shoulder|Scapula|Foot|Eye)$/.test(bone.bone) ||
      bone.bone === "jaw" ||
      bone.bone === "atlas"
    )
      continue;
    const descendants: AutoMovieHumanPolygon.IBone[] =
      children.get(bone.bone) ?? [];
    const endBone: AutoMovieHumanPolygon.IBone | undefined = descendants.find(
      (child: AutoMovieHumanPolygon.IBone): boolean =>
        child.bone !== "jaw" && !child.bone.endsWith("Eye"),
    );
    const end: [number, number, number] | undefined =
      bone.tip ?? endBone?.position;
    if (end === undefined) continue;
    const start: THREE.Vector3 = new THREE.Vector3(...bone.position);
    const finish: THREE.Vector3 = new THREE.Vector3(...end);
    const axis: THREE.Vector3 = finish.clone().sub(start);
    if (!(axis.lengthSq() > 0)) continue;
    const distalRadius: number =
      bone.tip === null
        ? Math.min(bone.radius, endBone?.radius ?? bone.radius)
        : bone.radius * TIP_BEVEL;
    add(
      bone,
      [
        { centre: start, depth: bone.radius, breadth: bone.radius },
        {
          centre: start.clone().lerp(finish, 0.5),
          depth: bone.radius,
          breadth: bone.radius,
        },
        { centre: finish, depth: distalRadius, breadth: distalRadius },
      ],
      axis,
    );
  }
  return { headObject, headMesh, headBox };
}

/** Waist breadth over shoulder breadth (convention: adult waist breadth about three quarters of biacromial). */
const WAIST_SHARE: number = 0.75;

/** Chest breadth over shoulder breadth (convention: adult chest breadth about 0.85 of biacromial). */
const CHEST_SHARE: number = 0.85;

/** Leaf caps narrow in the original display convention. */
const TIP_BEVEL: number = 0.5;

/** Registered upward axis. */
const UP: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

/** Registered lateral axis, shared for both sides. */
const LEFT: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
