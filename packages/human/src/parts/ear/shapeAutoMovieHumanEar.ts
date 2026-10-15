/**
 * Shape the auricle's control loops in its own frame, from ear length, breadth and protrusion.
 *
 * The frame has its origin at tragion: `x` runs posteriorly across the auricle, `y` up its long axis (the superaurale-subaurale line), `h` laterally away from the head, all in millimetres. Lengths along `y` scale with ear length, across with ear breadth and heights with protrusion, so one drawing serves every identity and the measured auricle follows its measurements; the generator turns the frame into the model frame.
 *
 * The auricle is one cartilage plate under thin skin, rolled at its free margin and folded inside it (Gray, Anatomy of the Human Body, 1918, "The Auricula"). The loops follow that construction from the attachment outward and then inward:
 *
 * 1. The attachment ring and the back of the auricle, its cranial surface, rising from the scalp to the free margin.
 * 2. The helix: its back, the free margin, its crest, and the lip rolled forward over the scapha, whose floor tucks under the lip.
 * 3. Three loops across the plate between the scapha and the concha: the antihelix behind, its superior crus, the triangular fossa and the inferior crus above, the lobule below.
 * 4. The rim of the concha, one edge loop all round: the inferior crus, the crus of the helix, the tragus, the intertragic notch, the antitragus and the antihelix.
 * 5. Three loops down the bowl of the concha, the cymba above the crus of the helix and the cavum below it, deepest at the external acoustic meatus under the tragus; a grid closes the floor.
 *
 * Every loop has 24 stations in anatomical order: 0 at superaurale, increasing toward the front (the helix root at 5, the tragus at 8), the lobule at 12 and the posterior point at 18. The free margin and the concha rim are drawn through 12 named points each, at the even stations, read from Gray's lateral view of the auricle (fig. 904) after shearing its superaurale-subaurale line upright, and placed along the length by the survey's proportions (Cho et al. 2025, J Korean Med Sci 40(22):e107): lobular length 0.38 of ear length (25.3 of 66.8 mm in men), tragus 0.17, the rest above tragion. Odd stations take the cubic midpoint of their neighbours. Grade: conventional, an anatomical drawing proportioned by measured means.
 *
 * @param size Ear length, breadth and protrusion, millimetres
 * @returns The ring design points, the loops from the attachment to the concha floor and the semi-sharp edges
 */
export function shapeAutoMovieHumanEar(
  size: shapeAutoMovieHumanEar.ISize,
): shapeAutoMovieHumanEar.IOutput {
  const L: number = size.length * LIMIT.length;
  const B: number = size.breadth * LIMIT.breadth;
  const P: number = size.protrusion * LIMIT.protrusion;
  const xc: number = -ATTACHMENT * B;
  // the cartilage keeps pace with the breadth and the lobule takes the rest of the length
  const cartilage: number = Math.min(
    CARTILAGE.most * L,
    Math.max(CARTILAGE.least * L, CARTILAGE.perBreadth * B),
  );
  const up: number = cartilage / (1 - LOBULE);
  const down: number = (L - cartilage) / LOBULE;
  const y = (f: number): number =>
    f >= NOTCH_LEVEL
      ? f * up
      : NOTCH_LEVEL * up + (f - NOTCH_LEVEL) * down;
  const place = (k: IPoint): IPoint => ({ x: xc + k.x * B, y: y(k.y), h: k.h * P });
  const centre: IPoint = place(CONCHA);

  // the helix: back, free margin, crest, lip, and the scapha floor under it
  // the tragus stands between two notches: the anterior notch above it, the intertragic notch below
  const outline: IPoint[] = stations(OUTLINE.map(place)).map(
    (o: IPoint, j: number): IPoint => {
      const notch: number = j === 7 || j === 9 ? 1 : 0;
      const d: number = Math.hypot(centre.x - o.x, centre.y - o.y);
      return {
        x: o.x + ((centre.x - o.x) / d) * NOTCH.depth * B * notch,
        y: o.y + ((centre.y - o.y) / d) * NOTCH.depth * B * notch,
        h: o.h - NOTCH.drop * P * notch,
      };
    },
  );
  const helix: number[] = stations(
    OUTLINE.map((k: IOutlineKey): IPoint => ({ x: k.helix, y: 0, h: 0 })),
  ).map((p: IPoint): number => Math.min(1, Math.max(0, p.x)));
  const along = (j: number, depth: number, rise: number): IPoint => {
    const o: IPoint = outline[j]!;
    const d: number = Math.hypot(centre.x - o.x, centre.y - o.y);
    return {
      x: o.x + ((centre.x - o.x) / d) * depth * B,
      y: o.y + ((centre.y - o.y) / d) * depth * B,
      h: o.h + rise * P,
    };
  };
  const rimBack: IPoint[] = range(24).map((j: number): IPoint =>
    along(j, 0.03, -(0.12 + 0.06 * helix[j]!)),
  );
  const crest: IPoint[] = range(24).map((j: number): IPoint =>
    along(j, 0.05 + 0.04 * helix[j]!, 0.05 + 0.1 * helix[j]! + 0.1 * window(j, 8, 1.5)),
  );
  const lip: IPoint[] = range(24).map((j: number): IPoint =>
    along(j, 0.1 + 0.1 * helix[j]!, 0.04 * helix[j]!),
  );
  const scapha: IPoint[] = range(24).map((j: number): IPoint =>
    along(
      j,
      0.13 + 0.09 * helix[j]!,
      -(0.04 + 0.2 * helix[j]! * (1 - 0.45 * window(j, 0, 5))),
    ),
  );

  // the concha rim, the crus of the helix lifting it where it enters
  const rim: IPoint[] = stations(RIM.map(place)).map(
    (r: IPoint, j: number): IPoint => ({
      ...r,
      h: r.h + 0.2 * P * window(j, 5.5, 1.6),
    }),
  );

  // the plate between the scapha and the concha rim
  const plate: IPoint[][] = PLATE.map((t: number): IPoint[] =>
    range(24).map((j: number): IPoint => {
      const s: IPoint = scapha[j]!;
      const r: IPoint = rim[j]!;
      const h: number =
        s.h +
        (r.h - s.h) * smooth(t) +
        P *
          (0.2 * window(j, 18, 5.5) * bump(t, 0.8, 0.32) + // antihelix
            0.22 * window(j, 22.5, 4) * bump(t, 0.3, 0.35) - // superior crus
            0.16 * window(j, 1, 3.5) * bump(t, 0.62, 0.3) + // triangular fossa
            0.06 * window(j, 12, 3.5) * bump(t, 0.4, 0.6) - // lobule
            0.1 * window(j, 12.5, 2.5) * bump(t, 0.85, 0.25)); // the lobule falls away under the antitragus
      return lerp(s, r, t, h);
    }),
  );

  // the bowl of the concha, its wall steepest under the rim and its floor deepest at the meatus
  const floor: IPoint = { ...centre, h: FLOOR * P };
  const bowl: IPoint[][] = BOWL.map((t: number): IPoint[] =>
    range(24).map((j: number): IPoint => {
      const r: IPoint = rim[j]!;
      const deep: number =
        P *
        (FLOOR +
          0.25 * window(j, 1, 5) - // the cymba is shallower than the cavum
          0.25 * window(j, 8, 3) * bump(t, 0.3, 0.6));
      const wall: number = Math.pow(1 - t, 2.6);
      const crus: number = 0.22 * P * window(j, 5.5, 1.6) * (1 - t);
      return lerp(r, floor, t, deep + (r.h - deep) * wall + crus * (1 - wall));
    }),
  );

  // the back of the auricle from the attachment to the back of the helix, low in front where the tragus and lobule meet the cheek
  const ring: IPoint[] = RING.map(place);
  const back = (j: number, t: number, lift: number): IPoint => {
    const k: number = Math.floor(j / 3);
    const a: IPoint = ring[k]!;
    const r: IPoint = lerp(a, ring[(k + 1) % 8]!, (j % 3) / 3, 0);
    const o: IPoint = rimBack[j]!;
    const low: number = 0.7 * Math.max(window(j, 4.5, 3), window(j, 11, 2.5));
    return lerp(r, o, t, o.h * lift * (1 - low));
  };
  const neck: IPoint[] = range(8).map((k: number): IPoint => back(3 * k, 0.2, 0.12));

  const loops: IPoint[][] = [
    range(24).map((j: number): IPoint => back(j, 0.6, 0.55)),
    rimBack,
    outline,
    crest,
    lip,
    scapha,
    ...plate,
    rim,
    ...bowl,
  ];
  const rimLoop: number = loops.indexOf(rim);
  return {
    ring,
    neck,
    loops,
    creases: [
      // the antihelix and antitragus edge of the concha
      ...range(12).map(
        (i: number): shapeAutoMovieHumanEar.ICrease => ({
          loop: rimLoop,
          station: 11 + i,
          sharpness: 0.3 + 0.7 * window(11.5 + i, 17.5, 7),
        }),
      ),
      // the free edge of the tragus
      ...[7, 8].map(
        (j: number): shapeAutoMovieHumanEar.ICrease => ({
          loop: loops.indexOf(outline),
          station: j,
          sharpness: 0.6,
        }),
      ),
      // the lip of the helix over the scapha
      ...range(13).map(
        (i: number): shapeAutoMovieHumanEar.ICrease => ({
          loop: loops.indexOf(lip),
          station: (15 + i) % 24,
          sharpness: 0.3,
        }),
      ),
    ],
  };
}
export namespace shapeAutoMovieHumanEar {
  /**
   * The measurements the auricle is drawn from, millimetres.
   *
   * @author Samchon
   */
  export interface ISize {
    /** Superaurale to subaurale. */
    length: number;

    /** Otobasion superius to the posterior point, across the long axis. */
    breadth: number;

    /** Helix rim off the scalp at the level of tragion. */
    protrusion: number;
  }

  /**
   * The auricle's loops in its own frame.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Design points of the attachment in the eight ring directions, anatomical order (up, up-front, front, down-front, down, down-back, back, up-back); the generator moves each onto its ring direction. */
    ring: IPoint[];

    /** First loop off the attachment, eight points in the ring's order, each three stations of the next loop apart. */
    neck: IPoint[];

    /** Loops of 24 stations from the back of the auricle over the helix into the concha; the last is closed by a grid. */
    loops: IPoint[][];

    /** Semi-sharp edges. */
    creases: ICrease[];
  }

  /**
   * A point of the auricle's frame, millimetres.
   *
   * @author Samchon
   */
  export interface IPoint {
    /** Across the auricle, posterior positive, from tragion. */
    x: number;

    /** Up the long axis from tragion. */
    y: number;

    /** Lateral off the head. */
    h: number;
  }

  /**
   * One semi-sharp edge of a loop.
   *
   * @author Samchon
   */
  export interface ICrease {
    /** Index of the loop in `loops`. */
    loop: number;

    /** Anatomical station the edge starts at; it ends at the next. */
    station: number;

    /** Subdivision levels it stays sharp. */
    sharpness: number;
  }
}

type IPoint = shapeAutoMovieHumanEar.IPoint;

/** A named point of the free margin, with how far the helix is rolled there, 0 at the tragus and lobule to 1 behind. */
interface IOutlineKey extends IPoint {
  helix: number;
}

/**
 * Catmull-Clark subdivision draws the limit surface inside its cage, so the drawing is enlarged by the ratio of each measurement to the same measurement taken on the limit surface of this cage, the same for every identity because the cage is linear in the three measurements. Grade: derived, measured on the subdivided surface.
 */
const LIMIT: Record<keyof shapeAutoMovieHumanEar.ISize, number> = {
  length: 1.023,
  breadth: 1.021,
  protrusion: 0.918,
};

/** Lobular length over ear length in the drawing: 25.3 of 66.8 mm in men (Cho et al. 2025). */
const LOBULE: number = 0.38;

/** Level of the intertragic notch in the drawing, where the lobule begins, in ear lengths from tragion: subaurale at -0.55 plus the lobule. */
const NOTCH_LEVEL: number = -0.17;

/**
 * The cartilaginous auricle above the intertragic notch, by breadth, and its bounds by length. With age the ear lengthens while its breadth holds, and "the lobule contributes the most to the overall elongation of the auricle" (415 Indian men aged 18 to 70, Purkait and Singh 2007, Aesthetic Plast Surg 31(4):372-379); Cho et al. (2025) likewise find breadth stable and lobular length rising with age. So the cartilage above the notch keeps its adult ratio to breadth, 1.375 (40.0 of 29.1 mm at 30 years in men, the drawing's 0.62 of length), and the lobule takes the rest of the length: 0.45 of an 80-year-old woman's ear, 0.30 of a 6-year-old boy's. The bounds keep an infant's lobule at least 0.28 of the ear and an old lobule at most 0.46. Grade: derived.
 */
const CARTILAGE: { perBreadth: number; least: number; most: number } = {
  perBreadth: 1.375,
  least: 0.54,
  most: 0.72,
};

/** Otobasion superius in front of tragion across the auricle, over ear breadth: it stands nearly over the tragus along the long axis (Gray 1918, fig. 904). */
const ATTACHMENT: number = 0.02;

/** Centre of the concha floor between the cymba and the cavum, at the end of the crus of the helix: across in breadths from otobasion superius, along in lengths from tragion. */
const CONCHA: IPoint = { x: 0.42, y: -0.02, h: 0 };

/** How far the anterior and intertragic notches cut into the margin either side of the tragus, over breadth, and how far they sink, over protrusion. */
const NOTCH: { depth: number; drop: number } = { depth: -0.1, drop: 0.22 };

/** Depth of the concha floor below the attachment plane, over protrusion; the floor sinks toward the meatus. */
const FLOOR: number = -0.12;

/**
 * The free margin at the even stations: across in breadths from otobasion superius, along in lengths from tragion, off the head in protrusions. Superaurale stands 0.5 protrusion off the scalp and the posterior point 1, after the survey's 9.9 and 19.5 mm at the superaurale and tragal levels (Cho et al. 2025).
 */
const OUTLINE: IOutlineKey[] = [
  { x: 0.38, y: 0.45, h: 0.5, helix: 1 }, // superaurale
  { x: 0.02, y: 0.38, h: 0.36, helix: 1 },
  { x: -0.1, y: 0.2, h: 0.26, helix: 0.9 }, // ascending helix
  { x: -0.03, y: 0.04, h: 0.22, helix: 0.5 }, // helix root over the anterior notch
  { x: 0.24, y: -0.08, h: 0.48, helix: 0 }, // free edge of the tragus
  { x: 0.0, y: -0.35, h: 0.32, helix: 0 }, // lobule, front
  { x: 0.36, y: -0.55, h: 0.32, helix: 0 }, // subaurale
  { x: 0.72, y: -0.47, h: 0.48, helix: 0.45 },
  { x: 0.9, y: -0.22, h: 0.78, helix: 0.8 }, // tail of the helix
  { x: 1, y: 0.1, h: 1, helix: 1 }, // posterior point
  { x: 0.94, y: 0.3, h: 0.88, helix: 1 },
  { x: 0.72, y: 0.43, h: 0.68, helix: 1 },
]

/** The concha rim at the even stations, in the units of `OUTLINE`. The concha reaches 0.42 of ear length above the intertragic notch (conchal length 28.0 of 66.8 mm in men, Cho et al. 2025). */
const RIM: IPoint[] = [
  { x: 0.411, y: 0.21, h: 0.5 }, // under the inferior crus
  { x: 0.212, y: 0.18, h: 0.42 },
  { x: 0.083, y: 0.12, h: 0.32 },
  { x: 0.148, y: 0.027, h: 0.3 }, // crus of the helix
  { x: 0.24, y: -0.06, h: 0.06 }, // under the tragus, over the meatus
  { x: 0.284, y: -0.16, h: 0.3 }, // intertragic notch
  { x: 0.433, y: -0.14, h: 0.62 }, // antitragus
  { x: 0.617, y: -0.14, h: 0.68 },
  { x: 0.64, y: -0.069, h: 0.7 },
  { x: 0.64, y: 0.036, h: 0.85 }, // antihelix
  { x: 0.59, y: 0.15, h: 0.8 },
  { x: 0.52, y: 0.2, h: 0.65 },
];

/** Attachment to the head in the eight ring directions, in the units of `OUTLINE`: in front of the helix root and the tragus, round the lobule's upper part, behind the concha along the posterior auricular sulcus. */
const RING: IPoint[] = [
  { x: -0.12, y: 0.25, h: 0 },
  { x: -0.08, y: 0.08, h: 0 },
  { x: -0.04, y: -0.04, h: 0 },
  { x: -0.01, y: -0.17, h: 0 },
  { x: 0.4, y: -0.35, h: 0 },
  { x: 0.7, y: -0.12, h: 0 },
  { x: 0.7, y: 0.08, h: 0 },
  { x: 0.45, y: 0.26, h: 0 },
];

/** Where the plate loops lie between the scapha floor (0) and the concha rim (1). */
const PLATE: number[] = [0.28, 0.55, 0.8];

/** Where the bowl loops lie between the concha rim (0) and the floor centre (1). */
const BOWL: number[] = [0.14, 0.32, 0.56];

/** Point between two points, with its own height. */
function lerp(a: IPoint, b: IPoint, t: number, h: number): IPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, h };
}

/** Smoothstep of `t` clamped to 0 to 1. */
function smooth(t: number): number {
  const c: number = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** Raised cosine of half-width `width` centred at `at`, 1 there and 0 beyond. */
function bump(t: number, at: number, width: number): number {
  const d: number = (t - at) / width;
  return Math.abs(d) >= 1 ? 0 : (1 + Math.cos(Math.PI * d)) / 2;
}

/** Raised cosine over stations around the loop, wrapping at 24. */
function window(j: number, at: number, half: number): number {
  const d: number = Math.abs(j - at) % 24;
  return bump(Math.min(d, 24 - d), 0, half);
}

/** Integers from 0. */
function range(n: number): number[] {
  return Array.from({ length: n }, (_: unknown, i: number): number => i);
}

/** Twelve keys on the even stations, cubic midpoints of the periodic sequence on the odd ones. */
function stations(keys: IPoint[]): IPoint[] {
  return range(24).map((j: number): IPoint => {
    if (j % 2 === 0) return keys[j / 2]!;
    const at = (o: number): IPoint => keys[((j - 1) / 2 + o + 12) % 12]!;
    const mid = (f: (p: IPoint) => number): number =>
      (-f(at(-1)) + 9 * f(at(0)) + 9 * f(at(1)) - f(at(2))) / 16;
    return {
      x: mid((p: IPoint): number => p.x),
      y: mid((p: IPoint): number => p.y),
      h: mid((p: IPoint): number => p.h),
    };
  });
}
