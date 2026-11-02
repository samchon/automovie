import { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkinCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCourse";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanTrunkObservation as SourceObservation } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkObservation";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanPeople } from "../internal/HumanPeople";
import { HumanSkinPathAudit as Skin } from "../internal/HumanSkinPathAudit";
import { HumanTrunkFixture as Fixture } from "../internal/HumanTrunkFixture";
import { HumanTrunkObservation as Observation } from "../internal/HumanTrunkObservation";

/**
 * Actual supported column attempts answer their surface length on emitted skin.
 *
 * Scenarios:
 * 1. All nine canonical public inputs reach their actual neck/trunk producers.
 * 2. Production-owned partial events connect the three actual column owners.
 * 3. The unchanged endpoint course is reconstructed independently on original triangles.
 * 4. Every physical point is finite and its length answers the public input.
 *    Nonconvergence remains a failed supported-person attempt, never a pass.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates all nine actual supported columns using shared production events and once-only EventJoin composition. It reuses the actual constructor's emitted physical buffers only after an exact source-chain identity check, then independently reconstructs every path point from original endpoint triangles or shared indexed edges and verifies each segment's original face interior and transition. All exceptions and people survive in one report. The planar companion unit proves normal/actual-defect/known-delta sensitivity and triangulation bias removal.
 * @evidence contracts/testing.md#independent-expectations Expected shoulder-to-apex length is the unchanged public input. Both physical readings must meet 0.05 mm numerical closure, tighter than the producer's historical 0.5 mm chord setting, which is not repurposed as an anatomical or integration allowance. The observer derives coordinates and length independently from original triangles, not the producer's length or unfolding chart. Indexed connected-component count must be one for this three-owner partial event tree; three independently capped columns are red. Source-to-emitted boundary residuals are preserved separately without a tolerance claiming source C0. Clinical sites remain unregistered.
 * @evidence contracts/testing.md#distinguishing-cases Includes all four references and five maintained domain extremes, varying body lengths, breadths and sex together. A failed producer, missing address, nonfinite point or unavailable skin crossing fails that person while later people continue. Full body composition, arms, hands and clinical acceptance belong to the complete body audits; this part test cannot replace them.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous portable CPU integration without processes, I/O, browser or GPU. It attempts nine columns, no whole person. One operation-local callback retains the last actual constructor surface for reuse; optional local persistence observes the same unchanged objects. The mesh is shaded once after exact source admission, not rebuilt for the independent reader. Missing arms, legs and head children remain explicit partial-consumer limits.
 */
export function test_human_trunk_surface_course(): void {
  /** All supported attempts survive into the final failure report. */
  const audit: HumanFixtureAudit = new HumanFixtureAudit("supported-column-surface-course", "actual-trunk-and-skin");
  for (const alias of HumanPeople.names())
    audit.run({ scenario: "1-3 actual supported column", person: alias, part: ["trunk", "upper", "head"], interval: "entire declared course", phase: "anterior registered lateral progression" }, (): void => {
      const started: number = performance.now();
      try {
        Observation.publish({ kind: "start", person: alias, parameters: HumanPeople.parameters(alias) });
        /** Inputs are canonical public values, independent of generated measurements. */
        const input: ReturnType<typeof Fixture.inputs> = Fixture.inputs(HumanPeople.parameters(alias));
        /** A production failure is caught by the enclosing collector as a failure. */
        let latest: SourceObservation.IEvent | undefined;
        const observe: SourceObservation.Listener = (event: SourceObservation.IEvent): void => {
          if (event.surface !== undefined) latest = event;
          if (Observation.listening()) Observation.publish({ kind: "source", person: alias, event });
        };
        const body: Body = Fixture.generate(HumanPeople.parameters(alias), input, observe);
        Observation.publish({ kind: "body", person: alias, body });
        /** The producer publishes only geometry and its explicit model premise. */
        const address: NonNullable<Body["thoracicCourse"]> | undefined = body.thoracicCourse;
        if (address === undefined) throw new Error("The actual trunk omitted its geometric thoracic course");
        if (latest?.surface === undefined || latest.reading === undefined || !("physicalStage" in latest.reading)) throw new Error("The actual trunk omitted its emitted physical closure evidence");

        /** Buffer reuse is valid only under the identical once-composed source and chain order. */
        const sourceChains: Chain[] = [...latest.state.finished, latest.neck];
        if (JSON.stringify(sourceChains) !== JSON.stringify(body.chains) || JSON.stringify(latest.physicalBody?.events) !== JSON.stringify(body.events)) throw new Error("The final partial column differs from the constructor's physical source", { cause: { person: alias, stage: "physical buffer reuse", expected: "Identical once-composed source chains, chain order and production events" } });
        const source: Course.IReading = latest.reading;
        const geometry: Surface.IGeometry = latest.surface;
        const context: Record<string, unknown> = { scenario: "1-4 actual supported partial column", person: alias, part: address.owners, interval: [address.from.station, address.to.station], station: address, phase: "actual emitted anterior corridor", clinicalIdentity: "unavailable: this is a declared model course", missingBranches: ["arms", "legs", "head children"] };
        audit.run({ ...context, observationStage: "constructor emitted path" }, (): void => {
          audit.measure("constructor emitted-path length", source.length, input.shoulderToApex, 0.05, "mm");
          for (let index: number = 0; index < source.points.length; index++) {
            audit.scope({ ...context, observationStage: "finite constructor emitted point", station: source.addresses[index], coordinates: source.points[index] });
            audit.check("constructor emitted point is finite", source.points[index]!.length === 3 && source.points[index]!.every(Number.isFinite));
          }
        });
        audit.run({ ...context, observationStage: "indexed physical connectivity" }, (): void => {
          audit.measure("indexed connected partial column", components(geometry), 1, 0, "components");
        });
        audit.run({ ...context, observationStage: "independent original-triangle path" }, (): void => {
          try {
            const skin: Skin.IReading = Skin.read(geometry, source, address.from, address.to);
            Observation.publish({ kind: "measurement", person: alias, expected: input.shoulderToApex, source, skin });
            audit.scope({ ...context, observationStage: "independent original-triangle path", coordinates: skin.points, triangleOffsets: skin.triangles });
            audit.measure("independent emitted skin physical length", skin.length, input.shoulderToApex, 0.05, "mm");
          } catch (error) { Observation.publish({ kind: "failure", person: alias, error }); throw error; }
        });
        audit.run({ ...context, observationStage: "original shading normals" }, (): void => {
          const physical: Surface.IOutput = Surface.shade(body, geometry);
          Observation.publish({ kind: "skin", person: alias, skin: physical });
          audit.measure("one original normal per actual coordinate", physical.normals.length, physical.mesh.positions.length, 0, "coordinates");
          for (let vertex: number = 0; vertex < physical.normals.length / 3; vertex++) {
            const normal: number[] = physical.normals.slice(3 * vertex, 3 * vertex + 3);
            audit.scope({ ...context, observationStage: "original shading normal", vertex, coordinates: physical.mesh.positions.slice(3 * vertex, 3 * vertex + 3), normal });
            audit.check("finite nonzero original normal", normal.length === 3 && normal.every(Number.isFinite) && Math.hypot(...normal) > 0);
          }
        });
        for (const boundary of latest.boundaries ?? [])
          for (const witness of boundary.points) {
            audit.scope({ scenario: "4 actual source-to-mesh boundary observation", person: alias, part: boundary.chain, station: boundary.station, phase: witness.phase, coordinates: witness.source, emitted: witness.emitted, observedResidual: witness.residual, units: "mm", interpretation: "source residual retained, no source C0 or anatomy acceptance" });
            audit.check("finite source/emitted boundary observation", [...witness.source, ...witness.emitted, witness.residual].every(Number.isFinite));
          }
      } catch (error) {
        Observation.publish({ kind: "failure", person: alias, error });
        throw error;
      } finally {
        Observation.publish({ kind: "end", person: alias, milliseconds: performance.now() - started });
      }
    });
  audit.finish();
}

/** Count actual indexed face components; coincident vertices are never welded by position. */
function components(skin: Surface.IGeometry): number {
  if (skin.mesh.positions.length % 3 !== 0 || skin.mesh.indices.length % 3 !== 0 || skin.mesh.indices.some((vertex: number): boolean => !Number.isInteger(vertex) || vertex < 0 || vertex * 3 + 2 >= skin.mesh.positions.length))
    throw new Error("An indexed component observation has invalid original buffers", { cause: { units: "coordinate and vertex counts", positions: skin.mesh.positions.length, indices: skin.mesh.indices.length } });
  const parent: number[] = Array.from({ length: skin.mesh.positions.length / 3 }, (_: unknown, index: number): number => index);
  const used: Set<number> = new Set(skin.mesh.indices);
  const root: (vertex: number) => number = (vertex: number): number => {
    while (parent[vertex] !== vertex) { parent[vertex] = parent[parent[vertex]!]!; vertex = parent[vertex]!; }
    return vertex;
  };
  for (let offset: number = 0; offset < skin.mesh.indices.length; offset += 3) {
    const ids: number[] = skin.mesh.indices.slice(offset, offset + 3);
    for (const vertex of ids.slice(1)) parent[root(vertex)] = root(ids[0]!);
  }
  return new Set([...used].map(root)).size;
}
