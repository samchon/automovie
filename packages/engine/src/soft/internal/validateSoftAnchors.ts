import {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftAnchorPose,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftNamedState,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { SOFT_MAX_ANCHORS } from "../SOFT_MAX_ANCHORS";
import { SOFT_MAX_STATES } from "../SOFT_MAX_STATES";
import { validateSoftBounded as bounded } from "./validateSoftBounded";
import { validateSoftIdentity as identity } from "./validateSoftIdentity";
import { validateSoftInteger as integer } from "./validateSoftInteger";
import { validateSoftVector as vector } from "./validateSoftVector";

/*
 * Validate a soft-body domain's anchors and its named states: the anchors'
 * budget, identities, particles (each held by one anchor only), static
 * positions and moving bindings, then the states' budget, identities and the
 * anchors each poses (declared, posed once, finite). Split from
 * `validateSoftBodyDomain`, which calls it at the same place, so its findings
 * keep their order.
 * Parameter out: The collector the domain's validation writes to.
 * Parameter root: The domain's path.
 * Parameter domain: The domain.
 * Parameter count: The lattice's particle count.
 */
export function validateSoftAnchors(
  out: IAutoMovieViolationCollector,
  root: string,
  domain: IAutoMovieSoftBodyDomain,
  count: number,
): void {
  bounded(
    out,
    `${root}.anchors`,
    "anchors",
    domain.anchors.length,
    SOFT_MAX_ANCHORS,
  );
  const anchorIds: Set<string> = new Set<string>();
  const anchoredParticles: Set<number> = new Set<number>();
  domain.anchors.forEach(
    (anchor: IAutoMovieSoftAnchor, index: number): void => {
      const path: string = `${root}.anchors[${index}]`;
      identity(out, path, "anchor", anchor.id, anchorIds);
      integer(
        out,
        `${path}.particle`,
        "anchor particle",
        anchor.particle,
        0,
        count - 1,
      );
      if (anchoredParticles.has(anchor.particle))
        out.push(
          "type",
          `${path}.particle`,
          `particle ${anchor.particle} is already held by another anchor`,
          anchor.particle,
        );
      anchoredParticles.add(anchor.particle);
      if (anchor.position !== null)
        vector(out, `${path}.position`, anchor.position);
      if (anchor.binding !== undefined) {
        if (anchor.position !== null)
          out.push(
            "type",
            `${path}.position`,
            "a moving anchor must leave its static world position null",
            anchor.position,
          );
        vector(out, `${path}.binding.offset`, anchor.binding.offset);
      }
    },
  );

  bounded(
    out,
    `${root}.states`,
    "named states",
    domain.states.length,
    SOFT_MAX_STATES,
  );
  const stateIds: Set<string> = new Set<string>();
  domain.states.forEach(
    (state: IAutoMovieSoftNamedState, index: number): void => {
      const path: string = `${root}.states[${index}]`;
      identity(out, path, "named state", state.id, stateIds);
      const posed: Set<string> = new Set<string>();
      state.anchors.forEach(
        (pose: IAutoMovieSoftAnchorPose, at: number): void => {
          const posePath: string = `${path}.anchors[${at}]`;
          if (!anchorIds.has(pose.anchor))
            out.push(
              "type",
              `${posePath}.anchor`,
              `named state cites anchor "${pose.anchor}", which the domain does not declare`,
              pose.anchor,
            );
          else if (posed.has(pose.anchor))
            out.push(
              "type",
              `${posePath}.anchor`,
              `named state poses anchor "${pose.anchor}" twice`,
              pose.anchor,
            );
          posed.add(pose.anchor);
          vector(out, `${posePath}.position`, pose.position);
        },
      );
    },
  );
}
