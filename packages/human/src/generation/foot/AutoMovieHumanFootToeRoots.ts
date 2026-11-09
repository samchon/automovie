/**
 * Where the toes stand on the forefoot and where they leave it, shared by the
 * toes, their folds and the leg walk's forefoot closure, in the foot frame
 * (origin IM, X anterior, Y up, Z to the subject's right), calibration mm.
 *
 * Heads: head I at the ball-of-foot length from the heel (ANSUR II); heads II
 * to V behind it by Maestro's metatarsal cascade (the foot prior's means: the
 * second head level with the first, then 3.3, 6.5 and 12 mm behind the head
 * before on a 258.75 mm foot), scaled to the foot length.
 *
 * Across: the foot breadth is the skin breadth over head I's medial and head
 * V's lateral eminences. The toe roots (the proximal phalanges' bases) tile
 * the breadth inside both eminences, the breadth less twice {@link EMINENCE},
 * in proportion to their metatarsals' mid-shaft widths (Patil et al. 2017, J
 * Clin Diagn Res 11(9):AC05-AC09: I-V 13.7, 7.6, 6.8, 7.1, 8.1 mm men; 11.7,
 * 6.9, 5.9, 6.2, 7.1 mm women, a declared proxy while the person's toe
 * breadths are input gaps), so the outer toes' sides stand inside the
 * forefoot's skin and cross its surface instead of grazing it. The foot's
 * long axis (the foot frame's X through the heel and IM) passes through the
 * second toe, the traditional foot axis from the pternion through the second
 * toe (ISO/TS 19408 names it among its foot-axis methods): the tiling stands
 * with toe II's root centre on Z = 0, and the breadth splits about that axis
 * as the tiling falls ({@link edges}).
 *
 * Lengths: Patil et al. 2017's phalanx lengths, scaled so the hallux reaches
 * the foot length from head I (the foot length read as the hallux's; a longer
 * second toe is an input gap). Each toe leaves the forefoot at its web
 * station, half its proximal phalanx past its head (Gray 1918: the web
 * reaches the middle of the proximal phalanx), so the exits follow the
 * oblique metatarsal cascade.
 *
 * Folds: each toe's web fold rolls with {@link FOLD} (debt: no published toe
 * web skin-fold radius was read) and is capped at half the gap to its nearest
 * neighbour's root, as the legacy lane caps digits and toes. The forefoot's
 * closing pole stands distal of the most distal web station by the widest
 * cap plus the fold ({@link pole}), on toe II's axis, inside that toe.
 */
export namespace AutoMovieHumanFootToeRoots {
  /** Maestro's cascade: heads I to V, mm behind head I on a foot of {@link CASCADE_FOOT} mm. */
  export const CASCADE: readonly number[] = [0, 0, 3.3, 3.3 + 6.5, 3.3 + 6.5 + 12];

  /** Foot length Maestro's millimetres are read at, mm. */
  export const CASCADE_FOOT: number = 258.75;

  /** Patil et al. 2017 metatarsal mid-shaft widths I-V, mm: the toe roots' breadth shares. */
  export const SHAFTS: { female: readonly number[]; male: readonly number[] } = {
    female: [11.7, 6.9, 5.9, 6.2, 7.1],
    male: [13.7, 7.6, 6.8, 7.1, 8.1],
  };

  /** Patil et al. 2017 phalanx lengths, mm: per toe proximal, middle, distal (the hallux has two). */
  export const PHALANGES: { female: readonly (readonly number[])[]; male: readonly (readonly number[])[] } = {
    female: [[25.8, 20.8], [24.2, 9.3, 6.9], [22.6, 7.4, 6.3], [20.9, 5.8, 5.3], [19.3, 5.1, 4.4]],
    male: [[28.0, 22.5], [26.3, 11.1, 6.9], [24.6, 9.7, 6.3], [22.8, 7.6, 5.6], [21.3, 5.8, 5.2]],
  };

  /**
   * Debt: head I's medial eminence beyond the toe's root, mm: the medial
   * eminence's projection measured on radiographs by Armanasco et al. 2014
   * (JASMI), 3.9 mm dorsoplantar and 4.4 mm medial oblique, here their mean,
   * on a sample mixing rectus and hallux valgus feet. Head V's lateral
   * eminence takes the same value (no source read).
   */
  export const EMINENCE: number = 4.15;

  /** Debt: the toe web fold's rolling radius, mm. */
  export const FOLD: number = 2;

  /**
   * Debt: the plantar soft tissue under the metatarsal heads, mm: the total
   * non-weightbearing soft tissue thickness under the first metatarsal head,
   * 8.5 +- 1.5 mm in the controls of Mickle et al. 2011 (J Orthop Res, doi
   * 10.1002/jor.21328, ultrasound, 312 adults over 60; read at abstract
   * level). Each toe's root circle rests on it: its head centre stands this
   * plus the root's half-breadth over the floor ({@link height}).
   */
  export const PLANTAR: number = 8.5;

  /** A toe's head centre height over the floor: the plantar soft tissue plus its root's half-breadth, mm. */
  export function height(root: IRoot): number {
    return PLANTAR + root.breadth / 2;
  }

  /** What the roots read, calibration mm. */
  export interface IInput {
    /** Sex control; positive selects the women's widths and phalanges. */
    sex: number;

    /** Foot length. */
    footLength: number;

    /** Foot breadth across the metatarsal heads' eminences. */
    footBreadth: number;

    /** Ball-of-foot length (heel to head I). */
    ballLength: number;

    /** The heel's back line's X in the foot frame. */
    heel: number;

    /** +1 when medial is +Z (left foot), -1 otherwise. */
    medial: 1 | -1;
  }

  /** One toe's root and exit. */
  export interface IRoot {
    /** Head X in the foot frame. */
    x: number;

    /** Root centre Z in the foot frame (toe II's is 0, the long axis). */
    z: number;

    /** Root breadth. */
    breadth: number;

    /** Half the gap to the nearest neighbouring root (X and Z), the web fold's cap. */
    cap: number;

    /** Scaled phalanx lengths, proximal first. */
    bones: number[];

    /** Head-to-apex length along the toe. */
    length: number;

    /** The web station's X: the head plus half the proximal phalanx (Gray 1918), where the toe leaves the forefoot. */
    exit: number;
  }

  /** The five roots, hallux first. */
  export function roots(input: IInput): IRoot[] {
    const { tiled, axis }: { tiled: { breadth: number; across: number }[]; axis: number } = tile(input);
    const bones: readonly (readonly number[])[] = input.sex > 0 ? PHALANGES.female : PHALANGES.male;
    const scale: number = (input.footLength - input.ballLength) / sum(bones[0]!);
    const placed: Omit<IRoot, "cap">[] = tiled.map(({ breadth, across }: { breadth: number; across: number }, k: number): Omit<IRoot, "cap"> => {
      const lengths: number[] = bones[k]!.map((b: number): number => b * scale);
      const x: number = input.heel + input.ballLength - (CASCADE[k]! * input.footLength) / CASCADE_FOOT;
      return { x, z: input.medial * (across - axis), breadth, bones: lengths, length: sum(lengths), exit: x + lengths[0]! / 2 };
    });
    return placed.map((p: Omit<IRoot, "cap">, k: number): IRoot => ({
      ...p,
      cap: Math.min(...placed.filter((_: unknown, j: number): boolean => j !== k).map((o: { x: number; z: number }): number => Math.hypot(o.x - p.x, o.z - p.z))) / 2,
    }));
  }

  /** The skin breadth's ends across the foot frame (Z), mm: head I's medial and head V's lateral eminences about the long axis through the second toe. */
  export function edges(input: IInput): { medial: number; lateral: number } {
    const { axis }: { axis: number } = tile(input);
    return { medial: input.medial * (input.footBreadth / 2 - axis), lateral: -input.medial * (input.footBreadth / 2 + axis) };
  }

  /** How far distal of the most distal web station the forefoot's closing pole stands: the widest web cap plus the fold, mm. */
  export function poleBeyond(list: readonly IRoot[]): number {
    return Math.max(...list.map((r: IRoot): number => r.cap)) + FOLD;
  }

  /** The closing pole's X in the foot frame: the most distal web station plus {@link poleBeyond}. */
  export function pole(list: readonly IRoot[]): number {
    return Math.max(...list.map((r: IRoot): number => r.exit)) + poleBeyond(list);
  }

  /** The roots' breadths and medial-positive centres across the breadth inside the eminences, and toe II's centre (the long axis). */
  function tile(input: IInput): { tiled: { breadth: number; across: number }[]; axis: number } {
    const shafts: readonly number[] = input.sex > 0 ? SHAFTS.female : SHAFTS.male;
    const total: number = sum(shafts);
    const inner: number = input.footBreadth - 2 * EMINENCE;
    let used: number = 0;
    const tiled: { breadth: number; across: number }[] = shafts.map((w: number): { breadth: number; across: number } => {
      const breadth: number = (inner * w) / total;
      const across: number = inner / 2 - used - breadth / 2;
      used += breadth;
      return { breadth, across };
    });
    return { tiled, axis: tiled[1]!.across };
  }
}

function sum(list: readonly number[]): number {
  return list.reduce((a: number, b: number): number => a + b, 0);
}
