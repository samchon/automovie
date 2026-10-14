/**
 * Logical gallery observations and requested effects, owned by a unit. No DOM, native dialog, layout method, browser or SDK object is created or replaced.
 */
export function createGalleryHostFacts(supportsModal: boolean = true): {
  facts: {
    open: boolean;
    locked: boolean;
    focused: string | null;
    building: number;
    view: number;
    effects: string[];
  };
  host: import("../../../../website/src/gallery/IGalleryHost").IGalleryHost<string>;
} {
  const facts: {
    open: boolean;
    locked: boolean;
    focused: string | null;
    building: number;
    view: number;
    effects: string[];
  } = {
    open: false,
    locked: false,
    focused: null as string | null,
    building: 0,
    view: 0,
    effects: [] as string[],
  };
  const host: import("../../../../website/src/gallery/IGalleryHost").IGalleryHost<string> =
    {
      supportsModal,
      isOpen: (): boolean => facts.open,
      renderBuilding: (index: number): void => {
        facts.building = index;
        facts.effects.push(`building:${index}`);
      },
      renderView: (building: number, view: number): void => {
        facts.building = building;
        facts.view = view;
        facts.effects.push(`view:${building}:${view}`);
      },
      showModal: (): void => {
        facts.open = true;
        facts.effects.push("open");
      },
      closeModal: (): void => {
        facts.open = false;
        facts.effects.push("close");
      },
      setLocked: (locked: boolean): void => {
        facts.locked = locked;
        facts.effects.push(`lock:${locked}`);
      },
      focus: (opener: string): void => {
        facts.focused = opener;
        facts.effects.push(`focus:${opener}`);
      },
      disposeContents: (): void => {
        facts.effects.push("dispose");
      },
    };
  return { facts, host };
}
