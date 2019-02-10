const PHONES_URL =
  'https://mate-academy.github.io/phone-catalogue-static/phones/phones.json';

const TableService = {
  async _getDataFromServer(url) {
    let response = await fetch(url);

    return await response.json();
  },

  async getAll() {
    return await this._getDataFromServer(PHONES_URL);
  }
};

export default TableService;
