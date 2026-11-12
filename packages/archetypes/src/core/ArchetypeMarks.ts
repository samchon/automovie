import type { IAutoMovieMark } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";

/**
 * An archetype's affordances as inspection marks, so a still shows where each contact sits, which way it faces and how far it extends.
 *
 * Each affordance gives an arrow from its frame's origin along `+Y`, the way out of the contact, and, where its kind has an extent, the outline of that extent: a line for a `handle`, `bar`, `ledge`, `rein` and `stirrup`, a rectangle for a `seat`, `surface`, `pedal` and `aperture`, a circle for a `wheel`'s rim, a spoke for a `crank`'s arm and a line along its run for a `slider`. The marks are grouped by kind (`affordance/seat`, `affordance/hinge`, ...) so a request selects and colours them by kind, and each is named `<path>/affordance/<id>` so a pattern on the archetype selects them with it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each mark draws, how marks are grouped and how they are named.
 * @evidence contracts/development/design.md#principled-representation Plain `IAutoMovieMark` data in the model's placed space, the form the shared inspection instrument draws for any owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; the archetypes own it because they own what an affordance's fields mean.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The outline is computed from the same fields the sites read, so a mark cannot show an extent a site does not have.
 */
export namespace ArchetypeMarks {
  /** Default length of the arrow along `+Y`, metres: readable on furniture and larger things. */
  export const ARROW: number = 0.12;

  /**
   * The marks of affordances.
   *
   * @param path The inspection path of the archetype's object, such as `chair`.
   * @param affordances The affordances, their frames in the model's space.
   * @param placement The archetype's placement in the world, with unit scale; at the origin when absent.
   * @param arrow The length of each arrow, metres; `ARROW` when absent. A caller drawing something small passes a shorter one so the arrows do not hide it.
   * @returns Two marks per affordance with an extent, one per point contact, in world coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the path, the placement's premise and the count of marks.
   * @evidence contracts/development/implementation.md#principled-implementation Each outline is the kind's extent in the frame's coordinates, carried to the world through the placed frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arrow, then one outline by kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent dimension gives no outline rather than a guessed one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in affordances; a rim takes a fixed 24 points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computed per drawn state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    path: string,
    affordances: readonly IAutoMovieAffordance[],
    placement?: IAutoMovieTransform,
    arrow: number = ARROW,
  ): IAutoMovieMark[] {
    const marks: IAutoMovieMark[] = [];
    for (const affordance of affordances) {
      const frame: IAutoMovieTransform =
        placement === undefined
          ? affordance.frame
          : ArchetypeFrame.compose(placement, affordance.frame);
      const base: Omit<IAutoMovieMark, "shape"> = {
        path: `${path}/affordance/${affordance.id}`,
        kind: `affordance/${affordance.kind}`,
        label: `${affordance.kind} affordance`,
        color: COLORS[affordance.kind],
        flagged: false,
        anchor: null,
      };
      const at = (x: number, y: number, z: number): number[] => {
        const p: IAutoMovieVector3 = ArchetypeFrame.point(frame, { x, y, z });
        return [p.x, p.y, p.z];
      };
      const out: IAutoMovieVector3 = ArchetypeFrame.axis(frame, "y");
      marks.push({
        ...base,
        shape: {
          type: "arrows",
          origins: at(0, 0, 0),
          vectors: [out.x * arrow, out.y * arrow, out.z * arrow],
        },
      });

      const length: number | undefined = affordance.length;
      const width: number | undefined = affordance.width;
      const depth: number | undefined = affordance.depth;
      const kind: IAutoMovieAffordance["kind"] = affordance.kind;
      const loop = (corners: number[][]): void => {
        marks.push({
          ...base,
          shape: { type: "polyline", points: corners.flat(), closed: true },
        });
      };
      if (
        length !== undefined &&
        (kind === "handle" ||
          kind === "bar" ||
          kind === "ledge" ||
          kind === "rein")
      )
        marks.push({
          ...base,
          shape: {
            type: "segments",
            points: [...at(-length / 2, 0, 0), ...at(length / 2, 0, 0)],
          },
        });
      else if (kind === "stirrup" && width !== undefined)
        marks.push({
          ...base,
          shape: {
            type: "segments",
            points: [...at(-width / 2, 0, 0), ...at(width / 2, 0, 0)],
          },
        });
      else if (kind === "seat" && width !== undefined && depth !== undefined)
        loop([
          at(-width / 2, 0, 0),
          at(width / 2, 0, 0),
          at(width / 2, 0, -depth),
          at(-width / 2, 0, -depth),
        ]);
      else if (
        (kind === "surface" || kind === "pedal") &&
        width !== undefined &&
        depth !== undefined
      )
        loop([
          at(-width / 2, 0, -depth / 2),
          at(width / 2, 0, -depth / 2),
          at(width / 2, 0, depth / 2),
          at(-width / 2, 0, depth / 2),
        ]);
      else if (
        kind === "aperture" &&
        width !== undefined &&
        affordance.height !== undefined
      )
        loop([
          at(-width / 2, 0, 0),
          at(width / 2, 0, 0),
          at(width / 2, affordance.height, 0),
          at(-width / 2, affordance.height, 0),
        ]);
      else if (kind === "wheel" && affordance.radius !== undefined) {
        const radius: number = affordance.radius;
        loop(
          Array.from({ length: 24 }, (_: unknown, k: number): number[] =>
            at(
              radius * Math.cos((Math.PI * k) / 12),
              0,
              radius * Math.sin((Math.PI * k) / 12),
            ),
          ),
        );
      } else if (kind === "crank" && affordance.radius !== undefined)
        marks.push({
          ...base,
          shape: {
            type: "segments",
            points: [...at(0, 0, 0), ...at(affordance.radius, 0, 0)],
          },
        });
      else if (kind === "slider" && affordance.travel !== undefined)
        marks.push({
          ...base,
          shape: {
            type: "segments",
            points: [...at(0, 0, 0), ...at(affordance.travel, 0, 0)],
          },
        });
    }
    return marks;
  }
}

/** The default colour of each affordance kind's marks, sRGB hex; distinct, as the instrument requires of kinds drawn together. */
const COLORS: Readonly<Record<IAutoMovieAffordance["kind"], number>> = {
  "stack-top": 0x1f77b4,
  handle: 0xd62728,
  socket: 0x9467bd,
  hook: 0x8c564b,
  seat: 0x2ca02c,
  surface: 0x17becf,
  bar: 0xff7f0e,
  ledge: 0xbcbd22,
  hinge: 0xe377c2,
  slider: 0x7f7f7f,
  knob: 0xaec7e8,
  button: 0xffbb78,
  trigger: 0x98df8a,
  crank: 0xff9896,
  wheel: 0xc5b0d5,
  pedal: 0xc49c94,
  stirrup: 0xf7b6d2,
  rein: 0xdbdb8d,
  aperture: 0x9edae5,
};
