import { nclose } from "../../internal/predicates";
import {
  AutoMovieHumanFeatureTemplate as Template,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
} from "@automovie/interface";

/**
 * A feature template keeps its place on its bone, follows the skeleton's ratios and takes the tissue's ratio only when it is a pad.
 *
 * The made feature stands at [30, -200, 10] in its segment's frame, long along `-Y` and short along `X`, 20 by 12 mm in half extents and
 * 4 mm high.
 *
 * Scenarios:
 * 1. Tissue 1.2 with the skeleton unchanged: a `bone` and a `tendon` keep 4 mm; a `pad` stands 4.8 mm; centre and extents are unchanged.
 * 2. A segment 1.1 times as long and 0.9 times as broad: the centre goes to [27, -220, 10] (its `X` by 0.9, its `Y` by 1.1, its `Z`
 *    kept) and the half extents to 22 and 10.8, for every class.
 * 3. Placed on a frame at [100, 50, 0] turned 0.5 rad about `Z`: the centre is the origin plus the rotated local centre,
 *    `[100 + 30 cos 0.5 + 200 sin 0.5, 50 + 30 sin 0.5 - 200 cos 0.5, 10]`; the long direction is `[sin 0.5, -cos 0.5, 0]`; the normal
 *    is `along x across` and unit. Turned to 1.0 rad the centre follows the frame by the same closed form.
 * 4. The height is 4 at the centre, `4 (1 - 0.25)^3` halfway along, `4 (1 - 0.5)^3` at half of both extents, and zero on and past the
 *    edge; one thousandth of the half extent inside the edge it is `4 (1 - 0.999^2)^3`, under 4e-8 mm, the cubic's flat arrival.
 * 5. A nonpositive ratio, directions that are not square, a squared footprint without a plateau, a plateau of the whole radius,
 *    coincident landmarks and an outward direction along the span are refused.
 * 6. A plateau over half the radius on a footprint of exponent 4: the height is whole to `r = 0.5`, `4 (1 - s(t))` on the ramp with
 *    `s` the quintic smoothstep and `t = (r - 0.5) / 0.5`, and zero on the edge; a point at 0.8 of both extents is inside it
 *    (`0.8^4 + 0.8^4 < 1`) and outside the ellipse (`0.64 + 0.64 > 1`).
 * 7. A feature between the landmarks [0, 0, 0] and [0, -80, 0] with the skin outward along `[1, 0.2, 0]`: centre [0, -40, 0], long
 *    direction `-Y`, short direction `outward x along = -Z`, half length 40, and its normal `along x across = +X`, out of the skin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production `at`, `place` and `height` on a made template and a made frame.
 * @evidence contracts/development/testing.md#independent-expectations Scaled centres and extents are hand products; the placed centre is the rotation's closed form in sines and cosines; the heights are the polynomial's values written out.
 * @evidence contracts/development/common.md#meaningful-documentation The made feature checks local scaling and world placement, its height law and plateau, invalid footprint controls, and placement between two specified landmarks.
 */
export function test_human_feature_template(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number = 1e-12): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const vector = (what: string, got: AutoMovieVector3Tuple, expected: AutoMovieVector3Tuple): void => got.forEach((x: number, k: number): void => close(what + " " + k, x, expected[k]!, 1e-9));
  const refused = (what: string, bad: () => unknown): void => {
    let thrown: boolean = false;
    try {
      bad();
    } catch {
      thrown = true;
    }
    if (!thrown) failures.push(what + " was accepted");
  };
  const made = (kind: Template.Class): Template.ITemplate => ({ name: "made", class: kind, segment: "bone", centre: [30, -200, 10], along: [0, -1, 0], across: [1, 0, 0], extent: { along: 20, across: 12 }, height: 4 });
  const still: Template.IChange = { along: 1, across: 1, tissue: 1.2 };

  // 1. Tissue alone.
  for (const [kind, height] of [["bone", 4], ["tendon", 4], ["pad", 4.8]] as const) {
    const fuller: Template.ITemplate = Template.at(made(kind), still);
    close("the " + kind + "'s height under tissue", fuller.height, height);
    vector("the " + kind + "'s centre under tissue", fuller.centre, [30, -200, 10]);
    close("the " + kind + "'s long extent under tissue", fuller.extent.along, 20);
  }

  // 2. The skeleton's ratios.
  for (const kind of ["bone", "tendon", "pad"] as const) {
    const moved: Template.ITemplate = Template.at(made(kind), { along: 1.1, across: 0.9, tissue: 1 });
    vector("the " + kind + "'s centre on a longer, narrower segment", moved.centre, [27, -220, 10]);
    close("the " + kind + "'s long extent", moved.extent.along, 22);
    close("the " + kind + "'s short extent", moved.extent.across, 10.8);
    close("the " + kind + "'s height on the skeleton's change", moved.height, 4);
  }

  // 3. On a turned frame: the feature rides its bone.
  for (const angle of [0.5, 1.0]) {
    const [c, s]: [number, number] = [Math.cos(angle), Math.sin(angle)];
    const frame: IAutoMovieHumanSegmentFrame = { origin: [100, 50, 0], axes: [[c, s, 0], [-s, c, 0], [0, 0, 1]] };
    const placed: Template.IPlaced = Template.place(made("bone"), frame);
    vector("the placed centre at " + angle, placed.centre, [100 + 30 * c + 200 * s, 50 + 30 * s - 200 * c, 10]);
    vector("the placed long direction at " + angle, placed.along, [s, -c, 0]);
    vector("the placed normal at " + angle, placed.normal, F.cross(placed.along, placed.across));
    close("the placed normal's length at " + angle, Math.hypot(...placed.normal), 1, 1e-12);
  }

  // 4. The height over the footprint.
  const bump: Template.ITemplate = made("bone");
  close("the height at the centre", Template.height(bump, 0, 0), 4);
  close("the height halfway along", Template.height(bump, 10, 0), 4 * 0.75 ** 3);
  close("the height at half of both extents", Template.height(bump, 10, 6), 4 * 0.5 ** 3);
  close("the height on the edge", Template.height(bump, 20, 0), 0);
  close("the height past the edge", Template.height(bump, 0, 13), 0);
  close("the height just inside the edge", Template.height(bump, 19.98, 0), 4 * (1 - 0.999 ** 2) ** 3, 1e-15);

  // 6. A plateau on a squared footprint (a plate's bed): whole inside the flat share, the quintic ramp's closed form past it, zero on
  // the edge; the footprint's corner region is inside where an ellipse's is outside.
  const bed: Template.ITemplate = { ...made("pad"), squareness: 4, flat: 0.5 };
  close("the plateau at the centre", Template.height(bed, 0, 0), 4);
  close("the plateau at 0.4 of the long extent", Template.height(bed, 8, 0), 4);
  close("the ramp's middle", Template.height(bed, 15, 0), 4 * (1 - (10 * 0.5 ** 3 - 15 * 0.5 ** 4 + 6 * 0.5 ** 5)));
  close("the ramp's first tenth", Template.height(bed, 11, 0), 4 * (1 - (10 * 0.1 ** 3 - 15 * 0.1 ** 4 + 6 * 0.1 ** 5)));
  close("the plateau's edge", Template.height(bed, 20, 0), 0);
  if (!(Template.height(bed, 16, 9.6) > 0)) failures.push("a point at 0.8 of both extents lies outside the squared footprint");
  close("the same point on the ellipse", Template.height(bump, 16, 9.6), 0);

  // 7. A feature between two landmarks: a tendon from [0, 0, 0] to [0, -80, 0] with the skin's outward direction along X.
  const tendon: Template.ITemplate = Template.between([0, 0, 0], [0, -80, 0], { name: "tendon", class: "tendon", segment: "hand", outward: [1, 0.2, 0], half: 3, height: 1.5 });
  vector("the tendon's centre", tendon.centre, [0, -40, 0]);
  vector("the tendon's long direction", tendon.along, [0, -1, 0]);
  vector("the tendon's short direction", tendon.across, [0, 0, -1]);
  close("the tendon's half length", tendon.extent.along, 40);
  close("the tendon's half width", tendon.extent.across, 3);
  vector("the tendon's normal on its own frame", Template.place(tendon, { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }).normal, [1, 0, 0]);

  // 5. Refusals.
  refused("a squared footprint without a plateau", (): unknown => Template.height({ ...bump, squareness: 4 }, 0, 0));
  refused("a plateau of the whole radius", (): unknown => Template.height({ ...bump, flat: 1 }, 0, 0));
  refused("coincident landmarks", (): unknown => Template.between([1, 2, 3], [1, 2, 3], { name: "none", class: "bone", segment: "hand", outward: [1, 0, 0], half: 1, height: 1 }));
  refused("an outward direction along the span", (): unknown => Template.between([0, 0, 0], [0, -80, 0], { name: "none", class: "bone", segment: "hand", outward: [0, 1, 0], half: 1, height: 1 }));
  refused("a nonpositive ratio", (): unknown => Template.at(bump, { along: 0, across: 1, tissue: 1 }));
  refused("directions that are not square", (): unknown => Template.at({ ...bump, across: [0, 1, 0] }, still));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
