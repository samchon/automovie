/**
 * Logical gallery observations and requested effects, owned by a unit. No DOM,
 * native dialog, layout method, browser or SDK object is created or replaced.
 */
export function createGalleryHostFacts(supportsModal = true) {
  const facts = {
    open: false,
    locked: false,
    focused: null as string | null,
    building: 0,
    view: 0,
    effects: [] as string[],
  };
  const host = {
    supportsModal,
    isOpen: () => facts.open,
    renderBuilding: (index: number) => { facts.building = index; facts.effects.push(`building:${index}`); },
    renderView: (building: number, view: number) => { facts.building = building; facts.view = view; facts.effects.push(`view:${building}:${view}`); },
    showModal: () => { facts.open = true; facts.effects.push("open"); },
    closeModal: () => { facts.open = false; facts.effects.push("close"); },
    setLocked: (locked: boolean) => { facts.locked = locked; facts.effects.push(`lock:${locked}`); },
    focus: (opener: string) => { facts.focused = opener; facts.effects.push(`focus:${opener}`); },
    disposeContents: () => { facts.effects.push("dispose"); },
  };
  return { facts, host };
}
