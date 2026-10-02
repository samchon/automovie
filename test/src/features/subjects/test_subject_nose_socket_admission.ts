import { createPortraitNoseComponent } from "@automovie/human/face/anatomy/nose/createPortraitNoseComponent";
import { resolvePortraitNoseSocket } from "@automovie/human/face/anatomy/nose/resolvePortraitNoseSocket";
import { IPortraitNoseSocket } from "@automovie/human/face/anatomy/nose/structures/IPortraitNoseSocket";
import { TestValidator } from "@nestia/e2e";

import {
  portraitNoseShape,
  portraitNoseSocket,
} from "../../subjects/generated-korean-girl-01/configuration";
import { throwsError } from "../internal/predicates";

/**
 * A nasal socket whose influence radii cannot be divided by is refused before
 * the depth field turns every exterior target into `NaN`, and an admitted
 * socket is an owned copy.
 *
 * Scenarios:
 * 1. A zero alar offset and a very small positive radius are valid boundaries
 *    and are accepted.
 * 2. A zero, negative or nonfinite radius, a negative alar offset, a nonfinite
 *    centre and a radius pair that is not a pair are each refused, one field
 *    at a time, and the component constructor refuses them through the same
 *    admission.
 * 3. The admitted copy holds the same numbers but aliases none of the caller's
 *    arrays, an absent support plane stays absent and a present one is copied.
 */
export const test_subject_nose_socket_admission = (): void => {
  const accepted: Partial<IPortraitNoseSocket>[] = [
    { alarOffset: 0 },
    { alarRadius: 1e-6 },
    { tipRadius: [1e-6, 1e-6] },
  ];
  for (const override of accepted)
    TestValidator.equals(
      "boundary socket accepted",
      resolvePortraitNoseSocket({ ...portraitNoseSocket, ...override }),
      { ...portraitNoseSocket, ...override },
    );
  const refused: Partial<IPortraitNoseSocket>[] = [
    { alarRadius: 0 },
    { alarRadius: -1 },
    { alarRadius: NaN },
    { tipRadius: [0, 9] },
    { tipRadius: [8, -9] },
    { tipRadius: [Infinity, 9] },
    { tipRadius: [8] as unknown as [number, number] },
    { tipRadius: [8, 9, 10] as unknown as [number, number] },
    { alarOffset: -0.5 },
    { alarOffset: NaN },
    { midline: Infinity },
    { tipY: NaN },
    { alarY: -Infinity },
  ];
  for (const override of refused) {
    const socket = { ...portraitNoseSocket, ...override };
    TestValidator.predicate(
      "invalid nasal socket refused",
      throwsError(() => resolvePortraitNoseSocket(socket)),
    );
    TestValidator.predicate(
      "component refuses the same socket",
      throwsError(() => createPortraitNoseComponent(socket, portraitNoseShape)),
    );
  }
  const input = {
    ...portraitNoseSocket,
    supportPlane: [1, 2, 3],
  };
  const owned = resolvePortraitNoseSocket(input);
  TestValidator.equals("admitted copy keeps the numbers", owned, input);
  TestValidator.predicate(
    "admitted copy aliases no caller array",
    owned.tipRadius !== input.tipRadius &&
      owned.surface !== input.surface &&
      owned.nostrils !== input.nostrils &&
      owned.nostrils[0] !== input.nostrils[0] &&
      owned.supportPlane !== input.supportPlane,
  );
  TestValidator.equals(
    "absent support plane stays absent",
    resolvePortraitNoseSocket({ ...portraitNoseSocket, supportPlane: undefined })
      .supportPlane,
    undefined,
  );
};
