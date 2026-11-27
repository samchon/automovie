import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import type { AutoMovieArchetypeInstrument } from "./AutoMovieArchetypeInstrument";

/** The builder every construction fills. */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeInstrument.Affordance,
  AutoMovieArchetypeInstrument.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<AutoMovieArchetypeInstrument.Dimension, number>>;

/** The shorthand every construction uses. */
const v: typeof Vector3.create = Vector3.create;

/** Brass. */
const BRASS: string = "#c9a227";

/**
 * How {@link createInstrument} builds the instruments a marching column carries:
 * a side drum and a bugle.
 */
export namespace MarchingConstruction {
  /**
   * The construction sizes no source read gives, metres, each an estimate no
   * act reads and no band declares: `tube`, a bugle's tube diameter; `flare`,
   * its bell's depth.
   */
  export const ESTIMATES: Readonly<{
    tube: number;
    flare: number;
  }> = {
    tube: 0.013,
    flare: 0.06,
  };

  /**
   * A side drum standing on its bottom head: the shell as one cylinder of the
   * drawn diameter and depth.
   *
   * `head` is the batter head on top, the surface the sticks strike; `sling`
   * the hook on the shell's side at its top edge, where a sling or a carrier
   * holds it.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
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
      frame: AutoMovieArchetypeFrame.upright(v(0, depth, 0)),
      extent: null,
      width: 2 * radius,
      depth: 2 * radius,
    });
    builder.affordance({
      id: "sling",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(v(radius, depth, 0)),
      extent: null,
    });
  }

  /**
   * A bugle lying on its side: two straight runs of tube along `X` joined at
   * both ends, the bell on the lower run's `+X` end and the mouthpiece on the
   * upper run's `-X` end.
   *
   * `grip` is the upper run's middle, where a hand holds it; `mouthpiece` the
   * mouthpiece's rim, a socket whose `+Y` points back out along `-X` toward the
   * lips.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   */
  export function bugle(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const length: number = d.length!;
    const bell: number = d.bell! / 2;
    const r: number = E.tube / 2;
    const y: number = bell;
    const back: number = -length / 2;
    const front: number = length / 2 - E.flare;
    const lower: number = -bell;
    const upper: number = bell;
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
      frame: AutoMovieArchetypeFrame.facing(
        v((back + front) / 2, y, upper),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
    });
    builder.affordance({
      id: "mouthpiece",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(back - r, y, upper),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
    });
  }
}
