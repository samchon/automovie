import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";

/**
 * Which part of a Human a change touches, and what a consumer must redo for it.
 *
 * A Human splits into an immutable prepared shape and per-instance state. The
 * shape is everything `AutoMovieHuman.generate` reads: body, head, extremity,
 * appearance and pigmentation fields. An instance holds the pose,
 * the expression and the root placement, and a viewer adds the camera. A
 * change is classified by the first segment of each changed leaf path, and its
 * effect says what is invalid afterwards:
 *
 * - `shape`: the calibration, so the skeleton, the rig, the binding and every
 *   part. A new prepared shape is required and a pose carried across it is
 *   re-evaluated on the new skeleton.
 * - `geometry`: appearance meshes or vertex attributes on an unchanged
 *   skeleton (hair cards, brow and lash strands, garments, the skin's seeded
 *   vertex colour, melanin and haemoglobin baked into vertex colour).
 * - `material`: only materials or images (hair, brow, lash and garment colour,
 *   iris colour, the skin's oiliness and wrinkle relief scale, and the seeded
 *   skin marks image). The generator has no material-only entry, so a new
 *   prepared shape is still generated, but geometry, skeleton and binding are
 *   unchanged by the change itself.
 * - `articulation`, `expression`, `placement`, `view`: instance or viewer
 *   state, applied without touching the prepared shape.
 *
 * The field-to-effect table was read from the generator's consumers
 * (`AutoMovieHumanSkin`, `AutoMovieHumanAppearance`, the hair, brow, lash and
 * garment builders); a field the table does not name falls to the
 * conservative effect of its class (`shape` for anatomy, `geometry` for
 * appearance and pigmentation), so an unknown field can over-invalidate but
 * never leave a stale shape.
 */
export namespace AutoMovieHumanChange {
  /** The dirty classes of a Human and its display. */
  export type Class =
    | "body"
    | "head"
    | "extremities"
    | "appearance"
    | "pigmentation"
    | "pose"
    | "expression"
    | "root"
    | "camera";

  /** What a change invalidates; see the namespace comment. */
  export type Effect =
    | "shape"
    | "geometry"
    | "material"
    | "articulation"
    | "expression"
    | "placement"
    | "view";

  /** One changed leaf. */
  export interface IChange {
    /** Dotted path of the changed field, such as `appearance.hair.color`. */
    path: string;

    /** Its dirty class. */
    class: Class;

    /** What it invalidates. */
    effect: Effect;
  }

  /**
   * Every changed leaf between two parameter sets, classified.
   *
   * Leaves are compared by value: numbers and strings by identity, arrays as
   * whole values through their JSON text, and a field present on one side only
   * is a change at its own path. Pose and expression are reported here too, so
   * a caller holding parameters learns that only instance state moved.
   *
   * @param previous Parameters the current shape and state came from.
   * @param next Requested parameters.
   * @returns The changes in path order; empty when the two are equal.
   */
  export function classify(
    previous: IAutoMovieHumanParameters,
    next: IAutoMovieHumanParameters,
  ): IChange[] {
    const paths: string[] = [];
    differ(previous, next, "", paths);
    return paths
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .map((path: string): IChange => ({ path, ...effect(path) }));
  }

  /**
   * Whether a set of changes needs a new prepared shape.
   *
   * @param changes Output of {@link classify}.
   * @returns True when any change is a shape, geometry or material change.
   */
  export function reshapes(changes: readonly IChange[]): boolean {
    return changes.some(
      (change: IChange): boolean =>
        change.effect === "shape" ||
        change.effect === "geometry" ||
        change.effect === "material",
    );
  }

  /**
   * Whether a set of changes moves the skeleton and every vertex, so a pose
   * carried across it must be evaluated again on the new skeleton.
   *
   * @param changes Output of {@link classify}.
   * @returns True when any change is a shape change.
   */
  export function rebinds(changes: readonly IChange[]): boolean {
    return changes.some(
      (change: IChange): boolean => change.effect === "shape",
    );
  }

  /**
   * Class and effect of one leaf path.
   *
   * @param path Dotted path inside `IAutoMovieHumanParameters`.
   */
  export function effect(path: string): Pick<IChange, "class" | "effect"> {
    const head: string = path.split(".")[0]!;
    switch (head) {
      case "body":
      case "head":
      case "extremities":
        return { class: head, effect: "shape" };
      case "pose":
        return { class: "pose", effect: "articulation" };
      case "expression":
        return { class: "expression", effect: "expression" };
      case "appearance":
        return {
          class: "appearance",
          effect: MATERIAL.some((pattern: RegExp): boolean =>
            pattern.test(path),
          )
            ? "material"
            : "geometry",
        };
      case "pigmentation":
        return {
          class: "pigmentation",
          effect: path === "pigmentation.iris" ? "material" : "geometry",
        };
      default:
        throw new Error(`Unknown Human parameter field: ${path}`);
    }
  }
}

/**
 * Appearance leaves that reach only a material or an image: the strand and
 * fabric colours select material colours, oiliness and wrinkles the skin
 * material's specular and relief scale, and freckles, moles and acne the
 * seeded marks image.
 */
const MATERIAL: readonly RegExp[] = [
  /^appearance\.hair\.color$/,
  /^appearance\.browPair\.(left|right)\.color$/,
  /^appearance\.lashPair\.(left|right)\.color$/,
  /^appearance\.underwear\.color$/,
  /^appearance\.skin\.(oiliness|wrinkles)$/,
  /^appearance\.skin\.(freckles|moles|acne)(\..*)?$/,
];

/** Collect the leaf paths where two plain values differ. */
function differ(a: unknown, b: unknown, prefix: string, out: string[]): void {
  if (isRecord(a) && isRecord(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      differ(a[key], b[key], prefix === "" ? key : prefix + "." + key, out);
    return;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(prefix);
    return;
  }
  if (!Object.is(a, b)) out.push(prefix);
}

/** A plain object that is not an array. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
