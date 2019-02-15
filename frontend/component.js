export default class Component {
  constructor({ element }) {
    this._element = element;
    this._props = {};
    this._state = {};

    this._callbacksMap = {};
  }

  updateProps(props) {
    this._props = {
      ...this._props,
      ...props,
    };

    this._updateView();
  }

  _updateState(state) {
    this._state = {
      ...this._state,
      ...state,
    };

    this._updateView();
  }

  _updateView() {
    console.log('add updateView method');
  }

  on(eventName, selector, callback) {
    this._element.addEventListener(eventName, (e) => {
      const elementToDelegate = e.target;

      if (!elementToDelegate.closest(selector)) {
        return;
      }

      callback(e);
    });
  }

  subscribe(eventName, callback) {
    if (!this._callbacksMap[eventName]) {
      this._callbacksMap[eventName] = [];
    }

    this._callbacksMap[eventName].push(callback);
  }

  emit(eventName, ...args) {
    if (!(eventName in this._callbacksMap)) {
      return;
    }

    this._callbacksMap[eventName].forEach((callback) => {
      callback(...args);
    });
  }

  _getElement(selector, parentElement) {
    const parent = parentElement || this._element;

    return parent.querySelector(`[data-element=${selector}]`);
  }

  _getComponent(selector) {
    return this._element.querySelector(`[data-component=${selector}]`);
  }
}
