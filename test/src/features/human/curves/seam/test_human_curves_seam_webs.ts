import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomySkins } from "../../../internal/HumanAnatomySkins";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanWebColumns } from "../../../internal/limbs/HumanWebColumns";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every finger and toe web of every person is a sound ruled
 * surface between its parent's ring and its digit: its columns never cross
 * or close up into a fold, and each arrives on the digit's own first section.
 *
 * Scenarios:
 * 1. Red proof on f1's first web: two neighbouring columns swapped at their middle row read one or more order reversals; one column pressed onto its neighbour at that row reads a spacing under 0.05; one arrival moved 1 mm off the section reads past 0.01 mm.
 * 2. Every person of `HumanPeople`: every web of both hands and both feet, every row past its bound listed by person and child chain, with the first row and columns that reverse.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the columns the bind surface publishes for each web (`<child>/web-column-<v>` from `AutoMovieHumanBodySurface.generate`'s construction, kept by `HumanAnatomySkins.construction`): at every row the columns' angles round the axis from the parent ring's centroid to the arrivals' centroid, against the arrivals' cyclic order, and each neighbour pair's distance against its arrival distance; each column's last point against the child chain's end sections sampled by `AutoMovieHumanLoftChain.sampler`. It catches the hand's web fold (H1, crossing columns that shade as a crumple between the fingers) and an arrival that leaves a crack at the digit's root.
 * @evidence contracts/testing.md#independent-expectations The registry declares both web seams G2 at the parent ring and at the child's section, owned there, so a column must arrive on the child's own section (a copy: 0.01 mm, rounding only); a web is a band between two rings, so its columns keep their cyclic order at every row, and a neighbour pair under 0.05 of its arrival spacing has closed into a fold (the web owner's declared limit). Proven red by the made webs of scenario 1. Oracle limits: the tangent rows (first and last chords within 5 degrees of the owners' station tangents) and the crest's 90 degree meeting are not read yet.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, four limbs each, short and long digits. The digits' order and lengths belong to `test_human_curves_region_digits`, the web skin's crumple to `test_human_curve_hand` and `test_human_curve_foot`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_seam_webs`, reading each person's bind construction in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_seam_webs(): void {
  const failures: string[] = [...proof()];
  for (const name of HumanPeople.names()) {
    try {
      const views: HumanAnatomySkins.IViews = HumanAnatomySkins.views(name);
      const chains: IAutoMovieHumanLoftChain[] = views.person.body.chains;
      const webs: HumanWebColumns.IWeb[] = HumanWebColumns.webs(views.construction());
      if (webs.length === 0) failures.push(`${name.padEnd(14)} publishes no web columns`);
      for (const web of webs) {
        const child: IAutoMovieHumanLoftChain | undefined = chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === web.child);
        const rows: IRow[] = [...HumanWebColumns.fold(name, web), ...(child === undefined ? [] : [HumanWebColumns.arrival(name, web, child)])];
        if (child === undefined) failures.push(`${name.padEnd(14)} ${web.child}: no chain of that name for its web`);
        for (const r of rows) if (!(r.value >= r.low && r.value <= r.high)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(4)} outside ${r.low} to ${r.high}`);
      }
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} web findings:\n${failures.join("\n")}`);
}

/** The made webs on f1's first web, each required to fail its row. */
function proof(): string[] {
  const views: HumanAnatomySkins.IViews = HumanAnatomySkins.views("f1");
  const web: HumanWebColumns.IWeb | undefined = HumanWebColumns.webs(views.construction())[0];
  if (web === undefined) return ["proof: f1 publishes no web columns"];
  if (web.columns.length < 3) return [`proof: f1's ${web.child} web has ${web.columns.length} columns`];
  const out: string[] = [];
  const mid: number = Math.floor(web.columns[0]!.length / 2);
  const copy: () => V3[][] = (): V3[][] => web.columns.map((c: V3[]): V3[] => c.map((p: V3): V3 => [...p] as V3));

  // Two neighbours exchanged at the middle row cross.
  const crossed: V3[][] = copy();
  [crossed[0]![mid], crossed[1]![mid]] = [crossed[1]![mid]!, crossed[0]![mid]!];
  const swap: IRow = HumanWebColumns.fold("f1 made crossing", { child: web.child, columns: crossed })[0]!;
  if (!(swap.value > 0)) out.push(`proof: made crossing reads ${swap.value} reversals`);

  // Every column pressed onto column 0 at the middle row folds.
  const pressed: V3[][] = copy();
  for (const c of pressed) c[mid] = [...pressed[0]![mid]!] as V3;
  const press: IRow = HumanWebColumns.fold("f1 made fold", { child: web.child, columns: pressed })[1]!;
  if (!(press.value < HumanWebColumns.SPACING)) out.push(`proof: made fold reads a least spacing ${press.value.toFixed(3)}`);

  // One arrival 1 mm off the section along the axis.
  const child: IAutoMovieHumanLoftChain | undefined = views.person.body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === web.child);
  if (child === undefined) return [...out, `proof: f1 has no chain ${web.child}`];
  const moved: V3[][] = copy();
  const end: V3 = moved[0]![moved[0]!.length - 1]!;
  const before: V3 = moved[0]![moved[0]!.length - 2]!;
  const d: number = Math.hypot(end[0] - before[0], end[1] - before[1], end[2] - before[2]) || 1;
  moved[0]![moved[0]!.length - 1] = [end[0] + (end[0] - before[0]) / d, end[1] + (end[1] - before[1]) / d, end[2] + (end[2] - before[2]) / d];
  const off: IRow = HumanWebColumns.arrival("f1 made arrival", { child: web.child, columns: moved }, child);
  if (!(off.value > HumanWebColumns.ARRIVAL)) out.push(`proof: made arrival reads ${off.value.toFixed(4)} mm`);
  return out;
}
