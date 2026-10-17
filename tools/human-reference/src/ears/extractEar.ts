import type { HeadContext } from "../headneck/HeadContext.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import { earFoldCourses } from "./earFoldCourses.ts";
import { earSectionFamily } from "./earSectionFamily.ts";
import { earSupportWeights } from "./earSupportWeights.ts";
import { earTurningContours } from "./earTurningContours.ts";

/**
 * Builds source-supported private ear observations from declared rig groups.
 * Fixed extraction dimensions are numerical observation scales: half-millimetre
 * section spacing and quarter-millimetre feature sampling under a two-millimetre
 * neighborhood with 0.1 mm prominence. They are not anatomical coefficients.
 *
 * @evidence contracts/common.md#principled-implementation Three physical section families, independent source-normal contours and source-supported extrema tracks preserve multiple folds and open scope boundaries with declared uncertainty.
 * @evidence contracts/common.md#clear-and-simple-design The regional producer composes separately owned support, section, contour and correspondence operations into one provenance-bearing document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source bone names and byte hashes come only from the admitted private manifest; no source coordinates, topology tables or clinical feature certification enter maintained code.
 * @evidence contracts/common.md#meaningful-documentation The contract and returned limits distinguish numerical extraction scales, rig scope, geometric candidates and qualified parametric skin.
 * @evidence contracts/performance.md#efficient-algorithms K exact cuts over V vertices and T triangles cost O(K(V+T)); three scalar contour scans and provisional feature tracking add their documented costs without claiming unmeasured speedups.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable context supplies source geometry, normals and the spatial index to both ears; this call reuses its support scalar across its section and contour operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the shared context; invocation temporaries release after producing one document whose retained observations grow with admitted source and station count.
 */
export function extractEar(
  context: HeadContext,
  side: "l" | "r",
  sourceBoneNames: readonly string[],
  provenance: {
    tool: { file: string; sha256: string };
    createdAt: string;
  },
): RegionFile {
  if (context.manifest.pose !== "native-A")
    throw new Error("Ear observations require their declared native-A source");
  if (!context.manifest.frame.startsWith("+X subject-left, +Y up, +Z front"))
    throw new Error(
      "Ear coordinate extrema require the declared subject-left/up/front source frame",
    );
  const influence: Float64Array = earSupportWeights(context, sourceBoneNames);
  const measured: ReturnType<typeof earSectionFamily> = earSectionFamily(
    context,
    influence,
    `ear-${side}`,
    0.5,
  );
  const scales: Parameters<typeof earFoldCourses>[3] = {
    sampleStepMm: 0.25,
    neighborhoodRadiusMm: 2,
    minimumProminenceMm: 0.1,
    maxSamples: 100000,
  };
  return {
    schema: "c2852-reflines-v4",
    gate: context.gate,
    region: `ear-${side}`,
    owner: "ear-reference-observations",
    createdAt: provenance.createdAt,
    units: "mm",
    frame: context.manifest.frame,
    sources: ["body", "head"].map(
      (name: string): RegionFile["sources"][number] => ({
        file: context.manifest.files[name].path,
        sha256: context.manifest.files[name].sha256,
        pose: "native-A",
      }),
    ),
    tool: provenance.tool,
    families: measured.families,
    sections: measured.sections,
    courses: earFoldCourses(context, measured.sections, side, scales),
    loops: earTurningContours(context, influence, side, measured.bounds.centre),
    silhouettes: [],
    landmarks: [],
    events: [],
    measures: [],
    limits: [
      "Declared rig groups establish a broad diagnostic support including nearby scalp and cheek; no contour certifies insertion, otobasion or the acoustic meatus.",
      "View turning contours follow the source display-normal field and are not curvature ridges. Lateral extrema are provisional geometric candidates; semantic helix, antihelix, concha, tragus and lobule correspondence remains unresolved.",
      "Saved observations are not a parametric ear. Fitted curves must actually generate the inspected skin, preserve folds and shared boundaries, and pass separate matching and held-out view qualification.",
      "Regional closed loops retain measurement orientation only; source outward-orientation witnesses and critical-level event coverage must be supplied before a topology-changing surface consumer can qualify this family.",
    ],
    selfCheck: {
      observationProtocol: {
        supportBoundsMm: measured.bounds,
        maximumStationSpacingMm: 0.5,
        ...scales,
        scopeInfluenceThreshold: 0.01,
        boundInfluenceThreshold: 0.05,
      },
      qualification:
        "source observations only; surface reconstruction and anatomical acceptance remain separate",
    },
  };
}
