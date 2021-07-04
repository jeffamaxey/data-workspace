import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {notification} from "antd";

export default function ResultsGrid({ queryLogId }) {
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);
  const [error, setError] = useState(null);

  const [initalLoadComplete, setInitialLoadComplete] = useState(false);
  const [columnDefs, setColumnDefs] = useState([])
  const [rowData, setRowData] = useState([])

  const cleanFilters = (filterModel, dataTypeMap) => {
    let filters = filterModel != null ? filterModel : {};
    for (let key in filters) {
      if (dataTypeMap[key] != null && dataTypeMap[key] != filters[key].filterType) {
        filters[key].filterType = dataTypeMap[key];
      }
    }
    return filters;
  }

  const onGridReady = (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);

    const columnDataTypeMap = columnDefs.map(col => {
      return {[col.field]: col.dataType}
    })

    const dataSource = {
      rowCount: null,
      getRows: function (params) {
        const qs = {
          start: params.startRow,
          limit: params.endRow - params.startRow,
          filters: cleanFilters(params.filterModel, columnDataTypeMap)
        };
        if (params.sortModel[0]) {
          qs['sortField'] = params.sortModel[0].colId;
          qs['sortDir'] = params.sortModel[0].sort;
        }
        fetch(`/data-explorer/api/query-results/${queryLogId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
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
              setColumnDefs(data.column_config);
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


  return (
    <div className="ag-theme-alpine" style={{width: '100%', height: '100%'}}>
      <AgGridReact
        defaultColDef={{
          flex: 1,
          resizable: true,
          minWidth: 150,
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
        columnDefs={columnDefs}
        rowModelType="infinite"
        paginationPageSize={100}
        onGridReady={onGridReady}
      />
    </div>
    // {activeQuery ?
    // <div className="ag-theme-alpine" style={{width: '100%', height: '100%'}}>
    //   <AgGridReact
    //     defaultColDef={{
    //       flex: 1,
    //       resizable: true,
    //       minWidth: 100,
    //     }}
    //     components={{
    //       loadingRenderer: function (params) {
    //         if (params.value !== undefined) {
    //           return params.value;
    //         } else {
    //           return '<img src="/__django_static/assets/images/loading.gif">';
    //         }
    //       },
    //     }}
    //     rowBuffer={0}
    //     rowSelection={'multiple'}
    //     rowModelType={'infinite'}
    //     paginationPageSize={100}
    //     cacheOverflowSize={2}
    //     maxConcurrentDatasourceRequests={1}
    //     infiniteInitialRowCount={1000}
    //     maxBlocksInCache={10}
    //     onGridReady={onGridReady}
    //   >
    //     <AgGridColumn
    //       headerName="ID"
    //       maxWidth={100}
    //       valueGetter="node.id"
    //       cellRenderer="loadingRenderer"
    //     />
    //     <AgGridColumn field="athlete" minWidth={150} />
    //     <AgGridColumn field="age" />
    //     <AgGridColumn field="country" minWidth={150} />
    //     <AgGridColumn field="year" />
    //     <AgGridColumn field="date" minWidth={150} />
    //     <AgGridColumn field="sport" minWidth={150} />
    //     <AgGridColumn field="gold" />
    //     <AgGridColumn field="silver" />
    //     <AgGridColumn field="bronze" />
    //     <AgGridColumn field="total" />
    //   </AgGridReact>
    // </div>
    //   : <div className="no-query"><Empty description="Run a query to see some data" /></div>}

  )
}
