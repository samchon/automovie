import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeDraw, ArchetypeFrame } from "../core";
import { StageBowConstruction } from "./StageBowConstruction";
import { createBow } from "./createBow";

/**
 * Hand-held bow silhouette for screen staging.
 *
 * The profile keeps its existing actor handle, resting seat and animated soft display curve.
 *
 * @param params An inert display model, its silhouette dimensions, and the scene id.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the seeded profile and actor-facing digital stage contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the authored digital limb profile and existing display attachment frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the stage silhouette dimensions once and attaches the selected curve and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageHandBowProp(
  params: createStageHandBowProp.IParams,
  seed?: number | string,
): Archetype<createBow.Affordance, createBow.Dimension> {
  const kind: createStageHandBowProp.Kind = ArchetypeDraw.choice(
    "bow",
    "kind",
    params.kind,
    createStageHandBowProp.KINDS,
  );
  return StageBowConstruction(kind, params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;

    // The string a brace height clear of the belly; each limb a straight rod from the grip to its nock, lifted so the lower limb's tilted collider, a capsule as long as the rod, rests on the floor.
    const length: number = d.length!;
    const r: number = d.depth! / 2;
    const string: number = r + (d.brace ?? length * createBow.BRACE);
    const limb: number = Math.hypot(length / 2, string);
    const floor: number = r * (1 - length / 2 / limb);
    const centre: number = floor + length / 2;
    const low: ReturnType<typeof v> = v(0, floor, string);
    const high: ReturnType<typeof v> = v(0, floor + length, string);
    const grip: ReturnType<typeof v> = v(0, centre, 0);
    const wood: { surface?: "wood" } =
      kind === "longbow" ? { surface: "wood" } : {};
    builder.rod("lowerLimb", r, low, grip, { color: "#a8743f", ...wood });
    builder.rod("upperLimb", r, grip, high, { color: "#a8743f", ...wood });
    builder.ball("grip", r, grip, { color: "#8a5a2b", ...wood });
    builder.ball("nockingPoint", createBow.STRING, v(0, centre, string), {
      color: "#c9a227",
    });

    // The string: its nocking point slides back along `+Z` from brace to the draw length from the grip.
    const travel: number = createBow.DRAW_LENGTH[kind] - string;
    builder.affordance({
      id: "string",
      kind: "slider",
      frame: ArchetypeFrame.facing(
        v(0, centre, string),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel,
      parts: ["nockingPoint"],
    });
    builder.affordance({
      id: "nock",
      kind: "socket",
      frame: ArchetypeFrame.facing(
        v(0, centre, string),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      rides: "string",
    });

    // Each limb turns about the grip's sideways axis, the upper's positive turn and the lower's bringing its tip back toward the string, by the table that keeps the tip the string's half length from the nocking point.
    const table: [number, number][] = createBow.limbs(
      length / 2,
      string,
      travel,
    );
    for (const [id, sign] of [
      ["upperLimb", 1],
      ["lowerLimb", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "hinge",
        frame: ArchetypeFrame.facing(grip, v(sign, 0, 0), v(0, 0, 1)),
        extent: null,
        travel: table[table.length - 1]![1],
        parts: [id],
        follows: { id: "string", table },
      });

    // The string's halves, each from a limb tip to the nocking point, laid again at every pose.
    for (const [id, part, at] of [
      ["string-upper", "upperLimb", limb / 2],
      ["string-lower", "lowerLimb", -limb / 2],
    ] as const)
      builder.span(
        id,
        { part, at: v(0, at, 0) },
        { affordance: "nock" },
        createBow.STRING,
        { color: "#e8e1cf" },
      );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(grip, v(0, 0, 1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: d.depth!,
    });
    // The rest on the stave's side, square to the string the drawn nocking height below the nocking point, as a tuned bow sets it.
    builder.affordance({
      id: "rest",
      kind: "surface",
      frame: ArchetypeFrame.facing(
        v(-r, centre - d.nockHeight!, 0),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      width: d.depth!,
      depth: d.depth!,
    });
    return builder.build(d.mass!, kind === "longbow" ? { rests: "wood" } : {});
  });
}

/**
 * Authoring options for {@link createStageHandBowProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form and names only the profiles sharing its contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageHandBowProp {
  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["longbow", "recurve", "horseBow"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export type IParams = Pick<
    createBow.IParams,
    "id" | "length" | "depth" | "brace" | "nockHeight" | "mass" | "draw"
  > & {
    /** The profile with the required outline. */
    kind: Kind;
    /** A model from this form's catalogue. */
    model?: "s1" | "s2" | "s3" | "hoyt68" | "hoyt70" | "warrior" | "zenith";
    /** A legacy catalogue selector available on the horse-bow silhouette. */
    weight?: createBow.Weight;
  };
}
