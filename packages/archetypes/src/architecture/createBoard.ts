import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The whiteboard read. */
const GHENT_M1: string =
  "Ghent M1 Series spec sheet PSS-M1: 24 to 48 15/32 in high, 36 7/16 to 192 19/32 in wide, a 5/8 in deep frame and a tray projecting 3 1/8 in (https://cdn.shopify.com/s/files/1/0272/6150/1542/files/m1_spec_sheets.pdf)";

/** The whiteboard's mounting read. */
const LETHBRIDGE: string =
  "University of Lethbridge design standard: \"Classroom whiteboards - base to be mounted 915mm above the floor\" (https://ulethbridge.ca/node/9433)";

/** The chalkboard read. */
const CLARIDGE: string =
  "Claridge Series 8 sheet V062226: chalkboards 2 to 4 ft high and 3 to 16 ft wide, about 1/2 in thick overall, a 1 in tray (https://claridgeproducts.com/wp-content/uploads/2023/08/Series8-sheet.pdf)";

/** The notice board read. */
const GHENT_059: string =
  "Ghent 059 Series drawing PSS-059: cork boards 3 x 5, 4 x 4, 4 x 5, 4 x 6 and 4 x 8 ft (H x W), an 11/16 in deep frame (https://www.mybinding.com/cdn/shop/files/Ghent-Premium-Aluminum-Frame-Cork-Bulletin-Board-spec-sheet.pdf)";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `lip`, a tray's lip height. */
const ESTIMATES: Readonly<{ lip: number }> = { lip: 0.02 };

/** The readable name of each kind. */
const NAMES: Readonly<Record<createBoard.Kind, string>> = {
  whiteboard: "whiteboard",
  blackboard: "blackboard",
  noticeBoard: "notice board",
};

/**
 * A wall board: a whiteboard, a blackboard or a cork notice board.
 *
 * The board hangs in the `XY` plane with the wall at `z = 0` behind it and its face toward `+Z`, its bottom edge at the drawn mounting height: a whiteboard at the classroom standard's, the others on the floor's line for a production to raise, since no source read mounts them. `face` is the writing or pinning face, its `+Y` out of the board; a whiteboard's or blackboard's `tray` is its tray's front edge along its foot, a ledge a marker or chalk rests on.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The board.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the board hangs, where each kind is mounted and its contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The makers' sizes, depths and trays; the whiteboard's base at the classroom standard's 915 mm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the board, its tray, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The frame is the board's block; the tray's lip is a construction estimate.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBoard(
  params: createBoard.IParams,
  seed?: number | string,
): Archetype<createBoard.Affordance, createBoard.Dimension> {
  const kind: createBoard.Kind = ArchetypeDraw.choice(
    "board",
    "kind",
    params.kind,
    createBoard.KINDS,
  );
  const d: Partial<Record<createBoard.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "board",
      createBoard.BANDS[kind],
      seed,
      params,
      createBoard.BANDS,
    );
  const builder: ArchetypeBuilder<createBoard.Affordance, createBoard.Dimension> =
    new ArchetypeBuilder({
      archetype: "board",
      id: params.id,
      name: NAMES[kind],
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.depth!;
  const bottom: number = d.mount ?? 0;
  builder.box("board", v(width, height, depth), v(0, bottom + height / 2, depth / 2), {
    color: kind === "whiteboard" ? "#f7f7f7" : kind === "blackboard" ? "#2f4f3f" : "#b98a5a",
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, bottom + height / 2, depth), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width,
    depth: height,
  });
  if (kind !== "noticeBoard") {
    const tray: number = d.tray!;
    builder.box("tray", v(width, ESTIMATES.lip, tray), v(0, bottom, tray / 2), {
      color: "#b9bec4",
    });
    builder.affordance({
      id: "tray",
      kind: "ledge",
      frame: ArchetypeFrame.facing(v(0, bottom + ESTIMATES.lip / 2, tray), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      length: width,
    });
  }
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createBoard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face written or pinned on and the tray a marker rests on (#3468 N6).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A mounting height no source gives is left to the production, not invented.
 */
export namespace createBoard {
  /** The kinds of board. */
  export type Kind = "whiteboard" | "blackboard" | "noticeBoard";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["whiteboard", "blackboard", "noticeBoard"];

  /**
   * The affordance ids:
   *
   * - `face`: the writing or pinning face.
   * - `tray`: a whiteboard's or blackboard's tray front edge, a ledge along `X`.
   */
  export type Affordance = "face" | "tray";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`: the board.
   * - `depth`: its frame off the wall.
   * - `tray`: a tray's projection from the wall.
   * - `mount`: a whiteboard's bottom edge above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "tray" | "mount" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which board. */
    kind: Kind;

    /** The model's id, unique in a scene; `board` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    whiteboard: {
      width: ArchetypeBand.metres((36 + 7 / 16) * ArchetypeUnits.INCH, (192 + 19 / 32) * ArchetypeUnits.INCH, GHENT_M1),
      height: ArchetypeBand.metres(24 * ArchetypeUnits.INCH, (48 + 15 / 32) * ArchetypeUnits.INCH, GHENT_M1),
      depth: ArchetypeBand.metres((5 / 8) * ArchetypeUnits.INCH, (5 / 8) * ArchetypeUnits.INCH, GHENT_M1),
      tray: ArchetypeBand.metres((3 + 1 / 8) * ArchetypeUnits.INCH, (3 + 1 / 8) * ArchetypeUnits.INCH, GHENT_M1),
      mount: ArchetypeBand.metres(915 * ArchetypeUnits.MILLIMETRE, 915 * ArchetypeUnits.MILLIMETRE, LETHBRIDGE),
      mass: ArchetypeBand.of("kg", 5, 40, ArchetypeBand.TYPICAL_MASS, true),
    },
    blackboard: {
      width: ArchetypeBand.metres(3 * ArchetypeUnits.FOOT, 16 * ArchetypeUnits.FOOT, CLARIDGE),
      height: ArchetypeBand.metres(2 * ArchetypeUnits.FOOT, 4 * ArchetypeUnits.FOOT, CLARIDGE),
      depth: ArchetypeBand.metres(0.5 * ArchetypeUnits.INCH, 0.5 * ArchetypeUnits.INCH, CLARIDGE),
      tray: ArchetypeBand.metres(1 * ArchetypeUnits.INCH, 1 * ArchetypeUnits.INCH, CLARIDGE),
      mass: ArchetypeBand.of("kg", 5, 60, ArchetypeBand.TYPICAL_MASS, true),
    },
    noticeBoard: {
      width: ArchetypeBand.metres(4 * ArchetypeUnits.FOOT, 8 * ArchetypeUnits.FOOT, GHENT_059),
      height: ArchetypeBand.metres(3 * ArchetypeUnits.FOOT, 4 * ArchetypeUnits.FOOT, GHENT_059),
      depth: ArchetypeBand.metres((11 / 16) * ArchetypeUnits.INCH, (11 / 16) * ArchetypeUnits.INCH, GHENT_059),
      mass: ArchetypeBand.of("kg", 4, 15, ArchetypeBand.TYPICAL_MASS, true),
    },
  };
}
