import React, { useState } from "react";

import {PageHeader, Button, Space, Modal, notification} from 'antd';
import { ShareAltOutlined, PlayCircleFilled, SaveFilled, DeleteFilled, ExclamationCircleOutlined } from  '@ant-design/icons';
import UserQueryModal from "./UserQueryModal";
import { getCookie } from "../utils/common";
import ShareQueryModal from "./ShareQueryModal";

const { confirm } = Modal;

export default function ToolBar({ onQuerySubmit, queryId, queryName, queryDescription, query, onQuerySave, onQueryDelete}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const onQuerySaved = savedQuery => {
    setShowSaveModal(false);
    onQuerySave(savedQuery);
  }

  const deleteSavedQuery = () => {
    fetch(`/data-explorer/api/user-queries/${queryId}`, {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-CSRFToken': getCookie('data_workspace_csrf'),
        },
      })
      .then(function(resp) {
        if(resp.ok) return resp;
        notification.error({
          message: 'Error saving query',
          description:
            'An unknown error occurred while trying to save your query.',
        });
        throw new Error('Failed to save query');
      }).then(() => {
        onQueryDelete();
    })
  }
  const showDeleteConfirm = () => {
    confirm({
      title: 'Are you sure you want to delete this saved query?',
      icon: <ExclamationCircleOutlined />,
      content: 'This operation cannot be undone',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        deleteSavedQuery();
      },
    });
  }
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
          <Button
              key="save"
              icon={<SaveFilled />}
              onClick={() => setShowSaveModal(true)}
          >
            Save query
          </Button>
          <Button
            key="delete"
            danger
            icon={<DeleteFilled />}
            disabled={typeof queryId === 'undefined'}
            onClick={() => showDeleteConfirm()}
          >
            Delete query
          </Button>
        </Space>
      }
      extra={[
        <Button
          key="share"
          icon={<ShareAltOutlined />}
          onClick={() => setShowShareModal(true)}
        >
          Share query
        </Button>
      ]}
  >
      <UserQueryModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        queryId={queryId}
        queryName={queryName}
        queryDescription={queryDescription}
        query={query}
        onSaved={savedQuery => onQuerySaved(savedQuery)}
      />

      <ShareQueryModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        query={query}
        onSent={() => {}}
      />
    </PageHeader>
  )
}
