/**
 * Shape the auricle's control loops in its own frame, from ear length, breadth and protrusion.
 *
 * The frame has its origin at tragion: `x` runs posteriorly across the auricle, `y` up its long axis (the superaurale-subaurale line), `h` laterally away from the head, all in millimetres. Distances across scale with ear breadth and heights with protrusion; along the axis the cartilaginous auricle above the intertragic notch scales with breadth and the lobule takes the rest of the length ({@link CARTILAGE}), so the ear an old person gains lengthens the lobule. One drawing serves every identity and the measured auricle follows its measurements; the generator turns the frame into the model frame.
 *
 * The auricle is one cartilage plate under thin skin, rolled at its free margin and folded inside it (Gray, Anatomy of the Human Body, 1918, "The Auricula"). The loops follow that construction from the attachment outward and then inward:
 *
 * 1. The attachment ring and the back of the auricle, its cranial surface, rising from the scalp to the free margin.
 * 2. The helix: its back, the free margin, its crest, and the lip rolled forward over the scapha, whose floor tucks under the lip.
 * 3. Three loops across the plate between the scapha and the concha: the antihelix behind, its superior crus, the triangular fossa and the inferior crus above, the lobule below.
 * 4. The rim of the concha, one edge loop all round: the inferior crus, the crus of the helix, the tragus, the intertragic notch, the antitragus and the antihelix.
 * 5. Three loops down the bowl of the concha, the cymba above the crus of the helix and the cavum below it, deepest at the external acoustic meatus under the tragus; a grid closes the floor.
 *
 * Every loop has 24 stations in anatomical order: 0 at superaurale, increasing toward the front (the helix root at 5, the tragus at 8), the lobule at 12 and the posterior point at 18. The free margin and the concha rim are drawn through 12 named points each, at the even stations, read from Gray's lateral view of the auricle (fig. 904) after shearing its superaurale-subaurale line upright, and placed along the length by the survey's adult proportions (Cho et al. 2025, J Korean Med Sci 40(22):e107): lobular length 0.38 of ear length (25.3 of 66.8 mm in men), the tragus 0.17, the rest above tragion. Odd stations take the cubic midpoint of their neighbours. The drawing was then calibrated offline against a reference ear ({@link FORM}); the front of the margin, the helix root, tragus and lobule's attachment, keeps Gray's drawing. Grade: conventional drawing, fitted to a reference and proportioned by measured means.
 *
 * The attachment is the shared `ear` ring, given in this frame; the cranial surface rises from it and stays a cartilage's thickness under the lateral one.
 *
 * @param size Ear length, breadth and protrusion, millimetres
 * @param attachment The eight vertices of the attachment ring in this frame, anatomical order: up, up-front, front, down-front, down, down-back, back, up-back
 * @param form Coefficients of the drawing, by default the fitted human ear's
 * @returns The first loop off the attachment, the loops from there to the concha floor, and the semi-sharp edges
 */
export function shapeAutoMovieHumanEar(
  size: shapeAutoMovieHumanEar.ISize,
  attachment: shapeAutoMovieHumanEar.IPoint[],
  form: shapeAutoMovieHumanEar.IForm = FORM,
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
  const centre: IPoint = place({ ...form.concha, h: 0 });

  // the free margin; the tragus stands between the anterior notch above it and the intertragic notch below, both cut forward of its tip
  const outline: IPoint[] = stations(form.outline.map(place)).map(
    (o: IPoint, j: number): IPoint => {
      const notch: number = j === 7 || j === 9 ? 1 : 0;
      const d: number = Math.hypot(centre.x - o.x, centre.y - o.y);
      return {
        x: o.x + ((centre.x - o.x) / d) * form.notch.depth * B * notch,
        y: o.y + ((centre.y - o.y) / d) * form.notch.depth * B * notch,
        h: o.h - form.notch.drop * P * notch,
      };
    },
  );
  const helix: number[] = stations(
    form.outline.map((k: IOutlineKey): IPoint => ({ x: k.helix, y: 0, h: 0 })),
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
  // the helix: its back, crest and lip, and the scapha floor tucked under the lip; the tragus gets a crest of its own
  const rimBack: IPoint[] = range(24).map((j: number): IPoint =>
    along(j, 0.03, -(0.12 + 0.06 * helix[j]!)),
  );
  const crest: IPoint[] = range(24).map((j: number): IPoint =>
    along(j, 0.05 + 0.04 * helix[j]!, 0.05 + 0.1 * helix[j]! + form.relief.tragus * window(j, 8, 1.5)),
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
  const rim: IPoint[] = stations(form.rim.map(place)).map(
    (r: IPoint, j: number): IPoint => ({
      ...r,
      h: r.h + form.relief.crus * P * window(j, 5.5, 1.6),
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
          (form.relief.antihelix * window(j, 18, 5.5) * bump(t, 0.8, 0.32) +
            form.relief.superiorCrus * window(j, 22.5, 4) * bump(t, 0.3, 0.35) -
            form.relief.fossa * window(j, 1, 3.5) * bump(t, 0.62, 0.3) +
            form.relief.lobule * window(j, 12, 3.5) * bump(t, 0.4, 0.6) -
            form.relief.notch * window(j, 12.5, 2.5) * bump(t, 0.85, 0.25));
      return lerp(s, r, t, h);
    }),
  );

  // the bowl of the concha, its wall steepest under the rim and its floor deepest at the meatus
  const floor: IPoint = { ...centre, h: form.floor * P };
  const bowl: IPoint[][] = BOWL.map((t: number): IPoint[] =>
    range(24).map((j: number): IPoint => {
      const r: IPoint = rim[j]!;
      const deep: number =
        P *
        (form.floor +
          form.relief.cymba * window(j, 1, 5) -
          form.relief.meatus * window(j, 8, 3) * bump(t, 0.3, 0.6));
      const wall: number = Math.pow(1 - t, form.relief.wall);
      const crus: number = form.relief.crus * 1.1 * P * window(j, 5.5, 1.6) * (1 - t);
      return lerp(r, floor, t, deep + (r.h - deep) * wall + crus * (1 - wall));
    }),
  );

  // the back of the auricle from the attachment to the back of the helix, low in front where the tragus and lobule meet the cheek
  const ring: IPoint[] = attachment;
  const back = (j: number, t: number, lift: number): IPoint => {
    const k: number = Math.floor(j / 3);
    const a: IPoint = ring[k]!;
    const r: IPoint = lerp(a, ring[(k + 1) % 8]!, (j % 3) / 3, 0);
    const o: IPoint = rimBack[j]!;
    const low: number = 0.7 * Math.max(window(j, 4.5, 3), window(j, 11, 2.5));
    // the cranial surface stays a cartilage's thickness under the lateral one
    const under: number =
      Math.min(scapha[j]!.h, ...plate.map((l: IPoint[]): number => l[j]!.h)) -
      THICKNESS * P;
    return lerp(r, o, t, Math.min(under, o.h * lift * (1 - low)));
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
    /** First loop off the attachment, eight points in the ring's order, each three stations of the next loop apart. */
    neck: IPoint[];

    /** Loops of 24 stations from the back of the auricle over the helix into the concha; the last is closed by a grid. */
    loops: IPoint[][];

    /** Semi-sharp edges. */
    creases: ICrease[];
  }

  /**
   * The named coefficients of the drawing.
   *
   * @author Samchon
   */
  export interface IForm {
    /** Free margin at the even stations. */
    outline: IOutlineKey[];

    /** Concha rim at the even stations. */
    rim: IPoint[];

    /** Centre of the concha floor. */
    concha: { x: number; y: number };

    /** Depth of the concha floor, over protrusion. */
    floor: number;

    /** The notches either side of the tragus. */
    notch: { depth: number; drop: number };

    /** Heights of the folds, over protrusion, and the concha wall's exponent. */
    relief: {
      antihelix: number;
      superiorCrus: number;
      fossa: number;
      lobule: number;
      notch: number;
      crus: number;
      cymba: number;
      meatus: number;
      tragus: number;
      wall: number;
    };
  }

  /**
   * A free-margin key with how far the helix is rolled there.
   *
   * @author Samchon
   */
  export interface IOutlineKey extends IPoint {
    /** 0 at the tragus and lobule, 1 behind. */
    helix: number;
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

type IOutlineKey = shapeAutoMovieHumanEar.IOutlineKey;

/**
 * Catmull-Clark subdivision draws the limit surface inside its cage, so the drawing is enlarged by the ratio of each measurement to the same measurement taken on the limit surface of this cage, the same for every identity because the cage is linear in the three measurements. Grade: derived, measured on the subdivided surface.
 */
const LIMIT: Record<keyof shapeAutoMovieHumanEar.ISize, number> = {
  length: 1.012,
  breadth: 0.994,
  protrusion: 0.64,
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
const CONCHA: { x: number; y: number } = { x: 0.35, y: -0.02 };

/** How far the anterior and intertragic notches cut into the margin either side of the tragus, over breadth, and how far they sink, over protrusion. */
const NOTCH: { depth: number; drop: number } = { depth: 0, drop: 0.15 };

/** Depth of the concha floor below the attachment plane, over protrusion; the floor sinks toward the meatus. */
const FLOOR: number = -0.01;

/**
 * The free margin at the even stations: across in breadths from otobasion superius, along in lengths from tragion, off the head in protrusions before the calibration `LIMIT` takes the tragal-level protrusion to the measured one.
 */
const OUTLINE: IOutlineKey[] = [
  { x: 0.268, y: 0.48, h: 0.768, helix: 1 }, // superaurale
  { x: -0.154, y: 0.44, h: 0.31, helix: 1 },
  { x: -0.232, y: 0.2, h: 0.26, helix: 0.9 }, // ascending helix, preaurale
  { x: -0.154, y: 0.04, h: 0.22, helix: 0.5 }, // helix root over the anterior notch
  { x: 0.149, y: -0.08, h: 0.48, helix: 0 }, // free edge of the tragus
  { x: -0.12, y: -0.35, h: 0.32, helix: 0 }, // lobule, front
  { x: 0.194, y: -0.535, h: 0.557, helix: 0 }, // subaurale
  { x: 0.572, y: -0.448, h: 0.893, helix: 0.45 },
  { x: 0.922, y: -0.171, h: 1.074, helix: 0.8 }, // tail of the helix
  { x: 1.034, y: 0.078, h: 1.382, helix: 1 }, // posterior point
  { x: 0.941, y: 0.27, h: 1.48, helix: 1 },
  { x: 0.646, y: 0.435, h: 1.182, helix: 1 },
];

/** The concha rim at the even stations, in the units of `OUTLINE`: the inferior crus, the crus of the helix, the meatus under the tragus, the intertragic notch, the antitragus and the antihelix. */
const RIM: IPoint[] = [
  { x: 0.34, y: 0.21, h: 0.9 }, // under the inferior crus
  { x: 0.118, y: 0.18, h: 0.058 },
  { x: -0.027, y: 0.12, h: 0.32 },
  { x: 0.046, y: 0.027, h: 0.3 }, // crus of the helix
  { x: 0.27, y: -0.07, h: 0.06 }, // under the tragus, over the meatus
  { x: 0.198, y: -0.16, h: 0.3 }, // intertragic notch
  { x: 0.365, y: -0.14, h: 0.17 }, // antitragus
  { x: 0.571, y: -0.14, h: 1.005 },
  { x: 0.597, y: -0.069, h: 0.925 },
  { x: 0.597, y: 0.036, h: 0.988 }, // antihelix
  { x: 0.541, y: 0.15, h: 1.038 },
  { x: 0.462, y: 0.2, h: 1.05 },
];


/**
 * The drawing's coefficients, calibrated offline against the left auricle of the MakeHuman base mesh (`base.obj`, released CC0 in September 2020; its code was not read and nothing of it is shipped). Both ears were reduced to their lateral height fields: the auricle cut from the head by its height above the head's own surface (a quadratic fitted to the skin around it), set upright on its superaurale-subaurale line, and scaled to unit length, breadth and height, so only form is compared and the measurements stay the identity's. A coordinate descent over the margin's keys behind and below the front, the margin and rim heights and the concha floor, regularised toward Gray's drawing, lowered the mean squared height difference over the auricle's footprint from 0.063 to 0.010. The front of the margin keeps Gray's drawing because the reference's flattened cheek hides its height there.
 *
 * Across, the fitted drawing was then stretched about the posterior point until the ear's whole breadth, preaurale to postaurale, is 0.55 of its length, the auricular index of 57.9 in men and 58.7 in women among 200 Turkish adults (Bahşi et al. 2023, J Craniofac Surg 34(8):e799-e803): the survey's breadth is taken from otobasion superius, behind the front of the helix, so the reference's narrower 0.48 is not the measured proportion. Grade: population-fitted form, measured proportion.
 */
const FORM: shapeAutoMovieHumanEar.IForm = {
  outline: OUTLINE,
  rim: RIM,
  concha: CONCHA,
  floor: FLOOR,
  notch: NOTCH,
  relief: {
    antihelix: 0.2,
    superiorCrus: 0.22,
    fossa: 0.16,
    lobule: 0.06,
    notch: 0.1,
    crus: 0.2,
    cymba: 0.25,
    meatus: 0.25,
    tragus: 0.1,
    wall: 2.6,
  },
};

/** Least thickness of the auricle between its cranial and lateral surfaces, over protrusion: the cartilage plate with its skin, about 3 mm at the 19.5 mm protrusion of men. Conventional. */
const THICKNESS: number = 0.15;

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
