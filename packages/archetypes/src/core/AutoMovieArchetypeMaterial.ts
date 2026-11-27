import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/*
 * The College Physics textbook's table of measured pairs.
 */
const OPENSTAX: string =
  "OpenStax, College Physics 2e (2022), Table 5.1, Coefficients of Static and Kinetic Friction (https://openstax.org/books/college-physics-2e/pages/5-1-friction)";

/*
 * The Physics Hypertextbook's table, each row with its primary source.
 */
const ELERT: string =
  "G. Elert, The Physics Hypertextbook, Friction, coefficient table (https://physics.info/friction/)";

/**
 * Physical materials and their cited contact measurements, independent of the
 * flat optical colours a producer draws.
 *
 * Friction belongs to a material pair. Restitution references also retain their
 * specimen and speed: a material name alone does not establish a coefficient
 * for every collision. An explicit authored coefficient is admitted as such;
 * without an explicit coefficient, it remains absent.
 */
export namespace AutoMovieArchetypeMaterial {
  /** A body's physical contact material or an explicitly mixed construction. */
  export type Kind =
    | "rubber"
    | "wood"
    | "steel"
    | "leather"
    | "teflon"
    | "sole"
    | "hoof"
    | "ice"
    | "concrete"
    | "asphalt"
    | "stone"
    | "brick"
    | "glass"
    | "ceramic"
    | "plastic"
    | "paper"
    | "fabric"
    | "foam"
    | "skin"
    | "wax"
    | "food"
    | "aluminium"
    | "lead"
    | "iron"
    | "composite"
    | "felt";

  /** One measured pair's static and kinetic friction. */
  export interface IFriction {
    /** Dimensionless static coefficient or observed minimum and maximum. */
    readonly static: number | readonly [number, number];

    /** Dimensionless kinetic coefficient or range; null when unmeasured. */
    readonly kinetic: number | readonly [number, number] | null;

    /** The publication and the conditions represented by this pair. */
    readonly source: string;
  }

  /*
   * The admitted names, kept private so callers cannot edit the catalogue.
   */
  const KINDS: readonly Kind[] = Object.freeze([
    "rubber",
    "wood",
    "steel",
    "leather",
    "teflon",
    "sole",
    "hoof",
    "ice",
    "concrete",
    "asphalt",
    "stone",
    "brick",
    "glass",
    "ceramic",
    "plastic",
    "paper",
    "fabric",
    "foam",
    "skin",
    "wax",
    "food",
    "aluminium",
    "lead",
    "iron",
    "composite",
    "felt",
  ]);

  /** Cited friction pairs, keyed by alphabetically ordered material names. */
  export const FRICTION: Readonly<Record<string, IFriction>> = {
    "concrete/felt": {
      static: 0.65,
      kinetic: [0.61, 0.65],
      source:
        "ITF Approved Tennis Balls, Classified Court Surfaces & Recognised Courts: Court Pace Rating = 100(1 - mu) + 150(0.81 - e), Category 3 (medium) 35 to 39, so a tennis ball's felt sliding on a medium hard court has mu 0.61 to 0.65 at the reference e = 0.81. The rating measures sliding during the bounce; no static value is published, so the static coefficient is the largest sliding value, 0.65, the least a static coefficient can be since it is never below the kinetic one (provisional).",
    },
    "concrete/rubber": {
      static: 1,
      kinetic: 0.7,
      source: `${OPENSTAX}: rubber on dry concrete`,
    },
    "wood/wood": {
      static: 0.5,
      kinetic: 0.3,
      source: `${OPENSTAX}: wood on wood`,
    },
    "steel/wood": {
      static: 0.5,
      kinetic: 0.3,
      source: `${OPENSTAX}: metal on wood`,
    },
    "steel/steel": {
      static: 0.6,
      kinetic: 0.3,
      source: `${OPENSTAX}: steel on steel, dry`,
    },
    "steel/teflon": {
      static: 0.04,
      kinetic: 0.04,
      source: `${OPENSTAX}: Teflon on steel`,
    },
    "sole/wood": {
      static: 0.9,
      kinetic: 0.7,
      source: `${OPENSTAX}: shoes on wood`,
    },
    "ice/sole": {
      static: 0.1,
      kinetic: 0.05,
      source: `${OPENSTAX}: shoes on ice`,
    },
    "ice/ice": {
      static: 0.1,
      kinetic: 0.03,
      source: `${OPENSTAX}: ice on ice`,
    },
    "ice/steel": {
      static: 0.04,
      kinetic: 0.02,
      source: `${OPENSTAX}: steel on ice`,
    },
    "asphalt/rubber": {
      static: [0.84, 0.98],
      kinetic: 0.72,
      source: `${ELERT}: car tyre on asphalt, after the American Journal of Physics (https://doi.org/10.1119/1.1321812)`,
    },
    "concrete/hoof": {
      static: 0.48,
      kinetic: 0.47,
      source: `${ELERT}: horseshoe on concrete (https://doi.org/10.1017/S1478061506617234)`,
    },
    "asphalt/hoof": {
      static: 0.44,
      kinetic: 0.42,
      source: `${ELERT}: horseshoe on asphalt (https://doi.org/10.1017/S1478061506617234)`,
    },
    "hoof/stone": {
      static: 0.42,
      kinetic: 0.38,
      source: `${ELERT}: horseshoe on cobblestone (https://doi.org/10.1017/S1478061506617234)`,
    },
    "hoof/rubber": {
      static: 0.68,
      kinetic: 0.67,
      source: `${ELERT}: horseshoe on rubber (https://doi.org/10.1017/S1478061506617234)`,
    },
    "steel/stone": {
      static: [0.3, 0.7],
      kinetic: null,
      source: `${ELERT}: iron on stone, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
    "brick/wood": {
      static: 0.6,
      kinetic: null,
      source: `${ELERT}: wood on brick, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
    "stone/wood": {
      static: 0.4,
      kinetic: null,
      source: `${ELERT}: wood on stone, after W. J. M. Rankine, A Manual of Applied Mechanics (1858)`,
    },
    "leather/steel": {
      static: 0.56,
      kinetic: null,
      source: `${ELERT}: leather on metals, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
    "concrete/wood": {
      static: [0.61, 0.88],
      kinetic: null,
      source:
        "Araki, Lee, Endo, Yoshida and Uetani 2009, AIJ Journal of Technology and Design 15(30):405-409, case D, eq. (4): hinoki on an untreated concrete block, 0.88 at the first loading and 0.61 at the second (https://www.jstage.jst.go.jp/article/aijt/15/30/15_30_405/_pdf/-char/ja)",
    },
    "concrete/steel": {
      static: 0.52,
      kinetic: 0.46,
      source:
        "static: Ikenaga et al. 2008, Proceedings of the 14th World Conference on Earthquake Engineering, section 2.2, mill-scale steel on non-shrink mortar, with Rabbat and Russell 1985 (ASCE Journal of Structural Engineering 111(3):505, read at its abstract only, 0.57 to 0.70) as corroboration; kinetic: Gomez, Kanvinde and Deierlein 2011, AISC Engineering Journal Q4, Table 1, sliding after the bond breaks (https://ej.aisc.org/index.php/engj/article/download/1021/1020). Both primaries measure steel on grout or mortar, not on bare concrete",
    },
    "concrete/stone": {
      static: 0.57,
      kinetic: 0.53,
      source:
        "Badika et al. 2022, Applied Sciences 12:5643 (https://doi.org/10.3390/app12115643), p. 6: a smooth saw-cut granite-concrete interface, peak friction angle 29.7 degrees and residual 27.9 degrees, their tangents, bonding negligible per the authors. It is a cast interface tested in direct shear at 0.5 to 1.5 MPa normal stress, not a loose stone on a slab; a stone resting under its own weight sees far lower stress, so the row is the best measured analogue, not an exact match",
    },
    "leather/wood": {
      static: [0.27, 0.38],
      kinetic: null,
      source: `${ELERT}: leather on wood, after the Handbook of Chemistry and Physics, 8th edition (1920)`,
    },
  };

  // Freeze nested ranges and rows as well as the catalogue itself: these
  // measured constants are borrowed by every producer and part query.
  for (const row of Object.values(FRICTION)) {
    // Freezing a bare number is a no-op, so only ranges are changed.
    Object.freeze(row.static);
    if (row.kinetic !== null) Object.freeze(row.kinetic);
    Object.freeze(row);
  }
  Object.freeze(FRICTION);

  /**
   * Admit the material explicitly named by a producer.
   *
   * @param material The producer's physical reference material.
   * @param archetype The producer named by a refusal.
   * @returns The admitted physical material.
   * @throws {AutoMovieArchetypeRefusal} When no known material was declared.
   */
  export function admit(material: Kind | undefined, archetype: string): Kind {
    if (material !== undefined && KINDS.includes(material)) return material;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "material",
      value: material,
      feasible: { kind: "alternatives", values: [...KINDS] },
      reason: "a body needs an explicitly declared physical material",
      fix: "declare the body's physical material; use composite for an actually mixed construction",
    });
  }

  /**
   * Admit an explicitly authored or calibrated normal restitution.
   *
   * Published specimen measurements remain in AutoMovieArchetypeRestitution
   * with their material pair, speed and geometry. None becomes a body-wide
   * coefficient merely because the producer names the same material.
   *
   * @param material The admitted physical material, named in a refusal.
   * @param explicit An authored normal speed ratio; absence means unknown.
   * @param archetype The producer named by invalid-coefficient refusals.
   * @returns The declared ratio from zero through one, or null when absent.
   * @throws {AutoMovieArchetypeRefusal} When an explicit ratio is not finite or
   *   lies outside zero through one.
   */
  export function restitution(
    material: Kind,
    explicit: number | undefined,
    archetype: string,
  ): number | null {
    if (explicit === undefined) return null;
    if (explicit >= 0 && explicit <= 1) return explicit;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "restitution",
      value: explicit,
      feasible: { kind: "range", minimum: 0, maximum: 1, unit: "" },
      reason: `normal restitution for ${material} must be a finite ratio from zero through one`,
      fix: "give a measured or explicitly authored normal restitution in that interval",
    });
  }

  /**
   * Read the friction of two physical surfaces in either order.
   *
   * @param a One physical surface.
   * @param b The other physical surface.
   * @param archetype The producer named by an unsupported-pair refusal.
   * @returns The borrowed immutable measured pair.
   * @throws {AutoMovieArchetypeRefusal} When no source in this catalogue
   *   measured the pair.
   */
  export function friction(a: Kind, b: Kind, archetype: string): IFriction {
    const key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
    const row: IFriction | undefined = FRICTION[key];
    if (row !== undefined) return row;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "friction",
      value: key,
      feasible: { kind: "alternatives", values: Object.keys(FRICTION) },
      reason: `no source read here measured the friction of ${a} on ${b}`,
      fix: "declare surfaces whose pair a source measured, or read a source for this pair and add its row",
    });
  }
}
