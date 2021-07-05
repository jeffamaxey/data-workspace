
const cleanFilters = (filterModel, dataTypeMap) => {
  let filters = filterModel != null ? filterModel : {};
  for (let key in filters) {
    if (dataTypeMap[key] != null && dataTypeMap[key] != filters[key].filterType) {
      filters[key].filterType = dataTypeMap[key];
    }
  }
  return filters;
}

const compareDates = (filterDate, cellDate) => {
  if (cellDate != null) {
    filterDate = dayjs(filterDate);
    cellDate = dayjs(cellDate);
    if (cellDate < filterDate) {
      return -1;
    } else if (cellDate > filterDate) {
      return 1;
    }
  }
  return 0;
}

const parseColumnConfig = columnConfig => {
  columnConfig.map(column => {
    switch (column.dataType) {
      case 'numeric':
        column.filter = 'agNumberColumnFilter';
        break;
      case 'date':
        column.filter = 'agDateColumnFilter';
        break;
      case 'boolean':
        column.floatingFilterComponent = 'booleanFloatingFilter';
        column.floatingFilterComponentParams = { suppressFilterButton: true };
        break;
      case 'uuid':
        column.filterParams = {
          filterOptions: ['equals', 'notEquals']
        };
        break;
    }
    if (column.filter === 'agDateColumnFilter') {
      column.filterParams = {
        comparator: compareDates
      }
    }
  })
  return columnConfig;
}

const createInputFormField = (name, value) => {
  const field = document.createElement('input')
  field.setAttribute('name', name);
  field.setAttribute('value', value);
  return field;
}

export { cleanFilters, parseColumnConfig, createInputFormField }
