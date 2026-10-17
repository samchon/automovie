import { AutoMoviePchip64 } from "@automovie/engine";

/**
 * Resolve anterior and posterior skin supports before reconstructing a centre.
 * A patellar projection constrains its own course, not the entire proximal shin.
 * The sagittal centre travels between calf, patella and the actual thigh cut;
 * intervening girth courses do not introduce extra fore-aft placement anchors.
 * The calf-to-ankle interval retains the existing physical boundary law. Medial
 * and lateral calf fullness are staggered by a conventional half patella height;
 * Gray (1918) establishes the order, but supplies no quantitative head offset.
 * This is an editable authoring prior, not a measured muscle-volume model.
 * https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/
 *
 * @author Samchon
 */
export class AutoMovieLegSupportProfile64 {
  /** Actual anterior support field above the maximum-calf course, mm. */
  private readonly anterior: AutoMoviePchip64;

  /** Actual posterior support field above that same course, mm. */
  private readonly posterior: AutoMoviePchip64;

  /** Common lateral shift field; translating a section leaves its girth intact. */
  private readonly lateral: AutoMoviePchip64;

  /**
   * Build one continuous support chart from named physical dimensions.
   * Scalar base fields remain authoritative below maximum calf. Additional
   * courses resolve shape changes rather than drawing separate decorative guides.
   */
  public constructor(
    private readonly input: {
      /** Existing physical breadth field, mm, in an increasing proximal chart. */
      breadth: AutoMoviePchip64;

      /** Existing physical depth field, mm. */
      depth: AutoMoviePchip64;

      /** Existing sagittal centre field, mm relative to the bone axis. */
      center: AutoMoviePchip64;

      /** Descending emitted course heights, mm relative to the current hip. */
      heights: readonly number[];

      /** Actual upstream mid-thigh cut height, mm; its complete operator stays authoritative. */
      proximal: number;

      /** Sagittal centre of that actual cut in the same bone-local gauge, mm. */
      proximalCenter: number;

      /** Actual cut-centre derivative per proximal physical millimetre. */
      proximalCenterJ: number;

      /** Maximum-calf course in that chart; conventional when not independently supplied. */
      calf: number;

      /** Actual skeleton patella-centre height and its conventional anterior reach, mm. */
      patella: number;

      /** Suprapatellar proxy plane, mm. */
      supra: number;

      /** Proximal public-girth proxy, mm; not an observed gluteal fold. */
      furrow: number;

      /** Proximal course below tibiale, mm. */
      below: number;

      /** Supplied or conventional patella height, mm. */
      patellaHeight: number;

      /** Skeleton anterior patella reach from the joint axis, mm. */
      patellaReach: number;
    },
  ) {
    const base: (y: number, front: boolean, derivative?: boolean) => number = (
      y: number,
      front: boolean,
      derivative: boolean = false,
    ): number =>
      input.center.at(y, derivative) +
      (front ? 0.5 : -0.5) * input.depth.at(y, derivative);
    if (
      !(
        input.furrow > input.proximal &&
        input.proximal > input.supra &&
        input.supra > input.patella &&
        input.patella > input.below &&
        input.below > input.calf
      )
    )
      throw new Error("Ordered leg support regions required");
    const centerY: number[] = [
      input.calf,
      input.patella,
      input.proximal,
      input.furrow,
    ];
    const centers: number[] = [
      input.center.at(input.calf),
      input.patellaReach - input.depth.at(input.patella) / 2,
      input.proximalCenter,
      input.center.at(input.furrow),
    ];
    const centerJ: number[] = AutoMoviePchip64.slopes(centerY, centers);
    centerJ[0] = input.center.at(input.calf, true);
    centerJ[2] = input.proximalCenterJ;
    const sagittal: AutoMoviePchip64 = new AutoMoviePchip64(
      centerY,
      centers,
      centerJ,
    );
    const supportY: number[] = [
      input.calf,
      input.below,
      input.patella,
      input.supra,
      input.proximal,
      input.furrow,
    ];
    // The union contains every depth and centre knot in this interval. Values
    // and complete jets therefore retain the independent depth between courses,
    // rather than using a posterior PCHIP to undo an anterior-only projection.
    const support: (front: boolean) => AutoMoviePchip64 = (
      front: boolean,
    ): AutoMoviePchip64 => {
      const sign: number = front ? 0.5 : -0.5;
      const values: number[] = supportY.map(
        (y: number): number => sagittal.at(y) + sign * input.depth.at(y),
      );
      const jets: number[] = supportY.map(
        (y: number): number =>
          sagittal.at(y, true) + sign * input.depth.at(y, true),
      );
      values[0] = base(input.calf, front);
      jets[0] = base(input.calf, front, true);
      return new AutoMoviePchip64(supportY, values, jets);
    };
    this.anterior = support(true);
    this.posterior = support(false);
    const ys: number[] = [...input.heights].reverse().concat(input.proximal);
    const shift: number = input.patellaHeight / 2;
    const distal: number = ys[0]!;
    const proximal: number = ys.at(-1)!;
    const bump: (t: number) => number = (t: number): number =>
      t <= 0 || t >= 1 ? 0 : 16 * t * t * (1 - t) * (1 - t);
    // Half the difference in radii is redistributed to opposite sides. This
    // keeps total breadth/girth while exposing the high lateral / low medial
    // order described by Gray and Bridgman. The split is conventional, not a
    // population-fitted muscle-volume fraction or a reference contour trace.
    const thighShift: number =
      (input.breadth.at((input.proximal + input.supra) / 2) -
        input.breadth.at(input.supra)) /
      4;
    const drift: number[] = ys.map((y: number): number => {
      if (y > input.supra) {
        const t: number = (y - input.supra) / (input.proximal - input.supra);
        return thighShift * (bump(2 * t - 1) - bump(2 * t));
      }
      if (y <= distal || y >= input.below) return 0;
      const t: number = (y - distal) / (input.below - distal);
      // The shifted breadth difference puts the medial maximum lower. Its
      // compact envelope and endpoint jets vanish at both bounding courses.
      const envelope: number = bump(t);
      return (
        (envelope *
          (input.breadth.at(y - shift) - input.breadth.at(y + shift))) /
        4
      );
    });
    const driftJ: number[] = AutoMoviePchip64.slopes(ys, drift);
    driftJ[0] = 0;
    driftJ[driftJ.length - 1] = 0;
    this.lateral = new AutoMoviePchip64(ys, drift, driftJ);
    if (
      !(
        proximal > input.supra &&
        input.below > input.calf &&
        distal < input.calf
      )
    )
      throw new Error("Ordered leg support regions required");
  }

  /** Evaluate a support-derived centre/depth and their physical first derivatives. */
  public at(
    y: number,
    derivative: boolean = false,
  ): {
    /** Lateral section-centre displacement, mm, or its physical derivative. */
    centerX: number;

    /** Mean of anterior/posterior supports, mm, or its physical derivative. */
    centerZ: number;

    /** Anterior minus posterior support, mm, or its physical derivative. */
    depth: number;
  } {
    if (y <= this.input.calf)
      return {
        centerX: this.lateral.at(y, derivative),
        centerZ: this.input.center.at(y, derivative),
        depth: this.input.depth.at(y, derivative),
      };
    const a: number = this.anterior.at(y, derivative);
    const p: number = this.posterior.at(y, derivative);
    return {
      centerX: this.lateral.at(y, derivative),
      centerZ: (a + p) / 2,
      depth: a - p,
    };
  }
}
