import type {
  AutoMovieConstructionNode,
  IAutoMovieConstruction,
  IAutoMovieConstructionContinuation,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionSource,
  IAutoMovieConstructionTrim,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import { AutoMovieConstructionAdmission } from "./AutoMovieConstructionAdmission";
import { AutoMovieConstructionContinuationRealize } from "./AutoMovieConstructionContinuationRealize";
import { AutoMovieConstructionPortRealize } from "./AutoMovieConstructionPortRealize";
import { AutoMovieConstructionProfileRealize } from "./AutoMovieConstructionProfileRealize";
import { AutoMovieConstructionProfileSkin } from "./AutoMovieConstructionProfileSkin";
import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";
import { AutoMovieConstructionSeeds } from "./AutoMovieConstructionSeeds";
import { AutoMovieConstructionSkin } from "./AutoMovieConstructionSkin";
import { AutoMovieConstructionSplitRealize } from "./AutoMovieConstructionSplitRealize";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieConstructionWidths } from "./AutoMovieConstructionWidths";
import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieLoftStations } from "./AutoMovieLoftStations";
import { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidTrim } from "./AutoMovieSolidTrim";
import { AutoMovieViewLoft } from "./AutoMovieViewLoft";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Realize operator and boundary records with no final skin when explicitly requested. */
export function realizeAutoMovieConstruction(
  construction: IAutoMovieConstruction,
  props: AutoMovieConstructionRealization.IProps & {
    /** Omit only the final skin. */
    skin: false;
  },
): AutoMovieConstructionRealization.IWithoutSkin;

/** Realize the normal required mesh when the skin request is omitted or true. */
export function realizeAutoMovieConstruction(
  construction: IAutoMovieConstruction,
  props: AutoMovieConstructionRealization.IProps & {
    /** Draw the final skin, also the default when omitted. */
    skin?: true;
  },
): AutoMovieConstructionRealization.IRealization;

/** A runtime boolean request returns either result; callers must distinguish mesh from null. */
export function realizeAutoMovieConstruction(
  construction: IAutoMovieConstruction,
  props: AutoMovieConstructionRealization.IProps,
):
  | AutoMovieConstructionRealization.IRealization
  | AutoMovieConstructionRealization.IWithoutSkin;

/**
 * Realize a construction tree: loft declared views or explicit complete sources, apply joins, continuation, splits (`AutoMovieConstructionSplitRealize`: an open end split into two children's bands, published with the chains) and trims in containment order, and draw the body of trimmed faces as one skin sharing every boundary.
 *
 * An original profile node resolves its complete declaration and actual functions from the call-owned profiles map; its qualified family/piece faces retain their source atlas and shared boundaries without a sampled chain. Only actual collapsed loop ends receive source Point0 fans. A node whose premise breaks is left out with its diagnostic: a view part's broken station leaves that station out, a join or a continuation that cannot keep its premises leaves its part's whole subtree out and its host standing as it was, and a trim that cannot keep its premises leaves its face uncut, so every admitted tree realizes. Admission runs before any work and refuses the whole call by throwing: a chord tolerance that is not positive, a node outside the closed union, a name used twice, or a seed, continuation or trim naming a face that is not a view part (or, where a blend may serve, a join) of the right subtree. A trim's feet are solved to a thousandth of the chord tolerance. A face's open end closes on its pole by a fan; an end with neither a pole nor a shared ring stays open.
 *
 * @evidence contracts/development/implementation.md#principled-implementation One recursive walk applies the operators the tree names in the tree's own containment order, and each operator is the kernel's (view loft, intersection trace, rails, blend, trim, body, zip), so the realization adds no geometry of its own; a broken node is rolled back to the state before its part was built, which is what leaving it out means.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk serves both skin requests; overloads preserve a required default mesh, explicit false narrows to null, and a runtime boolean returns their union.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source leaves use the invocation's actual millimetre definitions, not a sampled declaration, cached loft or global name registry. Missing/mismatched sources and exceptions while initially preparing their loft and station grid are source diagnostics before face publication; later retained-callback exceptions retain the existing operator exception policy. Broken joins use their existing subtree rollback without relaxed tolerances or replacement primitives.
 * @evidence contracts/development/common.md#meaningful-documentation States walk/rollback/admission, units, source context lifetime and default-on skin. Skin false omits final draw/fans/metre copying, not operator or boundary work, and certifies no final skin.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each source leaf adds one context lookup before loft work. Existing adaptive Point0 bisection covers the actually owned domain, including retained caps, and removes only exact collapsed tip rows before ordinary grids/fans. Skin false avoids final O(V+T+F) copying and tessellation/fans; source/grid costs remain.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A face's actual source is resolved and lofted once, and its resulting surface is shared by joins, trims and skin; different invocations never select geometry through past registration.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call borrows its lookup map. Returned chains/surfaces retain actual generating dependencies, kept immutable for their readers' lifetime; callbacks may retain their own transitive context. No global map/cache/handle is added, and body grids/boundaries/snapshots keep their existing lifetimes.
 * @param construction The tree, metres and radians.
 * @param props Positive metre chord tolerance, default-on skin and optional immutable evaluated millimetre sources for explicit leaves.
 * @returns The realization.
 */
export function realizeAutoMovieConstruction(
  construction: IAutoMovieConstruction,
  props: AutoMovieConstructionRealization.IProps,
):
  | AutoMovieConstructionRealization.IRealization
  | AutoMovieConstructionRealization.IWithoutSkin {
  if (!(props.chord > 0))
    throw new Error(
      `realizeAutoMovieConstruction: chord ${props.chord} m is not positive`,
    );
  AutoMovieConstructionAdmission.admit(construction.root);

  /** The call's request, read once without changing construction admission. */
  const withSkin: boolean = props.skin !== false;
  const S: number = AutoMovieConstructionViews.SCALE;
  const chord: number = props.chord * S;
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    construction.name,
    [],
  );
  const state: AutoMovieConstructionState.IState = {
    faces: new Map(),
    chains: new Map(),
    chainList: [],
    chainSurfaces: [],
    blendSurfaces: [],
    joins: [],
    trims: [],
    diagnostics: [],
    overrides: new Map(),
  };
  /** Append a named premise without altering previously retained diagnostics. */
  function report(node: string, contract: string, detail: string): void {
    state.diagnostics.push({ node, contract, detail });
  }

  /** Preserve each operator diagnostic's order under its construction node. */
  function absorb(
    node: string,
    list: readonly AutoMovieLoftContract.IDiagnostic[],
  ): void {
    for (const d of list) report(node, d.contract, d.detail);
  }

  /** Resolve each leaf once, then loft the actual definition before publishing any face. */
  function view(
    node: IAutoMovieConstructionView | IAutoMovieConstructionSource,
  ): void {
    try {
      const part: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(
        node,
        props.sources,
      );
      if (typeof part === "string")
        return report(
          node.name,
          node.type === "source" ? "source" : "axis",
          part,
        );
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
      absorb(node.name, loft.diagnostics);
      if (loft.chain === null) return;
      let chain: IAutoMovieLoftChain = loft.chain;
      const override: AutoMovieConstructionState.IOverride | undefined =
        state.overrides.get(node.name);
      if (override !== undefined) {
        const replaced: IAutoMovieLoftChain | string = override.apply(chain);
        if (typeof replaced === "string") override.error = replaced;
        else {
          chain = replaced;
          override.applied = true;
        }
      }
      const surface: IAutoMovieSolidSurface | null =
        override?.applied === true
          ? AutoMovieSolidChain.surface(chain)
          : loft.surface;
      if (surface === null)
        return report(
          node.name,
          "surface",
          "the lofted chain carries no jets or its middle section is degenerate",
        );
      const [first, last]: [number, number] = surface.domain ?? [
        chain.layers[0]!.y,
        chain.layers[chain.layers.length - 1]!.y,
      ];
      const tips: number[] = [chain.pole, chain.opposite].flatMap(
        (pole: IAutoMovieLoftChain["pole"]): number[] =>
          pole?.source === undefined ? [] : [pole.source.station],
      );
      const index: number =
        body.faces.push({
          surface,
          stations: AutoMovieLoftStations.bisect(
            chain,
            first,
            last,
            chord,
          ).filter((station: number): boolean => !tips.includes(station)),
          // The chain's own ring phases: declared (`IAutoMovieLoftChain.phases`), or uniform.
          phases:
            chain.phases !== undefined
              ? [...chain.phases]
              : Array.from(
                  { length: chain.samples },
                  (_: unknown, k: number): number =>
                    (2 * Math.PI * k) / chain.samples,
                ),
          cycles: [],
        }) - 1;
      state.faces.set(node.name, index);
      state.chains.set(node.name, chain);
      state.chainList.push(chain);
      state.chainSurfaces.push(surface);
    } catch (error: unknown) {
      if (node.type !== "source") throw error;
      return report(
        node.name,
        "source",
        `evaluated source ${node.source} failed while preparing its face: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Realize the part transactionally against the host already retained by this node. */
  function join(node: IAutoMovieConstructionJoin): void {
    walk(node.host);
    const snapshot: AutoMovieConstructionState.ISnapshot =
      AutoMovieConstructionState.snap(body, state);
    walk(node.part);
    /** Restore the same host checkpoint when this join cannot be retained. */
    function fail(contract: string, detail: string): void {
      report(node.name, contract, detail);
      AutoMovieConstructionState.restore(body, state, snapshot);
    }
    const partIndex: number | undefined = state.faces.get(node.seed.partFace);
    const hostIndex: number | undefined = state.faces.get(node.seed.hostFace);
    if (partIndex === undefined || partIndex < snapshot.faces)
      return fail(
        "seed face",
        `the part face ${node.seed.partFace} was not realized`,
      );
    if (hostIndex === undefined || hostIndex >= snapshot.faces)
      return fail(
        "seed face",
        `the host face ${node.seed.hostFace} was not realized`,
      );
    const partSurface: IAutoMovieSolidSurface = body.faces[partIndex]!.surface;
    const { atlas, index }: { atlas: IAutoMovieSolidAtlas; index: number[] } =
      AutoMovieSolidBody.atlas(body, partIndex);
    const face: number = index.indexOf(hostIndex);
    const tolerance: number = node.tolerance * S;
    const layers: number[] = state.chains
      .get(node.seed.partFace)!
      .layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y);
    const seed: AutoMovieSolidIntersection.IInput["seed"] | string =
      AutoMovieConstructionSeeds.create(
        node.seed,
        partSurface,
        layers,
        atlas.faces[face]!,
        face,
        tolerance,
      );
    if (typeof seed === "string") return fail("seed", seed);
    const parameter: AutoMovieSolidIntersection.Parameter =
      AutoMovieConstructionViews.parameter(node.parameter);
    let traced: AutoMovieConstructionWidths.ITraced | null = null;
    if (
      AutoMovieConstructionWidths.traced(node.partWidth) ||
      AutoMovieConstructionWidths.traced(node.hostWidth)
    ) {
      const r: AutoMovieSolidIntersection.IResult =
        AutoMovieSolidIntersection.trace({
          part: partSurface,
          host: atlas,
          seed,
          parameter,
          count: node.count,
          tolerance,
          grazing: node.grazing,
        });
      if (r.curve === null) {
        absorb(node.name, r.diagnostics);
        return AutoMovieConstructionState.restore(body, state, snapshot);
      }
      traced = {
        curve: r.curve,
        part: partSurface,
        host: atlas,
        diff: node.kind === "diff",
      };
    }
    const width: AutoMovieSolidJoin.IInput["width"] | string =
      AutoMovieConstructionWidths.create(
        node.partWidth,
        node.hostWidth,
        parameter.kind === "phase",
        traced,
      );
    if (typeof width === "string") return fail("width", width);
    if (node.kind === "diff") body.faces[partIndex]!.inverted = true;
    const merged: AutoMovieSolidBody.IMerged = AutoMovieSolidBody.merge(body, {
      name: node.name,
      kind: node.kind,
      part: partIndex,
      join: {
        seed,
        parameter,
        count: node.count,
        tolerance,
        grazing: node.grazing,
        width,
        ...(traced === null ? {} : { curve: traced.curve }),
      },
      count: node.count,
      rows: node.rows,
    });
    absorb(node.name, merged.diagnostics);
    if (merged.blend === null || merged.join === null)
      return AutoMovieConstructionState.restore(body, state, snapshot);
    const blendFace: number = body.faces.length - 1;
    state.faces.set(node.name, blendFace);
    state.blendSurfaces.push(body.faces[blendFace]!.surface);
    state.joins.push({
      name: node.name,
      hostFace: node.seed.hostFace,
      partFace: node.seed.partFace,
      join: merged.join,
      blend: merged.blend,
    });
  }

  /** Publish a shared open end only after the part's actual boundary is realized. */
  function continuation(node: IAutoMovieConstructionContinuation): void {
    AutoMovieConstructionContinuationRealize(node, body, state, walk, report);
  }

  /** Leave the existing face unchanged when the declared trim cannot be prepared. */
  function trim(node: IAutoMovieConstructionTrim): void {
    walk(node.host);
    const index: number | undefined = state.faces.get(node.face);
    if (index === undefined)
      return report(
        node.name,
        "trim face",
        `the face ${node.face} was not realized`,
      );
    const surface: IAutoMovieSolidSurface = body.faces[index]!.surface;
    const result: AutoMovieSolidTrim.IResult = AutoMovieSolidTrim.create(
      surface,
      node.landmarks.map(AutoMovieConstructionViews.point),
      node.guesses.map((g: [number, number]): [number, number] => [
        g[0] * S,
        g[1],
      ]),
      chord / 1000,
    );
    absorb(node.name, result.diagnostics);
    if (result.trim === null) return;
    const t: AutoMovieSolidTrim.ITrim = result.trim;
    const count: number = AutoMovieSolidTrim.DENSITY * node.landmarks.length;
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, surface);
    const chart: [number, number][] = Array.from(
      { length: count },
      (_: unknown, m: number): [number, number] => {
        const at: [number, number, number, number] = t.at(
          (2 * Math.PI * m) / count,
        );
        return [at[0], at[1]];
      },
    );
    const vertices: number[] = chart.map((c: [number, number]): number =>
      AutoMovieSolidMesh.vertex(
        body.mesh,
        surface.jet(c[0], c[1]).p,
        owner,
        c[0],
        c[1],
      ),
    );
    body.faces[index]!.cycles.push({
      kind: "hole",
      vertices,
      chart,
      neighbours: chart.map(
        (c: [number, number], m: number): AutoMovieSolidCycle.INeighbour => ({
          face: -1,
          from: c,
          to: chart[(m + 1) % count]!,
        }),
      ),
    });
    state.trims.push(t);
  }

  /** Dispatch only the closed construction union in containment order. */
  function walk(node: AutoMovieConstructionNode): void {
    switch (node.type) {
      case "view":
      case "source":
        return view(node);
      case "profile":
        return AutoMovieConstructionProfileRealize(
          node,
          props.profiles,
          body,
          state,
          chord,
        );
      case "join":
        return join(node);
      case "continue":
        return continuation(node);
      case "split":
        return AutoMovieConstructionSplitRealize(
          node,
          body,
          state,
          walk,
          report,
        );
      case "port":
        return AutoMovieConstructionPortRealize(
          node,
          body,
          state,
          walk,
          report,
        );
      case "trim":
        return trim(node);
    }
  }

  walk(construction.root);
  if (withSkin) {
    const open: AutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(
      body,
      (face: string, detail: string): void =>
        report(face, "face triangulation", detail),
    );
    AutoMovieConstructionSkin.close(body, state, open);
    AutoMovieConstructionProfileSkin(
      body,
      state.profileEnds ?? [],
      open,
      report,
    );
  }
  const published: AutoMovieSolidBody.IPublished =
    AutoMovieSolidBody.publish(body);

  /** Shared result fields in their original order, before either mesh variant. */
  const records: Omit<
    AutoMovieConstructionRealization.IRealization,
    "mesh" | "diagnostics"
  > = {
    name: construction.name,
    chains: state.chainList,
    surfaces: [
      ...state.chainSurfaces,
      ...state.blendSurfaces,
      ...(state.profiles ?? []).flatMap(
        (
          profile: NonNullable<
            AutoMovieConstructionState.IState["profiles"]
          >[number],
        ): IAutoMovieSolidSurface[] => [...profile.originals.values()],
      ),
    ],
    profiles: state.profiles ?? [],
    joins: state.joins,
    trims: state.trims,
    body: published,
  };
  return withSkin
    ? {
        ...records,
        mesh: AutoMovieConstructionSkin.mesh(body),
        diagnostics: state.diagnostics,
      }
    : { ...records, mesh: null, diagnostics: state.diagnostics };
}
