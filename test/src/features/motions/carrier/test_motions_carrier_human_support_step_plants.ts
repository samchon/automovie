import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanSupportStepPlants
} from "../../../../../packages/motions/src/carrier/internal/HumanSupportStepPlants";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a quarter turn, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanSupportStepPlants` reads a support's declared surfaces where a foot
 * lands: each `surface` affordance carried by the support's frame at the step's
 * second, its width and depth unbounded when undeclared; a world point in a
 * surface's frame; and whether a surface bears a point, within its extent and
 * `BEARING` (0.1 m) of its plane.
 *
 * Scenarios, a tread prop at (1, 0.2, 0) turned a quarter about +Y, its
 * `surface` affordance 0.5 m ahead in its own frame, 0.4 m wide and 1 m deep,
 * beside a `handle` affordance; the step starting at 3 s:
 *
 * 1. At 0.5 s of the step the prop's frame is read at 3.5 s, and its one surface
 *    lies at (1.5, 0.2, 0) turned a quarter.
 * 2. The point (1.5, 0.25, 0.3) lies at (-0.3, 0.05, 0) in its frame.
 * 3. That point is held; one 0.15 m above, or 0.3 m along its width, is not.
 * 4. A surface with no declared extent holds a point any distance along it.
 * 5. A moving face follows its own displayed site.
 * 6. A 0.10 m sole centred at 0.07 m on a 0.20 m deck needs 0.02 m of inward
 *    correction, including on a rotated deck. A sole wider than the face
 *    refuses.
 */
export function test_motions_carrier_human_support_step_plants(): void {
  const quarter = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const read: number[] = [];
  const affordance = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    extent: Pick<IAutoMovieAffordance, "width" | "depth">,
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation: { x: 0, y: 0, z: 0.5 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    ...extent,
  });
  const context = (
    affordances: IAutoMovieAffordance[],
  ): HumanSupportStepPlants.ISurfacesContext => ({
    start: 3,
    prop: () => ({
      prop: { affordances },
      frame: (seconds: number) => {
        read.push(seconds);
        return { position: { x: 1, y: 0.2, z: 0 }, rotation: quarter };
      },
    }),
  });
  const [tread, ...rest] = HumanSupportStepPlants.surfaces(
    context([
      affordance("tread", "surface", { width: 0.4, depth: 1 }),
      affordance("rail", "handle", {}),
      {
        ...affordance("wall", "surface", { width: 0.4, depth: 1 }),
        frame: {
          ...affordance("wall", "surface", {}).frame,
          rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        },
      },
    ]),
    "escalator",
    0.5,
  );
  TestValidator.predicate(
    "the surfaces",
    rest.length === 0 &&
      read[0] === 3.5 &&
      vclose(tread!.origin, { x: 1.5, y: 0.2, z: 0 }, ROUNDING) &&
      tread!.width === 0.4 &&
      tread!.depth === 1,
  );
  TestValidator.predicate(
    "a local point",
    vclose(
      HumanSupportStepPlants.local(tread!, { x: 1.5, y: 0.25, z: 0.3 }),
      { x: -0.3, y: 0.05, z: 0 },
      ROUNDING,
    ),
  );
  TestValidator.equals(
    "held",
    [
      HumanSupportStepPlants.holds(tread!, { x: 1.5, y: 0.25, z: 0.1 }),
      HumanSupportStepPlants.holds(tread!, { x: 1.5, y: 0.35, z: 0.1 }),
      HumanSupportStepPlants.holds(tread!, { x: 1.5, y: 0.25, z: 0.3 }),
    ],
    [true, false, false],
  );
  const [open] = HumanSupportStepPlants.surfaces(
    context([affordance("deck", "surface", {})]),
    "deck",
    0,
  );
  TestValidator.predicate(
    "unbounded",
    HumanSupportStepPlants.holds(open!, { x: 50, y: 0.2, z: -40 }),
  );
  const dynamic: HumanSupportStepPlants.ISurfacesContext = {
    start: 3,
    prop: () => ({
      prop: {
        affordances: [
          affordance("stepFace", "surface", { width: 0.2, depth: 0.5 }),
        ],
      },
      frame: () => {
        throw new Error("The displayed material site owns this face");
      },
      site: (id: string, seconds: number) => {
        if (id !== "stepFace")
          throw new Error("Expected the moving deck surface");
        return { position: { x: seconds, y: 0.2, z: 0 }, rotation: quarter };
      },
    }),
  };
  for (const at of [1.7, 0.3, 1.7]) {
    const [face] = HumanSupportStepPlants.surfaces(dynamic, "deck", at);
    TestValidator.predicate(
      `read the displayed material at ${at} s`,
      face?.id === "stepFace" &&
        face.origin.x === at + 3 &&
        face.width === 0.2 &&
        face.depth === 0.5,
    );
  }
  const deck: HumanSupportStepPlants.ISurface = {
    ...tread!,
    width: 0.2,
    depth: 0.5,
  };
  const sole: IAutoMovieVector3[] = [0.02, 0.12].flatMap(
    (x: number): IAutoMovieVector3[] =>
      [-0.1, 0.1].map(
        (z: number): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(
            deck.origin,
            AutoMovieEngineQuaternion.rotateVector(deck.rotation, { x, y: 0, z }),
          ),
      ),
  );
  const shift: IAutoMovieVector3 | null = HumanSupportStepPlants.fit(
    deck,
    sole,
  );
  TestValidator.predicate(
    "the yawed footprint's outside toe moves inward in its material frame",
    shift !== null &&
      vclose(shift, { x: 0, y: 0, z: 0.02 }, ROUNDING) &&
      HumanSupportStepPlants.fit({ ...deck, width: 0.09 }, sole) === null,
  );
}
