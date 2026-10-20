import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieNode,
  IAutoMoviePropArticulation,
  IAutoMoviePropSpec,
  IAutoMovieValidation,
} from "@automovie/interface";

import { profileSemanticKeys } from "../resolve/profileSemanticKeys";
import { ViolationCollector } from "../validation/ViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { validateModel } from "../validation/validateModel";
import { IAutoMovieForgedProp } from "./IAutoMovieForgedProp";

/** The builder-sealed ingest closure of an imported appearance. */
type IImportedClosure = NonNullable<IAutoMovieModel["imported"]>;

/** One sealed asset path and digest of an imported appearance. */
type IImportedAsset = IImportedClosure["assets"][number];

/** One sealed LOD level of an imported appearance. */
type IImportedLod = IImportedClosure["lod"][number];

/**
 * An articulation node with the index it was first declared at.
 */
interface IDeclaredNode {
  /** The first declaration of the node id. */
  node: IAutoMovieNode;

  /** Its index in `articulation.nodes`, for duplicate and cycle reports. */
  index: number;
}

/**
 * The FORGE consumer's object side: accept a prop an agent authored as data (crude primitive proxy, rich meaning: body, affordances, self-declared articulation, D011), returning the spec itself on success or every violation of the contracts below at once. {@link forgeCast} forges the performers; this forges the things they hold, open, and stack.
 *
 * The model contract: `node` is non-blank and `model.id` equals it (the staged scene joins on it, as for a forged cast member); `origin` is `"generated"` unless the spec names a `modelRef`, in which case the imported appearance is gated as below; and `skeleton` is `null`, because a riggable actor goes through `forgeCast` and a prop's moving parts are articulation nodes, not bones. `validateModel` covers parts, materials, extents, body (#595) and affordances (#604), with paths remapped onto `$input.model`.
 *
 * An imported appearance needs a non-blank `modelRef`, origin `"imported"`, a non-null `asset`, and a sealed closure: unique non-blank asset paths with `sha256:` digests of 64 lowercase hex digits, the rigid `gltf-static-v1` profile on the closure and every LOD with no humanoid bones, unique LOD levels whose asset and digest match the sealed ledger, and a `hero` LOD binding the model's own asset. Whether the reference resolves and the digests match bytes on disk is the builder's check, since the engine holds neither the registry nor the files.
 *
 * The articulation contract (when present): at least one joint; joint node ids unique and non-blank; parents resolving within the declared nodes (`null` is the prop's root) without a cycle; each joint's optional `mesh` naming a part of this prop's own model, and no part claimed by two joints; the binding targeting the declared profile; every `boneMap` value naming a declared node; and every semantic key the profile references ({@link profileSemanticKeys}) mapped. `bindProfile` would throw on the first missing key, so reporting all of them lets one correction round see the whole list, and a spec that passes binds without a throw.
 *
 * @evidence contracts/common.md#principled-implementation Collects findings through ViolationCollector, delegates model validation and checks anchored digest representation. Iterative path coloring resolves articulation parent chains once and memoizes their first repeated node, preserving one located diagnostic per cyclic chain without repeated ancestor walks or depth-dependent recursion.
 * @evidence contracts/common.md#clear-and-simple-design The exported gate reads as the model contract, with the imported appearance and the articulation each in one private helper writing into the same collector, because both are reached only through a prop spec and report under its paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never judges what an imported mesh depicts or guesses at registry and file contents it does not hold, and names no prop, part or profile; a malformed digest is reported once rather than again as a ledger mismatch, which is a reporting rule, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation States every model, imported-appearance and articulation rule, what is left to the builder and why, that all violations are returned together, and that success returns the spec itself.
 * @evidence contracts/performance.md#efficient-algorithms Indexes parts, sealed assets, LOD levels, articulation nodes and boneMap entries with maps/sets, plus validateModel and profileSemanticKeys costs and inspected text lengths. Iterative parent-chain coloring completes each unique node once in O(J) time and space, preserving authored diagnostic order without quadratic repeated walks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure gate over one prop spec that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing after return; success references the caller's spec, and failure owns a violation list bounded by a few violations per joint, asset, LOD level and mapped key plus the model's own.
 */
export function forgeProp(spec: IAutoMoviePropSpec): IAutoMovieForgedProp {
  const out: ViolationCollector = new ViolationCollector();

  if (spec.node.trim().length === 0)
    out.push(
      "type",
      "$input.node",
      "prop node must be a non-empty scene node id",
      spec.node,
    );
  if (spec.model.id !== spec.node)
    out.push(
      "type",
      "$input.model.id",
      `model id must equal the prop node "${spec.node}" (the staged scene joins on it), but was "${spec.model.id}"`,
      spec.model.id,
    );
  const modelRef: string | null = spec.modelRef ?? null;
  if (modelRef === null) {
    if (spec.model.origin !== "generated")
      out.push(
        "type",
        "$input.model.origin",
        `a forged prop's origin must be "generated", but was "${spec.model.origin}"`,
        spec.model.origin,
      );
  } else gateImportedAppearance(spec.model, modelRef, out);
  if (spec.model.skeleton !== null)
    out.push(
      "type",
      "$input.model.skeleton",
      "a prop must be skeleton-less, riggable actors go through forgeCast; moving parts are articulation nodes",
      spec.model.skeleton.id,
    );

  const validated: IAutoMovieValidation = validateModel({
    model: spec.model,
  });
  if (validated.success === false)
    for (const violation of validated.violations)
      out.items.push({
        ...violation,
        path: violation.path.replace("$input", "$input.model"),
      });

  if (spec.articulation !== null)
    gateArticulation(spec.articulation, spec.model, out);

  if (out.items.length > 0) return { success: false, violations: out.items };
  return { success: true, prop: spec };
}

/**
 * The escape hatch to an external asset, opened exactly as far as the record can be checked.
 *
 * A prop that names a registration is drawing somebody else's bytes, and the one thing that must not travel with them is meaning: the appearance is imported, while the volume the engine measures, the body it weighs, the affordances it rests things on and the articulation it drives all stay authored on this spec. So this gate never asks whether the mesh is a chair. It asks whether the reference is a reference at all, whether the media is the kind a prop can be, and whether the sealed closure is internally coherent, which is every question about imported bytes that can be settled without the bytes.
 *
 * The media test is `gltf-static-v1`, the same profile general instancing accepts, because the other two profiles are rigged humans: a skinned or VRM appearance is a performer, and a performer is `forgeCast`'s subject, not a thing that can be stacked on a table. `forgeProp` already refuses a prop carrying a skeleton for that reason; an imported humanoid whose skeleton lives in the file rather than the record would otherwise walk straight past it.
 *
 * Whether the reference resolves and whether each digest matches bytes on disk remain the builder's responsibility. The engine holds neither the production's model registry nor its files, while the builder holds both.
 */
function gateImportedAppearance(
  model: IAutoMovieModel,
  modelRef: string,
  out: ViolationCollector,
): void {
  const path: string = "$input.model";
  if (modelRef.trim().length === 0)
    out.push(
      "type",
      "$input.modelRef",
      "a prop's model reference must name a builder-owned model registration; an empty reference classifies nothing",
      modelRef,
    );
  if (model.origin !== "imported")
    out.push(
      "type",
      `${path}.origin`,
      `a prop citing modelRef "${modelRef}" draws imported bytes, so its origin must be "imported", but was "${model.origin}"`,
      model.origin,
    );
  if (model.asset === null)
    out.push(
      "type",
      `${path}.asset`,
      "an imported prop must name the binary payload its appearance is drawn from",
      model.asset,
    );

  const imported: IImportedClosure | undefined = model.imported;
  if (imported === undefined) {
    out.push(
      "type",
      `${path}.imported`,
      `modelRef "${modelRef}" carries no builder-sealed ingest closure, so the appearance references no bytes at all`,
      imported,
    );
    return;
  }

  const ledger: Map<string, string> = new Map();
  imported.assets.forEach((entry: IImportedAsset, index: number): void => {
    const ap: string = `${path}.imported.assets[${index}]`;
    const known: boolean = ledger.has(entry.path);
    if (entry.path.trim().length === 0)
      out.push(
        "type",
        `${ap}.path`,
        "a sealed asset path must be a non-empty project-relative path",
        entry.path,
      );
    else if (known)
      out.push(
        "type",
        `${ap}.path`,
        `sealed asset path "${entry.path}" is declared twice; one path carries one digest`,
        entry.path,
      );
    // The first entry wins, so a path sealed twice is reported once above
    // rather than turning every later reader of it into a second complaint.
    if (!known) ledger.set(entry.path, entry.digest);
    if (!SHA256_DIGEST_PATTERN.test(entry.digest))
      out.push(
        "type",
        `${ap}.digest`,
        `a sealed digest must be "sha256:" followed by 64 lowercase hexadecimal digits, but was "${entry.digest}"`,
        entry.digest,
      );
  });

  if (imported.profile !== "gltf-static-v1")
    out.push(
      "type",
      `${path}.imported.profile`,
      `a prop's imported appearance must be rigid "gltf-static-v1" geometry, but was "${imported.profile}": a humanoid appearance is a performer and goes through forgeCast`,
      imported.profile,
    );
  if (imported.humanoidBones.length > 0)
    out.push(
      "type",
      `${path}.imported.humanoidBones`,
      `a rigid prop's appearance maps no humanoid bones, but ${imported.humanoidBones.length} were sealed`,
      imported.humanoidBones.length,
    );

  const levels: Set<string> = new Set();
  imported.lod.forEach((entry: IImportedLod, index: number): void => {
    const lp: string = `${path}.imported.lod[${index}]`;
    if (levels.has(entry.level))
      out.push(
        "type",
        `${lp}.level`,
        `LOD level "${entry.level}" is declared twice; one level is one set of bytes`,
        entry.level,
      );
    levels.add(entry.level);
    if (entry.profile !== imported.profile)
      out.push(
        "type",
        `${lp}.profile`,
        `LOD "${entry.level}" was ingested as "${entry.profile}" while the appearance is "${imported.profile}"; every level of one appearance shares its profile`,
        entry.profile,
      );
    if (entry.humanoidBones.length > 0)
      out.push(
        "type",
        `${lp}.humanoidBones`,
        `a rigid prop's LOD "${entry.level}" maps no humanoid bones, but ${entry.humanoidBones.length} were sealed`,
        entry.humanoidBones.length,
      );
    const wellFormed: boolean = SHA256_DIGEST_PATTERN.test(entry.digest);
    if (!wellFormed)
      out.push(
        "type",
        `${lp}.digest`,
        `a sealed digest must be "sha256:" followed by 64 lowercase hexadecimal digits, but was "${entry.digest}"`,
        entry.digest,
      );
    const sealed: string | undefined = ledger.get(entry.asset);
    if (sealed === undefined)
      out.push(
        "type",
        `${lp}.asset`,
        `LOD "${entry.level}" binds "${entry.asset}", which the sealed byte ledger does not cover`,
        entry.asset,
      );
    // A malformed digest is already reported, and comparing it against the
    // ledger would answer for that same fault a second time under another name.
    else if (wellFormed && sealed !== entry.digest)
      out.push(
        "type",
        `${lp}.digest`,
        `LOD "${entry.level}" reads "${entry.asset}" at ${entry.digest} while the sealed ledger carries ${sealed} for that path; one path is one set of bytes`,
        entry.digest,
      );
  });

  const hero: IImportedLod | undefined = imported.lod.find(
    (entry: IImportedLod): boolean => entry.level === "hero",
  );
  if (hero === undefined)
    out.push(
      "type",
      `${path}.imported.lod`,
      "an imported appearance needs a hero LOD: the level the prop's own asset binds",
      imported.lod.map((entry: IImportedLod): string => entry.level),
    );
  else if (model.asset !== null && hero.asset !== model.asset)
    out.push(
      "type",
      `${path}.imported.lod`,
      `the hero LOD binds "${hero.asset}" while the prop draws "${model.asset}"; one appearance is one set of bytes`,
      hero.asset,
    );
}

/**
 * Gate the prop's declared joints, and what each of them carries.
 *
 * The model is here for the `mesh` payload. An articulation node is an {@link IAutoMovieNode}, so it can name the piece of the prop that rides it, and that reference is the whole of how a declared joint becomes a part that visibly moves: without it a hinge turns an empty frame while the leaf stands still, which is a shot that validates clean and shows nothing. The reference resolves inside this prop's own model, because a prop's moving part is a part of the prop; two joints may not claim the same part, since a part rides one frame.
 */
function gateArticulation(
  articulation: IAutoMoviePropArticulation,
  model: IAutoMovieModel,
  out: ViolationCollector,
): void {
  const path: string = "$input.articulation";
  const parts: Set<string> = new Set(
    model.parts.map((part: IAutoMovieModelPart): string => part.id),
  );
  const claimed: Map<string, number> = new Map();
  articulation.nodes.forEach((node: IAutoMovieNode, i: number): void => {
    if (node.mesh === null) return;
    const np: string = `${path}.nodes[${i}].mesh`;
    if (!parts.has(node.mesh)) {
      out.push(
        "type",
        np,
        `articulation node "${node.id}" drives mesh "${node.mesh}", which is not a part of this prop's model`,
        node.mesh,
      );
      return;
    }
    const first: number | undefined = claimed.get(node.mesh);
    if (first !== undefined)
      out.push(
        "type",
        np,
        `part "${node.mesh}" is already driven by ${path}.nodes[${first}]; a part rides one joint`,
        node.mesh,
      );
    else claimed.set(node.mesh, i);
  });
  if (articulation.nodes.length === 0)
    out.push(
      "type",
      `${path}.nodes`,
      "an articulation needs at least one joint node",
      articulation.nodes,
    );

  const byId: Map<string, IDeclaredNode> = new Map();
  articulation.nodes.forEach((node: IAutoMovieNode, i: number): void => {
    const np: string = `${path}.nodes[${i}]`;
    if (node.id.trim().length === 0)
      out.push(
        "type",
        `${np}.id`,
        "articulation node id must be non-empty",
        node.id,
      );
    const existing: IDeclaredNode | undefined = byId.get(node.id);
    if (existing !== undefined) {
      out.push(
        "type",
        `${np}.id`,
        `articulation node id "${node.id}" is duplicated; first declared at ${path}.nodes[${existing.index}].id`,
        node.id,
      );
      return;
    }
    byId.set(node.id, { node, index: i });
  });

  articulation.nodes.forEach((node: IAutoMovieNode, i: number): void => {
    if (node.parent !== null && !byId.has(node.parent))
      out.push(
        "type",
        `${path}.nodes[${i}].parent`,
        `parent "${node.parent}" is not a declared articulation node`,
        node.parent,
      );
  });
  const completed: Set<string> = new Set();
  const cycleAt: Map<string, string> = new Map();
  for (const id of byId.keys()) {
    if (completed.has(id)) continue;
    const trail: string[] = [];
    const active: Map<string, number> = new Map();
    let cursor: string | null = id;
    while (
      cursor !== null &&
      byId.has(cursor) &&
      !completed.has(cursor) &&
      !active.has(cursor)
    ) {
      active.set(cursor, trail.length);
      trail.push(cursor);
      cursor = byId.get(cursor)!.node.parent;
    }
    const cycleStart: number | undefined =
      cursor === null ? undefined : active.get(cursor);
    const repeated: string | undefined =
      cursor === null
        ? undefined
        : cycleStart === undefined
          ? cycleAt.get(cursor)
          : cursor;
    trail.forEach((node: string, index: number): void => {
      if (repeated !== undefined)
        cycleAt.set(
          node,
          cycleStart !== undefined && index >= cycleStart ? node : repeated,
        );
      completed.add(node);
    });
  }
  for (const [id, entry] of byId) {
    const repeated: string | undefined = cycleAt.get(id);
    if (repeated !== undefined)
      out.push(
        "type",
        `${path}.nodes[${entry.index}].parent`,
        `articulation parent chain of "${id}" is cyclic at "${repeated}"`,
        repeated,
      );
  }

  const profile: IAutoMoviePropArticulation["profile"] = articulation.profile;
  const binding: IAutoMoviePropArticulation["binding"] = articulation.binding;
  if (binding.profile !== profile.id)
    out.push(
      "type",
      `${path}.binding.profile`,
      `binding targets profile "${binding.profile}" but the declared profile is "${profile.id}"`,
      binding.profile,
    );

  for (const [key, mapped] of Object.entries(binding.boneMap)) {
    const bp: string = `${path}.binding.boneMap["${key}"]`;
    if (mapped.trim().length === 0) {
      out.push("type", bp, `boneMap maps "${key}" to an empty node id`, mapped);
      continue;
    }
    if (!byId.has(mapped))
      out.push(
        "type",
        bp,
        `boneMap maps "${key}" to "${mapped}", which is not a declared articulation node`,
        mapped,
      );
  }

  for (const key of profileSemanticKeys(profile))
    if (
      !Object.hasOwn(binding.boneMap, key) ||
      binding.boneMap[key] === undefined
    )
      out.push(
        "type",
        `${path}.binding.boneMap`,
        `profile "${profile.id}" references "${key}" but the binding does not map it`,
        key,
      );
}
