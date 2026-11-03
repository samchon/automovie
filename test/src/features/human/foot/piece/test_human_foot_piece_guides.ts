import { AutoMovieHumanFootGuide } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanFootGuide";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanFootPieces } from "../../../internal/foot/HumanFootPieces";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;

/** Stations each guide is read at, from 0 to the fan's end. */
const STATIONS: number = 161;

/**
 * Every foot's five guides, built alone from the person's three foot inputs,
 * run forward along the foot without turning back: no two neighbouring world
 * chords of any guide point against each other.
 *
 * Scenarios:
 * 1. Red proof: f1's left lateral guide read with one point moved back past its neighbour lists one reversal; read as built it lists the reversals it has, which the made one must exceed.
 * 2. Every guide of both feet of every person of the run, each reversal counted, the first one placed by station.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's feet through the foot's own pieces (`HumanFootPieces`) and samples each of the five guides (crest, lateral, both contact edges, medial) with `AutoMovieHumanFootGuide.at` at 161 stations from 0 to the web line's end, in world millimetres. It catches a guide that doubles back where its bone changes (the lateral guide's D3b), which folds the sections the body stands between its guides and shades as a crease across the foot.
 * @evidence contracts/testing.md#independent-expectations A guide is a border line of the foot from the heel to the web, traced forward like the surface it bounds, so each chord runs forward of the last: two neighbouring chords whose dot product is negative turn back by more than 90 degrees, which no border of a foot does. Proven red by the made point of scenario 1. Oracle limits: a turn under 90 degrees reads as forward; the guides' smoothness beyond reversal belongs to `test_human_foot_piece_ribs`.
 * @evidence contracts/testing.md#distinguishing-cases Five guides of both feet of every person of the run, short and long, narrow and broad feet. The sections between them belong to `test_human_foot_piece_section`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_foot_piece_guides`, building the foot pieces, with no renderer, browser or GPU.
 */
export function test_human_foot_piece_guides(): void {
  const failures: string[] = [];

  // Red proof on f1's left lateral guide.
  const f: HumanFootPieces.IPieces = HumanFootPieces.of("f1", "left");
  const built: V3[] = points(f, "lateral");
  const made: V3[] = built.map((p: V3): V3 => [...p] as V3);
  const k: number = Math.floor(STATIONS / 2);
  made[k] = [2 * built[k - 1]![0] - built[k]![0], 2 * built[k - 1]![1] - built[k]![1], 2 * built[k - 1]![2] - built[k]![2]];
  if (!(reversals(made).count > reversals(built).count)) failures.push(`proof: f1 left lateral guide with a point moved back lists ${reversals(made).count} reversals, as built ${reversals(built).count}`);

  const rows: IRow[] = HumanFootPieces.all().flatMap((p: HumanFootPieces.IPieces): IRow[] =>
    (Object.keys(p.guides) as (keyof HumanFootPieces.IPieces["guides"])[]).map((name: keyof HumanFootPieces.IPieces["guides"]): IRow => {
      const r: { count: number; first: number } = reversals(points(p, name));
      return { person: p.person, site: `${p.side} foot ${String(name)} guide: neighbouring chords turning back${r.count === 0 ? "" : `, first at station ${r.first} of ${STATIONS}`}`, value: r.count, low: 0, high: 0, unit: "count" };
    }),
  );
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} foot guide findings:\n${failures.join("\n")}`);
}

/** A guide's world points at the stations. */
function points(p: HumanFootPieces.IPieces, name: keyof HumanFootPieces.IPieces["guides"]): V3[] {
  return Array.from({ length: STATIONS }, (_: unknown, i: number): V3 => {
    const q: readonly number[] = AutoMovieHumanFootGuide.at(p.guides[name], p.line, (p.line.end * i) / (STATIONS - 1));
    return [q[0]!, q[1]!, q[2]!];
  });
}

/** How many neighbouring chords point against each other, and the first such station. */
function reversals(points: readonly V3[]): { count: number; first: number } {
  let count: number = 0;
  let first: number = -1;
  for (let i: number = 1; i + 1 < points.length; i++) {
    const a: V3 = points[i - 1]!;
    const b: V3 = points[i]!;
    const c: V3 = points[i + 1]!;
    const dot: number = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]) + (b[2] - a[2]) * (c[2] - b[2]);
    if (dot < 0) {
      count++;
      if (first < 0) first = i;
    }
  }
  return { count, first };
}
