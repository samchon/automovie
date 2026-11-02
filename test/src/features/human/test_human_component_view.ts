import type { IAutoMovieGeometry } from "@automovie/interface";

import { HumanComponentModel as Component } from "../../../../packages/human/dev/src/components/HumanComponentModel";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Static component admission preserves source identity, placement and open topology.
 *
 * Scenarios:
 * 1. A rotated local millimetre patch receives its placement and unit conversion once.
 * 2. An already placed body patch retains source triangles/boundaries and exact selected bounds, excluding a remote neighbour.
 * 3. Wrong units/frame, duplicate or foreign IDs, invalid indices and a moved boundary report every defect together.
 * 4. An unknown component refuses instead of framing a different patch or a whole figure.
 * 5. Actual original normals rotate once without length-unit scaling; malformed originals refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual static adapter and collects all coordinate, topology, boundary, admission and selection findings through HumanFixtureAudit before its sole finish. Unexpected failures are recorded per scenario rather than aborting the remaining scenarios.
 * @evidence contracts/testing.md#independent-expectations A 90-degree basis and one-metre translation define explicit expected metre vertices; original triangle and shared vertex addresses define identity without reading adapter calculations as their oracle. Every coordinate is measured against that expectation with a 1e-12 metre arithmetic allowance. Dimensionless direction (1,0,0) becomes (0,0,-1) under that basis, while a body-space normal remains bitwise unchanged. Translation has no normal response; changing the original direction to (0,1,0) gives the known rotated response.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes local from body output, nonidentity placement, a remote second component, genuine boundary correspondence versus moved proxy, invalid frame/units/identity/index and absent selection. These are adapter guarantees; anatomy and hardware appearance remain separate observations.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test uses resident fixture arrays, the adapter and the existing portable audit collector; it creates no renderer, browser, process, installation or person and retains no global state.
 */
export function test_human_component_view(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("static-component", "development-adapter");
  const local: Component.IPart = {
    id: "human.skin.head.mandible/0", space: "local-mm",
    frame: { origin: [1000, 2000, 3000], forward: [0, 0, -1], up: [0, 1, 0], left: [1, 0, 0] },
    points: [[0, 0, 0], [100, 0, 0], [0, 200, 0]], indices: [0, 1, 2],
    curves: [{ id: "human.construction.head.mandible/neck", closed: true, points: [[0, 0, 0], [100, 0, 0], [0, 200, 0]], boundary: { owner: "trunk", vertices: [0, 1, 2] } }],
  };
  const expected: number[] = [1, 2, 3, 1, 2, 2.9, 1, 2.2, 3];
  const body: Component.IPart = structuredClone(local);
  body.space = "body-mm";
  body.points = [[1000, 2000, 3000], [1000, 2000, 2900], [1000, 2200, 3000]];
  body.curves[0]!.points = structuredClone(body.points);

  /** A broken case retains its diagnostic and does not suppress the other independent cases. */
  const scenario: (name: string, action: () => void) => void = (name: string, action: () => void): void => {
    audit.scope({ scenario: name, sourcePoints: local.points, frame: local.frame, expectedMetres: expected });
    try { action(); } catch (error) { audit.category("scenario completion", String(error), "completed"); }
  };
  scenario("local-frame-and-unit", (): void => {
    const before: string = JSON.stringify(local);
    const result: Component.IResult = Component.assemble([local]);
    const geometry: IAutoMovieGeometry = result.model.parts[0]!.geometry;
    audit.category("static geometry kind", geometry.type, "mesh");
    audit.vector("placed vertex coordinates", geometry.type === "mesh" ? geometry.mesh.positions : [], expected, 1e-12, "m");
    audit.vector("same-source curve coordinates", result.curves[0]!.points.flat(), expected, 1e-12, "m");
    audit.category("source immutability", JSON.stringify(local), before);
    audit.category("no fabricated rig", result.model.skeleton === null ? "null" : "rig", "null");
    audit.category("shared boundary owner", result.curves[0]!.boundary?.owner, "trunk");
  });
  scenario("body-frame-topology-and-selection", (): void => {
    const remote: Component.IPart = structuredClone(body);
    remote.id = "human.skin.head.cranial/0";
    remote.curves = [];
    remote.points = remote.points.map((point: Component.Point): Component.Point => [point[0] + 10000, point[1], point[2]]);
    const result: Component.IResult = Component.assemble([body, remote]);
    const geometry: IAutoMovieGeometry = result.model.parts[0]!.geometry;
    audit.vector("body coordinates receive no second frame", geometry.type === "mesh" ? geometry.mesh.positions : [], expected, 1e-12, "m");
    audit.vector("open source triangle addresses", geometry.type === "mesh" ? geometry.mesh.indices ?? [] : [], [0, 1, 2], 0, "vertex index");
    audit.vector("shared boundary vertex addresses", result.curves[0]!.boundary?.vertices ?? [], [0, 1, 2], 0, "vertex index");
    const selected: Component.IBounds = Component.selection(result, [body.id]);
    audit.vector("selected surface minimum", selected.min, [1, 2, 2.9], 1e-12, "m");
    audit.vector("selected surface maximum", selected.max, [1, 2.2, 3], 1e-12, "m");
  });
  scenario("all-made-defects", (): void => {
    const defective: Component.IPart = structuredClone(body);
    defective.space = "metres" as Component.IPart["space"];
    defective.frame.up = [1, 1, 0];
    defective.indices = [0, 1, 500];
    defective.curves[0]!.points[0]![0] += 1;
    defective.curves.push({ id: "human.construction.head.unowned/edge", points: [[0, 0, 0], [1, 0, 0]], closed: false });
    const issues: Component.IIssue[] = Component.inspect([defective, defective]);
    audit.scope({ scenario: "all-made-defects", issues, coordinates: defective.points, displacedBoundary: defective.curves[0]!.points });
    for (const address of ["space", "frame", "indices", "id", "unowned", "neck/0"]) audit.category("collector " + address, issues.find((issue: Component.IIssue): boolean => issue.path.includes(address)) === undefined ? "missing" : "recorded", "recorded");
    let admission: unknown;
    try { Component.assemble([defective]); } catch (error) { admission = error; }
    audit.check("made defective input native category", admission instanceof Error && admission.constructor === Error);
    audit.category("made defective input complete intended issues", admission instanceof Error ? admission.message : undefined, JSON.stringify(Component.inspect([defective])));
    audit.measure("normal admission issues", Component.inspect([local]).length, 0, 0, "findings");
    audit.reject("moved boundary is a real defect", defective.curves[0]!.points[0]![0] / 1000, body.points[0]![0] / 1000, 1e-12, "m");
  });
  scenario("unknown-selection", (): void => {
    let admission: unknown;
    try { Component.selection(Component.assemble([local]), ["human.skin.head.missing/0"]); } catch (error) { admission = error; }
    audit.check("unknown selection native category", admission instanceof Error && admission.constructor === Error);
    audit.category("unmatched component intended cause", admission instanceof Error ? admission.message : undefined, "Unknown emitted component human.skin.head.missing/0");
  });
  scenario("5 original-normal placement defect and known delta", (): void => {
    const supplied: Component.IPart = structuredClone(local);
    supplied.normals = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const before: string = JSON.stringify(supplied);
    const normal: IAutoMovieGeometry = Component.assemble([supplied]).model.parts[0]!.geometry;
    audit.vector("dimensionless original normals rotate without unit conversion", normal.type === "mesh" ? normal.mesh.normals ?? [] : [], [0, 0, -1, 0, 1, 0, 1, 0, 0], 0, "dimensionless");
    const placed: Component.IPart = structuredClone(body);
    placed.normals = structuredClone(supplied.normals);
    const same: IAutoMovieGeometry = Component.assemble([placed]).model.parts[0]!.geometry;
    audit.vector("body original normals remain bitwise original", same.type === "mesh" ? same.mesh.normals ?? [] : [], supplied.normals.flat(), 0, "dimensionless");
    const changed: Component.IPart = structuredClone(supplied);
    changed.normals![0] = [0, 1, 0];
    const delta: IAutoMovieGeometry = Component.assemble([changed]).model.parts[0]!.geometry;
    audit.vector("known original normal direction delta", delta.type === "mesh" ? delta.mesh.normals!.slice(0, 3) : [], [0, 1, 0], 0, "dimensionless");
    audit.category("normal source remains immutable", JSON.stringify(supplied), before);
    for (const defect of ["zero", "nan", "count", "float-overflow"]) {
      const invalid: Component.IPart = structuredClone(supplied);
      if (defect === "zero") invalid.normals![0] = [0, 0, 0];
      else if (defect === "nan") invalid.normals![0]![0] = NaN;
      else if (defect === "count") invalid.normals!.pop();
      else invalid.normals![0]![0] = 1e100;
      const issues: Component.IIssue[] = Component.inspect([invalid]);
      audit.scope({ scenario: "5 actual malformed source normal", defect, coordinates: invalid.points, normals: invalid.normals, issues });
      audit.category("intended original-normal issue", issues.find((issue: Component.IIssue): boolean => issue.path.endsWith(".normals"))?.reason, "Supplied source normals need one finite nonzero float32-representable dimensionless triple per vertex");
      let failure: unknown;
      try { Component.assemble([invalid]); } catch (error) { failure = error; }
      audit.check("native normal refusal category", failure instanceof Error && failure.constructor === Error);
      audit.category("normal refusal retains exact issues", failure instanceof Error ? failure.message : undefined, JSON.stringify(issues));
    }
  });
  audit.finish();
}
