import { TestValidator } from "@nestia/e2e";

import { applyHumanViewerPose } from "../../../scripts/human-viewer/applyHumanViewerPose";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { resolveHumanViewerPose } from "../../../scripts/human-viewer/resolveHumanViewerPose";
import { serializeHumanViewerAddress } from "../../../scripts/human-viewer/serializeHumanViewerAddress";
import { throwsError } from "../internal/predicates";

/**
 * The address places an exact camera, and a pose file resolves to one.
 *
 * Scenarios:
 * 1. `look` with six numbers takes the historical 28 degree field, with seven
 *    the given field, and round-trips through the serializer; an address
 *    without it carries `null` and serializes without the field.
 * 2. Too few values, a non-number, a yaw beyond 180, a pitch at 90, a
 *    non-positive distance and a field of 180 each refuse.
 * 3. A pose file entry gives its own distance, target and field, an entry with
 *    only angles gets 0.62 m from (0, 0, 0.06) at 28 degrees, and a missing
 *    subject or non-finite angle refuses instead of falling back.
 * 4. `pose=<file>:<subject>` becomes `look`; a malformed value, a file name
 *    that could leave the folder and a request that also names `look` refuse;
 *    a request without `pose` is untouched.
 */
export const test_human_viewer_look_and_pose = (): void => {
  const six = parseHumanViewerAddress("look=10,-5,0.62,0,0,0.06");
  TestValidator.equals("default field", six.look, [10, -5, 0.62, 0, 0, 0.06, 28]);
  const seven = parseHumanViewerAddress("look=-26,0,1.55,0,-0.19,0.06,8.8");
  TestValidator.equals("given field", seven.look, [-26, 0, 1.55, 0, -0.19, 0.06, 8.8]);
  TestValidator.equals(
    "round trip",
    parseHumanViewerAddress(serializeHumanViewerAddress(seven)).look,
    seven.look,
  );
  const plain = parseHumanViewerAddress("view=front");
  TestValidator.equals("absent", plain.look, null);
  TestValidator.predicate(
    "absent is not serialized",
    !serializeHumanViewerAddress(plain).includes("look="),
  );
  TestValidator.predicate(
    "look refusals",
    ["look=1,2,3", "look=a,0,1,0,0,0", "look=181,0,1,0,0,0", "look=0,90,1,0,0,0", "look=0,0,0,0,0,0", "look=0,0,1,0,0,0,180", "look=0,0,1,0,0,0,0", "look=,0,1,0,0,0"].every(
      (text) => throwsError(() => parseHumanViewerAddress(text), "look requires"),
    ),
  );

  const poses = {
    full: { yaw: -26, pitch: 3, distance: 2, target: [0, -0.19, 0.06] as [number, number, number], fov: 8.8 },
    angles: { yaw: 5, pitch: 0 },
    bad: { yaw: NaN, pitch: 0 },
  };
  TestValidator.equals("full pose", resolveHumanViewerPose(poses, "full"), "-26,3,2,0,-0.19,0.06,8.8");
  TestValidator.equals("defaults", resolveHumanViewerPose(poses, "angles"), "5,0,0.62,0,0,0.06,28");
  TestValidator.predicate(
    "pose refusals",
    throwsError(() => resolveHumanViewerPose(poses, "missing"), "measured camera pose") &&
      throwsError(() => resolveHumanViewerPose(poses, "bad"), "measured camera pose"),
  );

  const read = (file: string): string => {
    if (file !== "poses-test") throw new Error("unexpected file " + file);
    return JSON.stringify(poses);
  };
  const fields = new URLSearchParams("doc=x&pose=poses-test:full");
  applyHumanViewerPose(fields, read);
  TestValidator.equals("resolved", [fields.get("look"), fields.has("pose")], ["-26,3,2,0,-0.19,0.06,8.8", false]);
  const untouched = new URLSearchParams("doc=x");
  applyHumanViewerPose(untouched, read);
  TestValidator.equals("untouched", untouched.toString(), "doc=x");
  TestValidator.predicate(
    "request refusals",
    ["pose=poses-test", "pose=poses-test:", "pose=:full", "pose=../secret:full", "pose=Poses:full"].every(
      (text) =>
        throwsError(() => applyHumanViewerPose(new URLSearchParams(text), read), "pose requires"),
    ) &&
      throwsError(
        () => applyHumanViewerPose(new URLSearchParams("pose=poses-test:full&look=0,0,1,0,0,0"), read),
        "both place the camera",
      ),
  );
};
