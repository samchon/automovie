import type { IExternalModelHierarchyFixture } from "./IExternalModelHierarchyFixture";
import type { IExternalModelHierarchyNode } from "./IExternalModelHierarchyNode";
import { createExternalModelHierarchyFixture } from "./createExternalModelHierarchyFixture";

/** Replace the existing fixture's nodes with the original descending parent chain and select its final root. */
export const createExternalModelHierarchyChain: (
  length: number,
) => IExternalModelHierarchyFixture = (
  length: number,
): IExternalModelHierarchyFixture => {
  const fixture: IExternalModelHierarchyFixture =
    createExternalModelHierarchyFixture();
  fixture.document.nodes = Array.from(
    { length },
    (_: unknown, index: number): IExternalModelHierarchyNode =>
      index === 0 ? { mesh: 0 } : { children: [index - 1] },
  );
  fixture.document.skins = [];
  fixture.document.scenes = [{ nodes: [length - 1] }];
  return fixture;
};
