import walkObject from './walkObject';

const SRC_ATTR_PATTERN = /src$/;

function maybeTransposeData(data, srcAttributePath, traceType) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const isTransposable2DArray =
    srcAttributePath.endsWith('zsrc') &&
    ['contour', 'contourgl', 'heatmap', 'heatmapgl', 'surface', 'carpet', 'contourcarpet'].includes(
      traceType
    );

  if (isTransposable2DArray) {
    return transpose(data);
  }

  if (
    specialTableCase(traceType, srcAttributePath) &&
    Array.isArray(data[0]) &&
    data.length === 1
  ) {
    return data[0];
  }

  return data;
}

export function getColumnNames(srcArray, dataSourceOptions) {
  return srcArray
    .map((src) => {
      const columns = dataSourceOptions.filter((dso) => dso.value === src);
      if (columns.length === 1) {
        return columns[0].columnName || columns[0].label;
      }
      return '';
    })
    .join(' - ');
}

export default function dereference(
  container,
  dataSources,
  config = {deleteKeys: false},
  dataSourceOptions = null
) {
  const containerIsData = Array.isArray(container);

  const replacer = (key, parent, srcPath) => {
    if (!SRC_ATTR_PATTERN.test(key)) {
      return;
    }

    const dataKey = key.replace(SRC_ATTR_PATTERN, '');

    let srcRef = config.toSrc ? config.toSrc(parent[key]) : parent[key];

    // making this into an array to more easily lookup 1d and 2d srcs in dataSourceOptions
    if (!Array.isArray(srcRef)) {
      srcRef = [srcRef];
    }

    let dereferencedData = srcRef.map((ref) => {
      if (config.deleteKeys && !(ref in dataSources)) {
        delete parent[dataKey];
      }
      return dataSources[ref];
    });

    // remove extra data wrapping
    if (srcRef.length === 1) {
      dereferencedData = dereferencedData[0];
    }

    if (!Array.isArray(dereferencedData)) {
      return;
    }

    if (containerIsData) {
      if (parent.type !== null) {
        // we're at the top level of the trace
        if (dataSourceOptions !== null) {
          parent.meta = parent.meta || {};
          parent.meta.columnNames = parent.meta.columnNames || {};
          parent.meta.columnNames[dataKey] = getColumnNames(srcRef, dataSourceOptions);
        }
        parent[dataKey] = maybeTransposeData(dereferencedData, srcPath, parent.type);
      } else {
        parent[dataKey] = dereferencedData;
      }
    } else {
      // container is layout
      parent[dataKey] = dereferencedData;
    }
  };

  if (containerIsData) {
    walkObject(container, replacer, {
      walkArraysMatchingKeys: ['data', 'transforms'],
      pathType: 'nestedProperty',
    });
  } else {
    // container is layout
    walkObject(container, replacer, {pathType: 'nestedProperty'});
  }
}
