import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { rowsAutoMovieHumanNose } from "./rowsAutoMovieHumanNose";

/** Face-row addresses from shared physical features, including the nasal source courses. */
export function rowsAutoMovieHumanFace(props: {
  domain: AutoMovieHumanHeadDomain;
  head: IAutoMovieHumanIdentity.IHead;
  form: IAutoMovieHumanHeadForm;
  hairline: number;
  counts: { forehead: number; eyes: number; nose: number; mouth: number };
}): number[] {
  const { domain, head, form, hairline, counts }: typeof props = props;
  const layout: IAutoMovieHumanHeadForm.ILayout = form.layout;
  const pfl: number = head.features.palpebralFissureLength;
  const anchors: Array<[number, number]> = [
    [domain.frame.eye.y + layout.eyeOpening.above * pfl, counts.forehead],
    [domain.frame.eye.y - layout.eyeOpening.below * pfl, counts.eyes],
    [
      domain.profile.subnasale.y - layout.mouthOpening.top * head.faceHeight,
      counts.nose,
    ],
    [
      domain.frame.stomion.y - layout.mouthOpening.bottom * head.faceHeight,
      counts.mouth,
    ],
  ];
  const rows: number[] = [hairline];
  let previous: number = hairline;
  anchors.forEach(([y, count]: [number, number], region: number): void => {
    const target: number = domain.front(y);
    if (region === 2)
      rows.push(
        ...rowsAutoMovieHumanNose({
          domain,
          head,
          form: form.relief.nose,
          mouthTopY: y,
        }),
      );
    else
      for (let k: number = 1; k <= count; ++k)
        rows.push(previous + ((target - previous) * k) / count);
    previous = target;
  });
  return rows;
}
