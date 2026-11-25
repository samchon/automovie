import { createInstrument } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGuitarNote,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanRefusal,
  guitarNote,
  resolveGuitarStringContact,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few products, metres. */
const ROUNDING: number = 1e-12;

/**
 * `guitarNote.plan` admits a stopped note before any hand is moved: its times
 * must rise strictly from entry to clearance (`0 < stopAt < pluckAt < releaseAt
 * < duration`), both hands must be free, and the guitar must stand fixed on its
 * own support.
 *
 * Scenarios, the average man at the origin and a guitar fixed ahead of him,
 * stopping `string2` at `fret5`:
 *
 * 1. A pluck before the stop is refused on `stopAt` as a parameter.
 * 2. A hand that holds something is refused on `hands` as a channel.
 * 3. A guitar that is not fixed is refused on `prop` as an affordance.
 * 4. Where a fret crosses a string (`resolveGuitarStringContact`), on two 0.6 m
 *    strings 10 mm apart: the stop at (0.1, 0, 0), the pluck over the
 *    soundboard's centre at (0.5, 0, 0), the normal +Y, the sweep half the
 *    spacing along -Z; a fret missing the string, a guitar without the fret and
 *    a single string are refused on `fret`, `prop` and `string`.
 *
 * The body is built whole (`humanFixtureBody`) for the context's entry.
 */
export async function test_unit_motions_handling_guitar_note(): Promise<void> {
  // The context's entry reads the whole body's stance.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const guitar: IAutoMovieMotionHumanProp = HumanObject.prop(
    "instrument",
    createInstrument({ kind: "guitar" }),
    {
      position: { x: -0.06, y: 1, z: 0.4 },
      rotation: Quaternion.identity(),
      fixed: true,
    },
  );
  const params: IAutoMovieMotionHumanGuitarNote = {
    prop: "instrument",
    fret: "fret5",
    string: "string2",
    stopAt: 0.5,
    pluckAt: 0.9,
    releaseAt: 1.3,
    duration: 1.6,
  };
  const refusal = (
    of: IAutoMovieMotionHumanGuitarNote,
    options: motionActionContext.IOptions,
  ): HumanRefusal | undefined => {
    try {
      guitarNote.plan(motionActionContext(body, of, options));
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  const early = refusal({ ...params, pluckAt: 0.4 }, { props: [guitar] });
  const busy = refusal(params, { props: [guitar], holds: { left: "pick" } });
  const loose = refusal(params, { props: [{ ...guitar, fixed: false }] });
  TestValidator.predicate(
    "the admissions",
    early?.kind === "parameter" &&
      early.axis === "stopAt" &&
      busy?.kind === "channel" &&
      busy.axis === "hands" &&
      loose?.kind === "affordance" &&
      loose.axis === "prop",
  );

  // 4. Where a fret crosses a string (`resolveGuitarStringContact`): two 0.6 m
  // strings along X centred at x = 0.3 m, 10 mm apart, a 60 mm fret along -Z
  // at x = 0.1 m and the soundboard's centre at x = 0.5 m.
  const bar = (
    id: string,
    at: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    length: number,
  ): IAutoMovieAffordance => ({
    id,
    kind: "bar",
    frame: { translation: at, rotation, scale: { x: 1, y: 1, z: 1 } },
    extent: null,
    length,
  });
  const along: IAutoMovieQuaternion = Quaternion.identity();
  const across: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const board: IAutoMovieAffordance = {
    id: "body",
    kind: "surface",
    frame: {
      translation: { x: 0.5, y: 0, z: 0 },
      rotation: along,
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  };
  const strings: IAutoMovieAffordance[] = [
    bar("string1", { x: 0.3, y: 0, z: 0 }, along, 0.6),
    bar("string2", { x: 0.3, y: 0, z: 0.01 }, along, 0.6),
  ];
  const fret: IAutoMovieAffordance = bar(
    "fret1",
    { x: 0.1, y: 0, z: 0.005 },
    across,
    0.06,
  );
  const sites: ReturnType<typeof resolveGuitarStringContact> =
    resolveGuitarStringContact({ fret: "fret1", string: "string1" }, [
      ...strings,
      fret,
      board,
    ]);
  TestValidator.predicate(
    "the sites",
    vclose(sites.stop, { x: 0.1, y: 0, z: 0 }, ROUNDING) &&
      vclose(sites.pluck, { x: 0.5, y: 0, z: 0 }, ROUNDING) &&
      vclose(sites.normal, { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(sites.sweep, { x: 0, y: 0, z: -0.005 }, ROUNDING),
  );
  const unsited = (affordances: IAutoMovieAffordance[]): string => {
    try {
      resolveGuitarStringContact(
        { fret: "fret1", string: "string1" },
        affordances,
      );
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "the site refusals",
    [
      unsited([
        ...strings,
        bar("fret1", { x: 0.9, y: 0, z: 0.005 }, across, 0.06),
        board,
      ]),
      unsited([...strings, board]),
      unsited([strings[0]!, fret, board]),
    ],
    ["fret", "prop", "string"],
  );
}
