export const availableCharts = {
  traces: _ => [
    {
      value: 'scatter',
      icon: 'scatter',
      label: 'Scatter',
    }, {
      value: 'line',
      label: 'Line',
    }, {
      value: 'area',
      label: 'Area',
    }, {
      value: 'bar',
      label: 'Bar',
    }, {
      value: 'pie',
      label: 'Pie',
    }, {
      value: 'scattermapbox',
      label: 'Map',
    },
  ],
  complex: true,
}

export const queryStates = {
  running: 0,
  failed: 1,
  complete: 2,
}
