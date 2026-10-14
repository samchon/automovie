import type { IAutoMovieColor, IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import { isHumanBodyAtlasSourceRecorded } from "../atlas/isHumanBodyAtlasSourceRecorded";
import { createHumanBodyExteriorFollower } from "../binding/createHumanBodyExteriorFollower";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "./IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourcePartAttachment } from "./IAutoMovieHumanBodySourcePartAttachment";
import type { IAutoMovieHumanBodySourceVertexBinding } from "./IAutoMovieHumanBodySourceVertexBinding";
import type { IHumanBodyAnatomicalAssemblyParts } from "./IHumanBodyAnatomicalAssemblyParts";
import type { IHumanBodyAnatomicalAssemblyPartsInput } from "./IHumanBodyAnatomicalAssemblyPartsInput";
import type { IHumanBodySourceShapeResult } from "./IHumanBodySourceShapeResult";
import { carryHumanBodyNeutralSourceRig } from "./carryHumanBodyNeutralSourceRig";
import { carryHumanBodySourceFields } from "./carryHumanBodySourceFields";
import { dataSourceShapes } from "./dataSourceShapes";
import { finalizeHumanBodySourceQuantities } from "./finalizeHumanBodySourceQuantities";
import { poseHumanBodySourceResidentMesh } from "./poseHumanBodySourceResidentMesh";

/** Each assembly and consumer-owned neutral exterior has one compiled follower. */
const FOLLOWERS: WeakMap<
  IAutoMovieHumanBodyAnatomicalAssembly,
  WeakMap<readonly number[], ReturnType<typeof createHumanBodyExteriorFollower>>
> = new WeakMap();

function followerOf(
  assembly: IAutoMovieHumanBodyAnatomicalAssembly,
  neutral: readonly number[],
): ReturnType<typeof createHumanBodyExteriorFollower> {
  let exteriors:
    | WeakMap<
        readonly number[],
        ReturnType<typeof createHumanBodyExteriorFollower>
      >
    | undefined = FOLLOWERS.get(assembly);
  if (exteriors === undefined) {
    exteriors = new WeakMap();
    FOLLOWERS.set(assembly, exteriors);
  }
  let follower: ReturnType<typeof createHumanBodyExteriorFollower> | undefined =
    exteriors.get(neutral);
  if (follower === undefined) {
    follower = createHumanBodyExteriorFollower(
      neutral,
      assembly.exteriorBinding!,
    );
    exteriors.set(neutral, follower);
  }
  return follower;
}

/**
 * Pose every registered coarse tissue boundary through one anatomical graph.
 *
 * Offline four-slot anatomical weights preserve independent bone identities; origin/insertion/support references must resolve in the same graph. Exact source shape and basis registration are replay conditions. Actual surface subdivisions retain separate source IDs, triangles and material ownership. Linear blending is an authored coarse performer, not a clinical muscle model, sliding-contact solver or tetrahedral solid certificate. The source shape owner solves numerical targets on the evaluated rest fields before this stage poses them. An assembly that declares an exterior binding is no longer confined to its registered shape: its stored rest positions first follow the rest skin's displacement from the neutral skin, by that binding's rule, and are then posed. An assembly without one still refuses any other shape. A neutral whole-person consumer can supply its joined exterior reference; all internal parts, held rest origins and shared attachment sites then follow that one head/body displacement field.
 *
 * @evidence contracts/common.md#principled-implementation Registered basis/shape and shared graph frames admit boundaries; actual source targets solve before resident posing and emitted Float32 quantity reads.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator owns registration/provenance/materials/quantities, delegating source solving and per-boundary posing to their named owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostic tissue colors imply no biological reflectance, coarse boundaries certify no clinical solid, and absent exterior registration preserves exact-shape refusal.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies shared frames, exact-shape/exterior-follow rules, coarse blending limits and joined whole-person exterior ownership.
 * @evidence contracts/performance.md#efficient-algorithms Boundary populations drive scans, plus owned field solving, neighbour compilation, resident posing and final readings; every member needs independent admission/output identity.
 * @evidence contracts/performance.md#reuse-equivalent-work Weak assembly/exterior identities share a compiled follower only while the admitted immutable registration, neutral samples and binding rule remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak owners release followers; live consumers can retain unbounded source-sized populations. Partial output dies on refusal while observer effects remain caller-owned.
 */
export function createHumanBodyAnatomicalAssemblyParts(
  input: IHumanBodyAnatomicalAssemblyPartsInput,
): IHumanBodyAnatomicalAssemblyParts {
  const output: IHumanBodyAnatomicalAssemblyParts = {
    rig: input.rig,
    parts: [],
    materials: [],
    quantities: [],
  };
  const assembly: IAutoMovieHumanBodyAnatomicalAssembly | undefined =
    input.basis.anatomicalAssembly;
  if (assembly === undefined) return output;
  if (
    assembly.basis !== input.basis.id ||
    assembly.generation !== assembly.rig.generation ||
    assembly.registration.trim() === ""
  )
    throw new Error(
      "Anatomical source assembly has unbound basis/rig registration.",
    );
  // The parts are registered to one rest skin. Whether a document departs
  // from that registration is read on the skin itself, not on channel names:
  // a channel that leaves the consumer's exterior where it was moves nothing
  // the parts depend on. The person consumer includes both skin partitions,
  // while a standalone body uses its own skin. An assembly registered to a
  // shape other than the basis's neutral has no neutral skin to compare with
  // and keeps the exact channel rule.
  const neutral: readonly number[] =
    input.exteriorRestReference?.neutral ?? input.basis.surfaces[0].positions;
  const restSkin: readonly number[] =
    input.exteriorRestReference?.evaluated ?? input.restSkin;
  if (
    input.exteriorRestReference !== undefined &&
    assembly.mode !== "neutral-only"
  )
    throw new Error(
      "A joined exterior reference requires a held-neutral anatomical assembly.",
    );
  const registeredToNeutral: boolean = Object.values(assembly.shape).every(
    (weight: number): boolean => weight === 0,
  );
  if (
    Object.values(assembly.shape).some(
      (weight: number): boolean => !Number.isFinite(weight),
    )
  )
    throw new Error("Anatomical source assembly shape is not registered.");
  let shaped: boolean = false;
  if (registeredToNeutral) {
    if (restSkin.length !== neutral.length)
      throw new Error(
        "Anatomical source assembly is not registered to this basis's skin.",
      );
    for (let at: number = 0; at < neutral.length && !shaped; at++)
      shaped = restSkin[at] !== neutral[at];
  } else {
    for (const key of new Set([
      ...Object.keys(assembly.shape),
      ...Object.keys(input.document.shape),
    ]))
      if ((assembly.shape[key] ?? 0) !== (input.document.shape[key] ?? 0))
        throw new Error(
          "Anatomical source assembly shape is not registered: " + key,
        );
  }
  // Without a declared binding the parts exist on the registered skin only.
  if (shaped && assembly.exteriorBinding === undefined)
    throw new Error(
      "Anatomical source assembly shape is not registered: the rest skin differs from the skin its parts are registered to.",
    );
  // A bound assembly's parts follow the rest skin's departure from the
  // neutral skin they were registered to; on the registered skin nothing moves.
  let follow: ((points: readonly number[]) => number[]) | undefined;
  if (shaped) {
    const displacement: number[] = restSkin.map(
      (value: number, at: number): number => value - neutral[at],
    );
    const follower: ReturnType<typeof createHumanBodyExteriorFollower> =
      followerOf(assembly, neutral);
    follow = (points: readonly number[]): number[] =>
      follower(points, displacement);
  }
  // An absolute source target is solved after its baseline and linear field
  // enter the evaluated exterior. Warping a solved mesh afterwards would
  // change the quantity the caller requested.
  const sourceParts: readonly IAutoMovieHumanBodySourcePart[] =
    follow === undefined
      ? assembly.parts
      : carryHumanBodySourceFields(assembly.parts, follow);
  const rig: IAutoMovieHumanBodySourceRigResult =
    follow !== undefined && assembly.mode === "neutral-only"
      ? carryHumanBodyNeutralSourceRig(input.rig, follow)
      : input.rig;
  output.rig = rig;
  const sourceShapes: IHumanBodySourceShapeResult = dataSourceShapes(
    { parts: sourceParts },
    input.document.anatomy,
    input.observeQuantityComplete,
  );
  output.quantities = sourceShapes.readings;
  const seen: Set<string> = new Set<string>();
  for (const part of sourceParts) {
    const refuse: (reason: string) => never = (reason: string): never => {
      throw new Error("Anatomical source part " + part.id + ": " + reason);
    };
    if (seen.has(part.id)) refuse("duplicate-anatomical-owner");
    seen.add(part.id);
    if (part.qualification.trim() === "" || part.surfaces.length === 0)
      refuse("source-qualification-or-geometry-unavailable");
    if (
      part.tissue === "skeletal-muscle" &&
      (!part.attachments.some(
        (attachment: IAutoMovieHumanBodySourcePartAttachment): boolean =>
          attachment.role === "origin",
      ) ||
        !part.attachments.some(
          (attachment: IAutoMovieHumanBodySourcePartAttachment): boolean =>
            attachment.role === "insertion",
        ))
    )
      refuse("muscle-origin-or-insertion-unregistered");
    if (part.tissue !== "bone" && part.attachments.length === 0)
      refuse("tissue-support-unregistered");
    for (const attachment of part.attachments)
      if (
        attachment.account.trim() === "" ||
        rig.sites.get(attachment.bone)?.has(attachment.site) !== true
      )
        refuse(
          "attachment-site-unavailable:" +
            attachment.bone +
            "/" +
            attachment.site,
        );
    const memberIds: Set<string> = new Set<string>();
    const material: string = "anatomical-source:" + part.id;
    for (const surface of part.surfaces) {
      if (surface.id.trim() === "" || memberIds.has(surface.id))
        refuse("source-member-identity-ambiguous");
      memberIds.add(surface.id);
      if (
        !isHumanBodyAtlasSourceRecorded(surface.source) ||
        !/^[a-fA-F0-9]{64}$/.test(surface.compiledMeshSha256)
      )
        refuse("source-provenance-or-rights-unrecorded:" + surface.id);
      const mesh: IAutoMovieMesh =
        sourceShapes.meshes.get(part.id)?.get(surface.id) ?? surface.mesh;
      const binding: IAutoMovieHumanBodySourceVertexBinding = surface.binding;
      if (
        surface.mesh.normals === null ||
        surface.mesh.normals.length !== surface.mesh.positions.length
      )
        refuse("original-source-directions-unavailable:" + surface.id);
      if (
        part.tissue === "bone" &&
        (binding.bones.length !== 1 || binding.bones[0] !== part.id)
      )
        refuse("bone-must-bind-to-its-own-anatomical-frame:" + surface.id);
      if (
        mesh.skin !== null ||
        mesh.positions.length === 0 ||
        mesh.positions.length % 3 !== 0 ||
        mesh.normals === null ||
        mesh.normals.length !== mesh.positions.length ||
        binding.account.trim() === "" ||
        binding.bones.length === 0 ||
        new Set(binding.bones).size !== binding.bones.length ||
        binding.boneIndices.length !== (mesh.positions.length / 3) * 4 ||
        binding.weights.length !== binding.boneIndices.length
      )
        refuse("invalid-source-surface-binding:" + surface.id);
      const posed: IAutoMovieMesh = poseHumanBodySourceResidentMesh(
        mesh,
        surface.mesh.normals!,
        binding,
        rig,
        sourceParts !== assembly.parts || mesh !== surface.mesh,
        surface.id,
        refuse,
      );
      output.parts.push({
        id: material + "/" + surface.id,
        name: part.id + " " + surface.id + " coarse " + part.tissue,
        geometry: {
          type: "mesh",
          mesh: posed,
        },
        material,
        attachedBone: null,
        transform: null,
      });
    }
    const color: IAutoMovieColor =
      part.tissue === "bone"
        ? { r: 0.75, g: 0.7, b: 0.55, a: 1, hex: null }
        : part.tissue === "skeletal-muscle"
          ? { r: 0.55, g: 0.18, b: 0.18, a: 1, hex: null }
          : part.tissue === "adipose"
            ? { r: 0.85, g: 0.72, b: 0.32, a: 1, hex: null }
            : part.tissue === "fibroglandular"
              ? { r: 0.77, g: 0.55, b: 0.65, a: 1, hex: null }
              : { r: 0.65, g: 0.75, b: 0.82, a: 1, hex: null };
    output.materials.push({
      id: material,
      name: part.id + " source inspection finish",
      baseColor: color,
      roughness: 0.75,
      metallic: 0,
      opacity: 1,
      emissive: null,
      baseColorTexture: null,
      doubleSided: false,
    });
    input.observePartComplete?.(part.id, seen.size, sourceParts.length);
  }
  output.quantities = finalizeHumanBodySourceQuantities(
    output.quantities,
    sourceParts,
    output.parts,
  );
  return output;
}
