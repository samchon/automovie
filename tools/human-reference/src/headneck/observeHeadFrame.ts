import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import type { HeadContext } from "./HeadContext.ts";
import type { HeadFrame } from "./HeadFrame.ts";
import type { MidPoint } from "./MidPoint.ts";
import { P } from "./P.ts";
import { farthest } from "./farthest.ts";

/**
 * Extracts a native midsagittal profile and explicitly defined geometric proxies.
 *
 * Search windows reproduce the existing reference observation protocol; they
 * are conventional millimetre windows, not clinical landmark definitions or
 * population norms. Lip crossings describe intersecting source sheets.
 *
 * @evidence contracts/common.md#principled-implementation One native midsagittal source cut supports explicit windowed extrema and chord-distance proxies; strict source-sheet intersections remain geometric collision observations.
 * @evidence contracts/common.md#clear-and-simple-design The ordered profile owns all source indexes and named observations, so consumers share one extraction protocol rather than independent coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Search windows and the sampled contact tie band are declared conventions; empty ranges and degenerate chords fail, and heuristic names do not certify clinical identity.
 * @evidence contracts/common.md#meaningful-documentation States conventional physical windows, native registration and collision meaning; each returned observation records its exact extraction method and confidence.
 * @evidence contracts/performance.md#efficient-algorithms The source cut visits its triangle workload, profile searches are O(N), and upper/lower contact comparison is O(U times L) for their bounded arc sizes; retained profile storage is O(N).
 * @evidence contracts/performance.md#reuse-equivalent-work One profile and one map of named observations supply all downstream head and facial consumers for this operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned profile points and observation records are bounded by the cut; temporary candidates are released after return and no external resource or cache is retained.
 */
export function observeHeadFrame(context: HeadContext): HeadFrame {
  const skin: Skin = context.s;
  const clipY: number = context.bone("neck_01")[1] - 30;
  const plane: Plane = planeFrame([0, 0, 0], [1, 0, 0], [0, 0, -1]);
  const polylines: Polyline[] = cut(skin, plane, (i: number): boolean =>
    skin.triangles[i].every(
      (vertex: number): boolean => skin.vertices[vertex][1] > clipY,
    ),
  );
  if (!polylines.length)
    throw new Error("The source has no head-scoped midsagittal profile.");
  let selected: Polyline = polylines[0];
  for (const polyline of polylines)
    if (polyline.pts.length > selected.pts.length) selected = polyline;
  if (selected.closed)
    throw new Error(
      "The head-scoped midsagittal profile is unexpectedly closed.",
    );
  let profile: V3[] = P(selected);
  if (profile[0][2] > profile[profile.length - 1][2])
    profile = profile.reverse();
  let iTop: number = 0;
  profile.forEach((point: V3, i: number): void => {
    if (point[1] > profile[iTop][1]) iTop = i;
  });
  const top: V3 = profile[iTop];
  const eyeY: number =
    (context.eyes.l.centre[1] + context.eyes.r.centre[1]) / 2;
  const count: number = profile.length;
  const mid: Record<string, MidPoint> = {};
  const set: (
    name: string,
    i: number,
    method: string,
    confidence?: MidPoint["confidence"],
  ) => void = (
    name: string,
    i: number,
    method: string,
    confidence: MidPoint["confidence"] = "high",
  ): void => {
    mid[name] = { name, p: profile[i], i, method, confidence };
  };
  const firstBelow: (start: number, y: number) => number = (
    start: number,
    y: number,
  ): number => {
    for (let i: number = start; i < count; i++) if (profile[i][1] < y) return i;
    return count - 1;
  };
  set("vertex", iTop, "highest point of the midsagittal source profile (+Y)");
  const iPrn: number = argBest(
    profile,
    firstBelow(iTop, eyeY - 10),
    firstBelow(iTop, eyeY - 75),
    (point: V3): number => point[2],
  );
  set(
    "pronasale",
    iPrn,
    "most anterior midsagittal point between 10 and 75 mm below the auxiliary eyeball centres",
  );
  const iGlabella: number = argBest(
    profile,
    firstBelow(iTop, eyeY + 40),
    firstBelow(iTop, eyeY),
    (point: V3): number => point[2],
  );
  set(
    "glabella",
    iGlabella,
    "most anterior midsagittal point between the auxiliary-eye height and 40 mm above it",
  );
  const sellion: ReturnType<typeof farthest> = farthest(
    profile,
    iGlabella,
    iPrn,
    [-1, 0],
  );
  set(
    "sellion",
    sellion.i,
    "midsagittal point farthest behind the glabella-pronasale chord",
  );
  const deepZ: number = profile[iPrn][2] - 30;
  let firstPocket: number = -1;
  let lastPocket: number = -1;
  for (let i: number = iPrn; i < count; i++)
    if (profile[i][2] < deepZ) {
      firstPocket = i;
      break;
    }
  for (let i: number = firstPocket; firstPocket >= 0 && i < count; i++) {
    if (profile[i][2] < deepZ) lastPocket = i;
    if (profile[i][1] < profile[firstPocket][1] - 40) break;
  }
  if (firstPocket < 0 || lastPocket < 0)
    throw new Error(
      "The conventional midsagittal mouth-pocket search found no source arc.",
    );
  const lowerEnd: number = firstBelow(lastPocket, profile[lastPocket][1] - 45);
  let contact: { i: number; j: number; z: number; p: V3 } = {
    i: -1,
    j: -1,
    z: -Infinity,
    p: profile[iPrn],
  };
  for (let i: number = iPrn; i < firstPocket; i++)
    for (let j: number = lastPocket; j < lowerEnd; j++) {
      const crossing: V3 | null = crossSegments(
        profile[i],
        profile[i + 1],
        profile[j],
        profile[j + 1],
      );
      if (crossing && crossing[2] > contact.z)
        contact = { i, j, z: crossing[2], p: crossing };
    }
  let contactMethod: string =
    "most anterior strict crossing of upper and lower source lip arcs; sheets interpenetrate at this geometric collision observation";
  if (contact.i < 0) {
    let minimum: number = Infinity;
    for (let i: number = iPrn; i <= firstPocket; i++)
      for (let j: number = lastPocket; j <= lowerEnd; j++)
        minimum = Math.min(minimum, dist(profile[i], profile[j]));
    for (let i: number = iPrn; i <= firstPocket; i++)
      for (let j: number = lastPocket; j <= lowerEnd; j++)
        if (
          dist(profile[i], profile[j]) < minimum + 0.2 &&
          profile[i][2] > contact.z
        )
          contact = { i, j, z: profile[i][2], p: profile[i] };
    contactMethod = `closest sampled upper/lower source-lip approach ${minimum.toFixed(2)} mm, anterior pair within a conventional 0.2 mm tie band; observation lies on upper sheet`;
  }
  if (contact.i < 0)
    throw new Error("No source lip contact candidate was resolved.");
  mid.stomion = {
    name: "stomion",
    p: contact.p,
    i: contact.i,
    method: contactMethod,
    confidence: "low",
  };
  const subnasale: ReturnType<typeof farthest> = farthest(
    profile,
    iPrn,
    contact.i,
    [-1, 0],
  );
  set(
    "subnasale",
    subnasale.i,
    "midsagittal point farthest behind the pronasale-to-contact chord",
  );
  const upperLip: number = argBest(
    profile,
    subnasale.i + 1,
    contact.i,
    (point: V3): number => point[2],
  );
  set(
    "upper-lip-anterior",
    upperLip,
    "most anterior upper-source-lip point between subnasale proxy and contact",
  );
  const lowerLip: number = argBest(
    profile,
    contact.j + 1,
    lowerEnd,
    (point: V3): number => point[2],
  );
  set(
    "lower-lip-anterior",
    lowerLip,
    "most anterior lower-source-lip point below contact",
  );
  const pogonion: number = argBest(
    profile,
    firstBelow(lowerLip, profile[lowerLip][1] - 12),
    firstBelow(lowerLip, profile[lowerLip][1] - 55),
    (point: V3): number => point[2],
  );
  set(
    "pogonion",
    pogonion,
    "most anterior chin point 12 to 55 mm below the lower-lip anterior observation",
  );
  const sublabiale: ReturnType<typeof farthest> = farthest(
    profile,
    lowerLip,
    pogonion,
    [-1, 0],
  );
  set(
    "sublabiale",
    sublabiale.i,
    "midsagittal point farthest behind the lower-lip-to-pogonion chord",
  );
  let menton: number = pogonion;
  for (
    let i: number = pogonion;
    i < count && profile[i][2] > profile[pogonion][2] - 25;
    i++
  )
    if (profile[i][1] < profile[menton][1]) menton = i;
  set(
    "menton",
    menton,
    "lowest midsagittal chin point within 25 mm behind pogonion; location depends on this conventional window",
    "medium",
  );
  const gnathion: ReturnType<typeof farthest> = farthest(
    profile,
    pogonion,
    menton,
    [1, -1],
  );
  set(
    "gnathion",
    gnathion.i,
    "midsagittal point farthest anterior-inferior from the pogonion-menton chord",
    "medium",
  );
  const cervicomental: ReturnType<typeof farthest> = farthest(
    profile,
    menton,
    firstBelow(menton, profile[menton][1] - 70),
    [-1, 1],
  );
  set(
    "cervicomental",
    cervicomental.i,
    "midsagittal point deepest inside the menton-to-neck chord ending 70 mm below menton",
    "medium",
  );
  let opisthocranion: number = iTop;
  for (let i: number = iTop; i >= 0 && profile[i][1] > eyeY - 30; i--)
    if (profile[i][2] < profile[opisthocranion][2]) opisthocranion = i;
  set(
    "opisthocranion",
    opisthocranion,
    "most posterior midsagittal point above 30 mm below auxiliary-eye height",
  );
  let backEnd: number = opisthocranion;
  for (
    let i: number = opisthocranion;
    i >= 0 && profile[i][1] > profile[opisthocranion][1] - 170;
    i--
  )
    backEnd = i;
  const nape: ReturnType<typeof farthest> = farthest(
    profile,
    backEnd,
    opisthocranion,
    [1, 0],
  );
  set(
    "nape-deepest",
    nape.i,
    "midsagittal back point deepest inside the opisthocranion-to-back chord ending 170 mm below it",
    "medium",
  );
  return {
    top,
    eyeY,
    clipY,
    profile,
    plane,
    iTop,
    mid,
    mouth: { upper: [iPrn, contact.i], lower: [contact.j, lowerEnd] },
  };
}

function argBest(
  points: V3[],
  first: number,
  last: number,
  score: (point: V3) => number,
): number {
  if (first < 0 || last >= points.length || first > last)
    throw new Error(
      "A profile search requires an ordered nonempty source range.",
    );
  let index: number = first;
  let maximum: number = -Infinity;
  for (let i: number = first; i <= last; i++) {
    const value: number = score(points[i]);
    if (value > maximum) {
      maximum = value;
      index = i;
    }
  }
  return index;
}

function crossSegments(a: V3, b: V3, c: V3, d: V3): V3 | null {
  const orientation: (p: V3, q: V3, r: V3) => number = (
    p: V3,
    q: V3,
    r: V3,
  ): number => (q[2] - p[2]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[2] - p[2]);
  const d1: number = orientation(c, d, a);
  const d2: number = orientation(c, d, b);
  const d3: number = orientation(a, b, c);
  const d4: number = orientation(a, b, d);
  if (d1 * d2 >= 0 || d3 * d4 >= 0) return null;
  const t: number = d1 / (d1 - d2);
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
