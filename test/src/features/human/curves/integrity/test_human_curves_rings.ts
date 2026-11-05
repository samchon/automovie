import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { HumanCurveMirror } from "../../../internal/curves/HumanCurveMirror";
import { HumanCurveRingAudit } from "../../../internal/curves/HumanCurveRingAudit";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every composed chain of every person keeps even rows of rings,
 * a girth profile without steps, and limb, digit and neck sections that never
 * fold back round their centres.
 *
 * Scenarios:
 * 1. A copy of f1's left leg with one layer duplicated 0.5 mm above itself fails the spacing rule.
 * 2. A copy with one shank layer swollen 10 percent fails the girth-step rule at that layer.
 * 3. A copy of f1's left middle finger with one control point of a layer reflected through its plane's origin fails the star rule at that layer.
 * 4. A copy with one right shank layer swollen 5 percent fails the legs' left-right agreement.
 * 5. Every person of `HumanPeople`: every chain's spacing and girth step, every limb, digit and neck layer's star shape, and every paired chain's girth profile against its mirror are read, and every failure is listed by person, chain and layer.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and reads every delivered chain: the ratio of each pair of neighbouring layer spacings; the girth profile every 2 mm (`HumanCurveRings`) for its largest second difference away from three stations at each end; and, on arm, leg, finger, thumb, toe and neck chains, every layer's ring at 192 phases for points whose step turns backward round the ring's area centroid in its own plane; and every `.left` chain's girth profile against its `.right` twin, station by station (`HumanCurveMirror`), within the anatomy audits' 0.5 mm mirror distance round the ring (3.1 mm of girth) plus pi times the person's largest left-right input difference. It catches a side shaped differently from its mirror by more than its own inputs say, and rows of rings crowded against sparse ones (steps at landmark rows), a collar or ridge round a chain, and a section folded or hooked behind its centre, each by chain and layer.
 * @evidence contracts/testing.md#independent-expectations The bounds come from geometry and the catalog's crease definition, not from a figure: a spacing ratio of at most two (a doubling, the finest change the leg's own row rule makes under the crotch); a second difference of the 2 mm girth profile at most 2.0 mm, the girth's bend when the 1 mm-over-10 mm crease (meridian curvature 0.08 /mm) runs round the whole ring (`2 pi 0.08 * 2^2`); a limb, digit or neck section star-shaped about its centre, since each wraps one bone. Proven here: the duplicated layer reads a spacing ratio far above two; the swollen layer's girth second difference is about a tenth of its girth, far above 2 mm; the reflected control point turns the ring backward. Oracle limits: three stations at each end are left to the seam and cap rules; a crease on part of a ring bends the girth less than the bound and is the kink rules'.
 * @evidence contracts/testing.md#distinguishing-cases Every chain of the core set's ten people, horizontal and framed, long and short. Curve soundness by chain (`winding`, `crossing`, `slope`, `crease`) belongs to `test_human_curve_*`, the profile shapes to `test_human_curves_profile_*`, the skin's kinks to `test_human_curves_step_*` and `_dent_*`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_rings`, generating its people in process on the CPU (body law only) with no renderer, browser or GPU; profiles are cached per person and chain.
 */
export function test_human_curves_rings(): void {
  const failures: string[] = [...made()];

  // Every person is read even when another fails, so one run lists everything.
  for (const name of HumanPeople.names()) {
    try {
      const p: HumanPeople.IPerson = HumanPeople.person(name);
      const read: (chain: string) => HumanCurveRings.IProfile = (chain: string): HumanCurveRings.IProfile => HumanCurveRings.profile(p, chain);
      for (const r of [...HumanCurveRingAudit.rows(name, p.body, read), ...HumanCurveMirror.rows(name, p.body, p.params, read)])
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low.toFixed(3)} to ${r.high.toFixed(3)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} composed-chain integrity findings:\n${failures.join("\n")}`);
}

/** Made defects on copies of f1's chains, each required to fail its own rule on its own chain. */
function made(): string[] {
  const out: string[] = [];
  const p: HumanPeople.IPerson = HumanPeople.person("f1");
  const k: number = HumanCurveRings.scale(p);
  const fail: (label: string, copy: IAutoMovieHumanBodyCalibration, chain: string, rule: string) => void = (label: string, copy: IAutoMovieHumanBodyCalibration, chain: string, rule: string): void => {
    const rows: IRow[] = HumanCurveRingAudit.rows("f1", { ...copy, chains: copy.chains.filter((c: IAutoMovieLoftChain): boolean => c.name === chain) }, (name: string): HumanCurveRings.IProfile => HumanCurveRings.of(copy, name, k));
    if (!rows.some((r: IRow): boolean => r.site.endsWith(`(${rule})`) && !HumanAnatomyAudit.passes(r))) out.push(`made ${label}: no failing ${rule} row on ${chain}`);
  };

  // A layer duplicated 0.5 mm above itself.
  const crowded: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const leg: IAutoMovieLoftChain = crowded.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "leg.left")!;
  leg.layers.splice(6, 0, { ...structuredClone(leg.layers[5]!), y: leg.layers[5]!.y + 0.5 });
  fail("duplicated layer", crowded, "leg.left", "CUR-2");

  // A shank layer swollen 10 percent.
  const swollen: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const layer: IAutoMovieLoftChain.ILayer = swollen.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "leg.left")!.layers[5]!;
  layer.coefficients = layer.coefficients.map((v: number): number => 1.1 * v);
  layer.slopes = layer.slopes.map((v: number): number => 1.1 * v);
  fail("swollen layer", swollen, "leg.left", "CUR-3");

  // One control point of a finger layer reflected through the plane's origin, both its coordinates.
  const hooked: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const finger: IAutoMovieLoftChain = hooked.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "finger.left.middle")!;
  const mid: IAutoMovieLoftChain.ILayer = finger.layers[Math.floor(finger.layers.length / 2)]!;
  const N: number = finger.order;
  if (finger.basis !== "spline") out.push("made hooked ring: finger.left.middle is not a spline chain, so a control point cannot be moved alone");
  else {
    mid.coefficients[3] = -mid.coefficients[3]!;
    mid.coefficients[N + 3] = -mid.coefficients[N + 3]!;
    fail("hooked ring", hooked, "finger.left.middle", "SEC-4");
  }

  // One right shank layer swollen 5 percent, its left twin untouched.
  const lopsided: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const right: IAutoMovieLoftChain.ILayer = lopsided.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "leg.right")!.layers[5]!;
  right.coefficients = right.coefficients.map((v: number): number => 1.05 * v);
  right.slopes = right.slopes.map((v: number): number => 1.05 * v);
  const mirrored: IRow[] = HumanCurveMirror.rows("f1", lopsided, p.params, (name: string): HumanCurveRings.IProfile => HumanCurveRings.of(lopsided, name, k));
  if (!mirrored.some((r: IRow): boolean => r.site.startsWith("leg.left against leg.right") && !HumanAnatomyAudit.passes(r))) out.push("made lopsided shank: no failing SYM-1 row on the legs");
  return out;
}
