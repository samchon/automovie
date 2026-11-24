import { AutoMovieHumanNail } from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanNail } from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * The axial support of a nail bed on an actual made skin.
 *
 * Scenarios:
 * 1. A chart beginning inside the rear ellipse refuses at its real boundary.
 * 2. Restoring only part of the prefix still refuses at the owning boundary.
 * 3. The full original prefix admits a bed active before the fitting aperture and keeps three zero outer rings.
 *
 * @evidence contracts/development/testing.md#behavioral-verification All three support inputs traverse the public nail constructor.
 * @evidence contracts/development/testing.md#independent-expectations A straight unturned bar gives the analytic fold and rear ellipse.
 * @evidence contracts/development/testing.md#distinguishing-cases Only the available prefix changes between the three calls.
 * @evidence contracts/development/testing.md#execution-ownership All ring construction and fitting run inside this scenario.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the fitting aperture from the available owning skin in the three support cases.
 */
export function test_human_nail_chart_support(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  const { broad, length, close, skin, proportions, segment }: ReturnType<typeof HumanNailFixture.madeBar> = HumanNailFixture.madeBar();
  // The same straight skin is available before the fitting aperture. Its width
  // and zero pitch are analytic on the straight wall. The rear half ellipse
  // reaches two ramp lengths behind the fold, and the fitting aperture cuts
  // through that interval without changing the measured fold.
  const unturned: IAutoMovieHumanNail.IFrame = { ...segment, dorsal: [0, 1, 0] };
  const owned: IAutoMovieHumanNail.ISkin = skin(length);
  const planarFold: number = length + close - (2 * broad * proportions.width) / proportions.aspect;
  const rear: number = planarFold - 4 * proportions.fold;
  const fitFirst: number = (rear + planarFold) / 2;
  const phaseCount: number = 72;
  const angle: number = (2 * Math.PI) / phaseCount;
  const fitSteps: number = Math.ceil((owned.tip - fitFirst) / 0.25);
  const prefixSteps: number = Math.ceil(fitFirst / 0.25);
  const toRing = (station: number): { station: number; ring: AutoMovieVector3Tuple[] } => ({
    station,
    ring: Array.from({ length: phaseCount }, (_, i: number) =>
      owned.point(station, angle * i) as AutoMovieVector3Tuple),
  });
  const prefix = Array.from({ length: prefixSteps }, (_, i: number) => toRing(fitFirst * i / prefixSteps));
  const core = Array.from({ length: fitSteps + 1 }, (_, i: number) =>
    toRing(i === fitSteps ? owned.tip : fitFirst + ((owned.tip - fitFirst) * i) / fitSteps));
  const chart = [...prefix, ...core];
  const prefixRate: number = prefixSteps / fitFirst;
  const coreRate: number = fitSteps / (owned.tip - fitFirst);
  const point = (station: number, phase: number): AutoMovieVector3Tuple => {
    // Both row ranges are uniform. The tip belongs to the last cell of the core.
    const row: number = station < fitFirst
      ? station * prefixRate
      : prefixSteps + (station - fitFirst) * coreRate;
    let j: number = Math.max(0, Math.min(chart.length - 2, Math.floor(row)));
    // Multiplying by the reciprocal pitch can round across a key. An exact key opens its next cell.
    if (j < chart.length - 2 && station >= chart[j + 1]!.station) ++j;
    else if (j > 0 && station < chart[j]!.station) --j;
    const [a, b] = [chart[j]!, chart[j + 1]!];
    const s: number = (station - a.station) / (b.station - a.station);
    const turn: number = phase / (2 * Math.PI);
    const at: number = (turn - Math.floor(turn)) * phaseCount;
    const k: number = Math.floor(at) % phaseCount;
    const t: number = at - Math.floor(at);
    const along = (component: number): number =>
      (1 - s) * ((1 - t) * a.ring[k]![component]! + t * a.ring[(k + 1) % phaseCount]![component]!) +
      s * ((1 - t) * b.ring[k]![component]! + t * b.ring[(k + 1) % phaseCount]![component]!);
    return [along(0), along(1), along(2)];
  };
  const cropped: IAutoMovieHumanNail.ISkin = { first: fitFirst, tip: owned.tip, point, grid: core.map((row) => row.ring) };
  const checkBoundary = (label: string, clipped: IAutoMovieHumanNail.ISkin): void => {
    try {
      AutoMovieHumanNail.create("nail.aperture", "nailbed.aperture", unturned, clipped, proportions, 0.69, 10);
      failures.push(label + " accepted a bed that reaches its available boundary");
    } catch (error: unknown) {
      if (!(error instanceof Error && error.message.includes("touches the skin chart's axial boundary")))
        failures.push(label + " refused outside the support check: " + String(error));
    }
  };
  checkBoundary("cropped chart", cropped);
  checkBoundary("true owning boundary", {
    ...cropped,
    proximal: prefix.filter((row): boolean => row.station > (rear + fitFirst) / 2),
  });
  const extended: IAutoMovieHumanNail.INail = AutoMovieHumanNail.create(
    "nail.aperture", "nailbed.aperture", unturned, { ...cropped, proximal: prefix }, proportions, 0.69, 10,
  );
  if (!(extended.readings.span[0] > fitFirst && extended.bed.stations[0] < rear))
    failures.push("extending the owning chart did not preserve the fitted fold and enclose its rear support");
  const { stations: [bedFirst, bedLast], rows: bedRows, columns: bedColumns } = extended.bed;
  if (!extended.bed.heights.some((h: number, i: number): boolean =>
    h !== 0 && bedFirst + ((bedLast - bedFirst) * (Math.floor(i / bedColumns) - 1)) / (bedRows - 3) < fitFirst))
    failures.push("the admitted owning skin has no active bed before the fitting aperture");
  const boundaryHeight: number = Math.max(...extended.bed.heights.map((h: number, i: number): number =>
    Math.floor(i / bedColumns) < 3 || Math.floor(i / bedColumns) >= bedRows - 3 ||
    i % bedColumns < 3 || i % bedColumns >= bedColumns - 3 ? Math.abs(h) : 0));
  near("extended bed outer rings", boundaryHeight, 0, 0);
  finish();
}
