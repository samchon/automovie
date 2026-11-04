import { AutoMovieHumanMassPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanMassPart";
import type { AutoMovieHumanSiteViewPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";
import { AutoMovieLoftChain, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

const { cylinder, plane } = HumanSolidShapes;

/**
 * A mass rises from its host along the host's outward normal: its footprint
 * reads back at the host's surface on the caller's lateral side, it starts inside the host by twice the
 * host's drop over the footprint by its circle of curvature (or a tenth of its amplitude, whichever is
 * more), and its apex closes at the amplitude over the host.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds `AutoMovieHumanMassPart.create` on two closed-form hosts and reads the emitted chain with `AutoMovieLoftChain.ring` over 1024 phases: on the plane z = 0 (outward +z), a mass at (10, 20) with footprint edges 30, 25, 40 and 20 mm along +x, +y, -x and -y (the up direction +x, the lateral +y) and amplitude 24 mm: the ring at the footprint's station against the four edges in the plane, the chain's start 2.4 mm under the plane (a tenth of the amplitude, the plane having no sagitta), and the pole at (10, 20, 24); on a cylinder of radius 100 mm about the y axis, outward, a mass on its top with footprint 30 mm all round and amplitude 10 mm: the start under the surface by twice the sagitta `R - sqrt(R^2 - e^2) = 100 - sqrt(100^2 - 30^2) = 4.606 mm`, so 9.212 mm. It catches a mass off its host's normal, a mass that runs into its host instead of out of it (the pole under the plane), a footprint read in the wrong frame, order or side, a mass that starts above the host (its curve would not cross inside its layers) and an apex at the wrong height.
 * @evidence contracts/testing.md#independent-expectations Closed forms: the plane's normal is +z everywhere and its sagitta zero; the cylinder's normal curvature is `1 / 100` per mm across its axis and zero along it, so the largest sagitta over a 30 mm edge is its circle's `100 - sqrt(100^2 - 30^2) = 4.606 mm`. The footprint's edges are the section's extremes along the frame's `u` (+x) and `v` (`u x n` = -y, the medial side, so the lateral edge reads on +y), read 0.05 mm (the B-spline's interpolation error at 128 controls on a section of this size, and more).
 * @evidence contracts/testing.md#distinguishing-cases Green: the plane and the cylinder. Refused: an up direction along the host's normal, a zero amplitude and a profile whose shares do not rise each give no part and one diagnostic. The merge onto the host is `test_human_limb_piece_fold_join`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_mass`; closed-form hosts, no host process, browser or GPU.
 */
export function test_human_limb_piece_mass(): void {
  const failures: string[] = [];
  const profile: AutoMovieHumanMassPart.IInput["profile"] = [
    { at: 0.5, shares: [0.8, 0.8, 0.8, 0.8] },
    { at: 0.9, shares: [0.4, 0.4, 0.4, 0.4] },
  ];
  const build = (host: IAutoMovieSolidSurface, centre: [number, number], up: [number, number, number], lateral: [number, number, number], footprint: [number, number, number, number], amplitude: number, shares: AutoMovieHumanMassPart.IInput["profile"] = profile): AutoMovieHumanSiteViewPart.IResult =>
    AutoMovieHumanMassPart.create({ name: "mass", host, centre, up, lateral, footprint, amplitude, profile: shares, shoulder: AutoMovieViewSection.ELLIPSE, order: 128, samples: 128, gap: 2 });
  const phases: number[] = Array.from({ length: 1024 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 1024);

  // The plane: footprint, start and apex.
  const flat: IAutoMovieSolidSurface = plane("host", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const onPlane: AutoMovieHumanSiteViewPart.IResult = build(flat, [10, 20], [1, 0, 0], [0, 1, 0], [30, 25, 40, 20], 24);
  const chain: IAutoMovieLoftChain | null = onPlane.loft?.chain ?? null;
  if (chain === null || onPlane.part === null) failures.push(`plane: no mass (${JSON.stringify(onPlane.diagnostics)})`);
  else {
    const embed: number = 2.4;
    const ring: [number, number, number][] = AutoMovieLoftChain.ring(chain, embed, phases);
    const xs: number[] = ring.map((p: [number, number, number]): number => p[0]);
    const ys: number[] = ring.map((p: [number, number, number]): number => p[1]);
    const zs: number[] = ring.map((p: [number, number, number]): number => p[2]);
    const expect = (name: string, value: number, want: number, limit: number): void => {
      if (Math.abs(value - want) > limit) failures.push(`plane ${name}: ${value} against ${want}`);
    };
    expect("up edge", Math.max(...xs), 10 + 30, 0.05);
    expect("down edge", Math.min(...xs), 10 - 40, 0.05);
    expect("lateral edge", Math.max(...ys), 20 + 25, 0.05);
    expect("medial edge", Math.min(...ys), 20 - 20, 0.05);
    expect("footprint height", Math.max(...zs.map((z: number): number => Math.abs(z))), 0, 1e-6);
    expect("start", onPlane.part.stations[0]!, 0, 0);
    const start: number[] = AutoMovieLoftChain.ring(chain, chain.layers[0]!.y, [0]).map((p: [number, number, number]): number => p[2]);
    expect("start depth", start[0]!, -embed, 1e-6);
    const pole: [number, number, number] | undefined = chain.pole?.point;
    if (pole === undefined || Math.hypot(pole[0] - 10, pole[1] - 20, pole[2] - 24) > 1e-6) failures.push(`plane apex: ${JSON.stringify(chain.pole)} against [10, 20, 24]`);
  }

  // The cylinder: the start under twice the sagitta.
  const drum: IAutoMovieSolidSurface = cylinder("host", [0, -200, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0], 100);
  const onDrum: AutoMovieHumanSiteViewPart.IResult = build(drum, [200, 0], [0, 1, 0], [1, 0, 1], [30, 30, 30, 30], 10);
  const drumChain: IAutoMovieLoftChain | null = onDrum.loft?.chain ?? null;
  if (drumChain === null) failures.push(`cylinder: no mass (${JSON.stringify(onDrum.diagnostics)})`);
  else {
    const p: [number, number, number] = AutoMovieLoftChain.ring(drumChain, drumChain.layers[0]!.y, [0])[0]!;
    const radial: number = Math.hypot(p[0], p[2]);
    const depth: number = 100 - radial;
    const want: number = 2 * (100 - Math.sqrt(100 ** 2 - 30 ** 2));
    if (Math.abs(depth - want) > 0.05 * want) failures.push(`cylinder start: ${depth} mm under the surface at the axis' foot, against ${want} mm`);
  }

  // Refused inputs.
  const refuse = (name: string, result: AutoMovieHumanSiteViewPart.IResult): void => {
    if (result.part !== null || result.diagnostics.length !== 1) failures.push(`${name}: part ${result.part === null ? "absent" : "made"}, ${result.diagnostics.length} diagnostics`);
  };
  refuse("up along the normal", build(flat, [10, 20], [0, 0, 1], [0, 1, 0], [30, 25, 40, 20], 24));
  refuse("zero amplitude", build(flat, [10, 20], [1, 0, 0], [0, 1, 0], [30, 25, 40, 20], 0));
  refuse("falling profile", build(flat, [10, 20], [1, 0, 0], [0, 1, 0], [30, 25, 40, 20], 24, [profile[1]!, profile[0]!]));

  if (failures.length !== 0) throw new Error(`${failures.length} mass part findings:\n${failures.join("\n")}`);
}
