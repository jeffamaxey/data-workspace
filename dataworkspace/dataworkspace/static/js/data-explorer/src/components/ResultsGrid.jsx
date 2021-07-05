import React, { useState} from "react";
import { AgGridReact } from "ag-grid-react";
import {Button, notification} from "antd";
import { DownloadOutlined } from '@ant-design/icons';
import { cleanFilters, parseColumnConfig, createInputFormField } from "../utils/grid";
import { getCookie } from "../utils/common";
import BooleanFilter from "../filters/BooleanFilter";

export default function ResultsGrid({ queryLogId }) {
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);
  const [initalLoadComplete, setInitialLoadComplete] = useState(false);
  const [columnDefs, setColumnDefs] = useState([])
  const [isDownloading, setIsDownloading] = useState(false);
  const [columnDataTypeMap, setColumnDataTypeMap] = useState([]);

  const onGridReady = (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);

    setColumnDataTypeMap(
        columnDefs.map(col => {
        return {[col.field]: col.dataType}
      })
    );

    const dataSource = {
      rowCount: null,
      getRows: function (params) {
        const qs = {
          start: params.startRow,
          limit: params.endRow - params.startRow,
          filters: cleanFilters(params.filterModel, columnDataTypeMap)
        };
        console.log(params.sortModel);
        if (params.sortModel[0]) {
          qs['sortField'] = params.sortModel[0].colId;
          qs['sortDir'] = params.sortModel[0].sort;
        }
        fetch(`/data-explorer/api/query-results/${queryLogId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-CSRFToken': getCookie('data_workspace_csrf'),
          },
          body: JSON.stringify(qs),
        })
         .then(function(resp) {
            if(resp.ok) {
              return resp.json()
            }
            notification.error({
              message: 'Error running query',
              description:
                'An unknown error occurred while trying to run your query.',
            });
            throw new Error('Failed to fetch query results from the backend');
          })
          .then((data) => {
            if (!initalLoadComplete) {
              setColumnDefs(parseColumnConfig(data.column_config));
            }
            params.successCallback(
              data.data,
              data.data.length < (params.endRow - params.startRow) ? (params.startRow + data.data.length) : -1
            );
            if (!initalLoadComplete) {
              setInitialLoadComplete(true);
            }
          });
        },
    };
    params.api.setDatasource(dataSource);
  };

  const onDownloadClick = () => {
    setIsDownloading(true);
    const form = document.createElement('form');
    form.action = `/data-explorer/api/query-results/${queryLogId}?download=1`
    form.method = 'POST';
    form.enctype = 'application/x-www-form-urlencoded';

    form.append(createInputFormField('csrfmiddlewaretoken', getCookie('data_workspace_csrf')));

    // Define the columns to include in the csv
    gridColumnApi.getAllDisplayedColumns().forEach(column => {
      form.append(createInputFormField('columns', column.colDef.field))
    })

    // Add current filters to the form
    const filters = cleanFilters(gridApi.getFilterModel(), columnDataTypeMap);
    for (let key in filters) {
      form.append(createInputFormField('filters', JSON.stringify({[key]: filters[key]})));
    }

    // Add the current sort config to the form
    const sortModel = gridApi.getSortModel()[0];
    if (sortModel) {
      form.append(createInputFormField('sortDir', sortModel.sort));
      form.append(createInputFormField('sortField', sortModel.colId));
    }

    // Add the form to the page, submit it and then remove it
    document.body.append(form);
    form.submit();
    form.remove();
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);

  }

  return (
    <div className="flex-wrapper">
      <div className="flex-column">
        <div className="ag-theme-alpine flex-fill">
          <AgGridReact
            enableCellTextSelection={true}
            defaultColDef={{
              flex: 1,
              resizable: true,
              minWidth: 150,
              suppressMenu: true,
              floatingFilter: true,
              filterParams: {
                suppressAndOrCondition: true,
                buttons: ['reset']
              }
            }}
            components={{
              loadingRenderer: function (params) {
                if (params.value !== undefined) {
                  return params.value;
                } else {
                  return '<img src="/__django_static/assets/images/loading.gif">';
                }
              },
            }}
            frameworkComponents={{
                booleanFloatingFilter: BooleanFilter,
            }}
            columnDefs={columnDefs}
            rowModelType="infinite"
            paginationPageSize={100}
            onGridReady={onGridReady}
          />
        </div>
      </div>
      {initalLoadComplete?
        <div className="fixed-widgets">
          <Button
            type="primary"
            shape="round"
            icon={<DownloadOutlined />}
            size="large"
            loading={isDownloading}
            onClick={onDownloadClick}
          >
            Download CSV
          </Button>
        </div>
      : null}
    </div>
  )
}
