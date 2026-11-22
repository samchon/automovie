import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The planning guide read for every autowalk figure below. */
const KONE: string =
  "KONE Planning Guide for Escalators & Autowalks, sections 5.3, 5.4, 5.8 and 5.12 (https://www.kone.co.uk/Images/Escalator%20planning%20guide%20GBIR_tcm45-86614.pdf)";

/** Construction sizes the guide does not give, provisional. */
const ESTIMATE: string =
  "Coarse film-set construction estimate; no source read gives it";

/** Thickness drawn for landing plates and the pallet band, metres (provisional construction estimate). */
const PLATE: number = 0.05;

/** Depth of each fixed landing plate drawn beyond a comb, metres (provisional construction estimate). */
const LANDING: number = 1;

/**
 * A horizontal moving walkway (autowalk): a level pallet band between two
 * combs, flush with the landings at `y = 0`.
 *
 * The entry comb lies across `x` at `z = 0` and the band runs toward `+Z`
 * to the exit comb at `z = length`. The model draws the fixed structure:
 * the landing plates, the band's coarse top surface and the two handrails.
 * The moving pallet band is a separate rigid model,
 * `createMovingWalkway.belt`, carried along `+Z` or `-Z` by the ride
 * (`rideMovingWalkway`).
 *
 * @param params Fixed dimensions.
 * @param seed The seed for any unfixed dimension.
 * @returns The walkway with its landing, band and handrail contacts.
 * @throws {ArchetypeRefusal} For a dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the drawn structure and the separate moving band.
 * @evidence contracts/development/implementation.md#principled-implementation One level band of the drawn length and pallet width between two landings, handrails at the drawn height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the plates, band and rails, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Length, pallet width and handrail height are KONE's read ranges. The rail offset, plate thickness, landing depth and mass are provisional construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts and five contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after returning the model.
 */
export function createMovingWalkway(
  params: createMovingWalkway.IParams = {},
  seed?: number | string,
): Archetype<createMovingWalkway.Affordance, createMovingWalkway.Dimension> {
  const draw: ArchetypeDrawSession<createMovingWalkway.Dimension> =
    new ArchetypeDrawSession(
      "movingWalkway",
      createMovingWalkway.UNITS,
      seed,
      params,
    );
  const {
    length,
    width,
    handrail,
    mass,
  }: Record<createMovingWalkway.Dimension, number> = draw.dimensions(
    createMovingWalkway.BANDS,
  );
  const builder: ArchetypeBuilder<
    createMovingWalkway.Affordance,
    createMovingWalkway.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "moving walkway",
    material: "steel",
    draw,
  });
  const rail: number = width / 2 + createMovingWalkway.RAIL_OFFSET;
  builder.box(
    "entryLanding",
    Vector3.create(2 * rail, PLATE, LANDING),
    Vector3.create(0, -PLATE / 2, -LANDING / 2),
    { color: "#8a8f96" },
  );
  builder.box(
    "exitLanding",
    Vector3.create(2 * rail, PLATE, LANDING),
    Vector3.create(0, -PLATE / 2, length + LANDING / 2),
    { color: "#8a8f96" },
  );
  builder.box(
    "band",
    Vector3.create(width, PLATE, length),
    Vector3.create(0, -PLATE / 2, length / 2),
    { color: "#4b5058" },
  );
  for (const side of [-1, 1] as const)
    builder.rod(
      side < 0 ? "rightRail" : "leftRail",
      0.04,
      Vector3.create(side * rail, handrail, 0),
      Vector3.create(side * rail, handrail, length),
      { color: "#111111" },
    );

  builder.affordance({
    id: "entryLanding",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, 0, -LANDING / 2)),
    extent: null,
    width,
    depth: LANDING,
  });
  builder.affordance({
    id: "exitLanding",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, 0, length + LANDING / 2)),
    extent: null,
    width,
    depth: LANDING,
  });
  builder.affordance({
    id: "band",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, 0, length / 2)),
    extent: null,
    width,
    depth: length,
  });
  for (const side of [-1, 1] as const)
    builder.affordance({
      id: side < 0 ? "rightHandrail" : "leftHandrail",
      kind: "handle",
      symmetry: "round",
      grip: "power",
      frame: ArchetypeFrame.facing(
        Vector3.create(side * rail, handrail, length / 2),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      length,
      aperture: 0.08,
    });
  return builder.build(mass);
}

/**
 * The walkway's dimensions and its moving pallet band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives each dimension's unit and source and the band model's frame.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres and mass in kilograms, each with its band.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer, `rideMovingWalkway` and the escalator test read these members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A horizontal autowalk only; KONE's inclined autowalks are not drawn.
 */
export namespace createMovingWalkway {
  /** The two fixed landings, the moving band's resting surface and the two handrails. */
  export type Affordance =
    | "entryLanding"
    | "exitLanding"
    | "band"
    | "leftHandrail"
    | "rightHandrail";

  /** Length and pallet width and handrail height in metres, and mass in kilograms. */
  export type Dimension = "length" | "width" | "handrail" | "mass";

  /** The moving band's width and length in metres and mass in kilograms. */
  export type BeltDimension = "width" | "length" | "mass";

  /** The dimensions the author fixes inside their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The scene's model identifier, `movingWalkway` when omitted. */
    id?: string;
  }

  /** Lateral distance from the pallet edge to each handrail centre, metres (provisional construction estimate). */
  export const RAIL_OFFSET: number = 0.1;

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    width: "m",
    handrail: "m",
    mass: "kg",
  };

  /** The dimensions' bands. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(
      10,
      250,
      `${KONE}, 5.8 horizontal autowalk lengths`,
    ),
    width: ArchetypeBand.metres(
      1,
      1.4,
      `${KONE}, 5.3 horizontal autowalk pallet widths`,
    ),
    handrail: ArchetypeBand.metres(
      0.9,
      1.1,
      `${KONE}, 5.12 balustrade heights`,
    ),
    mass: ArchetypeBand.of("kg", 3000, 30000, ESTIMATE, true),
  };

  /**
   * The moving pallet band as its own rigid model, the size of the
   * walkway's band, whose `band` surface lies at the same local point as
   * the walkway's, so at rest the two coincide.
   *
   * @param walkway The walkway whose band this is.
   * @returns The band model.
   */
  export function belt(
    walkway: Pick<Archetype<Affordance, Dimension>, "dimensions">,
  ): Archetype<"band", BeltDimension> {
    const length: number = walkway.dimensions.length!;
    const width: number = walkway.dimensions.width!;
    const draw: ArchetypeDrawSession<BeltDimension> = new ArchetypeDrawSession(
      "walkwayBelt",
      { width: "m", length: "m", mass: "kg" },
      undefined,
      {},
    );
    draw.derive("width", width);
    draw.derive("length", length);
    // 40 kg a metre of band: a provisional construction estimate.
    const mass: number = draw.derive("mass", 40 * length);
    const builder: ArchetypeBuilder<"band", BeltDimension> =
      new ArchetypeBuilder({
        name: "walkway belt",
        material: "aluminium",
        draw,
      });
    builder.box(
      "band",
      Vector3.create(width, PLATE, length),
      Vector3.create(0, -PLATE / 2, length / 2),
      { color: "#3a3f46" },
    );
    builder.affordance({
      id: "band",
      kind: "surface",
      frame: ArchetypeFrame.upright(Vector3.create(0, 0, length / 2)),
      extent: null,
      width,
      depth: length,
    });
    return builder.build(mass);
  }
}
