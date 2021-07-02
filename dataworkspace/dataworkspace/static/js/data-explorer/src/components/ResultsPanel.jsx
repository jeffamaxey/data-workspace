import React from 'react';
import {Layout, Result} from 'antd';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import ResultsLoading from "./ResultsLoading";
import ResultsEmpty from "./ResultsEmpty";
import ResultsGrid from "./ResultsGrid";

const { Footer } = Layout;

export default function ResultsPanel({ queryLogId, queryRunning, queryError }) {

  const getContent = function() {
    if (queryRunning) {
      return <ResultsLoading />;
    }
    if (queryError !== null) {
      return (
          <Result
          status="warning"
          title="Error running query"
          subTitle={queryError}
        />
      );
    }
    if (queryLogId === null) {
      return <ResultsEmpty />
    }
    return <ResultsGrid queryLogId={queryLogId} />;
  }

  return (
    <div className="flex-fill">
      <Footer style={{backgroundColor: "#fff"}}>
        {getContent()}
      </Footer>
    </div>
  )
}
