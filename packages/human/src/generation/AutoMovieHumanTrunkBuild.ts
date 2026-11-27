import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionView,
  IAutoMovieHumanBodyTree,
  IAutoMovieHumanMassSource,
  IAutoMovieHumanNamedSource,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieHumanTrunkMassPlacement,
  IAutoMovieHumanTrunkSectionFamily,
  IAutoMovieHumanTrunkTape,
  IAutoMovieHumanTrunkViews,
  IAutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanMassPart } from "./AutoMovieHumanMassPart";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";
import { AutoMovieHumanBreastConnection } from "./AutoMovieHumanBreastConnection";
import { AutoMovieHumanGlutealConnection } from "./AutoMovieHumanGlutealConnection";
import { AutoMovieHumanTrunkLegs } from "./AutoMovieHumanTrunkLegs";
import { AutoMovieHumanTrunkMassPlacement } from "./AutoMovieHumanTrunkMassPlacement";
import { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";
import { AutoMovieHumanTrunkTape } from "./AutoMovieHumanTrunkTape";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";

/**
 * The trunk subtree built and joined (#3047): the base lofted from its views,
 * the breasts and the gluteal masses as parts of their own on it, the base's
 * fullness at the chest and the buttock solved on sampled original cuts, and
 * fold declarations for later body-tree assembly. Each declared AP apex fixes
 * its own height, transverse place and full-body front/back target. The
 * original trunk section at that Y/Z supplies the local wall, so actual
 * amplitude is their AP difference, not a whole-depth difference at another
 * place.
 *
 * Order. The masses stand on the base's surface and the chest and hip tapes
 * wrap base and masses together, so the build closes the two in two passes: the
 * base with the ellipse's shoulder at those two sites, the masses on it, the
 * two shoulders solved on the hull of the base's section, the masses' level
 * cuts and, at the hip, the same original legs' horizontal cuts
 * (`AutoMovieHumanTrunkTape`), then the base again with them and the masses
 * again on it. A mass's place reads only the base's outlines near its centre,
 * so a changed shoulder can change local projection. This retains the existing
 * two-pass tape construction; it does not establish final-union tape closure.
 * AP apex coordinates remain fixed in both source passes.
 *
 * Masses. Each side is the same construction from the left side's law mirrored
 * (J6): the target point and the up direction reflected in the median plane,
 * the footprint and profile kept in their up, lateral, down and medial naming,
 * and the side's lateral direction (+Z on the left, -Z on the right) handed to
 * the part, which reads off its own frame which chart side is lateral. The
 * original-source wall point and AP axis pass to the mass builder directly; its
 * original world jet only estimates embedding. A source-to-loft discrepancy
 * does not move the apex to conceal it.
 *
 * Folds. Each mass declares a fold for the body's construction tree
 * (`AutoMovieHumanBodyTree`), its seed searched along the mass's lower station
 * line (the footprint's lower edge) from inside the base out, its fold radius
 * the caller's declared join softness, its width capped at half its smallest
 * footprint edge (a fillet wider than that swallows the mass) and at the gap
 * from its footprint's medial edge to the median plane (beyond it the pair's
 * rails cross: the cleavage and the cleft are corners the two-part merge does
 * not close, operator gap 3). A pair that reaches the median plane is reported
 * and left unjoined.
 */
export namespace AutoMovieHumanTrunkBuild {
  /**
   * Preserve the existing upper scalar support from the canonical head axis;
   * the regular shared connection excludes that support's dome from the loft
   * domain.
   */
  export function withHead(
    trunk: IAutoMovieHumanTrunkBuild.IInput,
    head: IAutoMovieHumanTrunkBuild.IWithHeadHead,
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
  ): IAutoMovieHumanTrunkBuild.IInput {
    const neck: IAutoMovieHumanTrunkViews.ISite | undefined =
      trunk.views.sites.at(-1);
    if (head === undefined || neck === undefined) return trunk;
    const y: number =
      neck.y + Math.min(neck.half, (neck.front - neck.back) / 2);
    if (
      y < head.crown[1] &&
      y >= head.part.stations[0]! &&
      y < head.part.stations.at(-1)!
    )
      return { ...trunk, top: { x: head.part.axis.at(y).origin[0], y } };
    diagnostics.push({
      producer: "lane.trunk",
      level: 2,
      contract: "top closure",
      detail: `the neck dome at ${y} mm does not lie inside the head's source domain below crown ${head.crown[1]} mm`,
    });
    return trunk;
  }

  /**
   * Build the trunk subtree.
   *
   * @param input The views, the merged tapes and the masses' laws.
   * @returns The chains, the merges and the diagnostics.
   */
  export function create(
    input: IAutoMovieHumanTrunkBuild.IInput,
    prepared?: IAutoMovieHumanTrunkBuild.IOutput,
  ): IAutoMovieHumanTrunkBuild.IOutput {
    const original: IAutoMovieHumanTrunkBuild.IOutput =
      prepared ?? define(input);
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...original.diagnostics,
    ];
    const sources: IAutoMovieHumanNamedSource[] = [...original.sources];
    const last: Map<string, IAutoMovieHumanNamedSource> = new Map(
      sources.map(
        (
          source: IAutoMovieHumanNamedSource,
        ): [string, IAutoMovieHumanNamedSource] => [source.name, source],
      ),
    );
    const failed: Set<string> = new Set();
    for (const source of last.values()) {
      const result: IAutoMovieHumanSourceRealization =
        source.result.loft === null
          ? AutoMovieHumanSiteViewPart.loft(source.result)
          : source.result;
      if (result !== source.result) sources.push({ name: source.name, result });
      diagnostics.push(
        ...result.diagnostics.slice(source.result.diagnostics.length),
      );
      if (
        result.loft?.chain === null ||
        result.loft?.chain === undefined ||
        result.loft.surface === null
      )
        failed.add(source.name);
    }
    return {
      sections: original.sections,
      trunk: failed.has(AutoMovieHumanTrunkViewPart.NAME)
        ? null
        : original.trunk,
      masses: original.masses.filter(
        (mass: IAutoMovieHumanBodyTree.IFold): boolean =>
          !failed.has(mass.partFace),
      ),
      diagnostics,
      sources,
    };
  }

  /**
   * Prepare the identical two tape passes from original fields, without raw
   * lofts, a mesh or final realization.
   */
  export function define(
    input: IAutoMovieHumanTrunkBuild.IInput,
  ): IAutoMovieHumanTrunkBuild.IOutput {
    const sections: ReadonlyMap<
      string,
      IAutoMovieHumanTrunkSectionFamily.IPlane
    > = AutoMovieHumanTrunkSectionFamily.define(input.views);
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const sources: IAutoMovieHumanNamedSource[] = [];
    function out(
      trunk: IAutoMovieConstructionView | null,
      masses: IAutoMovieHumanBodyTree.IFold[],
    ): IAutoMovieHumanTrunkBuild.IOutput {
      return {
        trunk,
        masses,
        diagnostics,
        sources,
        sections,
      };
    }

    // Pass 1: the base with the ellipse's shoulders, the masses on it.
    const first: IAutoMovieHumanSourceRealization = {
      ...AutoMovieHumanTrunkViewPart.define(input.views, input.top, sections),
      loft: null,
    };
    sources.push({ name: AutoMovieHumanTrunkViewPart.NAME, result: first });
    if (first.part === null || first.view === null) {
      diagnostics.push(...first.diagnostics);
      return out(null, []);
    }
    const firstInput: IAutoMovieHumanTrunkBuild.IInput = {
      ...input,
      legs: AutoMovieHumanTrunkLegs.pair(input, first),
    };
    const masses1: IMass[] = masses(firstInput, first.part, [], sources);

    // The original-source tape-plane envelope sets the base's shoulders.
    // This is not a cut of final Boolean skin or a whole-body tape proof.
    const solved: IAutoMovieHumanTrunkViews = {
      ...input.views,
      sites: input.views.sites.map(
        (
          s: IAutoMovieHumanTrunkViews.ISite,
        ): IAutoMovieHumanTrunkViews.ISite => {
          const kind: "breast" | "gluteal" | null =
            s.site === "chest"
              ? "breast"
              : s.site === "buttock"
                ? "gluteal"
                : null;
          if (kind === null) return s;
          const plane: IAutoMovieHumanTrunkSectionFamily.IPlane = sections.get(
            s.site,
          )!;
          const tape: IAutoMovieHumanTrunkTape.IResult =
            AutoMovieHumanTrunkTape.solve({
              producer: `view.trunk ${s.site}`,
              plane,
              masses: masses1
                .filter((m: IMass): boolean => m.kind === kind)
                .map(
                  (m: IMass): IAutoMovieHumanTrunkTape.IMass => ({
                    part: m.source,
                    view: m.view,
                  }),
                ),
              parentsAt:
                kind === "gluteal"
                  ? (
                      shoulder: number,
                    ): NonNullable<
                      IAutoMovieHumanTrunkTape.IInput["parents"]
                    > =>
                      AutoMovieHumanTrunkLegs.trial(
                        input,
                        s,
                        shoulder,
                        sections,
                      )
                  : undefined,
              tape: kind === "breast" ? input.tapes.chest : input.tapes.hip,
            });
          diagnostics.push(...tape.diagnostics);
          return tape.shoulder === null
            ? s
            : { ...s, fullness: { shoulder: tape.shoulder } };
        },
      ),
    };
    const base: IAutoMovieHumanSourceRealization = {
      ...AutoMovieHumanTrunkViewPart.define(solved, input.top, sections),
      loft: null,
    };
    sources.push({ name: AutoMovieHumanTrunkViewPart.NAME, result: base });
    diagnostics.push(...base.diagnostics);
    if (base.part === null || base.view === null) return out(null, []);
    input = { ...input, legs: AutoMovieHumanTrunkLegs.pair(input, base) };

    // Pass 2 publishes originals and fold declarations. The actual lower
    // guide exit/host is resolved only by the later body-tree assembly.
    const folds: IAutoMovieHumanBodyTree.IFold[] = masses(
      input,
      base.part,
      diagnostics,
      sources,
    ).map(
      (m: IMass): IAutoMovieHumanBodyTree.IFold => ({
        part: m.view,
        partFace: m.source.name,
        hostFace: AutoMovieHumanTrunkViewPart.NAME,
        search: { phase: Math.PI, from: 0, to: 1 },
        radius: m.law.fold,
        cap: m.cap,
      }),
    );
    return out(base.view, folds);
  }

  /*
   * Section controls and ring phases of a mass.
   */
  const MASS_ORDER: number = 128;

  /*
   * Both sides of every mass on a base.
   * Parameter input: The laws.
   * Parameter part: The identical original trunk source used for wall placement.
   * Parameter diagnostics: Where a failed mass is recorded; a pass that only reads
   * the masses for the tapes passes a list it drops.
   * Parameter sources: The actual source results, including failed and intermediate
   * tape-pass attempts.
   * Returns: The masses that built.
   */
  function masses(
    input: IAutoMovieHumanTrunkBuild.IInput,
    part: IAutoMovieViewPart,
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
    sources: IAutoMovieHumanNamedSource[],
  ): IMass[] {
    const out: IMass[] = [];
    const pairs: [
      "breast" | "gluteal",
      IAutoMovieHumanTrunkBuild.IMassLaw | null,
    ][] = [
      ["breast", input.breast],
      ["gluteal", input.gluteal],
    ];
    for (const [kind, law] of pairs) {
      if (law === null) continue;

      // A pair whose footprints reach the median plane meets itself there:
      // the corner the two-part merge does not close.
      const clearance: number = law.target[2] - law.footprint[3];
      if (!(clearance > 0)) {
        diagnostics.push({
          producer: `mass.${kind}`,
          level: 3,
          contract: "pair",
          detail: `the footprint's medial edge ${law.footprint[3]} mm reaches the median plane from ${law.target[2]} mm: the pair meets itself, a corner left open`,
        });
        continue;
      }
      for (const side of ["left", "right"] as const) {
        const own: IAutoMovieHumanTrunkBuild.IMassLaw =
          side === "left" ? law : mirror(law);
        const name: string = `${kind}.${side}`;
        const placement: IAutoMovieHumanTrunkMassPlacement.IPlacement | string =
          AutoMovieHumanTrunkMassPlacement.of(
            part,
            own.target,
            kind === "breast" ? 1 : -1,
          );
        if (typeof placement === "string") {
          const failed: IAutoMovieHumanSourceRealization = {
            part: null,
            loft: null,
            view: null,
            diagnostics: [
              {
                producer: `mass.${name}`,
                level: 3,
                contract: "source placement",
                detail: placement,
              },
            ],
          };
          sources.push({ name, result: failed });
          diagnostics.push(...failed.diagnostics);
          continue;
        }
        const leg: IAutoMovieHumanSourceDefinition | undefined =
          input.legs?.[side];
        const connection: IAutoMovieHumanMassSource.IConnection | string =
          kind === "breast"
            ? AutoMovieHumanBreastConnection.create({
                trunk: part,
                target: own.target,
                footprint: own.footprint,
                shoulder: own.shoulder,
                lateral: side === "left" ? 1 : -1,
              })
            : leg?.part !== null && leg?.part !== undefined && leg.view !== null
              ? AutoMovieHumanGlutealConnection.create({
                  trunk: part,
                  leg: { part: leg.part, view: leg.view },
                  target: own.target,
                  footprint: own.footprint,
                  shoulder: own.shoulder,
                  lateral: side === "left" ? 1 : -1,
                })
              : "Gluteal contact requires the identical successful same-leg original";
        if (typeof connection === "string") {
          const failed: IAutoMovieHumanSourceRealization = {
            part: null,
            loft: null,
            view: null,
            diagnostics: [
              {
                producer: `mass.${name}`,
                level: 3,
                contract: "parent contact",
                detail: connection,
              },
            ],
          };
          sources.push({ name, result: failed });
          diagnostics.push(...failed.diagnostics);
          continue;
        }
        const parent: (typeof connection.parent.sources)[number] | undefined =
          connection.parent.sources.find(
            (source: (typeof connection.parent.sources)[number]): boolean =>
              source.part === part,
          );
        if (parent === undefined)
          throw new Error(
            "A mass connection lost its identical original trunk field",
          );
        const built: IAutoMovieHumanSourceRealization = {
          ...AutoMovieHumanMassPart.define({
            name,
            connection,
            originalSource: { part, source: parent.source, orientation: 1 },
            centre: placement.centre,
            sourceFrame: { origin: connection.wall, normal: connection.normal },
            up: own.up,
            lateral: [0, 0, side === "left" ? 1 : -1],
            footprint: own.footprint,
            amplitude: connection.amplitude,
            profile: own.profile,
            shoulder: own.shoulder,
            order: MASS_ORDER,
            samples: MASS_ORDER,
            gap: AutoMovieHumanTrunkViewPart.GAP,
          }),
          loft: null,
        };
        sources.push({ name, result: built });
        diagnostics.push(...built.diagnostics);
        if (built.part === null) continue;
        if (built.view === null) continue;
        out.push({
          kind,
          law: own,
          source: built.part,
          view: built.view,
          cap: Math.min(Math.min(...own.footprint) / 2, clearance),
        });
      }
    }
    return out;
  }

  /*
   * A left law on the right side (J6): the target and up reflected in the
   * median plane; the edges keep their lateral and medial naming.
   * Parameter law: The left side's law.
   * Returns: The right side's.
   */
  function mirror(
    law: IAutoMovieHumanTrunkBuild.IMassLaw,
  ): IAutoMovieHumanTrunkBuild.IMassLaw {
    function flip(p: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
      return [p[0], p[1], -p[2]];
    }
    return { ...law, target: flip(law.target), up: flip(law.up) };
  }

  /*
   * A built mass.
   */
  interface IMass {
    /*
     * Which pair it belongs to.
     */
    kind: "breast" | "gluteal";

    /*
     * Its law, this side's.
     */
    law: IAutoMovieHumanTrunkBuild.IMassLaw;

    /*
     * Identical original view part, used by source tape cuts.
     */
    source: IAutoMovieViewPart;

    /*
     * Its view node.
     */
    view: IAutoMovieConstructionView;

    /*
     * The fold's width cap, mm.
     */
    cap: number;
  }
}
