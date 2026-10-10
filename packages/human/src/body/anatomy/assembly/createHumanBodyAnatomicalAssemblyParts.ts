import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { isHumanBodyAtlasSourceRecorded } from "../atlas/isHumanBodyAtlasSourceRecorded";
import { createHumanBodyExteriorFollower } from "../binding/createHumanBodyExteriorFollower";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "./IAutoMovieHumanBodyAnatomicalAssembly";
import type { IHumanBodyAnatomicalAssemblyParts } from "./IHumanBodyAnatomicalAssemblyParts";
import type { IHumanBodyAnatomicalAssemblyPartsInput } from "./IHumanBodyAnatomicalAssemblyPartsInput";
import { carryHumanBodyNeutralSourceRig } from "./carryHumanBodyNeutralSourceRig";
import { carryHumanBodySourceFields } from "./carryHumanBodySourceFields";
import { createHumanBodySourceResidentMesh } from "./createHumanBodySourceResidentMesh";
import { dataSourceShapes } from "./dataSourceShapes";
import { finalizeHumanBodySourceQuantities } from "./finalizeHumanBodySourceQuantities";

/** Each assembly and consumer-owned neutral exterior has one compiled follower. */
const FOLLOWERS = new WeakMap<
  IAutoMovieHumanBodyAnatomicalAssembly,
  WeakMap<readonly number[], ReturnType<typeof createHumanBodyExteriorFollower>>
>();

function followerOf(
  assembly: IAutoMovieHumanBodyAnatomicalAssembly,
  neutral: readonly number[],
): ReturnType<typeof createHumanBodyExteriorFollower> {
  let exteriors = FOLLOWERS.get(assembly);
  if (exteriors === undefined) {
    exteriors = new WeakMap();
    FOLLOWERS.set(assembly, exteriors);
  }
  let follower = exteriors.get(neutral);
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
 * Offline four-slot anatomical weights preserve independent bone identities;
 * origin/insertion/support references must resolve in the same graph. Exact
 * source shape and basis registration are replay conditions. Actual surface
 * subdivisions retain separate source IDs, triangles and material ownership.
 * Linear blending is an authored coarse performer, not a clinical muscle
 * model, sliding-contact solver or tetrahedral solid certificate. The source
 * shape owner solves numerical targets on the evaluated rest fields before
 * this stage poses them.
 * An assembly that declares an exterior binding is no longer confined to its
 * registered shape: its stored rest positions first follow the rest skin's
 * displacement from the neutral skin, by that binding's rule, and are then
 * posed. An assembly without one still refuses any other shape.
 * A neutral whole-person consumer can supply its joined exterior reference;
 * all internal parts, held rest origins and shared attachment sites then
 * follow that one head/body displacement field.
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
  const assembly = input.basis.anatomicalAssembly;
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
  const neutral =
    input.exteriorRestReference?.neutral ?? input.basis.surfaces[0].positions;
  const restSkin = input.exteriorRestReference?.evaluated ?? input.restSkin;
  if (
    input.exteriorRestReference !== undefined &&
    assembly.mode !== "neutral-only"
  )
    throw new Error(
      "A joined exterior reference requires a held-neutral anatomical assembly.",
    );
  const registeredToNeutral = Object.values(assembly.shape).every(
    (weight) => weight === 0,
  );
  if (Object.values(assembly.shape).some((weight) => !Number.isFinite(weight)))
    throw new Error("Anatomical source assembly shape is not registered.");
  let shaped = false;
  if (registeredToNeutral) {
    if (restSkin.length !== neutral.length)
      throw new Error(
        "Anatomical source assembly is not registered to this basis's skin.",
      );
    for (let at = 0; at < neutral.length && !shaped; at++)
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
    const displacement = restSkin.map((value, at) => value - neutral[at]);
    const follower = followerOf(assembly, neutral);
    follow = (points) => follower(points, displacement);
  }
  // An absolute source target is solved after its baseline and linear field
  // enter the evaluated exterior. Warping a solved mesh afterwards would
  // change the quantity the caller requested.
  const sourceParts =
    follow === undefined
      ? assembly.parts
      : carryHumanBodySourceFields(assembly.parts, follow);
  const rig =
    follow !== undefined && assembly.mode === "neutral-only"
      ? carryHumanBodyNeutralSourceRig(input.rig, follow)
      : input.rig;
  output.rig = rig;
  const sourceShapes = dataSourceShapes(
    { parts: sourceParts },
    input.document.anatomy,
    input.observeQuantityComplete,
  );
  output.quantities = sourceShapes.readings;
  const seen = new Set<string>();
  for (const part of sourceParts) {
    const refuse = (reason: string): never => {
      throw new Error("Anatomical source part " + part.id + ": " + reason);
    };
    if (seen.has(part.id)) refuse("duplicate-anatomical-owner");
    seen.add(part.id);
    if (part.qualification.trim() === "" || part.surfaces.length === 0)
      refuse("source-qualification-or-geometry-unavailable");
    if (
      part.tissue === "skeletal-muscle" &&
      (!part.attachments.some((attachment) => attachment.role === "origin") ||
        !part.attachments.some((attachment) => attachment.role === "insertion"))
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
    const memberIds = new Set<string>();
    const material = "anatomical-source:" + part.id;
    for (const surface of part.surfaces) {
      if (surface.id.trim() === "" || memberIds.has(surface.id))
        refuse("source-member-identity-ambiguous");
      memberIds.add(surface.id);
      if (
        !isHumanBodyAtlasSourceRecorded(surface.source) ||
        !/^[a-fA-F0-9]{64}$/.test(surface.compiledMeshSha256)
      )
        refuse("source-provenance-or-rights-unrecorded:" + surface.id);
      const stored =
        sourceShapes.meshes.get(part.id)?.get(surface.id) ?? surface.mesh;
      const mesh = stored;
      const binding = surface.binding;
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
      const transforms = binding.bones.map((bone) => {
        const transform = rig.bones.get(bone);
        if (transform === undefined) refuse("source-bone-unavailable:" + bone);
        return {
          ...transform!,
          rotation: Quaternion.multiply(
            transform!.posed.rotation,
            Quaternion.inverse(transform!.rest.rotation),
          ),
        };
      });
      // Original binding rows remain source data, including bookkeeping
      // ordinals that no triangle references. Admit every row before selecting
      // resident geometry so malformed unused bindings cannot disappear.
      for (let vertex = 0; vertex < mesh.positions.length / 3; vertex++) {
        let sum = 0;
        for (let slot = 0; slot < 4; slot++) {
          const at = vertex * 4 + slot;
          const bone = binding.boneIndices[at],
            weight = binding.weights[at];
          if (
            !Number.isSafeInteger(bone) ||
            bone < 0 ||
            bone >= transforms.length ||
            !Number.isFinite(weight) ||
            weight < 0
          )
            refuse("invalid-source-weight:" + surface.id + "/" + vertex);
          sum += weight;
        }
        if (Math.abs(sum - 1) > 1e-8)
          refuse(
            "source-weights-do-not-sum-to-one:" + surface.id + "/" + vertex,
          );
        const sourceNormal = surface.mesh.normals!.slice(
          vertex * 3,
          vertex * 3 + 3,
        );
        if (
          !sourceNormal.every(Number.isFinite) ||
          !(Math.hypot(...sourceNormal) > 0)
        )
          refuse("source-direction-unavailable:" + surface.id + "/" + vertex);
      }
      const resident = createHumanBodySourceResidentMesh(
        mesh,
        sourceParts !== assembly.parts || stored !== surface.mesh,
      );
      const positions: number[] = [];
      const normals: number[] = [];
      for (let vertex = 0; vertex < resident.sourceVertices.length; vertex++) {
        const originalVertex = resident.sourceVertices[vertex];
        const offset = vertex * 3;
        const source: IAutoMovieVector3 = {
          x: resident.mesh.positions[offset],
          y: resident.mesh.positions[offset + 1],
          z: resident.mesh.positions[offset + 2],
        };
        const normal: IAutoMovieVector3 = {
          x: resident.mesh.normals![offset],
          y: resident.mesh.normals![offset + 1],
          z: resident.mesh.normals![offset + 2],
        };
        let point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        let direction: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        let sum = 0;
        for (let slot = 0; slot < 4; slot++) {
          const at = originalVertex * 4 + slot;
          const bone = binding.boneIndices[at];
          const weight = binding.weights[at];
          if (
            !Number.isSafeInteger(bone) ||
            bone < 0 ||
            bone >= transforms.length ||
            !Number.isFinite(weight) ||
            weight < 0
          )
            refuse(
              "invalid-source-weight:" + surface.id + "/" + originalVertex,
            );
          const transform = transforms[bone];
          const placed = Vector3.add(
            Quaternion.rotateVector(
              transform.rotation,
              Vector3.subtract(source, transform.rest.position),
            ),
            transform.posed.position,
          );
          point = Vector3.add(point, Vector3.scale(placed, weight));
          direction = Vector3.add(
            direction,
            Vector3.scale(
              Quaternion.rotateVector(transform.rotation, normal),
              weight,
            ),
          );
          sum += weight;
        }
        if (Math.abs(sum - 1) > 1e-8)
          refuse(
            "source-weights-do-not-sum-to-one:" +
              surface.id +
              "/" +
              originalVertex,
          );
        const length = Math.hypot(direction.x, direction.y, direction.z);
        if (
          !(length > 0) ||
          !Number.isFinite(length) ||
          !Object.values(point).every(Number.isFinite)
        )
          refuse(
            "source-deformation-nonfinite-or-cancelled:" +
              surface.id +
              "/" +
              originalVertex,
          );
        positions.push(point.x, point.y, point.z);
        normals.push(
          direction.x / length,
          direction.y / length,
          direction.z / length,
        );
      }
      output.parts.push({
        id: material + "/" + surface.id,
        name: part.id + " " + surface.id + " coarse " + part.tissue,
        geometry: {
          type: "mesh",
          mesh: { ...resident.mesh, positions, normals },
        },
        material,
        attachedBone: null,
        transform: null,
      });
    }
    const color =
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
