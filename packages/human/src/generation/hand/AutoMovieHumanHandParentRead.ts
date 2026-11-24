import {
  AutoMovieConicFieldJet,
  AutoMovieIllinois,
  AutoMovieLoftViewRead,
  AutoMovieViewAxis,
  AutoMovieViewConic,
  AutoMovieViewSectionConic,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHandAttachment,
  IAutoMovieHumanHandParent,
  IAutoMovieLoftViewRead,
  IAutoMovieViewConic,
  IAutoMovieViewPart,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";

/** The same actual parent-frame result used by the attachment owner. */
type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;
/** Four original support/fullness values in material order. */
type Quarters = [number, number, number, number];

/** The geometry required for searching, before any physical derivative read. */
type Sample = Omit<IAutoMovieHumanHandAttachment.ISection, "jets" | "axisJet">;

/**
 * Original parent-coordinate and native-section reads shared by hand
 * attachments.
 */
export namespace AutoMovieHumanHandParentRead {
  /**
   * Prepare the immutable parent field for searches and complete only recorded
   * samples with physical jets.
   */
  export function prepare(parent: IAutoMovieHumanHandParent.IOutput): {
    read(point: AutoMovieVector3Tuple): Sample | null;
    complete(sample: Sample): IAutoMovieHumanHandAttachment.ISection;
  } {
    const field = AutoMovieLoftViewRead.prepare(parent.source);
    return {
      read: (point: AutoMovieVector3Tuple): Sample | null =>
        locate(parent, field.values, point),
      complete(sample: Sample): IAutoMovieHumanHandAttachment.ISection {
        if (sample.kind === "regular") validate(section(sample.values));
        return {
          ...sample,
          jets: field.jets(sample.station),
          axisJet: parent.part.axis.jet?.(sample.station) ?? null,
        };
      },
    };
  }

  /** Solve the actual normal-plane coordinate and read its exact section shape. */
  function locate(
    parent: IAutoMovieHumanHandParent.IOutput,
    readValues: (station: number) => IAutoMovieLoftViewRead.IValues | string,
    point: AutoMovieVector3Tuple,
  ): Sample | null {
    const roots: number[] = [];
    const residual: (station: number) => number = (station: number): number => {
      const frame: Frame = parent.part.axis.at(station);
      return V.dot(V.sub(point, frame.origin), AutoMovieViewAxis.normal(frame));
    };
    for (let index: number = 1; index < parent.stations.length; index++) {
      const before: IAutoMovieHumanHandParent.IOutput["stations"][number] =
        parent.stations[index - 1]!;
      const after: IAutoMovieHumanHandParent.IOutput["stations"][number] =
        parent.stations[index]!;
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
    let best: Sample | null = null;
    let distance: number = Infinity;
    for (const station of roots) {
      const frame: Frame = parent.part.axis.at(station);
      const delta: AutoMovieVector3Tuple = V.sub(point, frame.origin);
      const squared: number = V.dot(delta, delta);
      if (squared >= distance) continue;
      const values: IAutoMovieLoftViewRead.IValues | string =
        readValues(station);
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
        margin: (zero ? 0 : trialRadius(values, phase)) - Math.hypot(...local),
      };
      distance = squared;
    }
    return best;
  }

  /**
   * Validate the same four native conics without making display or quadrature
   * observations.
   */
  export function radius(
    values: IAutoMovieLoftViewRead.IValues,
  ): (phase: number) => number {
    const conics: IAutoMovieViewConic.ICurve = section(values);
    validate(conics);
    return (phase: number): number => value(conics, phase);
  }
}

/**
 * Each ray-search trial uses one value from the admitted positive-weight conics
 * and convex G2 end supports. Completed sections additionally retain the
 * existing four-quarter numerical sweep before they publish jets.
 */
function trialRadius(
  values: IAutoMovieLoftViewRead.IValues,
  phase: number,
): number {
  return value(section(values), phase);
}

function section(
  values: IAutoMovieLoftViewRead.IValues,
): IAutoMovieViewConic.ICurve {
  const extents: Quarters = values.extents as Quarters;
  const ops = AutoMovieConicFieldJet.NUMBER;
  const curvatures: Quarters = AutoMovieViewConic.curvatures(
    ops,
    extents,
    values.shoulders,
  );
  const conics: IAutoMovieViewConic.ICurve = AutoMovieViewConic.prepareGeometry(
    ops,
    extents,
    values.shoulders,
    curvatures,
  );
  if (conics.failure !== null) throw new Error(conics.failure);
  return conics;
}

function validate(conics: IAutoMovieViewConic.ICurve): void {
  const box: IAutoMovieViewSection.IBox = {
    extents: conics.quarters.map(({ extents }) => extents[0]) as Quarters,
  };
  const fault: string | null = AutoMovieViewSectionConic.fault({
    box,
    conics,
    girth: 0,
  });
  if (fault !== null) throw new Error(fault);
}

function value(conics: IAutoMovieViewConic.ICurve, phase: number): number {
  const radius: number = AutoMovieViewConic.value(conics, phase);
  if (!(Number.isFinite(radius) && radius > 0))
    throw new Error(
      `The actual hand-parent radius is ${radius} at phase ${phase}`,
    );
  return radius;
}
