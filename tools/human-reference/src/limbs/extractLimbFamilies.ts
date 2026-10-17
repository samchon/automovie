import { fileURLToPath } from "node:url";

import type { Bone } from "../geometry/Bone.ts";
import type { Skin } from "../geometry/Skin.ts";
import { buildSkin } from "../geometry/buildSkin.ts";
import { dist } from "../geometry/dist.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import { readInput } from "../io/readInput.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import type { LimbDimension } from "./LimbDimension.ts";
import type { LimbSegment } from "./LimbSegment.ts";
import type { LimbStation } from "./LimbStation.ts";
import { limbSectionDimension } from "./limbSectionDimension.ts";
import { limbSourceSection } from "./limbSourceSection.ts";
import { limbTrainingStations } from "./limbTrainingStations.ts";

/**
 * Produces private local limb observations and excluded midpoint sections from
 * hash-declared native source inputs. It preserves authoritative anchor rings,
 * independent dimensions and the original guide evidence without inflating confidence.
 *
 * @evidence contracts/common.md#principled-implementation Exact source intersections subdivide physical rig-axis anchor intervals. Midpoints are held out from training, and the output explicitly retains unresolved overlapping joint families and native elbow posture.
 * @evidence contracts/common.md#clear-and-simple-design Owns local observation production only; hash admission, source geometry, fitting and immutable publication have separate named owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Produces no product geometry, identity-specific coefficients or replacement Human tests. Inherited branch heuristics remain identified as unqualified diagnostic flags.
 * @evidence contracts/common.md#meaningful-documentation States source posture, exact shared boundaries, excluded observations and the distinction between measurement and regenerated-surface acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Reuses one assembled skin, then performs one source cut per added or held-out station. For s cuts and t source triangles, cutting dominates at O(s t); output memory grows with measured contour points.
 * @evidence contracts/performance.md#reuse-equivalent-work Original anchor and guide records are reused verbatim. Input byte hashes and the output manifest bind those dependencies; immutable artifact writing reuses only identical bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source skin lives for this operation; each region is published before its working contours leave scope. No watcher, child process or persistent mesh cache is created.
 */
export function extractLimbFamilies(
  manifest: ReferenceManifest,
  outputDir: string,
  spacingMm: number,
): { path: string; sha256: string } {
  if (manifest.pose !== "native-A")
    throw new Error(
      "Local limb observations require the native source posture",
    );
  if (!Number.isFinite(spacingMm) || spacingMm <= 0)
    throw new Error("Observation spacing must be finite positive millimetres");
  const gate: ReturnType<typeof loadGate> = loadGate(manifest);
  const skin: Skin = buildSkin(gate.body, gate.head, "native-A");
  const artifacts: { path: string; sha256: string }[] = [];
  const runtimeModuleFile: string = fileURLToPath(import.meta.url);
  const runtimeModuleSha256: string = sha256(runtimeModuleFile);
  for (const side of ["l", "r"] as const) {
    for (const upper of [true, false]) {
      const region: string = `${upper ? "upperlimb" : "lowerlimb"}-${side}`;
      const inherited: RegionFile = readInput<RegionFile>(manifest, region);
      if (
        inherited.units !== "mm" ||
        inherited.gate !== manifest.gate ||
        inherited.frame !== manifest.frame
      )
        throw new Error(
          `Reference frame, units or identity disagree: ${region}`,
        );
      const segments: LimbSegment[] = upper
        ? [
            {
              key: "upperarm",
              proximal: `upperarm_${side}`,
              distal: `lowerarm_${side}`,
            },
            {
              key: "forearm",
              proximal: `lowerarm_${side}`,
              distal: `hand_${side}`,
            },
          ]
        : [
            { key: "thigh", proximal: `thigh_${side}`, distal: `calf_${side}` },
            { key: "shank", proximal: `calf_${side}`, distal: `foot_${side}` },
          ];
      const training: Section[] = [];
      const heldOut: Section[] = [];
      const grids: object[] = [];
      const boundaries: object[] = [];
      for (const segment of segments) {
        const anchors: Section[] = inherited.sections.filter(
          (section: Section): boolean =>
            section.family === `${region}.${segment.key}`,
        );
        if (
          anchors.length < 2 ||
          anchors.some(
            (section: Section, index: number): boolean =>
              section.pose !== "native-A" ||
              section.station.mm === undefined ||
              section.station.deg !== undefined ||
              (index > 0 &&
                section.station.fraction <=
                  anchors[index - 1].station.fraction),
          )
        )
          throw new Error(
            `Expected an ordered native source section family: ${region}.${segment.key}`,
          );
        const proximal: Bone | undefined = skin.bones.get(segment.proximal);
        const distal: Bone | undefined = skin.bones.get(segment.distal);
        if (!proximal || !distal)
          throw new Error(
            `Missing source rig markers for ${region}.${segment.key}`,
          );
        const lengthMm: number = dist(proximal.pos, distal.pos);
        const widths: number[] = anchors
          .filter(
            (section: Section): boolean =>
              section.status === "closed" &&
              section.station.fraction >= 0.3 &&
              section.station.fraction <= 0.8,
          )
          .flatMap((section: Section): number[] => {
            const selected: LoopRecord | undefined = section.loops.find(
              (loop: LoopRecord): boolean =>
                loop.role === "selected" && loop.closed,
            );
            return selected
              ? [Math.max(selected.breadthU, selected.depthV)]
              : [];
          })
          .sort((a: number, b: number): number => a - b);
        const medianWidthMm: number = widths[Math.floor(widths.length / 2)];
        if (
          !(
            Number.isFinite(lengthMm) &&
            lengthMm > 0 &&
            Number.isFinite(medianWidthMm) &&
            medianWidthMm > 0
          )
        )
          throw new Error(
            `Source segment has no positive axis or middle-section width: ${region}.${segment.key}`,
          );
        const stations: LimbStation[] = limbTrainingStations(
          anchors,
          lengthMm,
          spacingMm,
        );
        const trainingIds: string[] = [];
        const heldOutIds: string[] = [];
        let maxGapMm: number = 0;
        for (let i: number = 0; i < stations.length; i++) {
          const station: LimbStation = stations[i];
          const section: Section =
            station.anchor ??
            limbSourceSection(
              skin,
              region,
              segment,
              station.mm,
              false,
              medianWidthMm,
            );
          training.push(section);
          trainingIds.push(section.id);
          if (i > 0) {
            const gapMm: number = station.mm - stations[i - 1].mm;
            maxGapMm = Math.max(maxGapMm, gapMm);
            const excluded: Section = limbSourceSection(
              skin,
              region,
              segment,
              (station.mm + stations[i - 1].mm) / 2,
              true,
              medianWidthMm,
            );
            heldOut.push(excluded);
            heldOutIds.push(excluded.id);
          }
        }
        grids.push({
          family: `${region}.${segment.key}`,
          training: trainingIds,
          heldOut: heldOutIds,
          maxObservedTrainingGapMm: maxGapMm,
          referenceAxisLengthMm: lengthMm,
        });
        for (const fraction of [0.5, 1]) {
          const anchor: Section | undefined = anchors.find(
            (section: Section): boolean =>
              section.station.fraction === fraction,
          );
          if (anchor)
            boundaries.push({
              role:
                fraction === 1
                  ? segment.key === "forearm"
                    ? "wrist"
                    : segment.key === "shank"
                      ? "ankle"
                      : "joint-end"
                  : "simple-tube-cut",
              input: region,
              source: manifest.files[region],
              sourceSection: anchor.id,
              section: anchor,
              limits:
                "Construction boundary; not a clinical landmark or anatomical insertion.",
            });
        }
      }
      const joints: Section[] = inherited.sections.filter(
        (section: Section): boolean =>
          !segments.some(
            (segment: LimbSegment): boolean =>
              section.family === `${region}.${segment.key}`,
          ),
      );
      const payload: object = {
        ...inherited,
        owner: "human-reference/limbs",
        createdAt: new Date().toISOString(),
        sourceCreatedAt: inherited.createdAt,
        tool: { file: runtimeModuleFile, sha256: runtimeModuleSha256 },
        producer: {
          module: "limbs/extractLimbFamilies",
          runtimeModuleSha256,
          manifest,
        },
        observationSource: manifest.files[region],
        sections: [...training, ...joints],
        heldOutSections: heldOut,
        grids,
        sharedBoundaries: boundaries,
        sectionDimensions: training
          .map(limbSectionDimension)
          .filter(
            (dimension: LimbDimension | null): boolean => dimension !== null,
          ),
        heldOutPolicy:
          "All axial training-interval midpoints are excluded from fitting, guide extraction and interpolation constraints; consumers may only evaluate their reconstructed surfaces against them.",
        limits: [
          ...inherited.limits,
          "Dense source contours are diagnostic measurements, not product control tables or anatomical coefficients.",
          "Shared boundary rings are reused verbatim; their independently rounded plane is not recut to replace them.",
          "Original guide confidence remains based on its original anchor grid, without inflation from additional observations.",
          "Overlapping tube and bisector joint families still require consumer correspondence and transverse derivative qualification.",
          "Native elbows remain bent; no unfolded T-pose tissue observation is inferred.",
          "No geometric or visual acceptance is implied before fitted-curve reconstruction, excluded-section qualification and actual hardware inspection.",
        ],
      };
      artifacts.push(writeArtifact(outputDir, `${region}.json`, payload));
    }
  }
  return writeArtifact(outputDir, "MANIFEST.json", {
    schema: "human-reference-limb-observations-v1",
    input: manifest,
    spacingMm,
    artifacts,
    consumerAdmission:
      "Every artifact hash must match this complete output manifest; heldOutSections remain excluded from fitting.",
  });
}
