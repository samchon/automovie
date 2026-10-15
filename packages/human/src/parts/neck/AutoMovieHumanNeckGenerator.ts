import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Neck placeholder: a round tube from the neck base ring to the neck top ring.
 *
 * The section is a circle of the measured neck circumference at the top and 15% wider at the base, a conventional flare. The chart runs `u` from the base to the top and `v` around from the anterior midline. The real neck generator replaces this one.
 *
 * Rings, in order: `neckBase`, `neckTop`.
 *
 * @author Samchon
 */
export class AutoMovieHumanNeckGenerator implements IAutoMovieHumanPartGenerator<"neck"> {
  public readonly part = "neck" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"neck">,
  ): IAutoMovieHumanCage {
    const radius: number =
      props.measurements.identity.body.neckCircumference / (2 * Math.PI);
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "neck",
      null,
    );
    const base: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "neckBase",
      side: null,
      part: "neck",
    });
    const top: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "neckTop",
      side: null,
      part: "neck",
    });
    const bottom: AutoMovieHumanCageBuilder.IStation = builder.open(
      base,
      (): number => radius * 1.15,
      0,
    );
    const upper: AutoMovieHumanCageBuilder.IStation = builder.open(
      top,
      (): number => radius,
      1,
    );
    const middle: AutoMovieHumanCageBuilder.IStation = builder.blend(
      bottom,
      upper,
      0.5,
    );
    builder.bridge(bottom, middle);
    builder.bridge(middle, upper);
    return builder.build();
  }
}
