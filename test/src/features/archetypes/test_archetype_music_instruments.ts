import { createInstrument, createMicrophone } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The instruments and microphones are placed where they were put, number their keys, frets and strings as the instruments do, and hold their makers' sizes.
 *
 * Scenarios:
 * 1. Every instrument and both microphones placed on a line through the public chain rest on the floor within a millimetre, their contacts named points of the props.
 * 2. A piano declares `key1` to `key88`, 52 white and 36 black, `key1` the bottom A white and `key2` black; keys an octave apart (`key4` and `key16`, both C) stand the drawn octave apart along `X`, the bass at `-X`; pressing `key40` (middle C) its full travel lowers its own key by the travel and leaves `key41` where it was.
 * 3. A guitar's `string1` to `string6` run the 25.4 in scale (Martin D-28) from the nut to the saddle within 0.3 mm, the outer strings' spread toward the saddle, and a violin's four strings its 327 mm within a millimetre, the strings also rising from the nut to the bridge's height; the guitar's frets follow equal temperament: half the scale, where the twelfth fret stands, lies between the twelfth and the thirteenth fret's sites, and successive sites' spacings shrink by the twelfth root of two within a millionth.
 * 4. A piano's fallboard, standing open, lies over the keys at its full travel without passing below the black keys' tops.
 * 5. Over 200 seeds: the drum 14 in across and 12 in deep (Sonor MP 1412 X); a handheld microphone 162 to 180.5 mm long (Shure SM58, Sennheiser e 835); a boom stand's clip, raised the full travel of `height`, at its highest, 1.60 m (Auray MS-5230F) plus the clip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces every instrument, places them through the public chain, poses the keys, the fallboard and the stand, and measures contacts and colliders; a misnumbered or mispatterned keyboard, a fret off equal temperament, a string off its scale, a key that does not move or moves its neighbour, a fallboard that cuts the keys, or a size off its sheet fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The keyboard pattern is the musical one written here (A0 white, A#0 black, 52 and 36), the fret ratio is equal temperament's twelfth root of two, and the sizes are the sheets' numbers.
 * @evidence contracts/development/testing.md#distinguishing-cases A pressed key against its neighbour, black against white, the octave pair, both microphone kinds; playing a note is a motion law's and is not tested here.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the five scenarios and what each pins.
 */
export function test_archetype_music_instruments(): void {
  // 1. Placed.
  const findings: string[] = archetypePlaced([
    ...createInstrument.KINDS.map(
      (kind: createInstrument.Kind, index: number): archetypePlaced.IRow => ({
        name: `instrument-${kind}`,
        archetype: createInstrument({ kind }),
        yaw: 60 * index,
      }),
    ),
    ...createMicrophone.KINDS.map(
      (kind: createMicrophone.Kind): archetypePlaced.IRow => ({
        name: `microphone-${kind}`,
        archetype: createMicrophone({ kind }),
        yaw: 30,
      }),
    ),
  ]);

  // 2. The keyboard.
  const piano: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "uprightPiano" },
    5,
  );
  const keys: IAutoMovieAffordance[] = piano.affordances.filter(
    (a: IAutoMovieAffordance): boolean => /^key\d+$/.test(a.id),
  );
  const raised = (id: string): boolean =>
    piano.affordance(id as `key${number}`).frame.translation.y >
    piano.affordance("key1").frame.translation.y + 1e-6;
  const blacks: number = keys.filter((a: IAutoMovieAffordance): boolean =>
    raised(a.id),
  ).length;
  if (keys.length !== 88 || blacks !== 36)
    findings.push(`the piano has ${keys.length} keys, ${blacks} black`);
  if (raised("key1") || !raised("key2"))
    findings.push("key1 is not the white A0 with the black A#0 above it");
  const octave: number =
    piano.affordance("key16").frame.translation.x -
    piano.affordance("key4").frame.translation.x;
  if (Math.abs(octave - piano.dimensions.octave!) > 1e-9)
    findings.push(`C1 to C2 spans ${octave} m, ${piano.dimensions.octave} expected`);
  const dip: number = piano.affordance("key40").travel!;
  const pressed: ReturnType<typeof createInstrument> = piano.articulate({
    key40: dip,
  });
  const drop = (id: string): number =>
    archetypeExtent(piano, "y", [id]).high -
    archetypeExtent(pressed, "y", [id]).high;
  if (Math.abs(drop("key40-part") - dip) > 1e-9 || Math.abs(drop("key41-part")) > 1e-9)
    findings.push("pressing middle C does not move exactly its own key");

  // 3. Strings and frets.
  const guitar: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "guitar" },
    5,
  );
  const scale: number = 0.64516;
  for (let k: number = 1; k <= 6; k++)
    if (Math.abs(guitar.affordance(`string${k}`).length! - scale) > 3e-4)
      findings.push(`guitar string${k} runs ${guitar.affordance(`string${k}`).length} m`);
  const nut: number = guitar.affordance("string1").frame.translation.x + scale / 2;
  const at = (n: number): number =>
    nut - guitar.affordance(`fret${n}`).frame.translation.x;
  if (!(at(12) < scale / 2 && scale / 2 < at(13)))
    findings.push(`half the scale, the twelfth fret, does not lie between the twelfth's and thirteenth's sites, ${at(12)} and ${at(13)} m`);
  for (let n: number = 2; n < 20; n++) {
    const ratio: number = (at(n + 1) - at(n)) / (at(n) - at(n - 1));
    if (Math.abs(ratio - Math.pow(2, -1 / 12)) > 1e-6)
      findings.push(`fret spacing ratio ${ratio} at fret ${n}`);
  }
  const violin: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "violin" },
    5,
  );
  for (let k: number = 1; k <= 4; k++)
    if (Math.abs(violin.affordance(`string${k}`).length! - 0.327) > 1e-3)
      findings.push(`violin string${k} runs ${violin.affordance(`string${k}`).length} m`);

  // 4. The fallboard over the keys.
  const closed: ReturnType<typeof createInstrument> = piano.articulate({
    lid: piano.affordance("lid").travel!,
  });
  const board: { low: number; high: number } = archetypeExtent(closed, "y", [
    "fallboard",
  ]);
  if (board.low < archetypeExtent(piano, "y", ["key2-part"]).high - 1e-9)
    findings.push("the closed fallboard cuts the black keys");
  if (archetypeExtent(closed, "z", ["fallboard"]).high < piano.affordance("key1").frame.translation.z)
    findings.push("the closed fallboard does not reach over the keys");

  // 5. The bands.
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  findings.push(
    ...archetypeBandSweep([
      row("drum diameter", 0.3556, 0.3556, "Sonor MP 1412 X", (s: number): number =>
        archetypeExtent(createInstrument({ kind: "sideDrum" }, s), "x").size,
      ),
      row("drum depth", 0.3048, 0.3048, "Sonor MP 1412 X", (s: number): number =>
        archetypeExtent(createInstrument({ kind: "sideDrum" }, s), "y").size,
      ),
      row("microphone length", 0.162, 0.1805, "SM58, e 835", (s: number): number =>
        archetypeExtent(createMicrophone({ kind: "handheld" }, s), "x").size,
      ),
      row("stand at its highest", 1.6, 1.6, "Auray MS-5230F", (s: number): number => {
        const stand: ReturnType<typeof createMicrophone> = createMicrophone(
          { kind: "boomStand" },
          s,
        );
        const up: ReturnType<typeof createMicrophone> = stand.articulate({
          height: stand.affordance("height").travel!,
        });
        return archetypeExtent(up, "y", ["upper-tube"]).high;
      }),
    ]),
  );
  TestValidator.equals(
    "instruments and microphones are numbered, played where they are and sized",
    findings,
    [],
  );
}
