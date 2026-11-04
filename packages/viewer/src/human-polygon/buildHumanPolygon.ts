import * as THREE from "three";

import { reportAutoMovieResourceRetirement } from "../reportAutoMovieResourceRetirement.js";
import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import { applyHumanPolygonPose } from "./applyHumanPolygonPose.js";
import { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";
import { buildHumanPolygonParts } from "./buildHumanPolygonParts.js";
import { createHumanPolygonPalette } from "./createHumanPolygonPalette.js";
import { measureHumanPolygonFootSupport } from "./measureHumanPolygonFootSupport.js";
import { prepareHumanPolygonFootSurface } from "./prepareHumanPolygonFootSurface.js";

/**
 * Draw a rigid polygon blockout from the generated skeleton, in metres.
 *
 * Procedural body modules use eight-sided sections at their selected levels.
 * The default Human exterior supplies four neck courses and two head courses;
 * the public adapter retains every supplied course and its admitted source
 * points, including point counts other than eight. Joint spans set torso, palm
 * and legacy foot breadth; skin girth radii set procedural thickness. Optional
 * Human foot courses replace only the existing Subtalar/Midfoot sections,
 * preserving all source points and their separate joint bindings. Neck/head
 * exterior courses and crown come from the same prepared body,
 * independently of rig radii and head bevels. Source perimeter measurements
 * are distinct from the sampled display polygon's perimeter. Each rest-space module is
 * moved once by its bone's world placement. Adjacent rigid modules can overlap
 * or separate when posed; this is not skin binding or a watertight skin.
 *
 * The head attachment uses the head joint's rest axes: +X forward, +Y up and
 * +Z left. Its bounds describe the emitted polygon, before the posed transform.
 * The caller may attach a face to `head.object` in that same local frame.
 * Opted-in feet expose actual Float32 landmark addresses and fixed initial
 * placed heights over every emitted foot descendant, including toes. Named
 * landmarks need not share the minimum; numerical coincidence is not a live
 * support or collision certificate. Posing does not redefine this reference.
 *
 * @param output Generated bones, placements, required neck/head exterior and optional source foot courses.
 * @param options Optional display colours keyed by emitted bone name; unmatched palette entries are unused.
 * @returns Owned surface, actual bone/mesh registries, pose/palette ports, generating sections, head attachment and cleanup. Local probe points use registered rest point minus the corresponding rest joint; actor-root placement belongs to the parent.
 *
 * @evidence contracts/common.md#principled-implementation Procedural dimensions come from skeleton joints, tips and girth radii; neck/head and optional articulated feet retain actual prepared source courses. Foot source addresses identify actual emitted Float32 vertices; initial full-foot/toe heights are measured from the actual placed mesh population. Source display correspondence controls only existing zipper connectivity.
 * @evidence contracts/common.md#clear-and-simple-design One section loft draws each rigid module; body-frame placements are consumed once without rebuilding forward kinematics, actual string bone registries expose the same mesh frames, and setPose atomically updates surface and diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All admitted source neck/head/foot courses retain their supplied point populations, including at least three points per consistent module ring. Defaults are not public upper bounds. No source flattening, hidden dimension adjustment, dense replacement, landmark hull inference or assumed three-point floor enters the drawing; rigid shared seams can open when posed.
 * @evidence contracts/common.md#meaningful-documentation Documents the LOD, units, head attachment frame, rigid-joint limitations and sticky palette/resource retirement failures.
 * @evidence contracts/performance.md#efficient-algorithms Bone/child/placement maps are built once for B bones. Course conversion, ring assembly, zipper joining and normal generation follow actual emitted vertices V and triangles T, with O(B+V+T) construction work/storage; source course and point counts are not bounded by the procedural body's eight-sided sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work Parts share the default clay and diagnostic materials; matching RGB overrides share one current material, and sections reuse emitted ring positions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A completed palette becomes owned before the previous pool retires. Independent cleanup attempts every remaining resource and detach operation once; retirement failures remain sticky, reject further colour changes and retain bounded uncertain owners without retry.
 */
export function buildHumanPolygon(
  output: AutoMovieHumanPolygon.IInput,
  options: {
    /** RGB hex overrides for matching emitted parts; omitted parts retain clay. */
    partColors?: Readonly<Record<string, number>>;
  } = {},
): AutoMovieHumanPolygon.IDrawing {
  createHumanPolygonPalette.validate(options.partColors);
  const bones: Map<string, AutoMovieHumanPolygon.IBone> = new Map();
  const children: Map<string, AutoMovieHumanPolygon.IBone[]> = new Map();
  const placements: Map<string, AutoMovieHumanPolygon.IPlacement> = new Map();
  for (const bone of output.bones) {
    if (
      bones.has(bone.bone) ||
      !(bone.radius > 0) ||
      !Number.isFinite(bone.radius) ||
      !bone.position.every(Number.isFinite) ||
      (bone.tip !== null && !bone.tip.every(Number.isFinite))
    )
      throw new Error(`Invalid polygon skeleton bone: ${bone.bone}`);
    bones.set(bone.bone, bone);
    if (bone.parent !== null) {
      const siblings: AutoMovieHumanPolygon.IBone[] =
        children.get(bone.parent) ?? [];
      siblings.push(bone);
      children.set(bone.parent, siblings);
    }
  }
  for (const placement of output.posed)
    placements.set(placement.bone, placement);
  const neckSurface: Readonly<AutoMovieHumanPolygon.IExterior> | undefined =
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

  /**
   * Preserve source points while adapting their full extents to half dimensions.
   *
   * Principled implementation: Copies actual source course points and centre, halves full extents and retains display correspondence without changing coordinates.
   * Clear and simple design: One adapter feeds the existing module section contract.
   * Prohibited implementation shortcuts: No source point is fitted, resampled or resized.
   * Meaningful documentation: States point preservation and full-to-half extent conversion.
   * Efficient algorithms: O(N) admission/copy for N supplied course points.
   * Reuse equivalent work: Reuses source display coordinates and prepares each course once per drawing.
   * Bound retention and release resources: Copied vectors transfer to construction; no generator or native resource is retained.
   */
  const exterior: (
    source: AutoMovieHumanPolygon.IExteriorSection,
  ) => buildHumanPolygonModule.ISection = (
    source: AutoMovieHumanPolygon.IExteriorSection,
  ): buildHumanPolygonModule.ISection => {
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
        (point: [number, number, number]): THREE.Vector3 =>
          new THREE.Vector3(...point),
      ),
      displayCoordinates: source.displayCoordinates,
    };
  };
  const neckRings: buildHumanPolygonModule.ISection[] =
    neckSurface.sections.map(exterior);
  const footModules: ReturnType<typeof prepareHumanPolygonFootSurface> =
    prepareHumanPolygonFootSurface(output);

  /**
   * Resolve an original construction joint or refuse its missing identity.
   *
   * Principled implementation: Reads the fixed rest map by exact bone id and throws instead of inventing a joint.
   * Clear and simple design: One lookup serves original shape selection.
   * Prohibited implementation shortcuts: No fallback anatomy or fixture selector is used.
   * Meaningful documentation: States exact identity and missing-joint refusal.
   * Efficient algorithms: Constant map lookup.
   * Reuse equivalent work: Reads the map built once from the supplied rest bones.
   * Bound retention and release resources: Borrows map entries only for synchronous construction.
   */
  const boneAt: (name: string) => AutoMovieHumanPolygon.IBone = (
    name: string,
  ): AutoMovieHumanPolygon.IBone => {
    const bone: AutoMovieHumanPolygon.IBone | undefined = bones.get(name);
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
  const geometries: THREE.BufferGeometry[] = [];
  const groups: Map<string, THREE.Group> = new Map();
  const partMeshes: Map<string, THREE.Mesh> = new Map();
  const bindings: Map<string, readonly THREE.Object3D[]> = new Map();
  const required: string[] = output.bones.map(
    (bone: AutoMovieHumanPolygon.IBone): string => bone.bone,
  );

  // Validate the complete original rig, including custom non-emitted joints,
  // before acquiring drawing materials or mutating a displayed graph.
  applyHumanPolygonPose(object, bindings, required, output);
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7b6a3,
    roughness: 0.85,
    flatShading: true,
  });
  const lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0x206b7a,
    depthTest: false,
  });
  const palette: ReturnType<typeof createHumanPolygonPalette> =
    createHumanPolygonPalette(material, partMeshes);
  let disposed: boolean = false;
  let retirementFailure: { error: unknown } | undefined;

  /**
   * Guard the existing palette lifetime before replacing display colours.
   *
   * Principled implementation: Refuses a disposed drawing and delegates RGB admission/allocation to the original palette owner.
   * Clear and simple design: The drawing owns the disposal guard and the palette owns materials.
   * Prohibited implementation shortcuts: Palette changes alter no geometry or pose.
   * Meaningful documentation: States lifetime refusal and palette delegation.
   * Efficient algorithms: Constant guard plus the palette's O(P) assignment scan.
   * Reuse equivalent work: Reuses emitted meshes and equal-current-RGB materials.
   * Bound retention and release resources: The palette owns current/uncertain material pools; this guard adds no native resource.
   */
  const setPartColors: (colors?: Readonly<Record<string, number>>) => void = (
    colors?: Readonly<Record<string, number>>,
  ): void => {
    if (disposed) throw new Error("Polygon drawing is disposed");
    palette.setPartColors(colors);
  };

  /**
   * Register the original module's actual surface and diagnostic bone frames.
   *
   * Principled implementation: Calls the unchanged module assembler with the selected sections and supplied bind-relative placement, then registers its actual returned objects by exact bone identity.
   * Clear and simple design: One assembly seam connects original geometry to stable public mesh/group registries.
   * Prohibited implementation shortcuts: Registry values are displayed objects rather than collision proxies or reconstructed forms.
   * Meaningful documentation: States actual-object registration and shared diagnostic placement.
   * Efficient algorithms: One map lookup/registration plus the assembler's ring/index work per emitted part.
   * Reuse equivalent work: Reuses borrowed default materials and a single geometry retirement inventory.
   * Bound retention and release resources: Newly emitted buffers transfer to the drawing inventory and registries until terminal disposal.
   */
  const add: (
    bone: AutoMovieHumanPolygon.IBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ) => THREE.Group = (
    bone: AutoMovieHumanPolygon.IBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ): THREE.Group => {
    const placement: AutoMovieHumanPolygon.IPlacement | undefined =
      placements.get(bone.bone);
    if (placement === undefined)
      throw new Error(`Missing polygon placement: ${bone.bone}`);
    const {
      group,
      diagnostic,
      part,
    }: ReturnType<typeof buildHumanPolygonModule> = buildHumanPolygonModule(
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
    bindings.set(bone.bone, [group, diagnostic]);
    return group;
  };

  /**
   * Preserve original one-attempt resource retirement and sticky failures.
   *
   * Principled implementation: Attempts every owned geometry/material/palette and graph-detach operation through the existing reporter; completed disposal clears registries, and failure is retained/rethrown without retry.
   * Clear and simple design: One terminal drawing owner coordinates palette retirement and actual graph release.
   * Prohibited implementation shortcuts: Separately attached faces/equipment are not silently claimed or disposed.
   * Meaningful documentation: States one-attempt cleanup, failure retention and attached-resource ownership.
   * Efficient algorithms: O(R+P) retirement for R owned buffers/materials and P registered parts; successful repeat is constant.
   * Reuse equivalent work: Repeated disposal returns or rethrows its original terminal result instead of rerunning effectful release.
   * Bound retention and release resources: Clears geometry and registry populations on success; failed retirement preserves the bounded uncertain owners and original cause.
   */
  const dispose: (primary?: { error: unknown }) => void = (primary?: {
    error: unknown;
  }): void => {
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
          (): void => {
            object.removeFromParent();
          },
          (): void => {
            object.clear();
          },
          (): void => partMeshes.clear(),
          (): void => groups.clear(),
          (): void => bindings.clear(),
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
  let headObject: THREE.Group;
  let headMesh: THREE.Mesh;
  let headBox: THREE.Box3;
  let plantar: ReturnType<typeof measureHumanPolygonFootSupport>;
  try {
    ({ headObject, headMesh, headBox } = buildHumanPolygonParts(
      output,
      children,
      neckSurface,
      neckRings,
      [
        neckRings[neckRings.length - 1]!,
        ...neckSurface.headSections.map(exterior),
      ],
      boneAt,
      add,
      groups,
      footModules,
    ));
    // Non-emitted driving joints remain real scene nodes for attachments and
    // world-space inspection, using the same admitted evaluator placements.
    for (const bone of output.bones) {
      if (groups.has(bone.bone)) continue;
      const joint: THREE.Group = new THREE.Group();
      joint.name = bone.bone;
      surface.add(joint);
      groups.set(bone.bone, joint);
      bindings.set(bone.bone, [joint]);
    }
    setPartColors(options.partColors);
    applyHumanPolygonPose(object, bindings, required, output);
    plantar = measureHumanPolygonFootSupport(output, partMeshes);
  } catch (error: unknown) {
    dispose({ error });
    throw error;
  }
  return {
    object,
    surface,
    sections,
    parts: partMeshes,
    bones: groups,
    bindings,
    ...plantar,
    setPose: (pose: Pick<AutoMovieHumanPolygon.IInput, "posed">): void => {
      if (disposed) throw new Error("Polygon drawing is disposed");
      applyHumanPolygonPose(object, bindings, required, pose);
    },
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
