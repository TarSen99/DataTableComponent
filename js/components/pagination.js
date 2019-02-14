import Component from '../component.js';

export default class Pagination extends Component {
  constructor({ element, totalItemsCount, itemsPerPage }) {
    super({ element });

    this.on('click', '[data-element="page-button"]', (event) => {
      const buttonValue = +event.target.closest('[data-element="page-button"]')
        .dataset.value;

      this._updateCurrentPage(buttonValue);
    });

    this.on('click', '[data-element="switch-button"]', (event) => {
      const buttonValue = +event.target.closest('[data-element="switch-button"]')
        .dataset.value;

      const newPage = this._calculateNewPageValue(buttonValue);

      if (newPage === this._currentPage) {
        return;
      }

      this._updateCurrentPage(newPage);
    });

    this.updateOptions({
      perPage: itemsPerPage,
      totalItemsCount,
    });
  }

  _updateTextDetails() {
    const totalItemsCount = this._totalItemsCount;
    let minItemValue = this._currentPage * this._itemsPerPage + 1;
    let maxItemValue = minItemValue + this._itemsPerPage - 1;

    maxItemValue = Math.min(maxItemValue, totalItemsCount);
    minItemValue = Math.min(maxItemValue, minItemValue);

    const minText = this._element.querySelector('[data-element="min-value"]');
    const maxText = this._element.querySelector('[data-element="max-value"]');
    const totalText = this._element.querySelector('[data-element="total-value"]');

    minText.textContent = minItemValue;
    maxText.textContent = maxItemValue;
    totalText.textContent = totalItemsCount;
  }

  _toggleArrowButtons() {
    const leftPageButton = this._element.querySelector(
      '[data-element="switch-button"][data-value="-1"]',
    );
    const rightPageButton = this._element.querySelector(
      '[data-element="switch-button"][data-value="1"]',
    );

    const minPage = 0;
    const maxPage = Math.max(this._buttonsCount - 1, 0);

    if (minPage === maxPage) {
      leftPageButton.disabled = true;
      rightPageButton.disabled = true;
      return;
    }

    if (this._currentPage === minPage) {
      leftPageButton.disabled = true;
      rightPageButton.disabled = false;
      return;
    }

    if (this._currentPage === maxPage) {
      leftPageButton.disabled = false;
      rightPageButton.disabled = true;
      return;
    }

    leftPageButton.disabled = false;
    rightPageButton.disabled = false;
  }

  _calculateNewPageValue(buttonValue) {
    let newPage = this._currentPage + buttonValue;

    newPage = Math.min(newPage, this._buttonsCount - 1);
    newPage = Math.max(newPage, 0);

    return newPage;
  }

  _updateCurrentPage(value) {
    this._currentPage = value;
    this._changeCurrentPageButton();
    this._updateTextDetails();

    this.emit('page-changed');
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
    const button = this._element.querySelector(
      `[data-element="page-button"][data-value="${this._currentPage}"]`,
    );

    if (!button) {
      return;
    }

    button.classList.add('button-pag--active');
  }

  resetCurrentPage() {
    this._currentPage = 0;
  }

  updateOptions({ perPage, totalItemsCount }) {
    this._itemsPerPage = perPage;
    this._totalItemsCount = totalItemsCount;
    this._buttonsCount = Math.ceil(this._totalItemsCount / this._itemsPerPage);
    this.resetCurrentPage();

    this._render();
    this._changeCurrentPageButton(0);
    this._updateTextDetails();
  }

  getCurrentPage() {
    return this._currentPage;
  }

  _getButtonsHTML() {
    const buttons = [];

    for (let i = 0; i < this._buttonsCount; i++) {
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
