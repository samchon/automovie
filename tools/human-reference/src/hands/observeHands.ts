import type { Plane } from "../geometry/Plane.ts";
import type { Skin } from "../geometry/Skin.ts";
import { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { buildSkin } from "../geometry/buildSkin.ts";
import { dist } from "../geometry/dist.ts";
import { lerp } from "../geometry/lerp.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { sub } from "../geometry/sub.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import { readInput } from "../io/readInput.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import type { HandAxis } from "./HandAxis.ts";
import type { HandRegion } from "./HandRegion.ts";
import { admitHandRegion } from "./admitHandRegion.ts";
import { handBone } from "./handBone.ts";
import { handDistalSupport } from "./handDistalSupport.ts";
import { handFamily } from "./handFamily.ts";
import { handGuides } from "./handGuides.ts";
import { handPerpendicular } from "./handPerpendicular.ts";
import { handRegistration } from "./handRegistration.ts";
import { observeHandSection } from "./observeHandSection.ts";

/**
 * Adds physical hand section families to frozen inherited regional observations.
 * Inputs body, head, hand-l/r and upperlimb-l/r are manifest-bound JSON documents.
 * The wrist consumes the limb owner's exact saved section. Digit families retain
 * the native bent rig and both joint-plane orientations, without claiming that
 * those intersecting families already define a continuous generating surface.
 *
 * @evidence contracts/common.md#principled-implementation Combines exact source-plane observations with named registered frames and correspondence pins; merged digits and missing axial containment remain explicit.
 * @evidence contracts/common.md#clear-and-simple-design Owns hand station placement and shared wrist consumption while geometry, source IO and surface joining remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no source vertex catalogue or fitted skin assets, invents no nail/crease border, and does not replace unsupported observations with successful neighbouring ones.
 * @evidence contracts/common.md#meaningful-documentation States required named inputs, native posture, shared boundary ownership, station resolution and unresolved generating-surface qualification.
 * @evidence contracts/performance.md#efficient-algorithms Loads one source skin and spatial index per identity, then cuts a hand-local triangle scope at O(length/spacing) stations; source-surface guide joining adds the documented joinCourse cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Both hands share the loaded source and index; each hand reuses its registered frames, exact wrist observation and cardinal pins.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The source and index are local to this identity operation; returned records retain observation coordinates but no source mesh, index or external handle.
 */
export function observeHands(
  manifest: ReferenceManifest,
  producerSha256: string,
  stationSpacingMm: number = 0.8,
): HandRegion[] {
  if (manifest.pose !== "native-A")
    throw new Error("Hand observation requires registered native-A inputs");
  if (!Number.isFinite(stationSpacingMm) || stationSpacingMm <= 0)
    throw new Error("Hand station spacing must be positive finite millimetres");
  const observedAt: unknown = manifest.metadata?.observedAt;
  if (
    typeof observedAt !== "string" ||
    !Number.isFinite(Date.parse(observedAt))
  )
    throw new Error(
      "Hand manifest requires a fixed metadata.observedAt timestamp",
    );
  const source: ReturnType<typeof loadGate> = loadGate(manifest);
  const skin: Skin = buildSkin(source.body, source.head, "native-A");
  const index: SurfaceIndex = new SurfaceIndex(skin.vertices, skin.triangles);
  const out: HandRegion[] = [];
  for (const side of ["l", "r"] as const) {
    const inputId: string = `hand-${side}`;
    const admission: ReturnType<typeof admitHandRegion> = admitHandRegion(
      readInput<RegionFile>(manifest, inputId),
    );
    const r: HandRegion = admission.region;
    r.rejectedInheritedObservations = admission.rejected;
    handRegistration(r, manifest, inputId);
    const wrist: V3 = handBone(source.body, "hand", side);
    const mcp: V3 = handBone(source.body, "middle_01", side);
    const axis: V3 = norm(sub(mcp, wrist));
    const radial: V3 = handPerpendicular(
      sub(
        handBone(source.body, "index_01", side),
        handBone(source.body, "pinky_01", side),
      ),
      axis,
    );
    const dorsal: V3 = handPerpendicular(
      sub(handBone(source.body, "middle_01_mcp", side), mcp),
      axis,
    );
    const local: Skin = {
      ...skin,
      triangles: skin.triangles.filter(
        (triangle: [number, number, number]): boolean =>
          triangle.some(
            (v: number): boolean => dist(skin.vertices[v], mcp) < 210,
          ),
      ),
    };
    const digitAxes: HandAxis[] = [];
    for (const digit of ["thumb", "index", "middle", "ring", "pinky"]) {
      const support: V3 = handDistalSupport(source.body, digit, side);
      digitAxes.push({
        name: digit,
        chain: [
          handBone(source.body, `${digit}_01`, side),
          handBone(source.body, `${digit}_02`, side),
          handBone(source.body, `${digit}_03`, side),
          support,
        ],
      });
      r.landmarks.push({
        id: `${inputId}.lm.${digit}-distal-support`,
        name: `${digit} distal skin support (geometric rig-partition observation)`,
        p: support,
        pose: "native-A",
        method:
          "maximum projection along the final registered joint segment among source vertices with summed digit rig weight greater than one half; not a clinical fingertip or nail boundary",
        confidence: "medium",
      });
    }
    const limbInput: string = `upperlimb-${side}`;
    const limb: RegionFile = readInput<RegionFile>(manifest, limbInput);
    handRegistration(limb, manifest, limbInput);
    const wristSource: Section | undefined = limb.sections.find(
      (section: Section): boolean =>
        section.id === `${limbInput}.forearm.10000` &&
        section.pose === "native-A",
    );
    if (!wristSource)
      throw new Error(`Shared wrist observation missing: ${limbInput}`);
    const added: Section[] = [];
    const wristSection: Section = structuredClone(wristSource);
    wristSection.id = `${inputId}.wrist.shared`;
    wristSection.family = `${inputId}.wrist-shared`;
    r.boundaries = [
      {
        sourceInput: limbInput,
        sourceSection: wristSource.id,
        sourceSha256: manifest.files[limbInput].sha256,
        sectionId: wristSection.id,
      },
    ];
    added.push(wristSection);
    r.families.push(
      handFamily(
        wristSection.family,
        "exact limb forearm fraction-1 saved observation; origin hand joint, normal lowerarm to hand, inherited plane frame and contour",
      ),
    );
    const palmFamily: string = `${inputId}.palm-dense`;
    r.families.push(
      handFamily(
        palmFamily,
        "wrist to third MCP, distinct from the shared wrist-plane orientation; native-A",
      ),
    );
    const palmLength: number = dist(wrist, mcp);
    const palmFractions: Set<number> = new Set([0, 0.25, 0.5, 0.75, 1, 1.25]);
    for (
      let mm: number = stationSpacingMm;
      mm < 1.25 * palmLength;
      mm += stationSpacingMm
    )
      palmFractions.add(mm / palmLength);
    const palm: Section[] = [];
    for (const fraction of [...palmFractions].sort(
      (a: number, b: number): number => a - b,
    )) {
      const plane: Plane = planeFrame(
        lerp(wrist, mcp, fraction),
        axis,
        mul(dorsal, -1),
      );
      palm.push(
        observeHandSection(
          local,
          `${palmFamily}.${Math.round(fraction * 1e6)}`,
          palmFamily,
          fraction * palmLength,
          fraction,
          plane,
          radial,
          "physical wrist-to-third-MCP axis station; merged palm and thumb branches remain in the observed enclosing mass",
        ),
      );
    }
    added.push(...palm);
    r.courses.push(
      ...handGuides(
        local,
        index,
        palm.filter(
          (section: Section): boolean => section.station.fraction <= 1,
        ),
        palmFamily,
      ),
    );
    for (const digitAxis of digitAxes) {
      const digit: string = digitAxis.name;
      const joints: V3[] = digitAxis.chain;
      const markerSegment: number = digit === "thumb" ? 1 : 0;
      const digitDorsal: V3 = handPerpendicular(
        sub(
          handBone(
            source.body,
            `${digit}_${digit === "thumb" ? "02" : "01"}_mcp`,
            side,
          ),
          joints[markerSegment],
        ),
        norm(sub(joints[1], joints[0])),
      );
      for (let k: number = 0; k < 3; k++) {
        const a: V3 = joints[k];
        const b: V3 = joints[k + 1];
        const direction: V3 = norm(sub(b, a));
        const reference: V3 = handPerpendicular(digitDorsal, direction);
        const length: number = dist(a, b);
        const family: string = `${inputId}.${digit}.dense-segment-${k}`;
        r.families.push(
          handFamily(
            family,
            `${digit} registered chain segment ${k}, ${length} mm; geometric distal-support datum for the terminal endpoint`,
          ),
        );
        const segments: Section[] = [];
        const count: number = Math.max(2, Math.ceil(length / stationSpacingMm));
        const otherAxes: HandAxis[] = digitAxes.filter(
          (value: HandAxis): boolean => value.name !== digit,
        );
        for (let i: number = 0; i <= count; i++) {
          if (k === 2 && i === count) continue;
          const fraction: number = i / count;
          const plane: Plane = planeFrame(
            lerp(a, b, fraction),
            direction,
            mul(reference, -1),
          );
          segments.push(
            observeHandSection(
              local,
              `${family}.${Math.round(fraction * 1e6)}`,
              family,
              length * fraction,
              fraction,
              plane,
              radial,
              "physical stations on one registered bone segment, including exact joint planes; native bends retained",
              otherAxes,
            ),
          );
        }
        if (k === 2) {
          for (const retreat of [0.4, 0.2, 0.1, 0.05, 0.02]) {
            if (retreat >= length) continue;
            const fraction: number = 1 - retreat / length;
            const plane: Plane = planeFrame(
              add(b, mul(direction, -retreat)),
              direction,
              mul(reference, -1),
            );
            segments.push(
              observeHandSection(
                local,
                `${family}.tip-retreat-${retreat}`,
                family,
                length - retreat,
                fraction,
                plane,
                radial,
                "terminal approach to the geometric distal-support datum; last segment follows the joint-to-support direction, not an assumed clinical tip axis",
                otherAxes,
              ),
            );
          }
          segments.sort((a_: Section, b_: Section): number => {
            if (a_.station.mm === undefined || b_.station.mm === undefined)
              throw new Error("Hand physical station lacks millimetres");
            return a_.station.mm - b_.station.mm;
          });
        }
        added.push(...segments);
        r.courses.push(...handGuides(local, index, segments, family));
      }
    }
    const inheritedSections: number = r.sections.length;
    r.sections.push(...added);
    r.owner = "human-reference-hands";
    r.createdAt = observedAt;
    r.tool = {
      file: "tools/human-reference/src/hands/main.ts",
      sha256: producerSha256,
    };
    r.observationRevision = {
      baseSha256: manifest.files[inputId].sha256,
      inheritedSections,
      addedSections: added.length,
      stationSpacingMm,
      sourceBodySha256: manifest.files.body.sha256,
      producerSha256,
    };
    r.selfCheck = {
      inheritedRevisionOnly: r.selfCheck,
      currentCounts: {
        sections: r.sections.length,
        courses: r.courses.length,
        landmarks: r.landmarks.length,
        events: r.events.length,
      },
      currentQualification:
        "Fitted generating-surface and current viewer qualification remain pending; inherited diagnostics do not cover added observations",
    };
    r.limits.push(
      "Dense sections and cardinal pins are geometric observations, not fitted generating skin, clinical landmarks, nail borders or palmar crease definitions.",
      "Exact adjacent joint planes may have different orientations. A generating representation must reconcile them rather than joining unmatched contour endpoints.",
      "Inherited nonfinite observations are rejected and listed. Missing source coverage is not restored merely by dropping invalid records.",
      "All new terminal data use source geometric support in a majority digit-weight neighborhood. They replace neither an anatomical fingertip protocol nor a fitted terminal cap.",
      "The exact shared wrist contour is consumed from the limb owner; the distinct palm family does not redefine that boundary.",
      "The 210 mm source triangle scope is a diagnostic adult hand neighborhood; it is not an anatomical dimension or a supported age range.",
    );
    out.push(r);
  }
  return out;
}
