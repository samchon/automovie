import { createHumanBodySurfaceMush } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyMushSurface } from "../internal/humanBodyMushSurface";
import { nclose } from "../internal/predicates";

/**
 * Rest detail transports in local smoothed frames without changing fixed skin.
 * Expected positions come from a rigid transform and the tetrahedron's
 * complete-graph Laplacian, not from a second implementation of the filter.
 *
 * Scenarios:
 * 1. A shared Z quarter-turn plus translation reproduces (-y+.3,x-.2,z+.1).
 * 2. Doubling the tetrahedron leaves its frame directions unchanged. One
 *    sweep yields (4/3)R+(1/6)sum(R); a half mask averages that with 2R.
 * 3. A one-bone vertex next to mixed vertices stays at its input posed point,
 *    including duplicate influence slots and serialized weights just under one.
 * 4. Common weight scaling, duplicate mixed slots and input aliasing preserve
 *    the same policy; preparation owns its topology and option snapshot.
 * 5. Open rims are held, while the cone apex may move. Collapsed rest, posed
 *    and tangent frames, isolated samples and empty populations stay finite.
 * 6. A weak mixed mask gains its neighbour's mask at the declared ring decay.
 */
export const test_human_body_surface_mush = (): void => {
  const config = { iterations: 1, blendWidth: 0.5, spreadRings: 1, spreadDecay: 0.7 };
  const surface = humanBodyMushSurface();
  const rest = surface.positions;
  const moved = rest.map((value, i) => i % 3 === 0 ? -rest[i + 1] + 0.3 : i % 3 === 1 ? rest[i - 1] - 0.2 : value + 0.1);
  const rigid = createHumanBodySurfaceMush(surface, config)(rest, moved);
  TestValidator.predicate("rigid frame transport", rigid.every((value, i) => nclose(value, moved[i], 1e-12)));
  const doubled = rest.map((value) => 2 * value);
  const full = createHumanBodySurfaceMush(surface, { ...config, spreadRings: 0 })(rest, doubled);
  const half = createHumanBodySurfaceMush(surface, { ...config, blendWidth: 1, spreadRings: 0 })(rest, doubled);
  TestValidator.predicate("complete graph full mask", [1 / 6, 4 / 3, 1 / 6].every((value, k) => nclose(full[3 + k], value, 1e-12)));
  TestValidator.predicate("complete graph partial mask", [1 / 12, 5 / 3, 1 / 12].every((value, k) => nclose(half[3 + k], value, 1e-12)));
  const saturated = createHumanBodySurfaceMush(surface, { ...config, blendWidth: 0.25 })(rest, doubled);
  TestValidator.predicate("mask saturates at one", saturated.every((value, i) => nclose(value, full[i], 1e-12)));
  for (const weights of [[1, 0, 0, 0], [0.5, 0.5, 0, 0], [0.9999999, 0, 0, 0]]) {
    const held = humanBodyMushSurface();
    held.skin.boneIndices.splice(0, 4, 0, 0, 1, 1);
    held.skin.weights.splice(0, 4, ...weights);
    const result = createHumanBodySurfaceMush(held, config)(rest, doubled);
    TestValidator.predicate("a single distinct bone stays fixed beside a mixed vertex", [0, 1, 2].every((k) => result[k] === doubled[k]));
  }
  const scaled = humanBodyMushSurface();
  scaled.skin.weights = scaled.skin.weights.map((weight) => weight * 0.9999999);
  const scaledResult = createHumanBodySurfaceMush(scaled, config)(rest, doubled);
  TestValidator.predicate("common influence scale", scaledResult.every((value, i) => nclose(value, full[i], 1e-12)));
  const duplicate = humanBodyMushSurface();
  duplicate.skin.boneIndices = Array.from({ length: 4 }, () => [0, 0, 1, 1]).flat();
  duplicate.skin.weights.fill(0.25);
  const duplicateResult = createHumanBodySurfaceMush(duplicate, config)(rest, doubled);
  TestValidator.predicate("duplicate mixed slots", duplicateResult.every((value, i) => nclose(value, full[i], 1e-12)));
  const filter = createHumanBodySurfaceMush(surface, config);
  TestValidator.predicate("aliased input is identity", filter(rest, rest) === rest);
  TestValidator.predicate("distinct rest samples are identity", filter(rest, rest.slice()).every((value, i) => nclose(value, rest[i], 1e-12)));
  const fixed = humanBodyMushSurface();
  fixed.skin.weights = Array.from({ length: 4 }, () => [1, 0, 0, 0]).flat();
  TestValidator.predicate("no active samples", createHumanBodySurfaceMush(fixed, config)(rest, doubled) === doubled);
  fixed.skin.weights.fill(0);
  TestValidator.predicate("unbound numerical samples are fixed", createHumanBodySurfaceMush(fixed, config)(rest, doubled) === doubled);
  const empty = humanBodyMushSurface();
  empty.positions = []; empty.indices = []; empty.skin.weights = []; empty.skin.boneIndices = [];
  const emptyPosed: number[] = [];
  TestValidator.predicate("empty numerical population", createHumanBodySurfaceMush(empty, config)([], emptyPosed) === emptyPosed);
  const tiny = humanBodyMushSurface(); tiny.skin.weights = Array.from({ length: 4 }, () => [1, Number.MIN_VALUE, 0, 0]).flat();
  TestValidator.predicate("unresolvable deficit has zero mask", createHumanBodySurfaceMush(tiny, config)(rest, doubled) === doubled);
  const mutable = humanBodyMushSurface();
  const options = { ...config, spreadRings: 0 };
  const prepared = createHumanBodySurfaceMush(mutable, options);
  options.iterations = 2; mutable.indices.length = 0; mutable.skin.weights.fill(0);
  TestValidator.predicate("preparation owns topology and policy", prepared(rest, doubled).every((value, i) => nclose(value, full[i], 1e-12)));
  const twice = createHumanBodySurfaceMush(surface, { ...config, iterations: 2, spreadRings: 0 })(rest, doubled);
  TestValidator.predicate("a new policy compiles anew", [2 / 9, 10 / 9, 2 / 9].every((value, k) => nclose(twice[3 + k], value, 1e-12)));
  const cone = humanBodyMushSurface(true);
  const coneDoubled = cone.positions.map((value) => value * 2);
  const coneOut = createHumanBodySurfaceMush(cone, config)(cone.positions, coneDoubled);
  TestValidator.predicate("open rim stays held", coneOut.slice(0, 12).every((value, i) => value === coneDoubled[i]));
  TestValidator.predicate("interior cone apex restores detail", nclose(coneOut[13], 1.5, 1e-12));
  const collapsed = rest.map(() => 0);
  TestValidator.predicate("collapsed rest fallback", filter(collapsed, doubled).every((value, i) => value === doubled[i]));
  TestValidator.predicate("collapsed posed fallback", filter(rest, collapsed).every((value) => value === 0));
  const tangent = rest.slice(); tangent.splice(3, 3, ...tangent.slice(0, 3));
  const tangentOut = filter(rest, tangent);
  TestValidator.predicate("collapsed tangent fallback", tangentOut.slice(0, 6).every((value, i) => value === tangent[i]));
  const lonely = humanBodyMushSurface();
  lonely.positions.push(0.5, 0.5, 0.5); lonely.skin.boneIndices.push(0, 1, 0, 0); lonely.skin.weights.push(0.5, 0.5, 0, 0);
  const lonelyPosed = [...doubled, 0.7, 0.6, 0.5];
  const lonelyOut = createHumanBodySurfaceMush(lonely, config)(lonely.positions, lonelyPosed);
  TestValidator.predicate("isolated sample fallback", lonelyOut.slice(-3).every((value, i) => value === lonelyPosed[12 + i]));
  const weak = humanBodyMushSurface(); weak.skin.weights.splice(0, 4, 0.9, 0.1, 0, 0);
  const beforeSpread = createHumanBodySurfaceMush(weak, { ...config, spreadRings: 0 })(rest, doubled);
  const afterSpread = createHumanBodySurfaceMush(weak, config)(rest, doubled);
  TestValidator.predicate("weak mask before spreading", nclose(beforeSpread[0], 1.9, 1e-12));
  TestValidator.predicate("mask ring uses declared decay", nclose(afterSpread[0], 1.65, 1e-12));
  TestValidator.predicate("inputs remain caller-owned", rest.every((value, i) => value === surface.positions[i]) && doubled.every((value, i) => value === 2 * rest[i]));
};
