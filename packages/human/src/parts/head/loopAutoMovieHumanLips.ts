import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { curveAutoMovieHumanLips } from "../../junction/curveAutoMovieHumanLips";
import { frameAutoMovieHumanHead } from "../../junction/frameAutoMovieHumanHead";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { curveAutoMovieHumanPhiltrum } from "./curveAutoMovieHumanPhiltrum";

/**
 * Loft the mouth from spatial curve families, from its shared outer rim to vermilion, meeting course and pocket.
 *
 * The two measured vermilion chords retain their three-dimensional length: each sagittal direction supplies its forward component and the vertical component follows by Pythagoras. Both borders stand in front of the shared meeting arch, instead of receding along an independently evaluated head field. Inner loops consume the same transverse parameter and arch before their named backward offsets, so narrowing a loop does not sample another facial relief height. The orbital-style surface re-projection is deliberately absent from this spatial oral loft.
 *
 * The field between the two medial muscular bands is the philtrum (Gray 1918, https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/). Its same physical column definition is added once over the outer-to-border loft, subtracting the part already present at its endpoints. Source construction is sampled from these same spatial formulas, never projected onto a discarded base face inside the mouth opening.
 */
export function loopAutoMovieHumanLips(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  head: IAutoMovieHumanIdentity.IHead;
  form: IAutoMovieHumanHeadForm.ILips;
  relief: IAutoMovieHumanHeadForm.IRelief["lips"];
  rim: AutoMovieHumanHeadNetwork.IPoint[];
}): IAutoMovieHumanCage.IRelief[] {
  const { domain, network, head, form, rim }: typeof props = props;
  const frame: AutoMovieHumanHeadDomain["frame"] = domain.frame;
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const half: number = rim.length / 2;
  const lips: curveAutoMovieHumanLips.ICurve = curveAutoMovieHumanLips({
    head, stomion: frame.stomion.y, form,
  });
  const philtrum: curveAutoMovieHumanPhiltrum.ICurve = curveAutoMovieHumanPhiltrum({
    head, lips, span: form.philtrum, subnasaleY: domain.profile.subnasale.y,
  });
  const centreAt: { u: number; v: number } = domain.onFace(0, frame.stomion.y);
  const frontZ: number = domain.point(centreAt.u, centreAt.v).z + props.relief.roll * head.faceHeight;
  const outer: IAutoMovieVector3[] = rim.map((p: AutoMovieHumanHeadNetwork.IPoint): IAutoMovieVector3 =>
    network.point(p));
  // The same physical meridians pass through both cupid crests, the midline
  // and the two commissures. Index allocation changes with resolution;
  // anatomical positions remain those of the shared dimensioned curve.
  const middle: number = (half - 1) / 2;
  const crestAngle: number = Math.acos(form.philtrum);
  const crest: number = Math.max(1, Math.min(middle - 1, Math.round((half - 1) * crestAngle / Math.PI)));
  const angle: (index: number) => number = (index: number): number => {
    const m: number = Math.min(index, half - 1 - index);
    const t: number = m <= crest ? crestAngle * m / crest
      : crestAngle + (Math.PI / 2 - crestAngle) * (m - crest) / (middle - crest);
    return index <= middle ? t : Math.PI - t;
  };
  const border: IAutoMovieVector3[] = rim.map((_: AutoMovieHumanHeadNetwork.IPoint, k: number): IAutoMovieVector3 => {
    const upper: boolean = k < half;
    const m: number = upper ? k : k - half;
    const x: number = (upper ? 1 : -1) * lips.halfWidth * Math.cos(angle(m));
    return V.of(x, lips.border(x, upper), lips.arch(x, frontZ - form.meeting.back) + lips.projection(x, upper));
  });
  const along: (points: IAutoMovieVector3[], index: number) => IAutoMovieVector3 = (
    points: IAutoMovieVector3[], index: number,
  ): IAutoMovieVector3 => {
    const wrapped: number = ((index % points.length) + points.length) % points.length;
    const k: number = Math.floor(wrapped);
    const t: number = wrapped - k;
    const a: IAutoMovieVector3 = points[k]!;
    const b: IAutoMovieVector3 = points[(k + 1) % points.length]!;
    return V.of(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
  };
  const between: (index: number, share: number) => IAutoMovieVector3 = (
    index: number, share: number,
  ): IAutoMovieVector3 => {
    const a: IAutoMovieVector3 = along(outer, index);
    const b: IAutoMovieVector3 = along(border, index);
    const p: IAutoMovieVector3 = V.of(
      a.x + (b.x - a.x) * share, a.y + (b.y - a.y) * share, a.z + (b.z - a.z) * share,
    );
    // The endpoint loft already carries the interpolated endpoint fields.
    // Subtract that contribution before adding the common physical field
    // at this new XY, so the philtrum is present once in head millimetres.
    return V.of(p.x, p.y, p.z + philtrum.displacement(p.x, p.y) -
      (1 - share) * philtrum.displacement(a.x, a.y) - share * philtrum.displacement(b.x, b.y));
  };
  const free: (name: string, p: IAutoMovieVector3) => AutoMovieHumanHeadNetwork.IPoint = (
    name: string, p: IAutoMovieVector3,
  ): AutoMovieHumanHeadNetwork.IPoint =>
    network.free(name, domain.toModel(p), domain.onFace(p.x, p.y));
  const vermilion: AutoMovieHumanHeadNetwork.IPoint[] = border.map((p: IAutoMovieVector3, k: number): AutoMovieHumanHeadNetwork.IPoint => free(`lips.border.${k}`, p));
  const orbital: IAutoMovieVector3[] = rim.map((_: AutoMovieHumanHeadNetwork.IPoint, k: number): IAutoMovieVector3 => between(k, form.orbicularis));
  const orbicularis: AutoMovieHumanHeadNetwork.IPoint[] = orbital.map((p: IAutoMovieVector3, k: number): AutoMovieHumanHeadNetwork.IPoint => free(`lips.orbicularis.${k}`, p));
  const inside: (back: number, open: number, narrow: number) => IAutoMovieVector3[] = (
    back: number, open: number, narrow: number,
  ): IAutoMovieVector3[] => border.map((p: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
    V.of(narrow * p.x, frame.stomion.y + (k < half ? open : -open), lips.arch(p.x, frontZ) - back));
  const meetingPoints: IAutoMovieVector3[] = inside(form.meeting.back, form.meeting.open, form.meeting.narrow);
  const pocketPoints: IAutoMovieVector3[] = inside(form.pocket.back, form.pocket.open, form.pocket.narrow);
  const meeting: AutoMovieHumanHeadNetwork.IPoint[] = meetingPoints.map((p: IAutoMovieVector3, k: number): AutoMovieHumanHeadNetwork.IPoint => free(`lips.meeting.${k}`, p));
  const pocket: AutoMovieHumanHeadNetwork.IPoint[] = pocketPoints.map((p: IAutoMovieVector3, k: number): AutoMovieHumanHeadNetwork.IPoint => free(`lips.pocket.${k}`, p));
  const forward: boolean = network.bands([rim, orbicularis, vermilion, meeting, pocket], "mouth");
  for (let k: number = 0; k + 1 < half; ++k) {
    const q: [AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint] = [
      pocket[k]!, pocket[k + 1]!, pocket[half + (half - 2 - k)]!, pocket[half + (half - 1 - k)]!,
    ];
    network.quad(forward ? q : [q[0], q[3], q[2], q[1]], "mouth", false);
  }
  const guide: (name: string, closed: boolean, points: IAutoMovieVector3[]) => IAutoMovieHumanCage.IRelief = (
    name: string, closed: boolean, points: IAutoMovieVector3[],
  ): IAutoMovieHumanCage.IRelief => ({
    name, closed, points: points.map((p: IAutoMovieVector3): IAutoMovieVector3 => frameAutoMovieHumanHead.toModel(frame, p)),
  });
  const columns: IAutoMovieHumanCage.IRelief[] = [-1, 0, 1].map((side: number): IAutoMovieHumanCage.IRelief => {
    const x: number = side * form.philtrum * lips.halfWidth;
    const source: (share: number) => IAutoMovieVector3 = (share: number): IAutoMovieVector3 => {
      let lo: number = 0;
      let hi: number = half - 1;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (between(mid, share).x > x) lo = mid;
        else hi = mid;
      }
      return between((lo + hi) / 2, share);
    };
    const edge: IAutoMovieVector3 = source(0);
    const points: IAutoMovieVector3[] = Array.from({ length: 9 }, (_: unknown, k: number): IAutoMovieVector3 => {
      const y: number = domain.profile.subnasale.y + (edge.y - domain.profile.subnasale.y) * k / 8;
      const at: { u: number; v: number } = domain.onFace(x, y);
      return domain.point(at.u, at.v);
    });
    for (let k: number = 1; k <= 32; ++k) points.push(source(k / 32));
    return guide(side === 0 ? "philtrum.groove" : `philtrum.column.${side > 0 ? "left" : "right"}`, false, points);
  });
  return [
    guide("lips.orbicularis", true, orbital),
    guide("lips.upper.border", false, border.slice(0, half)),
    guide("lips.lower.border", false, border.slice(half)),
    guide("lips.meeting", true, meetingPoints),
    ...columns,
  ];
}
