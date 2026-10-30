import * as THREE from "three";

import type { AutoMovieHumanNeckSurface } from "../../../human/src/generation/AutoMovieHumanNeckSurface";
import type { AutoMovieHumanSkeleton } from "../../../human/src/skeleton/AutoMovieHumanSkeleton";
import { reportAutoMovieResourceRetirement } from "../../../viewer/src/reportAutoMovieResourceRetirement";
import { buildHumanPolygonModule } from "./buildHumanPolygonModule";
import { createHumanPolygonPalette } from "./createHumanPolygonPalette";

/**
 * Draw a rigid polygon blockout from the generated skeleton, in metres.
 *
 * Eight-sided sections and two to four levels are this preview's explicit LOD.
 * These display samples do not replace realistic Human generation. Joint spans set torso, palm
 * and foot breadth; skin girth radii set thickness outside the neck and head.
 * Their exterior courses and crown come from the same prepared body,
 * independently of rig radii and head bevels. Source perimeter measurements
 * are distinct from this eight-point display polygon's perimeter. Each rest-space module is
 * moved once by its bone's world placement. Adjacent rigid modules can overlap
 * or separate when posed; this is not skin binding or a watertight skin.
 *
 * The head attachment uses the head joint's rest axes: +X forward, +Y up and
 * +Z left. Its bounds describe the emitted polygon, before the posed transform.
 * The caller may attach a face to `head.object` in that same local frame.
 *
 * @param output Generated bones, placements and the opted-in neck/head exterior.
 * @param options Optional display colours keyed by emitted bone name; unmatched palette entries are unused.
 * @returns Owned surface, optional generating sections, head attachment and cleanup.
 *
 * @evidence contracts/common.md#principled-implementation Dimensions come from skeleton joints, tips and girth radii except the neck and head, which preserve actual prepared source courses and the crown; projected polygon arclength defines their display-only zipper correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One section loft draws each rigid module; world placements are consumed once without rebuilding forward kinematics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four actual neck courses, two head courses and one crown are sampled from the same prepared body as an explicit display LOD; no stored person-specific dense coordinates, calibration coefficients or anatomy constants replace its source evaluator.
 * @evidence contracts/common.md#meaningful-documentation Documents the LOD, units, head attachment frame, rigid-joint limitations and sticky palette/resource retirement failures.
 * @evidence contracts/performance.md#efficient-algorithms Bone and child maps are built once; each module emits at most four eight-sided sections.
 * @evidence contracts/performance.md#reuse-equivalent-work Parts share the default clay and diagnostic materials; matching RGB overrides share one current material, and sections reuse emitted ring positions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A completed palette becomes owned before the previous pool retires. Independent cleanup attempts every remaining resource and detach operation once; retirement failures remain sticky, reject further colour changes and retain bounded uncertain owners without retry.
 */
export function buildHumanPolygon(
  output: AutoMovieHumanSkeleton.IOutput,
  options: {
    /** RGB hex overrides for matching emitted parts; omitted parts retain clay. */
    partColors?: Readonly<Record<string, number>>;
  } = {},
): {
  /** Root containing both passes; add it to the scene once. */
  object: THREE.Group;
  /** Solid modules; hide this for a construction-only pass. */
  surface: THREE.Group;
  /** Actual emitted section rings and crown fan spokes, hidden initially. */
  sections: THREE.Group;
  /** Posed head group and its unposed local polygon bounds. */
  head: {
    /** Head bone's posed group, accepting local face geometry. */
    object: THREE.Group;
    /** Minimum of its actual local polygon bounds. */
    min: Vector;
    /** Maximum of its actual local polygon bounds. */
    max: Vector;
    /** Frontmost local triangle X at Y/Z, or undefined outside the silhouette. */
    frontAt: (y: number, z: number) => number | undefined;
  };
  /** Replace display colours without rebuilding geometry or changing the pose; undefined restores clay. */
  setPartColors: (colors?: Readonly<Record<string, number>>) => void;
  /** Release only resources owned by this builder, excluding an attached face. */
  dispose: () => void;
} {
  createHumanPolygonPalette.validate(options.partColors);
  const bones: Map<string, AutoMovieHumanSkeleton.IBone> = new Map();
  const children: Map<string, AutoMovieHumanSkeleton.IBone[]> = new Map();
  const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map();
  for (const bone of output.bones) {
    if (
      !(bone.radius > 0) ||
      !Number.isFinite(bone.radius) ||
      !bone.position.every(Number.isFinite) ||
      (bone.tip !== null && !bone.tip.every(Number.isFinite))
    )
      throw new Error(`Invalid polygon skeleton bone: ${bone.bone}`);
    bones.set(bone.bone, bone);
    if (bone.parent !== null) {
      const siblings: AutoMovieHumanSkeleton.IBone[] =
        children.get(bone.parent) ?? [];
      siblings.push(bone);
      children.set(bone.parent, siblings);
    }
  }
  for (const placement of output.posed)
    placements.set(placement.bone, placement);
  const neckSurface: Readonly<AutoMovieHumanNeckSurface.IOutput> | undefined =
    output.neckSurface;
  if (
    neckSurface === undefined ||
    neckSurface.units !== "metres" ||
    neckSurface.sections.length < 2 ||
    neckSurface.headSections?.length !== 2 ||
    neckSurface.phases.length < 3 ||
    neckSurface.crown?.end !== "top" ||
    !neckSurface.crown.point.every(Number.isFinite)
  )
    throw new Error(
      "Polygon neck and head require the prepared exterior descriptor",
    );
  const exterior: (source: AutoMovieHumanNeckSurface.ISection) => ISection = (
    source: AutoMovieHumanNeckSurface.ISection,
  ): ISection => {
    if (
      source.points.length < 3 ||
      source.sourcePhases.length !== source.points.length ||
      source.displayCoordinates.length !== source.points.length ||
      !source.sourcePhases.every(Number.isFinite) ||
      !source.displayCoordinates.every(Number.isFinite)
    )
      throw new Error(
        "Exterior points require their source phases and display coordinates",
      );
    return {
      centre: new THREE.Vector3(...source.centre),
      depth: source.depth / 2,
      breadth: source.breadth / 2,
      points: source.points.map(
        (point: Vector): THREE.Vector3 => new THREE.Vector3(...point),
      ),
      displayCoordinates: source.displayCoordinates,
    };
  };
  const neckRings: ISection[] = neckSurface.sections.map(exterior);
  const boneAt: (name: string) => AutoMovieHumanSkeleton.IBone = (
    name: string,
  ): AutoMovieHumanSkeleton.IBone => {
    const bone: AutoMovieHumanSkeleton.IBone | undefined = bones.get(name);
    if (bone === undefined)
      throw new Error(`Missing polygon skeleton bone: ${name}`);
    return bone;
  };
  const object: THREE.Group = new THREE.Group();
  object.name = "human.polygon";
  const surface: THREE.Group = new THREE.Group();
  surface.name = "human.polygon.surface";
  const sections: THREE.Group = new THREE.Group();
  sections.name = "human.polygon.sections";
  sections.visible = false;
  object.add(surface, sections);
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7b6a3,
    roughness: 0.85,
    flatShading: true,
  });
  const lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0x206b7a,
    depthTest: false,
  });
  const geometries: THREE.BufferGeometry[] = [];
  const groups: Map<string, THREE.Group> = new Map();
  const partMeshes: Map<string, THREE.Mesh> = new Map();
  const palette: ReturnType<typeof createHumanPolygonPalette> =
    createHumanPolygonPalette(material, partMeshes);
  let disposed: boolean = false;
  let retirementFailure: { error: unknown } | undefined;

  const setPartColors: (colors?: Readonly<Record<string, number>>) => void = (
    colors?: Readonly<Record<string, number>>,
  ): void => {
    if (disposed) throw new Error("Polygon drawing is disposed");
    palette.setPartColors(colors);
  };

  const add: (
    bone: AutoMovieHumanSkeleton.IBone,
    rings: ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: Vector,
  ) => THREE.Group = (
    bone: AutoMovieHumanSkeleton.IBone,
    rings: ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: Vector,
  ): THREE.Group => {
    const placement: AutoMovieHumanSkeleton.IPlacement | undefined =
      placements.get(bone.bone);
    if (placement === undefined)
      throw new Error(`Missing polygon placement: ${bone.bone}`);
    const { group, diagnostic, part } = buildHumanPolygonModule(
      bone,
      rings,
      placement,
      material,
      lineMaterial,
      geometries,
      axis,
      breadth,
      topPole,
    );
    partMeshes.set(bone.bone, part);
    surface.add(group);
    sections.add(diagnostic);
    groups.set(bone.bone, group);
    return group;
  };

  // Shared horizontal boundaries keep the rest torso's adjoining modules aligned.
  const hips: AutoMovieHumanSkeleton.IBone = boneAt("hips");
  const spine: AutoMovieHumanSkeleton.IBone = boneAt("spine");
  const chest: AutoMovieHumanSkeleton.IBone = boneAt("chest");
  const neck: AutoMovieHumanSkeleton.IBone = boneAt("neck");
  const hipBreadth: number = Math.max(
    hips.radius,
    Math.abs(
      boneAt("leftUpperLeg").position[2] - boneAt("rightUpperLeg").position[2],
    ) /
      2 +
      Math.max(boneAt("leftUpperLeg").radius, boneAt("rightUpperLeg").radius),
  );
  const shoulderCentre: THREE.Vector3 = midpoint(
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
  const hipRing: ISection = section(
    new THREE.Vector3(...hips.position),
    hips.radius,
    hipBreadth,
  );
  const lumbarRing: ISection = section(
    new THREE.Vector3(...spine.position),
    spine.radius,
    spine.radius,
  );
  const chestRing: ISection = section(
    new THREE.Vector3(...chest.position),
    chest.radius,
    chest.radius,
  );
  const pelvisBottom: THREE.Vector3 = new THREE.Vector3(...hips.position);
  pelvisBottom.y -= Math.min(
    boneAt("leftUpperLeg").radius,
    boneAt("rightUpperLeg").radius,
  );
  add(
    hips,
    [section(pelvisBottom, hips.radius, hipBreadth), hipRing, lumbarRing],
    UP,
  );
  add(spine, [lumbarRing, chestRing], UP);

  // Every exterior ring keeps its own source points and chart. Their separate
  // projected polygon coordinates define display correspondence, not material
  // phase equality across the source head's compound domains.
  const headBone: AutoMovieHumanSkeleton.IBone = boneAt("head");
  const attachment: ISection = neckRings[neckRings.length - 1]!;
  const headRings: ISection[] = [
    attachment,
    ...neckSurface.headSections.map(exterior),
  ];
  const headObject: THREE.Group = add(
    headBone,
    headRings,
    UP,
    undefined,
    neckSurface.crown.point,
  );
  const headMesh: THREE.Mesh = headObject.children[0] as THREE.Mesh;
  headMesh.geometry.computeBoundingBox();
  const headBox: THREE.Box3 = headMesh.geometry.boundingBox!;

  // The collar and neck share the actual lower exterior. Rig pivots do not
  // select surface dimensions, and the head cannot resize this owned boundary.
  const neckBase: ISection = neckRings[0]!;
  add(
    chest,
    [
      chestRing,
      section(shoulderCentre, chest.radius, shoulderBreadth),
      neckBase,
    ],
    UP,
  );
  add(neck, neckRings, UP);

  for (const side of ["left", "right"]) {
    const hand: AutoMovieHumanSkeleton.IBone = boneAt(`${side}Hand`);
    const roots: AutoMovieHumanSkeleton.IBone[] = [
      "Index",
      "Middle",
      "Ring",
      "Little",
    ].map(
      (digit: string): AutoMovieHumanSkeleton.IBone =>
        boneAt(`${side}${digit}Proximal`),
    );
    const centre: THREE.Vector3 = average(roots);
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
        section(new THREE.Vector3(...hand.position), wristRadius, wristRadius),
        section(centre, hand.radius, Math.max(width, hand.radius)),
      ],
      axis,
      breadthAxis,
    );

    const subtalar: AutoMovieHumanSkeleton.IBone = boneAt(`${side}Subtalar`);
    const midfoot: AutoMovieHumanSkeleton.IBone = boneAt(`${side}Midfoot`);
    const toes: AutoMovieHumanSkeleton.IBone[] =
      children.get(midfoot.bone) ?? [];
    const toeCentre: THREE.Vector3 = average(toes);
    const toeWidth: number = Math.max(
      ...toes.map(
        (toe: AutoMovieHumanSkeleton.IBone): number =>
          Math.abs(toe.position[2] - toeCentre.z) + toe.radius,
      ),
    );
    const footWidth: number = Math.max(subtalar.radius, toeWidth);
    const ankle: THREE.Vector3 = new THREE.Vector3(...subtalar.position);
    const mid: THREE.Vector3 = new THREE.Vector3(...midfoot.position);
    add(
      subtalar,
      [
        section(ankle, subtalar.radius, subtalar.radius),
        section(mid, midfoot.radius, footWidth),
      ],
      mid.clone().sub(ankle),
      LEFT,
    );
    add(
      midfoot,
      [
        section(mid, midfoot.radius, footWidth),
        section(toeCentre, midfoot.radius, footWidth),
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
    const descendants: AutoMovieHumanSkeleton.IBone[] =
      children.get(bone.bone) ?? [];
    const endBone: AutoMovieHumanSkeleton.IBone | undefined = descendants.find(
      (child: AutoMovieHumanSkeleton.IBone): boolean =>
        child.bone !== "jaw" && !child.bone.endsWith("Eye"),
    );
    const end: Vector | undefined = bone.tip ?? endBone?.position;
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
  const dispose: (primary?: { error: unknown }) => void = (
    primary?: { error: unknown },
  ): void => {
    if (retirementFailure !== undefined) throw retirementFailure.error;
    if (disposed) return;
    disposed = true;
    try {
      reportAutoMovieResourceRetirement(
        [
          ...geometries.map(
            (geometry: THREE.BufferGeometry): (() => void) =>
              (): void =>
                geometry.dispose(),
          ),
          (): void => material.dispose(),
          (): void => lineMaterial.dispose(),
          (): void => palette.dispose(),
          (): void => object.removeFromParent(),
          (): void => object.clear(),
          (): void => partMeshes.clear(),
          (): void => groups.clear(),
        ],
        palette.failure ?? primary,
      );
      palette.completeRetirement();
      geometries.length = 0;
    } catch (error: unknown) {
      retirementFailure = { error };
      throw error;
    }
  };
  try {
    setPartColors(options.partColors);
  } catch (error: unknown) {
    dispose({ error });
    throw error;
  }
  return {
    object,
    surface,
    sections,
    setPartColors,
    head: {
      object: headObject,
      min: [headBox.min.x, headBox.min.y, headBox.min.z],
      max: [headBox.max.x, headBox.max.y, headBox.max.z],
      frontAt: (y: number, z: number): number | undefined =>
        buildHumanPolygonModule.frontAt(headMesh.geometry, headBox, y, z),
    },
    dispose,
  };
}

/** Registered metre coordinates. */
type Vector = [number, number, number];

/** Selected physical sections passed to the display mesh assembler. */
type ISection = buildHumanPolygonModule.ISection;

/** Leaf caps narrow in the same dimensionless preview LOD. */
const TIP_BEVEL: number = 0.5;
/** Registered upward axis. */
const UP: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
/** Registered lateral axis, shared for both sides. */
const LEFT: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

/** Make a section preserving circular girth radius as ellipse area. */
function section(
  centre: THREE.Vector3,
  radius: number,
  breadth: number,
): ISection {
  return { centre, depth: (radius * radius) / breadth, breadth };
}

/** Mean rest position of a nonempty set of joints. */
function average(bones: AutoMovieHumanSkeleton.IBone[]): THREE.Vector3 {
  if (bones.length === 0)
    throw new Error("Polygon module requires joint endpoints");
  const centre: THREE.Vector3 = new THREE.Vector3();
  for (const bone of bones) centre.add(new THREE.Vector3(...bone.position));
  return centre.multiplyScalar(1 / bones.length);
}

/** Bilateral joint midpoint in the registered rest frame. */
function midpoint(
  a: AutoMovieHumanSkeleton.IBone,
  b: AutoMovieHumanSkeleton.IBone,
): THREE.Vector3 {
  return average([a, b]);
}
