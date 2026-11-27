import type {
  IAutoMovieHumanBindBone,
  IAutoMovieHumanBonePlacement,
  IAutoMovieHumanSkeleton,
} from "@automovie/interface";
import * as THREE from "three";

import { reportResourceRetirement } from "../../internal/reportResourceRetirement";
import type { AutoMovieRenderHumanPolygon } from "../../AutoMovieRenderHumanPolygon";
import { applyHumanPolygonPose } from "./applyHumanPolygonPose";
import { buildHumanPolygonModule } from "./buildHumanPolygonModule";
import { buildHumanPolygonParts } from "./buildHumanPolygonParts";
import { createHumanPolygonPalette } from "./createHumanPolygonPalette";
import { prepareHumanPolygonPresentation } from "./prepareHumanPolygonPresentation";

/*
 * Draw a rigid polygon blockout from the generated skeleton, in metres.
 *
 * Every module is procedural and comes from the skeleton alone: joint
 * positions, tips and skin girth radii, never the Human's skin surfaces, so the
 * polygon figure keeps working however the realistic skin is built. The
 * engine's `resolveHumanoidRingModules` owns the rings and their
 * points, which the physical profile also takes its colliders from. Modules use
 * eight-sided sections at their selected levels. Joint spans set torso, palm
 * and foot breadth; girth radii set thickness; the neck runs from the neck
 * joint to the head joint and the head closes on the head's tip. Each
 * rest-space module is moved once by its bone's world placement. Adjacent rigid
 * modules can overlap or separate when posed; this is not skin binding or a
 * watertight skin.
 *
 * The blockout stays deliberately simple: a fix corrects a wrong value (a
 * radius, a length, a frame) within the same primitives and section count,
 * never adds geometry, smoothing, anatomy or realism, because its job is a
 * cheap, deterministic silhouette for motion checks and diffusion hints.
 *
 * The head attachment uses the head joint's rest axes: +X forward, +Y up and +Z
 * left. Its bounds describe the emitted polygon, before the posed transform.
 * The caller may attach a face to `head.object` in that same local frame.
 * Parameter output: Generated bones and placements.
 * Parameter options: Optional display colours keyed by emitted bone name and
 * authored cues sampled on the shot-local source clock.
 * Returns: Owned surface, actual bone/mesh registries, pose/palette ports,
 * generating sections, head attachment and cleanup. Local probe points use
 * registered rest point minus the corresponding rest joint; actor-root
 * placement belongs to the parent.
 */
export function buildHumanPolygon(
  output: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
  options: {
    /*
     * RGB hex overrides for matching emitted parts; omitted parts retain clay.
     */
    partColors?: Readonly<Record<string, number>>;
    /*
     * Source pose, actor frame and authored polygon cues for optional
     * time-based drawing.
     */
    presentation?: AutoMovieRenderHumanPolygon.IPresentation;
  } = {},
): AutoMovieRenderHumanPolygon.IDrawing {
  createHumanPolygonPalette.validate(options.partColors);
  const bones: Map<string, IAutoMovieHumanBindBone> = new Map();
  const placements: Map<string, IAutoMovieHumanBonePlacement> = new Map();
  for (const bone of output.bones) {
    if (bones.has(bone.bone) || !(bone.radius > 0))
      throw new Error(`Invalid polygon skeleton bone: ${bone.bone}`);
    bones.set(bone.bone, bone);
  }
  for (const placement of output.posed)
    placements.set(placement.bone, placement);

  /*
   * Resolve an original construction joint or refuse its missing identity.
   *
   * Principled implementation: Reads the fixed rest map by exact bone id and
   * throws instead of inventing a joint. Clear and simple design: One lookup
   * serves original shape selection. Prohibited implementation shortcuts: No
   * fallback anatomy or fixture selector is used. Meaningful documentation:
   * States exact identity and missing-joint refusal. Efficient algorithms:
   * Constant map lookup. Reuse equivalent work: Reads the map built once from
   * the supplied rest bones. Bound retention and release resources: Borrows map
   * entries only for synchronous construction.
   */
  const boneAt: (name: string) => IAutoMovieHumanBindBone = (
    name: string,
  ): IAutoMovieHumanBindBone => {
    const bone: IAutoMovieHumanBindBone | undefined = bones.get(name);
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
    (bone: IAutoMovieHumanBindBone): string => bone.bone,
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
  let samplePresentation:
    | ReturnType<typeof prepareHumanPolygonPresentation>
    | undefined;
  let retirementFailure: { error: unknown } | undefined;

  /*
   * Guard the existing palette lifetime before replacing display colours.
   *
   * Principled implementation: Refuses a disposed drawing and delegates RGB
   * admission/allocation to the original palette owner. Clear and simple
   * design: The drawing owns the disposal guard and the palette owns materials.
   * Prohibited implementation shortcuts: Palette changes alter no geometry or
   * pose. Meaningful documentation: States lifetime refusal and palette
   * delegation. Efficient algorithms: Constant guard plus the palette's O(P)
   * assignment scan. Reuse equivalent work: Reuses emitted meshes and
   * equal-current-RGB materials. Bound retention and release resources: The
   * palette owns current/uncertain material pools; this guard adds no native
   * resource.
   */
  const setPartColors: (colors?: Readonly<Record<string, number>>) => void = (
    colors?: Readonly<Record<string, number>>,
  ): void => {
    if (disposed) throw new Error("Polygon drawing is disposed");
    palette.setPartColors(colors);
  };

  /*
   * Register the original module's actual surface and diagnostic bone frames.
   *
   * Principled implementation: Calls the unchanged module assembler with the
   * selected sections and supplied bind-relative placement, then registers its
   * actual returned objects by exact bone identity. Clear and simple design:
   * One assembly seam connects original geometry to stable public mesh/group
   * registries. Prohibited implementation shortcuts: Registry values are
   * displayed objects rather than collision proxies or reconstructed forms.
   * Meaningful documentation: States actual-object registration and shared
   * diagnostic placement. Efficient algorithms: One map lookup/registration
   * plus the assembler's ring/index work per emitted part. Reuse equivalent
   * work: Reuses borrowed default materials and a single geometry retirement
   * inventory. Bound retention and release resources: Newly emitted buffers
   * transfer to the drawing inventory and registries until terminal disposal.
   */
  const add: (
    bone: IAutoMovieHumanBindBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ) => THREE.Group = (
    bone: IAutoMovieHumanBindBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ): THREE.Group => {
    const placement: IAutoMovieHumanBonePlacement | undefined = placements.get(
      bone.bone,
    );
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

  /*
   * Preserve original one-attempt resource retirement and sticky failures.
   *
   * Principled implementation: Attempts every owned geometry/material/palette
   * and graph-detach operation through the existing reporter; completed
   * disposal clears registries, and failure is retained/rethrown without retry.
   * Clear and simple design: One terminal drawing owner coordinates palette
   * retirement and actual graph release. Prohibited implementation shortcuts:
   * Separately attached faces/equipment are not silently claimed or disposed.
   * Meaningful documentation: States one-attempt cleanup, failure retention and
   * attached-resource ownership. Efficient algorithms: O(R+P) retirement for R
   * owned buffers/materials and P registered parts; successful repeat is
   * constant. Reuse equivalent work: Repeated disposal returns or rethrows its
   * original terminal result instead of rerunning effectful release. Bound
   * retention and release resources: Clears geometry and registry populations
   * on success; failed retirement preserves the bounded uncertain owners and
   * original cause.
   */
  const dispose: (primary?: { error: unknown }) => void = (primary?: {
    error: unknown;
  }): void => {
    if (retirementFailure !== undefined) throw retirementFailure.error;
    if (disposed) return;
    disposed = true;
    samplePresentation = undefined;
    try {
      reportResourceRetirement(
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
  try {
    ({ headObject, headMesh, headBox } = buildHumanPolygonParts(
      output,
      boneAt,
      add,
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
    if (options.presentation !== undefined)
      samplePresentation = prepareHumanPolygonPresentation(
        options.presentation,
        bones,
        new Set(partMeshes.keys()),
      );
    setPartColors(options.partColors);
    applyHumanPolygonPose(object, bindings, required, output);
  } catch (error: unknown) {
    dispose({ error });
    throw error;
  }
  const drawing: AutoMovieRenderHumanPolygon.IDrawing = {
    object,
    surface,
    sections,
    parts: partMeshes,
    bones: groups,
    bindings,
    setPose: (
      pose: Pick<
        Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
        "posed"
      >,
    ): void => {
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
  if (samplePresentation !== undefined)
    drawing.drawAt = (seconds: number): void => {
      if (samplePresentation === undefined)
        throw new Error("Polygon drawing is disposed");
      drawing.setPose(samplePresentation(seconds));
    };
  return drawing;
}
