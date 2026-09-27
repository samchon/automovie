/**
 * Midsagittal soft-tissue landmarks of a built face surface, by the classical
 * definitions (Farkas, Anthropometry of the Head and Face, 1994).
 *
 * The surface is cut by the plane x = 0 (`faceMidsagittalSection`) and read
 * as the front-most point at every height (`faceMidsagittalProfile`, a
 * `step` in metres), which is the profile a lateral photograph shows. On it:
 *
 * - pronasale (prn): the most anterior point of the nose, the profile's
 *   front-most point inside `nose` (a height band);
 * - subnasale (sn): where the columella merges with the upper lip. Below the
 *   nasal tip the profile runs back along the columella (more depth lost than
 *   height) and then down the lip (less); sn is the first point below the
 *   columella where the profile turns from the one to the other, its slope
 *   passing back through 45 degrees, or, on a nose with no columella that
 *   steep, the concavity's depth between tip and lip (the point deepest
 *   behind their front hull);
 * - stomion (sto): the midpoint of the vermilion seam, given by the caller
 *   (the basis's lip contact pair), because the closed lips meet there;
 * - menton (me): the lowest point of the chin, where its outline turns under
 *   toward the neck. The lower lip and the chin's front stand on the front
 *   hull of the profile below stomion (its least concave majorant, which
 *   spans the labiomental fold, present or not); going down it, the chin
 *   turns under where the hull first loses more depth than height. From
 *   there the chin's underside is followed back (at most `chinDepth`) to
 *   the point where it runs level, its height changing by less than `level`
 *   of its depth: the chin's lowest point.
 *
 * Heights are along y (the face frame's vertical) in metres. Pure.
 */

/** One point of the x = 0 section: [y, z] in metres. */
export type FaceMidsagittalPoint = [number, number];

/** The segments of the x = 0 plane's section of a triangle surface. */
export function faceMidsagittalSection(
  positions: readonly number[],
  indices: readonly number[],
): [FaceMidsagittalPoint, FaceMidsagittalPoint][] {
  const segments: [FaceMidsagittalPoint, FaceMidsagittalPoint][] = [];
  for (let t = 0; t < indices.length; t += 3) {
    const points: FaceMidsagittalPoint[] = [];
    for (let e = 0; e < 3; ++e) {
      const a = indices[t + e]!;
      const b = indices[t + ((e + 1) % 3)]!;
      const xa = positions[3 * a]!;
      const xb = positions[3 * b]!;
      if (xa < 0 === xb < 0 || xa === xb) continue;
      const s = xa / (xa - xb);
      points.push([
        positions[3 * a + 1]! +
          s * (positions[3 * b + 1]! - positions[3 * a + 1]!),
        positions[3 * a + 2]! +
          s * (positions[3 * b + 2]! - positions[3 * a + 2]!),
      ]);
    }
    if (points.length === 2) segments.push([points[0]!, points[1]!]);
  }
  return segments;
}

/** Front-most z at each height from `top` down to `bottom`, every `step`. */
export function faceMidsagittalProfile(
  segments: readonly [FaceMidsagittalPoint, FaceMidsagittalPoint][],
  top: number,
  bottom: number,
  step: number,
): FaceMidsagittalPoint[] {
  let count = 0;
  while (top - count * step >= bottom) ++count;
  const front: (number | null)[] = new Array<number | null>(count).fill(null);
  // Each segment updates only the heights it spans (one sample of margin
  // either side against rounding, the span test deciding).
  for (const [[y0, z0], [y1, z1]] of segments) {
    if (y0 === y1) continue;
    const first = Math.max(0, Math.ceil((top - Math.max(y0, y1)) / step) - 1);
    const last = Math.min(
      count - 1,
      Math.floor((top - Math.min(y0, y1)) / step) + 1,
    );
    for (let k = first; k <= last; ++k) {
      const y = top - k * step;
      if ((y0 - y) * (y1 - y) > 0) continue;
      const z = z0 + ((y - y0) / (y1 - y0)) * (z1 - z0);
      if (front[k] === null || z > front[k]!) front[k] = z;
    }
  }
  const out: FaceMidsagittalPoint[] = [];
  front.forEach((z, k) => {
    if (z !== null) out.push([top - k * step, z]);
  });
  return out;
}

/** The four landmarks and the heights between them, metres. */
export function faceMidsagittalLandmarks(props: {
  positions: readonly number[];
  indices: readonly number[];
  stomion: number;
  nose: readonly [number, number];
  chinDepth: number;
  level: number;
  step: number;
}): {
  pronasale: FaceMidsagittalPoint;
  subnasale: FaceMidsagittalPoint;
  menton: FaceMidsagittalPoint;
  upperLipHeight: number;
  lowerFaceHeight: number;
} {
  const segments = faceMidsagittalSection(props.positions, props.indices);
  if (segments.length === 0)
    throw new Error("The surface does not cross the midsagittal plane.");
  const ys = segments.flatMap(([a, b]) => [a[0], b[0]]);
  const profile = faceMidsagittalProfile(
    segments,
    Math.max(...ys),
    Math.min(...ys),
    props.step,
  );
  const nose = profile.filter(
    ([y]) => y <= props.nose[1] && y >= props.nose[0],
  );
  if (nose.length === 0) throw new Error("No profile lies in the nose band.");
  const pronasale = nose.reduce((a, b) => (b[1] > a[1] ? b : a));
  const below = profile.filter(([y]) => y < pronasale[0] && y > props.stomion);
  let subnasale: FaceMidsagittalPoint | null = null;
  let columella = false;
  for (let k = 1; k < below.length; ++k) {
    const dy = below[k - 1]![0] - below[k]![0];
    const dz = below[k - 1]![1] - below[k]![1];
    // On the columella more depth is lost than height; leaving it, less.
    if (dz > dy) columella = true;
    else if (columella) {
      subnasale = below[k - 1]!;
      break;
    }
  }
  // A nose that barely stands off the lip has no columella steeper than 45
  // degrees; its junction with the lip is then the depth of the concavity
  // between tip and lip.
  subnasale ??= faceProfileFold(below);
  if (subnasale === null)
    throw new Error("The profile never turns from the columella to the lip.");
  const chin = profile.filter(([y]) => y < props.stomion);
  if (chin.length === 0) throw new Error("No profile lies below the lips.");
  // The lower lip and the chin's front stand on the lower face's front
  // hull, which spans the labiomental fold whether or not the face has one
  // and whichever of lip and chin stands further forward; down from
  // stomion, menton opens the hull's first stretch that loses more depth
  // than height, where the chin turns under.
  const front = faceProfileHull(chin);
  let menton: FaceMidsagittalPoint | null = null;
  for (let k = front.length - 1; k > 0; --k) {
    const dy = front[k]![0] - front[k - 1]![0];
    const dz = front[k]![1] - front[k - 1]![1];
    if (dz > dy) {
      menton = front[k]!;
      break;
    }
  }
  if (menton === null)
    throw new Error("The profile never turns under the chin.");
  // Follow the chin's underside back from that turn until the outline runs
  // level: its lowest point, where the tangent is horizontal (the outline's
  // height changes by less than `level` of its depth).
  const underside = (z: number): number | null => {
    let low: number | null = null;
    for (const [[y0, z0], [y1, z1]] of segments) {
      if ((z0 - z) * (z1 - z) > 0 || z0 === z1) continue;
      const y = y0 + ((z - z0) / (z1 - z0)) * (y1 - y0);
      if (y <= menton![0] && (low === null || y < low)) low = y;
    }
    return low;
  };
  for (let z = menton[1]; z > menton[1] - props.chinDepth; z -= props.step) {
    const here = underside(z);
    const next = underside(z - props.step);
    if (here === null || next === null) break;
    if (Math.abs(here - next) < props.level * props.step) {
      menton = [here, z];
      break;
    }
  }
  return {
    pronasale,
    subnasale,
    menton,
    upperLipHeight: subnasale[0] - props.stomion,
    lowerFaceHeight: subnasale[0] - menton[0],
  };
}

/**
 * The profile's soft-tissue landmarks of lips, chin and nasal root (Farkas
 * 1994), read on a profile (`faceMidsagittalProfile`, front-most z at each
 * height, heights descending) around the landmarks
 * `faceMidsagittalLandmarks` finds:
 *
 * - labrale superius (ls): the upper lip's front-most point between
 *   subnasale and stomion;
 * - supramentale (sm): the labiomental fold's depth, the point of the
 *   profile below stomion inferius deepest behind its front hull;
 * - labrale inferius (li): the lower lip's front-most point between stomion
 *   inferius (below which the upper lip's overhang no longer shows) and
 *   supramentale;
 * - soft-tissue pogonion (pog'): the chin's most prominent point between
 *   supramentale and menton, the one a line from pronasale touches
 *   (Ricketts's E-line tangent);
 * - soft-tissue nasion (n): the nasofrontal angle's vertex. Above
 *   pronasale (within `root` of it) every point sees the forehead above it
 *   along its most forward tangent and the nasal tip along a line; n is the
 *   point where the two make their least angle, the depth of the
 *   nasofrontal fold, which a flat brow, whose deepest point is no
 *   landmark, still has. `forehead` is where that tangent touches, the
 *   angle's upper arm;
 * - glabella (g): the front-most point of the profile above n, within
 *   `root` of it.
 *
 * Null where a landmark's stretch of profile is empty. Pure.
 */
export function faceProfileLandmarks(props: {
  profile: readonly FaceMidsagittalPoint[];
  pronasale: FaceMidsagittalPoint;
  subnasale: FaceMidsagittalPoint;
  stomion: number;
  /** Stomion inferius's height: below it only the lower lip shows. */
  inferius: number;
  menton: FaceMidsagittalPoint;
  root: number;
}): {
  labraleSuperius: FaceMidsagittalPoint | null;
  supramentale: FaceMidsagittalPoint | null;
  labraleInferius: FaceMidsagittalPoint | null;
  pogonion: FaceMidsagittalPoint | null;
  nasion: FaceMidsagittalPoint | null;
  forehead: FaceMidsagittalPoint | null;
  glabella: FaceMidsagittalPoint | null;
} {
  const { profile } = props;
  const front = (points: readonly FaceMidsagittalPoint[]) =>
    points.length === 0 ? null : points.reduce((a, b) => (b[1] > a[1] ? b : a));
  const labraleSuperius = front(
    profile.filter(([y]) => y < props.subnasale[0] && y > props.stomion),
  );
  // Below stomion the lower lip swells forward, the profile falls back into
  // the labiomental fold and swells again over the chin. Supramentale is
  // the fold's depth; li and pog' are the front-most points above and below
  // it.
  const lower = profile.filter(
    ([y]) => y < props.inferius && y > props.menton[0],
  );
  const fold = faceProfileFold(lower);
  const labraleInferius =
    fold === null ? null : front(lower.filter(([y]) => y > fold[0]));
  // The chin's most prominent point is the one a line from pronasale
  // touches (Ricketts's E-line tangent), which a receding chin still has.
  const pogonion =
    fold === null
      ? null
      : lower
          .filter(([y]) => y < fold[0])
          .reduce<FaceMidsagittalPoint | null>((best, point) => {
            const slope = (q: FaceMidsagittalPoint) =>
              (q[1] - props.pronasale[1]) / (props.pronasale[0] - q[0]);
            return best === null || slope(point) > slope(best) ? point : best;
          }, null);
  const upper = profile.filter(
    ([y]) => y > props.pronasale[0] && y <= props.pronasale[0] + props.root,
  );
  let nasion: FaceMidsagittalPoint | null = null;
  let forehead: FaceMidsagittalPoint | null = null;
  let least = Infinity;
  for (let i = 1; i < upper.length; ++i) {
    const n = upper[i]!;
    // Heights descend, so the forehead above n is the stretch before it,
    // every point higher than n: the most forward line is the steepest
    // gain of depth per height.
    let tangent = upper[0]!;
    let lean = -Infinity;
    for (let j = 0; j < i; ++j) {
      const q = upper[j]!;
      const forward = (q[1] - n[1]) / (q[0] - n[0]);
      if (forward > lean) [lean, tangent] = [forward, q];
    }
    const [ay, az] = [tangent[0] - n[0], tangent[1] - n[1]];
    const [by, bz] = [props.pronasale[0] - n[0], props.pronasale[1] - n[1]];
    const angle = Math.acos(
      (ay * by + az * bz) / Math.hypot(ay, az) / Math.hypot(by, bz),
    );
    if (angle < least) [least, nasion, forehead] = [angle, n, tangent];
  }
  const vertex: FaceMidsagittalPoint | null = nasion;
  const glabella =
    vertex === null
      ? null
      : front(
          profile.filter(([y]) => y > vertex[0] && y <= vertex[0] + props.root),
        );
  return {
    labraleSuperius,
    supramentale: fold,
    labraleInferius,
    pogonion,
    nasion,
    forehead,
    glabella,
  };
}

/**
 * The front hull of a stretch of profile (heights descending): its least
 * concave majorant in depth, the vertices from the lowest point up.
 */
function faceProfileHull(
  points: readonly FaceMidsagittalPoint[],
): FaceMidsagittalPoint[] {
  const hull: FaceMidsagittalPoint[] = [];
  for (const point of [...points].reverse()) {
    while (hull.length >= 2) {
      const [a, b] = [hull[hull.length - 2]!, hull[hull.length - 1]!];
      // Keep the chain concave from below in z as y rises.
      const cross =
        (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
      if (cross >= 0) hull.pop();
      else break;
    }
    hull.push(point);
  }
  return hull;
}

/**
 * A fold's depth: the point of a stretch of profile (heights descending)
 * deepest behind the stretch's front hull, which the swellings on either
 * side span and which small ripples of the surface do not reach. Null for
 * fewer than three points.
 */
function faceProfileFold(
  points: readonly FaceMidsagittalPoint[],
): FaceMidsagittalPoint | null {
  if (points.length < 3) return null;
  const hull = faceProfileHull(points);
  // The hull runs up the face from the lowest point; every profile height
  // lies within one of its segments, whose ends' heights differ.
  const majorant = (y: number): number => {
    const k = hull.findIndex((point) => point[0] >= y);
    const [a, b] = [hull[Math.max(0, k - 1)]!, hull[k]!];
    return a === b ? b[1] : a[1] + ((y - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
  };
  return points.reduce((a, b) =>
    majorant(b[0]) - b[1] > majorant(a[0]) - a[1] ? b : a,
  );
}
