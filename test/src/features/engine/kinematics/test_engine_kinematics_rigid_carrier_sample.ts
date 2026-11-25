import { RigidCarrierSample } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPlayback,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Carrier metadata only follows the actual model and its original pair of
 * source readers. The adapted prop keeps it only while both wrappers match.
 *
 * Scenarios:
 *
 * 1. The matching pair transfers copied interval bounds and a paired playback.
 *    Checking ownership does not evaluate any callback.
 * 2. An equivalent but differently owned model or socket reader is refused.
 * 3. Replacing either adapted wrapper removes access to both domains and playback
 *    while leaving an independent adapter's metadata in place.
 */
export function test_engine_kinematics_rigid_carrier_sample(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const transform: IAutoMovieTransform = {
    translation: frame.position,
    rotation: frame.rotation,
    scale: { x: 1, y: 1, z: 1 },
  };
  const model: { id: string } = { id: "lift" };
  let calls: number = 0;
  const motion = (): IAutoMovieRigidTransform => {
    ++calls;
    return frame;
  };
  const point = (): IAutoMovieTransform => {
    ++calls;
    return transform;
  };
  const interval: {
    from: number;
    to: number;
    contains: RigidCarrierSample.IHold["contains"];
  } = {
    from: 0.5,
    to: 1.25,
    contains: (seconds: number): boolean => seconds >= 0.5 && seconds < 1.25,
  };
  const playback: IAutoMovieMotionPlayback<RigidCarrierSample.IRead> = {
    sample: (): RigidCarrierSample.IRead => {
      ++calls;
      return { frame, point: (): IAutoMovieTransform => transform };
    },
  };
  const source: RigidCarrierSample.IBinding = RigidCarrierSample.bind(
    model,
    motion,
    point,
    [interval],
    playback,
  );
  const prop = (): IAutoMovieMotionHumanProp &
    RigidCarrierSample.IAdaptable => ({
    subject: "lift",
    frame,
    points: {},
    motion: (): IAutoMovieRigidTransform => frame,
    point: (): IAutoMovieMotionHumanProp.IPlacedPoint => ({
      point: frame.position,
      normal: { x: 0, y: 1, z: 0 },
    }),
  });
  const accepted = prop();
  RigidCarrierSample.adapt(accepted, model, source.motion, source.point);
  interval.to = 99;
  const hold: RigidCarrierSample.IHold | undefined =
    RigidCarrierSample.holds(accepted)?.[0];
  TestValidator.predicate(
    "the clock and interval are borrowed without reading motion",
    hold !== undefined &&
      hold !== interval &&
      hold.from === 0.5 &&
      hold.to === 1.25 &&
      hold.contains(0.5) &&
      !hold.contains(1.25) &&
      RigidCarrierSample.playback(accepted) === playback &&
      calls === 0,
  );

  const wrongModel = prop();
  const wrongSocket = prop();
  RigidCarrierSample.adapt(
    wrongModel,
    { ...model },
    source.motion,
    source.point,
  );
  RigidCarrierSample.adapt(
    wrongSocket,
    model,
    source.motion,
    (): IAutoMovieTransform => transform,
  );
  TestValidator.predicate(
    "a different identity or source reader carries no domains",
    RigidCarrierSample.holds(wrongModel) === undefined &&
      RigidCarrierSample.playback(wrongSocket) === undefined &&
      calls === 0,
  );

  const changedPoint = prop();
  const independent = prop();
  RigidCarrierSample.adapt(changedPoint, model, source.motion, source.point);
  RigidCarrierSample.adapt(independent, model, source.motion, source.point);
  accepted.motion = (): IAutoMovieRigidTransform => frame;
  changedPoint.point = (): undefined => undefined;
  TestValidator.predicate(
    "either wrapper replacement revokes its own adapter's metadata",
    RigidCarrierSample.holds(accepted) === undefined &&
      RigidCarrierSample.playback(accepted) === undefined &&
      RigidCarrierSample.holds(changedPoint) === undefined &&
      RigidCarrierSample.playback(changedPoint) === undefined &&
      RigidCarrierSample.holds(independent)?.[0] === hold &&
      calls === 0,
  );
}
