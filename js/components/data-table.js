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
    this._initListeners();
    this._initSubscribes();

    this._makeFiltering();
  }

  _init(phones) {
    this._defaultPhones = phones;
    this._defaultPhones = this._addCheckFieldToItems(this._defaultPhones);
    this._phones = this._defaultPhones;

    this._render();

    this._paginationSelector = new PaginationSelector({
      element: this._element.querySelector(
        '[data-component="pagination-selector"]'
      ),
      options: [3, 5, 10, 15, 20],
      defaultValue: 5
    });

    this._pagination = new Pagination({
      element: this._element.querySelector('[data-component="pagination"]'),
      totalItemsCount: this.getItemsCount(),
      itemsPerPage: this._paginationSelector.getPerPage()
    });

    this._filterInput = this._element.querySelector(
      '[data-element="find-input"]'
    );
  }

  _initSubscribes() {
    this.subscribe(
      'input-enter',
      this._debounce(() => {
        this._pagination.resetCurrentPage();
        this._makeFiltering();

        this._pagination.updateOptions(
          this._paginationSelector.getPerPage(),
          this.getItemsCount()
        );
      }, 500)
    );

    this.subscribe('order-enter', this._makeFiltering.bind(this));

    this._paginationSelector.subscribe('change-per-page', () => {
      this._pagination.updateOptions(
        this._paginationSelector.getPerPage(),
        this.getItemsCount()
      );

      this._makeFiltering();
    });

    this._pagination.subscribe('page-changed', () => {
      this._makeFiltering();
    });

    this.subscribe('phone-checkbox-change', (id, currCheckState) => {
      let currPhoneInfo = this._getArrayPhoneItemDetails(id);
      currPhoneInfo.isChecked = currCheckState;
      this._updateMainCheckValue();

      this._renderTableContent();
    });

    this.subscribe('phones-checkbox-change', currCheckState => {
      this._phones = this._phones.map(phoneInfo => {
        phoneInfo.isChecked = currCheckState;

        return phoneInfo;
      });

      this._renderTableContent();
    });
  }

  _getArrayPhoneItemDetails(id) {
    return this._defaultPhones.find(phone => phone.id === id);
  }

  _updateMainCheckValue() {
    this._mainCheckboxValue = this._phones.every(phone => phone.isChecked);
  }

  _initListeners() {
    this.on('click', '[data-type="filter-selected"]', event => {
      this._clearCheckButtonsStyle();

      let btn = event.target.closest('[data-type="filter-selected"]');
      btn.classList.add('header-button-active');
      this._selectedFilter = btn.dataset.value;

      this._pagination.resetCurrentPage();
      this._makeFiltering();

      this._pagination.updateOptions(
        this._paginationSelector.getPerPage(),
        this.getItemsCount()
      );
    });

    this.on('change', '[data-element="phone-checkbox"]', event => {
      let currCheckState = event.target.closest(
        '[data-element="phone-checkbox"]'
      ).checked;
      let itemId = event.target.closest('[data-element="phone-item"]').dataset
        .id;

      this.emit('phone-checkbox-change', itemId, currCheckState);
    });

    this.on('change', '[data-element="phones-checkbox"]', () => {
      this._mainCheckboxValue = !this._mainCheckboxValue;

      this.emit('phones-checkbox-change', this._mainCheckboxValue);
    });

    this.on('input', '[data-element="find-input"]', () => {
      this.emit('input-enter');
    });

    this.on('click', '[data-sortable-key]', event => {
      let currOrderName = event.target.closest('[data-sortable-key]').dataset
        .sortableKey;

      if (this._orderName === currOrderName) {
        this._orderValue = this._orderValue === 'up' ? 'down' : 'up';
      } else {
        this._orderName = currOrderName;
      }

      this.emit('order-enter');
    });

    this.on('dblclick', '[data-edit="false"]', event => {
      let target = event.target.closest('[data-edit="false"]');

      this._createEditableField(target);
    });

    this.on('click', '[data-type="edit-button"]', event => {
      let target = event.target.closest('[data-type="edit-button"]');

      this._endEditInputChanges(target);
    });

    this.on('blur', '[data-element="input-area"]', event => {
      console.log('this');
      let target = event.target.closest('[data-element="input-area"]');
      //this._endEditInputChanges(target);
    });
  }

  _cancelEditInputChanges() {
    //////////////////////////////////////
  }

  _endEditInputChanges(button) {
    let editableBlock = button.closest('[data-element="editable-block" ]');
    let currField = button.closest('[data-element="detail-container"]');
    let editableField = currField.querySelector('[data-element="input-area"]');
    let parentRowId = button.closest('[data-element="phone-item"]').dataset.id;;

    currField.dataset.edit = 'false';
    let editableFieldValue = editableField.value;

    if (button.dataset.submit === 'ok') {
      currField.textContent = editableFieldValue;

      let ArrayItemFiled = this._getArrayPhoneItemDetails(parentRowId);
      let arrayFieldName = currField.dataset.type;

      ArrayItemFiled[arrayFieldName] = editableFieldValue;
    }

    editableBlock.remove();
  }

  _createEditableField(field) {
    field.dataset.edit = 'true';

    //double space
    let re = /  /gi;
    let fieldContent = field.textContent.replace(re, '');

    field.insertAdjacentHTML(
      'beforeend',
      `
        <div 
        data-element="editable-block" 
        class="main__table__input-block">
              <textarea
               data-element="input-area"
               class="main__table__input">
                ${fieldContent}
              </textarea>
              <div class="editable-block__buttons">
                <button 
                data-type="edit-button"
                data-submit="ok" 
                class="button button-edit"
                >
                 OK
                </button>
                
                <button
                data-type="edit-button"
                data-submit="cancel" 
                class="button button-edit"
                >
                 Cancel
                </button>
              </div>
        </div>
    `);

    let inputField = field.querySelector('[data-element="input-area"]');
    inputField.focus();
  }

  _clearCheckButtonsStyle() {
    let filterButtons = [
      ...this._element.querySelectorAll('[data-type="filter-selected"]')
    ];

    filterButtons.forEach(btn => {
      btn.classList.remove('header-button-active');
    });
  }

  getItemsCount() {
    return this._phonesLength;
  }

  _addCheckFieldToItems(items) {
    return items.map(item => {
      item.isChecked = false;

      return item;
    });
  }

  _debounce(f, delay) {
    let timerId;

    return function() {
      clearTimeout(timerId);

      timerId = setTimeout(f, delay);
    };
  }

  _filterSelectedItems(phones) {
    if (this._selectedFilter === 'checked') {
      phones = phones.filter(phone => phone.isChecked);
    }

    return phones;
  }

  _sortPhones() {
    this._phones.sort((a, b) => {
      if (this._orderValue === 'up') {
        if (a[this._orderName] > b[this._orderName]) {
          return 1;
        } else {
          return -1;
        }
      }

      if (a[this._orderName] < b[this._orderName]) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  _getItemsOfCurrentPage() {
    let currPage = this._pagination.getCurrentPage();
    let perPage = this._paginationSelector.getPerPage();

    this._phones = this._phones.filter((phone, index) => {
      return (
        index >= currPage * perPage && index < currPage * perPage + perPage
      );
    });
  }

  _makeFiltering() {
    let searchableFields = this._getSearchableFieldNames();
    this._filterValue = this._filterInput.value.toLowerCase().trim();
    this._phones = this._filterSelectedItems(this._defaultPhones);

    this._phones = this._phones.filter(phone => {
      for (let fieldName of searchableFields) {
        let currPhoneValue = phone[fieldName].toLowerCase().trim();

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
      .filter(([key, value]) => {
        return value['isSearchable'];
      })
      .map(([key]) => key);
  }

  _generatePhonesListHTML(phone) {
    return `<tr
         data-element="phone-item"
         data-id="${phone.id}"
         >
        <td><input
         data-element="phone-checkbox"
         type="checkbox"
         ${phone.isChecked ? 'checked' : ''} 
         >
         </td>
         
        ${Object.entries(this._config)
          .map(([key, value]) => {
            return ` 
              ${
                value['hasPhoto']
                  ? `<td 
                      data-element="detail-container"
                      >
                        <img src="${phone[key]}">
                   </td>`
                  : `<td 
                      data-element="detail-container"
                      data-type="${key}"
                      ${value.isSearchable ? `data-searchable` : ''}
                      ${value.isEditable ? `data-edit="false"` : ''}
                      >
                        ${phone[key]}
                   </td>`
              }
                `;
          })
          .join('')}
        
        </tr>`;
  }

  _renderPhones() {
    this._table.insertAdjacentHTML(
      'beforeend',
      `
      ${this._phones
        .map(phone => {
          return this._generatePhonesListHTML(phone);
        })
        .join('')}
    `
    );
  }

  _renderTableTitle() {
    this._table.innerHTML = `<tr>
        <th><input
          data-element="phones-checkbox"
          type="checkbox"
          ${this._mainCheckboxValue ? 'checked' : ''}
          >
          </th>
          
            ${Object.entries(this._config)
              .map(([key, value]) => {
                return `
                        <th ${
                          value.isSortable ? `data-sortable-key=${key}` : ''
                        }
                        >
                            ${value.title || ''}
                        </th>
                    `;
              })
              .join('')}
            
        </tr>`;
  }

  _renderTableContent() {
    this._table = this._element.querySelector('[data-element="phones-block"]');

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
