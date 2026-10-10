/** Fixed sunlight and latitude-radiance inputs, independent of a DOM or GPU. */
import assert from "node:assert/strict";
import test from "node:test";
import { EquirectangularReflectionMapping, SRGBColorSpace } from "three";

import { createTempleDaylight } from "../../viewer/daylight";

void test("daylight supplies reflected sky without changing sun or shadow contact", () => {
  const { sky, hemisphere, sun } = createTempleDaylight();
  assert.equal(sky.mapping, EquirectangularReflectionMapping);
  assert.equal(sky.colorSpace, SRGBColorSpace);
  const { data, width, height } = sky.image;
  assert.ok(data instanceof Uint8Array);
  assert.equal(width, 512);
  assert.equal(height, 256);
  assert.deepEqual([...data.slice(0, 4)], [230, 226, 214, 255]);
  assert.deepEqual([...data.slice(-4)], [127, 167, 207, 255]);
  for (let y = 0; y < 256; y++) {
    const row = y * 512 * 4;
    assert.deepEqual(
      [...data.slice(row, row + 4)],
      [...data.slice(row + 511 * 4, row + 512 * 4)],
    );
    assert.ok(data[row]! >= 127 && data[row]! <= 230);
  }
  assert.ok(
    Math.abs(sun.position.y / sun.position.length() - Math.SQRT1_2) < 1e-12,
  );
  assert.ok(sun.position.x < 0 && sun.position.z > 0);
  assert.equal(hemisphere.intensity, 1.15);
  assert.equal(sun.intensity, 3.1);
  assert.equal(sun.castShadow, true);
  assert.equal(sun.shadow.bias, -0.000005);
  assert.equal(sun.shadow.normalBias, 0.0005);
  sky.dispose();
});
