import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanRelief } from "../../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanMergeProof } from "../../../internal/region/HumanMergeProof";
import { HumanMergeRows } from "../../../internal/region/HumanMergeRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

type V3 = HumanAnatomy.V3;

/**
 * Every person's trunk, shoulder and neck reliefs (the breasts, the deltoid's
 * cap, the umbilicus, the spinal furrow and every other window on those
 * chains) merge with their base chain one way only: each adds volume or
 * removes it, never both, vanishes with its slope at its window's edge, and
 * leaves the base outside its window unchanged.
 *
 * Scenarios:
 * 1. A made bump of 2 mm and 14 mm radius passes all three merge rows; dented, cut short or skirted it fails each in turn.
 * 2. Every person of `HumanPeople`: every relief of the `trunk`, `upper` and neck (`head`) chains is read as the chain carrying that relief alone against the chain carrying none, over its window and 10 percent round it, every millimetre.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates in memory two copies of each chain through its own evaluator (`AutoMovieHumanLoftChain.ring`): one with the relief alone, one with no relief, and reads their difference along the relief's axis at every millimetre of station and of arc (phase times the window centre's mean radius). The relief's sign is that of its largest control height, and the merge rows read the height times that sign: its least value (a breast whose blend dips under the chest wall, a relief that both adds and removes), its rise beside the support's edge (a ring printed round a breast or a deltoid) and its height on the grid's border (a relief leaking past its window). Findings are named by chain and relief.
 * @evidence contracts/testing.md#independent-expectations The owner's merge rule: protruding pieces join their base by adding volume only, recesses being their own subtractive pieces, so each relief is one-signed; it vanishes with its slope at its edge, the rise over one step beside the edge bounded by a bend of the crease limit's 12.5 mm radius (`HumanMergeRows`), as the catalog's CUR-12 and SEAM-11 ask; and nothing of it stands outside its declared window. Proven on the made bump (`HumanMergeProof`). Oracle limits: arc is phase times one radius, so the edge-rise reading is approximate where the section is far from round; a window clamped at a chain's end has a seam there, not a border, and lists it.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends, lean and heavy, feminine and masculine. The head's pieces are read by the head merge test; the seams between chains by the trunk seam test; the merged skin at the curve level by the overall tester's merge class.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_trunk_merge`, reading each person's chains in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_trunk_merge(): void {
  assertHumanProvenRows("trunk merge", HumanMergeProof.failures, (name: string): HumanAnatomyAudit.IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    const k: number = 1 / HumanCurveRings.scale(p);
    const rows: HumanAnatomyAudit.IRow[] = [];
    for (const chain of p.body.chains) {
      if (!/^(trunk|upper|head)$/.test(chain.name)) continue;
      for (const relief of chain.reliefs ?? []) rows.push(...merge(name, chain, relief, k));
    }
    return rows;
  });
}

/** The merge rows of one relief on its chain. */
function merge(person: string, chain: IAutoMovieHumanLoftChain, relief: IAutoMovieHumanRelief, k: number): HumanAnatomyAudit.IRow[] {
  const base: IAutoMovieHumanLoftChain = { ...chain, reliefs: [] };
  const alone: IAutoMovieHumanLoftChain = { ...chain, reliefs: [relief] };
  const first: number = chain.layers[0]!.y;
  const last: number = chain.layers[chain.layers.length - 1]!.y;
  const [s0, s1]: [number, number] = relief.stations;
  const [p0, p1raw]: [number, number] = relief.phases;
  const p1: number = p1raw < p0 ? p1raw + 2 * Math.PI : p1raw;
  const centre: V3[] = AutoMovieHumanLoftChain.ring(base, (s0 + s1) / 2, Array.from({ length: 64 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 64)) as V3[];
  const middle: V3 = HumanAnatomy.scale(centre.reduce((a: V3, b: V3): V3 => HumanAnatomy.add(a, b), [0, 0, 0]), 1 / centre.length);
  const radius: number = centre.reduce((sum: number, q: V3): number => sum + HumanAnatomy.dist(q, middle), 0) / centre.length;
  const sign: number = Math.sign(relief.heights.reduce((a: number, b: number): number => (Math.abs(b) > Math.abs(a) ? b : a), 0)) || 1;
  const axis: V3 = relief.axis;
  const height: HumanMergeRows.Height = (s: number, arc: number): number => {
    const phase: number = arc / radius;
    const a: V3 = AutoMovieHumanLoftChain.ring(alone, s, [phase])[0] as V3;
    const b: V3 = AutoMovieHumanLoftChain.ring(base, s, [phase])[0] as V3;
    return sign * HumanAnatomy.dot(HumanAnatomy.sub(a, b), axis);
  };
  const ds: number = 0.1 * (s1 - s0);
  const dp: number = 0.1 * (p1 - p0);
  const grid: HumanMergeRows.IGrid = {
    u: [Math.max(first, s0 - ds), Math.min(last, s1 + ds)],
    v: [(p0 - dp) * radius, (p1 + dp) * radius],
    step: 1 * k,
    midline: false,
  };
  return HumanMergeRows.rows(person, `${chain.name} relief ${relief.name} (${sign > 0 ? "adds" : "removes"} volume)`, height, grid, k);
}
