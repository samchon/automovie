import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { TOOL_BANDS } from "./TOOL_BANDS";

/**
 * A one-hand tool: a claw hammer, a hand saw, a screwdriver, a spoon, a fork, a table knife, a combination wrench, a drill driver, a garden trowel or a ladle.
 *
 * The tool stands along `+Y` from the butt of its handle at the origin to its working end, whose face is the `face` affordance: a hammer's striking face toward `+Z`, a saw's line of teeth toward `+Z`, a screwdriver's tip, a spoon's bowl, a fork's tines a table knife's edge toward `+Z`, under the index finger that lies along the spine, a wrench's jaw at its tip, and a trowel's scoop and a ladle's bowl toward `+Z`. A drill driver instead stands on the base of its upright grip at the origin, its head across the grip's top running forward along `+Z` to the chuck, its `face`, with its `trigger` under the head at the grip's front. The hand takes the `grip` from the `-Z` side with the thumb toward the working end, except a saw's: its grip runs across its heel square to the line from the grip to the tooth line's middle, the saw's hang (Disstonian Institute glossary: "The imaginary line that runs parallel to the hand grip should have a line running perpendicular to it, running through the mid-point of the tooth line", https://disstonianinstitute.com/glossary.html), and the hand takes it from the blade's `+X` side with the thumb toward the spine, the teeth below the fist.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tool.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tool stands, where its working end is and how it is held.
 * @evidence contracts/development/implementation.md#principled-implementation A handle rod and one working part per tool; a hammer's steel head is eleven times as dense as its handle (steel at 7850 against hickory at about 700 kg per cubic metre, handbook values), which is what puts the balance near the head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the handle and its grip, then the kind's working part and face.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A claw, teeth and a tip are not modelled; the working face is a frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTool(
  params: createTool.IParams,
  seed?: number | string,
): Archetype<createTool.Affordance, createTool.Dimension> {
  const kind: createTool.Kind = ArchetypeDraw.choice(
    "tool",
    "kind",
    params.kind,
    createTool.KINDS,
  );
  const d: Partial<Record<createTool.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "tool",
      createTool.BANDS[kind],
      seed,
      params,
      createTool.BANDS,
    );
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;
  const builder: ArchetypeBuilder<createTool.Affordance, createTool.Dimension> =
    new ArchetypeBuilder({
      archetype: "tool",
      id: params.id,
      name: kind,
      dimensions: d,
    });

  const v: typeof Vector3.create = Vector3.create;
  if (kind === "powerDrill") {
    // A drill driver: the grip upright from its base at the origin, the head across its top running forward along +Z to the chuck.
    const head: number = createTool.DRILL.head;
    const rear: number = createTool.DRILL.rear;
    const grip: number = d.height! - head;
    builder.rod("handle", radius, v(0, 0, 0), v(0, grip, 0), {
      color: "#2c2f33",
    });
    builder.box(
      "head",
      v(d.width!, head, length),
      v(0, grip + head / 2, length / 2 - rear),
      { color: "#c9a227", density: 2 },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(v(0, grip / 2, 0), v(0, 0, -1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: grip,
    });
    builder.affordance({
      id: "trigger",
      kind: "trigger",
      frame: ArchetypeFrame.facing(
        v(0, grip - createTool.DRILL.trigger, radius),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      travel: createTool.DRILL.travel,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(
        v(0, grip + head / 2, length - rear),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  // The handle and its grip: how much of the length is handle depends on the tool.
  const handle: number =
    kind === "hammer"
      ? length - 0.03
      : kind === "saw" || kind === "screwdriver" || kind === "trowel"
        ? length - d.blade!
        : kind === "spoon"
          ? length - 2 * createTool.BOWL
          : kind === "tableKnife"
            ? length - createTool.KNIFE_BLADE.length
            : kind === "wrench"
              ? length - createTool.WRENCH_HEAD.length
              : kind === "ladle"
                ? length - d.bowl!
                : length - createTool.TINES.length;
  const cutlery: boolean =
    kind === "spoon" ||
    kind === "fork" ||
    kind === "tableKnife" ||
    kind === "ladle";
  if (kind === "saw") {
    // A saw's grip runs across its heel, square to the line from the grip to
    // the tooth line's middle (the hang), so the fist thrusts along that line.
    const centre: IAutoMovieVector3 = Vector3.create(0, handle / 2, 0);
    const toTeeth: IAutoMovieVector3 = Vector3.subtract(
      Vector3.create(0, handle + d.blade! / 2, createTool.BLADE_DEPTH / 2),
      centre,
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.create(0, -toTeeth.z, toTeeth.y),
    );
    const held: number = createTool.GRIP;
    builder.rod(
      "handle",
      radius,
      Vector3.subtract(centre, Vector3.scale(across, held / 2)),
      Vector3.add(centre, Vector3.scale(across, held / 2)),
      { color: "#8a5a35" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        centre,
        Vector3.create(1, 0, 0),
        Vector3.scale(across, -1),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
      length: held,
    });
  } else {
    builder.rod(
      "handle",
      radius,
      Vector3.create(0, 0, 0),
      Vector3.create(0, handle, 0),
      { color: cutlery ? "#b9bcc0" : "#8a5a35" },
    );
    const held: number = Math.min(handle, createTool.GRIP);

    // A knife's handle is taken one way only, its edge under the fist; the other handles are round or two-faced.
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry:
        kind === "screwdriver" || kind === "trowel"
          ? "round"
          : kind === "tableKnife"
            ? "none"
            : "half",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, kind === "hammer" ? held / 2 : handle - held / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: cutlery ? "precision" : "power",
      aperture: 2 * radius,
      length: held,
    });
  }

  if (kind === "wrench" || kind === "trowel" || kind === "ladle") {
    // The working end beyond the handle: a wrench's flat head and its jaw at the tip, a trowel's blade with its scoop toward +Z, a ladle's bowl opening toward +Z.
    const steel: string = "#b9bcc0";
    if (kind === "wrench") {
      const head: Readonly<{ width: number; length: number }> =
        createTool.WRENCH_HEAD;
      builder.box(
        "head",
        v(createTool.FLAT, head.length, head.width),
        v(0, handle + head.length / 2, 0),
        { color: steel, density: 1.5 },
      );
    } else if (kind === "trowel")
      builder.box(
        "blade",
        v(d.width!, d.blade!, createTool.FLAT),
        v(0, handle + d.blade! / 2, 0),
        { color: steel, density: 1.5 },
      );
    else
      builder.ball("bowl", d.bowl! / 2, v(0, length - d.bowl! / 2, 0), {
        color: steel,
      });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: kind === "wrench" ? "along" : "normal",
      frame:
        kind === "wrench"
          ? ArchetypeFrame.facing(v(0, length, 0), v(0, 1, 0), v(1, 0, 0))
          : ArchetypeFrame.facing(
              v(
                0,
                kind === "trowel"
                  ? handle + d.blade! / 2
                  : length - d.bowl! / 2,
                kind === "trowel" ? createTool.FLAT / 2 : d.bowl! / 2,
              ),
              v(0, 0, 1),
              v(1, 0, 0),
            ),
      extent: null,
    });
  }

  if (kind === "hammer") {
    builder.box(
      "head",
      Vector3.create(0.028, 0.03, 0.11),
      Vector3.create(0, length - 0.015, 0),
      { color: "#55595f", density: 11 },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, length - 0.015, 0.055),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  } else if (kind === "saw") {
    builder.box(
      "blade",
      Vector3.create(0.001, d.blade!, createTool.BLADE_DEPTH),
      Vector3.create(0, handle + d.blade! / 2, 0),
      { color: "#b9bcc0", density: 11 },
    );
    builder.affordance({
      id: "face",
      kind: "ledge",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, handle + d.blade! / 2, createTool.BLADE_DEPTH / 2),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      length: d.blade!,
    });
  } else if (kind === "screwdriver") {
    builder.rod(
      "shank",
      0.003,
      Vector3.create(0, handle, 0),
      Vector3.create(0, length, 0),
      { color: "#b9bcc0", density: 11 },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.upright(Vector3.create(0, length, 0)),
      extent: null,
    });
  } else if (kind === "tableKnife") {
    // The blade is one flat plate on the handle's end, its flats toward X, its edge on +Z and its spine on -Z.
    const blade: Readonly<{ width: number; length: number }> =
      createTool.KNIFE_BLADE;
    builder.box(
      "blade",
      Vector3.create(0.002, blade.length, blade.width),
      Vector3.create(0, handle + blade.length / 2, 0),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "ledge",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, handle + blade.length / 2, blade.width / 2),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      length: blade.length,
    });
  } else if (kind === "fork") {
    // The tines are one flat plate on the handle's end, ending the fork's drawn length.
    const tines: Readonly<{ width: number; length: number }> = createTool.TINES;
    builder.box(
      "tines",
      Vector3.create(tines.width, tines.length, 0.002),
      Vector3.create(0, handle + tines.length / 2, 0),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, length, 0),
        Vector3.create(0, 1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  } else if (kind === "spoon") {
    // The bowl is a disc on the handle's end whose far rim is the spoon's drawn length.
    const centre: number = length - createTool.BOWL;
    builder.rod(
      "bowl",
      createTool.BOWL,
      Vector3.create(0, centre, -0.001),
      Vector3.create(0, centre, 0.001),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, centre, 0.001),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createTool}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle a hand wraps, the reach to the working end and the mass swung (#3369, #3361).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every tool has the same two contacts, a `grip` and a `face`, so a tool-use act is written once.
 */
export namespace createTool {
  /** The kinds of tool. */
  export type Kind =
    | "hammer"
    | "saw"
    | "screwdriver"
    | "spoon"
    | "fork"
    | "tableKnife"
    | "wrench"
    | "powerDrill"
    | "trowel"
    | "ladle";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "hammer",
    "saw",
    "screwdriver",
    "spoon",
    "fork",
    "tableKnife",
    "wrench",
    "powerDrill",
    "trowel",
    "ladle",
  ];

  /** A wrench's head beyond its handle, across and along, metres: an estimate, not read at a source. */
  export const WRENCH_HEAD: Readonly<{ width: number; length: number }> = {
    width: 0.035,
    length: 0.03,
  };

  /** A wrench head's and a trowel blade's thickness, metres: an estimate. */
  export const FLAT: number = 0.004;

  /** A drill driver's head height, its overhang behind the grip, the trigger's place below the head and its pull, metres: estimates; the makers give the overall length and height only. */
  export const DRILL: Readonly<{
    head: number;
    rear: number;
    trigger: number;
    travel: number;
  }> = { head: 0.07, rear: 0.03, trigger: 0.02, travel: 0.008 };

  /** A table knife's blade as one plate, from its spine to its edge and along, metres: an estimate, not read at a source; the maker's page gives the knife's whole length only. */
  export const KNIFE_BLADE: Readonly<{ width: number; length: number }> = {
    width: 0.02,
    length: 0.09,
  };

  /** A fork's tines as one plate, across and along, metres: an estimate, not read at a source. */
  export const TINES: Readonly<{ width: number; length: number }> = {
    width: 0.025,
    length: 0.045,
  };

  /** A saw blade's depth from its spine to its teeth, metres: an estimate, not read at a source. */
  export const BLADE_DEPTH: number = 0.1;

  /** The length of handle a hand holds, metres: the 120 mm CCOHS recommends for a tool handle (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html). */
  export const GRIP: number = 0.12;

  /** The radius of a spoon's bowl, metres: the bowl is a disc of this radius whose far rim ends the spoon, and the handle is the rest of the length. An estimate, not read at a source. */
  export const BOWL: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `grip`: the handle, held at its butt end on a hammer, across the heel on a saw and next to the working part on the others.
   * - `face`: the working end: a hammer's striking face, the edge of a saw's teeth, a screwdriver's tip, the hollow of a spoon's bowl, the points of a fork's tines, a table knife's edge, a wrench's jaw, a drill's chuck, a trowel's scoop, a ladle's bowl.
   * - `trigger`: a drill driver's trigger, pulled by the index finger of the hand on its grip.
   */
  export type Affordance = "grip" | "face" | "trigger";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: overall, along `+Y`.
   * - `gripDiameter`: the handle's diameter; a spoon's or a fork's handle's width.
   * - `blade`: the length of a saw's blade, a screwdriver's shank or a trowel's blade.
   * - `height`: a drill driver's, base to head top.
   * - `width`: a drill driver's head or a trowel's blade, across.
   * - `bowl`: a ladle's bowl, across.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "gripDiameter"
    | "blade"
    | "height"
    | "width"
    | "bowl"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tool. */
    kind: Kind;

    /** The model's id, unique in a scene; `tool` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = TOOL_BANDS;
}
