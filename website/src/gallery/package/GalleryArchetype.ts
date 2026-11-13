import {
  type Archetype,
  ArchetypeArticulation,
  ArchetypeMarks,
  type IArchetypeBand,
} from "@automovie/archetypes";
import type { IAutoMovieMark } from "@automovie/engine";

import type { IGalleryRequest } from "../structures/IGalleryRequest";
import type { IGalleryView } from "../structures/IGalleryView";
import { GalleryCatalogue } from "./GalleryCatalogue";

/**
 * Builds one archetype for the gallery and reads off what the page lists:
 * the dimensions its seed drew with their bands, and its affordances with
 * the range each articulation moves through.
 */
export namespace GalleryArchetype {
  /** One built archetype. */
  export interface IBuilt {
    /** The archetype, with its articulations at the request's state. */
    archetype: Archetype<string, string>;

    /** What the page lists; the stage adds the floor grid it draws. */
    view: Omit<IGalleryView, "grid">;
  }

  /**
   * Build the archetype a request names.
   *
   * @param request The subject, its variant, the seed and the articulations' state.
   * @returns The archetype and its listing.
   * @throws {Error} When no producer has the subject's id; the package's `ArchetypeRefusal` when it refuses the variant or a travel.
   */
  export function build(request: IGalleryRequest): IBuilt {
    const producer: GalleryCatalogue.IProducer | undefined =
      GalleryCatalogue.producer(request.subject);
    if (producer === undefined)
      throw new Error(`No archetype producer is named ${request.subject}`);

    const key: string = GalleryCatalogue.variants(producer).key;
    const params: Record<string, unknown> =
      key === "" ? {} : { [key]: request.variant };
    const rest: Archetype<string, string> = producer(
      params,
      request.seed === "" ? undefined : request.seed,
    );

    // Only the articulations the archetype has are moved, so a state kept
    // from another subject asks for nothing.
    const state: Record<string, number> = Object.fromEntries(
      Object.entries(request.state).filter(([id]: [string, number]): boolean =>
        rest.affordances.some((a): boolean => a.id === id),
      ),
    );
    const archetype: Archetype<string, string> =
      Object.keys(state).length === 0 ? rest : rest.articulate(state);

    // The row of the producer's band table this form is drawn from. Without
    // a seed every dimension takes the middle of its band, so the row is the
    // one whose middles are the seedless dimensions.
    const middle: Readonly<Partial<Record<string, number>>> =
      request.seed === "" ? rest.dimensions : producer(params).dimensions;
    const bands: Record<string, IArchetypeBand> =
      GalleryCatalogue.bands(producer).find(
        (row: Record<string, IArchetypeBand>): boolean =>
          Object.entries(middle).every(
            ([name, value]: [string, number | undefined]): boolean =>
              row[name] !== undefined &&
              value !== undefined &&
              Math.abs(value - (row[name].minimum + row[name].maximum) / 2) <=
                1e-9,
          ),
      ) ?? {};
    const drawn: Readonly<Partial<Record<string, number>>> =
      archetype.dimensions;
    return {
      archetype,
      view: {
        name: archetype.name ?? request.subject,
        measures: [],
        dimensions: Object.entries(drawn).flatMap(
          ([name, value]): IGalleryView.IDimension[] => {
            const band: IArchetypeBand | undefined = bands[name];
            return value === undefined || band === undefined
              ? []
              : [
                  {
                    name,
                    value,
                    minimum: band.minimum,
                    maximum: band.maximum,
                    unit: band.unit,
                    source: band.source,
                    provisional: band.provisional === true,
                  },
                ];
          },
        ),

        // The rest archetype states each articulation's range; the posed one
        // carries the same travel.
        affordances: rest.affordances.map(
          (affordance): IGalleryView.IAffordance => {
            const range: { minimum: number | null; maximum: number | null } =
              ArchetypeArticulation.range(affordance);
            const turning: boolean = [
              "hinge",
              "knob",
              "crank",
              "wheel",
            ].includes(affordance.kind);
            return {
              id: affordance.id,
              kind: affordance.kind,
              color: color(affordance.kind),
              travel:
                ArchetypeArticulation.KINDS.has(affordance.kind) &&
                range.minimum !== null &&
                range.maximum !== null &&
                range.maximum > range.minimum
                  ? {
                      minimum: range.minimum,
                      maximum: range.maximum,
                      unit: turning ? "degrees" : "m",
                    }
                  : null,
            };
          },
        ),
      },
    };
  }

  /**
   * The colour the package draws an affordance kind in.
   *
   * @param kind The affordance kind.
   * @returns The colour as `#rrggbb`.
   */
  export function color(kind: string): string {
    const known: string | undefined = COLORS.get(kind);
    if (known !== undefined) return known;

    // The package keeps its palette to itself, so the colour is read from
    // the mark it makes for a contact of that kind.
    const mark: IAutoMovieMark | undefined = ArchetypeMarks.of("probe", [
      {
        id: "probe",
        kind: kind as never,
        frame: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
      },
    ])[0];
    const hex: string = `#${(mark?.color ?? 0x808080).toString(16).padStart(6, "0")}`;
    COLORS.set(kind, hex);
    return hex;
  }

  /** The colours read so far, by affordance kind. */
  const COLORS: Map<string, string> = new Map();
}
