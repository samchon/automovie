import { SceneBuild } from "./SceneBuild";

/** Compile the scene authoring boundary with the website's ordinary type check. */
export function checkSceneActionInputs(): void {
  SceneBuild.act("stand");
  SceneBuild.act("typeText", { keyboard: "keyboard", text: "hello" });
  SceneBuild.act("gloveCatch", { partner: "pitcher", ball: "baseball" });
  SceneBuild.act("sit", { seat: SceneBuild.seat("chair") });
  SceneBuild.act("getIn", {
    seat: SceneBuild.seat("car", "driverSeat"),
    through: { $aperture: "car", id: "driverAperture" },
  });
  SceneBuild.mutual("shoulderClasp", { one: "a", other: "b" }, { hold: 0.8 });

  SceneBuild.act("typeText", {
    // @ts-expect-error Text entry names the keyboard prop.
    keyboard: { at: { x: 0, y: 1, z: 0 }, yaw: 0 },
    text: "hello",
  });
  // @ts-expect-error Dressing requires the garment prop.
  SceneBuild.act("dress", { item: "hat" });
  SceneBuild.act("fosburyFlop", {
    to: { x: 1, y: 0.7, z: 0 },
    // @ts-expect-error The high jump names the bar prop.
    bar: 1.2,
    on: "mat",
  });
  // @ts-expect-error Stirring requires the tool prop.
  SceneBuild.act("stir", {
    on: { kind: "prop", subject: "pan", point: "inside" },
  });
  // @ts-expect-error Rung spacing is read from the ladder prop.
  SceneBuild.act("climbLadder", { ladder: "ladder", rungs: 6, spacing: 0.3 });
  // @ts-expect-error The kick names the ball prop.
  SceneBuild.act("kickRight", { ball: SceneBuild.to(0, 2) });
  // @ts-expect-error The built-in catch requires the ball.
  SceneBuild.act("catchObject", { from: "pitcher", hands: "two" });
  // @ts-expect-error The registered catch still requires the ball.
  SceneBuild.act("twoHandCatch", { from: "pitcher" });
  // @ts-expect-error A required-parameter law cannot drop its whole input object.
  SceneBuild.act("gloveCatch");
  // @ts-expect-error The export alias is registered as armPhrase.
  SceneBuild.act("phrase");
  // @ts-expect-error A seat reference cannot supply a ball prop.
  SceneBuild.act("kickRight", { ball: SceneBuild.seat("chair") });
  // @ts-expect-error A mutual cast must fill the law's roles.
  SceneBuild.mutual("shoulderClasp", { one: "a", two: "b" }, { hold: 0.8 });

  const raw: SceneBuild.Action = {
    name: "kickRight",
    // @ts-expect-error Literal action records also require the named ball.
    params: { ball: SceneBuild.to(0, 2) },
  };
  void raw;
}
