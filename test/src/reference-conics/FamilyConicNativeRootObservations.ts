import type { FamilyConicNativePremises } from "./FamilyConicNativePremises";
import { AutoMovieEngineSolidVector as V } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSeedTrace,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/** Existing actual trace collectors shared by one full native inspection round. */
export namespace FamilyConicNativeRootObservations {
  /** Detached actual query; nonfinite/missing jets remain explicit failures. */
  interface Query {
    owner: string;
    role: "part" | "host";
    sequence: number;
    station: number | null;
    phase: number | null;
    jet?: IAutoMovieSolidSurface.IJet;
    unavailable?: string;
  }

  /** Copy the full physical chart jet without evaluating it again. */
  function copy(jet: IAutoMovieSolidSurface.IJet): IAutoMovieSolidSurface.IJet {
    return {
      p: [...jet.p],
      u: [...jet.u],
      v: [...jet.v],
      uu: [...jet.uu],
      uv: [...jet.uv],
      vv: [...jet.vv],
    };
  }

  /** Existing column inputs, with independently read physical chords/dots. */
  function columns(
    event: Extract<IAutoMovieConstructionSplitBandTrace.Event, { kind: "prepared" }>,
  ): unknown[] {
    return event.columns.map(
      (column: (typeof event.columns)[number], index: number): unknown => {
        const chord: AutoMovieVector3Tuple = V.sub(column.end.point, column.start.point);
        const length: number = V.norm(chord),
          a: number = V.norm(column.start.first),
          b: number = V.norm(column.end.first);
        const startDot: number = V.dot(chord, column.start.first),
          endDot: number = V.dot(chord, column.end.first);
        return {
          column: index,
          chord,
          chordLengthMm: length,
          startDotMm2: startDot,
          endDotMm2: endDot,
          startCosine: length > 0 && a > 0 ? startDot / (length * a) : null,
          endCosine: length > 0 && b > 0 ? endDot / (length * b) : null,
          backward: event.backward.includes(index),
          start: column.start,
          end: column.end,
          units:
            "points mm; first mm per normalized cross variable; second mm per normalized cross variable squared; these are not physical station derivatives",
        };
      },
    );
  }

  /** One callback set observes already computed operators; it never repeats them. */
  export interface IObservation {
    /** Actual prepared/local/refusal events; prepared columns retain normalized-cross units. */
    actualBands: {
      owner: string;
      event: IAutoMovieConstructionSplitBandTrace.Event;
      columns?: unknown[];
    }[];
    /** Actual full-host seam endpoints and profile/chord values. */
    actualSeams: unknown[];
    /** Actual bounded axilla seed termination events. */
    actualAxillaSeedEvents: { owner: string; event: IAutoMovieConstructionSeedTrace.IEvent }[];
    /** Actual pass-through source queries; unavailable physical2 remains explicit. */
    actualAxillaQueries: Query[];
    /** Same single operator walk's optional read-only hooks. */
    hooks: NonNullable<Parameters<typeof FamilyConicNativePremises>[2]>;
  }

  /**
   * Reuse the existing RootInputs evidence collection in the actual NativeRound.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Extracts the existing detached actual events, physical chord/dot readings and pass-through seed queries without changing any input or adding an operator call.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One invocation owns the four evidence arrays and the hooks supplied to the existing single walker.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No solve, factory, mesh, correction or source substitution is performed; missing full jets stay unavailable.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes physical station/phase source2 from normalized ribbon first/second vectors.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies only actual observed payloads plus the original two seam-end queries; no separate full round is run.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the same factory/operator instance as the case's ordinary premise report and SourceCapture handoff.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Arrays belong to one current case and are released after its immutable receipt is written; no module state, handle or process is acquired.
   */
  export function create(): IObservation {
    const events: IObservation["actualBands"] = [],
      seeds: IObservation["actualAxillaSeedEvents"] = [],
      queries: Query[] = [],
      seams: unknown[] = [];
    const hooks: IObservation["hooks"] = {
      band(owner: string, event: IAutoMovieConstructionSplitBandTrace.Event): void {
        events.push({
          owner,
          event,
          ...(event.kind === "prepared" ? { columns: columns(event) } : {}),
        });
      },
      seam(
        owner: string,
        index: number,
        definition: IAutoMovieConstructionSplit.ISeam,
        host: IAutoMovieSolidSurface,
        station: number,
        normal: AutoMovieVector3Tuple,
      ): void {
        try {
          const first: IAutoMovieSolidSurface.IJet = host.jet(
              station,
              definition.seam.startPhaseRad,
            ),
            second: IAutoMovieSolidSurface.IJet = host.jet(
              station,
              definition.seam.endPhaseRad,
            );
          const chord: AutoMovieVector3Tuple = V.sub(second.p, first.p),
            length: number = V.norm(chord),
            e1: AutoMovieVector3Tuple | null = V.unit(chord),
            heading: AutoMovieVector3Tuple = definition.profile?.heading ?? normal;
          const e2: AutoMovieVector3Tuple | null =
            e1 === null
              ? null
              : V.unit(V.sub(heading, V.scale(e1, V.dot(heading, e1))));
          seams.push({
            owner,
            index,
            station,
            definition,
            endpoints: [
              { phase: definition.seam.startPhaseRad, fullPhysical2: copy(first) },
              { phase: definition.seam.endPhaseRad, fullPhysical2: copy(second) },
            ],
            chordMm: length,
            e1,
            heading,
            planeSecondDirectionBeforeOrientation: e2,
            endNormal: normal,
            knots:
              definition.profile?.knots.map(
                ({ alongM, depthM }: IAutoMovieConstructionSplit.IProfileKnot): unknown => ({
                  alongMm: alongM * 1000,
                  depthMm: depthM * 1000,
                  chordShare: (alongM * 1000) / length,
                  insideActualChord: alongM >= 0 && alongM * 1000 <= length,
                }),
              ) ?? [],
            scope:
              "actual full host endpoints and declared chord-plane profile; no normalization or admission repair",
          });
        } catch (error: unknown) {
          seams.push({
            owner,
            index,
            unavailable: error instanceof Error ? error.message : String(error),
          });
        }
      },
      seed(owner: string, event: IAutoMovieConstructionSeedTrace.IEvent): void {
        if (owner.startsWith("cut.axilla")) seeds.push({ owner, event });
      },
      seedSurface(
        owner: string,
        role: "part" | "host",
        surface: IAutoMovieSolidSurface,
      ): IAutoMovieSolidSurface {
        if (!owner.startsWith("cut.axilla")) return surface;
        return {
          ...surface,
          jet(station: number, phase: number): IAutoMovieSolidSurface.IJet {
            const address: Omit<Query, "jet" | "unavailable"> = {
              owner,
              role,
              sequence: queries.length,
              station: Number.isFinite(station) ? station : null,
              phase: Number.isFinite(phase) ? phase : null,
            };
            try {
              const actual: IAutoMovieSolidSurface.IJet = surface.jet(
                station,
                phase,
              );
              if (
                [
                  actual.p,
                  actual.u,
                  actual.v,
                  actual.uu,
                  actual.uv,
                  actual.vv,
                ].every((vector: AutoMovieVector3Tuple): boolean =>
                  vector.every(Number.isFinite),
                )
              )
                queries.push({ ...address, jet: copy(actual) });
              else
                queries.push({
                  ...address,
                  unavailable: "actual queried physical2 is nonfinite",
                });
              return actual;
            } catch (error: unknown) {
              queries.push({
                ...address,
                unavailable:
                  error instanceof Error ? error.message : String(error),
              });
              throw error;
            }
          },
        };
      },
    };
    return {
      actualBands: events,
      actualSeams: seams,
      actualAxillaSeedEvents: seeds,
      actualAxillaQueries: queries,
      hooks,
    };
  }
}
