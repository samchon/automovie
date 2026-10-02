import { portraitNoseDepth } from "@automovie/human/face/anatomy/nose/portraitNoseDepth";
import { TestValidator } from "@nestia/e2e";

import {
  portraitNoseShape,
  portraitNoseSocket,
} from "../../subjects/generated-korean-girl-01/configuration";
import { nclose } from "../internal/predicates";

/**
 * The nasal relief is the sum of a tip bump and a mirrored alar bump, zero at
 * the neutral of both projection channels and exactly mirror-symmetric about
 * the socket midline.
 *
 * Scenarios:
 * 1. Zero tip and alar projection give zero depth at the tip, an ala and a
 *    distant point, the neutral of both channels.
 * 2. With only the tip channel set, depth at the tip centre equals that
 *    projection plus nothing from the alar channel, and with only the alar
 *    channel set, depth at an alar centre equals that projection.
 * 3. One radius away from a centre along X, a bump has fallen to 1/e of its
 *    peak, the definition of each radius.
 * 4. A point and its mirror about the midline have the same depth, including
 *    for a midline that is not the origin.
 * 5. A point many radii from every centre receives no relief, the negative
 *    twin of the bumps.
 */
export const test_subject_nose_depth_field = (): void => {
  const socket = portraitNoseSocket;
  const none = {
    ...portraitNoseShape,
    tipProjection: 0,
    alarProjection: 0,
  };
  const tip = [socket.midline, socket.tipY, 0];
  const ala = [socket.midline + socket.alarOffset, socket.alarY, 0];
  for (const point of [tip, ala, [40, 40, 0]])
    TestValidator.equals(
      "neutral channels give zero depth",
      portraitNoseDepth(point, socket, none),
      0,
    );
  TestValidator.predicate(
    "tip channel peaks at the tip centre",
    nclose(
      portraitNoseDepth(tip, socket, { ...none, tipProjection: 3 }),
      3,
    ),
  );
  TestValidator.predicate(
    "alar channel peaks at an alar centre",
    nclose(
      portraitNoseDepth(ala, socket, { ...none, alarProjection: 2 }),
      2,
    ),
  );
  TestValidator.predicate(
    "one radius away a bump has fallen to 1/e",
    nclose(
      portraitNoseDepth(
        [socket.midline + socket.tipRadius[0], socket.tipY, 0],
        socket,
        { ...none, tipProjection: 1 },
      ),
      Math.exp(-1),
    ),
  );
  const both = { ...none, tipProjection: 2, alarProjection: 1.5 };
  const shifted = { ...socket, midline: 3 };
  for (const owner of [socket, shifted]) {
    const point = [owner.midline + 7, -10, 0];
    const mirror = [owner.midline - 7, -10, 0];
    TestValidator.predicate(
      "relief is mirror symmetric about the midline",
      nclose(
        portraitNoseDepth(point, owner, both),
        portraitNoseDepth(mirror, owner, both),
        1e-12,
      ),
    );
  }
  TestValidator.predicate(
    "distant point receives no relief",
    Math.abs(portraitNoseDepth([60, 60, 0], socket, both)) < 1e-12,
  );
};
