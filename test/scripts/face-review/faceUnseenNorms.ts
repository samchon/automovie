/**
 * The face a frontal photograph cannot show, set to the population it comes
 * from.
 *
 * A frontal photograph records the face's depths (how far the lips, the
 * chin, the nasal root and the nasal tip stand forward) only through
 * outlines the detector does not read as depth, the head behind the face
 * not at all, and the ears without a landmark, so a document has no
 * measurement behind them. The most probable form is then the mean of the
 * subject's population at their sex and age, as adults not chosen for their
 * looks show it (`FACE_UNSEEN_NORMS`), read by the classical definitions:
 *
 * - the lips' distances to Ricketts's E-line (pronasale to soft-tissue
 *   pogonion), positive in front of it, each from its lip's most prominent
 *   point toward the line;
 * - the angle of facial convexity, g-sn-pog';
 * - the nasofrontal angle, between the forehead's tangent and the nasal
 *   dorsum at soft-tissue nasion;
 * - the nasolabial angle, between the columella's tangent from subnasale
 *   and the line from subnasale to labrale superius;
 * - the nasal tip protrusion index, sn-prn over the nose's height n-sn
 *   (Farkas);
 * - the cephalic index, the head's greatest breadth over the scalp (eu-eu,
 *   above the ears) over its length from glabella to opisthocranion (the
 *   midline's most posterior point), which hair hides;
 * - each ear's length (sa-sba, `faceAuricleLength`) over the face's height
 *   from soft-tissue nasion to menton;
 * - each ear's protrusion over its length: the ear's most lateral point
 *   less the head behind it (ANSUR II: from the mastoid to the ear's most
 *   lateral edge, horizontally), the head being the most lateral skin within
 *   5 mm of that point's height and 2 cm behind the auricle;
 * - the lower vermilion's height over the mouth's width, sto-li over ch-ch,
 *   read as the lip envelope revision reads it (`faceVermilionRatios`).
 *   The photograph shows the lower lip, and its border is read from the
 *   midline's colour (`faceLikenessVermilion`); this reading stands in for
 *   the photograph's `lowerVermilion` index only where the photograph does
 *   not measure it (`photographed`): unobserved under the subject's camera
 *   (README "Instrument") or unread (a greyscale print, a lip no redder
 *   than its skin).
 *
 * The profile's landmarks are `faceProfileLandmarks`'s. Each reading is
 * paired with the one control that means it (`FACE_UNSEEN_INDICES`) and
 * solved with the photograph's indices, so the photographed proportions and
 * the population's unseen form hold together.
 *
 * Lips retrude with age; the one longitudinal sample (Pecora, Baccetti and
 * McNamara, Am J Orthod Dentofacial Orthop 2008;134:496-505: the same
 * Michigan subjects at 17, 46 and 57 years) gives that change, applied as a
 * difference from 17 years to every population, which is an assumption: no
 * other population has been followed. The other readings are those of
 * adults and are not aged. `faceUnseenNorm` returns the targets;
 * `measureFaceUnseen` reads the same quantities on a built skin.
 *
 * The nose's projection is held by its index, not by the nasofacial angle
 * (n-prn against g-pog'): the angle also turns with the forehead and the
 * chin, and on the source, whose nose projects 13.1 mm (index 0.27), its
 * norms send the nose, the lips and the chin together to their bounds,
 * where the index is reached at a nose depth of 0.6 to 1.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

import { faceAuricleLength, faceAuricleVertices } from "./faceAuricle";
import {
  type FaceMidsagittalPoint,
  faceMidsagittalLandmarks,
  faceMidsagittalProfile,
  faceMidsagittalSection,
  faceProfileLandmarks,
} from "./faceMidsagittal";
import type { FaceUnseenReading } from "./faceUnseenIndices";
import { faceVermilionRatios } from "./prepareLipEnvelopeBasis";

/**
 * The parts of a basis surface the unseen readings are taken over, found
 * once on its neutral: each auricle (the flap its side's ear-shape targets,
 * `leftEarFlap`, `leftEarWing`, `leftEarLobe` and the right ones, move,
 * `faceAuricleVertices` at 1 cm), the head's skin within 3 cm of each
 * auricle's box, the auricle left out (the head behind the ear), and the
 * scalp (the vertices of its hair domains).
 */
export function faceUnseenParts(
  basis: IAutoMovieHumanFaceBasis,
  surface: IAutoMovieHumanFaceBasis["surfaces"][number],
): {
  auricles: { left: number[]; right: number[] };
  mastoids: { left: number[]; right: number[] };
  scalp: number[];
} {
  const P = surface.positions;
  const channels = new Map(basis.channels.map((one) => [one.id, one]));
  const sides = ["left", "right"] as const;
  const auricles = Object.fromEntries(
    sides.map((side) => [
      side,
      faceAuricleVertices({
        positions: P,
        indices: surface.indices,
        region: ["EarFlap", "EarWing", "EarLobe"].flatMap((name) => {
          const one = channels.get(`${side}${name}`);
          return one === undefined
            ? []
            : [one.positive, one.negative].flatMap((endpoint) =>
                (endpoint === null
                  ? []
                  : (surface.targets[endpoint] ?? [])
                ).filter((_, i) => i % 4 === 0),
              );
        }),
        thickness: 0.01,
      }),
    ]),
  ) as Record<"left" | "right", number[]>;
  const skin = new Set(
    surface.regions
      .filter((region) => region.id.endsWith("/skin"))
      .flatMap((region) => region.indices),
  );
  const mastoids = Object.fromEntries(
    sides.map((side) => {
      const auricle = new Set(auricles[side]);
      const box = [0, 1, 2].map((k) => {
        const along = auricles[side].map((v) => P[3 * v + k]!);
        return [Math.min(...along) - 0.03, Math.max(...along) + 0.03] as const;
      });
      return [
        side,
        [...skin].filter(
          (v) =>
            !auricle.has(v) &&
            box.every(
              ([lo, hi], k) => P[3 * v + k]! >= lo && P[3 * v + k]! <= hi,
            ),
        ),
      ];
    }),
  ) as Record<"left" | "right", number[]>;
  const scalp = [
    ...new Set(
      (surface.hairDomains ?? []).flatMap((domain) =>
        domain.triangles.flatMap((t) =>
          surface.indices.slice(3 * t, 3 * t + 3),
        ),
      ),
    ),
  ];
  return { auricles, mastoids, scalp };
}

/**
 * The triangles of a surface that reach within 5 mm of the midsagittal
 * plane, over which a profile is read.
 */
export function faceMidlineTriangles(
  positions: readonly number[],
  indices: readonly number[],
): number[] {
  const midline: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    const triangle = indices.slice(t, t + 3);
    const xs = triangle.map((vertex) => positions[3 * vertex]!);
    if (Math.min(...xs) > 0.005 || Math.max(...xs) < -0.005) continue;
    midline.push(...triangle);
  }
  return midline;
}

/**
 * The unseen readings on a built skin, each null where the surface does not
 * show its landmarks. `stomion` and `inferius` are the vermilion seam's
 * upper and lower heights, `scalp` the vertices hair grows from, over which
 * the head's breadth is read, `auricles` each ear's vertices
 * (`faceAuricleVertices`) and `mastoids` the head's skin about each ear.
 */
export function measureFaceUnseen(props: {
  positions: readonly number[];
  indices: readonly number[];
  stomion: number;
  inferius: number;
  scalp: readonly number[];
  auricles: { left: readonly number[]; right: readonly number[] };
  mastoids: { left: readonly number[]; right: readonly number[] };
  step: number;
  /** The lips' region triangles, the skin's vertices and the contact pair. */
  lips?: {
    indices: readonly number[];
    skin: ReadonlySet<number>;
    contact: { upper: number; lower: number };
  };
}): Record<FaceUnseenReading, number | null> {
  const none = {
    eLineUpper: null,
    eLineLower: null,
    facialConvexity: null,
    nasofrontal: null,
    nasolabial: null,
    nasalProtrusion: null,
    cephalicIndex: null,
    earLengthLeft: null,
    earLengthRight: null,
    earProtrusionLeft: null,
    earProtrusionRight: null,
    lowerVermilion: null,
  };
  let base: ReturnType<typeof faceMidsagittalLandmarks>;
  try {
    base = faceMidsagittalLandmarks({
      positions: props.positions,
      indices: props.indices,
      stomion: props.stomion,
      nose: [props.stomion + 0.015, props.stomion + 0.05],
      chinDepth: 0.03,
      level: 0.2,
      step: props.step,
    });
  } catch {
    return none;
  }
  const segments = faceMidsagittalSection(props.positions, props.indices);
  const ys = segments.flatMap(([a, b]) => [a[0], b[0]]);
  const profile = faceMidsagittalProfile(
    segments,
    Math.max(...ys),
    Math.min(...ys),
    props.step,
  );
  const prn = base.pronasale;
  const sn = base.subnasale;
  const landmarks = faceProfileLandmarks({
    profile,
    pronasale: prn,
    subnasale: sn,
    stomion: props.stomion,
    inferius: props.inferius,
    menton: base.menton,
    root: 0.1,
  });
  const {
    labraleSuperius,
    supramentale,
    pogonion,
    nasion,
    forehead,
    glabella,
  } = landmarks;
  const angle = (
    a: FaceMidsagittalPoint,
    o: FaceMidsagittalPoint,
    b: FaceMidsagittalPoint,
  ) =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          ((a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1])) /
            Math.hypot(a[0] - o[0], a[1] - o[1]) /
            Math.hypot(b[0] - o[0], b[1] - o[1]),
        ),
      ),
    ) *
      180) /
    Math.PI;
  // The lips' most prominent points toward the E-line (Ricketts), each the
  // point of its lip standing furthest in front of the line.
  const ahead =
    pogonion === null
      ? null
      : (q: FaceMidsagittalPoint) =>
          ((q[1] - prn[1]) * (pogonion[0] - prn[0]) -
            (q[0] - prn[0]) * (pogonion[1] - prn[1])) /
          Math.hypot(pogonion[0] - prn[0], pogonion[1] - prn[1]) /
          Math.sign(pogonion[0] - prn[0]);
  // Each stretch holds the landmark that bounds it (subnasale, the fold,
  // pronasale), so none is empty.
  const most = (
    points: readonly FaceMidsagittalPoint[],
    score: (q: FaceMidsagittalPoint) => number,
  ) => points.reduce((a, b) => (score(b) > score(a) ? b : a));
  const upperLip = profile.filter(([y]) => y <= sn[0] && y > props.stomion);
  // A chin (and so an E-line) exists only below a fold.
  const eLine = (lip: readonly FaceMidsagittalPoint[]) =>
    ahead === null ? null : ahead(most(lip, ahead));
  // The nasolabial angle's arms run from subnasale along the columella's
  // tangent (the lowest line to the nose's underside) and to labrale
  // superius, which exists: subnasale always has a sample of the profile
  // below it above stomion.
  const columella = most(
    profile.filter(([y]) => y > sn[0] && y <= prn[0]),
    (q) => -Math.atan2(q[0] - sn[0], q[1] - sn[1]),
  );
  // Opisthocranion: the midline's most posterior point.
  const back = segments.flat().reduce((a, b) => (b[1] < a[1] ? b : a));
  const breadth =
    2 *
    Math.max(0, ...props.scalp.map((v) => Math.abs(props.positions[3 * v]!)));
  const height =
    nasion === null
      ? null
      : Math.hypot(nasion[0] - base.menton[0], nasion[1] - base.menton[1]);
  const ear = (vertices: readonly number[]) => {
    const length = faceAuricleLength(props.positions, vertices);
    return length === null || height === null ? null : length / height;
  };
  // The ear's most lateral point against the head behind it.
  const protrusion = (
    auricle: readonly number[],
    head: readonly number[],
  ): number | null => {
    const length = faceAuricleLength(props.positions, auricle);
    if (length === null) return null;
    const P = props.positions;
    const out = (v: number) => Math.abs(P[3 * v]!);
    const edge = auricle.reduce((a, b) => (out(b) > out(a) ? b : a));
    const back = Math.min(...auricle.map((v) => P[3 * v + 2]!));
    const behind = head.filter(
      (v) =>
        Math.abs(P[3 * v + 1]! - P[3 * edge + 1]!) <= 0.005 &&
        P[3 * v + 2]! <= back &&
        P[3 * v + 2]! >= back - 0.02,
    );
    if (behind.length === 0) return null;
    return (out(edge) - Math.max(...behind.map(out))) / length;
  };
  return {
    eLineUpper: eLine(upperLip),
    eLineLower: eLine(
      supramentale === null
        ? []
        : profile.filter(([y]) => y < props.inferius && y >= supramentale[0]),
    ),
    facialConvexity:
      glabella === null || pogonion === null
        ? null
        : angle(glabella, sn, pogonion),
    nasofrontal:
      forehead === null || nasion === null
        ? null
        : angle(forehead, nasion, prn),
    nasolabial: angle(columella, sn, labraleSuperius!),
    nasalProtrusion:
      nasion === null
        ? null
        : Math.hypot(prn[0] - sn[0], prn[1] - sn[1]) /
          Math.hypot(nasion[0] - sn[0], nasion[1] - sn[1]),
    cephalicIndex:
      glabella === null || breadth === 0
        ? null
        : breadth / Math.hypot(glabella[0] - back[0], glabella[1] - back[1]),
    earLengthLeft: ear(props.auricles.left),
    earLengthRight: ear(props.auricles.right),
    earProtrusionLeft: protrusion(props.auricles.left, props.mastoids.left),
    earProtrusionRight: protrusion(props.auricles.right, props.mastoids.right),
    lowerVermilion: ((): number | null => {
      if (props.lips === undefined) return null;
      try {
        return faceVermilionRatios({
          positions: props.positions,
          lips: props.lips.indices,
          skin: props.lips.skin,
          contact: props.lips.contact,
          depth: 0.004,
        }).lower;
      } catch {
        return null;
      }
    })(),
  };
}
