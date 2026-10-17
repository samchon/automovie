import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHairCap } from "./AutoMovieHumanHairCap";
import { AutoMovieHumanHairRibbon } from "./AutoMovieHumanHairRibbon";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";
import { frameAutoMovieHumanScalp } from "./frameAutoMovieHumanScalp";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Grow scalp hair as cards over the head's surface: an opaque cap inside the hairline, then shells of cards from the scalp outward.
 *
 * Roots are semantic addresses on the head's chart, a jittered grid of equal area on its canonical sphere, kept where the scalp's density allows; every root is evaluated on the head the skin generator built, so hair follows any head. Hanging bob cards are additionally thinned by root-tile spacing divided by vertical travel to the cut, so each long card occupies a lane rather than stacking one full-length ribbon from every scalp tile. This is conventional display coverage, not follicle density. Each retained root grows a guide curve (Scheuermann 2004 practice, generated directly rather than clustered from strands): it leaves the scalp along the style's direction field lifted by a small angle, bends under gravity, keeps at least its shell's clearance above the skin by a radial map of the head taken from the same surface, and waves by the curl type. Its finite width emerges over one nominal lock width of physical travel and then tapers by physical root-tip distance. A card uses a rotation-minimizing frame and a width bound over every emitted strip triangle. Cards are emitted cap first, then inner shell to outer shell, preserving layered drawing order.
 *
 * The appearance's style chooses among three short cuts: a crop whose hair lies away from the crown's whorl; a short cut with tapered back and sides, combed back from a side parting; a bob parted at the midline that hangs to a level cut the hair's length below the vertex, at most to the shoulders. Every bob guide rooted above that plane grows to its actual crossing, rather than exhausting a random length first. Its step follows a conventional fifteen-degree gravity turn bound and head-scale distance bound; crop and short guides retain at most twelve segments. Curl types I and II are straight; III to VIII wave with growing amplitude and shorter period, and the coiled types stand further off the scalp. Fine coils remain an unresolved coarse style approximation, not a curl-resolution claim. Gravity and comb attraction use nominal advance millimetres before curl and clearance, rather than a turn per segment. Anterior bob roots ramp into gravity over their actual anterior head depth to retain the parting flow. The finite travel guard derives from head size, cut height and the gravity settling distance; failure is explicit. Guide, width, skin-root and cut-plane construction is available from the actual builder. All sizes are conventional, chosen to read as hair: strand density and diameter set no card count here because a card stands for a lock.
 *
 * @param props.surface The head's surface
 * @param props.scalp The scalp's centre and density
 * @param props.skeleton The skeleton at rest, for the shoulders' level
 * @param props.hair The appearance's hair
 * @returns The cards as one mesh, millimetres, model frame at rest; null for a shaved scalp
 */
export function growAutoMovieHumanHair(props: {
  surface: AutoMovieHumanHeadSurface;
  scalp: frameAutoMovieHumanScalp.IScalp;
  skeleton: IAutoMovieHumanSkeleton;
  hair: IAutoMovieHumanAppearance.IHair;
  builder?: AutoMovieHumanCardBuilder;
}): IAutoMovieMesh | null {
  const { surface, scalp, hair }: typeof props = props;
  if (hair.length <= 0) return null;
  const C: readonly number[] = scalp.centre;
  const style: IAutoMovieHumanAppearance.IHair["style"] = hair.style;
  const curl: number = CURLS.indexOf(hair.curl);
  const wave: { amplitude: number; period: number; stand: number } = {
    amplitude: curl < 2 ? 0 : [0, 0, 1.2, 2, 3, 3.5, 4, 4][curl]!,
    period: [1, 1, 40, 30, 20, 14, 9, 6][curl]!,
    stand: [1, 1, 1, 1.1, 1.3, 1.5, 1.9, 2.2][curl]!,
  };
  const radius: (p: readonly number[]) => number = surface.radii(C);
  const l: IAutoMovieHumanSkeleton["landmarks"] = props.skeleton.landmarks;
  const R: number = l.vertex.position.y - C[1]!;
  const shoulders: number =
    (l.left.acromion.position.y + l.right.acromion.position.y) / 2 + 25;
  const crown: number[] = [
    0,
    C[1]! + 0.85 * R,
    C[2]! - 0.45 * (C[2]! - l.opisthocranion.position.z),
  ];
  const part: number =
    style === "bob"
      ? 0
      : (0.3 * (l.left.eurion.position.x - l.right.eurion.position.x)) / 2;
  const cut: number = Math.max(shoulders, l.vertex.position.y - hair.length);
  const builder: AutoMovieHumanCardBuilder =
    props.builder ?? new AutoMovieHumanCardBuilder();
  if (style === "bob")
    builder.curve(
      "station",
      "bob.physical-cut",
      [
        C[0]! - R,
        cut,
        C[2]! - R,
        C[0]! + R,
        cut,
        C[2]! - R,
        C[0]! + R,
        cut,
        C[2]! + R,
        C[0]! - R,
        cut,
        C[2]! + R,
      ],
      true,
    );

  // the cap: the scalp's own surface lifted a little, opaque, inset from the hairline
  const capRows: number = 96;
  const capCols: number = 192;
  // The chart pole is one source ray hit, not a tiny latitude ring whose
  // independently lifted normals can fold the last cells inside out.
  const pole: AutoMovieHumanHeadSurface.IPoint | null = surface.cast(
    [C[0]!, C[1]!, C[2]!],
    [0, 1, 0],
  );
  const grid: Array<Array<AutoMovieHumanHeadSurface.IPoint | null>> = [];
  for (let i: number = 0; i <= capRows; ++i) {
    const row: Array<AutoMovieHumanHeadSurface.IPoint | null> = [];
    for (let j: number = 0; j <= capCols; ++j) {
      const u: number = 0.3 + (0.7 * i) / capRows;
      const point: AutoMovieHumanHeadSurface.IPoint | null =
        i === capRows ? pole : surface.toward(C, u, j / capCols);
      row.push(point);
    }
    grid.push(row);
  }
  const cap: number = 0.25 * wave.stand;
  const capNeeded: boolean = grid.some(
    (row: Array<AutoMovieHumanHeadSurface.IPoint | null>): boolean =>
      row.some(
        (p: AutoMovieHumanHeadSurface.IPoint | null): boolean =>
          p !== null && scalp.density(p.position) >= 0.99,
      ),
  );
  const capNormals: ReturnType<typeof AutoMovieHumanHairCap.normals> = capNeeded
    ? AutoMovieHumanHairCap.normals(grid, pole === null ? undefined : capRows)
    : [];
  // the middle fifth of the opaque band: wide enough for a tangent frame from texture derivatives, narrow enough to stay opaque at small mip levels
  const capU: number =
    (paintAutoMovieHumanHairStrands.COLUMNS.solid[0] +
      paintAutoMovieHumanHairStrands.COLUMNS.solid[1]) /
    2;
  for (let i: number = 0; capNeeded && i < capRows; ++i)
    for (let j: number = 0; j < capCols; ++j) {
      const a: AutoMovieHumanHeadSurface.IPoint | null = grid[i]![j]!;
      const b: AutoMovieHumanHeadSurface.IPoint | null = grid[i]![j + 1]!;
      const c: AutoMovieHumanHeadSurface.IPoint | null = grid[i + 1]![j]!;
      const d: AutoMovieHumanHeadSurface.IPoint | null = grid[i + 1]![j + 1]!;
      if (a === null || b === null || c === null || d === null) continue;
      if (
        [a, b, c, d].some(
          (p: AutoMovieHumanHeadSurface.IPoint): boolean =>
            scalp.density(p.position) < 0.99,
        )
      )
        continue;
      const normals: Array<[number, number, number] | null> = [
        capNormals[i]![j]!,
        capNormals[i]![j + 1]!,
        capNormals[i + 1]![j]!,
        capNormals[i + 1]![j + 1]!,
      ];
      if (
        normals.some(
          (n: [number, number, number] | null): boolean => n === null,
        )
      )
        throw new Error(
          "Hair cap has no geometric normal at an emitted corner",
        );
      const lift: (
        p: AutoMovieHumanHeadSurface.IPoint,
        index: number,
      ) => [number, number, number] = (
        p: AutoMovieHumanHeadSurface.IPoint,
        index: number,
      ): [number, number, number] => [
        p.position[0] + cap * normals[index]![0],
        p.position[1] + cap * normals[index]![1],
        p.position[2] + cap * normals[index]![2],
      ];
      if (i === capRows - 1)
        builder.pole(
          [lift(a, 0), lift(b, 1), lift(c, 2)],
          [normals[0]!, normals[1]!, normals[2]!],
          [capU - 0.02, capU + 0.02],
        );
      else
        builder.quad(
          [lift(a, 0), lift(b, 1), lift(c, 2), lift(d, 3)],
          normals as Array<[number, number, number]>,
          [capU - 0.02, capU + 0.02],
        );
    }

  // shells of cards, inner first
  const shells: Array<{ offset: number; spacing: number; length: number }> =
    style === "crop"
      ? [
          { offset: 0.5, spacing: 5, length: 1 },
          { offset: 1.2, spacing: 6, length: 1 },
        ]
      : [
          { offset: 0.6, spacing: 4.5, length: 0.85 },
          { offset: 1.8, spacing: 5, length: 0.95 },
          { offset: 3.0, spacing: 5.5, length: 1 },
        ];
  shells.forEach(
    (
      shell: { offset: number; spacing: number; length: number },
      layer: number,
    ): void => {
      // equal-area rows on the chart's canonical sphere, the step set from the head's radius
      const step: number = shell.spacing / R;
      const rows: number = Math.ceil((0.7 * Math.PI) / step);
      for (let i: number = 0; i < rows; ++i) {
        const latitude: number =
          -0.2 * Math.PI + (i + 0.5) * ((0.7 * Math.PI) / rows);
        const cols: number = Math.max(
          1,
          Math.round((2 * Math.PI * Math.cos(latitude)) / step),
        );
        for (let j: number = 0; j < cols; ++j) {
          const jitterU: number = hash(layer, i, j, 0) - 0.5;
          const jitterV: number = hash(layer, i, j, 1) - 0.5;
          const lat: number = latitude + jitterU * ((0.7 * Math.PI) / rows);
          const u: number = Math.min(0.9999, (lat + Math.PI / 2) / Math.PI);
          const v: number = (j + 0.5 + jitterV) / cols;
          const root: AutoMovieHumanHeadSurface.IPoint | null = surface.toward(
            C,
            u,
            v,
          );
          if (root === null) continue;
          const density: number = scalp.density(root.position);
          if (density <= hash(layer, i, j, 2)) continue;
          // A root tile owns spacing squared of scalp area. Long hanging cards
          // cover many such tiles; emitting one from every tile piles a solid
          // curtain over the same silhouette. Keep one lane per projected tile
          // length, with the same stable seed and no extra strand population.
          const hangingMm: number =
            style === "bob"
              ? Math.max(shell.spacing, root.position[1] - cut)
              : shell.spacing;
          if (
            style === "bob" &&
            hash(layer, i, j, 9) > shell.spacing / hangingMm
          )
            continue;
          const card: AutoMovieHumanCardBuilder.ICard | null = growCard({
            root,
            density,
            shell,
            style,
            wave,
            seed: [layer, i, j],
            C,
            R,
            crown,
            part,
            cut,
            length: hair.length,
            radius,
          });
          if (card !== null) {
            builder.root(root.position, root.normal);
            builder.card(card);
          }
        }
      }
    },
  );
  return builder.build();
}

/** Curl types in order. */
const CURLS: readonly string[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
];

/** Grow one card's guide from its root and build the card. */
function growCard(p: {
  root: AutoMovieHumanHeadSurface.IPoint;
  density: number;
  shell: { offset: number; spacing: number; length: number };
  style: "crop" | "short" | "bob";
  wave: { amplitude: number; period: number; stand: number };
  seed: [number, number, number];
  C: readonly number[];
  R: number;
  crown: number[];
  part: number;
  cut: number;
  length: number;
  radius: (q: readonly number[]) => number;
}): AutoMovieHumanCardBuilder.ICard | null {
  const { root, C, R }: typeof p = p;
  const at: number[] = root.position;
  const n: number[] = root.normal;
  const h: (k: number) => number = (k: number): number =>
    hash(p.seed[0], p.seed[1], p.seed[2], 3 + k);
  // the style's direction field
  let g: number[];
  const high: number = Math.max(0, Math.min(1, (at[1]! - C[1]!) / (0.6 * R)));
  if (p.style === "crop") g = sub(at, p.crown);
  else if (p.style === "short") {
    const side: number = at[0]! > p.part ? 1 : -1;
    g = [0.5 * side * high, -1.6 * (1 - high), -1];
  } else {
    const side: number = at[0]! >= p.part ? 1 : -1;
    const back: number = Math.max(0, Math.min(1, (C[2]! - at[2]!) / (0.5 * R)));
    g = [side * (1 - back), -0.7, -0.4 * back];
  }
  let t: number[] = tangent(g, n);
  if (t === null) t = tangent([0, 0, -1], n) ?? [1, 0, 0];
  const twist: number = (h(0) - 0.5) * 0.35;
  const sideVec: number[] = normalize(cross(n, t));
  t = normalize(add(t, scale(sideVec, twist)));
  const lift: number = (p.style === "crop" ? 0.45 : 0.25) * p.wave.stand;
  let d: number[] = normalize(
    add(scale(t, Math.cos(lift)), scale(n, Math.sin(lift))),
  );
  // length by style: tapered sides for the short cut, a level cut for the bob
  let length: number = p.length * p.shell.length * (0.85 + 0.3 * h(1));
  if (p.style === "short") length *= 0.3 + 0.7 * high;
  if (p.style === "crop") length = Math.max(3, length);
  const segments: number = Math.max(3, Math.min(12, Math.ceil(length / 10)));
  const nominalStep: number = length / segments;
  const offset: number = p.shell.offset * p.wave.stand;
  const points: Array<[number, number, number]> = [
    add(at, scale(n, offset)) as [number, number, number],
  ];
  const phase: number = 2 * Math.PI * h(2);
  // Anterior roots first follow the side part over their actual head depth.
  // Immediate full gravity made the same bob flow fall across the eyes before
  // travelling sideways. Posterior roots retain the established gravity law.
  const settleMm: number = p.style === "bob" ? Math.max(0, at[2]! - C[2]!) : 0;
  if (p.style === "bob" && points[0]![1] <= p.cut) return null;
  // The declared bob length owns its cut height, not a separate random walk
  // budget. After this settling distance gravity is at least tanh(2) downward;
  // the additional head diameter allows for the radial clearance correction.
  const turningMm: number =
    settleMm +
    (Math.max(0, Math.atanh(Math.min(1 - 1e-12, d[1]!))) + 2) / 0.035;
  const travelLimit: number =
    p.style === "bob"
      ? turningMm +
        (Math.max(0, at[1]! - p.cut) + turningMm + 2 * R) / Math.tanh(2)
      : length;
  let travelled: number = 0;
  for (
    let k: number = 0;
    p.style === "bob" ? travelled < travelLimit : k < segments;
    ++k
  ) {
    // gravity, and the pull back onto the head for combed and lying hair
    const radial: number[] = normalize(sub(points[k]!, C));
    // Gravity curvature is bounded by rate*sqrt(1-y*y) once descending.
    // A head-scale distance bound also resolves the clearance lookup. This
    // bounds gravity turning only; it does not certify the fine curl wave.
    const curvature: number =
      0.035 * (d[1]! >= 0 ? 1 : Math.sqrt(Math.max(0, 1 - d[1]! * d[1]!)));
    const stepLength: number =
      p.style === "bob"
        ? Math.min(
            R / 5,
            Math.PI / (12 * Math.max(curvature, Number.EPSILON)),
            travelLimit - travelled,
          )
        : nominalStep;
    const midpoint: number[] = AutoMovieHumanHairRibbon.advance(
      d,
      radial,
      p.style,
      p.style === "bob" ? stepLength / 2 : stepLength,
      settleMm,
      travelled,
    );
    d =
      p.style === "bob"
        ? AutoMovieHumanHairRibbon.advance(
            midpoint,
            radial,
            p.style,
            stepLength / 2,
            settleMm,
            travelled + stepLength / 2,
          )
        : midpoint;
    let next: number[] = add(
      points[k]!,
      scale(p.style === "bob" ? midpoint : d, stepLength),
    );
    travelled += stepLength;
    if (p.wave.amplitude > 0) {
      const w: number =
        p.wave.amplitude *
        (Math.sin(phase + (2 * Math.PI * travelled) / p.wave.period) -
          Math.sin(
            phase + (2 * Math.PI * (travelled - stepLength)) / p.wave.period,
          ));
      next = add(next, scale(normalize(cross(d, radial)), w));
    }
    // keep the shell's clearance above the skin
    const dir: number[] = normalize(sub(next, C));
    const floor: number = p.radius(dir);
    const r: number = Math.hypot(...sub(next, C));
    if (floor > 0 && r < floor + offset)
      next = add(C, scale(dir, floor + offset));
    if (p.style === "bob" && points[k]![1] >= p.cut && next[1]! < p.cut) {
      // Intersect the actual emitted guide segment with the level cut after
      // clearance correction; overshooting by a whole step makes the hem vary
      // with the integration resolution and the root's random length.
      const previous: readonly number[] = points[k]!;
      if (previous[1] === p.cut) break;
      const fraction: number =
        (previous[1]! - p.cut) / (previous[1]! - next[1]!);
      next = add(previous, scale(sub(next, previous), fraction));
      next[1] = p.cut;
      points.push(next as [number, number, number]);
      break;
    }
    points.push(next as [number, number, number]);
    if (p.style === "bob" && next[1]! < p.cut) break;
  }
  if (p.style === "bob" && points.at(-1)![1] !== p.cut)
    throw new Error(
      "Bob guide exhausted its head-derived travel bound before the cut",
    );
  if (points.length < 2) return null;
  const frame: ReturnType<typeof AutoMovieHumanHairRibbon.frame> =
    AutoMovieHumanHairRibbon.frame(points, normalize(sub(points[0]!, C)));
  if (p.style === "bob" && points.at(-1)![1] === p.cut) {
    // The finite terminal edge, not only its centre, belongs to the level cut.
    // Intersect its transported shading plane with the horizontal cut plane.
    const index: number = points.length - 1;
    const cutSide: number[] = cross(frame.normals[index]!, [0, 1, 0]);
    if (Math.hypot(...cutSide) === 0)
      throw new Error("Bob terminal plane has no finite level edge");
    const direction: number[] = normalize(cutSide);
    frame.sides[index] = scale(
      direction,
      dot(direction, frame.sides[index]!) < 0 ? -1 : 1,
    ) as [number, number, number];
  }
  const widths: number[] = [];
  const base: number =
    (p.style === "bob"
      ? 0.8 * p.shell.spacing
      : p.style === "short"
        ? 4
        : 3.5) *
    (0.85 + 0.3 * h(4));
  let distanceMm: number = 0;
  const distances: number[] = points.map(
    (point: readonly number[], k: number): number => {
      if (k !== 0) distanceMm += Math.hypot(...sub(point, points[k - 1]!));
      return distanceMm;
    },
  );
  for (let k: number = 0; k < points.length; ++k) {
    // Finite-width strips emerge from a root, not a full-width square edge.
    // Physical travel owns both ramps when guide sampling changes.
    const emergence: number = Math.min(1, distances[k]! / base);
    const rootWidth: number =
      0.2 + 0.8 * emergence * emergence * (3 - 2 * emergence);
    widths.push(
      base *
        rootWidth *
        (1 - (0.35 * distances[k]!) / distanceMm) *
        Math.sqrt(p.density),
    );
  }
  const column: readonly [number, number] =
    paintAutoMovieHumanHairStrands.COLUMNS.locks[Math.floor(h(5) * 4)]!;
  // A blunt cut uses the same strand atlas before any strand's taper starts.
  // Sampling the full atlas would turn a level centreline cut into strands
  // ending at 70--100% of each long card, a large artificial ragged hem.
  const coverage: typeof paintAutoMovieHumanHairStrands.LOCK_SHAPE =
    paintAutoMovieHumanHairStrands.LOCK_SHAPE;
  const tipV: number =
    p.style === "bob" ? coverage.shortestTip * (1 - coverage.taperShare) : 1;
  return AutoMovieHumanHairRibbon.regularize({
    points,
    ...frame,
    widths,
    column,
    v: [0, tipV],
  });
}

/** Integer hash to `[0, 1)`. */
function hash(a: number, b: number, c: number, k: number): number {
  let h: number =
    Math.imul(a + 7, 0x27d4eb2d) ^
    Math.imul(b + 1, 0x165667b1) ^
    Math.imul(c + 1, 0x9e3779b9) ^
    Math.imul(k + 3, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function tangent(g: number[], n: number[]): number[] {
  const t: number[] = sub(g, scale(n, dot(g, n)));
  const length: number = Math.hypot(t[0]!, t[1]!, t[2]!);
  return length < 1e-9 ? (null as unknown as number[]) : scale(t, 1 / length);
}

function add(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}

function sub(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

function scale(a: readonly number[], s: number): number[] {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

function normalize(a: readonly number[]): number[] {
  const length: number = Math.hypot(a[0]!, a[1]!, a[2]!);
  return length === 0 ? [0, 1, 0] : scale(a, 1 / length);
}
