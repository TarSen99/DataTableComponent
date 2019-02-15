import Component from '../component.js';

export default class Pagination extends Component {
  constructor({ element, props }) {
    super({ element });

    this.updateProps(props);

    this.on('click', '[data-element="page-button"]', (event) => {
      const currentButton = event.target.closest('[data-element="page-button"]');
      const buttonValue = +currentButton.dataset.value;

      this.emit('page-changed', buttonValue);
    });

    this.on('click', '[data-element="switch-button"]', (event) => {
      const currentButton = event.target.closest('[data-element="switch-button"]');
      const buttonValue = +currentButton.dataset.value;
      const { currentPage } = this._props;

      const newPage = this._calculateNewPageValue(buttonValue);

      if (newPage === currentPage) {
        return;
      }

      this.emit('page-changed', newPage);
    });
  }

  _toggleArrowButtons() {
    const leftPageButton = this._element.querySelector(
      '[data-element="switch-button"][data-value="-1"]',
    );
    const rightPageButton = this._element.querySelector(
      '[data-element="switch-button"][data-value="1"]',
    );

    const { currentPage, buttonsCount } = this._props;

    const minPage = 0;
    const maxPage = Math.max(buttonsCount - 1, 0);

    if (minPage === maxPage) {
      leftPageButton.disabled = true;
      rightPageButton.disabled = true;
      return;
    }

    if (currentPage === minPage) {
      leftPageButton.disabled = true;
      rightPageButton.disabled = false;
      return;
    }

    if (currentPage === maxPage) {
      leftPageButton.disabled = false;
      rightPageButton.disabled = true;
      return;
    }

    leftPageButton.disabled = false;
    rightPageButton.disabled = false;
  }

  _calculateNewPageValue(buttonValue) {
    const { currentPage, buttonsCount } = this._props;

    let newPage = currentPage + buttonValue;

    newPage = Math.min(newPage, buttonsCount - 1);
    newPage = Math.max(newPage, 0);

    return newPage;
  }

  _changeCurrentPageButton() {
    this._clearButtonsStyle();
    this._setActiveButtonStyle();
    this._toggleArrowButtons();
  }

  _clearButtonsStyle() {
    const buttons = [
      ...this._element.querySelectorAll('[data-element="page-button"]'),
    ];

    buttons.forEach((button) => {
      button.classList.remove('button-pag--active');
    });
  }

  _setActiveButtonStyle() {
    const { currentPage } = this._props;

    const button = this._element.querySelector(
      `[data-element="page-button"][data-value="${currentPage}"]`,
    );

    if (!button) {
      return;
    }

    button.classList.add('button-pag--active');
  }

  _updateView() {
    this._render();

    const { phonesLength, itemsPerPage, currentPage } = this._props;

    let minItemValue = currentPage * itemsPerPage + 1;
    let maxItemValue = minItemValue + itemsPerPage - 1;

    maxItemValue = Math.min(maxItemValue, phonesLength);
    minItemValue = Math.min(maxItemValue, minItemValue);

    const minText = this._getElement('min-value');
    const maxText = this._getElement('max-value');
    const totalText = this._getElement('total-value');

    minText.textContent = minItemValue;
    maxText.textContent = maxItemValue;
    totalText.textContent = phonesLength;

    this._changeCurrentPageButton();
}

  _getButtonsHTML() {
    const { buttonsCount } = this._props;
    const buttons = [];

    for (let i = 0; i < buttonsCount; i++) {
      buttons.push(`
        <button 
        data-element="page-button"
        data-value="${i}"
        class="button button-pag"
        >
          ${i + 1}
        </button>
      `);
    }

    return buttons.join('');
  }

  _render() {
    this._element.innerHTML = `
      <div class="main__pagination-block">
        <div class="pagination__text">
          <span data-element="min-value">6</span>
            - 
          <span data-element="max-value">10</span>
            of
          <span data-element="total-value">6</span>
        </div>
        <div class="pagination__buttons">
          <button
           data-element="switch-button"
           data-value="-1"
           class="button button-pag"
           >
            <
          </button>
            ${this._getButtonsHTML()}
          <button
           data-element="switch-button"
           data-value="1"
           class="button button-pag">
             >
           </button>
        </div>
      </div>
    `;
  }
}
