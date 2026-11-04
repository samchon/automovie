import { AutoMovieHumanFoldJoin } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanFoldJoin";
import type { AutoMovieSolidJoin, AutoMovieSolidRail, AutoMovieSolidVector, IAutoMovieSolidSurface } from "@automovie/engine";
import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cylinder, distance, dot, plane } = HumanSolidShapes;

/**
 * A fold join seeds its merge at the fold's landmark and sets each side's
 * chord to the fillet `R tan(beta / 2)` of the tissue rolling into the fold,
 * `beta` the turn of the outward normals across the curve at that phase,
 * capped where the caller caps it.
 *
 * @evidence contracts/testing.md#behavioral-verification Merges a 20 mm cylinder through the plane z = 0 with `AutoMovieHumanFoldJoin.create`, seeded at the world point (20, 0, 0), fold radius 5 mm, and reads `IJoin.rail` at 16 phases: each rail's chord from the curve point on the host and on the part. Two cylinders: upright, where every phase's normals turn by a right angle, and tilted 30 degrees about +y, where the turn varies round the curve. It catches a width that ignores the normals' turn (a constant `R`), a turn read on the wrong side (`tan` of the dihedral angle instead of the turn), a cap not applied, and a seed that does not start the trace.
 * @evidence contracts/testing.md#independent-expectations Closed forms: the plane's outward normal is +z and the cylinder's at phase `phi` its radial direction `cos phi e1 + sin phi e2`, so `beta = acos(n . z)`; on the upright cylinder `beta = pi / 2` and both chords are `R tan(pi / 4) = R = 5 mm`; on the tilted one the radial direction at phase `phi` has `n . z = -cos phi sin 30deg` (with `e1` the tilted x), so the chord is `5 tan(acos(-cos phi / 2) / 2)`, read at the rail's own curve phase. The chord is read as the straight distance from the curve point to each rail point: on the plane the rail runs along a straight line square to the curve and on the cylinder along its straight station line, so the distance equals the chord exactly. Limit 1e-6 mm, a thousand times the 1e-9 mm trace tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Green: the upright and the tilted cylinder. Cap: a 2 mm cap under the 5 mm fillet must give 2 mm chords. Red proof: the tilted cylinder's chords must differ from the constant 5 mm by more than 0.5 mm at phase 0 and at phase pi (the turn there is 120 and 60 degrees, chords 8.66 and 2.89 mm), so a constant-width law fails. Refused: a landmark 200 mm off both surfaces gives no join and a diagnostic. The merge's own rails and blend continuity are `test_human_solid_merge`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_fold_join`; closed-form surfaces, no host, browser or GPU.
 */
export function test_human_limb_piece_fold_join(): void {
  const failures: string[] = [];
  const R: number = 5;
  const host: IAutoMovieSolidSurface = plane("skin", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const tilt: number = Math.PI / 6;
  const upright: IAutoMovieSolidSurface = cylinder("limb", [0, 0, -40], [0, 0, 1], [1, 0, 0], [0, 1, 0], 20);
  const d: Vec3 = [Math.sin(tilt), 0, Math.cos(tilt)];
  const e1: Vec3 = [Math.cos(tilt), 0, -Math.sin(tilt)];
  const tilted: IAutoMovieSolidSurface = cylinder("limb", [-40 * d[0], 0, -40 * d[2]], d, e1, [0, 1, 0], 20);

  // The landmark (20, 0, 0) stands on the upright curve and within 3.1 mm of
  // the tilted one (its phase-0 point is at x = 20 / cos 30deg), inside both
  // cylinders' basins for the foot.
  const join = (part: IAutoMovieSolidSurface, cap: number, landmark: Vec3 = [20, 0, 0]): AutoMovieSolidJoin.IResult =>
    AutoMovieHumanFoldJoin.create({
      part,
      host,
      landmark,
      guess: { part: [40, 0], host: [20, 0] },
      radius: (): number => R,
      cap: (): number => cap,
      count: 32,
      tolerance: 1e-9,
      grazing: Math.asin(0.01),
    });
  const chords = (result: AutoMovieSolidJoin.IResult, name: string, expected: (phi: number) => number): number[] => {
    const out: number[] = [];
    if (result.join === null) {
      failures.push(`${name}: no join (${JSON.stringify(result.diagnostics)})`);
      return out;
    }
    for (let k: number = 0; k < 16; k++) {
      const phi: number = (2 * Math.PI * k) / 16;
      const rail: AutoMovieSolidRail.IRail | null = result.join.rail(phi);
      if (rail === null) {
        failures.push(`${name}: no rail at phase ${phi}`);
        continue;
      }
      const c: Vec3 = rail.curve.point;
      const want: number = expected(rail.curve.phi);
      const onHost: number = distance(rail.hostPoint, c);
      const onPart: number = distance(rail.partPoint, c);
      if (Math.abs(onHost - want) > 1e-6 || Math.abs(onPart - want) > 1e-6) failures.push(`${name}: phase ${phi.toFixed(3)} chords ${onHost.toFixed(6)} and ${onPart.toFixed(6)} mm against ${want.toFixed(6)}`);
      out.push(onHost);
    }
    return out;
  };

  // Green: upright, a right angle everywhere.
  chords(join(upright, 100), "upright", (): number => R * Math.tan(Math.PI / 4));

  // Green: tilted, the turn read per phase from the closed-form normals.
  const turn = (phi: number): number => Math.acos(dot([Math.cos(phi) * e1[0], Math.sin(phi), Math.cos(phi) * e1[2]], [0, 0, 1]));
  const tiltedChords: number[] = chords(join(tilted, 100), "tilted", (phi: number): number => R * Math.tan(turn(phi) / 2));

  // Red proof: a constant width would miss the tilted chords at 0 and pi.
  if (tiltedChords.length === 16 && !(Math.abs(tiltedChords[0]! - R) > 0.5 && Math.abs(tiltedChords[8]! - R) > 0.5))
    failures.push(`red proof: tilted chords ${tiltedChords[0]} and ${tiltedChords[8]} mm stand within 0.5 mm of the constant ${R} mm`);

  // Cap: a 2 mm cap binds everywhere on the upright cylinder.
  chords(join(upright, 2), "capped", (): number => 2);

  // Refused: a landmark far off both surfaces.
  const far: AutoMovieSolidJoin.IResult = join(upright, 100, [200, 200, 200]);
  if (far.join !== null || far.diagnostics.length === 0) failures.push("refused: a far landmark still joined or gave no diagnostic");

  if (failures.length !== 0) throw new Error(`${failures.length} fold join findings:\n${failures.join("\n")}`);
}
