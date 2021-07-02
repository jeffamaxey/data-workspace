import React from 'react';

import {PageHeader, Button, Space} from 'antd';
import { ShareAltOutlined, PlayCircleFilled, SaveFilled, DeleteFilled } from  '@ant-design/icons';

export default function ToolBar({ onQuerySubmit, queryId }) {
  return (
    <PageHeader
      className="site-page-header"
      title={
        <Space>
          <Button
            key="run"
            type="primary"
            icon={<PlayCircleFilled />}
            onClick={onQuerySubmit}
          >
            Run query
          </Button>
          <Button key="save" icon={<SaveFilled />}>Save query</Button>
          <Button
            key="delete"
            danger
            icon={<DeleteFilled />}
            disabled={typeof queryId === 'undefined'}
          >
            Delete query
          </Button>
        </Space>
      }
      extra={[
        <Button key="share" icon={<ShareAltOutlined />}>Share query</Button>
      ]}
  >
    </PageHeader>
  )
}
