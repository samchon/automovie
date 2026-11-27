/**
 * Type contracts exchanged by AutoMovieHumanFootPrior; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootPrior {
  /** One toe. */
  export interface IToe {
    /** Chain name; `{side}` stands for the side. */
    name: string;

    /** Tip `[a, u]`. Reference median, awaiting a published value. */
    tip: readonly [number, number];

    /**
     * Across place of the toe's line at its metatarsal head, `u`. Reference
     * median.
     */
    head: number;

    /** Height of its metatarsal head's centre, foot lengths. Reference median. */
    height: number;

    /** Breadth of the toe, foot breadths. Reference median. */
    breadth: number;

    /** Depth over breadth. Reference median. */
    depth: number;

    /** The distal pulp's breadth over the shaft's. Reference median. */
    pulp: number;

    /**
     * Phalanx joints along the line from the head to the tip, shares of its
     * length. Convention.
     */
    joints: readonly number[];

    /** Control points of a section. */
    order: number;

    /**
     * Sections of the toe's chain: the reference's bone-normal sections of this
     * digit, 2 mm apart over its whole length (f1: 29, 29, 25, 21 and 19 for
     * the hallux to the fifth toe). A toe keeps at least that many whatever its
     * length; a shorter toe has them closer.
     */
    sections: number;
  }

  /** The prior. */
  export interface IPrior {
    /**
     * The foot axis turned out from forward, radians. Reference median (8.2 to
     * 11.1 deg).
     */
    yaw: number;

    /**
     * Dimensions when none are given: ANSUR II women's and men's ratios and
     * lines, mixed by the masculine-feminine control.
     */
    expected: IPriorExpected;

    /**
     * Height of the ankle ring, the leg's start, per lateral malleolus height.
     *
     * Fitted, with no published or measured basis: the ratio that keeps the
     * leg's start at the height the earlier construction gave it, so the leg
     * (`AutoMovieHumanLegConstruction`, which reads this ring as its lowest
     * section) did not move with the foot's rewrite. It is to be replaced by
     * the ankle girth solved at its own site (the minimum girth above the
     * malleoli, ISO 8559-1), and every column knot at this height with it.
     */
    ring: number;

    /**
     * The ankle centre, `[a, u]`: the column's centre at the ankle ring.
     * Reference median.
     */
    ankle: readonly [number, number];

    /** First metatarsal head, `a`: ANSUR II ball-of-foot length (0.739, 0.741). */
    first: number;

    /**
     * Maestro's cascade: the second head's lead over the first, and each head
     * behind the one before from the third to the fifth, mm of a foot of
     * {@link CASCADE_FOOT} mm (0, 3.3, 6.5, 12).
     */
    cascade: readonly number[];

    /**
     * Clefts between neighbouring toes, `[a, u]`, hallux side first. Reference
     * median.
     */
    clefts: readonly (readonly [number, number])[];

    /** The toes, hallux first. */
    toes: readonly IToe[];

    /**
     * The malleoli as relief windows on the ankle's column: centre height in
     * lateral malleolus heights (the lateral one is the input's site, 1 by
     * definition; the medial one stands higher, Gray), prominence and radius in
     * mm. Convention, awaiting a relief fit on the references: the cuts read no
     * isolated prominence on the borders' extremes beyond 1 to 4 mm.
     */
    malleoli: IPriorMalleoli;

    /** Dorsal share of a toe's depth. Convention. */
    toeDorsal: number;
  }

  /** The malleoli object of {@link IPrior}. */
  export type IPriorMalleoli = {
    /**
     * Lateral-malleolus relief window; its height defines the reference
     * malleolus datum.
     */
    lateral: {
      /**
       * Malleolus centre height divided by the lateral-malleolus height; the
       * lateral centre is 1 by definition.
       */
      height: number;
      /**
       * Malleolus outward relief prominence, millimetres; the retained prior
       * treats this as a construction convention.
       */
      prominence: number;
      /** Malleolus relief-window radius, millimetres. */
      radius: number;
    };
    /** Medial-malleolus relief window, positioned above the lateral datum. */
    medial: {
      /**
       * Malleolus centre height divided by the lateral-malleolus height; the
       * lateral centre is 1 by definition.
       */
      height: number;
      /**
       * Malleolus outward relief prominence, millimetres; the retained prior
       * treats this as a construction convention.
       */
      prominence: number;
      /** Malleolus relief-window radius, millimetres. */
      radius: number;
    };
  };

  /** The expected object of {@link IPrior}. */
  export type IPriorExpected = {
    /** Foot length over stature, women and men (0.151, 0.154). */
    length: readonly [number, number];

    /** Foot breadth over foot length, women and men (0.377, 0.376). */
    breadth: readonly [number, number];

    /** Lateral malleolus height, mm: `[offset, per stature]`, women and men. */
    ankle: readonly [readonly [number, number], readonly [number, number]];
  };
}
