import type { IAutoMovieMesh } from "@automovie/interface";
import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "./IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IHumanBodySourceShapeResult } from "./IHumanBodySourceShapeResult";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";
import { readHumanBodySourceBoundaryVolume } from "./readHumanBodySourceBoundaryVolume";
import { assertHumanBodySourceSurfaceShapeField } from "./assertHumanBodySourceSurfaceShapeField";
import { createHumanBodySourceResidentMesh } from "./createHumanBodySourceResidentMesh";

/** Exact cubic coefficients of one linear source field's tetrahedral volume; topology is admitted separately. */
function volumePolynomial(mesh: IAutoMovieMesh, delta: readonly number[]): [number, number, number, number] {
  const indices = mesh.indices!;
  const origin = indices[0];
  const determinant = (a: readonly number[], b: readonly number[], c: readonly number[]): number =>
    a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  const coefficients: [number, number, number, number] = [0, 0, 0, 0];
  const corrections = [0, 0, 0, 0];
  for (let at = 0; at < indices.length; at += 3) {
    const vertices = indices.slice(at, at + 3);
    const [a, b, c] = vertices.map(vertex => [0, 1, 2].map(axis => mesh.positions[3 * vertex + axis] - mesh.positions[3 * origin + axis]));
    const [da, db, dc] = vertices.map(vertex => [0, 1, 2].map(axis => delta[3 * vertex + axis] - delta[3 * origin + axis]));
    const terms = [determinant(a, b, c), determinant(da, b, c) + determinant(a, db, c) + determinant(a, b, dc),
      determinant(da, db, c) + determinant(da, b, dc) + determinant(a, db, dc), determinant(da, db, dc)];
    for (let degree = 0; degree < 4; degree++) {
      const adjusted = terms[degree] / 6 - corrections[degree], next = coefficients[degree] + adjusted;
      corrections[degree] = (next - coefficients[degree]) - adjusted; coefficients[degree] = next;
    }
  }
  if (!coefficients.every(Number.isFinite)) throw new Error("Source boundary-volume polynomial is not finite.");
  return coefficients;
}

/**
 * Solve registered anatomical volume targets on actual source-owned fields.
 * Paths address the existing anatomical record directly; no tissue catalogue
 * or personal mesh is introduced. A producer's supported coefficient domain,
 * actual closed compartment members and held source attachment vertices are
 * required. Anatomical observations remain owned raw acquisition records and
 * are never promoted to target geometry. Their comparison remains unavailable
 * without separately registered acquisition correspondence.
 *
 * Each bound field is a one-dimensional source freedom. Its tetrahedral volume
 * is an exact cubic in the linear source coefficient. The derivative quadratic
 * proves monotonicity over the complete producer interval before bisection,
 * avoiding dozens of cloned mesh/topology passes. The consumer then
 * rereads the achieved Float64 metric and separately the Float32 source
 * boundary volume. Conversion guards keep every resident face; the reported
 * Float32 value preserves its actual rounding difference from the target.
 * Multiple independent fields
 * on one part are not accepted until their coupled source solve is registered;
 * several requests on the same field must agree on the achieved coefficient.
 * Source rig/site/skin updates belong to a source profile extension, not a
 * silent relaxation of the existing assembly's exact shape registration.
 * Original source arrays, rights, compiled digests and bindings remain intact;
 * returned shape meshes are owned and consumed before the same rig poses them.
 *
 * @evidence contracts/common.md#principled-implementation Actual closed-boundary volume is solved within one producer-defined field domain; final metric and representable geometry are reread before owned results are returned.
 * @evidence contracts/common.md#clear-and-simple-design Existing record paths, one source field and original member identity form the consumer; publication and rigid attachment stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bbox/header volume, clinical default, positive-all domain, observed-to-target cast or per-part carrier enters.
 * @evidence contracts/common.md#meaningful-documentation States supported freedom, clinical/acquisition separation, shape registration and immutable source provenance.
 * @evidence contracts/modeling.md#parameter-channels Named absolute volume targets solve a source-owned coefficient without exposing private displacement arrays.
 * @evidence contracts/modeling.md#spatial-conventions Source fields use common-neutral metres and actual boundary volume converts to input millilitres by 1e6.
 * @evidence contracts/modeling.md#shared-boundaries Declared source held vertices have zero displacement; missing graph/site/skin adaptation is not replaced by an independent transform.
 * @evidence contracts/anatomy.md#anatomical-source Compartment/protocol/target conditions are supplied by the actual source binding; mathematical volume does not certify clinical segmentation or population support.
 * @author Samchon
 */
export function dataSourceShapes(
  assembly: Pick<IAutoMovieHumanBodyAnatomicalAssembly, "parts">,
  anatomy: IAutoMovieHumanBodyAnatomicalMeasurements | undefined,
  observeQuantityComplete?: (part: IAutoMovieHumanBodySourcePart["id"], path: string) => void,
): IHumanBodySourceShapeResult {
  const meshes = new Map<IAutoMovieHumanBodySourcePart["id"], ReadonlyMap<string, IAutoMovieMesh>>();
  const readings: IHumanBodySourceQuantityReading[] = [];
  if (anatomy === undefined) return { meshes, readings };
  const record = (path: string): IAutoMovieHumanBodyAnatomicalVolume | undefined => {
    if (path.trim() === "" || path.split(".").some(key => key === "" || ["__proto__", "prototype", "constructor"].includes(key)))
      throw new Error("Source quantity needs an exact existing anatomical record path.");
    let node: unknown = anatomy;
    for (const key of path.split(".")) {
      if (node === undefined) return undefined;
      if (node === null || typeof node !== "object" || !Object.hasOwn(node, key)) return undefined;
      node = (node as Record<string, unknown>)[key];
    }
    if (node === undefined) return undefined;
    if (node === null || typeof node !== "object" || !("kind" in node) || !("millilitres" in node) ||
      (node.kind !== "target" && node.kind !== "observed") || typeof node.millilitres !== "number" ||
      !Number.isFinite(node.millilitres) || node.millilitres <= 0)
      throw new Error("Source volume binding does not address a positive anatomical volume record: " + path);
    // The existing anatomical admission owns the observed acquisition schema.
    return node as IAutoMovieHumanBodyAnatomicalVolume;
  };
  const paths = new Set<string>();
  for (const part of assembly.parts) {
    const owned = new Map<string, IAutoMovieMesh>();
    let solvedField: string | undefined;
    let solvedCoefficient: number | undefined;
    for (const binding of part.quantityBindings ?? []) {
      if (paths.has(binding.path)) throw new Error("Source quantity path has more than one anatomical owner: " + binding.path);
      paths.add(binding.path);
      const input = record(binding.path);
      if (input === undefined) continue;
      if (binding.sourceProtocol.trim() === "" || binding.targetCondition.trim() === "" || binding.members.length === 0 ||
        new Set(binding.members).size !== binding.members.length)
        throw new Error("Source quantity needs actual compartment/protocol/target conditions: " + binding.path);
      if (input.kind === "observed") {
        readings.push({ path: binding.path, input: structuredClone(input), sourceMillilitres: null, sourceFloat32Millilitres: null,
          qualification: "acquisition-correspondence-unavailable; raw observation preserved without shaping" });
        observeQuantityComplete?.(part.id, binding.path);
        continue;
      }
      if (binding.members.length !== 1)
        throw new Error("Source compartment needs registered union/cavity membership before a multi-boundary volume target can be solved: " + binding.path);
      const field = part.shapeFields?.find(candidate => candidate.id === binding.field);
      if (field === undefined || field.domainAccount.trim() === "" || ![field.minimumCoefficient, field.maximumCoefficient].every(Number.isFinite) ||
        field.minimumCoefficient > 0 || field.maximumCoefficient < 0 || field.minimumCoefficient >= field.maximumCoefficient)
        throw new Error("Source volume target has no producer-supported shape field: " + binding.path);
      if (solvedField !== undefined && solvedField !== field.id)
        throw new Error("Source part needs a registered coupled solve for independent quantity fields: " + part.id);
      const selected = binding.members.map(member => {
        const surface = part.surfaces.find(candidate => candidate.id === member);
        const delta = field.surfaces.find(candidate => candidate.member === member);
        if (surface === undefined || delta === undefined)
          throw new Error("Source volume shape field/member or held attachment is invalid: " + binding.path + "/" + member);
        assertHumanBodySourceSurfaceShapeField(delta, surface.mesh.positions.length / 3);
        return { surface, delta };
      });
      if (new Set(field.surfaces.map(member => member.member)).size !== field.surfaces.length ||
        field.surfaces.some(member => !binding.members.includes(member.member)))
        throw new Error("Source volume field must declare every affected member in its compartment scope: " + binding.path);
      const shape = (coefficient: number): Map<string, IAutoMovieMesh> => new Map(selected.map(({ surface, delta }) => [surface.id,
        { ...structuredClone(surface.mesh), positions: surface.mesh.positions.map((value, at) => value + coefficient * delta.displacements[at]) }]));
      const polynomial: [number, number, number, number] = [0, 0, 0, 0];
      for (const { surface, delta } of selected) {
        readHumanBodySourceBoundaryVolume(surface.mesh);
        const coefficients = volumePolynomial(surface.mesh, delta.displacements);
        for (let degree = 0; degree < 4; degree++) polynomial[degree] += coefficients[degree];
      }
      const volume = (coefficient: number): number => ((polynomial[3] * coefficient + polynomial[2]) * coefficient + polynomial[1]) * coefficient + polynomial[0];
      let low = field.minimumCoefficient, high = field.maximumCoefficient;
      const lowVolume = volume(low), highVolume = volume(high), target = input.millilitres * 1e-6;
      if (![lowVolume, highVolume, target].every(Number.isFinite) || lowVolume <= 0 || highVolume <= 0 || lowVolume === highVolume || target < Math.min(lowVolume, highVolume) || target > Math.max(lowVolume, highVolume))
        throw new Error("Anatomical volume target is outside the actual source field's boundary-volume reach: " + binding.path);
      const increasing = highVolume > lowVolume;
      const derivative = (coefficient: number): number => (3 * polynomial[3] * coefficient + 2 * polynomial[2]) * coefficient + polynomial[1];
      const critical = polynomial[3] === 0 ? undefined : -polynomial[2] / (3 * polynomial[3]);
      const derivativeSamples = [derivative(low), derivative(high), ...(critical !== undefined && critical > low && critical < high ? [derivative(critical)] : [])];
      if (derivativeSamples.some(value => !Number.isFinite(value) || (increasing ? value <= 0 : value >= 0)))
        throw new Error("Source boundary-volume field is not strictly monotone throughout its supported interval: " + binding.path);
      for (let step = 0; step < 80; step++) {
        const middle = low / 2 + high / 2;
        if (middle === low || middle === high) break;
        const measured = volume(middle);
        if ((measured < target) === increasing) low = middle; else high = middle;
      }
      const coefficient = low / 2 + high / 2;
      const result = shape(coefficient);
      let measured = 0;
      let measuredFloat32 = 0;
      for (const [member, mesh] of result) {
        mesh.normals = areaWeightedNormals(mesh.positions, mesh.indices!);
        const resident = createHumanBodySourceResidentMesh(mesh).mesh;
        const float32 = float32MeshBuffers(resident, "source-volume:" + binding.path + "/" + member);
        measured += readHumanBodySourceBoundaryVolume(mesh);
        measuredFloat32 += readHumanBodySourceBoundaryVolume({ ...resident, positions: Array.from(float32.positions), indices: Array.from(float32.indices) });
        owned.set(member, mesh);
      }
      const arithmeticBound = Number.EPSILON * Math.max(target, measured) * selected.reduce((sum, entry) => sum + entry.surface.mesh.indices!.length, 0);
      if (Math.abs(measured - target) > arithmeticBound)
        throw new Error("Source shape freedom cannot meet the actual boundary-volume target: " + binding.path);
      if (solvedCoefficient !== undefined && Math.abs(solvedCoefficient - coefficient) > Number.EPSILON * Math.max(1, Math.abs(coefficient)))
        throw new Error("Anatomical volume targets request conflicting coefficients of one source field: " + part.id);
      solvedField = field.id; solvedCoefficient = coefficient;
      readings.push({ path: binding.path, input: structuredClone(input), sourceMillilitres: measured * 1e6,
        sourceFloat32Millilitres: measuredFloat32 * 1e6, coefficient,
        qualification: binding.sourceProtocol + "; " + binding.targetCondition + "; " + field.domainAccount +
          "; Float64 source target solve; Float32 source boundary volume reported separately; clinical validity unavailable" });
      observeQuantityComplete?.(part.id, binding.path);
    }
    if (owned.size !== 0) meshes.set(part.id, owned);
  }
  return { meshes, readings };
}
