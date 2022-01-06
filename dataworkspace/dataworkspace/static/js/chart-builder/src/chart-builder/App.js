import React from 'react';
import PlotlyEditor, {DefaultEditor, Panel} from 'react-chart-editor';
import plotly from 'plotly.js/dist/plotly';
import 'react-chart-editor/lib/react-chart-editor.css';

import './App.css';
import {availableCharts, axisMap, queryStates} from "./constants";
import LoadingSpinner from "./components/LoadingSpinner";
import { getCookie } from "./utils/common";
import ErrorModal from "./components/ErrorModal";

const config = {editable: true};
const LOAD_DATA_ON_INIT = true;

class App extends React.Component {
  api_base_url = '/data-explorer/api/';
  constructor(props) {
    super(props);
    this.state = {
      queryRunning: true,
      queryError: null,
      loadingData: false,
      savingChart: false,
      saveError: null,
      editorRevision: 0,
      dataSources: {},
      dataSourceOptions: [],
      traces: [],
      layout: {},
      frames: [],
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
          queryError: data.error,
          queryRunning: data.state === queryStates.running,
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
        else if (data.state === queryStates.complete && LOAD_DATA_ON_INIT) {
          this.fetchQueryResults(this.state.dataSourceOptions.map(v => v.value));
        }
    });
  }

  fetchQueryResults = (columns) => {
    this.setState({ loadingData: true });
    fetch(`/data-explorer/charts/query-results/${this.props.chartId}/?columns=${columns.join(',')}`)
      .then((resp) => resp.json())
      .then((data) => {
        console.log(`Fetched ${data.total_rows} rows in ${data.duration} seconds`);
        const dataSources = { ...this.state.dataSources, ...data.data };
        const newState = {
          dataSources,
          loadingData: false,
          fetchedColumns: [ ...this.state.fetchedColumns, ...columns ],
          editorRevision: this.state.editorRevision + 1,
          layout: this.props.chartData.layout ? this.props.chartData.layout : {},
          frames: this.props.chartData.frames ? this.props.chartData.frames : [],
        };
        if (this.props.chartData.traces) {
          newState.traces = this.props.chartData.traces.map(trace => {
            trace[axisMap[trace.type].x] = dataSources[trace[axisMap[trace.type].xsrc]];
            trace[axisMap[trace.type].y] = dataSources[trace[axisMap[trace.type].ysrc]];
            if (trace.textsrc) trace.text = dataSources[trace.textsrc];
            return trace;
          });
        }
        this.setState(newState)
      }).catch(() => {
        this.setState({
          loadingData: false,
          queryError: 'An error occurred while running your query'
        });
    });
  }

  resetChart = () => {
    const newState = {
      editorRevision: this.state.editorRevision + 1,
      layout: {},
      frames: [],
      traces: [],
    };
    // if (this.props.chartData.traces) {
    //   newState.traces = this.props.chartData.traces.map(trace => {
    //     trace[axisMap[trace.type].x] = this.state.dataSources[trace[axisMap[trace.type].xsrc]];
    //     trace[axisMap[trace.type].y] = this.state.dataSources[trace[axisMap[trace.type].ysrc]];
    //     return trace;
    //   });
    // }
    this.setState(newState)
  }

  onChartUpdate(traces, layout, frames) {
    this.setState({traces, layout, frames});
    // console.log('Anything', anything);
    // const possibleSources = [
    //   ["xsrc", "ysrc"], ["latsrc", "lonsrc"], ["labelssrc", "valuessrc"]
    // ]
    // let requiredCols = []
    // traces.forEach(chart => {
    //   console.log('CHART', chart);
    //   possibleSources.forEach(sources => {
    //     const xsrc = chart[sources[0]];
    //     const ysrc = chart[sources[1]];
    //     if (xsrc != null && ysrc != null) {
    //       if (!this.state.fetchedColumns.includes(xsrc) && !requiredCols.includes(xsrc)) {
    //         requiredCols.push(xsrc);
    //       }
    //       if (!this.state.fetchedColumns.includes(ysrc) && !requiredCols.includes(ysrc)) {
    //         requiredCols.push(ysrc);
    //       }
    //     }
    //   });
    // })
    // if (requiredCols.length > 0) {
    //   this.fetchQueryResults(requiredCols);
    // }
  }

  showStatusModal = () => {
    if (this.state.queryRunning) return <LoadingSpinner message="Running query" />;
    if (this.state.loadingData) return <LoadingSpinner message="Fetching data" />;
    if (this.state.savingChart) return <LoadingSpinner message="Saving chart" />;
    if (this.state.queryError) {
      return <ErrorModal title="Failed to run your query" message={this.state.queryError} />;
    }
    if (this.state.saveError) {
      return <ErrorModal title="Failed to save your chart" message={this.state.saveError} />;
    }
  }

  saveChart = () => {
    /*
     * TODO: Make an api call to save the chart
     */
    console.log('saving chart', this.state.traces);
    const that = this;
    this.setState({ savingChart: true });
    fetch(`/data-explorer/charts/edit/${this.props.chartId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('data_workspace_csrf'),
      },
      body: JSON.stringify({
        config: {
          traces: this.state.traces.map(chart => {
            return {...chart, x: [], y: [], lat: [], lon: [], text: []}
          }),
          layout: this.state.layout,
          frames: this.state.frames,
        }
      }),
    })
    .then(function(resp) {
      that.setState({ savingChart: false });
      if (!resp.ok) {
        that.setState({ saveError: "Error saving your chart, please try again."})
        throw new Error('Failed to save chart');
      }
    })
    .catch((error) => {
      alert('TODO: Save error notification message')
    });
  }

  render() {
    return (
      <div className="app">
        {this.showStatusModal()}
        <div className="govuk-width-container">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-full" id="plotly-editor">
              <PlotlyEditor
                data={this.state.traces}
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
                revision={this.state.editorRevision}
              >
                <DefaultEditor>
                 <Panel group="TODO" name="JSON">
                   <h1>hi</h1>
                 </Panel>
                </DefaultEditor>
              </PlotlyEditor>
              <div className="govuk-grid-row chart-toolbar">
                <div className="govuk-grid-column-one-third">
                  <button className="govuk-button govuk-button--secondary">
                    Back
                  </button>
                </div>
                <div className="govuk-grid-column-two-thirds">
                  <a href={`/data-explorer/charts/delete/${this.props.chartId}`} role="button" draggable="false" className="govuk-button govuk-button--warning">
                    Delete Chart
                  </a>
                  <button className="govuk-button govuk-button--secondary" onClick={() => this.resetChart()}>
                    Reset Chart
                  </button>
                  <button className="govuk-button" onClick={() => this.saveChart()}>
                    Save Chart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
