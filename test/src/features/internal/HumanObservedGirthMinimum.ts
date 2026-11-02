import { HumanAnatomy as A } from "./HumanAnatomy";

/** Independent minimum of final skin under one explicitly declared section normal. */
export namespace HumanObservedGirthMinimum {
  /** Measured skin section and its component-pick point. */
  export interface IReading {
    /** Taut section perimeter, mm. */
    girth: number;
    /** Interior address of the section, mm. */
    origin: A.V3;
    /** Final triangle-section positions. */
    points: A.V3[];
  }

  /**
   * Scan a complete owned region at no more than 2 mm pitch, including its
   * ends and the exact section under comparison. All cuts use the same normal
   * so differing obliquities cannot masquerade as a minimum-girth difference.
   * The domain and normal are modelling premises, not clinical registration.
   */
  export function read(skin: A.ISkin, from: A.V3, to: A.V3, normal: A.V3, exact: IReading, region?: Uint32Array): IReading {
    const missing: IReading = { girth: NaN, origin: [NaN, NaN, NaN], points: [] };
    const length: number = A.dist(from, to);
    const count: number = Math.ceil(length / 2);
    if (!(count > 0) || !Number.isFinite(count)) return missing;
    const direction: A.V3 = A.unit(normal);
    if (!direction.every(Number.isFinite)) return missing;
    const span: number = A.dot(A.sub(to, from), direction);
    const station: number = A.dot(A.sub(exact.origin, from), direction);
    const eligible: boolean = station >= Math.min(0, span) && station <= Math.max(0, span);
    let best: IReading = eligible ? exact : missing;
    const cut: (origin: A.V3) => A.ICut | null = A.parallel(skin, direction, region);
    for (let k: number = 0; k <= count; k++) {
      const origin: A.V3 = A.lerp(from, to, k / count);
      const section: A.ICut | null = cut(origin);
      if (section !== null && (!Number.isFinite(best.girth) || section.girth < best.girth))
        best = { girth: section.girth, origin, points: section.points };
    }
    return best;
  }
}
