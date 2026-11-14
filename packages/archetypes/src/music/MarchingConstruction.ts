import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createInstrument } from "./createInstrument";

/** The builder every construction fills. */
type Builder = ArchetypeBuilder<
  createInstrument.Affordance,
  createInstrument.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<createInstrument.Dimension, number>>;

/** The shorthand every construction uses. */
const v: typeof Vector3.create = Vector3.create;

/** Brass. */
const BRASS: string = "#c9a227";

/**
 * How {@link createInstrument} builds the instruments a marching column carries: a side drum and a bugle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace builds.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives from named dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two constructions and the estimates they read; read only by `createInstrument`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every size no source gives is a named estimate here.
 */
export namespace MarchingConstruction {
  /**
   * The sizes no source read gives, metres, each an estimate: `hoop`, how far a drum's hoops stand above and below its shell; `tube`, a bugle's tube diameter; `coil`, the distance between its two straight runs; `flare`, its bell's depth.
   */
  export const ESTIMATES: Readonly<{
    hoop: number;
    tube: number;
    coil: number;
    flare: number;
  }> = {
    hoop: 0.01,
    tube: 0.013,
    coil: 0.07,
    flare: 0.06,
  };

  /**
   * A side drum standing on its bottom head: the shell as one cylinder of the drawn diameter and depth.
   *
   * `head` is the batter head on top, the surface the sticks strike; `sling` the hook on the shell's side by the top, where a sling or a carrier holds it.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the drum stands and its two contacts.
   * @evidence contracts/development/implementation.md#principled-implementation A cylinder of the maker's diameter and depth; the head on its top face, the hook on its `+X` side a hoop's height below the top.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One part, two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No lugs, snares or rims; the hoop's offset is this namespace's estimate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one instrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function sideDrum(builder: Builder, d: Drawn): void {
    const radius: number = d.diameter! / 2;
    const depth: number = d.depth!;
    builder.rod("shell", radius, v(0, 0, 0), v(0, depth, 0), {
      color: "#a3262d",
    });
    builder.affordance({
      id: "head",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, depth, 0)),
      extent: null,
      width: 2 * radius,
      depth: 2 * radius,
    });
    builder.affordance({
      id: "sling",
      kind: "hook",
      frame: ArchetypeFrame.upright(
        v(radius, depth - ESTIMATES.hoop * 4, 0),
      ),
      extent: null,
    });
  }

  /**
   * A bugle lying on its side: two straight runs of tube along `X` joined at both ends, the bell on the lower run's `+X` end and the mouthpiece on the upper run's `-X` end.
   *
   * `grip` is the upper run's middle, where a hand holds it; `mouthpiece` the mouthpiece's rim, a socket whose `+Y` points back out along `-X` toward the lips.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the bugle lies and its two contacts.
   * @evidence contracts/development/implementation.md#principled-implementation The two runs and the bell span the drawn overall length, the bell at the drawn diameter; the runs sit a coil's width apart on the bell's axis height so the bell rests on the table.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Runs, bends, bell, then the two contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One coil stands for the bugle's wound tube; the tube's diameter, the coil's width and the bell's flare are this namespace's estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one instrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bugle(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const length: number = d.length!;
    const bell: number = d.bell! / 2;
    const r: number = E.tube / 2;
    const y: number = bell;
    const back: number = -length / 2;
    const front: number = length / 2 - E.flare;
    const lower: number = -E.coil / 2;
    const upper: number = E.coil / 2;
    builder.rod("run-lower", r, v(back, y, lower), v(front, y, lower), {
      color: BRASS,
    });
    builder.rod("run-upper", r, v(back, y, upper), v(front, y, upper), {
      color: BRASS,
    });
    for (const [id, x] of [
      ["bend-back", back],
      ["bend-front", front],
    ] as const)
      builder.rod(id, r, v(x, y, lower), v(x, y, upper), { color: BRASS });
    builder.rod("bell", bell, v(front, y, lower), v(length / 2, y, lower), {
      color: BRASS,
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v((back + front) / 2, y, upper),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: E.tube,
      length: 0.1,
    });
    builder.affordance({
      id: "mouthpiece",
      kind: "socket",
      frame: ArchetypeFrame.facing(v(back - r, y, upper), v(-1, 0, 0), v(0, 0, 1)),
      extent: null,
    });
  }
}
