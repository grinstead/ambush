type KeyPressState = {
  danglingCount: number;
  heldSince: null | number;
};

/**
 * Keeps track of the IO events to that element, specifically keyboard and mouse events.
 */
export class InputManager<Action extends string> {
  inFocus: boolean;
  private readonly _presses = new Map<string, KeyPressState>();
  private readonly _actionToKeys = new Map<Action, Array<string>>();
  private readonly _keyToAction = new Map<string, Action>();

  /**
   * Creates an InputManager and immediately starts tracking inputs to the given dom element
   * @param domElement - The dom element to track
   */
  constructor(readonly dom: HTMLElement) {
    this.inFocus = document.activeElement === dom;

    dom.addEventListener("keydown", (e) => {
      this.onKeyChanged(e, true);
    });

    dom.addEventListener("keyup", (e) => {
      this.onKeyChanged(e, false);
    });

    dom.onblur = () => {
      this._presses.clear();
      this.inFocus = false;
    };

    dom.onfocus = () => {
      this._presses.clear();
      this.inFocus = true;
    };
  }

  setKeysForAction(action: Action, keys?: Array<string>) {
    const { _actionToKeys: actionToKeys, _keyToAction: keyToAction } = this;

    actionToKeys.get(action)?.forEach((key) => {
      keyToAction.delete(key);
    });

    if (keys?.length) {
      actionToKeys.set(action, keys);
      keys.forEach((key) => {
        keyToAction.set(key, action);
      });
    } else {
      actionToKeys.delete(action);
    }
  }

  /**
   * Returns whether the action is currently triggered
   */
  isPressed(action: Action): boolean {
    const presses = this._presses;

    return !!this._actionToKeys.get(action)?.some((key) => {
      const obj = presses.get(key);
      if (obj) {
        obj.danglingCount = 0;
        return obj.heldSince != null;
      } else {
        return false;
      }
    });
  }

  numPresses(action: Action) {
    const keys = this._actionToKeys.get(action);
    if (!keys) return 0;

    const presses = this._presses;
    return keys.reduce((count, key) => {
      const obj = presses.get(key);
      if (obj) {
        const newCount = count + obj.danglingCount;
        obj.danglingCount = 0;
        return newCount;
      } else {
        return count;
      }
    }, 0);
  }

  /**
   * An easy way to test if the user wants to go left or right
   * @param negAction - If this is held down, returns -1
   * @param posAction - If this is held down, returns 1
   * @returns -1 if negAction is pressed, 1 if posAction is pressed, 0 if neither or both is pressed
   */
  getSignOfAction(negAction: Action, posAction: Action) {
    // @ts-expect-error using bool to number implicit conversion, mostly for fun
    return (this.isPressed(posAction) | 0) - (this.isPressed(negAction) | 0);
  }

  private onKeyChanged(event: KeyboardEvent, isPressed: boolean) {
    const key = event.key;
    if (this._keyToAction.has(key)) {
      event.preventDefault();
      event.stopPropagation();
    }

    const presses = this._presses;
    const object = presses.get(key);
    if (isPressed) {
      if (object) {
        object.heldSince ??= Date.now();
        object.danglingCount++;
      } else {
        presses.set(key, {
          heldSince: Date.now(),
          danglingCount: 1,
        });
      }
    } else if (object) {
      object.heldSince = null;
    }
  }
}
