import { realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionDiagnostic,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSharedLoop,
  IAutoMovieConstructionSplit,
  IAutoMovieHumanBodyTree,
  IAutoMovieHumanMassSource,
  IAutoMovieHumanNamedSource,
  IAutoMovieHumanSourceRealization,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanConstructionView } from "./limb/AutoMovieHumanConstructionView";
import { AutoMovieHumanMassSource } from "./limb/AutoMovieHumanMassSource";

/**
 * The body's construction tree (#3044, construction step 2; #3047 to #3051) and
 * its realization by the engine (`realizeAutoMovieConstruction`): every part a
 * view node, every fold a merge join whose trace starts at a search seed and
 * whose blend is a rolling fold of the caller's radius, the host always the
 * whole subtree built so far, so a part merges onto the faces its hosts already
 * share. The engine traces, blends and trims; this module requests its
 * operator/boundary records without an unused final skin. Human's surface
 * consumer draws the published body with its own attributes.
 *
 * Publication: the realized body of trimmed faces as the engine published it
 * (`IAutoMovieHumanBodyCalibration.bodies`), its faces the parts' chains and
 * the joins' blend chains, every shared boundary one set of points. A join's
 * curve may cross from the face its seed named onto a neighbouring host face (a
 * leg's fold onto a gluteal mass's blend); the body keeps those crossings,
 * which a per-join merge record on one host face cannot.
 */
export namespace AutoMovieHumanBodyTree {
  /**
   * A fold's join node on a host subtree.
   *
   * @param host The subtree built so far.
   * @param fold The joined subtree and its fold.
   * @param limits The trace limits.
   * @returns The join node, metres.
   */
  export function join(
    host: IAutoMovieConstructionNode,
    fold: IAutoMovieHumanBodyTree.IFold,
    limits: IAutoMovieHumanBodyTree.ILimits,
  ): IAutoMovieConstructionJoin {
    const M: number = AutoMovieHumanConstructionView.METRES;
    const width: IAutoMovieConstructionJoin["partWidth"] = {
      type: "fold",
      radius: fold.radius * M,
      cap: fold.cap * M,
    };
    return {
      type: "join",
      kind: "merge",
      name: `blend.${fold.partFace}.${fold.hostFace}`,
      host,
      part: fold.part,
      seed:
        fold.sourceSeed === undefined
          ? {
              type: "search",
              partFace: fold.partFace,
              hostFace: fold.hostFace,
              phase: fold.search.phase,
              from: fold.search.from,
              to: fold.search.to,
            }
          : {
              type: "point",
              partFace: fold.partFace,
              hostFace: fold.sourceSeed.owner,
              part: [fold.sourceSeed.part[0] * M, fold.sourceSeed.part[1]],
              host: [fold.sourceSeed.host[0] * M, fold.sourceSeed.host[1]],
            },
      parameter: { type: "phase" },
      partWidth: width,
      hostWidth: width,
      continuity: "G2",
      count: limits.count,
      rows: Math.max(1, Math.ceil((2 * fold.cap) / limits.gap)),
      tolerance: limits.tolerance * M,
      grazing: limits.grazing,
    };
  }

  /**
   * Resolve a declared mass fold only when assembling its actual tree.
   *
   * @evidence contracts/common.md#principled-implementation Reads the same final original and consumed parent, and passes its actual exit charts to the existing point-seed join.
   * @evidence contracts/common.md#clear-and-simple-design Original/tape preparation stays independent of an explicitly requested assembly seed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed seed is a named fold diagnostic without search fallback, source displacement or fake kept-face success.
   * @evidence contracts/common.md#meaningful-documentation The raw parent supplies a seed candidate; the engine validates the final kept atlas and loop.
   * @evidence contracts/performance.md#efficient-algorithms Performs one bounded source seed solve only for an assembly or explicit seed observer, never a lone original request.
   * @evidence contracts/performance.md#reuse-equivalent-work Borrows the actual final original/connection instead of making another parent or mass.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a call-owned fold record; diagnostics belong to its caller and no cache is added.
   */
  export function massFold(
    fold: IAutoMovieHumanBodyTree.IFold,
    sources: readonly IAutoMovieHumanNamedSource[],
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
  ): IAutoMovieHumanBodyTree.IFold | null {
    const source: IAutoMovieHumanSourceRealization | undefined = sources
      .filter(
        (source: IAutoMovieHumanNamedSource): boolean =>
          source.name === fold.partFace,
      )
      .at(-1)?.result;
    let detail: string;
    try {
      if (
        source?.part === undefined ||
        source.part === null ||
        source.massConnection === undefined
      )
        detail =
          "The actual mass original or its consumed parent connection is unavailable";
      else {
        const seed: IAutoMovieHumanMassSource.ISeed | string =
          AutoMovieHumanMassSource.seed(source.part, source.massConnection);
        if (typeof seed !== "string")
          return { ...fold, hostFace: seed.owner, sourceSeed: seed };
        detail = seed;
      }
    } catch (error: unknown) {
      detail = error instanceof Error ? error.message : String(error);
    }
    diagnostics.push({
      producer: `fold.${fold.partFace}`,
      level: 3,
      contract: "parent source seed",
      detail,
    });
    return null;
  }

  /**
   * Bind every original leaf to its identical invocation-owned millimetre
   * source. Unchanged source subtrees retain identity, including the head. A
   * missing original is a named premise failure, never a sampled fallback.
   */
  export function sources(
    root: IAutoMovieConstructionNode | null,
    parts: ReadonlyMap<string, IAutoMovieViewPart>,
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
  ): IAutoMovieConstructionNode | null {
    if (root === null) return null;
    try {
      return sourceNode(root, parts);
    } catch (error: unknown) {
      diagnostics.push({
        producer: "lane.sources",
        level: 2,
        contract: "original context",
        detail: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Retain only each builder's last actual original, including failed
   * replacements.
   */
  export function context(
    head: ReadonlyMap<string, IAutoMovieViewPart> | undefined,
    records: IAutoMovieHumanBodyTree.ContextRecords,
  ): ReadonlyMap<string, IAutoMovieViewPart> {
    const parts: Map<string, IAutoMovieViewPart> = new Map(head);
    for (const record of records)
      if (record.result.part === null) parts.delete(record.name);
      else parts.set(record.name, record.result.part);
    return parts;
  }

  /**
   * Resolve the original leaves without changing unchanged operator or head
   * subtree identities.
   */
  function sourceNode(
    root: IAutoMovieConstructionNode,
    parts: ReadonlyMap<string, IAutoMovieViewPart>,
  ): IAutoMovieConstructionNode {
    // Profiles resolve their own original functions through the engine's
    // separate profiles context; they are not native view declarations.
    if (root.type === "profile") return root;
    if (root.type === "source") {
      if (!parts.has(root.source))
        throw new Error(
          `Construction source ${root.name} has no original owner ${root.source}`,
        );
      return root;
    }
    if (root.type === "view") {
      if (!parts.has(root.name))
        throw new Error(`Construction view ${root.name} has no original owner`);
      return { type: "source", name: root.name, source: root.name };
    }
    const host: IAutoMovieConstructionNode = sourceNode(root.host, parts);
    if (root.type === "trim")
      return host === root.host ? root : { ...root, host };
    // Every child keeps its declared order and its identity when unchanged.
    if (root.type === "split") {
      const resolve = (
        child: IAutoMovieConstructionSplit.IChild,
      ): IAutoMovieConstructionSplit.IChild => {
        const part: IAutoMovieConstructionNode = sourceNode(child.part, parts);
        return part === child.part ? child : { ...child, part };
      };
      const [first, second, ...rest]: IAutoMovieConstructionSplit["children"] =
        root.children;
      const children: IAutoMovieConstructionSplit["children"] = [
        resolve(first),
        resolve(second),
        ...rest.map(resolve),
      ];
      return host === root.host &&
        children.every(
          (child, index): boolean => child === root.children[index],
        )
        ? root
        : { ...root, host, children };
    }
    const part: IAutoMovieConstructionNode = sourceNode(root.part, parts);
    return host === root.host && part === root.part
      ? root
      : { ...root, host, part };
  }

  /**
   * Realize a subtree's operators and publish its shared boundaries without
   * drawing an unused engine skin.
   *
   * @param name The construction's name.
   * @param root The subtree.
   * @param limits The trace limits and the skin's chord.
   * @param diagnostics Where every premise the tree could not keep is recorded.
   * @returns The chains and the realized body.
   * @evidence contracts/common.md#principled-implementation Uses the same engine construction walk and retained blend chains/body boundaries; only the unused final engine skin is not requested.
   * @evidence contracts/common.md#clear-and-simple-design One literal skin:false call supplies the existing chains/body output, with no second construction owner or new cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves every operator diagnostic and its existing producer/level mapping; null engine skin is not a completed-skin or valid-figure certificate.
   * @evidence contracts/common.md#meaningful-documentation States the unskinned request, unchanged millimetre publication and Human's later skin ownership; the positive chord still controls engine preparation and trim solving.
   * @evidence contracts/performance.md#efficient-algorithms Keeps the original loft/join/trim work and boundary copying while avoiding the discarded engine face/fan mesh and metre copies; the Human skin is still generated by its existing consumer, and no measured saving is claimed.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the same realized view/blend chain records and published boundary points that Human's final surface reads, rather than reconstructing them from an unused skin.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned calibration owns chains and boundary data; the temporary realization and unused surface/join-list wrappers release after this call, with no added mesh population, cache or task handle.
   */
  export function realize(
    name: string,
    root: IAutoMovieConstructionNode,
    limits: IAutoMovieHumanBodyTree.ILimits,
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
    sources?: ReadonlyMap<string, IAutoMovieViewPart>,
    loopSources?: ReadonlyMap<string, IAutoMovieConstructionSharedLoop.ISource>,
  ): IAutoMovieHumanBodyTree.IOutput {
    const result: IAutoMovieConstructionRealization.IWithoutSkin =
      realizeAutoMovieConstruction(
        { name, root },
        {
          chord: limits.gap * AutoMovieHumanConstructionView.METRES,
          skin: false,
          sources,
          loopSources,
        },
      );
    diagnostics.push(
      ...result.diagnostics.map(
        (
          d: IAutoMovieConstructionDiagnostic,
        ): IAutoMovieLoftContract.IDiagnostic => ({
          producer: `tree.${d.node}`,
          level: 3,
          contract: d.contract,
          detail: d.detail,
        }),
      ),
    );
    // Each join's blend as the realization built it, named as its node, a
    // face of the realized body beside the parts' faces.
    return {
      chains: [
        ...result.chains,
        ...result.joins.map(
          (j: IAutoMovieConstructionRealization.IJoin): IAutoMovieLoftChain =>
            j.blend.chain,
        ),
      ],
      body: result.body,
    };
  }
}
