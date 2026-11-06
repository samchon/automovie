import { AutoMovieHumanMassPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanMassPart";
import type { AutoMovieHumanSiteViewPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanConstructionView } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanConstructionView";
import { AutoMovieHumanTrunkMassPlacement } from "../../../../../../packages/human/src/generation/trunk/AutoMovieHumanTrunkMassPlacement";
import { AutoMovieConstructionViews, AutoMovieLoftChain, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";
import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

const { cylinder, plane } = HumanSolidShapes;

/**
 * A mass rises on its declared source axis, the host normal by default: its footprint
 * reads back at the host's surface on the caller's lateral side, it starts
 * inside the host by the host's drop over the footprint by its circle of
 * curvature plus a tenth of its amplitude, and its apex closes at the
 * amplitude over the host.
 *
 * Scenarios:
 * 1. Original plane/cylinder footprints, embedding and normal-axis poles stay unchanged.
 * 2. An AP source frame on an oblique host retains its own point and axis.
 * 3. A constant source box supplies its known front/back wall without a loft.
 * 4. Malformed directions, origin, amplitude and profile are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls MassPart.create on analytic plane/cylinder hosts and retains the original 1024-phase chain readings for footprint extrema, inward embedding and normal-axis poles. The oblique plane case supplies an explicit original wall/AP frame and reads the actual source axis endpoint; malformed source axes/origin use the same no-part/one-diagnostic refusal seam as the original invalid cases. It distinguishes source-axis placement from the still separate final fold.
 * @evidence contracts/testing.md#independent-expectations The original plane has zero sagitta, footprint extrema at [10+30,10-40] and [20+25,20-20], start depth -2.4 and pole [10,20,24]; its existing 0.05 mm ring and 1e-6 mm position allowances remain. The cylinder's 30 mm footprint at radius100 has sagitta 100-sqrt(100^2-30^2), plus the 1 mm margin. The oblique plane's known point [-16,10,12] plus amplitude24 along the declared +X gives [8,10,12] within1e-9 mm; following the host's [.6,0,.8] normal gives a different point. No production placement solver supplies an expected value.
 * @evidence contracts/testing.md#distinguishing-cases Green: the original plane/cylinder and an oblique plane with a separate anatomical AP axis. Its source pole must be [8,10,12], rather than the tilted-normal point [-1.6,10,31.2]. Refused: up along normal, zero amplitude, falling profile, zero/reversed source direction and nonfinite source origin each give no part and one diagnosis. The merge onto the host is a separate question.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_mass`; closed-form hosts, no host process, browser or GPU.
 */
export function test_human_limb_piece_mass(): void {
  const failures: string[] = [];
  const profile: AutoMovieHumanMassPart.IInput["profile"] = [
    { at: 0.5, shares: [0.8, 0.8, 0.8, 0.8] },
    { at: 0.9, shares: [0.4, 0.4, 0.4, 0.4] },
  ];
  const build = (host: IAutoMovieSolidSurface, centre: [number, number], up: [number, number, number], lateral: [number, number, number], footprint: [number, number, number, number], amplitude: number, shares: AutoMovieHumanMassPart.IInput["profile"] = profile, sourceFrame?: AutoMovieHumanMassPart.IInput["sourceFrame"]): AutoMovieHumanSiteViewPart.IResult =>
    AutoMovieHumanMassPart.create({ name: "mass", host, centre, up, lateral, footprint, amplitude, profile: shares, sourceFrame, shoulder: AutoMovieViewSection.ELLIPSE, order: 128, samples: 128, gap: 2 });
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

  // The cylinder: the start under the sagitta and the margin.
  const drum: IAutoMovieSolidSurface = cylinder("host", [0, -200, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0], 100);
  const onDrum: AutoMovieHumanSiteViewPart.IResult = build(drum, [200, 0], [0, 1, 0], [1, 0, 1], [30, 30, 30, 30], 10);
  const drumChain: IAutoMovieLoftChain | null = onDrum.loft?.chain ?? null;
  if (drumChain === null) failures.push(`cylinder: no mass (${JSON.stringify(onDrum.diagnostics)})`);
  else {
    const p: [number, number, number] = AutoMovieLoftChain.ring(drumChain, drumChain.layers[0]!.y, [0])[0]!;
    const radial: number = Math.hypot(p[0], p[2]);
    const depth: number = 100 - radial;
    const want: number = 100 - Math.sqrt(100 ** 2 - 30 ** 2) + 10 / 10;
    if (Math.abs(depth - want) > 0.05 * want) failures.push(`cylinder start: ${depth} mm under the surface at the axis' foot, against ${want} mm`);
  }

  // The source point is on this oblique plane, but its anatomical axis is +X.
  const tilted: IAutoMovieSolidSurface = plane("tilted", [0, 0, 0], [0, 1, 0], [-0.8, 0, 0.6], [0.6, 0, 0.8]);
  const sourceFrame: NonNullable<AutoMovieHumanMassPart.IInput["sourceFrame"]> = { origin: [-16, 10, 12], normal: [1, 0, 0] };
  const ap: AutoMovieHumanSiteViewPart.IResult = build(tilted, [10, 20], [0, 1, 0], [0, 0, 1], [10, 10, 10, 10], 24, profile, sourceFrame);
  const apPole: [number, number, number] | undefined = ap.part === null ? undefined : ap.part.axis.at(ap.part.stations.at(-1)!).origin;
  if (apPole === undefined || Math.hypot(apPole[0] - 8, apPole[1] - 10, apPole[2] - 12) > 1e-9) failures.push(`source AP apex: ${JSON.stringify(apPole)} against [8, 10, 12], diagnostics ${JSON.stringify(ap.diagnostics)}`);

  // Source walls come from the actual level-axis factory and original box.
  const outline = (value: number): IAutoMovieViewPart.IOutline => ({ knots: [{ site: "low", station: 10, value }, { site: "high", station: 20, value }] });
  const level: ReturnType<typeof AutoMovieConstructionViews.frame> = AutoMovieConstructionViews.frame({ type: "level", origin: { x: AutoMovieHumanConstructionView.length(outline(0)), z: AutoMovieHumanConstructionView.length(outline(0)) } });
  if (typeof level === "string") failures.push(`source wall axis: ${level}`);
  else {
    const part: IAutoMovieViewPart = { name: "wall", axis: level, stations: [10, 20], front: { positive: outline(20), negative: outline(-20) }, side: { positive: outline(30), negative: outline(-30) }, fullness: { kind: "shoulder", shoulder: outline(AutoMovieViewSection.ELLIPSE) }, order: 64, samples: 64 };
    for (const facing of [1, -1] as const) {
      const placement: AutoMovieHumanTrunkMassPlacement.IPlacement | string = AutoMovieHumanTrunkMassPlacement.of(part, [50 * facing, 15, 0], facing);
      if (typeof placement === "string") failures.push(`source wall ${facing}: ${placement}`);
      else if (Math.hypot(placement.origin[0] - 20 * facing, placement.origin[1] - 15, placement.origin[2]) > 1e-9 || Math.abs(placement.amplitude - 30) > 1e-9) failures.push(`source wall ${facing}: ${JSON.stringify(placement)}`);
    }
    for (const target of [[50, 15, 31], [10, 15, 0]] as [number, number, number][]) if (typeof AutoMovieHumanTrunkMassPlacement.of(part, target, 1) !== "string") failures.push(`source wall accepted unsupported target ${target}`);
  }

  // Refused inputs.
  const refuse = (name: string, result: AutoMovieHumanSiteViewPart.IResult): void => {
    if (result.part !== null || result.diagnostics.length !== 1) failures.push(`${name}: part ${result.part === null ? "absent" : "made"}, ${result.diagnostics.length} diagnostics`);
  };
  refuse("up along the normal", build(flat, [10, 20], [0, 0, 1], [0, 1, 0], [30, 25, 40, 20], 24));
  refuse("zero amplitude", build(flat, [10, 20], [1, 0, 0], [0, 1, 0], [30, 25, 40, 20], 0));
  refuse("falling profile", build(flat, [10, 20], [1, 0, 0], [0, 1, 0], [30, 25, 40, 20], 24, [profile[1]!, profile[0]!]));
  for (const normal of [[0, 0, 0], [-1, 0, 0]] as [number, number, number][]) refuse("invalid source axis", build(tilted, [10, 20], [0, 1, 0], [0, 0, 1], [10, 10, 10, 10], 24, profile, { ...sourceFrame, normal }));
  refuse("nonfinite source origin", build(tilted, [10, 20], [0, 1, 0], [0, 0, 1], [10, 10, 10, 10], 24, profile, { ...sourceFrame, origin: [Infinity, 10, 12] }));

  if (failures.length !== 0) throw new Error(`${failures.length} mass part findings:\n${failures.join("\n")}`);
}
