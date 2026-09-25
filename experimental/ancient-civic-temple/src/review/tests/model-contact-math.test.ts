/** Pure contact fixtures include the reviewer-selected mutations and edge cases. */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { imbrexFootMargin, pinPlateRadialMargin, ridgeFootGap, ridgeSectionAt, rollSheetGap, strapBattenVerticalMargin } from "../model-contact-math.mjs";

const openingSource = readFileSync(join(__dirname, "../../../docs/models/openings.md"), "utf8");
const tileSource = readFileSync(join(__dirname, "../../../docs/models/cladding.md"), "utf8");
/** @param {string} source @param {RegExp} pattern */
const value = (source: string, pattern: RegExp): number => {
  const match = source.match(pattern);
  assert.ok(match, `missing source input ${pattern}`);
  return Number(match[1]);
};

void test("reviewer plate mutation turns the current authored document red", () => {
  const radialMargin = (source: string) => pinPlateRadialMargin(
    value(source, /받침판\(반지름 ([\d.]+)m/),
    value(source, /손잡이와 받침판 중심은[^\n]*?Y=([\d.]+)m/),
    value(source, /반지름 ([\d.]+)m의 연결 핀 두 개/),
    value(source, /연결 핀 두 개는[^\n]*?\(X,Y\)=\(손잡이 중심 X,([\d.]+)m\)/),
  );
  assert.ok(radialMargin(openingSource) > 0);
  const mutation = openingSource.replace("받침판(반지름 0.06m", "받침판(반지름 0.02m");
  assert.notEqual(mutation, openingSource);
  assert.ok(radialMargin(mutation) < 0);
});

void test("reviewer imbrex mutation turns the current authored document red", () => {
  const footMargin = (source: string) => {
    const rib = source.match(/\+([\d.]+)~\+([\d.]+)m에는 Z=0\.08~0\.44m 구간/);
    assert.ok(rib);
    const pitch = value(source, /X 줄 간격 ([\d.]+)m/);
    return imbrexFootMargin(
      value(source, /둥근기와의 X 중심은[^\n]*?X=\+([\d.]+)m/),
      value(source, /바깥 반지름은 Z=0\.08m에서 ([\d.]+)m/),
      value(source, /두께는 ([\d.]+)m, 반원은/),
      [Number(rib[1]), Number(rib[2])],
      [pitch - Number(rib[2]), pitch - Number(rib[1])],
    );
  };
  assert.ok(footMargin(tileSource) > 0);
  const mutation = tileSource.replace("Z=0.08m에서 0.085m", "Z=0.08m에서 0.20m");
  assert.notEqual(mutation, tileSource);
  assert.ok(footMargin(mutation) < 0);
});

void test("plate and pin have positive radial overlap; a shrunken plate is detached", () => {
  assert.ok(pinPlateRadialMargin(0.06, 1.05, 0.006, 1.104) > 0);
  assert.ok(pinPlateRadialMargin(0.02, 1.05, 0.006, 1.104) < 0);
  assert.ok(Math.abs(pinPlateRadialMargin(0.054, 1.05, 0, 1.104)) < 1e-10);
});

void test("both imbrex tube feet stand within a raised rib; enlarged tube fails", () => {
  const ribs: [[number, number], [number, number]] = [[0.10, 0.20], [0.20, 0.30]];
  assert.ok(imbrexFootMargin(0.20, 0.085, 0.015, ...ribs) > 0);
  assert.ok(imbrexFootMargin(0.20, 0.20, 0.015, ...ribs) < 0);
  assert.equal(imbrexFootMargin(0.20, 0.015, 0.015, ...ribs), -Infinity);
});

void test("rolled paper meets its top corner, and an offset roll has a gap", () => {
  const rollZ = 0.175 + Math.sqrt(0.02 ** 2 - 0.018 ** 2);
  assert.ok(Math.abs(rollSheetGap(0.002, 0.175, 0.02, rollZ, 0.02)) < 1e-10);
  assert.ok(rollSheetGap(0.002, 0.175, 0.02, rollZ + 0.01, 0.02) > 0);
});

void test("ridge foot datum follows the actual tile top on both pitches", () => {
  for (const angle of [19, 22]) {
    const a = angle * Math.PI / 180;
    const datum = 0.02 / Math.cos(a) - 0.13 * Math.tan(a);
    assert.ok(Math.abs(ridgeFootGap(datum, 0.02, 0.13, angle)) < 1e-10);
    assert.ok(ridgeFootGap(datum + 0.025, 0.02, 0.13, angle) > 0);
  }
});

void test("both ridge shell foot strips follow sloped tile without penetration or floating", () => {
  for (const angle of [19, 22]) {
    const a = angle * Math.PI / 180;
    const datum = 0.02 / Math.cos(a) - 0.13 * Math.tan(a);
    for (const radius of [0.13, 0.15]) {
      for (const x of [radius - 0.02, radius - 0.015, radius - 0.01, radius - 0.005, radius]) {
        const profile = ridgeSectionAt(datum, radius, 0.02, 0.02, angle, x);
        assert.ok(profile.upper >= profile.lower - 1e-9);
        assert.ok(profile.lower >= profile.tile - 1e-9);
        if (x > radius - 0.02) assert.ok(Math.abs(profile.lower - profile.tile) < 1e-9);
      }
    }
    assert.throws(() => ridgeSectionAt(datum, 0.13, 0.02, 0.02, angle, 0.14));
  }
});

void test("steel straps overlap wooden battens through their full height", () => {
  assert.ok(strapBattenVerticalMargin(0.25, 0.12, 0.31, 0.04) > 0);
  assert.ok(Math.abs(strapBattenVerticalMargin(0.25, 0.12, 0.39, 0.04)) < 1e-10);
  assert.ok(strapBattenVerticalMargin(0.25, 0.12, 0.41, 0.04) < 0);
});
