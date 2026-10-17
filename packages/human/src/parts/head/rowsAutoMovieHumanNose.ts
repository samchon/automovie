import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { curveAutoMovieHumanNose } from "./curveAutoMovieHumanNose";

/** Four nasal patch rows consuming the same tip, alar and base source as the surface. */
export function rowsAutoMovieHumanNose(props: {
  domain: AutoMovieHumanHeadDomain;
  head: IAutoMovieHumanIdentity.IHead;
  form: IAutoMovieHumanHeadForm.IRelief["nose"];
  mouthTopY: number;
}): number[] {
  return rowsAutoMovieHumanNose
    .heights(props)
    .map((y: number): number => props.domain.front(y));
}

/** Physical nasal levels shared by the central nose and its transverse row family. */
export namespace rowsAutoMovieHumanNose {
  /** Source heights, before their address on any tilted sweep section. */
  export function heights(props: {
    domain: AutoMovieHumanHeadDomain;
    head: IAutoMovieHumanIdentity.IHead;
    form: IAutoMovieHumanHeadForm.IRelief["nose"];
    mouthTopY: number;
  }): number[] {
    const { domain, head, form, mouthTopY }: typeof props = props;
    const nose: curveAutoMovieHumanNose.ICurve = curveAutoMovieHumanNose({
      frame: domain.frame,
      profile: domain.profile,
      head,
      form,
    });
    const levels: number[] = [
      nose.tip.y,
      nose.alarY,
      domain.profile.subnasale.y,
      mouthTopY,
    ];
    if (
      levels.some(
        (y: number, i: number): boolean => i > 0 && y >= levels[i - 1]!,
      )
    )
      throw new Error(
        "Nasal source courses must descend from tip to mouth rim",
      );
    return levels;
  }
}
