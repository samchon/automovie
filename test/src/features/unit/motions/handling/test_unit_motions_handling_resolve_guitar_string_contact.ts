import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  resolveGuitarStringContact,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a few products, metres. */
const ROUNDING: number = 1e-12;

/**
 * `resolveGuitarStringContact` finds where a fret crosses a string, the point
 * of the string over the soundboard's centre to sound it, the soundboard's
 * normal, and the cross-string half-stroke, square to the string's way from the
 * pluck to the stop and to the normal, half the spacing to the nearest other
 * string long.
 *
 * Scenarios, two 0.6 m strings along X centred at x = 0.3 m, 10 mm apart, a 60
 * mm fret along -Z at x = 0.1 m and the soundboard's centre at x = 0.5 m:
 *
 * 1. The stop is (0.1, 0, 0), the pluck (0.5, 0, 0), the normal +Y, and the sweep
 *    5 mm along -Z.
 * 2. A fret that misses the string, a guitar without the fret, and a single string
 *    are refused on `fret`, `prop` and `string`.
 */
export function test_unit_motions_handling_resolve_guitar_string_contact(): void {
  const bar: (
    id: string,
    at: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    length: number,
  ) => IAutoMovieAffordance = (
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
  const body: IAutoMovieAffordance = {
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
      body,
    ]);
  TestValidator.predicate(
    "the sites",
    vclose(sites.stop, { x: 0.1, y: 0, z: 0 }, ROUNDING) &&
      vclose(sites.pluck, { x: 0.5, y: 0, z: 0 }, ROUNDING) &&
      vclose(sites.normal, { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(sites.sweep, { x: 0, y: 0, z: -0.005 }, ROUNDING),
  );
  const refused: (affordances: IAutoMovieAffordance[]) => string = (
    affordances: IAutoMovieAffordance[],
  ): string => {
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
    "refusals",
    [
      refused([
        ...strings,
        bar("fret1", { x: 0.9, y: 0, z: 0.005 }, across, 0.06),
        body,
      ]),
      refused([...strings, body]),
      refused([strings[0]!, fret, body]),
    ],
    ["fret", "prop", "string"],
  );
}
