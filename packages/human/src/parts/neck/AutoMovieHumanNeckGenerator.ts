import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
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
    const layout = (site: "neckBase" | "neckTop"): IAutoMovieHumanRingLayout =>
      layoutAutoMovieHumanRing({ skeleton, site, side: null, part: "neck" });
    const base: IAutoMovieHumanRingLayout = layout("neckBase");
    const top: IAutoMovieHumanRingLayout = layout("neckTop");
    const sections: sectionAutoMovieHumanNeck.IOutput = sectionAutoMovieHumanNeck({
      skeleton,
      body,
      head: props.measurements.identity.head,
      base,
      top,
    });
    const axis: IAutoMovieVector3 = sections.axis;
    const n: number = base.count;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder("neck", null);
    const span = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      AutoMovieHumanVector.distance(a, b);
    // one cubic Hermite per vertex line and segment, leaving the mid section along the neck bone
    const along = (k: number, segment: 0 | 1, t: number): IAutoMovieVector3 => {
      const b: IAutoMovieVector3 = sections.base[k]!;
      const m: IAutoMovieVector3 = sections.mid[k]!;
      const e: IAutoMovieVector3 = sections.top[k]!;
      const [p0, p1] = segment === 0 ? [b, m] : [m, e];
      const length: number = span(p0, p1);
      const t0: IAutoMovieVector3 =
        segment === 0 ? AutoMovieHumanVector.offset(m, [b, -1]) : AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [axis, length]);
      const t1: IAutoMovieVector3 =
        segment === 0 ? AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [axis, length]) : AutoMovieHumanVector.offset(e, [m, -1]);
      const h00: number = 2 * t ** 3 - 3 * t ** 2 + 1;
      const h10: number = t ** 3 - 2 * t ** 2 + t;
      const h01: number = -2 * t ** 3 + 3 * t ** 2;
      const h11: number = t ** 3 - t ** 2;
      return AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [p0, h00],
        [t0, h10],
        [p1, h01],
        [t1, h11],
      );
    };
    const stations: AutoMovieHumanCageBuilder.IStation[] = [];
    stations.push(builder.open(base, (d: IAutoMovieVector3): number => sections.radius(base, d), 0));
    stations.push(builder.station(Array.from({ length: n }, (_: unknown, k: number) => along(k, 0, 0.5)), 0.2));
    stations.push(builder.station(sections.mid, 0.4));
    stations.push(builder.station(Array.from({ length: n }, (_: unknown, k: number) => along(k, 1, 1 / 3)), 0.6));
    stations.push(builder.station(Array.from({ length: n }, (_: unknown, k: number) => along(k, 1, 2 / 3)), 0.8));
    stations.push(builder.open(top, (d: IAutoMovieVector3): number => sections.radius(top, d), 1));
    for (let i: number = 0; i + 1 < stations.length; ++i) builder.bridge(stations[i]!, stations[i + 1]!);
    return builder.build();
  }
}
