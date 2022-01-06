import React from 'react';
import Plot from 'react-plotly.js';

import {getCookie} from "../chart-builder/utils/common";
import {axisMap} from "../chart-builder/constants";

class App extends React.Component {
  api_base_url = '/data-explorer/api/';
  constructor(props) {
    super(props);
    this.state = {
      loadingData: true,
      dataSources: {},
      dataSourceOptions: [],
      traces: [],
      layout: {},
      frames: [],
      fetchedColumns: [],
    }
  }

  componentDidMount() {
    this.fetchQueryResults();
  }

  fetchQueryResults = () => {
    fetch(`/datasets/${this.props.datasetId}/chart/${this.props.chartId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('data_workspace_csrf'),
      },
    })
      .then((resp) => resp.json())
      .then((data) => {
        const dataSources = { ...this.state.dataSources, ...data.data };
        const newState = {
          dataSources,
          loadingData: false,
          layout: this.props.chartData.layout ? this.props.chartData.layout : {},
          frames: this.props.chartData.frames ? this.props.chartData.frames : [],
          dataSourceOptions: Object.keys(data.data).map(name => ({
            value: name,
            label: name,
          }))
        };
        if (this.props.chartData.traces) {
          newState.traces = this.props.chartData.traces.map(trace => {
            trace[axisMap[trace.type].x] = dataSources[trace[axisMap[trace.type].xsrc]];
            trace[axisMap[trace.type].y] = dataSources[trace[axisMap[trace.type].ysrc]];
            if (trace.textsrc) trace.text = dataSources[trace.textsrc];
            return trace;
          });
        }
        console.log('STATE', newState)
        this.setState(newState)
      }).catch((err) => {
        console.log('ERROR', err)
        this.setState({
          loadingData: false,
          queryError: 'An error occurred while fetching data for the chart'
        });
    });
  }

  render() {
    return (
      <div className="app">
        {this.state.loadingData ? <h1>loading...</h1> :
           <Plot
              data={this.state.traces}
              layout={this.state.layout}
              frames={this.state.frames}
              dataSources={this.state.dataSources}
              useResizeHandler
              style={{width: '100%', height: '100%'}}
              divId="embedded-chart"
            />
        }
        </div>
    );
  }
}

export default App;
