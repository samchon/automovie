


/** The finding every curve rule reports. */
export namespace HumanCurveFinding {
  /** One group of points that break the same rule in the same place. */
  export interface IHumanCurveFinding {
    /** Person or parameter set. */
    person: string;

    /** Chain or join. */
    region: string;

    /** Rule broken. */
    rule: string;

    /** Layers and direction on the body. */
    where: string;

    /** Worst value found there. */
    value: number;

    /** The rule's limit. */
    limit: number;

    /** Points in the group. */
    count: number;

    /** The worst point, mm, to look at in the viewer. */
    point: number[];
  }
}
