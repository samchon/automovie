import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  type IArchetypeBand,
} from "../core";
import { STORAGE_BANDS } from "./STORAGE_BANDS";
import { StorageConstruction } from "./StorageConstruction";

/** The name each kind's model carries. */
const NAMES: Readonly<Record<createStorage.Kind, string>> = {
  wardrobe: "wardrobe",
  chest: "chest of drawers",
  filingCabinet: "filing cabinet",
  locker: "locker",
  bookcase: "bookcase",
};

/**
 * A storage cabinet: a wardrobe with two hinged doors, a chest of three drawers, a four-drawer filing cabinet, a steel locker or an open bookcase.
 *
 * The cabinet stands on the floor at the origin with its front toward `+Z`. Its doors and drawers are parts on their articulations: a wardrobe door turns out about its outer edge, a drawer slides out toward `+Z` with the box behind its front, and each carries its pull. The `push` face on the `+X` side is where the cabinet is pushed when it is moved. `StorageConstruction` builds each kind and says what the locker and the bookcase add.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cabinet.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, what moves, where the cabinet is pushed and where each kind is described.
 * @evidence contracts/development/implementation.md#principled-implementation Draws the kind's bands and hands the dimensions to its construction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then the kind's construction.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The constructions own every shape.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work over the construction's.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createStorage(
  params: createStorage.IParams,
  seed?: number | string,
): Archetype<createStorage.Affordance, createStorage.Dimension> {
  const kind: createStorage.Kind = ArchetypeDraw.choice(
    "storage",
    "kind",
    params.kind,
    createStorage.KINDS,
  );
  const d: Partial<Record<createStorage.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "storage",
      createStorage.BANDS[kind],
      seed,
      params,
      createStorage.BANDS,
    );
  const builder: ArchetypeBuilder<
    createStorage.Affordance,
    createStorage.Dimension
  > = new ArchetypeBuilder({
    archetype: "storage",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  if (kind === "chest" || kind === "filingCabinet")
    StorageConstruction.drawers(builder, d, StorageConstruction.DRAWERS[kind]);
  else StorageConstruction[kind](builder, d);
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createStorage}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind; drawers, pulls and shelves are numbered from the bottom.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pulls' heights and the travel an opening act reads, the face a push meets, and the shelves things are set on (#3370, #3371, #3468 N16).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A slider's `+X` is its travel and a grip's `+X` is the bar the hand wraps, which differ on a drawer, so the slide and the pull are two affordances and neither frame is bent to serve both.
 */
export namespace createStorage {
  /** The kinds of cabinet. */
  export type Kind =
    | "wardrobe"
    | "chest"
    | "filingCabinet"
    | "locker"
    | "bookcase";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "wardrobe",
    "chest",
    "filingCabinet",
    "locker",
    "bookcase",
  ];

  /**
   * The affordance ids:
   *
   * - `push`: the `+X` side face, pushed to move the cabinet.
   * - `top`: the upper face.
   * - `leftDoor`, `rightDoor`: a wardrobe's door hinges on `+X` and `-X`.
   * - `leftPull`, `rightPull`: the doors' pulls, each riding its hinge.
   * - `drawer1` upward: a chest's or a filing cabinet's drawers from the bottom, each a slider running out along `+Z`.
   * - `pull1` upward: a chest's drawer pulls, each riding its slider.
   * - `door`: a locker's door hinge on its `-X` edge.
   * - `shelf1` upward: a bookcase's shelves from the bottom, each a `stack-top`.
   */
  export type Affordance =
    | "push"
    | "top"
    | "leftDoor"
    | "rightDoor"
    | "leftPull"
    | "rightPull"
    | "door"
    | `drawer${number}`
    | `pull${number}`
    | `shelf${number}`;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: the cabinet along `+X`, `+Y` and `+Z`; a locker's height is its body's, above its legs.
   * - `pullHeight`: a wardrobe's door pulls above the floor.
   * - `swing`: how far a wardrobe door opens, degrees.
   * - `travel`: how far a drawer slides out.
   * - `legs`: a locker's legs.
   * - `mass`: the empty cabinet, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "depth"
    | "pullHeight"
    | "swing"
    | "travel"
    | "legs"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which cabinet. */
    kind: Kind;

    /** The model's id, unique in a scene; `storage` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = STORAGE_BANDS;
}
