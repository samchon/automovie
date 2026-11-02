import { AutoMovieHumanEventAnchors as Anchors } from "../../../../packages/human/src/generation/AutoMovieHumanEventAnchors";
import { AutoMovieHumanEventDisplacement as Move } from "../../../../packages/human/src/generation/AutoMovieHumanEventDisplacement";
import { AutoMovieHumanEventJoin as Join } from "../../../../packages/human/src/generation/AutoMovieHumanEventJoin";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanHorizontalChain as Horizontal } from "../../../../packages/human/src/lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain as Loft } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Event corrections retain physical derivatives and owned interior surfaces.
 *
 * Scenarios:
 * 1. Actual moving-frame ring samples recover prescribed world 0/1/2 jets.
 * 2. Restoring the old second jets makes the same actual derivative oracle red.
 * 3. Doubling the authored displacement doubles all measured world changes.
 * 4. A cone/cylinder join changes its contact slope and preserves an off-key
 *    interior guide, both adjacent intervals and all earlier surface samples.
 * 5. Doubling the cone slope changes the measured contact response by 0.5;
 *    malformed jets, missing frame jets and invalid guides fail for their cause.
 *
 * @evidence contracts/testing.md#behavioral-verification Observes production Loft.ring samples after EventDisplacement and EventJoin, including both sides of a principal key, an inserted guide and compact-support interiors. Actual geometry retaining stale second jets must fail the same second-derivative check as corrected geometry passes.
 * @evidence contracts/testing.md#independent-expectations The authored world correction has value 2D, slope 0.3D and curvature -0.04D at station 10. One-sided polynomial finite differences of actual world points independently recover these jets with 0.000002 first and 0.00002 second allowances for cancellation and truncation at a 0.01 mm step. A linearly expanding circular cone has exact radial slope 0.5 or 1; the cylinder is constant. Guides restrict source polynomials exactly, so all earlier physical points stay equal to 0.000000001 mm. These are numerical model laws, not anatomical acceptance.
 * @evidence contracts/testing.md#distinguishing-cases Covers nonzero moving-frame rotation, lift, both derivative directions, four phases, stale-curvature actual defects, a known doubled displacement, a guide between keys, both source interpolation orders, an affected interval and untouched intervals. Intended error type and complete message are checked. Whole-person anatomical and clinical identity remain with their maintained consumers.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous portable CPU unit; fixtures call real producers and ring evaluation without process, browser, GPU or a generated person.
 */
export function test_human_event_displacement(): void {
  /** One collector retains every independent phase and boundary failure. */
  const audit: HumanFixtureAudit = new HumanFixtureAudit("event-world-jets-and-owned-guides", "EventDisplacement/EventJoin");
  /** Analytically authored moving frames and a circular section. */
  const source: Chain = moving();
  /** Constant world direction has a component along every moving basis axis. */
  const direction: V = [2, -1, 3];
  /** Apply the known scalar polynomial's jets at the central source key. */
  const corrected: Chain = changed(source, direction);
  /** A real output with old curvature fields reproduces the former defect. */
  const stale: Chain = { ...corrected, layers: corrected.layers.map((layer: Chain.ILayer, index: number): Chain.ILayer => index === 1 ? { ...layer, curvatures: source.layers[index]!.curvatures, liftCurvatures: source.layers[index]!.liftCurvatures } : layer) };
  /** The second input changes the world correction by exactly a factor two. */
  const doubled: Chain = changed(source, [4, -2, 6]);
  for (const phase of [0, 0.47, 2.3, 5.8])
    for (const step of [-0.01, 0.01])
      audit.run({ scenario: "1-3 moving world jets", part: source.name, interval: step < 0 ? 0 : 1, station: 10, phase, differenceStep: step }, (): void => {
        /** Every measurement comes from the actual composed world sampler. */
        const normal: V[] = differences(source, corrected, 10, phase, step);
        /** The same observer evaluates a stale-jet physical output. */
        const defect: V[] = differences(source, stale, 10, phase, step);
        /** The same observer evaluates the changed input. */
        const delta: V[] = differences(source, doubled, 10, phase, step);
        audit.scope({ scenario: "1-3 moving world jets", part: source.name, interval: step < 0 ? 0 : 1, station: 10, phase, differenceStep: step, coordinates: Loft.ring(corrected, 10, [phase])[0] });
        audit.vector("physical displacement", normal[0]!, direction.map((value: number): number => 2 * value), 1e-9, "mm");
        audit.vector("physical first derivative", normal[1]!, direction.map((value: number): number => 0.3 * value), 2e-6, "mm/mm");
        audit.vector("physical second derivative", normal[2]!, direction.map((value: number): number => -0.04 * value), 2e-5, "1/mm");
        audit.reject("stale second jets change actual world acceleration", Math.hypot(...defect[2]!.map((value: number, axis: number): number => value + 0.04 * direction[axis]!)), 0, 0.01, "1/mm");
        for (let order: number = 0; order < 3; order++) audit.vector("known doubled input, order " + order.toString(), delta[order]!, normal[order]!.map((value: number): number => 2 * value), order === 2 ? 2e-6 : 1e-8, order === 0 ? "mm" : order === 1 ? "mm/mm" : "1/mm");
      });

  for (const quintic of [false, true])
    audit.run({ scenario: "4-5 owned off-key guide", part: "child", interval: [0, 1, 2, 3], station: 13, phase: "full ring", quintic }, (): void => {
      /** A constant cylinder needs no anatomical premise to be a valid model fixture. */
      const child: Chain = tube("child", [0, 5, 10, 15, 20], (): number => 20, quintic);
      /** The independent parent cone radius is 20+0.5(s-20). */
      const parent: Chain = tube("parent", [20, 25, 30], (station: number): number => 20 + 0.5 * (station - 20), quintic);
      /** The changed cone doubles the exact radial slope. */
      const stronger: Chain = tube("parent", [20, 25, 30], (station: number): number => 20 + station - 20, quintic);
      /** The guide deliberately is not a source principal layer. */
      const before: Chain = Anchors.subdivide(child, [13]);
      /** Production reconciliation must preserve the entire earlier column. */
      const normal: Chain = joined(parent, child, [13]);
      /** This actual second join owns the known slope delta. */
      const delta: Chain = joined(stronger, child, [13]);
      for (const station of [0, 2.5, 5, 8.2, 10, 12.999, 13])
        for (const phase of [0, 0.7, 1.8, 4.1]) {
          audit.scope({ scenario: "4 exact subdivision and untouched surface", part: child.name, interval: Math.min(3, Math.floor(station / 5)), station, phase, quintic, coordinates: Loft.ring(normal, station, [phase])[0] });
          audit.vector("source polynomial restriction", Loft.ring(before, station, [phase])[0]!, Loft.ring(child, station, [phase])[0]!, 1e-9, "mm");
          audit.vector("owned guide and earlier surface", Loft.ring(normal, station, [phase])[0]!, Loft.ring(child, station, [phase])[0]!, 1e-9, "mm");
        }
      for (const phase of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
        /** Actual section spline cardinal radius supplies only a unit radial direction. */
        const point: V = Loft.ring(child, 20, [phase])[0]!;
        /** Finite differences own the independent endpoint derivative reading. */
        const first: V = derivatives(normal, 20, phase, -0.001)[1]!;
        /** The changed cone passes through the same contact ring. */
        const next: V = derivatives(delta, 20, phase, -0.001)[1]!;
        /** Circle interpolation passes through authored cardinal points. */
        const radial: V = [point[0] / 20, 0, point[2] / 20];
        audit.scope({ scenario: "5 actual contact and known parent delta", part: child.name, interval: normal.layers.length - 2, station: 20, phase, quintic, coordinates: point });
        audit.vector("contact position retained", Loft.ring(normal, 20, [phase])[0]!, point, 1e-8, "mm");
        audit.vector("independent cone tangent", first, [0.5 * radial[0], 1, 0.5 * radial[2]], 2e-4, "mm/mm");
        audit.vector("known parent slope delta", next.map((value: number, axis: number): number => value - first[axis]!), [0.5 * radial[0], 0, 0.5 * radial[2]], 2e-4, "mm/mm");
        audit.bound("compact correction is active", Math.hypot(...Loft.ring(normal, 17.5, [phase])[0]!.map((value: number, axis: number): number => value - Loft.ring(child, 17.5, [phase])[0]![axis]!)), 0.01, ">", "mm");
      }
      refuse(audit, (): unknown => joined(parent, child, [20]), "A preserved event station must be strictly inside its child domain");
      refuse(audit, (): unknown => joined(parent, child, [NaN]), "A preserved event station must be strictly inside its child domain");
    });
  audit.run({ scenario: "5 intended displacement refusal", part: source.name, interval: 1, station: 10, phase: "all" }, (): void => {
    refuse(audit, (): unknown => Move.layer(source, 1, new Array<V>(4 * source.order).fill(direction), [NaN, 0, 0]), "An event displacement needs finite scalar jets and four vectors per section control");
    /** A framed source without its derivatives cannot promise world second jets. */
    const missing: Chain = { ...source, layers: source.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, frameCurvatures: undefined })) };
    refuse(audit, (): unknown => Move.layer(missing, 1, new Array<V>(4 * source.order).fill(direction), [1, 0, 0]), "A framed event displacement requires both frame station jets");
  });
  audit.finish();
}

/** World point or its station derivative. */
type V = [number, number, number];

/** A circle sampled at cardinal-containing phases has exact authored radius there. */
function tube(name: string, stations: readonly number[], radius: (station: number) => number, quintic: boolean): Chain {
  /** Uniform interpolation uses the real periodic section producer. */
  const built: Chain = Horizontal.build({ name, order: 16, samples: 64, rule: "polar" }, stations.map((station: number): V[] => Array.from({ length: 16 }, (_: unknown, index: number): V => [radius(station) * Math.cos(2 * Math.PI * index / 16), station, radius(station) * Math.sin(2 * Math.PI * index / 16)])));
  return quintic ? { ...built, layers: built.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, curvatures: new Array<number>(32).fill(0), liftCurvatures: new Array<number>(16).fill(0) })) } : built;
}

/** Turning frames carry analytically specified principal derivatives. */
function moving(): Chain {
  /** The underlying round section stays unchanged in its own frame. */
  const built: Chain = tube("turning-event-child", [0, 10, 20], (): number => 8, true);
  return { ...built, layers: built.layers.map((layer: Chain.ILayer): Chain.ILayer => {
    /** A constant angular rate defines exact first and second basis derivatives. */
    const angle: number = 0.02 * layer.y;
    return { ...layer, frame: { origin: [0, layer.y, 0], u: [Math.cos(angle), Math.sin(angle), 0], v: [0, 0, 1] }, frameSlopes: { origin: [0, 1, 0], u: [-0.02 * Math.sin(angle), 0.02 * Math.cos(angle), 0], v: [0, 0, 0] }, frameCurvatures: { origin: [0, 0, 0], u: [-0.0004 * Math.cos(angle), -0.0004 * Math.sin(angle), 0], v: [0, 0, 0] } };
  }) };
}

/** The actual output changes one principal key and retains its neighbours. */
function changed(source: Chain, direction: V): Chain {
  return { ...source, layers: source.layers.map((layer: Chain.ILayer, index: number): Chain.ILayer => index === 1 ? Move.layer(source, index, new Array<V>(4 * source.order).fill(direction), [2, 0.3, -0.04]) : layer) };
}

/** Independent one-sided differences of physical world points, exact through cubic order. */
function derivatives(chain: Chain, station: number, phase: number, step: number): V[] {
  /** Five separate production point evaluations do not read stored output jets. */
  const points: V[] = [0, 1, 2, 3, 4].map((index: number): V => Loft.ring(chain, station + index * step, [phase])[0]!);
  return [points[0]!, [0, 1, 2].map((axis: number): number => (-11 * points[0]![axis]! + 18 * points[1]![axis]! - 9 * points[2]![axis]! + 2 * points[3]![axis]!) / (6 * step)) as V, [0, 1, 2].map((axis: number): number => (35 * points[0]![axis]! - 104 * points[1]![axis]! + 114 * points[2]![axis]! - 56 * points[3]![axis]! + 11 * points[4]![axis]!) / (12 * step ** 2)) as V];
}

/** Subtract independently sampled source motion from independently sampled corrected motion. */
function differences(source: Chain, output: Chain, station: number, phase: number, step: number): V[] {
  /** The baseline moving frame also contributes physical acceleration. */
  const original: V[] = derivatives(source, station, phase, step);
  return derivatives(output, station, phase, step).map((vector: V, order: number): V => vector.map((value: number, axis: number): number => value - original[order]![axis]!) as V);
}

/** An actual complete parent/child event is reconciled by the maintained consumer. */
function joined(parent: Chain, child: Chain, preserved: number[]): Chain {
  /** A full-ring contact removes arc-gating premises from this analytic proof. */
  const body: Body = { stature: 30, chains: [parent, child], events: [{ parent: parent.name, direction: "down", fillet: 1, splits: [{ child: child.name, arcs: [[0, 2 * Math.PI]], preservedStations: preserved }] }], poles: [], apertures: [], eyes: [] };
  return Join.reconcile(body).chains.find((chain: Chain): boolean => chain.name === child.name)!;
}

/** A wrong exception cannot masquerade as intended refusal. */
function refuse(audit: HumanFixtureAudit, action: () => unknown, reason: string): void {
  /** Missing exceptions receive an explicit missing category. */
  let caught: unknown;
  try { action(); } catch (error) { caught = error; }
  audit.check("intended native Error constructor", caught instanceof Error && caught.constructor === Error);
  audit.category("intended Error name", caught instanceof Error ? caught.name : undefined, "Error");
  audit.category("intended refusal cause", caught instanceof Error ? caught.message : undefined, reason);
}
