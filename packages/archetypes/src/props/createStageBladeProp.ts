import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Overall display length is measured along the prop's long axis. */
const UNITS: Readonly<Record<createStageBladeProp.Dimension, "m">> = {
  length: "m",
};

/** Admitted digital display lengths. */
const LENGTH: IArchetypeBand = ArchetypeBand.metres(
  0.55,
  1.45,
  "Authored digital display scale for padded blade props.",
  true,
);

/**
 * Each display profile gives its default length in metres, and the relative
 * locations and sizes of its visual features. They are authored silhouettes.
 */
const PROFILES = {
  foil: {
    length: 0.95,
    grip: 0.17,
    shaft: 0.011,
    guard: 0.046,
    color: "#c1b1e8",
  },
  epee: {
    length: 1.02,
    grip: 0.17,
    shaft: 0.017,
    guard: 0.073,
    color: "#acd3ea",
  },
  sabre: {
    length: 0.96,
    grip: 0.17,
    shaft: 0.018,
    guard: 0.058,
    color: "#edbf9b",
  },
  shinai: {
    length: 1.16,
    grip: 0.26,
    shaft: 0.021,
    guard: 0.047,
    color: "#d6ae73",
  },
  longsword: {
    length: 1.16,
    grip: 0.24,
    shaft: 0.029,
    guard: 0.082,
    color: "#b9b3ce",
  },
} as const satisfies Record<
  createStageBladeProp.Kind,
  {
    length: number;
    grip: number;
    shaft: number;
    guard: number;
    color: string;
  }
>;

/**
 * A digital padded blade silhouette for sport or theatrical staging.
 * The handle starts at the origin and the broad rounded end points along
 * +Y. The color bands identify the visual ends of the inert shaft. The point
 * and, on the cutting silhouettes, the edge of the striking part are the
 * contact regions a touch or a strike reads.
 *
 * @param params The silhouette, scene id, and optional overall length in metres.
 * @param seed The optional draw seed.
 * @returns The padded model, its named grip approached from -Z, its point and any edge.
 * @throws {ArchetypeRefusal} When the silhouette or length is inadmissible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the visual frame, size and handle, and names the two admission failures.
 * @evidence contracts/development/implementation.md#principled-implementation The profile scales the padded shaft, guard, caps and handle in one frame. The handle on the shaft axis has an explicit approach and a length spanning its usable area.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the size, place common parts, add the silhouette-specific guard, then declare the grip, the point and any edge.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Profiles are display choices. There are no flight, cutting or damage parameters. The edge spans are the sports' rule texts, not measured blades.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each admitted model creates a fixed number of primitives and at most three affordances.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The builder records the same padded surfaces for display and geometry queries.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns its generated data and the producer retains no per-model state.
 */
export function createStageBladeProp(
  params: createStageBladeProp.IParams,
  seed?: number | string,
): Archetype<createStageBladeProp.Affordance, createStageBladeProp.Dimension> {
  const kind: createStageBladeProp.Kind = ArchetypeDraw.choice(
    "stageBladeProp",
    "kind",
    params.kind,
    createStageBladeProp.KINDS,
  );
  const profile: (typeof PROFILES)[createStageBladeProp.Kind] = PROFILES[kind];
  const draw: ArchetypeDrawSession<createStageBladeProp.Dimension> =
    new ArchetypeDrawSession("stageBladeProp", UNITS, seed, {
      length: params.length,
    });
  const length: number =
    params.length === undefined
      ? draw.derive("length", profile.length)
      : draw.dimensions({ length: LENGTH }).length;
  const builder: ArchetypeBuilder<
    createStageBladeProp.Affordance,
    createStageBladeProp.Dimension
  > = new ArchetypeBuilder({
    draw,
    id: params.id,
    name: `padded ${kind} stage prop`,
    material: "foam",
  });
  const v: typeof Vector3.create = Vector3.create;
  const gripLength: number = profile.grip * length;
  const gripRadius: number = Math.min(0.016, 0.021 * length);
  const shaftRadius: number = profile.shaft * length;
  const guardRadius: number = profile.guard * length;
  const capRadius: number = Math.max(shaftRadius, 0.019 * length);
  const capY: number = length - capRadius;
  const guardDepth: number = 0.024 * length;
  const twoHand: boolean = kind === "shinai" || kind === "longsword";

  builder.rod("grip", gripRadius, v(0, 0, 0), v(0, gripLength, 0), {
    color: "#45465e",
  });
  builder.rod("shaft", shaftRadius, v(0, gripLength, 0), v(0, capY, 0), {
    color: profile.color,
  });
  builder.ball("endCap", capRadius, v(0, capY, 0), { color: "#fff0b2" });

  if (kind === "longsword") {
    builder.rod(
      "guard",
      guardDepth,
      v(-guardRadius, gripLength, 0),
      v(guardRadius, gripLength, 0),
      { color: "#6f6687", round: true },
    );
  } else {
    builder.rod(
      "guard",
      guardRadius,
      v(0, gripLength, 0),
      v(0, gripLength + guardDepth, 0),
      { color: "#6f6687" },
    );
  }
  if (kind === "sabre") {
    builder.rod(
      "guardBow",
      guardDepth,
      v(guardRadius * 0.82, gripLength, 0),
      v(guardRadius * 0.45, guardDepth, 0),
      { color: "#6f6687", round: true },
    );
  }
  if (kind === "shinai") {
    builder.rod(
      "binding",
      shaftRadius + 0.003,
      v(0, 0.74 * length, 0),
      v(0, 0.77 * length, 0),
      { color: "#fff0b2" },
    );
  }

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      v(0, gripLength / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: twoHand ? "two-hand" : "power",
    aperture: 2 * gripRadius,
    length: gripLength,
  });

  // The contact regions a touch or a strike is read from: the point at the
  // end cap's tip for every silhouette, and for the cutting silhouettes the
  // edge on the grip's front (+Z) side, centred on the striking part.
  builder.affordance({
    id: "point",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(v(0, length, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
  });
  const strike: readonly [number, number] | undefined =
    createStageBladeProp.EDGES[kind];
  if (strike !== undefined) {
    const from: number = strike[0] * length;
    const to: number = strike[1] * length;
    builder.affordance({
      id: "edge",
      kind: "ledge",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        v(0, (from + to) / 2, shaftRadius),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      length: to - from,
    });
  }
  return builder.build(0.2);
}

/**
 * Authoring controls for the padded blade silhouette.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the five forms, metre scale, named grip and contact regions with their rule sources.
 * @evidence contracts/development/design.md#principled-representation A closed silhouette union uses a single scale independent of scene identity; striking parts are length shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the chosen form, its length, the common hold name and the point and edge the blade actions read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The shared draw session rejects inadmissible values. The form contains no material or striking properties.
 */
export namespace createStageBladeProp {
  /** Ordered silhouette names in the digital prop catalogue. */
  export const KINDS = [
    "foil",
    "epee",
    "sabre",
    "shinai",
    "longsword",
  ] as const;

  /**
   * A foil, épée, sabre, shinai or longsword display silhouette.
   */
  export type Kind = (typeof KINDS)[number];

  /**
   * The affordance ids:
   *
   * - `grip`: the shaft handle for posing the performer, approached from `-Z`.
   * - `point`: the tip of the end cap, facing along `+Y`, the contact a thrust or a touch is read from.
   * - `edge`: on a sabre and a shinai only, the striking part's edge on the `+Z` side, facing `+Z`, as long as that part.
   */
  export type Affordance = "grip" | "point" | "edge";

  /**
   * The striking part of each cutting silhouette, as shares of its length
   * from the handle's end. A sabre touches with its whole blade above the
   * guard (FIE Technical Rules, the sabre's valid hit), taken from the guard's
   * end at a share of 0.2. A shinai strikes with the edge of its monouchi,
   * from the nakayui binding at 0.77 to the tip (FIK, The Regulations of
   * Kendo Shiai and Shinpan, 2023 revision, Article 13: the datotsu-bu is
   * the jin-bu of the monouchi). The point weapons declare no edge.
   */
  export const EDGES: Readonly<
    Partial<Record<Kind, readonly [number, number]>>
  > = {
    sabre: [0.2, 1],
    shinai: [0.77, 1],
  };

  /**
   * Length in metres along the prop's +Y axis.
   */
  export type Dimension = "length";

  /**
   * A stage silhouette, optional size and model identity.
   */
  export interface IParams {
    /** The padded silhouette. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /** Overall length in metres. Defaults to the selected silhouette's length. */
    length?: number;
  }
}
