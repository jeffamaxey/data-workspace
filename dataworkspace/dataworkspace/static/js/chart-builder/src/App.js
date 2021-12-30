import React from 'react';
import PlotlyEditor from 'react-chart-editor';
// import { GraphCreatePanel, GraphSubplotsPanel } from 'react-chart-editor/lib/default_panels';
import { DefaultEditor } from 'react-chart-editor';
import plotly from 'plotly.js/dist/plotly';
import 'react-chart-editor/lib/react-chart-editor.css';

import './App.css';
import CustomEditor from "./CustomEditor";
import GraphCreatePanel from "./components/GraphCreatePanel";
import {availableCharts, queryStates} from "./constants";
import LoadingSpinner from "./components/LoadingSpinner";
import QueryFailedMask from "./components/QueryFailedMask";

const config = {editable: true};

class App extends React.Component {
  api_base_url = '/data-explorer/api/';

  constructor(props) {
    super(props);
    this.state = {
      queryState: queryStates.running,
      queryError: null,
      dataSources: {},
      dataSourceOptions: [],
      chartConfig: [],
      layout: {},
      frames: [],
      loadingData: false,
      fetchedColumns: [],
    }
  }

  componentDidMount() {
    this.pollForQueryResults();
  }

  pollForQueryResults = () => {
    fetch(`/data-explorer/charts/query-status/${this.props.chartId}/`)
      .then((resp) => resp.json())
      .then((data) => {
        this.setState({
          queryState: data.state,
          queryError: data.error,
          dataSourceOptions: data.columns.map(name => ({
            value: name,
            label: name,
          })),
        });
       if (data.state === queryStates.running) {
          setTimeout(() => {
            this.pollForQueryResults()
          }, 1000);
      }
    });
  }

  fetchQueryResults = (columns) => {
    console.log('Fetching query results - ', columns);
    this.setState({ loadingData: true });
    fetch(`/data-explorer/charts/query-results/${this.props.chartId}/?columns=${columns.join(',')}`)
      .then((resp) => resp.json())
      .then((data) => {
        console.log(`Fetched ${data.total_rows} rows in ${data.duration} seconds`);
        console.log(data);
        // TODO: data sources and data config
        this.setState({
          loadingData: false,
          fetchedColumns: [ ...this.state.fetchedColumns, ...columns ],
          dataSources: { ...this.state.dataSources, ...data.data },
        });
      });
  }

  onChartUpdate(chartConfig, layout, frames) {
    this.setState({chartConfig, layout, frames});
    const possibleSources = [
      ["xsrc", "ysrc"], ["latsrc", "lonsrc"], ["labelssrc", "valuessrc"]
    ]
    let requiredCols = []
    chartConfig.forEach(chart => {
      possibleSources.forEach(sources => {
        const xsrc = chart[sources[0]];
        const ysrc = chart[sources[1]];
        if (xsrc != null && ysrc != null) {
          if (!this.state.fetchedColumns.includes(xsrc) && !requiredCols.includes(xsrc)) {
            requiredCols.push(xsrc);
          }
          if (!this.state.fetchedColumns.includes(ysrc) && !requiredCols.includes(ysrc)) {
            requiredCols.push(ysrc);
          }
        }
      });
    })
    if (requiredCols.length > 0) {
      this.fetchQueryResults(requiredCols);
    }
  }

  render() {
    return (
      <div className="app">
        {this.state.queryState === queryStates.running ?
          <LoadingSpinner message="Running query" /> : null
        }
        {this.state.queryState === queryStates.failed ?
          <QueryFailedMask errorMessage={this.state.queryError} />
        : null}
        {this.state.loadingData ?
          <LoadingSpinner message="Fetching data" /> : null
        }
        <div className="govuk-width-container">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-full" id="plotly-editor">
              <PlotlyEditor
                data={this.state.chartConfig}
                layout={this.state.layout}
                config={config}
                frames={this.state.frames}
                dataSources={this.state.dataSources}
                dataSourceOptions={this.state.dataSourceOptions}
                plotly={plotly}
                onUpdate={(config, layout, frames) => this.onChartUpdate(config, layout, frames)}
                useResizeHandler
                debug
                advancedTraceTypeSelector
                traceTypesConfig={availableCharts}
              >
                <DefaultEditor />
              </PlotlyEditor>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
