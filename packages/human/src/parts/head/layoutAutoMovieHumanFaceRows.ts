import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { curveAutoMovieHumanNasolabial } from "./curveAutoMovieHumanNasolabial";
import { rowsAutoMovieHumanNose } from "./rowsAutoMovieHumanNose";

/**
 * Continue nasal stations into the independent cheek courses of the face.
 *
 * The nasal tip, alar level and subnasale define the central rows. Applying
 * their clustered heights to every facial column leaves a single broad patch
 * under the eye. Outside the nose, rows instead follow the existing cheek
 * course between the orbital and oral openings. Their transverse transition
 * uses the alar half-width and the shared nasolabial layout boundary, extending
 * at least to the measured commissure. Neither a row count nor a chart width
 * defines a feature's physical height. Both sides keep the same named axes.
 * The returned edge nodes also own the face-to-side boundary.
 */
export function layoutAutoMovieHumanFaceRows(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  head: IAutoMovieHumanIdentity.IHead;
  form: IAutoMovieHumanHeadForm;
  rows: number[];
  columns: number[];
  vault: AutoMovieHumanHeadNetwork.IPoint[];
  nasalStart: number;
  nasalCount: number;
}): AutoMovieHumanHeadNetwork.IPoint[][] {
  const { domain, network, head, form }: typeof props = props;
  const start: number = props.rows[props.nasalStart]!;
  const end: number = props.rows[props.nasalStart + props.nasalCount]!;
  const heights: number[] = rowsAutoMovieHumanNose.heights({
    domain,
    head,
    form: form.relief.nose,
    mouthTopY:
      domain.profile.subnasale.y -
      form.layout.mouthOpening.top * head.faceHeight,
  });
  if (heights.length !== props.nasalCount)
    throw new Error(
      "Nasal row family must retain every declared feature station",
    );
  const boundary: curveAutoMovieHumanNasolabial.ICurve =
    curveAutoMovieHumanNasolabial({
      head,
      stomionY: domain.frame.stomion.y,
      nose: { alarY: heights[1]! },
    });
  const core: number = head.features.noseWidth / 2;
  return props.rows.map(
    (u: number, row: number): AutoMovieHumanHeadNetwork.IPoint[] =>
      props.columns.map(
        (v: number, column: number): AutoMovieHumanHeadNetwork.IPoint => {
          if (row === 0) return props.vault[column]!;
          const index: number = row - props.nasalStart - 1;
          if (index < 0 || index >= props.nasalCount) return network.on(u, v);
          const share: number = (index + 1) / props.nasalCount;
          const cheek: number = start + (end - start) * share;
          const point: IAutoMovieVector3 = domain.point(cheek, v);
          const outside: number = Math.max(
            head.features.mouthWidth / 2,
            boundary.extent(point.y),
          );
          if (!(outside > core))
            throw new Error(
              "The nasolabial row transition must extend outside the nasal core",
            );
          if (Math.abs(point.x) >= outside) return network.on(cheek, v);
          const linear: number = Math.max(
            0,
            Math.min(1, (Math.abs(point.x) - core) / (outside - core)),
          );
          const blend: number = linear * linear * (3 - 2 * linear);
          const y: number =
            heights[index]! + (point.y - heights[index]!) * blend;
          const at: { u: number; v: number } = domain.onFace(point.x, y);
          return network.on(at.u, at.v);
        },
      ),
  );
}
