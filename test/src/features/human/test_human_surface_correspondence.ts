import { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanThoracicCrossing as Crossing } from "../../../../packages/human/src/generation/AutoMovieHumanThoracicCrossing";
import type { AutoMovieHumanSurfaceCorrespondence as Correspondence } from "../../../../packages/human/src/generation/AutoMovieHumanSurfaceCorrespondence";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanHorizontalChain as Horizontal } from "../../../../packages/human/src/lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain as Loft } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Actual mesher boundary identity and authored material stations remain distinct from source error.
 *
 * Scenarios:
 * 1. Explicit short-gap stations preserve their authored addresses and actual world rings.
 * 2. The old mean-height/minimum-gap convention is red against those declared addresses.
 * 3. A known material-address shift leaves the authored world geometry unchanged.
 * 4. Prepared lateral queries preserve exact root arithmetic, actual normal size and input response.
 * 5. An actual shared indexed seam reports its original source/emitted witnesses; geometry then shading matches the complete consumer exactly.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls HorizontalChain, actual Loft evaluation, prepared Crossing and BodySurface geometry/shade/generate. Real short-gap aliasing is measured against authored addresses, immutable prepared queries are checked, and actual inherited boundary indices/positions are reconstructed from emitted buffers. No helper replaces geometry.
 * @evidence contracts/testing.md#independent-expectations Authored material stations are 0,0.02,10 mm while independently specified world rings retain those physical heights. Adding three to material stations must not move any world point. A regular eight-control cubic spline's cardinal radius is ten after division by (4+2*cos(2*pi/8))/6; radius eleven responds by one. Bitwise full-consumer equivalence is a separate optimization contract, not an anatomical oracle. Shared original vertex identity requires exact emitted coordinate equality; source residuals are retained separately rather than welded by a numerical allowance.
 * @evidence contracts/testing.md#distinguishing-cases Includes a positive interval below the historical minimum gap, a known chart-only shift, off-axis lateral queries, actual nonfinite source refusal, a real shared two-owner tube, source immutability and exact shading/buffer equivalence. Analytic primitive controls certify neither clinical sites nor general source G2 or whole-human topology.
 * @evidence contracts/testing.md#execution-ownership Synchronous portable CPU unit, resident analytic chains and local maps only. No person, process, browser, GPU or file I/O; geometry and normal preparation are exercised through actual consumers.
 */
export function test_human_surface_correspondence(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("physical-material-correspondence", "actual-source-and-emitted-boundaries");
  audit.run({ scenario: "1-3 declared short-gap station and chart delta", part: "short-gap", interval: [0, 0.02, 10], phase: "all 33 periodic samples" }, (): void => {
    const stations: number[] = [0, 0.02, 10];
    const rings: [number, number, number][][] = stations.map((station: number): [number, number, number][] => Array.from({ length: 8 }, (_: unknown, index: number): [number, number, number] => [10 * Math.cos(2 * Math.PI * index / 8), station, 10 * Math.sin(2 * Math.PI * index / 8)]));
    const shape: Horizontal.IShape = { name: "short-gap", order: 8, samples: 32, rule: "polar" };
    const normal: Chain = Horizontal.build(shape, rings, undefined, stations);
    const old: Chain = Horizontal.build(shape, rings);
    const delta: Chain = Horizontal.build(shape, rings, undefined, stations.map((station: number): number => station + 3));
    audit.vector("declared material addresses remain exact", normal.layers.map((layer: Chain.ILayer): number => layer.y), stations, 0, "mm");
    audit.reject("actual old short-gap address alias", old.layers[1]!.y, 0.02, 1e-12, "mm");
    for (const layer of delta.layers) audit.vector("constant chart lift has exact partition-of-unity controls", layer.lift!, new Array<number>(shape.order).fill(-3), 0, "mm");
    for (let index: number = 0; index <= 32; index++) {
      const phase: number = 2 * Math.PI * index / 32;
      const point: [number, number, number] = Loft.sampler(normal, 0.02)(phase);
      audit.scope({ scenario: "1-3 actual world ring versus declared address", part: shape.name, station: 0.02, phase, coordinates: point });
      audit.measure("authored physical ring height", point[1], 0.02, 1e-12, "mm");
      audit.vector("chart-only input delta preserves world point", Loft.sampler(delta, 3.02)(phase), point, 1e-10, "mm");
    }
    let failure: unknown;
    try { Horizontal.build(shape, rings, undefined, [0, 0, 10]); } catch (error) { failure = error; }
    audit.check("invalid station native category", failure instanceof Error && failure.constructor === Error);
    audit.category("invalid station intended cause", failure instanceof Error ? failure.message : undefined, "Horizontal rings need one finite strictly increasing material station each");
  });
  audit.run({ scenario: "4 prepared actual spline queries", part: "tube", station: 5, phase: "left-half roots and extrema" }, (): void => {
    const owner: Chain = circle("tube", [0, 10], 10);
    const before: string = JSON.stringify(owner);
    const prepared: Crossing.IPrepared = Crossing.prepare(owner, 5);
    for (const lateral of [0, 1, 2, 5, 9, 10, 11]) {
      const reading: Crossing.IReading = prepared.read(lateral);
      const original: Crossing.IReading = Crossing.read(owner, 5, lateral);
      audit.scope({ scenario: "4 exact prepared query arithmetic", part: owner.name, station: 5, targetCoordinate: lateral, coordinates: reading.crossings.map((point: Crossing.IPoint): number[] => point.point) });
      const observed: number[] = [...reading.range, ...reading.crossings.flatMap((point: Crossing.IPoint): number[] => [point.phase, ...point.point]), ...reading.extrema.flatMap((point: Crossing.IPoint): number[] => [point.phase, ...point.point])];
      const expected: number[] = [...original.range, ...original.crossings.flatMap((point: Crossing.IPoint): number[] => [point.phase, ...point.point]), ...original.extrema.flatMap((point: Crossing.IPoint): number[] => [point.phase, ...point.point])];
      audit.measure("prepared original query cardinality", observed.length, expected.length, 0, "coordinates");
      audit.check("prepared original query bitwise arithmetic", observed.every((value: number, index: number): boolean => Object.is(value, expected[index])));
    }
    const radius: number = Math.max(...prepared.read(0).crossings.map((point: Crossing.IPoint): number => point.point[0]));
    audit.measure("independent cardinal radius", radius, 10, 1e-10, "mm");
    audit.measure("known actual radius delta", Math.max(...Crossing.prepare(circle("tube", [0, 10], 11), 5).read(0).crossings.map((point: Crossing.IPoint): number => point.point[0])) - radius, 1, 1e-10, "mm");
    audit.category("prepared queries preserve source", JSON.stringify(owner), before);
    const invalid: Chain = structuredClone(owner);
    invalid.layers[0]!.coefficients[0] = NaN;
    let failure: unknown;
    try { Crossing.prepare(invalid, 5); } catch (error) { failure = error; }
    audit.check("actual invalid source native category", failure instanceof Error && failure.constructor === Error);
    audit.category("actual invalid source intended reason", failure instanceof Error ? failure.message : undefined, "A thoracic course evaluated a nonfinite source point");
  });
  audit.run({ scenario: "5 actual inherited indexed seam and shading reuse", part: ["lower", "upper"], station: 10, phase: "actual inherited boundary samples" }, (): void => {
    const body: Body = { stature: 20, chains: [circle("lower", [0, 5, 10], 10), circle("upper", [10, 15, 20], 10)], events: [{ parent: "upper", direction: "down", shared: true, splits: [{ child: "lower", arcs: [[0, 2 * Math.PI]] }] }], poles: [], apertures: [], eyes: [] };
    const records: Correspondence.IBoundary[] = [];
    const geometry: Surface.IGeometry = Surface.geometry(body, [], (record: Correspondence.IBoundary): void => { records.push(record); });
    const normal: Surface.IOutput = Surface.shade(body, geometry);
    const complete: Surface.IOutput = Surface.generate(body);
    for (const field of ["positions", "indices"] as const) {
      audit.vector("same complete-consumer " + field, normal.mesh[field], complete.mesh[field], 0, field === "positions" ? "mm" : "indices");
      audit.check("bitwise complete-consumer " + field, normal.mesh[field].every((value: number, index: number): boolean => Object.is(value, complete.mesh[field][index])));
    }
    audit.check("bitwise complete-consumer original normals", normal.normals.length === complete.normals.length && normal.normals.every((value: number, index: number): boolean => Object.is(value, complete.normals[index])));
    audit.bound("actual inherited correspondence exists", records.filter((record: Correspondence.IBoundary): boolean => record.kind === "inherited").length, 1, ">=", "records");
    for (const record of records)
      for (const witness of record.points) {
        audit.scope({ scenario: "5 original source and emitted boundary witnesses", part: record.chain, station: record.station, phase: witness.phase, source: witness.source, coordinates: witness.emitted, residual: witness.residual, kind: record.kind });
        audit.vector("recorded emitted identity equals original mesh vertex", witness.emitted, geometry.mesh.positions.slice(3 * witness.vertex, 3 * witness.vertex + 3), 0, "mm");
        audit.measure("actual analytic seam source residual", witness.residual, 0, 1e-10, "mm");
      }
  });
  audit.finish();
}

/** Independently sized regular cardinal spline extrusion with zero axial deformation. */
function circle(name: string, stations: number[], radius: number): Chain {
  const order: number = 8;
  const eigenvalue: number = (4 + 2 * Math.cos(2 * Math.PI / order)) / 6;
  return { name, basis: "spline", order, samples: 32, rule: "polar", layers: stations.map((y: number): Chain.ILayer => ({ y, coefficients: Array.from({ length: 2 * order }, (_: unknown, index: number): number => radius / eigenvalue * (index < order ? Math.cos(2 * Math.PI * index / order) : Math.sin(2 * Math.PI * (index - order) / order))), slopes: new Array<number>(2 * order).fill(0) })) };
}
