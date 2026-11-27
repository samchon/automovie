import { AutoMovieArchetypeScenicShip } from "../AutoMovieArchetypeScenicShip";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";

/*
 * A rigid, fictional ship for people on deck. The root sits at the still-water
 * line, with the bow toward +Z and +Y up. The boarding side and its passage are
 * along +X. The deck and boarding frames lie on the deck top. Boarding faces
 * inward along the frame's +Z. Each oared bench's seat frame points its +Z axis
 * toward the ship's aft (−Z). Each kind has an unobstructed aft work area and
 * helm standing position.
 *
 * Pair the ship with AutoMovieArchetypeRide.along and optionally
 * AutoMovieArchetypeSea.float to carry the same contact frames through a turn
 * or swell. Hull solids, fixed oars and sails, and a wheelhouse with an open
 * aft entry model film silhouettes. The model has no interior below deck or
 * propulsion simulation.
 * Parameter params: Profile, scene id and optional sizes within the profile's
 * provisional staging band.
 * Parameter seed: Optional number or text used to draw unfixed sizes.
 * Returns: The ship and its deck, boarding and crew contacts.
 * When the profile is unknown or a
 * dimension falls outside its band.
 */
export function createScenicShip(
  params: AutoMovieArchetypeScenicShip.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeScenicShip.Affordance, AutoMovieArchetypeScenicShip.Dimension> {
  const kind: AutoMovieArchetypeScenicShip.Kind = ArchetypeDraw.choice(
    "scenic ship",
    "kind",
    params.kind,
    AutoMovieArchetypeScenicShip.KINDS,
  );
  const profile: (typeof PROFILES)[AutoMovieArchetypeScenicShip.Kind] = PROFILES[kind];
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeScenicShip.Dimension> =
    new AutoMovieArchetypeDrawSession("scenic ship", UNITS, seed, params);
  const d: Record<AutoMovieArchetypeScenicShip.Dimension, number> = draw.dimensions(
    profileBands(profile),
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeScenicShip.Affordance,
    AutoMovieArchetypeScenicShip.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name:
      kind === "oared"
        ? "oared ship"
        : kind === "squareSail"
          ? "square-rigged ship"
          : "wheelhouse vessel",
    draw,
    material: kind === "wheelhouse" ? "steel" : "wood",
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const halfBeam: number = d.beam / 2;
  const deckY: number = d.freeboard;
  const sections: readonly (readonly [z: number, halfWidth: number])[] = [
    [-d.length / 2, profile.stern * halfBeam],
    [-d.length / 3, halfBeam],
    [d.length / 3, halfBeam],
    [d.length / 2, halfBeam * 0.035],
  ];

  // All courses meet the same waterline section. The upper hull's flat top carries the performers.
  for (const [index, aft] of sections.slice(0, -1).entries()) {
    const fore: (typeof sections)[number] = sections[index + 1]!;
    for (const [course, lowerY, lowerWidth, upperY, upperWidth, color] of [
      ["bottom", -d.draft, 0.44, 0, 0.87, "#8b4e35"],
      [
        "topsides",
        0,
        0.87,
        deckY,
        1,
        kind === "wheelhouse" ? "#344d62" : "#634b37",
      ],
    ] as const) {
      const points: IAutoMovieVector3[] = [];
      for (const [z, width] of [aft, fore])
        for (const side of [-1, 1])
          points.push(
            v(side * width * lowerWidth, lowerY, z),
            v(side * width * upperWidth, upperY, z),
          );
      builder.convex(`hull-${course}-${index}`, points, undefined, { color });
    }

    // A rail on the entry side stops at the two edges of the gap.
    const railY: number = deckY + PASSAGE.rail;
    for (const side of [-1, 1]) {
      const byGap: boolean = side === 1 && aft[0] < 0 && fore[0] > 0;
      const runs: readonly (readonly [IAutoMovieVector3, IAutoMovieVector3])[] =
        byGap
          ? [
              [v(aft[1], railY, aft[0]), v(halfBeam, railY, -PASSAGE.gap / 2)],
              [v(halfBeam, railY, PASSAGE.gap / 2), v(fore[1], railY, fore[0])],
            ]
          : [
              [
                v(side * aft[1], railY, aft[0]),
                v(side * fore[1], railY, fore[0]),
              ],
            ];
      for (const [run, [from, to]] of runs.entries()) {
        const key: string = `${index}-${side}-${run}`;
        builder.rod(`rail-${key}`, PASSAGE.radius, from, to, {
          color: "#beac8d",
        });
        builder.rod(
          `post-${key}-aft`,
          PASSAGE.radius,
          v(from.x, deckY, from.z),
          from,
          { color: "#beac8d" },
        );
        if ((byGap && to.z < 0) || index === sections.length - 2)
          builder.rod(
            `post-${key}-fore`,
            PASSAGE.radius,
            v(to.x, deckY, to.z),
            to,
            { color: "#beac8d" },
          );
      }
    }
  }

  const walkwayX: number = halfBeam - PASSAGE.width / 2;
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(walkwayX, deckY, 0)),
    extent: null,
    width: PASSAGE.width,
    depth: (2 * d.length) / 3,
  });
  builder.affordance({
    id: "boarding",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(walkwayX, deckY, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    width: PASSAGE.gap - 2 * PASSAGE.radius,
    depth: PASSAGE.width,
  });

  const aftZ: number = -d.length * 0.24;
  const helmZ: number =
    kind === "wheelhouse" ? d.length * 0.16 : -d.length * 0.322;
  for (const [id, z, depth] of [
    ["aftDeck", aftZ, d.length * 0.07],
    ["helm", helmZ, 0.75],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, deckY, z)),
      extent: null,
      width: id === "helm" ? 0.85 : d.beam * 0.38,
      depth,
    });

  if (kind === "oared") {
    const seatX: number = halfBeam - PASSAGE.width - BENCH.width / 2;
    const seatY: number = deckY + BENCH.height;
    for (const [index, fraction] of [
      [0, -0.19],
      [1, -0.09],
      [2, 0.09],
      [3, 0.19],
    ] as const)
      for (const [label, side] of [
        ["port", 1],
        ["starboard", -1],
      ] as const) {
        const id: AutoMovieArchetypeScenicShip.Affordance = `rower-${label}-${index}`;
        const x: number = side * seatX;
        const z: number = fraction * d.length;
        builder.box(
          `bench-${id}`,
          v(BENCH.width, BENCH.thickness, BENCH.depth),
          v(x, seatY - BENCH.thickness / 2, z),
          { color: "#ad7d4e", surface: "wood" },
        );
        builder.box(
          `bench-support-${id}`,
          v(
            BENCH.width * 0.55,
            BENCH.height - BENCH.thickness,
            BENCH.depth * 0.5,
          ),
          v(x, deckY + (BENCH.height - BENCH.thickness) / 2, z),
          { color: "#715338" },
        );
        builder.affordance({
          id,
          kind: "seat",
          frame: AutoMovieArchetypeFrame.facing(
            v(x, seatY, z - BENCH.depth / 2),
            v(0, 1, 0),
            v(0, 0, -1),
          ),
          extent: null,
          width: BENCH.width,
          depth: BENCH.depth,
        });

        // Fixed oars begin outside the walking lane and hang clear of the water.
        const bladeX: number = side * (halfBeam + 1.2);
        const bladeY: number = 0.16;
        builder.rod(
          `oar-${id}`,
          0.025,
          v(side * halfBeam, deckY + PASSAGE.rail * 0.5, z),
          v(bladeX, bladeY, z - 0.25),
          { color: "#ad7d4e" },
        );
        builder.box(
          `blade-${id}`,
          v(0.38, 0.07, 0.17),
          v(bladeX, bladeY, z - 0.25),
          { color: "#ad7d4e" },
        );
        builder.rod(
          `oar-stanchion-${id}`,
          PASSAGE.radius,
          v(side * halfBeam, deckY, z),
          v(side * halfBeam, deckY + PASSAGE.rail, z),
          { color: "#beac8d" },
        );
      }
  } else if (kind === "squareSail") {
    for (const [index, fraction, heightFactor] of [
      [0, -0.17, 1.25],
      [1, 0.035, 1.65],
      [2, 0.25, 1.45],
    ] as const) {
      const z: number = fraction * d.length;
      const height: number = d.beam * heightFactor;
      builder.rod(
        `mast-${index}`,
        0.12,
        v(0, deckY, z),
        v(0, deckY + height, z),
        { color: "#604331" },
      );
      for (const tier of [0, 1]) {
        const y: number = deckY + height * (0.57 + tier * 0.31);
        const width: number = d.beam * (0.95 - tier * 0.26);
        builder.rod(
          `yard-${index}-${tier}`,
          0.055,
          v(-width / 2, y, z),
          v(width / 2, y, z),
          { color: "#604331" },
        );
        const sail: IAutoMovieVector3[] = [];
        for (const side of [-1, 1])
          for (const thickness of [-0.035, 0.035])
            sail.push(
              v((side * width) / 2, y, z + thickness),
              v(side * width * 0.43, y - height * 0.24, z + 0.38 + thickness),
            );
        builder.convex(`sail-${index}-${tier}`, sail, undefined, {
          color: "#e5d5b7",
        });
      }
    }
  } else {
    const roofY: number = deckY + 2.15;
    const houseWidth: number = d.beam * 0.49;
    const houseLength: number = d.length * 0.23;
    const houseFront: number = helmZ + houseLength / 2;
    const houseBack: number = helmZ - houseLength / 2;
    builder.box(
      "wheelhouse-roof",
      v(houseWidth, 0.14, houseLength),
      v(0, roofY, helmZ),
      { color: "#d8dadd" },
    );
    builder.box(
      "wheelhouse-front",
      v(houseWidth, 1.05, 0.12),
      v(0, deckY + 0.525, houseFront - 0.06),
      { color: "#d8dadd" },
    );
    builder.box(
      "wheelhouse-window",
      v(houseWidth, roofY - deckY - 1.05, 0.065),
      v(0, (roofY + deckY + 1.05) / 2, houseFront - 0.045),
      { color: "#557485" },
    );
    for (const side of [-1, 1]) {
      const x: number = side * (houseWidth / 2 - 0.06);
      builder.box(
        `wheelhouse-side-${side}`,
        v(0.12, 1.05, houseLength),
        v(x, deckY + 0.525, helmZ),
        { color: "#d8dadd" },
      );
      for (const [end, z] of [
        ["aft", houseBack + 0.06],
        ["fore", houseFront - 0.06],
      ] as const)
        builder.box(
          `wheelhouse-pillar-${side}-${end}`,
          v(0.12, roofY - deckY - 1.05, 0.12),
          v(x, (roofY + deckY + 1.05) / 2, z),
          { color: "#d8dadd" },
        );
    }
  }

  // A plain pedestal gives the performer a screen-facing direction marker.
  builder.box(
    "helm-pedestal",
    v(0.36, 0.9, 0.24),
    v(0, deckY + 0.45, helmZ + 0.6),
    { color: "#695442" },
  );
  return builder.build(d.mass);
}

/*
 * Length, beam, draft and freeboard bands for fictional sets. All dimensions
 * and masses are provisional scene estimates.
 */
const PROFILES: Readonly<
  Record<
    AutoMovieArchetypeScenicShip.Kind,
    {
      dimensions: readonly [
        length: number,
        beam: number,
        draft: number,
        freeboard: number,
        mass: number,
      ];
      stern: number;
      source: string;
    }
  >
> = {
  oared: {
    dimensions: [20, 4.4, 0.8, 0.65, 8000],
    stern: 0.14,
    source:
      "Single-bank hull and station silhouette from the Viking Ship Museum's Skuldelev 5 reconstruction, https://www.vikingeskibsmuseet.dk/en/professions/the-boat-collection/helge-ask/",
  },
  squareSail: {
    dimensions: [44, 9, 2.4, 2.5, 200000],
    stern: 0.58,
    source:
      "Three-mast silhouette, weather-deck gangway and stern helm from Royal Museums Greenwich's Cutty Sark guide, https://www.rmg.co.uk/sites/default/files/import/Cutty_Sark_Teachers_Guide_2016.pdf",
  },
  wheelhouse: {
    dimensions: [19, 5.4, 1.1, 1.0, 24000],
    stern: 0.9,
    source:
      "Transom, wheelhouse and aft deck from National Historic Ships UK's surviving Arun-class lifeboat, https://www.nationalhistoricships.org.uk/register/3793/sir-william-arnold",
  },
};

/*
 * Rail and boarding passage dimensions in metres for the actor set.
 */
const PASSAGE: Readonly<{
  gap: number;
  width: number;
  rail: number;
  radius: number;
}> = {
  gap: 1.4,
  width: 1,
  rail: 0.86,
  radius: 0.035,
};

/*
 * Upper-deck furnishing dimensions in metres for seated performers.
 */
const BENCH: Readonly<{
  height: number;
  depth: number;
  width: number;
  thickness: number;
}> = {
  height: 0.43,
  depth: 0.34,
  width: 0.7,
  thickness: 0.07,
};

/*
 * SI units for the recorded staging dimensions.
 */
const UNITS: Readonly<
  Record<AutoMovieArchetypeScenicShip.Dimension, AutoMovieArchetypeDrawSession.Unit>
> = {
  length: "m",
  beam: "m",
  draft: "m",
  freeboard: "m",
  mass: "kg",
};

/*
 * Size intervals for scenery staging. The cited vessel establishes the
 * reference silhouette and the interval describes the fictional set.
 */
function profileBands(
  profile: (typeof PROFILES)[AutoMovieArchetypeScenicShip.Kind],
): Record<AutoMovieArchetypeScenicShip.Dimension, IAutoMovieArchetypeBand> {
  const [length, beam, draft, freeboard, mass]: (typeof profile)["dimensions"] =
    profile.dimensions;
  return {
    length: AutoMovieArchetypeBand.metres(
      length * 0.9,
      length * 1.1,
      profile.source,
      true,
    ),
    beam: AutoMovieArchetypeBand.metres(
      beam * 0.94,
      beam * 1.06,
      profile.source,
      true,
    ),
    draft: AutoMovieArchetypeBand.metres(
      draft * 0.9,
      draft * 1.1,
      profile.source,
      true,
    ),
    freeboard: AutoMovieArchetypeBand.metres(
      freeboard * 0.9,
      freeboard * 1.1,
      profile.source,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      mass * 0.75,
      mass * 1.25,
      profile.source,
      true,
    ),
  };
}
