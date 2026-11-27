import { AutoMovieArchetypeHorse } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanPropFrame, prepareMountTread } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * In the stored m-average profile the left foot and toes at neutral extend
 * from -33.152189578 to +90.803873460 mm laterally about the ball. In an
 * aperture with inner faces at ±70 mm and full foot height and depth, subtract
 * those two projections from the respective iron positions. The left and
 * right feet give mirrored lateral targets and keep their exact anatomical
 * ball and ankle relation. A 90 mm opening and an off-plate depth refuse.
 * The original 660 mm equine drop and measured classic iron profile also
 * admit the recorded material-local left ball interval in the actual iron.
 */
export async function test_motions_mounted_tread(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const pose: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: Transform.of(
      { x: 1, y: 0.2, z: -2 },
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    ),
    joints: [],
  };
  const plate: prepareMountTread.IPlate = {
    pose: origin,
    shape: {
      id: "physical-plate",
      kind: "box",
      material: "iron",
      halfExtents: { x: 0.07, y: 0.005, z: 0.025 },
      transform: { ...origin, position: { x: 0, y: -0.005, z: 0 } },
    },
  };
  const rails = (opening: number): prepareMountTread.IPlate[] =>
    [-1, 1].map((sign: number): prepareMountTread.IPlate => ({
      pose: origin,
      shape: {
        id: sign < 0 ? "inner" : "outer",
        kind: "box",
        material: "iron",
        halfExtents: { x: 0.005, y: 0.08, z: 0.16 },
        transform: {
          ...origin,
          position: { x: sign * (opening / 2 + 0.005), y: 0.08, z: -0.05 },
        },
      },
    }));
  const input: prepareMountTread.IInput = {
    body,
    side: "left",
    pose,
    plate,
    iron: rails(0.14),
    rotation: origin.rotation,
    depth: 0,
  };
  const left: readonly prepareMountTread.ICandidate[] = prepareMountTread(input);
  const right: readonly prepareMountTread.ICandidate[] = prepareMountTread({
    ...input,
    side: "right",
  });
  const a: prepareMountTread.ICandidate = left[0]!;
  const b: prepareMountTread.ICandidate = right[0]!;
  const pivot: IAutoMovieVector3 = Vector3.add(
    a.ankle.position,
    Quaternion.rotateVector(a.ankle.rotation, a.contact),
  );
  // The half-space edge is located by GJK's native 1 nm distance bound.
  const precision: number = 1e-9 + 64 * Number.EPSILON;
  const lower: number = -0.07 + 0.033152189578;
  const upper: number = 0.07 - 0.09080387346;
  TestValidator.predicate(
    "the actual foot profile fits only after its ball moves transversely",
    left.length === 1 &&
      right.length === 1 &&
      nclose(a.range[0], lower, precision) &&
      nclose(a.range[1], upper, precision) &&
      nclose(a.ball.x, (lower + upper) / 2, precision) &&
      nclose(b.ball.x, -a.ball.x, precision) &&
      nclose(b.range[0], -a.range[1], precision) &&
      nclose(b.range[1], -a.range[0], precision) &&
      nclose(Vector3.distance(pivot, a.ball), 0, precision) &&
      Quaternion.angle(a.ankle.rotation, input.rotation) === 0,
  );
  TestValidator.predicate(
    "a narrow real opening and a point past the finite plate both refuse",
    prepareMountTread({ ...input, iron: rails(0.09) }).length === 0 &&
      prepareMountTread({ ...input, depth: 0.03 }).length === 0,
  );

  const selected: number = -0.035;
  const exact: readonly prepareMountTread.ICandidate[] = prepareMountTread({
    ...input,
    x: selected,
  });
  TestValidator.predicate(
    "a solved abscissa is kept exactly, and a point in the steel is refused",
    exact.length === 1 &&
      exact[0]!.ball.x === selected &&
      prepareMountTread({ ...input, x: 0 }).length === 0,
  );

  // The tilted heel is below the plane only behind the finite front plate.
  // Pitch around the ball sends only points behind z=0 below y=0.
  const raised: readonly prepareMountTread.ICandidate[] = prepareMountTread({
    ...input,
    x: selected,
    plate: {
      ...plate,
      shape: {
        ...plate.shape,
        transform: { ...origin, position: { x: 0, y: -0.005, z: 0.025 } },
      },
    },
    rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -4),
  });
  const tilted: prepareMountTread.ICandidate = raised[0]!;
  const heel: IAutoMovieVector3 = Vector3.add(
    tilted.ankle.position,
    Quaternion.rotateVector(
      tilted.ankle.rotation,
      body.surfaces.sockets.heelLeft.point,
    ),
  );
  TestValidator.predicate(
    "the finite plate permits a heel behind it but refuses actual penetration",
    raised.length === 1 &&
      heel.y < -precision &&
      heel.z < 0 &&
      prepareMountTread({ ...input, x: selected, y: -0.006 }).length === 0,
  );

  const horse: ReturnType<typeof AutoMovieArchetypeHorse.create> = AutoMovieArchetypeHorse.create(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    1028,
  );
  const tack: IAutoMovieMotionHumanProp = HumanObject.prop("horse", horse, origin);
  const site: IAutoMovieAffordance = horse.affordance("leftStirrup");
  const local: IAutoMovieRigidTransform = HumanPropFrame.relative(
    { position: site.frame.translation, rotation: site.frame.rotation },
    tack.frame,
  );
  const metal: readonly IAutoMoviePhysicalShape[] = tack.shapes ?? [];
  const actual: IAutoMoviePhysicalShape | undefined = metal.find(
    (part: IAutoMoviePhysicalShape): boolean => part.id === "stirrup-left",
  );
  if (actual?.kind !== "box") throw new Error("The named stirrup has no tread");
  const stock: readonly prepareMountTread.ICandidate[] = prepareMountTread({
    ...input,
    plate: { pose: local, shape: actual },
    iron: metal
      .filter((part: IAutoMoviePhysicalShape): boolean =>
        part.id.startsWith("stirrup-left-"),
      )
      .map((shape: IAutoMoviePhysicalShape) => ({ pose: local, shape })),
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 7),
  });
  // The original native evidence measured the same prefix and suffix at
  // 10 nm bracket resolution. Both independently rounded ends may differ.
  const observation: number = 2e-8;
  TestValidator.predicate(
    "the authored classic iron keeps its finite aperture and pad contact",
    nclose(actual.halfExtents.x * 2, 0.121006522055, precision) &&
      stock.some(
        (foot: prepareMountTread.ICandidate): boolean =>
          nclose(foot.range[0], -0.049634625008, observation) &&
          nclose(foot.range[1], -0.021864660110, observation) &&
          foot.range[0] < -0.036183395673 &&
          foot.range[1] > -0.036183395673 &&
          foot.ball.y === 0 &&
          foot.ball.z === 0,
      ),
  );
}
