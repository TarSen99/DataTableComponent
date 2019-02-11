const PHONES_URL = 'https://mate-academy.github.io/phone-catalogue-static/phones/phones.json';

const TableService = {
  async _getDataFromServer(url) {
    const response = await fetch(url);

    // eslint-disable-next-line no-return-await
    return await response.json();
  },

  async getAll() {
    // eslint-disable-next-line no-return-await
    return await this._getDataFromServer(PHONES_URL);
  },
};

export default TableService;
