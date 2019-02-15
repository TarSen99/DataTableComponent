import Component from '../component.js';
import Pagination from './pagination.js';
import PaginationSelector from './pagination-selector.js';

export default class DataTable extends Component {
  constructor({ element, phones, columnConfig }) {
    super({ element });

    this._props = {
      config: columnConfig,
      defaultPhones: phones,
      phonesLength: phones.length,
      phones,
    };

    this._render();
    this._init();
  }

  _init() {
    const defaultPerPage = 5;
    const { phonesLength } = this._props;

    this._state = {
      filterValue: '',
      selectedFilter: 'all',
      orderValue: 'up',
      orderName: '',
      mainCheckboxValue: false,
      currentPage: 0,
      totalItemsCount: this.getItemsCount(),
      buttonsCount: Math.ceil(phonesLength / defaultPerPage),
      itemsPerPage: defaultPerPage,
      perPageOptions: [3, 5, 10, 15, 20],
    };

    let { defaultPhones } = this._props;

    defaultPhones = this._addCheckFieldToItems(defaultPhones);
    this.updateProps({ defaultPhones });

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
      const selectedFilter = btn.dataset.value;

      this._updateState({ selectedFilter });
      this._resetCurrentPage();
      this._makeFiltering();

      const { itemsPerPage, buttonsCount } = this._state;
      const { phonesLength } = this._props;

      this._pagination.updateProps({
        perPage: itemsPerPage,
        phonesLength,
        buttonsCount,
      });
    });

    this.on('input', '[data-element="find-input"]', () => {
      this.emit('input-enter');
    });

    this.on('click', '[data-sortable-key]', (event) => {
      const element = event.target.closest('[data-sortable-key]');
      const currOrderName = element.dataset.sortableKey;

      let { orderName, orderValue } = this._state;

      if (orderName === currOrderName) {
        orderValue = orderValue === 'up' ? 'down' : 'up';
      } else {
        orderName = currOrderName;
      }

      this._updateState({ orderValue, orderName });
      this.emit('order-enter');
    });

    this.subscribe(
      'input-enter',
      this._debounce(() => {
        this._resetCurrentPage();
        this._makeFiltering();
        const {
          currentPage,
          itemsPerPage,
          buttonsCount,
        } = this._state;

        const { phonesLength } = this._props;
        this._pagination.updateProps({
          currentPage,
          itemsPerPage,
          phonesLength,
          buttonsCount,
        });
      }, 500),
    );

    this.subscribe('order-enter', this._makeFiltering.bind(this));
  }

  _initPagination() {
    const {
      itemsPerPage,
      buttonsCount,
      currentPage,
      perPageOptions
    } = this._state;

    const { phonesLength } = this._props;

    this._paginationSelector = new PaginationSelector({
      element: this._getComponent('pagination-selector'),
      props: {
        perPageOptions,
        itemsPerPage,
      },
    });

    this._pagination = new Pagination({
      element: this._getComponent('pagination'),
      props: {
        phonesLength,
        itemsPerPage,
        buttonsCount,
        currentPage,
      },
    });

    this._paginationSelector.subscribe('change-per-page', (newPerPage) => {
      this._updateState({ itemsPerPage: newPerPage });
      this._makeFiltering();
      const { buttonsCount } = this._state;

      this._pagination.updateProps({
        itemsPerPage: newPerPage,
        buttonsCount,
      });

      this._paginationSelector.updateProps({
        itemsPerPage: newPerPage,
      });
    });

    this._pagination.subscribe('page-changed', (newPage) => {
      this._updateState({ currentPage: newPage });
      this._pagination.updateProps({ currentPage: newPage });

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
      let { mainCheckboxValue } = this._state;

      mainCheckboxValue = !mainCheckboxValue;

      this._updateState({ mainCheckboxValue });

      this.emit('phones-checkbox-change', mainCheckboxValue);
    });

    this.subscribe('phone-checkbox-change', (id, currCheckState) => {
      const currPhoneInfo = this._getPhoneDetailsFromArray(id);
      currPhoneInfo.isChecked = currCheckState;
      const { phones } = this._props;
      const mainCheckboxValue = this._getMainCheckValue(phones);

      this._updateState({ mainCheckboxValue });
    });

    this.subscribe('phones-checkbox-change', (currCheckState) => {
      const { phones } = this._props;

      phones.forEach((phoneInfo) => {
        // eslint-disable-next-line no-param-reassign
        phoneInfo.isChecked = currCheckState;
      });

      this.updateProps({ phones });
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
    const { defaultPhones } = this._props;

    return defaultPhones.find(phone => phone.id === id);
  }

  _getMainCheckValue(phones) {
    return phones.every(phone => phone.isChecked);
  }

  _resetCurrentPage() {
    const currentPage = 0;

    this._updateState({ currentPage });
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
    const { phonesLength } = this._props;

    return phonesLength;
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
    const { selectedFilter } = this._state;

    if (selectedFilter === 'checked') {
      // eslint-disable-next-line no-param-reassign
      phones = phones.filter(phone => phone.isChecked);
    }

    return phones;
  }

  _sortPhones(phones) {
    const { orderValue, orderName } = this._state;

    return phones.sort((a, b) => {
      if (orderValue === 'up') {
        if (a[orderName] > b[orderName]) {
          return 1;
        }
        return -1;
      }

      if (a[orderName] < b[orderName]) {
        return 1;
      }
      return -1;
    });
  }

  _getItemsOfCurrentPage(phones) {
    const { currentPage, itemsPerPage } = this._state;

    return phones.filter((phone, index) => (
      index >= currentPage * itemsPerPage && index < currentPage * itemsPerPage + itemsPerPage
    ));
  }

  _makeFiltering() {
    const searchableFields = this._getSearchableFieldNames();
    const filterValue = this._filterInput.value.toLowerCase().trim();

    // eslint-disable-next-line no-restricted-syntax
    const { defaultPhones } = this._props;
    let phones = this._filterSelectedItems(defaultPhones);

    // eslint-disable-next-line array-callback-return
    phones = phones.filter((phone) => { // eslint-disable-line consistent-return
      // eslint-disable-next-line no-restricted-syntax
      for (const fieldName of searchableFields) {
        const currPhoneValue = phone[fieldName].toLowerCase().trim();

        if (currPhoneValue.includes(filterValue)) {
          return true;
        }
      }
    });

    const phonesLength = phones.length;
    const { itemsPerPage } = this._state;
    phones = this._sortPhones(phones);

    phones = this._getItemsOfCurrentPage(phones);
    const mainCheckboxValue = this._getMainCheckValue(phones);

    this.updateProps({
      phonesLength,
      phones,
    });

    this._updateState({
      filterValue,
      mainCheckboxValue,
      buttonsCount: Math.ceil(phonesLength / itemsPerPage),
    });
  }

  _getSearchableFieldNames() {
    const { config } = this._props;

    return Object.entries(config)
    // eslint-disable-next-line no-unused-vars
      .filter(([key, value]) => value.isSearchable)
      .map(([key]) => key);
  }

  _generatePhonesListHTML(phone) {
    const { config } = this._props;

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
        
        ${Object.entries(config).map(([key, value]) => ` 
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
    const { phones } = this._props;

    this._table.insertAdjacentHTML(
      'beforeend',
      `
      ${phones
    .map(phone => this._generatePhonesListHTML(phone)).join('')}
    `,
    );
  }

  _renderTableTitle() {
    const { config } = this._props;
    const { mainCheckboxValue } = this._state;

    this._table.innerHTML = `
      <tr>
        <th>
          <input
            data-element="phones-checkbox"
            type="checkbox"
            ${mainCheckboxValue ? 'checked' : ''}
          >
        </th>
        
          ${Object.entries(config).map(([key, value]) => `
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

  _updateView() {
    this._renderTableContent();
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
