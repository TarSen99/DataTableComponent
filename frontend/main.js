import DataTable from './components/data-table.js';
import TableService from './services/table-service.js';
import './style.css';

TableService.getAll().then((phones) => {
  // eslint-disable-next-line no-unused-vars
  const dataTable = new DataTable({
    element: document.querySelector('[data-component="table"]'),
    phones,

    columnConfig: {
      imageUrl: {
        hasPhoto: true,
      },

      name: {
        title: 'Name',
        isSortable: true,
        isSearchable: true,
        isEditable: true,
      },

      snippet: {
        title: 'Description',
        isSearchable: true,
        isEditable: true,
      },

      age: {
        title: 'Age',
        isSortable: true,
      },
    },
  });
});