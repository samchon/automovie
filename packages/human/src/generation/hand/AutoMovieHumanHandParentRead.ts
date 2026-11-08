import {
  AutoMovieIllinois,
  AutoMovieLoftViewRead,
  AutoMovieViewAxis,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanHandAttachment } from "./AutoMovieHumanHandAttachment";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";

/** Original calibration-mm point or unit material direction. */
type Vec3 = V.Vec3;
/** The same actual parent-frame result used by the attachment owner. */
type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;
/** Four original support/fullness values in material order. */
type Quarters = [number, number, number, number];
/** Caller-owned whole parent definition, without a second geometry. */
type IParent = AutoMovieHumanHandAttachment.IParent;
/** Qualified original values/frame/jets, including explicit zero poles. */
type ISection = AutoMovieHumanHandAttachment.ISection;

/** Original parent-coordinate and native-section reads shared by hand attachments. */
export namespace AutoMovieHumanHandParentRead {
  /** Solve actual normal-plane roots and preserve whole scalar/frame jets or explicit coordinate absence. */
  export function locate(parent: IParent, point: Vec3): ISection | null {
    const roots: number[] = [];
    const residual: (station: number) => number = (station: number): number => {
      const frame: Frame = parent.part.axis.at(station);
      return V.dot(V.sub(point, frame.origin), AutoMovieViewAxis.normal(frame));
    };
    for (let index: number = 1; index < parent.stations.length; index++) {
      const before: IParent["stations"][number] = parent.stations[index - 1]!;
      const after: IParent["stations"][number] = parent.stations[index]!;
      const a: number = V.dot(V.sub(point, before.frame.origin), before.normal);
      const b: number = V.dot(V.sub(point, after.frame.origin), after.normal);
      if (a === 0) roots.push(before.station);
      if (b === 0) roots.push(after.station);
      if (a * b < 0) {
        const root: number | null = AutoMovieIllinois.root(
          residual,
          before.station,
          after.station,
          1e-9,
          100,
        );
        if (root === null || Math.abs(residual(root)) > 1e-7)
          throw new Error(
            "The actual hand-parent normal-plane root failed its residual",
          );
        roots.push(root);
      }
    }
    let best: ISection | null = null;
    let distance: number = Infinity;
    for (const station of roots) {
      const frame: Frame = parent.part.axis.at(station);
      const delta: Vec3 = V.sub(point, frame.origin);
      const squared: number = V.dot(delta, delta);
      if (squared >= distance) continue;
      const values: AutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(parent.source, station);
      if (typeof values === "string") throw new Error(values);
      let zero: boolean = false;
      if (!values.extents.every((extent: number): boolean => extent > 0)) {
        const pole: boolean =
          (station === parent.source.domain[0] &&
            (parent.part.pole === "bottom" || parent.part.pole === "both")) ||
          (station === parent.source.domain[1] &&
            (parent.part.pole === "top" || parent.part.pole === "both"));
        if (
          pole &&
          values.extents.every((extent: number): boolean => extent === 0)
        )
          zero = true;
        else
          throw new Error(
            `The actual ${parent.part.name} has a nonpositive non-pole section at ${station} mm: ${JSON.stringify(values.extents)}`,
          );
      }
      const local: [number, number] = [
        V.dot(delta, frame.u),
        V.dot(delta, frame.v),
      ];
      const angle: number = Math.atan2(local[1], local[0]);
      const phase: number = angle < 0 ? angle + 2 * Math.PI : angle;
      best = {
        kind: zero ? "pole" : "regular",
        station,
        frame,
        local,
        values,
        jets: AutoMovieLoftViewRead.jets(parent.source, station),
        axisJet: parent.part.axis.jet?.(station) ?? null,
        margin:
          (zero ? 0 : AutoMovieViewSection.radius(section(values), phase)[0]) -
          Math.hypot(...local),
      };
      distance = squared;
    }
    return best;
  }

  /** Native section admission retains all four parent quarter owners. */
  export function section(
    values: AutoMovieLoftViewRead.IValues,
  ): AutoMovieViewSection.ISection {
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents: values.extents as Quarters },
      values.shoulders as Quarters,
    );
    const fault: string | null = AutoMovieViewSection.fault(section);
    if (fault !== null) throw new Error(fault);
    return section;
  }
}
