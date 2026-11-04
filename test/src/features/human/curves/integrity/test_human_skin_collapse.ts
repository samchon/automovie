import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveCollapse } from "../../../internal/curves/HumanCurveCollapse";
import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that no loft collapses: every chain's rings keep their area, and every
 * chain's skin spans the rings it was lofted from in all three directions,
 * with every coordinate finite.
 *
 * Scenarios:
 * 1. A copy of f1 whose `leg.left` middle layer has every control coordinate set to zero fails that chain's ring row (a ring shrunk to its frame's origin).
 * 2. A copy of f1 whose `head.upper` layers are flattened to 5 percent across fails that chain's ring row (a flat lens).
 * 3. f1's bind skin with the `foot.left` vertices pressed onto one height fails that chain's Y extent row.
 * 4. f1's bind skin with one left-foot vertex flung 1 km out fails that chain's X extent row and the standing box row.
 * 5. Every person of `HumanPeople` (or the people `AUTOMOVIE_HUMAN_PEOPLE` lists): every ring and skin row, every failure listed by person and chain in generation order.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and its bind skin through `AutoMovieHumanBodySurface.generate`, evaluates every chain but the ears at each layer and between layers at 192 phases by its own evaluator, and reads each ring's isoperimetric quotient `4 pi A / G^2` (vector area over the taut girth squared) and each chain's skin extent along X, Y and Z against its rings' extent (at least half, at most that extent plus 0.1 S), and every vertex against the standing box (within 0.6 S of the body's axis, 0.02 S of the floor and the crown). It catches lofts collapsed into flat lenses or points, a chain whose skin was flattened into a sheet by the shared surface code, a skin that lost a chain, vertices flung far off the body by a broken patch (which make a viewer's fit-to-bounds draw every loft flat), and NaN coordinates, naming the first collapsed chain in generation order.
 * @evidence contracts/testing.md#independent-expectations Geometry, not construction constants: a circle reads 1, an ellipse of axis ratio r reads about `4 r / (1 + r)^2` when flat, so 0.3 is an ellipse of ratio 0.12, flatter than any body section (the palm across the metacarpals, the flattest, is about a third as thick as broad and reads above 0.6); a skin lofted from rings spans at least their extent, so half of it in any direction is a collapse, and a web or fillet bridges to a neighbour within a tenth of stature; the A-pose spans less than the arms abducted (ANSUR II span 1.019 to 1.033 S), so 0.6 S from the axis bounds every vertex. Proven red here on f1's own chains and skin, edited in memory: a zeroed layer, a layer stack flattened to 5 percent, a foot pressed flat, a vertex flung 1 km out. Oracle limits: the ears are open shells and are not read; a pole's own station is left out; the extent reading catches a flattening of a whole chain, not of one ring, which the quotient reads.
 * @evidence contracts/testing.md#distinguishing-cases Every chain of the core set's ten people. Ring winding, crossing and stars belong to `test_human_curve_*` and `test_human_curves_rings`; the skin's closure and orientation to `test_human_skin_integrity`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_skin_collapse`, generating its people in process on the CPU with no renderer, browser or GPU; `AUTOMOVIE_HUMAN_PEOPLE=f1` reads f1 alone.
 */
export function test_human_skin_collapse(): void {
  const failures: string[] = [];
  const failsOn: (rows: IRow[], chain: string) => boolean = (rows: IRow[], chain: string): boolean =>
    rows.some((r: IRow): boolean => r.site.includes(` ${chain}`) && !HumanAnatomyAudit.passes(r));

  // Made defects on f1's own chains.
  const views: HumanAnatomy.IViews = HumanAnatomy.views("f1");
  const f1: HumanPeople.IPerson = views.person;
  const zeroed: IAutoMovieHumanBodyCalibration = structuredClone(f1.body);
  const leg: IAutoMovieHumanLoftChain = zeroed.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "leg.left")!;
  const mid: IAutoMovieHumanLoftChain.ILayer = leg.layers[Math.floor(leg.layers.length / 2)]!;
  mid.coefficients = mid.coefficients.map((): number => 0);
  mid.slopes = mid.slopes.map((): number => 0);
  if (!failsOn(HumanCurveCollapse.rings("f1 zeroed", zeroed), "leg.left/")) failures.push("made zeroed layer on f1's leg.left: its ring row did not fail");

  const flat: IAutoMovieHumanBodyCalibration = structuredClone(f1.body);
  const head: IAutoMovieHumanLoftChain = flat.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "head.upper")!;
  if (head.basis !== "spline") failures.push("made flat lens: head.upper is not a spline chain, so its control points cannot be flattened");
  else {
    for (const l of head.layers) for (let j: number = head.order; j < 2 * head.order; j++) l.coefficients[j] = 0.05 * l.coefficients[j]!;
    if (!failsOn(HumanCurveCollapse.rings("f1 flat", flat), "head.upper/")) failures.push("made flat lens on f1's head.upper: its ring row did not fail");
  }

  // f1's skin with the left foot pressed onto one height.
  const skin: HumanAnatomy.ISkin = views.bind();
  const foot: number = skin.chains.indexOf("foot.left");
  const P: Float64Array = Float64Array.from(skin.P);
  for (let t: number = 0; t < skin.tri.length; t++) if (skin.tri[t] === foot) for (let j: number = 0; j < 3; j++) P[3 * skin.I[3 * t + j]! + 1] = 30;
  if (foot < 0 || !failsOn(HumanCurveCollapse.skins("f1 pressed", f1.body, { ...skin, P }), "foot.left skin extent along Y")) failures.push("made pressed foot on f1's skin: its Y extent row did not fail");

  // f1's skin with one left-foot vertex flung a kilometre out, as a broken web patch does.
  const flung: Float64Array = Float64Array.from(skin.P);
  const t0: number = skin.tri.indexOf(foot);
  if (t0 >= 0) flung[3 * skin.I[3 * t0]!] = 1e6;
  const thrown: IRow[] = HumanCurveCollapse.skins("f1 flung", f1.body, { ...skin, P: flung });
  if (t0 < 0 || !failsOn(thrown, "foot.left skin extent along X") || !thrown.some((r: IRow): boolean => r.site.includes("standing box") && !HumanAnatomyAudit.passes(r)))
    failures.push("made flung vertex on f1's skin: its X extent row or the standing box row did not fail");

  // Every person.
  for (const name of HumanPeople.names()) {
    try {
      const own: HumanAnatomy.IViews = HumanAnatomy.views(name);
      for (const r of [...HumanCurveCollapse.rings(name, own.person.body), ...HumanCurveCollapse.skins(name, own.person.body, own.bind())])
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} outside ${r.low} to ${r.high}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} SKIN-COLLAPSE findings:\n${failures.join("\n")}`);
}
