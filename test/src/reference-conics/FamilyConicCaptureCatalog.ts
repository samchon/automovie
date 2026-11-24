import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { AutoMovieLoftChain, AutoMovieViewLoft } from "@automovie/engine";
import type {
  IAutoMovieSolidSurface,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Display samples of actual native source factories and separately retained operator fields. */
export namespace FamilyConicCaptureCatalog {
  /**
   * Every sampled line retains its actual source and stage; missing readers stay explicit.
   *
   * @evidence contracts/development/design.md#principled-representation One actual source/operator display catalog retains metre curves, original chart units, source authority and unavailable readers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface NodeCanvasTypes owns curves and existing source/surface owners provide evaluated Point0 values.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Compatibility rows and uniform ring samples are not original 2D controls or a physical2 certificate.
   * @evidence contracts/development/common.md#meaningful-documentation Members state stages, domains, missing capabilities and sampled point count.
   */
  export interface IResult {
    /** Metre display samples, never geometry inputs. */
    curves: N.Curve[];
    /** Original factory and operator scopes are deliberately separate. */
    rows: {
      id: string;
      stage: string;
      role: string;
      domain: number[];
      features: string[];
      authority: string;
    }[];
    /** Missing original capabilities are not replaced by compatibility rows. */
    unavailable: { id: string; cause: string }[];
    /** Exact number of sampled display points. */
    points: number;
  }

  /**
   * Sample the same source declarations and retained surfaces used by one realization.
   * Point0 drawing establishes no physical2 or anatomical verdict.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Direct native authority is required before source sampling; retained operator fields keep their own period/domain and distinct stage. Ring and clock endpoints use the exact declared bounds, while interior interpolation retains its original arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded line sampler serves source factories and retained operator fields, with each failure retained by identity.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mesh reconstruction, compatibility fallback, finite difference, epsilon allowance, clamping or invented missing point enters the catalog; actual point readers and owned-domain guards remain unchanged.
   * @evidence contracts/development/common.md#meaningful-documentation Source station uses mm, source clock radians and display points metres; operator clocks retain their producer's units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed display grids bound work and storage per declared source and retained periodic operator.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One catalog is borrowed by every pass, camera and both capture consumers for the case.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only sampled lines and provenance survive; temporary factory chains are released after each source and no global cache is added.
   */
  export function create(
    declared: { sources: ReadonlyMap<string, IAutoMovieViewPart> },
    surfaces: readonly IAutoMovieSolidSurface[],
    cutters: readonly string[],
  ): IResult {
    const result: IResult = {
      curves: [],
      rows: [],
      unavailable: [],
      points: 0,
    };
    function lines(
      id: string,
      domain: readonly number[],
      period: number,
      point: (s: number, c: number) => readonly number[],
      colour: string,
      rings: number,
    ): void {
      function add(
        name: string,
        addresses: readonly (readonly [number, number])[],
        closed: boolean,
      ): void {
        try {
          const points: N.Point[] = addresses.map(
            ([s, c]: readonly [number, number]): N.Point => {
              const p: readonly number[] = point(s, c);
              if (p.length !== 3 || !p.every(Number.isFinite))
                throw new Error("nonfinite actual Point0");
              return [p[0]! / 1000, p[1]! / 1000, p[2]! / 1000];
            },
          );
          result.curves.push({ id: name, points, closed, colour });
          result.points += points.length;
        } catch (error: unknown) {
          result.unavailable.push({
            id: name,
            cause: error instanceof Error ? error.message : String(error),
          });
        }
      }
      for (let k: number = 0; k < rings; k++) {
        // Owned endpoints are input values; recomputing them can round outside the inclusive domain.
        const s: number =
          k === 0 ? domain[0]! : k === rings - 1 ? domain[1]! :
            domain[0]! + ((domain[1]! - domain[0]!) * k) / (rings - 1);
        add(
          id + ".ring." + k,
          Array.from(
            { length: 128 },
            (_: unknown, j: number): [number, number] => [
              s,
              (period * j) / 128,
            ],
          ),
          true,
        );
      }
      for (let k: number = 0; k < 8; k++)
        add(
          id + ".clock." + k,
          Array.from(
            { length: 96 },
            (_: unknown, j: number): [number, number] => [
              j === 0 ? domain[0]! : j === 95 ? domain[1]! :
                domain[0]! + ((domain[1]! - domain[0]!) * j) / 95,
              (period * k) / 8,
            ],
          ),
          false,
        );
    }
    for (const [name, part] of declared.sources) {
      try {
        const raw: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
        if (raw.chain === null)
          throw new Error(JSON.stringify(raw.diagnostics));
        const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> =
          raw.chain;
        if (chain.nativeSource === undefined)
          throw new Error(
            "Direct native source authority is absent; compatibility rows are not original curves",
          );
        const domain: [number, number] = [
          part.stations[0]!,
          part.stations.at(-1)!,
        ];
        const cutter: boolean = cutters.includes(name);
        result.rows.push({
          id: name,
          stage: "native-source-factory",
          role: cutter
            ? "actual cutter declaration"
            : "original family declaration",
          domain,
          features:
            part.reliefs?.map(
              (feature: NonNullable<typeof part.reliefs>[number]): string =>
                feature.name,
            ) ?? [],
          authority:
            "direct native scalar/clock factory; Point0 only, not an original 2D control polygon or physical2 certificate",
        });
        lines(
          "source." + name,
          domain,
          2 * Math.PI,
          (s: number, c: number): readonly number[] =>
            AutoMovieLoftChain.point(chain, s, c),
          cutter ? "dc3264" : "284b78",
          9,
        );
      } catch (error: unknown) {
        result.unavailable.push({
          id: name,
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    }
    for (const surface of surfaces) {
      if (declared.sources.has(surface.name)) continue;
      if (
        surface.domain === undefined ||
        surface.period === undefined ||
        !(surface.period > 0)
      ) {
        result.unavailable.push({
          id: surface.name,
          cause:
            "Retained operator chart has no bounded periodic display domain",
        });
        continue;
      }
      result.rows.push({
        id: surface.name,
        stage: "retained-operator-field",
        role: "operator field, not an intermediate solid",
        domain: [...surface.domain],
        features: [],
        authority:
          "same realization's retained Point0/jet owner, prior to display sampling",
      });
      lines(
        "operator." + surface.name,
        surface.domain,
        surface.period,
        (s: number, c: number): readonly number[] =>
          surface.point?.(s, c) ?? surface.jet(s, c).p,
        "14866c",
        3,
      );
    }
    return result;
  }
}
