import { samplePortraitNasalSection } from "./samplePortraitNasalSection";
import { IPortraitNasalBodyShape } from "./structures/IPortraitNasalBodyShape";

/**
 * Construct C1 numerical transverse sections through a longitudinal profile.
 * The midline, paired tip shoulders and paired alar bodies own separate extents.
 * They combine on one shared skin rather than creating overlapping mesh shells.
 * Outside each transverse half-width, (1-u²)² and its derivative are zero.
 * Longitudinal cubic slopes use a harmonic mean only across equal-sign secants;
 * local extrema and the two exterior ends have zero slope. This preserves each
 * station interval's scalar bounds without an uncontrolled cubic overshoot.
 *
 * The returned X displacement owns lateral alar support. Forward displacement
 * is a scalar to apply on the recorded image-depth ray, not necessarily head Z.
 * Aperture position, orientation, section jets and outer joining are deliberately
 * absent from this part's shape controls and are composed by the shared surface.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Forms central, tip-shoulder and alar volumes on shared nasal skin rather than overlapping shells.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Uses bounded C1 longitudinal interpolation and compact transverse sections, returning lateral movement and image-depth displacement without refitting apertures.
 */
export function createPortraitNasalBody(
  input: IPortraitNasalBodyShape,
): (x: number, y: number) => { lateral: number; forward: number } {
  const shape = {
    ...input,
    stations: input.stations.map((station) => ({ ...station })),
    fullness: [...input.fullness],
    spread: [...input.spread],
    crease: [...input.crease],
  };
  if (
    shape.stations.length < 2 ||
    shape.stations.length > 32 ||
    [
      shape.centreWidth,
      shape.shoulderWidth,
      shape.alarWidth,
      shape.creaseWidth,
    ].some((v) => !Number.isFinite(v) || v <= 0) ||
    [shape.shoulderOffset, shape.alarOffset, shape.creaseOffset].some(
      (v) => !Number.isFinite(v) || v < 0,
    ) ||
    shape.fullness.length !== 2 ||
    shape.spread.length !== 2 ||
    shape.crease.length !== 2 ||
    [...shape.fullness, ...shape.spread, ...shape.crease].some(
      (v) => !Number.isFinite(v),
    ) ||
    shape.stations.some(
      (station, i) =>
        ![station.height, station.centre, station.shoulder, station.ala].every(
          Number.isFinite,
        ) ||
        (i !== 0 && station.height <= shape.stations[i - 1].height),
    )
  )
    throw new Error(
      "Nasal body sections need ordered finite stations and positive transverse widths.",
    );
  const values = shape.stations.map((station) => [
    station.centre,
    station.shoulder,
    station.ala,
  ]);
  if ([values[0], values.at(-1)!].some((row) => row.some((v) => v !== 0)))
    throw new Error(
      "The lower-nasal section profile must join with zero endpoint extents.",
    );
  const spans = shape.stations
    .slice(1)
    .map((station, i) => station.height - shape.stations[i].height);
  const secants = spans.map((span, i) =>
    values[i].map((v, axis) => (values[i + 1][axis] - v) / span),
  );
  if (
    spans.some((span) => !Number.isFinite(span)) ||
    secants.some((row) => !row.every(Number.isFinite))
  )
    throw new Error(
      "Nasal body section spacing exceeds its finite numerical domain.",
    );
  const derivatives = values.map((_row, i) =>
    [0, 1, 2].map((axis) => {
      if (i === 0 || i === values.length - 1) return 0;
      const a = secants[i - 1][axis],
        b = secants[i][axis];
      if (Math.sign(a) !== Math.sign(b) || a === 0) return 0;
      const scale = Math.max(spans[i], spans[i - 1]);
      const before = spans[i - 1] / scale,
        after = spans[i] / scale;
      const first = (2 * after + before) / (3 * (before + after));
      const minimum = Math.min(Math.abs(a), Math.abs(b));
      const magnitude =
        minimum /
        ((first * minimum) / Math.abs(a) +
          ((1 - first) * minimum) / Math.abs(b));
      return (
        Math.sign(a) * Math.min(Math.max(Math.abs(a), Math.abs(b)), magnitude)
      );
    }),
  );
  const peakAla = Math.max(...values.map((row) => Math.abs(row[2])));
  if (
    peakAla === 0 &&
    [...shape.fullness, ...shape.spread, ...shape.crease].some((v) => v !== 0)
  )
    throw new Error(
      "An absent alar profile cannot carry active fullness, spread or crease controls.",
    );
  const transverse = (x: number, width: number): number => {
    const u = x / width;
    return Math.abs(u) >= 1 ? 0 : (1 - u * u) ** 2;
  };
  return (x, y) => {
    if (![x, y].every(Number.isFinite))
      throw new Error("A nasal body sample needs finite coordinates.");
    if (y <= shape.stations[0].height || y >= shape.stations.at(-1)!.height)
      return { lateral: 0, forward: 0 };
    const index = shape.stations.findIndex((station) => station.height > y) - 1;
    const extent = samplePortraitNasalSection(
      { point: values[index], derivative: derivatives[index] },
      { point: values[index + 1], derivative: derivatives[index + 1] },
      spans[index],
      (y - shape.stations[index].height) / spans[index],
    ).point;
    const alar = [-1, 1].map((side) =>
      transverse(x - side * shape.alarOffset, shape.alarWidth),
    );
    const alarPhase = peakAla === 0 ? 0 : Math.abs(extent[2]) / peakAla;
    const forward =
      extent[0] * transverse(x, shape.centreWidth) +
      extent[1] *
        (transverse(x - shape.shoulderOffset, shape.shoulderWidth) +
          transverse(x + shape.shoulderOffset, shape.shoulderWidth)) +
      alar.reduce(
        (sum, weight, side) =>
          sum + weight * (extent[2] + shape.fullness[side] * alarPhase),
        0,
      ) -
      [-1, 1].reduce(
        (sum, side, index) =>
          sum +
          shape.crease[index] *
            alarPhase *
            transverse(
              x - side * (shape.alarOffset + shape.creaseOffset),
              shape.creaseWidth,
            ),
        0,
      );
    const lateral =
      alarPhase * (shape.spread[1] * alar[1] - shape.spread[0] * alar[0]);
    if (![forward, lateral].every(Number.isFinite))
      throw new Error("Nasal body extent exceeds its finite numerical domain.");
    return { lateral, forward };
  };
}
