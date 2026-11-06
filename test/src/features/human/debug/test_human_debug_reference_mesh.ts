import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { HumanDebugReferenceMesh } from "../../../../../packages/human/debug/compare/HumanDebugReferenceMesh";
import { HumanDebugReferencePieces } from "../../../../../packages/human/debug/compare/HumanDebugReferencePieces";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";

/**
 * Native reference display preserves source coordinates/addressing and only removes whole triangles.
 *
 * Synthetic triangles independently establish metre-to-mm selection and boundary exclusion.
 * When the private f1 artifact is present, print its byte identity/bounds and compare existing
 * horizontal section observations with direct original-triangle plane intersections. Those
 * distances measure registration/support; they are not targets or anatomical acceptance.
 * Quality-filtered source planes with no remaining observation are explicitly unavailable,
 * not failed native cuts. Their counts/range and native cut support are retained; registration
 * reads the nearest actually supported source plane without moving either source's coordinates.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual native adapter and reference selector; asserts array identity, ids, retained triangle order, coordinate units, empty crops and incompatible-input failures. Optional f1 measurement uses original triangles independently of section walls.
 * @evidence contracts/testing.md#independent-expectations A two-triangle analytic patch loses exactly its second triangle at x=1 mm; unchanged original arrays and native names establish no fitting or remapping. Plane intersections use linear edge interpolation, not the section renderer.
 * @evidence contracts/testing.md#distinguishing-cases Covers whole/partial selection, exact body identity, empty crops, invalid buffers/placement and optional private registration. Reports source planes emptied by existing admission separately from actual triangle support and measures only existing observations; no bounds or source quality rule is relaxed. Browser loading, fallback notices and hardware appearance need a real viewer round.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test under --include human_debug_reference_mesh. Optional private f1 data is read locally without Human generation, a generation slot, GPU, source copying or external transmission; its absence is reported explicitly.
 */
export function test_human_debug_reference_mesh(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 1, 0, 0.001, 1, 0, 0, 1, 0.001, 0.002, 1, 0],
    indices: [0, 1, 2, 1, 3, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const model: IAutoMovieModel = {
    id: "analytic reference",
    name: null,
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    materials: [],
    parts: ["head", "body"].map(
      (id: string): IAutoMovieModelPart => ({
        id,
        name: id,
        geometry: { type: "mesh", mesh },
        attachedBone: null,
        transform: null,
        material: null,
      }),
    ),
  };
  const original: string = JSON.stringify(model);
  const whole: ReturnType<typeof HumanDebugReferenceMesh> =
    HumanDebugReferenceMesh(model);
  const failures: string[] = [];
  if (
    whole.parts
      .map((part: IAutoMovieModelPart): string => part.id)
      .join(",") !== "human.skin.reference.head/0,human.skin.reference.body/0"
  )
    failures.push("Native ids were remapped");
  for (const part of whole.parts)
    if (
      part.geometry.type !== "mesh" ||
      part.geometry.mesh.positions !== mesh.positions ||
      part.geometry.mesh.indices !== mesh.indices ||
      part.geometry.mesh.normals !== null
    )
      failures.push("Whole display changed original geometry ownership");
  const clipped: ReturnType<typeof HumanDebugReferenceMesh> =
    HumanDebugReferenceMesh(
      model,
      (_region: string, x: number, y: number): boolean => y === 1000 && x <= 1,
    );
  if (
    clipped.regions.some(
      (region: (typeof clipped.regions)[number]): boolean =>
        region.keptTriangles !== 1,
    )
  )
    failures.push(
      "Metre-to-mm crop did not retain exactly one original triangle",
    );
  for (const part of clipped.parts)
    if (
      part.geometry.type !== "mesh" ||
      part.geometry.mesh.positions !== mesh.positions ||
      part.geometry.mesh.indices?.join(",") !== "0,1,2"
    )
      failures.push("Crop introduced or reordered triangle vertices");
  if (HumanDebugReferenceMesh(model, (): boolean => false).parts.length !== 0)
    failures.push("Empty crop invented a surface");
  const body: ReturnType<typeof HumanDebugReferenceMesh> =
    HumanDebugReferenceMesh(model, HumanDebugReferencePieces(["body"], []));
  if (
    body.parts.length !== 1 ||
    body.parts[0]!.id !== "human.skin.reference.body/0"
  )
    failures.push("Native body selection did not preserve its exact identity");
  if (
    HumanDebugReferenceMesh(model, HumanDebugReferencePieces(["trunk"], []))
      .parts.length !== 0
  )
    failures.push("A pack region was invented as a native body alias");
  const invalid: IAutoMovieModel[] = [
    { ...model, parts: [model.parts[0]!] },
    {
      ...model,
      parts: [
        {
          ...model.parts[0]!,
          transform: {
            translation: { x: 1, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
        },
        model.parts[1]!,
      ],
    },
    {
      ...model,
      parts: [
        {
          ...model.parts[0]!,
          geometry: {
            type: "mesh",
            mesh: { ...mesh, positions: [NaN, ...mesh.positions.slice(1)] },
          },
        },
        model.parts[1]!,
      ],
    },
    {
      ...model,
      parts: [
        {
          ...model.parts[0]!,
          geometry: { type: "mesh", mesh: { ...mesh, indices: [0, 1, 99] } },
        },
        model.parts[1]!,
      ],
    },
  ];
  for (const candidate of invalid) {
    let rejected: boolean = false;
    try {
      HumanDebugReferenceMesh(candidate);
    } catch {
      rejected = true;
    }
    if (!rejected) failures.push("Incompatible static artifact was accepted");
  }
  if (JSON.stringify(model) !== original)
    failures.push("Native display mutated source buffers");

  const file: string = path.resolve(
    __dirname,
    "../../../../.shots/f1/reference-model.json",
  );
  if (fs.existsSync(file)) {
    const bytes: Buffer = fs.readFileSync(file);
    const source: IAutoMovieModel = JSON.parse(
      bytes.toString("utf8"),
    ) as IAutoMovieModel;
    const adopted: ReturnType<typeof HumanDebugReferenceMesh> =
      HumanDebugReferenceMesh(source);
    console.log(
      "f1 native reference " +
        JSON.stringify({
          source: "test/.shots/f1/reference-model.json",
          bytes: bytes.length,
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
          crop: adopted.crop,
          regions: adopted.regions,
        }),
    );
    for (const name of ["head", "trunk"]) {
      const sections: HumanReferenceSections.ISection[] =
        HumanReferenceSections.sections("f1", name);
      if (sections.length === 0) {
        console.log("f1 native registration: no section support for " + name);
        continue;
      }
      // A trunk section is compared to the native body's complete cut, without relabelling that mesh.
      const native: IAutoMovieModelPart = source.parts.find(
        (part: IAutoMovieModelPart): boolean =>
          part.id === (name === "head" ? "head" : "body"),
      )!;
      if (native.geometry.type !== "mesh")
        throw new Error("Private native mesh premise changed");
      const available: HumanReferenceSections.ISection[] = sections.filter(
        (section: HumanReferenceSections.ISection): boolean =>
          [...section.loops, ...section.arcs].some(
            (loop: HumanReferenceSections.ILoop): boolean =>
              loop.points.length !== 0,
          ),
      );
      const unsupported: HumanReferenceSections.ISection[] = sections.filter(
        (section: HumanReferenceSections.ISection): boolean =>
          !available.includes(section),
      );
      console.log(
        "f1 native section support " +
          JSON.stringify({
            region: name,
            observations: sections.length,
            supported: available.length,
            unsupported: unsupported.length,
            unsupportedHeightRangeMm:
              unsupported.length === 0
                ? null
                : [unsupported[0]!.y, unsupported[unsupported.length - 1]!.y],
            unavailableReason:
              "no points after the existing source quality filter; not a native mesh cut failure",
          }),
      );
      if (available.length === 0) {
        failures.push("No independent source observation for " + name);
        continue;
      }
      const low: number = sections[0]!.y;
      const high: number = sections[sections.length - 1]!.y;
      const requested: Set<HumanReferenceSections.ISection> = new Set(
        [0.25, 0.5, 0.75].map(
          (share: number): HumanReferenceSections.ISection =>
            sections.reduce(
              (
                a: HumanReferenceSections.ISection,
                b: HumanReferenceSections.ISection,
              ): HumanReferenceSections.ISection =>
                Math.abs(b.y - (low + share * (high - low))) <
                Math.abs(a.y - (low + share * (high - low)))
                  ? b
                  : a,
            ),
        ),
      );
      for (const requestedSection of requested) {
        if (!available.includes(requestedSection))
          console.log(
            "f1 native unavailable plane " +
              JSON.stringify({
                native: native.id,
                sectionRegion: name,
                planeMm: requestedSection.y,
                status: "source-section-unavailable",
                points: 0,
                triangleSegments: cut(
                  native.geometry.mesh,
                  requestedSection.y / 1000,
                ).length,
                maxMm: null,
                meanMm: null,
              }),
          );
        const section: HumanReferenceSections.ISection = available.reduce(
          (
            a: HumanReferenceSections.ISection,
            b: HumanReferenceSections.ISection,
          ): HumanReferenceSections.ISection =>
            Math.abs(b.y - requestedSection.y) <
            Math.abs(a.y - requestedSection.y)
              ? b
              : a,
        );
        const segments: number[][] = cut(
          native.geometry.mesh,
          section.y / 1000,
        );
        const distances: number[] = [...section.loops, ...section.arcs].flatMap(
          (loop: HumanReferenceSections.ILoop): number[] =>
            loop.points.map((point: HumanReferenceSections.V3): number =>
              distance(point[0], point[2], segments),
            ),
        );
        if (
          distances.length === 0 ||
          segments.length === 0 ||
          !distances.every(Number.isFinite)
        )
          failures.push(
            "Missing independent registration support for " +
              name +
              " at " +
              section.y +
              " mm",
          );
        console.log(
          "f1 native registration " +
            JSON.stringify({
              native: native.id,
              sectionRegion: name,
              requestedPlaneMm: requestedSection.y,
              planeMm: section.y,
              points: distances.length,
              triangleSegments: segments.length,
              maxMm: distances.reduce(
                (a: number, b: number): number => Math.max(a, b),
                0,
              ),
              meanMm:
                distances.reduce((a: number, b: number): number => a + b, 0) /
                distances.length,
            }),
        );
      }
    }
  } else
    console.log(
      "f1 native reference artifact unavailable; private registration unverified",
    );
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

/** Direct linear triangle intersections with y=height, metres in and x/z segment mm out; coplanar faces are omitted. */
function cut(mesh: IAutoMovieMesh, height: number): number[][] {
  const out: number[][] = [];
  const indices: number[] = mesh.indices!;
  for (let i: number = 0; i < indices.length; i += 3) {
    const hits: [number, number][] = [];
    for (let j: number = 0; j < 3; j++) {
      const a: number = indices[i + j]! * 3;
      const b: number = indices[i + ((j + 1) % 3)]! * 3;
      const ay: number = mesh.positions[a + 1]!;
      const by: number = mesh.positions[b + 1]!;
      if (!((ay < height && by >= height) || (by < height && ay >= height)))
        continue;
      const t: number = (height - ay) / (by - ay);
      hits.push([
        (mesh.positions[a]! + t * (mesh.positions[b]! - mesh.positions[a]!)) *
          1000,
        (mesh.positions[a + 2]! +
          t * (mesh.positions[b + 2]! - mesh.positions[a + 2]!)) *
          1000,
      ]);
    }
    if (hits.length === 2) out.push([...hits[0]!, ...hits[1]!]);
  }
  return out;
}

/** Nearest Euclidean point-to-segment distance in a horizontal mm chart, independent of display walls. */
function distance(x: number, z: number, segments: readonly number[][]): number {
  let nearest: number = Infinity;
  for (const segment of segments) {
    const dx: number = segment[2]! - segment[0]!;
    const dz: number = segment[3]! - segment[1]!;
    const squared: number = dx * dx + dz * dz;
    const t: number =
      squared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((x - segment[0]!) * dx + (z - segment[1]!) * dz) / squared,
            ),
          );
    nearest = Math.min(
      nearest,
      Math.hypot(x - segment[0]! - t * dx, z - segment[1]! - t * dz),
    );
  }
  return nearest;
}
