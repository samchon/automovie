import type { IAutoMovieVector3 } from "@automovie/interface";
import assert from "node:assert/strict";

import { PictureMeasures } from "../../../../src/interactions/kickboxing/PictureMeasures";
import { PictureTargets } from "../../../../src/interactions/kickboxing/PictureTargets";
import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";
import { KickboxingRange } from "../../../../src/laws/kickboxing/KickboxingRange";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The picture measures and their research ranges on hand-built bodies.
 *
 * Scenarios: two fighters a little beyond the teep range apart, knees bent
 * 32 degrees, both shuffling across their line at 0.5 m/s for a second
 * under a lens that frames them: the distance holds, nothing is close or
 * idle, the travel is 60 m per minute and wholly lateral, the knees read 32
 * degrees and every foot is in frame; the ranges come from the fighters'
 * measures and the research values; annotation puts each finite bound
 * beside its measure and counts the measures out of range or missing; a
 * straight leg reads no flexion; a point behind the lens is out of frame; a
 * path at 8 m/s peaks at 8 m/s.
 */
export function test_picture_measures(): void {
  const { a, b } = polygonCast();
  const ranges: Record<string, PictureTargets.IRange> = PictureTargets.of(
    a.body.measure,
    b.body.measure,
  );
  const distance: number = ranges["distance-outside"]!.min + 0.1;
  const bent: number = (16 * Math.PI) / 180;
  const body = (x: number, z: number): PictureMeasures.IBody => {
    const leg = (side: number): PictureMeasures.ILeg => ({
      hip: { x, y: 0.9, z: z + side },
      knee: {
        x: x + 0.45 * Math.sin(bent),
        y: 0.9 - 0.45 * Math.cos(bent),
        z: z + side,
      },
      ankle: { x, y: 0.9 - 0.9 * Math.cos(bent), z: z + side },
    });
    const hand = (side: number): IAutoMovieVector3 => ({
      x,
      y: 1.4,
      z: z + side,
    });
    return {
      legs: { left: leg(0.1), right: leg(-0.1) },
      hands: { left: hand(0.2), right: hand(-0.2) },
    };
  };
  const lens = {
    position: { x: distance / 2, y: 1, z: -8 },
    target: { x: distance / 2, y: 0.5, z: 0 },
  };
  const samples: PictureMeasures.ISample[] = [];
  for (let k = 0; k <= 10; k++)
    samples.push({
      seconds: k / 10,
      phase: "outside",
      bodies: [body(0, k * 0.05), body(distance, k * 0.05)],
      lens,
    });
  const measures: Record<string, number> = PictureMeasures.measure(samples, {
    close: KickboxingRange.clinch(a.body.measure, b.body.measure),
    fieldOfView: CoverageLaw.FIELD_OF_VIEW,
    aspect: CoverageLaw.ASPECT,
  });
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-9, `${x} != ${y}`);
  near(measures["distance-outside"]!, distance);
  near(measures["close-share"]!, 0);
  near(measures["idle-share"]!, 0);
  near(measures["foot-travel-per-minute"]!, 60);
  near(measures["foot-lateral-share"]!, 1);
  near(measures["knee-flexion"]!, 32);
  near(measures["feet-in-frame"]!, 1);

  assert.ok(
    ranges["distance-exchange"]!.min < ranges["distance-outside"]!.min &&
      ranges["distance-outside"]!.min < ranges["distance-exchange"]!.max,
  );
  assert.deepEqual(
    [ranges["knee-flexion"]!.min, ranges["knee-flexion"]!.max],
    [...StanceShape.KNEE_FLEXION_RANGE],
  );
  const annotated: Record<string, number> = PictureTargets.annotate(
    measures,
    ranges,
  );
  assert.equal(annotated["knee-flexion-min"], 25);
  assert.equal(annotated["knee-flexion-max"], 45);
  assert.equal(annotated["distance-outside-max"], undefined);
  assert.equal(
    annotated["feet-in-frame-min"],
    PictureTargets.FEET_IN_FRAME_MIN,
  );
  assert.deepEqual(
    PictureTargets.outside(measures, ranges).map((l) => l.split(":")[0]),
    ["distance-exchange", "punch-peak-speed", "kick-peak-speed"],
  );
  assert.equal(annotated["picture-out-of-range"], 3);

  near(
    PictureMeasures.flexion({
      hip: { x: 0, y: 1, z: 0 },
      knee: { x: 0, y: 0.5, z: 0 },
      ankle: { x: 0, y: 0, z: 0 },
    }),
    0,
  );
  assert.equal(
    PictureMeasures.inside(
      lens,
      { x: distance / 2, y: 1, z: -9 },
      {
        fieldOfView: CoverageLaw.FIELD_OF_VIEW,
        aspect: CoverageLaw.ASPECT,
      },
    ),
    false,
  );
  near(
    PictureMeasures.peak([
      { seconds: 0, point: { x: 0, y: 1, z: 0 } },
      { seconds: 0.01, point: { x: 0.08, y: 1, z: 0 } },
    ]),
    8,
  );
}
