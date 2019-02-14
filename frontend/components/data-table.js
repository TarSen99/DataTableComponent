import Component from '../component.js';
import Pagination from './pagination.js';
import PaginationSelector from './pagination-selector.js';

export default class DataTable extends Component {
  constructor({ element, phones, columnConfig }) {
    super({ element });
    this._config = columnConfig;
    this._filterValue = '';
    this._selectedFilter = 'all';
    this._orderValue = 'up';
    this._orderName = '';
    this._mainCheckboxValue = false;
    this._phonesLength = phones.length;

    this._init(phones);
  }

  _init(phones) {
    this._defaultPhones = phones;
    this._defaultPhones = this._addCheckFieldToItems(this._defaultPhones);
    this._phones = this._defaultPhones;

    this._render();

    this._initFilter();
    this._initPagination();
    this._initPhonesCheckbox();
    this._initFieldsEditing();

    this._makeFiltering();
  }

  _initFilter() {
    this._filterInput = this._getElement('find-input');

    this.on('click', '[data-type="filter-selected"]', (event) => {
      this._clearCheckButtonsStyle();

      const btn = event.target.closest('[data-type="filter-selected"]');
      btn.classList.add('header-button-active');
      this._selectedFilter = btn.dataset.value;

      this._pagination.resetCurrentPage();
      this._makeFiltering();

      this._pagination.updateOptions({
        perPage: this._paginationSelector.getPerPage(),
        totalItemsCount: this.getItemsCount(),
      });
    });

    this.on('input', '[data-element="find-input"]', () => {
      this.emit('input-enter');
    });

    this.on('click', '[data-sortable-key]', (event) => {
      const currOrderName = event.target.closest('[data-sortable-key]').dataset
        .sortableKey;

      if (this._orderName === currOrderName) {
        this._orderValue = this._orderValue === 'up' ? 'down' : 'up';
      } else {
        this._orderName = currOrderName;
      }

      this.emit('order-enter');
    });

    this.subscribe(
      'input-enter',
      this._debounce(() => {
        this._pagination.resetCurrentPage();
        this._makeFiltering();

        this._pagination.updateOptions({
          perPage: this._paginationSelector.getPerPage(),
          totalItemsCount: this.getItemsCount(),
        });
      }, 500),
    );

    this.subscribe('order-enter', this._makeFiltering.bind(this));
  }

  _initPagination() {
    this._paginationSelector = new PaginationSelector({
      element: this._getComponent('pagination-selector'),
      options: [3, 5, 10, 15, 20],
      defaultValue: 5,
    });

    this._pagination = new Pagination({
      element: this._getComponent('pagination'),
      totalItemsCount: this.getItemsCount(),
      itemsPerPage: this._paginationSelector.getPerPage(),
    });

    this._paginationSelector.subscribe('change-per-page', () => {
      this._pagination.updateOptions({
        perPage: this._paginationSelector.getPerPage(),
        totalItemsCount: this.getItemsCount(),
      });

      this._makeFiltering();
    });

    this._pagination.subscribe('page-changed', () => {
      this._makeFiltering();
    });
  }

  _initPhonesCheckbox() {
    this.on('change', '[data-element="phone-checkbox"]', (event) => {
      const phoneItem = event.target.closest('[data-element="phone-item"]');
      const phoneCheckbox = event.target.closest(
        '[data-element="phone-checkbox"]',
      );

      const itemId = phoneItem.dataset.id;
      const currCheckState = phoneCheckbox.checked;

      this.emit('phone-checkbox-change', itemId, currCheckState);
    });

    this.on('change', '[data-element="phones-checkbox"]', () => {
      this._mainCheckboxValue = !this._mainCheckboxValue;

      this.emit('phones-checkbox-change', this._mainCheckboxValue);
    });

    this.subscribe('phone-checkbox-change', (id, currCheckState) => {
      const currPhoneInfo = this._getPhoneDetailsFromArray(id);
      currPhoneInfo.isChecked = currCheckState;
      this._updateMainCheckValue();

      this._renderTableContent();
    });

    this.subscribe('phones-checkbox-change', (currCheckState) => {
      this._phones.forEach((phoneInfo) => {
        // eslint-disable-next-line no-param-reassign
        phoneInfo.isChecked = currCheckState;
      });

      this._renderTableContent();
    });
  }

  _initFieldsEditing() {
    this.on('dblclick', '[data-edit="false"]', (event) => {
      const target = event.target.closest('[data-edit="false"]');

      this._createEditableField(target);
    });

    this.on('focusout', '[data-element="input-area"]', () => {
      setTimeout(() => {
        this._endInputEditing('ok');
      }, 0);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'x' || event.key === 'Escape') {
        this._endInputEditing();
      } else if (event.key === 'Enter') {
        this._endInputEditing('ok');
      }
    });
  }

  _getPhoneDetailsFromArray(id) {
    return this._defaultPhones.find(phone => phone.id === id);
  }

  _updateMainCheckValue() {
    this._mainCheckboxValue = this._phones.every(phone => phone.isChecked);
  }

  _endInputEditing(state) {
    const editableBlock = this._getElement('editable-block');

    if (!editableBlock) {
      return;
    }

    const currField = editableBlock.closest('[data-element="detail-container"]');
    const editableField = this._getElement('input-area', editableBlock);

    const parentRow = editableBlock.closest('[data-element="phone-item"]');
    const parentRowId = parentRow.dataset.id;

    currField.dataset.edit = 'false';
    const editableFieldValue = editableField.value;

    if (state === 'ok') {
      currField.textContent = editableFieldValue;

      const ArrayItemFiled = this._getPhoneDetailsFromArray(parentRowId);
      const arrayFieldName = currField.dataset.type;

      ArrayItemFiled[arrayFieldName] = editableFieldValue;
    }

    editableBlock.remove();
  }

  // eslint-disable-next-line class-methods-use-this
  _createEditableField(field) {
    // eslint-disable-next-line no-param-reassign
    field.dataset.edit = 'true';

    const fieldContent = field.textContent.trim();

    field.insertAdjacentHTML(
      'beforeend',
      `
            <div 
            data-element="editable-block" 
            class="main__table__input-block">
              <textarea
              data-element="input-area"
              class="main__table__input">${fieldContent}</textarea>
            </div>
           `,
    );

    const inputField = this._getElement('input-area', field);
    inputField.focus();
  }

  _clearCheckButtonsStyle() {
    const filterButtons = [
      ...this._element.querySelectorAll('[data-type="filter-selected"]'),
    ];

    filterButtons.forEach((btn) => {
      btn.classList.remove('header-button-active');
    });
  }

  getItemsCount() {
    return this._phonesLength;
  }

  // eslint-disable-next-line class-methods-use-this
  _addCheckFieldToItems(items) {
    return items.map((item) => {
      // eslint-disable-next-line no-param-reassign
      item.isChecked = false;

      return item;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  _debounce(f, delay) {
    let timerId;

    // eslint-disable-next-line func-names
    return function () {
      clearTimeout(timerId);

      timerId = setTimeout(f, delay);
    };
  }

  _filterSelectedItems(phones) {
    if (this._selectedFilter === 'checked') {
      // eslint-disable-next-line no-param-reassign
      phones = phones.filter(phone => phone.isChecked);
    }

    return phones;
  }

  _sortPhones() {
    this._phones.sort((a, b) => {
      if (this._orderValue === 'up') {
        if (a[this._orderName] > b[this._orderName]) {
          return 1;
        }
        return -1;
      }

      if (a[this._orderName] < b[this._orderName]) {
        return 1;
      }
      return -1;
    });
  }

  _getItemsOfCurrentPage() {
    const currPage = this._pagination.getCurrentPage();
    const perPage = this._paginationSelector.getPerPage();

    this._phones = this._phones.filter((phone, index) => (
      index >= currPage * perPage && index < currPage * perPage + perPage
    ));
  }

  _makeFiltering() {
    const searchableFields = this._getSearchableFieldNames();
    this._filterValue = this._filterInput.value.toLowerCase().trim();
    // eslint-disable-next-line no-restricted-syntax
    this._phones = this._filterSelectedItems(this._defaultPhones);

    // eslint-disable-next-line array-callback-return
    this._phones = this._phones.filter((phone) => { // eslint-disable-line consistent-return
      // eslint-disable-next-line no-restricted-syntax
      for (const fieldName of searchableFields) {
        const currPhoneValue = phone[fieldName].toLowerCase().trim();

        if (currPhoneValue.includes(this._filterValue)) {
          return true;
        }
      }
    });

    this._phonesLength = this._phones.length;

    this._sortPhones();
    this._getItemsOfCurrentPage();

    this._updateMainCheckValue();
    this._renderTableContent();
  }

  _getSearchableFieldNames() {
    return Object.entries(this._config)
    // eslint-disable-next-line no-unused-vars
      .filter(([key, value]) => value.isSearchable)
      .map(([key]) => key);
  }

  _generatePhonesListHTML(phone) {
    return `
      <tr
        data-element="phone-item"
        data-id="${phone.id}"
      >
        <td>
          <input
              data-element="phone-checkbox"
              type="checkbox"
              ${phone.isChecked ? 'checked' : ''} 
            >
        </td>
        
        ${Object.entries(this._config).map(([key, value]) => ` 
        ${value.hasPhoto ? `
        <td 
          data-element="detail-container"
        >
          <img src="${phone[key]}">
        </td>` : `
        <td 
          data-element="detail-container"
          data-type="${key}"
          ${value.isSearchable ? 'data-searchable' : ''}
          ${value.isEditable ? 'data-edit="false"' : ''}
        >
          ${phone[key]}
        </td>`}
        `).join('')}
      </tr>`;
  }

  _renderPhones() {
    this._table.insertAdjacentHTML(
      'beforeend',
      `
      ${this._phones
    .map(phone => this._generatePhonesListHTML(phone)).join('')}
    `,
    );
  }

  _renderTableTitle() {
    this._table.innerHTML = `
      <tr>
        <th>
          <input
            data-element="phones-checkbox"
            type="checkbox"
            ${this._mainCheckboxValue ? 'checked' : ''}
          >
        </th>
        
          ${Object.entries(this._config).map(([key, value]) => `
          <th 
              ${value.isSortable ? `data-sortable-key=${key}` : ''}
          >
            ${value.title || ''}
          </th>
            `).join('')}
      </tr>`;
  }

  _renderTableContent() {
    this._table = this._getElement('phones-block');

    this._renderTableTitle();
    this._renderPhones();
  }

  _render() {
    this._element.innerHTML = `
      <header class="header">
        <div class="container">
          <div class="header__content">
            <div class="header__logo">Phones.ua</div>
            <div data-component="pagination-selector"></div>
            <div class="header__find-input-wrapper">
              <input
               data-element="find-input"
               type="text"
               class="header__find-input"
               placeholder="Find something..."/>
            </div>
            <div class="header-sort-buttons">
              <button
               data-type="filter-selected"
               data-value="all"
               class="button header-button-all header-button-active"
               >
                 Show All
               </button>
              <button
               data-type="filter-selected"
               data-value="checked"
               class="button header-button-selected"
               >
                 Show Selected
               </button>
            </div>
          </div>
        </div>
        </header>
        <main class="main">
        <div class="container">
          <table data-element="phones-block" class="main__table">
          </table>
          <div data-component="pagination"></div>
        </div>
      </main>
      `;
  }
}
