import { fileURLToPath } from "node:url";

import type { Bone } from "../geometry/Bone.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { buildSkin } from "../geometry/buildSkin.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { Family } from "../schema/Family.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import type { TrunkProtocol } from "./TrunkProtocol.ts";
import { readTrunkProtocol } from "./readTrunkProtocol.ts";
import { trunkGuides } from "./trunkGuides.ts";
import { trunkLevelStations } from "./trunkLevelStations.ts";
import { trunkMidlineSection } from "./trunkMidlineSection.ts";
import { trunkSection } from "./trunkSection.ts";
import { trunkValidationSections } from "./trunkValidationSections.ts";

/**
 * Extracts a native trunk family from explicit hash-bound private inputs.
 * Its crop is supplied by a named protocol, its upper marker is source neck01,
 * and independent midpoint and vertical planes remain excluded from fitting.
 * The immutable artifact contains observations rather than a product mesh.
 *
 * @evidence contracts/common.md#principled-implementation Applies one registered native frame and one admitted crop protocol to source plane intersections, source-supported midsagittal guides and reserved validation planes. A provisional lower crop stays explicitly unqualified and dense observations do not establish a parametric anatomical model.
 * @evidence contracts/common.md#clear-and-simple-design Composes separately owned loading, geometric cuts, scope, sampling, guides and immutable publication. No transient scratch import or hardcoded private path is required.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads coordinates only from hash-bound private inputs; maintained source contains no identity table, source topology transplant, pose corrective or local coordinate patch.
 * @evidence contracts/common.md#meaningful-documentation States native frame, boundary ownership, validation exclusion, immutable outputs and the limits of geometric observations.
 * @evidence contracts/performance.md#efficient-algorithms Cutting s planes costs O(s*(v+t)) for source vertices and triangles, with additional closed-contour hull sorting and guide/profile segment matching. Arrays retain the emitted curves rather than source meshes in the artifact.
 * @evidence contracts/performance.md#reuse-equivalent-work Loads and combines one source skin, then shares that skin and one protocol across every section and guide. Input hashes and publication hashes preserve byte identity without a shared cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one synchronous extraction; source arrays and temporary cuts become collectible on return. The writer closes publication handles and preserves any different existing artifact.
 */
export function runTrunk(
  manifest: ReferenceManifest,
  output: string,
): { path: string; sha256: string } {
  if (
    manifest.pose !== "native-A" ||
    !manifest.frame.includes("+X subject-left") ||
    !manifest.frame.includes("+Y up") ||
    !manifest.frame.includes("+Z front")
  )
    throw new Error(
      "Trunk extraction requires the declared native subject-left/up/front frame",
    );
  const protocol: TrunkProtocol = readTrunkProtocol(manifest);
  const gate: ReturnType<typeof loadGate> = loadGate(manifest);
  const neck: Bone | undefined = gate.body.boneByName.get("neck_01");
  if (!neck)
    throw new Error("Native source has no declared neck01 upper marker");
  const upperHeightMm: number = neck.pos[1];
  const grid: ReturnType<typeof trunkLevelStations> = trunkLevelStations(
    protocol.lowerHeightMm,
    upperHeightMm,
    protocol.spacingMm,
  );
  const skin: Skin = buildSkin(gate.body, gate.head, "native-A");
  const spanMm: number = upperHeightMm - protocol.lowerHeightMm;
  const training: Section[] = grid.training.map(
    (yMm: number, index: number): Section =>
      trunkSection(
        skin,
        yMm,
        (yMm - protocol.lowerHeightMm) / spanMm,
        "trunk.h",
        `trunk.h.${index}`,
      ),
  );
  const validation: Section[] = grid.validation.map(
    (yMm: number, index: number): Section =>
      trunkSection(
        skin,
        yMm,
        (yMm - protocol.lowerHeightMm) / spanMm,
        "trunk.validation.h",
        `trunk.validation.h.${index}`,
      ),
  );
  const support: V3[] = training.flatMap((section: Section): V3[] =>
    section.loops
      .filter((loop: LoopRecord): boolean =>
        section.status === "merged"
          ? loop.role === "clipped-arc"
          : loop.role === "selected",
      )
      .flatMap((loop: LoopRecord): V3[] => loop.points),
  );
  const vertical: ReturnType<typeof trunkValidationSections> =
    trunkValidationSections(
      skin,
      protocol.lowerHeightMm,
      upperHeightMm,
      support,
      protocol.validationIntervals,
    );
  const midline: Section = trunkMidlineSection(
    skin,
    protocol.lowerHeightMm,
    upperHeightMm,
  );
  const families: Family[] = [
    {
      id: "trunk.h",
      kind: "level",
      axis: "native +Y horizontal source cuts",
      fraction0: `${protocol.lowerBoundaryMethod}; ${protocol.lowerHeightMm} mm`,
      fraction1: `source neck01 rig marker ${upperHeightMm} mm`,
      reference: "posterior (-Z)",
      phaseLabels: {
        "0": "anterior",
        "90": "subject-left",
        "180": "posterior",
        "270": "subject-right",
      },
    },
    {
      id: "trunk.validation.h",
      kind: "level",
      axis: "native +Y reserved midpoint cuts, excluded from fitting",
      fraction0: `same crop ${protocol.lowerHeightMm} mm`,
      fraction1: `same neck01 ${upperHeightMm} mm`,
      reference: "posterior (-Z)",
      phaseLabels: {
        "0": "anterior",
        "90": "subject-left",
        "180": "posterior",
        "270": "subject-right",
      },
    },
    {
      id: "trunk.longitudinal.midsagittal",
      kind: "sagittal",
      axis: "world x=0 source cut, cropped at both declared height boundaries",
      fraction0: "x=0",
      fraction1: "x=0",
      reference: "world +Y",
      phaseLabels: { "0": "inferior", "180": "superior" },
    },
    ...vertical.families,
  ];
  const sourceFiles: string[] = [
    "TrunkProtocol.ts",
    "readTrunkProtocol.ts",
    "clipSurfaceSegments.ts",
    "trunkArmShare.ts",
    "trunkGuides.ts",
    "trunkLevelStations.ts",
    "trunkMidlineSection.ts",
    "trunkSection.ts",
    "trunkValidationSections.ts",
    "runTrunk.ts",
    "main.ts",
  ];
  const region: RegionFile = {
    schema: "c2852-reflines-v4",
    gate: manifest.gate,
    region: "trunk",
    owner: "trunk",
    createdAt: new Date().toISOString(),
    units: "mm",
    frame: manifest.frame,
    sources: Object.entries(manifest.files).map(
      ([id, entry]): RegionFile["sources"][number] => ({
        file: entry.path,
        sha256: entry.sha256,
        pose: id === "body" || id === "head" ? "native-A" : "auxiliary",
      }),
    ),
    tool: {
      file: "tools/human-reference/src/trunk/runTrunk.ts",
      sha256: sha256(fileURLToPath(import.meta.url)),
    },
    families,
    sections: [...training, ...validation, ...vertical.sections, midline],
    courses: trunkGuides(midline, training),
    loops: [],
    silhouettes: [],
    landmarks: [],
    events: [],
    measures: [
      {
        id: "trunk.lower-crop-height",
        name: "declared lower crop",
        value: protocol.lowerHeightMm,
        unit: "mm",
        pose: "native-A",
        method: protocol.lowerBoundaryMethod,
      },
      {
        id: "trunk.neck01-height",
        name: "source neck01 rig height",
        value: upperHeightMm,
        unit: "mm",
        pose: "native-A",
        method:
          "native source bone translation; not a clinical cervicale measurement",
      },
    ],
    selfCheck: {
      protocol,
      reservedFamilies: families
        .filter((family: Family): boolean => family.id.includes(".validation."))
        .map((family: Family): string => family.id),
      sourceFiles: sourceFiles.map(
        (name: string): { file: string; sha256: string } => ({
          file: `tools/human-reference/src/trunk/${name}`,
          sha256: sha256(fileURLToPath(new URL(name, import.meta.url))),
        }),
      ),
      sourceDigestScope:
        "Trunk-owned leaves only; the execution snapshot must additionally bind shared geometry, schema and IO dependencies.",
    },
    limits: [
      "Geometric source observations do not establish clinical anatomy, population parameters, fitted cubic controls or a regenerated skin.",
      "The lower crop's method and qualification flag are preserved. A provisional crop must not be interpreted as the exact left/right thigh-branch join.",
      "All trunk.validation.* families are excluded from fitting. Reservation is relative to the emitted trunk.h stations and does not certify exclusion from another consumer's dense inputs.",
      "Arm scope uses a linear 0.5 rig-weight partition, not an anatomical insertion. Cropped arcs stay open and no surface cap is inferred.",
      "Diagnostic T tissue is not observed or fitted; native source pose has no claimed T-pose corrective anatomy.",
      "Finite reserved planes and observed residuals cannot bound complete-surface error or certify correspondence between identities.",
      "Regional CCW measurement loops do not retain an outward/cavity orientation witness; topological surface generation must use the separate qualified oriented observations.",
    ],
  };
  return writeArtifact(output, "trunk.json", region);
}
