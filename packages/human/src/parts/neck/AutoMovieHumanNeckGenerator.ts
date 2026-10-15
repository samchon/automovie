import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { measureAutoMovieHumanNeckGirth } from "./measureAutoMovieHumanNeckGirth";
import { sectionAutoMovieHumanNeck } from "./sectionAutoMovieHumanNeck";

/**
 * Generates the neck: a tube of twelve vertex lines from the neck base ring on the trunk to the neck top ring under the jaw and the skull.
 *
 * Three sections shape it. The base ring lies in the oblique plane from the jugular notch to cervicale. The mid section, perpendicular to the neck bone where the neck circumference is measured just below the thyroid cartilage, has exactly that circumference, with the laryngeal prominence in front and the sternocleidomastoids at its anterolateral corners. The top ring lies in the mandibular plane: the submental surface under the chin and the jaw's lower border in front, the nape under the occiput behind. Each vertex line runs through its three section points on a cubic Hermite curve that leaves the mid section along the neck bone, so the throat rises upright from the notch and turns forward under the chin into the submental surface, the cervicomental angle, while the nape rises under the occiput ("from the sloping platform of the shoulders the neck rises, a cylindrical column ... canopied in front by the chin ... somewhat flat and overhung by the base of the skull", Bridgman 1920, Constructive Anatomy, p. 104).
 *
 * Stations, from the base: the base ring, halfway to the mid section, the mid section, a third and two thirds of the way to the top, and the top ring. The chart runs `u` from 0 at the base to 1 at the top and `v` counterclockwise about the neck seen from above, from the anterior midline. Rings, in order: `neckBase`, `neckTop`.
 *
 * @author Samchon
 */
/** Rounds of widening the mid section to the measured girth; each leaves under a tenth of the previous error. */
const GIRTH_FITS: number = 3;

export class AutoMovieHumanNeckGenerator implements IAutoMovieHumanPartGenerator<"neck"> {
  public readonly part = "neck" as const;

  /**
   * Generate the neck's cage for one person.
   *
   * @param props Measurements and skeleton; the side is null
   * @returns The cage with its two rings
   */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"neck">): IAutoMovieHumanCage {
    const skeleton: IAutoMovieHumanSkeleton = props.skeleton;
    const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
    const shape = (site: "neckBase" | "neckTop"): IAutoMovieHumanRingShape =>
      shapeAutoMovieHumanRing({ skeleton, measurements: props.measurements, site, side: null, part: "neck" });
    const base: IAutoMovieHumanRingShape = shape("neckBase");
    const top: IAutoMovieHumanRingShape = shape("neckTop");
    const sections: sectionAutoMovieHumanNeck.IOutput = sectionAutoMovieHumanNeck({
      skeleton,
      body,
      base,
      top,
    });
    const n: number = base.count;
    // the limit surface lies inside its cage, so the mid section is widened until the subdivided neck has the measured girth
    let scale: number = 1;
    let cage: IAutoMovieHumanCage = this.build(base, top, sections, scale, n);
    for (let i: number = 0; i < GIRTH_FITS; ++i) {
      const girth: number = measureAutoMovieHumanNeckGirth(cage, sections.centre, sections.axis);
      scale *= body.neckCircumference / girth;
      cage = this.build(base, top, sections, scale, n);
    }
    return cage;
  }

  /** Assemble the cage with the mid section scaled about the neck bone. */
  private build(
    base: IAutoMovieHumanRingShape,
    top: IAutoMovieHumanRingShape,
    sections: sectionAutoMovieHumanNeck.IOutput,
    scale: number,
    n: number,
  ): IAutoMovieHumanCage {
    const axis: IAutoMovieVector3 = sections.axis;
    const mid: IAutoMovieVector3[] = sections.mid.map((p: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieHumanVector.offset(sections.centre, [AutoMovieHumanVector.offset(p, [sections.centre, -1]), scale]),
    );
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder("neck", null);
    // one cubic Hermite per vertex line and segment, leaving the mid section along the neck bone
    const along = (k: number, segment: 0 | 1, t: number): IAutoMovieVector3 => {
      const b: IAutoMovieVector3 = sections.base[k]!;
      const m: IAutoMovieVector3 = mid[k]!;
      const e: IAutoMovieVector3 = sections.top[k]!;
      const [p0, p1] = segment === 0 ? [b, m] : [m, e];
      const length: number = AutoMovieHumanVector.distance(p0, p1);
      const upright: IAutoMovieVector3 = AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [axis, length]);
      const t0: IAutoMovieVector3 = segment === 0 ? AutoMovieHumanVector.offset(m, [b, -1]) : upright;
      const t1: IAutoMovieVector3 = segment === 0 ? upright : AutoMovieHumanVector.offset(e, [m, -1]);
      return AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [p0, 2 * t ** 3 - 3 * t ** 2 + 1],
        [t0, t ** 3 - 2 * t ** 2 + t],
        [p1, -2 * t ** 3 + 3 * t ** 2],
        [t1, t ** 3 - t ** 2],
      );
    };
    const line = (segment: 0 | 1, t: number): IAutoMovieVector3[] =>
      Array.from({ length: n }, (_: unknown, k: number): IAutoMovieVector3 => along(k, segment, t));
    const stations: AutoMovieHumanCageBuilder.IStation[] = [
      builder.place(base, 0),
      builder.station(line(0, 0.5), 0.2),
      builder.station(mid, 0.4),
      builder.station(line(1, 1 / 3), 0.6),
      builder.station(line(1, 2 / 3), 0.8),
      builder.place(top, 1),
    ];
    for (let i: number = 0; i + 1 < stations.length; ++i) builder.bridge(stations[i]!, stations[i + 1]!);
    return builder.build();
  }
}
