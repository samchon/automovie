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

import { AutoMovieHumanMassPart } from "../limb/AutoMovieHumanMassPart";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanBreastConnection } from "./AutoMovieHumanBreastConnection";
import { AutoMovieHumanGlutealConnection } from "./AutoMovieHumanGlutealConnection";
import { AutoMovieHumanMammaryPlacement } from "./AutoMovieHumanMammaryPlacement";
import { AutoMovieHumanMammarySkin } from "./AutoMovieHumanMammarySkin";
import { AutoMovieHumanTrunkLegs } from "./AutoMovieHumanTrunkLegs";
import { AutoMovieHumanTrunkMassPlacement } from "./AutoMovieHumanTrunkMassPlacement";
import { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";
import { AutoMovieHumanTrunkTape } from "./AutoMovieHumanTrunkTape";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";

/**
 * The trunk's source from its views, with chest and hip fullness solved over
 * actual level sections. The breast's native forward graph and the gluteal
 * masses receive their projection at the fixed height and transverse place of
 * the person's AP apex.
 *
 * Each tape solves fullness on the original level and tissue envelope.
 * The final pass publishes those sections and their tissue fields. The hip
 * tape also reads both retained legs. Embedded masses use the mirrored law
 * and sample their exact parent atlas.
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
  /** Section controls and ring phases of a mass. */
  const MASS_ORDER: number = 128;

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
      legs: original.legs,
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
    > = AutoMovieHumanTrunkSectionFamily.prepare(input.views);
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const sources: IAutoMovieHumanNamedSource[] = [];
    const out = (
      trunk: IAutoMovieConstructionView | null,
      masses: IAutoMovieHumanBodyTree.IFold[],
    ): IAutoMovieHumanTrunkBuild.IOutput => ({
      trunk,
      masses,
      diagnostics,
      sources,
      sections,
    });

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
    const target = input.breast?.target;
    const shoulder = input.views.shoulder;
    let native: AutoMovieHumanMammaryPlacement.IPrepared | null = null;
    const mammaryFailure = (error: unknown): void => {
      diagnostics.push({
        producer: "trunk.mammary",
        level: 3,
        contract: "native source",
        detail: error instanceof Error ? error.message : String(error),
      });
    };
    if (
      input.mammary !== undefined &&
      shoulder !== undefined &&
      target !== undefined
    )
      try {
        native = AutoMovieHumanMammaryPlacement.prepare(
          first.part,
          input.mammary,
          shoulder,
          target,
        );
      } catch (error: unknown) {
        mammaryFailure(error);
      }
    const shapes = native;
    const firstInput: IAutoMovieHumanTrunkBuild.IInput = {
      ...input,
      breast: shapes === null ? input.breast : null,
      legs: AutoMovieHumanTrunkLegs.pair(input, first),
    };
    const masses1: IMass[] = masses(firstInput, first.part, [], sources);

    // The original tape envelope sets the base's shoulders.
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
              contour:
                kind !== "breast" || shapes === null
                  ? undefined
                  : (original) =>
                      AutoMovieHumanMammaryPlacement.tape(
                        shapes,
                        original,
                        plane.y,
                      ),
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
    let base: IAutoMovieHumanSourceRealization = {
      ...AutoMovieHumanTrunkViewPart.define(solved, input.top, sections),
      loft: null,
    };
    if (base.part !== null && shapes !== null && target !== undefined)
      try {
        base = {
          ...base,
          part: AutoMovieHumanMammarySkin.of(base.part, shapes, target[1]),
        };
        input = { ...input, breast: null };
      } catch (error: unknown) {
        mammaryFailure(error);
      }
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
    return { ...out(base.view, folds), legs: input.legs };
  }

  /** A built mass. */
  interface IMass {
    /** Which pair it belongs to. */
    kind: "breast" | "gluteal";

    /** Its law, this side's. */
    law: IAutoMovieHumanTrunkBuild.IMassLaw;

    /** Identical original view part, used by source tape cuts. */
    source: IAutoMovieViewPart;

    /** Its view node. */
    view: IAutoMovieConstructionView;

    /** The fold's width cap, mm. */
    cap: number;
  }

  /**
   * Both sides of every mass on a base.
   *
   * @param input The laws.
   * @param part The identical original trunk source used for wall placement.
   * @param diagnostics Where a failed mass is recorded; a pass that only reads
   *   the masses for the tapes passes a list it drops.
   * @param sources The actual source results, including failed and intermediate
   *   tape-pass attempts.
   * @returns The masses that built.
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
        const connection:
          | (IAutoMovieHumanMassSource.IConnection & {
              footprint?: IAutoMovieHumanTrunkBuild.IMassLaw["footprint"];
            })
          | string =
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
                  fold: own.fold,
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
        const footprint: IAutoMovieHumanTrunkBuild.IMassLaw["footprint"] =
          connection.footprint ?? own.footprint;
        const built: IAutoMovieHumanSourceRealization = {
          ...AutoMovieHumanMassPart.define({
            name,
            connection,
            originalSource: { part, source: parent.source, orientation: 1 },
            centre: placement.centre,
            sourceFrame: { origin: connection.wall, normal: connection.normal },
            up: own.up,
            lateral: [0, 0, side === "left" ? 1 : -1],
            footprint,
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
          law: { ...own, footprint },
          source: built.part,
          view: built.view,
          cap: Math.min(Math.min(...footprint) / 2, clearance),
        });
      }
    }
    return out;
  }

  /**
   * A left law on the right side (J6): the target and up reflected in the
   * median plane; the edges keep their lateral and medial naming.
   *
   * @param law The left side's law.
   * @returns The right side's.
   */
  function mirror(
    law: IAutoMovieHumanTrunkBuild.IMassLaw,
  ): IAutoMovieHumanTrunkBuild.IMassLaw {
    const flip: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = (
      p: AutoMovieVector3Tuple,
    ): AutoMovieVector3Tuple => [p[0], p[1], -p[2]];
    return { ...law, target: flip(law.target), up: flip(law.up) };
  }
}
