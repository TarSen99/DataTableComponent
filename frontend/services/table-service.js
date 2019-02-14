const PHONES_URL = 'https://mate-academy.github.io/phone-catalogue-static/phones/phones.json';

const TableService = {
  async _getDataFromServer(url) {
    const response = await fetch(url);

    return response.json();
  },

  async getAll() {
    return this._getDataFromServer(PHONES_URL);
  },
};

export default TableService;
