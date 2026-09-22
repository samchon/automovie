import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodyBuild,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { humanBodyBasisFixture } from "./humanBodyBasisFixture";

/** One declared coupling of the analytic body basis. */
export type HumanBodyCoupling = NonNullable<
  IAutoMovieHumanBodyBasis["couplings"]
>[number];

/** A mutation applied to a fresh fixture basis before it is admitted. */
export type HumanBodyBasisPatch = (basis: IAutoMovieHumanBodyBasis) => void;

const RHYTHM: HumanBodyCoupling = {
  id: "rhythm",
  source: { bone: "spine", measure: "elevation" },
  output: { bone: "chest", axis: "flexion" },
  curve: [
    [30, 0],
    [60, 20],
    [90, 50],
  ],
};

const RETRACTION: HumanBodyCoupling = {
  id: "retraction",
  source: { bone: "spine", measure: "elevation" },
  output: { bone: "chest", axis: "abduction" },
  curve: [
    [30, 0],
    [90, -6],
  ],
};

/**
 * The analytic box of `humanBodyBasisFixture` with a third bone `chest` above
 * the spine, and the couplings the coupling scenarios read.
 *
 * `chest` runs from `joint-spine-2` to a new `joint-neck` at (0,3,0) with the
 * spine's ranges and rest copied, so every rest frame is the identity and a
 * spine flexion `s` plus a chest flexion `c` leaves the chest's world rotation
 * at `s + c` degrees about +X. `rhythm` reads the spine's elevation and adds
 * to the chest's flexion along `[[30, 0], [60, 20], [90, 50]]`; `retraction`
 * adds to the chest's abduction along `[[30, 0], [90, -6]]`. Every expected
 * number in the scenarios is hand-derived from these figures.
 */
export const humanBodyCouplingFixture = {
  rhythm: RHYTHM,
  retraction: RETRACTION,

  /** `rhythm` with a two-knot curve starting at `first` degrees of elevation. */
  curveFrom(first: number): HumanBodyCoupling {
    return {
      ...humanBodyCouplingFixture.rhythm,
      curve: [
        [first, 0],
        [90, 50],
      ],
    };
  },

  /** A fresh three-bone basis with the couplings and the patch applied. */
  withChest(
    couplings?: HumanBodyCoupling[],
    patch?: HumanBodyBasisPatch,
  ): {
    basis: IAutoMovieHumanBodyBasis;
    document: IAutoMovieHumanBodyBasisDocument;
  } {
    const fixture = humanBodyBasisFixture();
    fixture.basis.landmarks.ids.push("joint-neck");
    fixture.basis.landmarks.positions.push(0, 3, 0);
    fixture.basis.joints.push({
      ...structuredClone(fixture.basis.joints[1]),
      bone: "chest",
      parent: "spine",
      head: "joint-spine-2",
      tail: "joint-neck",
    });
    if (couplings !== undefined) fixture.basis.couplings = couplings;
    patch?.(fixture.basis);
    return fixture;
  },

  /** The chest bone's posed world rotation. */
  chestOf(built: IAutoMovieHumanBodyBuild): IAutoMovieQuaternion {
    return built.bones.find((one) => one.bone === "chest")!.posed.rotation;
  },

  /** A rotation of `degrees` about world +X. */
  aboutX(degrees: number): IAutoMovieQuaternion {
    const half = (degrees * Math.PI) / 360;
    return { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) };
  },

  /** A spine entry with the given flexion and abduction. */
  spine(
    flexion: number | null,
    abduction: number | null = null,
  ): IAutoMovieJointPose {
    return { bone: "spine", flexion, abduction, twist: null };
  },

  /** A chest entry with the given flexion and abduction. */
  chest(
    flexion: number | null,
    abduction: number | null = null,
  ): IAutoMovieJointPose {
    return { bone: "chest", flexion, abduction, twist: null };
  },

  /** The chest rotation the same explicit pose gives on a coupling-free basis. */
  twin(
    pose: IAutoMovieJointPose[],
    patch?: HumanBodyBasisPatch,
  ): IAutoMovieQuaternion {
    const plain = humanBodyCouplingFixture.withChest(undefined, patch);
    return humanBodyCouplingFixture.chestOf(
      createHumanBodyBasisBuilder(plain.basis)({ ...plain.document, pose }),
    );
  },
};
