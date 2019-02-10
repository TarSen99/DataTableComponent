import DataTable from './components/data-table.js';
import TableService from './services/table-service.js';

TableService.getAll().then(phones => {
  let dataTable = new DataTable({
    element: document.querySelector('[data-component="table"]'),
    phones: phones,

    columnConfig: {
      imageUrl: {
        hasPhoto: true
      },

      name: {
        title: 'Name',
        isSortable: true,
        isSearchable: true
      },

      snippet: {
        title: 'Description',
        isSearchable: true
      },

      age: {
        title: 'Age',
        isSortable: true
      }
    }
  });
});
