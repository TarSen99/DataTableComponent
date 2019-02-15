import Component from '../component.js';

export default class PaginationSelector extends Component {
  constructor({ element, props }) {
    super({ element });

    this.updateProps(props);

    this.on('change', '[data-element="select-pages"]', (event) => {
      const currPerPageSelector = event.target.closest('[data-element="select-pages"]');
      const selectorValue = currPerPageSelector.value;

      this.emit('change-per-page', +selectorValue);
    });
  }

  _updateView() {
    this._render();
  }

  _render() {
    const { perPageOptions, itemsPerPage } = this._props;

    this._element.innerHTML = `
      <select 
        data-element="select-pages"
        class="header__select"
      >
        ${perPageOptions.map(option => `
            <option 
              value="${option}"
              ${option === itemsPerPage ? 'selected' : ''}
            >
              ${option}
            </option>
          `).join('')};
      </select>
    `;
  }
}
