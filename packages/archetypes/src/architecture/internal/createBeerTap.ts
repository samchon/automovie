import { AutoMovieArchetypeBeerTap } from "../AutoMovieArchetypeBeerTap";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeUnits } from "../../core";

/*
 * A two-faucet beer tower on a bar counter: a column on a round base under a
 * tee head, a standard faucet out of each side of the head's front.
 *
 * The counter is the `XZ` plane, the tower's base centred on the origin, the
 * faucets facing the bartender at `+Z`, spaced along `X`. Each faucet's shank
 * leaves the head's front face at the head's middle height; its spout hangs the
 * maker's drop under the shank and its lever stud rises over the spout.
 * `leftSpout` and `rightSpout` are the spouts' tips, sockets facing down, under
 * which a glass is held; `leftTap` and `rightTap` are the lever studs' tops,
 * where a tap handle screws on and a hand pulls it. The tap handle itself is
 * not built, and the levers state no travel: no source read gives a handle's
 * length or throw.
 * Parameter params: Any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The tower.
 * For a fixed dimension outside its band.
 */
export function createBeerTap(
  params: AutoMovieArchetypeBeerTap.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBeerTap.Affordance, AutoMovieArchetypeBeerTap.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBeerTap.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBeerTap.Dimension>(
      "beerTap",
      AutoMovieArchetypeBeerTap.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeBeerTap.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeBeerTap.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBeerTap.Affordance,
    AutoMovieArchetypeBeerTap.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "beer tower",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const chrome: string = "#c9ccd1";
  const middle: number = TOWER.height - TOWER.head / 2;
  const half: number = (TOWER.spacing + TOWER.head) / 2;
  builder.rod("base", TOWER.base / 2, v(0, 0, 0), v(0, E.plate, 0), {
    color: chrome,
  });
  builder.rod("column", TOWER.column / 2, v(0, E.plate, 0), v(0, middle, 0), {
    color: chrome,
  });
  builder.rod("head", TOWER.head / 2, v(-half, middle, 0), v(half, middle, 0), {
    color: chrome,
  });
  const face: number = TOWER.head / 2;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = (sign * TOWER.spacing) / 2;
    const spout: number = face + FAUCET.spout;
    const tip: number = middle - FAUCET.drop;
    const top: number = tip + FAUCET.stud;
    builder.rod(
      `${side}-body`,
      E.body / 2,
      v(x, middle, face),
      v(x, middle, face + FAUCET.length),
      { color: chrome },
    );
    builder.rod(
      `${side}-spout`,
      E.body / 2,
      v(x, tip, spout),
      v(x, middle, spout),
      {
        color: chrome,
      },
    );
    builder.rod(
      `${side}-stud`,
      E.stud / 2,
      v(x, middle, spout),
      v(x, top, spout),
      {
        color: chrome,
      },
    );
    builder.affordance({
      id: side === "left" ? "leftSpout" : "rightSpout",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, tip, spout),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: side === "left" ? "leftTap" : "rightTap",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, top, spout),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
    });
  }
  return builder.build(d.mass);
}

/*
 * The tower's sizes, metres, from Perlick's air-cooled tee tower EA2110 sheet:
 * `height`, the counter to the top of the head, 12 15/16 in; `column`, 4 5/8 in
 * across; `base`, 6 in across; `head`, the tee head's depth, 6 7/16 in; and
 * `spacing`, the faucets' centres 5-1/2 in apart on a two-faucet tower
 * (https://api.perlick.com/Data/PDFFiles//EA2110-6Bfba2768c662b1c0d5b52433686318804b7918c83_Z2459_Air_Cooled_Tee_Towers_Spec_Rev_07_12_24.pdf).
 */
const TOWER: Readonly<{
  height: number;
  column: number;
  base: number;
  head: number;
  spacing: number;
}> = {
  height: (12 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
  column: (4 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
  base: 6 * AutoMovieArchetypeUnits.INCH,
  head: (6 + 7 / 16) * AutoMovieArchetypeUnits.INCH,
  spacing: 5.5 * AutoMovieArchetypeUnits.INCH,
};

/*
 * A faucet's sizes, metres, from Micro Matic's 4933 standard faucet drawing:
 * `length`, 62.67 mm from the shank's face; `spout`, the spout 44.03 mm out
 * from the shank's face; `drop`, the spout's tip 42.15 mm under the shank's
 * centre; and `stud`, the lever stud's top 97.64 mm over the spout's tip
 * (https://res.katom.com/products/711/711-4933BR/711-4933BR.pdf).
 */
const FAUCET: Readonly<{
  length: number;
  spout: number;
  drop: number;
  stud: number;
}> = {
  length: 62.67 * AutoMovieArchetypeUnits.MILLIMETRE,
  spout: 44.03 * AutoMovieArchetypeUnits.MILLIMETRE,
  drop: 42.15 * AutoMovieArchetypeUnits.MILLIMETRE,
  stud: 97.64 * AutoMovieArchetypeUnits.MILLIMETRE,
};

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `plate`, the base plate's thickness; `body`, a
 * faucet body's diameter; `stud`, the lever stud's diameter.
 */
const ESTIMATES: Readonly<{ plate: number; body: number; stud: number }> = {
  plate: 0.01,
  body: 0.025,
  stud: 0.01,
};
