import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { sub } from "../geometry/sub.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";
import type { Course } from "../schema/Course.ts";
import type { CourseStation } from "../schema/CourseStation.ts";
import type { Section } from "../schema/Section.ts";
import { joinCourse } from "../schema/joinCourse.ts";
import { phaseOf } from "../schema/phaseOf.ts";
import type { EarFoldCandidate } from "./EarFoldCandidate.ts";
import { detectLateralExtrema } from "./detectLateralExtrema.ts";

/**
 * Tracks independent signed lateral extrema through ordered level sections.
 * Nearest compatible observations within two millimetres per station may join;
 * one missing station remains an explicit gap. Six observations establish a
 * retained diagnostic track. These are provisional correspondence rules, not
 * anatomical lengths or certified helix/antihelix/concha identities.
 *
 * @evidence contracts/common.md#principled-implementation Finite-neighborhood source extrema provide observation points, one-to-one nearest compatible matching proposes tracks, and source-plane paths join them without filling missing stations with chords.
 * @evidence contracts/common.md#clear-and-simple-design The operation owns only provisional feature correspondence; exact section measurement, curve fitting and surface generation remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same distance, persistence and missing-station rules apply to every input; no anatomical count, source index or identity-specific track is required.
 * @evidence contracts/common.md#meaningful-documentation The contract explains matching rules, source-supported joins, gap preservation and unresolved anatomical semantics.
 * @evidence contracts/performance.md#efficient-algorithms For K sections, A accumulated tracks and C candidates per section, matching scans O(KAC) pairs and sorts admitted pairs; source-plane joins dominate with their skin traversal for each retained adjacency.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact saved sections and one source spatial index are reused; candidate observations are computed once per section and tracks are not cached across changed inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Tracks and matching arrays are invocation-local and bounded by detected observations; returned station arrays and joined pieces transfer to the regional owner.
 */
export function earFoldCourses(
  context: HeadContext,
  sections: Section[],
  side: "l" | "r",
  scales: {
    sampleStepMm: number;
    neighborhoodRadiusMm: number;
    minimumProminenceMm: number;
    maxSamples: number;
  },
): Course[] {
  type Item = {
    station: number;
    section: Section;
    candidate: EarFoldCandidate;
  };
  type Track = { direction: EarFoldCandidate["direction"]; items: Item[] };
  const tracks: Track[] = [];
  const family: string = `ear-${side}.level-dense`;
  const ordered: Section[] = sections.filter(
    (section: Section): boolean => section.family === family,
  );
  ordered.forEach((section: Section, station: number): void => {
    const candidates: EarFoldCandidate[] = section.loops.flatMap(
      (loop: Section["loops"][number]): EarFoldCandidate[] =>
        detectLateralExtrema(
          loop.points,
          loop.closed,
          side === "l" ? 1 : -1,
          scales,
        ),
    );
    const pairs: {
      track: Track;
      candidate: EarFoldCandidate;
      distance: number;
    }[] = [];
    for (const candidate of candidates)
      for (const track of tracks) {
        const last: Item = track.items[track.items.length - 1];
        const gap: number = station - last.station;
        if (gap > 2 || track.direction !== candidate.direction) continue;
        const distance: number = dist(last.candidate.point, candidate.point);
        if (distance <= gap * 2) pairs.push({ track, candidate, distance });
      }
    pairs.sort(
      (a: (typeof pairs)[number], b: (typeof pairs)[number]): number =>
        a.distance - b.distance,
    );
    const assignedTracks: Set<Track> = new Set();
    const assignedCandidates: Set<EarFoldCandidate> = new Set();
    for (const pair of pairs) {
      if (
        assignedTracks.has(pair.track) ||
        assignedCandidates.has(pair.candidate)
      )
        continue;
      pair.track.items.push({ station, section, candidate: pair.candidate });
      assignedTracks.add(pair.track);
      assignedCandidates.add(pair.candidate);
    }
    for (const candidate of candidates)
      if (!assignedCandidates.has(candidate))
        tracks.push({
          direction: candidate.direction,
          items: [{ station, section, candidate }],
        });
  });
  const courses: Course[] = [];
  for (const [index, track] of tracks
    .filter((value: Track): boolean => value.items.length >= 6)
    .entries()) {
    const stations: CourseStation[] = track.items.map(
      (item: Item): CourseStation => {
        const delta: V3 = sub(item.candidate.point, item.section.plane.origin);
        return {
          section: item.section.id,
          p: item.candidate.point,
          phaseDeg: phaseOf(
            [
              dot(delta, item.section.plane.u),
              dot(delta, item.section.plane.v),
            ],
            [0, 0],
          ),
          prominenceMm: item.candidate.prominenceMm,
        };
      },
    );
    const joined: ReturnType<typeof joinCourse> = joinCourse(
      context.s,
      context.idx,
      stations,
      1.5,
      (i: number): string | null =>
        track.items[i].station - track.items[i - 1].station > 1
          ? "missing intermediate source feature"
          : null,
    );
    courses.push({
      id: `ear-${side}.fold-candidate.${String(index + 1).padStart(3, "0")}`,
      name: `${track.direction} lateral-extremum track ${index + 1}`,
      kind: track.direction === "outward" ? "mass-apex" : "groove",
      pose: "native-A",
      family,
      method: `Signed lateral extrema on source-cut arcs, arclength sample spacing at most ${scales.sampleStepMm} mm, neighborhood radius ${scales.neighborhoodRadiusMm} mm, two-sided prominence at least ${scales.minimumProminenceMm} mm. Phase is measured about the declared section-plane origin. Nearest compatible tracks use a 2 mm per station limit and retain missing-station gaps; joins follow source-plane skin arcs.`,
      confidence: "low",
      confidenceBasis: `${stations.length} source-supported stations; geometry and numerical feature scales do not certify anatomical fold identity or cross-identity correspondence`,
      stations,
      pieces: joined.pieces,
      gaps: joined.gaps,
    });
  }
  return courses;
}
