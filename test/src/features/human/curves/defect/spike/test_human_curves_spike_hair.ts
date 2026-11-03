import type { IAutoMovieHumanParameters } from "../../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanCurveHairExtent } from "../../../../internal/curves/HumanCurveHairExtent";
import { HumanAnatomyAudit } from "../../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../../internal/HumanPeople";
import { HumanCurveHairStandoff } from "../../../../internal/curves/HumanCurveHairStandoff";

type V3 = [number, number, number];
type IHair = HumanCurveHairStandoff.IHair;

/**
 * Pins that no scalp hair card stands off the vault like an antenna: above
 * the eyes, every card of straight to wavy hair lies within a hair's
 * elastogravity length of the head skin.
 *
 * Scenarios:
 * 1. A made hair mass, f1's own head skin above the eyes moved 20 mm straight out from the head's centre, reads 20 mm, within 1e-6 mm.
 * 2. One vertex of f1's cards above the eyes moved 100 mm straight out reads 100 mm more, within 1e-6 mm, and past the 65 mm bound.
 * 3. f1's head skin with one vertex moved 500 mm out fails the head extent row (HR-EXT-3); f1's cards with one vertex moved 1 m out list that card's extent row (HR-EXT-1).
 * 4. Every person of `HumanPeople` who carries scalp hair: the head's extent and every card's extent are read, and for curl class I or II every card above the eyes; every row past its bound is listed by person, card and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's whole model through the public `AutoMovieHuman.generate` once per process, reads the `human.hair.cards` mesh split into its connected cards and the head and ear skin parts in true millimetres, and measures each card vertex above the eye globes' centres as its distance from the head skin's centroid less the skin's outermost radius in the same 2 degree direction bin. It catches the stray cards arcing off the crown and the parting, a card launched off the scalp by a bad start heading, and a guide that never settles on the hair mass.
 * @evidence contracts/testing.md#independent-expectations The bound is a published physical length, not a construction constant: gravity bends a hair over its elastogravity length `(A / (lambda g))^(1/3)`, 5 cm for a 79 micrometre fibre and 65 mm at the diameter's 2.326 SD upper end of 116 micrometres (Goldstein, Warren and Ball 2012, `packages/human/docs/sources/goldstein-2012-ponytail.md`), so straight to wavy hair lying over the vault cannot hold itself farther off the scalp. The extents (`HumanCurveHairExtent`): no head point lies farther from the head skin's centroid than the head's largest diameter by its own inputs (head length or height) plus ear protrusion (HR-EXT-3), and no card vertex farther than the head's radius plus the hair length input plus the card's root width, since a strand is never farther from its root than its length (HR-EXT-1). Proven green on a made mass 20 mm out (reads 20 mm) and red on one vertex moved 100 mm out (reads 100 mm more), on a head vertex moved 500 mm out and a card vertex moved 1 m out. Oracle limits: the stand-off is radial from the head's centroid, which equals the normal distance on the convex vault and overstates it only where the skin slopes against the radius; tightly curled hair (classes III to VIII) forms a self-supporting bundle and is not read; below the eyes hanging hair is not read.
 * @evidence contracts/testing.md#distinguishing-cases Every person of the core set who carries scalp hair: the four references (a 300 mm bob, a 50 mm crop, 100 and 70 mm short cuts); the population ends carry no appearance and are skipped. The hairline, coverage and root placement belong to the hair rules HR-1 to HR-3 of the part tester; the head skin's own shape to `test_human_anatomy_head`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_spike_hair`, generating the cached people's models in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_spike_hair(): void {
  const failures: string[] = [];

  // The proofs on f1's own head skin and cards.
  const f1: IHair | null = HumanCurveHairStandoff.hair("f1");
  if (f1 === null) throw new Error("f1 carries no scalp hair, so the SPIKE-HR-1 proofs cannot run");
  const centre: V3 = HumanCurveHairStandoff.centroid(f1.skin);
  const out: (p: V3, d: number) => V3 = (p: V3, d: number): V3 => {
    const q: V3 = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]];
    const r: number = Math.hypot(q[0], q[1], q[2]);
    return [p[0] + (d * q[0]) / r, p[1] + (d * q[1]) / r, p[2] + (d * q[2]) / r];
  };
  const single: (points: V3[]) => IHair["cards"] = (points: V3[]): IHair["cards"] => ({ points, card: new Int32Array(points.length), count: 1 });
  const read: (points: V3[]) => number = (points: V3[]): number => {
    const o: HumanCurveHairStandoff.IStandoff[] = HumanCurveHairStandoff.standoffs(f1.skin, single(points), f1.eyes);
    return o.length === 0 ? NaN : o[0]!.standoff;
  };

  const mass: number = read(f1.skin.filter((p: V3): boolean => p[1] > f1.eyes).map((p: V3): V3 => out(p, 20)));
  if (!(Math.abs(mass - 20) < 1e-6)) failures.push(`made mass 20 mm out on f1 read ${mass.toFixed(6)} mm, expected 20`);

  const above: number = f1.cards.points.findIndex((p: V3): boolean => p[1] > f1.eyes + 20);
  if (above < 0) failures.push("f1 has no card vertex 20 mm above the eyes to move");
  else {
    const p: V3 = f1.cards.points[above]!;
    const before: number = read([p]);
    const after: number = read([out(p, 100)]);
    if (!(Math.abs(after - before - 100) < 1e-6 && after > HumanCurveHairStandoff.BOUND))
      failures.push(`card vertex moved 100 mm out on f1 read ${after.toFixed(3)} mm against ${before.toFixed(3)}, expected 100 more and past ${HumanCurveHairStandoff.BOUND}`);
  }

  // The extent proofs: one head vertex moved 500 mm out, one card vertex moved 1 m out.
  const f1Params: IAutoMovieHumanParameters = HumanPeople.params("f1");
  const f1Length: number = f1Params.appearance!.hair!.length;
  const pushed: V3[] = f1.skin.map((p: V3, i: number): V3 => (i === 0 ? out(p, 500) : p));
  if (HumanAnatomyAudit.passes(HumanCurveHairExtent.head("f1 pushed", pushed, f1Params))) failures.push("made head vertex 500 mm out on f1: the head extent row (HR-EXT-3) did not fail");
  const thrown: IHair = { ...f1, cards: { ...f1.cards, points: f1.cards.points.map((p: V3, i: number): V3 => (i === 0 ? out(p, 1000) : p)) } };
  if (!HumanCurveHairExtent.cards("f1 thrown", thrown, f1Length).some((r: HumanAnatomyAudit.IRow): boolean => r.site.includes(`card ${f1.cards.card[0]!} of`)))
    failures.push("made card vertex 1 m out on f1: its card's extent row (HR-EXT-1) did not fail");

  // Every person with scalp hair: the head's extent and every card's; the stand-off for straight to wavy hair.
  for (const name of HumanPeople.names()) {
    try {
      const h: IHair | null = HumanCurveHairStandoff.hair(name);
      if (h === null) continue;
      const params: IAutoMovieHumanParameters = HumanPeople.params(name);
      const rows: HumanAnatomyAudit.IRow[] = [HumanCurveHairExtent.head(name, h.skin, params), ...HumanCurveHairExtent.cards(name, h, params.appearance!.hair!.length)];
      if (h.straight) rows.push(...HumanCurveHairStandoff.rows(h));
      for (const r of rows) if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(1)} mm over ${r.high.toFixed(1)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} scalp hair could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} SPIKE-HR-1 and HR-EXT findings:\n${failures.join("\n")}`);
}
