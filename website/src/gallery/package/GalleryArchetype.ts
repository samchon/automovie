import {
  AutoMovieArchetypeArticulation,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeMarks,
  type IAutoMovieArchetypeBand,
} from "@automovie/archetypes";
import type { IAutoMovieMark } from "@automovie/interface";

import type { IGalleryRequest } from "../structures/IGalleryRequest";
import type { IGalleryView } from "../structures/IGalleryView";
import { GalleryCatalogue } from "./GalleryCatalogue";

/**
 * Builds one archetype for the gallery and reads off what the page lists: the
 * dimensions it records with a band, a model or a derived value, as the
 * archetype records them, and its affordances with the range each articulation
 * moves through.
 */
export namespace GalleryArchetype {
  /** Read a reference recipe only when the gallery needs its subject. */
  function referenceOf(
    producer: GalleryCatalogue.IProducer | undefined,
  ): GalleryCatalogue.ReferenceParams | undefined {
    const reference: GalleryCatalogue.Reference | undefined =
      producer?.REFERENCE;
    return typeof reference === "function" ? reference() : reference;
  }

  /** One built archetype. */
  export interface IBuilt {
    /** The archetype, with its articulations at the request's state. */
    archetype: GalleryCatalogue.Model;

    /** What the page lists; the stage adds the floor grid it draws. */
    view: Omit<IGalleryView, "grid">;
  }

  /**
   * Build the archetype a request names.
   *
   * @param request The subject, its variant, the seed and the articulations'
   *   state.
   * @returns The archetype and its listing.
   * @throws {Error} When no producer has the subject's id; the package's
   *   `AutoMovieArchetypeRefusal` when it refuses the variant or a travel.
   */
  export function build(request: IGalleryRequest): IBuilt {
    const producer: GalleryCatalogue.IProducer | undefined =
      GalleryCatalogue.producer(request.subject);
    if (producer === undefined)
      throw new Error(`No archetype producer is named ${request.subject}`);

    const key: string = GalleryCatalogue.variants(producer).key;
    // A dispatcher inherits the selected factory's reference only. A dog's
    // authored specimen mass therefore cannot override an equid's derived mass.
    const params: Record<string, unknown> = {
      ...referenceOf(producer),
      ...referenceOf(producer.PRODUCERS?.[request.variant]),
      ...(key === "" ? {} : { [key]: request.variant }),
    };
    const rest: GalleryCatalogue.Model = producer(
      params,
      request.seed ?? undefined,
    );

    // Only the articulations the archetype has are moved, so a state kept
    // from another subject asks for nothing.
    const state: Record<string, number> = Object.fromEntries(
      Object.entries(request.state).filter(([id]: [string, number]): boolean =>
        rest.affordances.some((a): boolean => a.id === id),
      ),
    );
    const archetype: GalleryCatalogue.Model =
      Object.keys(state).length === 0 ? rest : rest.articulate(state);

    // Each dimension is listed from the archetype's own record of where it came
    // from: a drawn one with the band it was drawn in, a picked model's figure
    // as that fixed value in its dimension's unit, named by the model it
    // belongs to. A derived value has only its recorded unit.
    const provenance: AutoMovieArchetypeDrawSession.IProvenance<string> =
      rest.provenance;
    const drawn: Readonly<Partial<Record<string, number>>> =
      archetype.dimensions;
    return {
      archetype,
      view: {
        name: archetype.name ?? request.subject,
        dimensions: Object.entries(drawn).flatMap(
          ([name, value]): IGalleryView.IDimension[] => {
            if (value === undefined) return [];
            const band: IAutoMovieArchetypeBand | undefined =
              provenance.bands[name];
            if (band !== undefined)
              return [
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
            const axis: string | undefined = provenance.figures[name];
            return [
              {
                name,
                value,
                minimum: value,
                maximum: value,
                unit: provenance.units[name] ?? "",
                source:
                  axis === undefined
                    ? "Derived by the archetype"
                    : `${axis} ${provenance.models[axis]}`,
                provisional: false,
              },
            ];
          },
        ),

        // The rest archetype states each articulation's range; the posed one
        // carries the same travel. A follower is set by its leader, so it
        // offers no travel of its own.
        affordances: rest.affordances.map(
          (affordance): IGalleryView.IAffordance => {
            const range: { minimum: number | null; maximum: number | null } =
              AutoMovieArchetypeArticulation.range(affordance);
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
                AutoMovieArchetypeArticulation.KINDS.has(affordance.kind) &&
                affordance.follows === undefined &&
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
    const mark: IAutoMovieMark | undefined = AutoMovieArchetypeMarks.of(
      "probe",
      [
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
      ],
    )[0];
    const hex: string = `#${(mark?.color ?? 0x808080).toString(16).padStart(6, "0")}`;
    COLORS.set(kind, hex);
    return hex;
  }

  /** The colours read so far, by affordance kind. */
  const COLORS: Map<string, string> = new Map();
}
