import {
  IAutoMovieCastMember,
  IAutoMovieForgeEntry,
  IAutoMovieForgePlan,
  IAutoMovieModel,
  IAutoMovieScript,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { validateModel } from "../validation/validateModel";
import { IAutoMovieForgedCast } from "./IAutoMovieForgedCast";

/**
 * A cast member with the index it was first declared at.
 *
 * @author Samchon
 */
interface IDeclaredMember {
  /** The script's first declaration of the node. */
  member: IAutoMovieCastMember;

  /** Its index in `script.cast`, for duplicate reports. */
  index: number;
}

/**
 * The FORGE consumer: accept the stand-in rigs the forge stage built for the script's `modelRef: null` cast members, keyed by cast node, or every violation of the two contracts below at once.
 *
 * The casting contract: script cast nodes are unique, and there is exactly one entry per stand-in cast member (a missing rig is an actor with no body; a rig for an imported-`modelRef` member or for a stranger contradicts the script). Each entry's model `id` must equal its cast `node`, the join the staged scene's `modelRef ?? node` fallback resolves against, and its `origin` must be `"generated"`.
 *
 * The rig contract: `validateModel` covers parts, materials, extents and the skeleton graph, with its violations remapped from `$input` onto the entry's `$input.entries[i].model` path. Forge adds only the performer rule that a stand-in must have a skeleton; boneless models are props for {@link forgeProp}. The returned models are the entries' own objects, not copies. The result dictionary has no prototype, so every accepted literal node id, including __proto__, is an own entry.
 *
 * @evidence contracts/common.md#principled-implementation Joins entries to the script by cast node through a first-declaration map, collects every violation with `ViolationCollector` instead of stopping at the first, and delegates rig validity to `validateModel`, whose `$input`-rooted paths are rewritten by replacing their leading `$input` once.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the casting rules and the skeleton requirement; model geometry and skeleton graph rules stay in `validateModel`, so cast forging and prop forging share one model validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no node, rig or archetype; an imported member offered a stand-in, a duplicate or a stranger is refused rather than silently ignored or overwritten.
 * @evidence contracts/common.md#meaningful-documentation States both contracts with the id join and its reason, the origin and skeleton rules, how model violations are re-pathed, that all violations are returned together, and that returned models are not copied.
 * @evidence contracts/performance.md#efficient-algorithms Linear in cast members plus entries, with each entry's `validateModel` call dominating in proportion to that model's parts and bones; node lookups are map and set hits rather than scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure gate over one script and plan that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing after return; the result references the caller's model objects and owns its violation list, bounded by a few violations per entry and member plus each model's own.
 */
export function forgeCast(
  script: IAutoMovieScript,
  forge: IAutoMovieForgePlan,
): IAutoMovieForgedCast {
  const out: ViolationCollector = new ViolationCollector();
  const cast: Map<string, IDeclaredMember> = new Map();
  script.cast.forEach((member: IAutoMovieCastMember, index: number): void => {
    const existing: IDeclaredMember | undefined = cast.get(member.node);
    if (existing !== undefined) {
      out.push(
        "type",
        `$script.cast[${index}].node`,
        `script cast node "${member.node}" is duplicated; first declared at $script.cast[${existing.index}].node`,
        member.node,
      );
      return;
    }
    cast.set(member.node, { member, index });
  });

  const seen: Set<string> = new Set();
  forge.entries.forEach((entry: IAutoMovieForgeEntry, i: number): void => {
    const ep: string = `$input.entries[${i}]`;
    const found: IDeclaredMember | undefined = cast.get(entry.node);
    if (found === undefined) {
      out.push(
        "type",
        `${ep}.node`,
        `entry must name a script cast node, but "${entry.node}" is not in the cast`,
        entry.node,
      );
      return;
    }
    const member: IAutoMovieCastMember = found.member;
    if (member.modelRef !== null)
      out.push(
        "type",
        `${ep}.node`,
        `cast node "${entry.node}" already has modelRef "${member.modelRef}" (an imported asset) and must not be forged`,
        entry.node,
      );
    if (seen.has(entry.node))
      out.push(
        "type",
        `${ep}.node`,
        `cast node "${entry.node}" is forged more than once`,
        entry.node,
      );
    seen.add(entry.node);

    if (entry.model.id !== entry.node)
      out.push(
        "type",
        `${ep}.model.id`,
        `model id must equal the cast node "${entry.node}" (the staged scene joins on it), but was "${entry.model.id}"`,
        entry.model.id,
      );
    if (entry.model.origin !== "generated")
      out.push(
        "type",
        `${ep}.model.origin`,
        `a forged stand-in's origin must be "generated", but was "${entry.model.origin}"`,
        entry.model.origin,
      );

    if (entry.model.skeleton === null)
      out.push(
        "type",
        `${ep}.model.skeleton`,
        "a stand-in performer needs a skeleton: a boneless model cannot be posed",
        entry.model.skeleton,
      );

    const validated: IAutoMovieValidation = validateModel({
      model: entry.model,
    });
    if (validated.success === false)
      for (const violation of validated.violations)
        out.items.push({
          ...violation,
          path: violation.path.replace("$input", `${ep}.model`),
        });
  });

  script.cast.forEach((member: IAutoMovieCastMember, i: number): void => {
    if (member.modelRef === null && !seen.has(member.node))
      out.push(
        "type",
        "$input.entries",
        `cast node "${member.node}" (cast[${i}]) has no modelRef and must be forged`,
        member.node,
      );
  });

  if (out.items.length > 0) return { success: false, violations: out.items };

  const models: Record<string, IAutoMovieModel> = Object.create(null);
  for (const entry of forge.entries) models[entry.node] = entry.model;
  return { success: true, models };
}
