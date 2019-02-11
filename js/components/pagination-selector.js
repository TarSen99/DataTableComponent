import Component from '../component.js';

export default class PaginationSelector extends Component {
  constructor({ element, options, defaultValue }) {
    super({ element });
    this._options = options;
    this._default = defaultValue;

    this.on('change', '[data-element="select-pages"]', (event) => {
      const currPerPage = event.target.closest('[data-element="select-pages"]')
        .value;
      this._default = +currPerPage;

      this.emit('change-per-page');
    });

    this._render();
  }

  getPerPage() {
    return this._default;
  }

  _render() {
    this._element.innerHTML = `
        <select 
        data-element="select-pages"
        class="header__select"
        >
          ${this._options.map(option => `
              <option 
              value="${option}"
              ${option === this._default ? 'selected' : ''}
              >
                ${option}
              </option>
            `).join('')};
        </select>
    `;
  }
}
