import React from "react";
import { Tabs } from 'antd';

import HeightAdjustablePanel from "../components/HeightAdjustablePanel";

const { TabPane } = Tabs;

export default function TabPanel({ activeTab, tabs, onChange, onEdit }) {
  return (
    <div id="query-pane">
      <HeightAdjustablePanel initialHeight={400} minHeight={150} maxHeight={600} offsetElementId="query-pane">
        <Tabs
          type="editable-card"
          tabPosition="top"
          className="tab-container"
          onChange={onChange}
          activeKey={activeTab}
          onEdit={onEdit}
          style={{ height: '100%' }}
        >
          {tabs.map(tabPane => (
            <TabPane
              tab={tabPane.title}
              key={tabPane.key}
              closable={tabPane.closable}
              style={{ height: '100%' }}
            >
              {tabPane.content}
            </TabPane>
          ))}
        </Tabs>
      </HeightAdjustablePanel>
    </div>
  )
}
