class OptionsUI {
  constructor(scene) {
    this.scene = scene;
    this.domMenu = null;
    this.sections = [];
    this.currentOptions = [];
    this.selectedTabIndex = 0;
    this.selectedOptionIndex = 0;
    this.maxOptions = 0;
    this.isInteracting = false;
    this.interactingType = null;
    this.activeDropdownList = null;
    this.activeDropdownItems = [];
    this.dropdownIndex = 0;
    this.dropdownMax = 0;
    this.isBinding = false;
    this.bindingAction = null;
    this.bindingSlot = 0;
    this.lastInputDevice = "mouse";
    this.lastMouseX = -1;
    this.lastMouseY = -1;

    // ponytail: managers fusionados en objetos literales. Los submódulos reciben un objeto
    // con la misma interfaz que antes (parent + estado), así no hay que tocar ninguno.
    this.animations = {
      parent: this,
      scene: this.scene,
      checkbox: new window.CheckboxAnimations({ parent: this, scene: this.scene }),
      text: new window.TextAnimations({ parent: this, scene: this.scene }),
      clearAnimations() {
        this.checkbox.clear();
        this.text.clear();
      },
    };
    this.input = {
      core: new window.InputCore(this),
      interactor: new window.InputInteractor(this),
      keybinder: new window.InputKeybinder(this),
    };
    this.icons = {
      parent: this,
      activeIcon: null,
      iconStates: {},
      cachedLastFrames: {},
    };
    this.icons.renderer = new window.IconsRenderer(this.icons);
    this.icons.animator = new window.IconsAnimator(this.icons);
    this.tabs = {
      parent: this,
      bgInactive: "#1e1e1e",
      bgActive: "#3a3a3a",
      arrowFrame: 0,
      arrowTimer: 0,
    };
    this.tabs.renderer = new window.TabsRenderer(this.tabs);
    this.tabs.animator = new window.TabsAnimator(this.tabs);
    this.builder = {
      dom: new window.UIDomCreator(this),
      renderer: new window.UIRenderer(this),
      events: new window.UIEvents(this),
      highlight: new window.UIHighlight(this),
    };
  }

  build(sectionsData) {
    this.domMenu = this.scene.add.dom(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
    );
    this.sections = sectionsData;
    this._initBuild();
  }

  _initBuild() {
    this.selectedTabIndex = 0;

    const currentSection = this.sections[0];
    let sectionId = "";

    // Buscar el identificador basándose primariamente en la propiedad "id" del nuevo JSON
    if (currentSection && currentSection.id) {
      sectionId = currentSection.id;
    } else if (currentSection && currentSection.option) {
      // Fallback por compatibilidad con formatos antiguos
      sectionId = currentSection.option;
    } else {
      sectionId = "unknown";
    }

    this.builder.dom.createDOM(sectionId);
    this.tabs.renderer.init();
  }

  handleInput(e) {
    if (!this.domMenu) return true;
    return this.input.core.handleKeyboard(e);
  }

  destroy() {
    this.animations.clearAnimations();
    if (this.icons && this.icons.animator) this.icons.animator.destroy();
    if (this.tabs && this.tabs.animator) this.tabs.animator.destroy();
    if (this.domMenu) this.domMenu.destroy();
  }
}
window.OptionsUI = OptionsUI;
