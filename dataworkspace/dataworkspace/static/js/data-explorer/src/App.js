import React from 'react';

import { Layout, notification } from 'antd';

import './App.css';
import SideBar from "./components/SideBar";
import TabPanel from "./components/TabPanel";
import QueryInput from "./components/QueryInput";
import ResultsPanel from "./components/ResultsPanel";
import { getCookie } from "./utils/common";

const { Content } = Layout;
const QUERY_STATE_RUNNING = 0;
const QUERY_STATE_FAILED = 1;

class App extends React.Component {
  api_base_url = '/data-explorer/api/';

  state = {
    collapsed: false,
    activeTab: "0",
    tabs: [{
      title: 'Query 1',
      content: (
        <QueryInput
          onSubmit={query => this.querySubmit(query)}
          onQuerySave={() => this.onQuerySave()}
          queryName="Query 1"
        />
      ),
      key: "0"
    }],
    numTabs: 1,
    schemaLoaded: false,
    schema: [],
    savedQueriesLoaded: false,
    savedQueries: [],
    queryRunning: false,
    queryLogId: null,
    queryError: null,
  };

  fetchSchemas = () => {
    fetch(this.api_base_url + 'user-schemas')
      .then(response => response.json())
      .then(data => {
        this.setState({
          schema: data,
          schemaLoaded: true,
        })
      })
  }

  fetchSavedQueries = () => {
    fetch(this.api_base_url + 'user-queries')
      .then(response => response.json())
      .then(data => {
        this.setState({
          savedQueries: data,
          savedQueriesLoaded: true,
        })
      })
  }

  onCollapse = collapsed => {
    this.setState({ collapsed });
  };

  addTab = ({id, name, query, description}) => {
    const numTabs = this.state.numTabs + 1;
    const activeTab = String(numTabs);
    const tabs = [...this.state.tabs];
    tabs.push({
      title: typeof name !== 'undefined' ? name : `Query ${numTabs}`,
      content: (
        <QueryInput
          onSubmit={q => this.querySubmit(q)}
          queryId={id}
          queryName={typeof name !== 'undefined' ? name : `Query ${numTabs}`}
          queryDescription={description}
          initialQuery={query}
          onQuerySave={() => this.onQuerySave()}
        />
      ),
      key: activeTab,
    });
    this.setState({
      tabs,
      activeTab,
      numTabs,
    });
  }

  removeTab = targetTab => {
    let activeTab = this.state.activeTab;
    let lastIndex;
    this.state.tabs.forEach((tab, i) => {
      if (tab.key === targetTab) {
        lastIndex = i - 1;
      }
    });
    const tabs = this.state.tabs.filter(tab => tab.key !== targetTab);
    if (tabs.length && activeTab === targetTab) {
      this.setState({ queryLogId: null, queryError: null });
      if (lastIndex >= 0) {
        activeTab = tabs[lastIndex].key;
      }
      else {
        activeTab = tabs[0].key;
      }
    }
    this.setState({
      tabs,
      activeTab,
    });
  };

  changeTab = activeTab => {
    this.setState({ activeTab })
  }

  openSavedQuery = id => {
    this.addTab(this.state.savedQueries.filter(q => q.id === id)[0])
  }

  openTableQuery = (schema, table) => {
    this.addTab({query: `SELECT *\nFROM "${schema}"."${table}"`})
  }

  pollForQueryResults = (queryLogId, errorCallback, successCallback) => {
    fetch(`/data-explorer/api/query-status/${queryLogId}`)
      .then((resp) => resp.json())
      .then((data) => {
        if (data.state === QUERY_STATE_RUNNING) {
          setTimeout(() => {
            this.pollForQueryResults(queryLogId, errorCallback, successCallback)
          }, 1000);
        }
        else if (data.state === QUERY_STATE_FAILED) {
          this.setState({
            queryRunning: false,
            queryLogId: null,
            queryError: data.error,
          });
        }
        else {
          this.setState({ queryRunning: false, queryLogId });
        }
      });
  }

  querySubmit = query => {
    if (!query) {
      notification.error({
        message: 'Invalid SQL',
        description:
          'Please enter a query to view some results.',
      });
      return;
    }
    this.setState({ queryRunning: true, queryLogId: null, queryError: null });

    // Create the "QueryLog"
    fetch('/data-explorer/api/run-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-CSRFToken': getCookie('data_workspace_csrf'),
      },
      body: JSON.stringify({
        query: query
      })
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (typeof data.error !== 'undefined') {
          notification.error({
            message: 'Query failed',
            description: data.error,
          });
          this.setState({ queryRunning: false});
          return;
        }

        // Poll for either success or error for the query
        this.pollForQueryResults(data.query_log_id);
      });
  }

  onQuerySave = () => {
    if (this.state.savedQueriesLoaded) {
      this.setState({
        savedQueriesLoaded: false,
        savedQueries: [],
      });
      this.fetchSavedQueries();
    }
  }

  render() {
    const { collapsed } = this.state;
    return (
      <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
        <SideBar
          collapsed={collapsed}
          onCollapse={this.onCollapse}
          onSchemaOpen={this.fetchSchemas}
          schemaLoaded={this.state.schemaLoaded}
          schema={this.state.schema}
          onSavedQueriesOpen={this.fetchSavedQueries}
          savedQueriesLoaded={this.state.savedQueriesLoaded}
          savedQueries={this.state.savedQueries}
          onSavedQuerySelect={this.openSavedQuery}
          onTableSelect={this.openTableQuery}
        />
        <Layout>
          <Content style={{ margin: '0 0px' }} className="query-pane-layout">
            <div className="flex-wrapper">
              <div className="flex-column">
                <TabPanel
                  activeTab={this.state.activeTab}
                  tabs={this.state.tabs}
                  onChange={this.changeTab}
                  onEdit={(targetKey, action) => this[`${action}Tab`](targetKey)}
                  onQuerySubmit={this.querySubmit}
                />
                <ResultsPanel
                  queryLogId={this.state.queryLogId}
                  queryRunning={this.state.queryRunning}
                  queryError={this.state.queryError}
                />
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default App;
