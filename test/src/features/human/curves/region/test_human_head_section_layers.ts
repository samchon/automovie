import { AutoMovieHumanHeadRadius } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadRadius";
import { AutoMovieHumanHeadSection } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadSection";
import { AutoMovieHumanHeadVault } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadSection } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadSection";
import { AutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanHeadPieceSingleton } from "../../../internal/head/HumanHeadPieceSingleton";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = [number, number, number];

/**
 * Pins that every section of f1's lower head, from layer 30 to layer 50,
 * stays inside the head: no ray of the section's outline is longer than the
 * head's own length, and every printed reading names where a flung ring
 * starts.
 *
 * Scenarios:
 * 1. f1's delivered `head.lower` layers 30 to 50: each layer's station, the ranges of its lifts, slopes and curvatures, and its ring's centre and largest radius over 64 phases.
 * 2. f1's head built alone (`HumanHeadPieceSingleton`), its section at each of those stations: the section's measures, the side window's ray origin, start, eurion and end, and the outline's radius and the cranium's at nine angles from the front to the back.
 * 3. A layer fails when its ring's largest radius or any outline radius exceeds the head length; the failure prints the whole table.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 through the public body law and reads its `head.lower` chain's layers by the chain's own evaluator (`AutoMovieHumanLoftChain.ring`, 64 phases), and builds f1's head alone from its setup with no secant corrections, evaluating `AutoMovieHumanHeadSection.section` at each layer's station, `AutoMovieHumanHeadRadius.radius` and `AutoMovieHumanHeadVault.cranial` along rays from the side window's origin `(front + back) / 2`. It catches a section whose outline flies off (the butterfly of the 01:46 to 01:55 builds, layers 35 to 45) and names the first measure that jumps between neighbouring layers.
 * @evidence contracts/testing.md#independent-expectations The bound is geometric: a ray from inside a head to its own skin is shorter than the head's whole length, glabella to opisthocranion (the layout's head length, in calibration millimetres). The printed measures are diagnostics, not expectations. Oracle limits: the standalone build has no secant corrections, so its sections differ from the delivered chain's by the corrections' small amounts; the delivered ring is the one the skin is lofted from. This row is a diagnostic for one person and one band of layers; the collapse rows of `test_human_skin_collapse` hold every person and every chain.
 * @evidence contracts/testing.md#distinguishing-cases f1's lower head only; the other people and chains belong to `test_human_skin_collapse`, the head's surface pieces to the part tester's `test_human_head_surface_*`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_section_layers`, generating f1 and its head piece in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_section_layers(): void {
  const piece: HumanHeadPieceSingleton.IPiece = HumanHeadPieceSingleton.get("f1");
  const chain: IAutoMovieHumanLoftChain | undefined = HumanPeople.person("f1").body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "head.lower");
  if (chain === undefined) throw new Error("f1 has no head.lower chain");
  const length: number = piece.built.plan.length;
  const phases: number[] = Array.from({ length: 64 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 64);
  const angles: number[] = Array.from({ length: 9 }, (_: unknown, i: number): number => (Math.PI * i) / 8);
  const f: (v: number) => string = (v: number): string => (Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toExponential(2) : v.toFixed(2)) : String(v));
  const range: (a: readonly number[] | undefined) => string = (a: readonly number[] | undefined): string =>
    a === undefined || a.length === 0 ? "-" : `${f(Math.min(...a))}..${f(Math.max(...a))}`;

  const lines: string[] = [`f1 head.lower, ${chain.layers.length} layers; head length ${f(length)} calibration mm; radii at theta = k pi / 8, k = 0..8`];
  const bad: number[] = [];
  for (let k: number = 30; k <= Math.min(50, chain.layers.length - 1); k++) {
    const layer: IAutoMovieHumanLoftChain.ILayer = chain.layers[k]!;
    const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, layer.y, phases) as V3[];
    const centre: V3 = [0, 1, 2].map((j: number): number => ring.reduce((s: number, p: V3): number => s + p[j]!, 0) / ring.length) as V3;
    const reach: number = Math.max(...ring.map((p: V3): number => Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2])));
    lines.push(
      `L${k} y ${f(layer.y)}: lift ${range(layer.lift)}, slopes ${range(layer.slopes)}, curvatures ${range(layer.curvatures)}; ring centre ${centre.map(f).join(" ")}, largest radius ${f(reach)}`,
    );

    const s: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(piece.setup.compiled, piece.built.plan, layer.y);
    const ox: number = (s.front + s.back) / 2;
    const from: number = Math.max(0, Math.atan2(s.face, s.waist - ox));
    const eurion: number = Math.atan2(s.width, s.axis - ox);
    const radii: number[] = angles.map((t: number): number => AutoMovieHumanHeadRadius.radius(s, ox, t));
    const cranial: number[] = angles.map((t: number): number => AutoMovieHumanHeadVault.cranial(s, ox, t));
    lines.push(
      `    section t ${f(s.t)} tilt ${f(s.tilt)} axis ${f(s.axis)} crown ${f(s.crown)} back ${f(s.back)} width ${f(s.width)} front ${f(s.front)} waist ${f(s.waist)} face ${f(s.face)} brow ${f(s.brow)} powerBack ${f(s.powerBack)} taper ${f(s.taper)}; ox ${f(ox)} from ${f(from)} eurion ${f(eurion)}`,
      `    radius ${radii.map(f).join(" ")}`,
      `    cranial ${cranial.map(f).join(" ")}`,
    );
    if (!(reach <= length) || !radii.every((r: number): boolean => r <= length)) bad.push(k);
  }
  console.log(lines.join("\n"));
  if (bad.length !== 0) throw new Error(`f1 head.lower layers ${bad.join(", ")} reach past the head length ${f(length)}:\n${lines.join("\n")}`);
}
